import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns, leads } from '@/lib/db/schema';
import { and, eq, lte, gte, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import crypto from 'crypto';

type CampaignRecord = typeof campaigns.$inferSelect;
type TransactionClient = Parameters<Parameters<typeof db.transaction>[0]>[0];

interface ActivationResult {
  campaignId: string;
  campaignName: string;
  success: boolean;
  enrolledCount?: number;
  error?: string;
}

/**
 * GET /api/cron/activate-scheduled-campaigns
 *
 * Cron job to activate scheduled custom campaigns
 * Runs every 5 minutes to check for campaigns that should start
 *
 * SECURITY: Requires CRON_SECRET env var to prevent unauthorized access
 *
 * Flow:
 * 1. Find campaigns with enrollment_status='scheduled' and start_datetime <= NOW
 * 2. For each campaign:
 *    - Filter leads by target_tags and other criteria
 *    - Enroll leads with transaction locks
 *    - Update campaign status to 'active'
 * 3. Return summary of activated campaigns
 *
 * Schedule: Every 5 minutes (via Vercel Cron or n8n webhook)
 */

export async function GET(request: NextRequest) {
  try {
    // BUG #12 FIX: Use constant-time comparison for cron secret to prevent timing attacks
    // Timing attacks measure response time to brute-force secrets character by character
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || !authHeader) {
      console.error('❌ Unauthorized cron request - missing credentials');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract token from "Bearer <token>" format
    const providedToken = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    // Convert to buffers for timing-safe comparison
    // Both buffers must be same length for timingSafeEqual
    const expectedBuffer = Buffer.from(cronSecret, 'utf-8');
    const providedBuffer = Buffer.from(providedToken, 'utf-8');

    // Early return if lengths don't match (still constant time within this check)
    if (expectedBuffer.length !== providedBuffer.length) {
      console.error('❌ Unauthorized cron request - invalid token format');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Constant-time comparison prevents timing attacks
    const isValid = crypto.timingSafeEqual(expectedBuffer, providedBuffer);

    if (!isValid) {
      console.error('❌ Unauthorized cron request - invalid token');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    // BUG #13 FIX: Prevent activation of expired/stale campaigns
    // If a campaign is more than 30 days past its scheduled start, skip it
    // This prevents accidentally activating very old scheduled campaigns
    const EXPIRY_DAYS = 30;
    const expiryThreshold = new Date(now);
    expiryThreshold.setDate(expiryThreshold.getDate() - EXPIRY_DAYS);

    console.log(`🔄 [Cron] Checking for scheduled campaigns to activate (${now.toISOString()})`);
    console.log(`   Expiry threshold: ${expiryThreshold.toISOString()} (campaigns older than ${EXPIRY_DAYS} days will be skipped)`);

    // Find campaigns ready to activate
    const scheduledCampaigns = await db.query.campaigns.findMany({
      where: and(
        eq(campaigns.enrollmentStatus, 'scheduled'),
        lte(campaigns.startDatetime, now),
        // BUG #13 FIX: Only activate campaigns scheduled within the last 30 days
        gte(campaigns.startDatetime, expiryThreshold)
      ),
    });

    if (scheduledCampaigns.length === 0) {
      console.log('✅ [Cron] No scheduled campaigns ready to activate');
      return NextResponse.json({
        message: 'No campaigns to activate',
        activatedCount: 0,
      });
    }

    console.log(`📋 [Cron] Found ${scheduledCampaigns.length} campaign(s) to activate`);

    // BUG #1 FIX: Sort campaigns by creation time for deterministic activation order
    // This ensures consistent behavior when multiple campaigns target overlapping leads
    const sortedCampaigns = scheduledCampaigns.sort((a, b) =>
      a.createdAt.getTime() - b.createdAt.getTime()
    );

    const results: ActivationResult[] = [];

    // Activate each campaign with campaign-level locking
    for (const campaign of sortedCampaigns) {
      try {
        // BUG #1 FIX: Acquire campaign-level advisory lock to prevent concurrent activation
        // This prevents race conditions when the same campaign is picked up by multiple cron instances
        // BUG #6 FIX: Use dual-key lock for 64-bit keyspace
        const [campaignLockKey1, campaignLockKey2] = hashToDualKey(
          `campaign-activation-${campaign.id}`
        );

        const activationResult = await db.transaction(async (tx: TransactionClient) => {
          const lockResult = await tx.execute(
            sql`SELECT pg_try_advisory_xact_lock(${campaignLockKey1}, ${campaignLockKey2}) as acquired`
          );

          const lockRow = Array.isArray(lockResult)
            ? (lockResult[0] as { acquired?: boolean } | undefined)
            : (lockResult as { rows?: Array<{ acquired?: boolean }> }).rows?.[0];
          if (!lockRow?.acquired) {
            console.warn(`⚠️ [Cron] Campaign ${campaign.id} already being activated by another process`);
            return null; // Skip this campaign
          }

          // Lock acquired, proceed with activation
          return await activateCampaign(campaign);
        });

        if (activationResult) {
          results.push(activationResult);
          console.log(`✅ [Cron] Activated campaign "${campaign.name}" (${campaign.id}) - ${activationResult.enrolledCount} leads enrolled`);
        }
      } catch (error) {
        console.error(`❌ [Cron] Failed to activate campaign "${campaign.name}" (${campaign.id}):`, error);
        results.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          success: false,
          error: String(error),
        });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      message: `Activated ${successCount} of ${scheduledCampaigns.length} campaigns`,
      results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('❌ [Cron] Error activating scheduled campaigns:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Activate a single campaign by enrolling leads
 */
async function activateCampaign(campaign: CampaignRecord): Promise<ActivationResult> {
  return await db.transaction(async (tx) => {
    // SECURITY: Set SERIALIZABLE isolation to prevent phantom reads
    // This ensures no other transaction can modify leads between our
    // eligibility check and enrollment
    await tx.execute(sql`SET TRANSACTION ISOLATION LEVEL SERIALIZABLE`);

    // Build lead filtering conditions from campaign
    const conditions: SQL[] = [
      eq(leads.clientId, campaign.clientId),
      eq(leads.isActive, true),
      // SECURITY: Array overlap operator for tag matching
      // - leads.kajabiTags is a column reference (not user input)
      // - campaign.targetTags from database (validated on insert by Zod)
      // - Drizzle's sql template properly parameterizes all interpolated values
      // - PostgreSQL && operator checks if arrays have any elements in common
      sql`${leads.kajabiTags} && ${campaign.targetTags}`,
      eq(leads.smsSequencePosition, 0), // Not in another campaign
      eq(leads.smsStop, false),
      eq(leads.booked, false),
    ];

    // Fetch matching leads
    let matchingLeads = await tx.query.leads.findMany({
      where: and(...conditions),
      columns: {
        id: true,
      },
    });

    // Apply max leads cap if specified
    if (campaign.maxLeadsToEnroll && matchingLeads.length > campaign.maxLeadsToEnroll) {
      matchingLeads = matchingLeads.slice(0, campaign.maxLeadsToEnroll);
    }

    // PERFORMANCE: Cap synchronous enrollment to prevent timeout
    // Cron jobs have longer timeout (5min) but still need protection
    const MAX_SYNC_ENROLL = 4000; // Higher limit for cron vs API endpoint
    let cappedLeads = matchingLeads;

    if (matchingLeads.length > MAX_SYNC_ENROLL) {
      console.warn(`⚠️ [Cron] Campaign "${campaign.name}" has ${matchingLeads.length} matching leads, capping to ${MAX_SYNC_ENROLL} to prevent timeout`);
      cappedLeads = matchingLeads.slice(0, MAX_SYNC_ENROLL);
    }

    // Enroll leads with advisory locks
    // PHASE 2: Pass campaign version and name for message snapshotting
    // AUDIT FIX: Pass campaign messages for message count snapshotting
    const enrolledCount = await enrollLeadsWithLocks(
      tx,
      cappedLeads.map(l => l.id),
      campaign.id,
      campaign.clientId,
      campaign.version || 1, // Use default 1 if not set (backward compatibility)
      campaign.name,
      Array.isArray(campaign.messages) ? campaign.messages : [] // AUDIT FIX: Pass messages for count snapshot
    );

    // BUG #8 FIX: Verify actual enrollment count from database
    // This ensures counter accuracy even if loop was interrupted or had errors
    // Database is source of truth, not the loop counter
    const verifiedCountResult = await tx
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(eq(leads.campaignId, campaign.id));

    const verifiedEnrolledCount = Number(verifiedCountResult[0]?.count || 0);

    // Log discrepancy if loop counter doesn't match database
    if (verifiedEnrolledCount !== enrolledCount) {
      console.warn(
        `⚠️ [Cron] Enrollment count mismatch for campaign ${campaign.id}: ` +
        `loop returned ${enrolledCount}, database shows ${verifiedEnrolledCount}. ` +
        `Using database count as source of truth.`
      );
    }

    // Update campaign status with VERIFIED enrollment count
    await tx.update(campaigns)
      .set({
        enrollmentStatus: 'active',
        leadsEnrolled: verifiedEnrolledCount,
        totalLeads: verifiedEnrolledCount,
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, campaign.id));

    return {
      campaignId: campaign.id,
      campaignName: campaign.name,
      success: true,
      enrolledCount: verifiedEnrolledCount,
    };
  });
}

/**
 * Validate UUID format
 * BUG #3 FIX: Prevent invalid UUIDs from silently failing enrollment
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Enroll leads with PostgreSQL advisory locks
 * Prevents race conditions between concurrent campaign activations
 *
 * PHASE 2: Now includes message snapshotting - captures campaign version and name
 * at enrollment time to ensure leads complete their enrolled sequence even if
 * the campaign is upgraded mid-sequence.
 *
 * AUDIT FIX: Now captures message count for version-aware de-enrollment
 */
async function enrollLeadsWithLocks(
  tx: TransactionClient,
  leadIds: string[],
  campaignId: string,
  clientId: string,
  campaignVersion: number,
  campaignName: string,
  campaignMessages: unknown[]
): Promise<number> {
  let enrolledCount = 0;

  // BUG #3 FIX: Validate all UUIDs before processing
  const validLeadIds = leadIds.filter(leadId => {
    if (!isValidUUID(leadId)) {
      console.error(`❌ [Cron] Invalid UUID format for lead ID: ${leadId} - skipping enrollment`);
      return false;
    }
    return true;
  });

  if (validLeadIds.length < leadIds.length) {
    console.warn(`⚠️ [Cron] Filtered out ${leadIds.length - validLeadIds.length} invalid lead IDs`);
  }

  // PERFORMANCE: Track execution time to prevent timeout
  // Cron jobs on Vercel Pro have 5min timeout, but leave buffer for multiple campaigns
  const startTime = Date.now();
  const MAX_EXECUTION_TIME_MS = 240 * 1000; // 4 minutes per campaign

  for (const leadId of validLeadIds) {
    try {
      // Check for timeout every 100 leads
      if (enrolledCount % 100 === 0) {
        const elapsed = Date.now() - startTime;
        if (elapsed > MAX_EXECUTION_TIME_MS) {
          console.warn(`⚠️ [Cron] Enrollment timeout approaching (${elapsed}ms), stopping at ${enrolledCount}/${leadIds.length} leads`);
          break;
        }
      }

      // BUG #6 FIX: Generate dual-key lock from clientId + leadId hash
      // Using 64-bit keyspace to prevent birthday paradox collisions at scale
      const [lockKey1, lockKey2] = hashToDualKey(`${clientId}-${leadId}`);

      // Acquire dual-key advisory lock (non-blocking)
      const lockResult = await tx.execute(
        sql`SELECT pg_try_advisory_xact_lock(${lockKey1}, ${lockKey2}) as acquired`
      );

      const acquired = Array.isArray(lockResult)
        ? (lockResult[0] as { acquired?: boolean } | undefined)?.acquired
        : (lockResult as { rows?: Array<{ acquired?: boolean }> }).rows?.[0]?.acquired;

      if (!acquired) {
        console.warn(`⚠️ [Cron] Skipping lead ${leadId} - already being enrolled`);
        continue;
      }

      // Verify lead is still eligible
      const lead = await tx.query.leads.findFirst({
        where: and(
          eq(leads.id, leadId),
          eq(leads.smsSequencePosition, 0),
          eq(leads.smsStop, false),
          eq(leads.isActive, true)
        ),
      });

      if (!lead) {
        console.warn(`⚠️ [Cron] Skipping lead ${leadId} - no longer eligible`);
        continue;
      }

      // Enroll lead with message snapshotting
      const enrollmentTimestamp = new Date();
      const messageCount = Array.isArray(campaignMessages) ? campaignMessages.length : 0;
      const initialHistoryEntry = {
        campaignId,
        campaignName,
        enrolledAt: enrollmentTimestamp.toISOString(),
        messagesReceived: 0,
        enrolledVersion: campaignVersion,
      };

      await tx.update(leads)
        .set({
          campaignId: campaignId,
          enrolledCampaignVersion: campaignVersion, // PHASE 2: Snapshot version at enrollment
          enrolledMessageCount: messageCount, // AUDIT FIX: Snapshot message count at enrollment
          enrolledAt: enrollmentTimestamp, // PHASE 1 FIX: Track enrollment timestamp (migration 0029)
          campaignHistory: [initialHistoryEntry], // PHASE 2: Initialize history
          smsSequencePosition: 0,
          smsLastSentAt: null,
          updatedAt: enrollmentTimestamp,
        })
        .where(eq(leads.id, leadId));

      enrolledCount++;
    } catch (error) {
      console.error(`❌ [Cron] Error enrolling lead ${leadId}:`, error);
    }
  }

  return enrolledCount;
}

/**
 * Hash string to dual 32-bit integers for PostgreSQL dual-key advisory lock
 * BUG #6 FIX: Use 64-bit keyspace to prevent birthday paradox collisions at scale
 *
 * SECURITY: Uses SHA256 and takes first 8 bytes (2 int32 keys) for 64-bit keyspace.
 * This reduces collision probability from ~0.1% at 1M leads (32-bit) to negligible (64-bit).
 *
 * PostgreSQL supports dual-key advisory locks: pg_try_advisory_xact_lock(key1, key2)
 *
 * @returns [key1, key2] - Two signed 32-bit integers for dual-key lock
 */
function hashToDualKey(str: string): [number, number] {
  const hash = crypto.createHash('sha256').update(str).digest();
  // Read first 4 bytes as key1, next 4 bytes as key2 (big-endian)
  const key1 = hash.readInt32BE(0);
  const key2 = hash.readInt32BE(4);
  return [key1, key2];
}
