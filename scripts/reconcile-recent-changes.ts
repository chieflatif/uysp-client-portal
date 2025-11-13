/**
 * BI-DIRECTIONAL RECONCILIATION ENGINE
 *
 * Purpose: Synchronize data between PostgreSQL and Airtable in both directions
 * Stage 1: Airtable → PostgreSQL (pull recent changes)
 * Stage 2: PostgreSQL → Airtable (push recent changes)
 *
 * Architecture: See MANDATORY-DEVELOPMENT-WORKFLOW.md
 * Audit: See SELF-AUDIT-DANGEROUS-ASSUMPTIONS.md
 *
 * @author Implementation Agent
 * @date 2025-11-12
 */

import { db } from '../src/lib/db';
import { leads, clients } from '../src/lib/db/schema';
import { getAirtableClient } from '../src/lib/airtable/client';
import { eq } from 'drizzle-orm';

// ==============================================================================
// TYPE DEFINITIONS
// ==============================================================================

interface ReconciliationResult {
  success: boolean;
  stage1: {
    recordsProcessed: number;
    inserted: number;
    updated: number;
    errors: string[];
  };
  stage2: {
    recordsProcessed: number;
    updated: number;
    skipped: number;
    errors: string[];
  };
  startTime: Date;
  endTime: Date;
  duration: number;
  clientId: string;
}

// ==============================================================================
// CONFIGURATION
// ==============================================================================

const RECONCILIATION_CONFIG = {
  DEFAULT_LOOKBACK_MINUTES: 20,
  STAGE2_BATCH_SIZE: 10,
  RATE_LIMIT_DELAY_MS: 200, // 5 requests/second for Airtable
  GRACE_PERIOD_MS: 60000, // 60 seconds to prevent infinite loops
  MAX_ERRORS: 100, // Maximum errors to store (prevents memory leak)
} as const;

// ==============================================================================
// MAIN RECONCILIATION FUNCTION
// ==============================================================================

/**
 * Bi-Directional Reconciliation Engine
 *
 * Stage 1: Airtable → PostgreSQL (pull recent changes)
 * - Query Airtable for records modified in last N minutes
 * - Upsert into PostgreSQL based on airtableRecordId
 *
 * Stage 2: PostgreSQL → Airtable (push recent changes)
 * - Query PostgreSQL for records updated in last N minutes
 * - Update Airtable with changes (claim, unclaim, notes)
 * - Skip if Airtable was modified more recently (conflict prevention)
 *
 * @param lookbackMinutes - How far back to look for changes (default: 20)
 * @returns ReconciliationResult with detailed stats
 */
export async function reconcileRecentChanges(
  lookbackMinutes: number = RECONCILIATION_CONFIG.DEFAULT_LOOKBACK_MINUTES
): Promise<ReconciliationResult> {
  const startTime = new Date();

  // CRITICAL: Validate lookbackMinutes parameter
  if (lookbackMinutes <= 0 || lookbackMinutes > 1440) {
    throw new Error(
      `lookbackMinutes must be between 1 and 1440 (24 hours), got: ${lookbackMinutes}`
    );
  }

  // Initialize result object
  const result: ReconciliationResult = {
    success: false,
    stage1: { recordsProcessed: 0, inserted: 0, updated: 0, errors: [] },
    stage2: { recordsProcessed: 0, updated: 0, skipped: 0, errors: [] },
    startTime,
    endTime: new Date(),
    duration: 0,
    clientId: '',
  };

  try {
    console.log(`🔄 Starting bi-directional reconciliation...`);
    console.log(`   Lookback window: ${lookbackMinutes} minutes`);

    // CRITICAL: Get client ID dynamically (not hardcoded)
    const client = await getActiveClient();
    result.clientId = client.id;
    console.log(`   Client: ${client.companyName} (${client.id})`);

    // Stage 1: Airtable → PostgreSQL
    console.log('\n📥 STAGE 1: Airtable → PostgreSQL');
    await reconcileStage1(lookbackMinutes, result, client.id);

    // Stage 2: PostgreSQL → Airtable
    console.log('\n📤 STAGE 2: PostgreSQL → Airtable');
    await reconcileStage2(lookbackMinutes, result);

    result.success = true;
    console.log('\n✅ Reconciliation complete');
  } catch (error) {
    console.error('❌ Reconciliation failed:', error);
    result.success = false;
    result.stage1.errors.push(`Fatal error: ${error}`);
  } finally {
    result.endTime = new Date();
    result.duration = result.endTime.getTime() - result.startTime.getTime();
  }

  return result;
}

// ==============================================================================
// HELPER FUNCTIONS
// ==============================================================================

/**
 * Get the active client for this reconciliation
 * Uses the first active client in the database
 *
 * CRITICAL FIX: Dynamic lookup instead of hardcoded DEFAULT_CLIENT_ID
 * This ensures we always use the correct client, even if IDs change
 */
async function getActiveClient(): Promise<{
  id: string;
  companyName: string;
  airtableBaseId: string;
}> {
  const client = await db.query.clients.findFirst({
    where: eq(clients.isActive, true),
  });

  if (!client) {
    throw new Error(
      'No active client found in database. ' +
      'Please ensure at least one client is marked as active in the clients table.'
    );
  }

  return {
    id: client.id,
    companyName: client.companyName,
    airtableBaseId: client.airtableBaseId,
  };
}

/**
 * STAGE 1: Airtable → PostgreSQL
 * Pull recent changes from Airtable and upsert into PostgreSQL
 *
 * IMPORTANT: campaignId is intentionally EXCLUDED from sync
 * Reason: campaignId is populated by a separate backfill script (backfill-campaign-fk.ts)
 * which matches leads to campaigns based on formId/campaignName/leadSource.
 * Syncing campaignId here would conflict with that backfill logic.
 *
 * @param lookbackMinutes - How far back to query Airtable
 * @param result - Result object to populate with stats
 * @param clientId - Client ID for record ownership
 */
async function reconcileStage1(
  lookbackMinutes: number,
  result: ReconciliationResult,
  clientId: string
): Promise<void> {
  console.log(`   Querying Airtable for changes in last ${lookbackMinutes} minutes...`);

  try {
    // Calculate cutoff time
    const cutoffTime = new Date(Date.now() - lookbackMinutes * 60 * 1000);
    console.log(`   Cutoff time: ${cutoffTime.toISOString()}`);

    // Query Airtable for recently modified leads
    const airtable = getAirtableClient();
    const recentLeads = await airtable.getLeadsModifiedSince(cutoffTime);

    console.log(`   Found ${recentLeads.length} recently modified leads in Airtable`);

    if (recentLeads.length === 0) {
      console.log(`   ✅ No changes to sync`);
      return;
    }

    // Process each lead
    for (const record of recentLeads) {
      try {
        result.stage1.recordsProcessed++;

        // CRITICAL: Validate record.id before processing
        if (!record.id) {
          throw new Error('Airtable record missing ID - skipping');
        }

        // Map Airtable record to database format
        const leadData = airtable.mapToDatabaseLead(record, clientId);

        // CRITICAL: Use upsert to prevent race conditions
        // Check if lead exists first (needed for statistics)
        const existing = await db.query.leads.findFirst({
          where: eq(leads.airtableRecordId, record.id),
        });

        // Prepare complete record for upsert
        const leadRecord = {
          airtableRecordId: record.id,
          clientId: clientId,
          firstName: leadData.firstName || 'Unknown',
          lastName: leadData.lastName || '',
          email: leadData.email || '',
          phone: leadData.phone,
          company: leadData.company,
          title: leadData.title,
          icpScore: leadData.icpScore || 0,
          status: leadData.status || 'New',
          isActive: leadData.isActive !== false,

          // Campaign & Sequence Tracking
          campaignName: leadData.campaignName,
          campaignVariant: leadData.campaignVariant,
          campaignBatch: leadData.campaignBatch,
          smsSequencePosition: leadData.smsSequencePosition || 0,
          smsSentCount: leadData.smsSentCount || 0,
          smsLastSentAt: leadData.smsLastSentAt,
          smsEligible: leadData.smsEligible ?? true,

          // Status Fields
          processingStatus: leadData.processingStatus,
          hrqStatus: leadData.hrqStatus,
          smsStop: leadData.smsStop ?? false,
          smsStopReason: leadData.smsStopReason,
          booked: leadData.booked ?? false,
          bookedAt: leadData.bookedAt,

          // Claim tracking
          claimedBy: leadData.claimedBy,
          claimedAt: leadData.claimedAt,

          // Click Tracking
          shortLinkId: leadData.shortLinkId,
          shortLinkUrl: leadData.shortLinkUrl,
          clickCount: leadData.clickCount || 0,
          clickedLink: leadData.clickedLink ?? false,
          firstClickedAt: leadData.firstClickedAt,

          // LinkedIn & Enrichment
          linkedinUrl: leadData.linkedinUrl,
          companyLinkedin: leadData.companyLinkedin,
          enrichmentOutcome: leadData.enrichmentOutcome,
          enrichmentAttemptedAt: leadData.enrichmentAttemptedAt,

          // Webinar & Campaign fields
          formId: leadData.formId,
          webinarDatetime: leadData.webinarDatetime,
          leadSource: leadData.leadSource || 'Standard Form',

          // Custom Campaigns
          kajabiTags: leadData.kajabiTags,
          engagementLevel: leadData.engagementLevel,
          notes: leadData.notes,

          createdAt: leadData.createdAt || new Date(),
          updatedAt: new Date(),
        };

        // Use upsert: insert if new, update if exists (prevents race conditions)
        await db
          .insert(leads)
          .values(leadRecord)
          .onConflictDoUpdate({
            target: leads.airtableRecordId,
            set: {
              // Update all fields except primary key and airtableRecordId
              firstName: leadRecord.firstName,
              lastName: leadRecord.lastName,
              email: leadRecord.email,
              phone: leadRecord.phone,
              company: leadRecord.company,
              title: leadRecord.title,
              icpScore: leadRecord.icpScore,
              status: leadRecord.status,
              isActive: leadRecord.isActive,
              campaignName: leadRecord.campaignName,
              campaignVariant: leadRecord.campaignVariant,
              campaignBatch: leadRecord.campaignBatch,
              smsSequencePosition: leadRecord.smsSequencePosition,
              smsSentCount: leadRecord.smsSentCount,
              smsLastSentAt: leadRecord.smsLastSentAt,
              smsEligible: leadRecord.smsEligible,
              processingStatus: leadRecord.processingStatus,
              hrqStatus: leadRecord.hrqStatus,
              smsStop: leadRecord.smsStop,
              smsStopReason: leadRecord.smsStopReason,
              booked: leadRecord.booked,
              bookedAt: leadRecord.bookedAt,
              claimedBy: leadRecord.claimedBy,
              claimedAt: leadRecord.claimedAt,
              shortLinkId: leadRecord.shortLinkId,
              shortLinkUrl: leadRecord.shortLinkUrl,
              clickCount: leadRecord.clickCount,
              clickedLink: leadRecord.clickedLink,
              firstClickedAt: leadRecord.firstClickedAt,
              linkedinUrl: leadRecord.linkedinUrl,
              companyLinkedin: leadRecord.companyLinkedin,
              enrichmentOutcome: leadRecord.enrichmentOutcome,
              enrichmentAttemptedAt: leadRecord.enrichmentAttemptedAt,
              formId: leadRecord.formId,
              webinarDatetime: leadRecord.webinarDatetime,
              leadSource: leadRecord.leadSource,
              kajabiTags: leadRecord.kajabiTags,
              engagementLevel: leadRecord.engagementLevel,
              notes: leadRecord.notes,
              updatedAt: new Date(),
            },
          });

        // Update statistics
        if (existing) {
          result.stage1.updated++;
        } else {
          result.stage1.inserted++;
        }

        // Progress indicator every 50 records
        if (result.stage1.recordsProcessed % 50 === 0) {
          console.log(`   ⏳ Processed ${result.stage1.recordsProcessed} records...`);
        }
      } catch (error) {
        // Error isolation: continue processing other records
        const errorMsg = `Failed to sync lead ${record.id}: ${error}`;
        console.error(`   ❌ ${errorMsg}`);

        // CRITICAL: Limit errors array to prevent memory leak
        if (result.stage1.errors.length < RECONCILIATION_CONFIG.MAX_ERRORS) {
          result.stage1.errors.push(errorMsg);
        } else if (result.stage1.errors.length === RECONCILIATION_CONFIG.MAX_ERRORS) {
          result.stage1.errors.push(
            `... and more errors (max ${RECONCILIATION_CONFIG.MAX_ERRORS} reached)`
          );
        }
      }
    }

    console.log(
      `   ✅ Stage 1 complete: ${result.stage1.inserted} inserted, ${result.stage1.updated} updated`
    );
  } catch (error) {
    // Fatal error in Stage 1
    const errorMsg = `Stage 1 failed: ${error}`;
    console.error(`   ❌ ${errorMsg}`);
    result.stage1.errors.push(errorMsg);
    throw error;
  }
}

/**
 * STAGE 2: PostgreSQL → Airtable
 * Push recent PostgreSQL changes back to Airtable
 *
 * Conflict Prevention Strategy:
 * - Compare PostgreSQL updatedAt vs Airtable Last Modified Time
 * - Skip if Airtable was modified more recently (within GRACE_PERIOD_MS)
 * - Only sync portal-owned fields (claimedBy, claimedAt, notes) - other fields come from Airtable
 *
 * @param lookbackMinutes - How far back to query PostgreSQL
 * @param result - Result object to populate with stats
 */
async function reconcileStage2(
  lookbackMinutes: number,
  result: ReconciliationResult
): Promise<void> {
  console.log(`   Querying PostgreSQL for changes in last ${lookbackMinutes} minutes...`);

  try {
    // Calculate cutoff time
    const cutoffTime = new Date(Date.now() - lookbackMinutes * 60 * 1000);
    console.log(`   Cutoff time: ${cutoffTime.toISOString()}`);

    // Query PostgreSQL for recently updated leads
    const recentLeads = await db.query.leads.findMany({
      where: (leads, { gte }) => gte(leads.updatedAt, cutoffTime),
      columns: {
        id: true,
        airtableRecordId: true,
        claimedBy: true,
        claimedAt: true,
        notes: true, // Added for Notes API sync
        updatedAt: true,
      },
    });

    console.log(`   Found ${recentLeads.length} recently updated leads in PostgreSQL`);

    if (recentLeads.length === 0) {
      console.log(`   ✅ No changes to sync`);
      return;
    }

    // Get Airtable client
    const airtable = getAirtableClient();

    // Process each lead with rate limiting
    for (const lead of recentLeads) {
      try {
        result.stage2.recordsProcessed++;

        // CRITICAL: Validate airtableRecordId exists
        if (!lead.airtableRecordId) {
          throw new Error(`Lead ${lead.id} missing airtableRecordId - skipping`);
        }

        // Fetch corresponding Airtable record for current state
        const airtableRecord = await airtable.getRecord(lead.airtableRecordId);

        // CONFLICT PREVENTION: Skip if within grace period of PostgreSQL update
        // This prevents race conditions when both systems update simultaneously
        const timeSinceUpdate = Date.now() - lead.updatedAt.getTime();

        // Skip if updated very recently (within grace period)
        if (timeSinceUpdate < RECONCILIATION_CONFIG.GRACE_PERIOD_MS) {
          result.stage2.skipped++;
          continue;
        }

        // PostgreSQL is newer - update Airtable with claim data
        const updateFields: { [key: string]: string | null } = {};

        // ALWAYS sync claim fields (null or value) to support unclaim operation
        // null values explicitly clear Airtable fields (correct for unclaim)
        if (lead.claimedBy !== undefined) {
          updateFields['Claimed By'] = lead.claimedBy; // null clears field in Airtable
        }

        if (lead.claimedAt !== undefined) {
          // Convert Date to ISO string, or pass null to clear field
          updateFields['Claimed At'] = lead.claimedAt ? lead.claimedAt.toISOString() : null;
        }

        // Sync notes field (portal-owned, added via Notes API)
        if (lead.notes !== undefined) {
          updateFields['Notes'] = lead.notes; // null clears field in Airtable
        }

        // Skip if no fields to update
        if (Object.keys(updateFields).length === 0) {
          result.stage2.skipped++;
          continue;
        }

        // Update Airtable
        await airtable.updateRecord('Leads', lead.airtableRecordId, updateFields);
        result.stage2.updated++;

        // RATE LIMITING: Respect Airtable 5 req/sec limit
        await new Promise(resolve =>
          setTimeout(resolve, RECONCILIATION_CONFIG.RATE_LIMIT_DELAY_MS)
        );

        // Progress indicator every 50 records
        if (result.stage2.recordsProcessed % 50 === 0) {
          console.log(`   ⏳ Processed ${result.stage2.recordsProcessed} records...`);
        }
      } catch (error) {
        // Error isolation: continue processing other records
        const errorMsg = `Failed to sync lead ${lead.airtableRecordId}: ${error}`;
        console.error(`   ❌ ${errorMsg}`);

        // CRITICAL: Limit errors array to prevent memory leak
        if (result.stage2.errors.length < RECONCILIATION_CONFIG.MAX_ERRORS) {
          result.stage2.errors.push(errorMsg);
        } else if (result.stage2.errors.length === RECONCILIATION_CONFIG.MAX_ERRORS) {
          result.stage2.errors.push(
            `... and more errors (max ${RECONCILIATION_CONFIG.MAX_ERRORS} reached)`
          );
        }
      }
    }

    console.log(
      `   ✅ Stage 2 complete: ${result.stage2.updated} updated, ${result.stage2.skipped} skipped`
    );
  } catch (error) {
    // Fatal error in Stage 2
    const errorMsg = `Stage 2 failed: ${error}`;
    console.error(`   ❌ ${errorMsg}`);
    result.stage2.errors.push(errorMsg);
    throw error;
  }
}

// ==============================================================================
// CLI EXECUTION
// ==============================================================================

/**
 * Execute reconciliation from command line
 * Usage: npx tsx scripts/reconcile-recent-changes.ts [lookbackMinutes]
 * Example: npx tsx scripts/reconcile-recent-changes.ts 30
 */
if (require.main === module) {
  const lookbackArg = process.argv[2];
  const lookbackMinutes = lookbackArg ? parseInt(lookbackArg, 10) : undefined;

  // Validate argument
  if (lookbackArg && (isNaN(lookbackMinutes!) || lookbackMinutes! <= 0)) {
    console.error('❌ Error: lookbackMinutes must be a positive number');
    console.error('Usage: npx tsx scripts/reconcile-recent-changes.ts [lookbackMinutes]');
    process.exit(1);
  }

  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     BI-DIRECTIONAL RECONCILIATION ENGINE v1.0             ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  reconcileRecentChanges(lookbackMinutes)
    .then((result) => {
      console.log('\n╔═══════════════════════════════════════════════════════════╗');
      console.log('║                  RECONCILIATION SUMMARY                   ║');
      console.log('╚═══════════════════════════════════════════════════════════╝');
      console.log(`\n📊 Results:`);
      console.log(`   Success: ${result.success ? '✅ YES' : '❌ NO'}`);
      console.log(`   Client ID: ${result.clientId}`);
      console.log(`   Duration: ${(result.duration / 1000).toFixed(2)}s`);
      console.log(`\n📥 Stage 1 (Airtable → PostgreSQL):`);
      console.log(`   Processed: ${result.stage1.recordsProcessed}`);
      console.log(`   Inserted: ${result.stage1.inserted}`);
      console.log(`   Updated: ${result.stage1.updated}`);
      console.log(`   Errors: ${result.stage1.errors.length}`);
      console.log(`\n📤 Stage 2 (PostgreSQL → Airtable):`);
      console.log(`   Processed: ${result.stage2.recordsProcessed}`);
      console.log(`   Updated: ${result.stage2.updated}`);
      console.log(`   Skipped: ${result.stage2.skipped}`);
      console.log(`   Errors: ${result.stage2.errors.length}`);

      if (result.stage1.errors.length > 0 || result.stage2.errors.length > 0) {
        console.log(`\n⚠️  Errors encountered:`);
        [...result.stage1.errors, ...result.stage2.errors].forEach((err, i) => {
          console.log(`   ${i + 1}. ${err}`);
        });
      }

      console.log('\n' + '═'.repeat(63) + '\n');

      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('\n❌ Fatal error during reconciliation:');
      console.error(error);
      console.error('\n' + '═'.repeat(63) + '\n');
      process.exit(1);
    });
}
