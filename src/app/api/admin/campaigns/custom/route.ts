import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { campaigns, leads, airtableSyncQueue } from '@/lib/db/schema';
import { and, eq, gte, lte, sql, inArray } from 'drizzle-orm';
import { z } from 'zod';
import crypto from 'crypto';
import { buildLeadFilterConditions } from '@/lib/utils/campaign-filters';

/**
 * POST /api/admin/campaigns/custom
 *
 * Create a new custom tag-based SMS campaign with lead enrollment
 *
 * Body: CreateCustomCampaignInput (see schema below)
 *
 * Flow:
 * 1. Validate input
 * 2. Create campaign record
 * 3. Filter leads by tags + additional criteria
 * 4. Enroll leads with transaction locks (prevent race conditions)
 * 5. Queue to Airtable sync
 * 6. Return created campaign + enrollment stats
 *
 * CRITICAL: Uses PostgreSQL advisory locks to prevent concurrent enrollments
 */

// BUG #9 FIX: Add maximum delay constraint to prevent unreasonable values
// Max 30 days = 43200 minutes (reasonable SMS nurture cadence)
const MAX_DELAY_MINUTES = 30 * 24 * 60; // 30 days

const messageSchema = z.object({
  step: z.number().int().positive(),
  delayMinutes: z.number().int().nonnegative().max(
    MAX_DELAY_MINUTES,
    `Message delay cannot exceed ${MAX_DELAY_MINUTES} minutes (30 days). Consider breaking into multiple campaigns for longer sequences.`
  ),
  text: z.string().min(1).max(1600), // SMS limit
});

const createCustomCampaignSchema = z.object({
  clientId: z.string().uuid('Valid client ID required'),
  name: z.string().min(1, 'Campaign name is required').max(255),

  // Targeting filters
  targetTags: z.array(z.string()).min(1, 'At least one tag required').max(10),
  createdAfter: z.string().datetime().optional().nullable(),
  createdBefore: z.string().datetime().optional().nullable(),
  minIcpScore: z.number().min(0).max(100).optional().nullable(),
  maxIcpScore: z.number().min(0).max(100).optional().nullable(),
  // VALIDATION: Ensure empty array is rejected (would cause invalid SQL: WHERE engagement_level IN ())
  engagementLevels: z.array(z.enum(['High', 'Medium', 'Low']))
    .min(1, 'Select at least one engagement level if filtering by engagement')
    .optional()
    .nullable(),

  // Message sequence (1-3 messages)
  messages: z.array(messageSchema).min(1).max(3)
    .refine((messages) => {
      // VALIDATION: Ensure steps are sequential starting from 1
      // Without this, [step 1, step 3] would pass but break the scheduler
      const steps = messages.map(m => m.step).sort((a, b) => a - b);
      for (let i = 0; i < steps.length; i++) {
        if (steps[i] !== i + 1) {
          return false; // Step sequence broken
        }
      }
      return true;
    }, {
      message: 'Message steps must be sequential starting from 1 (e.g., 1, 2, 3). No gaps allowed.'
    })
    .refine((messages) => {
      // VALIDATION: Ensure no duplicate steps
      const steps = messages.map(m => m.step);
      const uniqueSteps = new Set(steps);
      return steps.length === uniqueSteps.size;
    }, {
      message: 'Each message must have a unique step number. Duplicate steps are not allowed.'
    }),

  // Campaign settings
  isPaused: z.boolean().default(false),
  startDatetime: z.string().datetime().optional().nullable(),
  maxLeadsToEnroll: z.number().int().positive().optional().nullable(),

  // Exclusions
  excludeBooked: z.boolean().default(true),
  excludeSmsStop: z.boolean().default(true),
  excludeInActiveCampaign: z.boolean().default(true),
}).refine((data) => {
  // BUG #5 FIX: Validate ICP score range
  // Ensure minIcpScore is not greater than maxIcpScore
  if (
    data.minIcpScore !== null &&
    data.minIcpScore !== undefined &&
    data.maxIcpScore !== null &&
    data.maxIcpScore !== undefined
  ) {
    return data.minIcpScore <= data.maxIcpScore;
  }
  return true; // If either is null/undefined, skip validation
}, {
  message: 'minIcpScore must be less than or equal to maxIcpScore',
  path: ['minIcpScore'], // Error will be attached to minIcpScore field
}).refine((data) => {
  // BUG #10 FIX: Validate date range
  // Ensure createdAfter is not later than createdBefore
  if (data.createdAfter && data.createdBefore) {
    const afterDate = new Date(data.createdAfter);
    const beforeDate = new Date(data.createdBefore);
    return afterDate <= beforeDate;
  }
  return true; // If either is missing, skip validation
}, {
  message: 'createdAfter date must be earlier than or equal to createdBefore date',
  path: ['createdAfter'], // Error will be attached to createdAfter field
});

type CreateCustomCampaignInput = z.infer<typeof createCustomCampaignSchema>;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Authorization check
    if (!['SUPER_ADMIN', 'ADMIN', 'CLIENT_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // SECURITY: Force clientId IMMEDIATELY for non-SUPER_ADMIN users
    // This prevents any potential timing attacks or validation bypasses
    if (session.user.role !== 'SUPER_ADMIN') {
      body.clientId = session.user.clientId;
      // Make clientId immutable to prevent any further modification attempts
      Object.defineProperty(body, 'clientId', {
        value: session.user.clientId,
        writable: false,
        configurable: false,
      });
    }

    // Validate input
    const validation = createCustomCampaignSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Validate scheduled campaign
    if (data.startDatetime && !data.isPaused) {
      const startDate = new Date(data.startDatetime);
      if (startDate < new Date()) {
        return NextResponse.json(
          { error: 'Start datetime must be in the future for active campaigns' },
          { status: 400 }
        );
      }
    }

    // VALIDATION: Check for duplicate campaign name
    // Prevents UX confusion and makes debugging easier
    const existingCampaign = await db.query.campaigns.findFirst({
      where: and(
        eq(campaigns.clientId, data.clientId),
        eq(campaigns.name, data.name)
      ),
    });

    if (existingCampaign) {
      return NextResponse.json(
        {
          error: 'Campaign name already exists',
          details: `A campaign named "${data.name}" already exists for this client. Please choose a unique name.`
        },
        { status: 409 } // 409 Conflict
      );
    }

    // Determine enrollment status
    const enrollmentStatus = (() => {
      if (data.isPaused) return 'paused';
      if (data.startDatetime && new Date(data.startDatetime) > new Date()) {
        return 'scheduled';
      }
      return 'active';
    })();

    // BUG #15 FIX: Use shared filter utility to ensure consistency
    // with preview endpoint (prevents preview/enrollment mismatches)
    const conditions = buildLeadFilterConditions({
      clientId: data.clientId,
      targetTags: data.targetTags,
      createdAfter: data.createdAfter,
      createdBefore: data.createdBefore,
      minIcpScore: data.minIcpScore,
      maxIcpScore: data.maxIcpScore,
      engagementLevels: data.engagementLevels,
      excludeBooked: data.excludeBooked,
      excludeSmsStop: data.excludeSmsStop,
      excludeInActiveCampaign: data.excludeInActiveCampaign,
    });

    // TRANSACTION: Create campaign + enroll leads atomically with advisory locks
    const result = await db.transaction(async (tx) => {
      // SECURITY: Set SERIALIZABLE isolation to prevent phantom reads
      // This ensures no other transaction can modify leads between our
      // eligibility check and enrollment
      await tx.execute(sql`SET TRANSACTION ISOLATION LEVEL SERIALIZABLE`);

      // Create campaign
      const newCampaign = await tx.insert(campaigns).values({
        clientId: data.clientId,
        name: data.name,
        campaignType: 'Custom',
        targetTags: data.targetTags,
        messages: data.messages,
        isPaused: data.isPaused,
        startDatetime: data.startDatetime ? new Date(data.startDatetime) : null,
        enrollmentStatus,
        maxLeadsToEnroll: data.maxLeadsToEnroll || null,
        leadsEnrolled: 0,
        messagesSent: 0,
        totalLeads: 0,
        airtableRecordId: '', // Will be filled by sync
      }).returning();

      const campaign = newCampaign[0];

      // Only enroll leads if campaign is active (not paused, not scheduled)
      if (enrollmentStatus === 'active') {
        // Fetch matching leads
        let matchingLeads = await tx.query.leads.findMany({
          where: and(...conditions),
          columns: {
            id: true,
            airtableRecordId: true,
          },
        });

        // Apply max leads cap if specified
        if (data.maxLeadsToEnroll && matchingLeads.length > data.maxLeadsToEnroll) {
          matchingLeads = matchingLeads.slice(0, data.maxLeadsToEnroll);
        }

        // PERFORMANCE: Cap synchronous enrollment to prevent timeout
        // Vercel has 60s timeout, ~50ms per lead = max ~1000 leads safely
        const MAX_SYNC_ENROLL = 1000;
        let cappedLeads = matchingLeads;
        let wasCappped = false;

        if (matchingLeads.length > MAX_SYNC_ENROLL) {
          console.warn(`⚠️ Campaign "${data.name}" has ${matchingLeads.length} matching leads, capping to ${MAX_SYNC_ENROLL} to prevent timeout`);
          cappedLeads = matchingLeads.slice(0, MAX_SYNC_ENROLL);
          wasCappped = true;
        }

        // CRITICAL: Acquire advisory lock per lead to prevent race conditions
        // Lock key = hash(clientId + leadId) to ensure uniqueness
        // PHASE 2: Pass campaign version and name for message snapshotting
        // AUDIT FIX: Pass campaign messages for message count snapshotting
        const enrolledCount = await enrollLeadsWithLocks(
          tx,
          cappedLeads.map(l => l.id),
          campaign.id,
          data.clientId,
          campaign.version || 1, // Use default 1 if not set (backward compatibility)
          campaign.name,
          campaign.messages || []
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
            `⚠️ Enrollment count mismatch for campaign ${campaign.id}: ` +
            `loop returned ${enrolledCount}, database shows ${verifiedEnrolledCount}. ` +
            `Using database count as source of truth.`
          );
        }

        // BUG #2 FIX: Detect if enrollment was partial (timeout or cap)
        const enrollmentTimedOut = verifiedEnrolledCount < cappedLeads.length;
        const partialEnrollment = wasCappped || enrollmentTimedOut;

        // Update campaign with VERIFIED enrollment count
        await tx.update(campaigns)
          .set({
            leadsEnrolled: verifiedEnrolledCount,
            totalLeads: matchingLeads.length, // Total matching, not just enrolled
          })
          .where(eq(campaigns.id, campaign.id));

        campaign.leadsEnrolled = verifiedEnrolledCount;
        campaign.totalLeads = matchingLeads.length;

        // Store partial enrollment data for response
        (campaign as any).partialEnrollment = partialEnrollment;
        (campaign as any).totalMatchingLeads = matchingLeads.length;
        (campaign as any).wasCappped = wasCappped;
        (campaign as any).enrollmentTimedOut = enrollmentTimedOut;
      }

      return campaign;
    });

    // BUG #4 FIX: Queue to Airtable sync OUTSIDE transaction
    // This prevents loss of sync record if transaction rolls back due to
    // serialization error, timeout, or other failure
    // Use separate transaction for idempotency
    try {
      await db.insert(airtableSyncQueue).values({
        clientId: data.clientId,
        tableName: 'Campaigns',
        recordId: result.id,
        operation: 'create',
        payload: {
          'Campaign Name': result.name,
          'Campaign Type': 'Custom',
          'Active': !result.isPaused,
          'Version': result.version || 1, // AUDIT FIX: Sync version on create
          'Target Tags': data.targetTags.join(', '),
          'Messages': JSON.stringify(data.messages),
          'Start Datetime': result.startDatetime?.toISOString(),
          'Enrollment Status': enrollmentStatus,
        },
        status: 'pending',
      });
      console.log(`✅ Queued campaign "${result.name}" for Airtable sync`);
    } catch (syncError) {
      // Non-blocking: Log error but don't fail the request
      // The sync queue has retry logic and can be manually re-queued
      console.error(`⚠️ Failed to queue Airtable sync for campaign ${result.id}:`, syncError);
    }

    console.log(`✅ Created custom campaign "${result.name}" (${result.id})`);
    console.log(`   Enrolled ${result.leadsEnrolled} leads`);

    // BUG #2 FIX: Build response with partial enrollment warning if applicable
    const partialEnrollment = (result as any).partialEnrollment;
    const totalMatchingLeads = (result as any).totalMatchingLeads;
    const wasCappped = (result as any).wasCappped;
    const enrollmentTimedOut = (result as any).enrollmentTimedOut;

    const responsePayload: any = {
      campaign: result,
      message: enrollmentStatus === 'scheduled'
        ? `Campaign scheduled for ${data.startDatetime}. Leads will be enrolled automatically.`
        : enrollmentStatus === 'paused'
        ? 'Campaign created in paused state. Activate to start enrollment.'
        : `Campaign created and ${result.leadsEnrolled} leads enrolled.`,
    };

    // Add warning for partial enrollment
    if (partialEnrollment && enrollmentStatus === 'active') {
      const remaining = totalMatchingLeads - (result.leadsEnrolled || 0);
      responsePayload.warning = {
        totalMatching: totalMatchingLeads,
        enrolled: result.leadsEnrolled || 0,
        remaining,
        reason: wasCappped ? 'enrollment_cap' : 'timeout',
        message: wasCappped
          ? `⚠️ PARTIAL ENROLLMENT: Only ${result.leadsEnrolled} of ${totalMatchingLeads} matching leads were enrolled due to safety cap (max 1,000 per request). ${remaining} leads remain unprocessed. Consider creating additional campaigns or contact support for bulk enrollment.`
          : `⚠️ PARTIAL ENROLLMENT: Only ${result.leadsEnrolled} of ${totalMatchingLeads} matching leads were enrolled before request timeout (50s limit). ${remaining} leads remain unprocessed. Consider creating additional campaigns or contact support for bulk enrollment.`,
      };
      console.warn(`⚠️ Partial enrollment detected: ${result.leadsEnrolled}/${totalMatchingLeads} leads enrolled`);
    }

    return NextResponse.json(responsePayload, { status: 201 });

  } catch (error: any) {
    console.error('Error creating custom campaign:', error);

    // BUG #18 FIX: Handle unique constraint violation
    // PostgreSQL error code 23505 = unique_violation
    // This happens if two requests create campaigns with the same name simultaneously
    if (error?.code === '23505' && error?.constraint?.includes('campaigns_client_name')) {
      return NextResponse.json(
        {
          error: 'Campaign name already exists',
          details: `A campaign with this name already exists for this client. Please choose a unique name.`,
        },
        { status: 409 } // 409 Conflict
      );
    }

    // Return generic error for all other failures
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
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
 * Enroll leads in campaign with PostgreSQL advisory locks
 * Prevents race condition where multiple campaigns enroll same lead simultaneously
 *
 * CRITICAL: Advisory locks ensure atomicity per lead across concurrent transactions
 *
 * PHASE 2: Now includes message snapshotting - captures campaign version and name
 * at enrollment time to ensure leads complete their enrolled sequence even if
 * the campaign is upgraded mid-sequence.
 *
 * AUDIT FIX: Now captures message count for version-aware de-enrollment
 *
 * @returns Number of successfully enrolled leads
 */
async function enrollLeadsWithLocks(
  tx: any,
  leadIds: string[],
  campaignId: string,
  clientId: string,
  campaignVersion: number,
  campaignName: string,
  campaignMessages: any[]
): Promise<number> {
  let enrolledCount = 0;

  // BUG #3 FIX: Validate all UUIDs before processing
  const validLeadIds = leadIds.filter(leadId => {
    if (!isValidUUID(leadId)) {
      console.error(`❌ Invalid UUID format for lead ID: ${leadId} - skipping enrollment`);
      return false;
    }
    return true;
  });

  if (validLeadIds.length < leadIds.length) {
    console.warn(`⚠️ Filtered out ${leadIds.length - validLeadIds.length} invalid lead IDs`);
  }

  // PERFORMANCE: Track execution time to prevent timeout
  // Vercel has 60s timeout, leave 10s buffer for transaction commit
  const startTime = Date.now();
  const MAX_EXECUTION_TIME_MS = 50 * 1000; // 50 seconds

  for (const leadId of validLeadIds) {
    try {
      // Check for timeout every 100 leads
      if (enrolledCount % 100 === 0) {
        const elapsed = Date.now() - startTime;
        if (elapsed > MAX_EXECUTION_TIME_MS) {
          console.warn(`⚠️ Enrollment timeout approaching (${elapsed}ms), stopping at ${enrolledCount}/${leadIds.length} leads`);
          break;
        }
      }

      // BUG #6 FIX: Generate dual-key lock from clientId + leadId hash
      // This ensures locks are unique per client and don't conflict across clients
      // Using 64-bit keyspace to prevent birthday paradox collisions at scale
      const [lockKey1, lockKey2] = hashToDualKey(`${clientId}-${leadId}`);

      // Acquire dual-key advisory lock (non-blocking, returns false if already locked)
      const lockResult = await tx.execute(
        sql`SELECT pg_try_advisory_xact_lock(${lockKey1}, ${lockKey2}) as acquired`
      );

      const acquired = lockResult.rows[0]?.acquired;

      if (!acquired) {
        console.warn(`⚠️ Skipping lead ${leadId} - already being enrolled by another campaign`);
        continue;
      }

      // Lock acquired - check lead is still eligible
      const lead = await tx.query.leads.findFirst({
        where: and(
          eq(leads.id, leadId),
          eq(leads.smsSequencePosition, 0), // Not in another campaign
          eq(leads.smsStop, false),
          eq(leads.isActive, true)
        ),
      });

      if (!lead) {
        console.warn(`⚠️ Skipping lead ${leadId} - no longer eligible`);
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
          enrolledMessageCount: messageCount, // AUDIT FIX: Snapshot message count for version-aware de-enrollment
          enrolledAt: enrollmentTimestamp, // PHASE 1 FIX: Track enrollment timestamp (migration 0029)
          campaignHistory: [initialHistoryEntry], // PHASE 2: Initialize history
          smsSequencePosition: 0, // Will be incremented by scheduler
          smsLastSentAt: null,
          updatedAt: enrollmentTimestamp,
        })
        .where(eq(leads.id, leadId));

      enrolledCount++;

      // Advisory lock automatically released at transaction end
    } catch (error) {
      console.error(`Error enrolling lead ${leadId}:`, error);
      // Continue with next lead
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
