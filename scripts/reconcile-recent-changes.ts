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
import { eq, gte, and } from 'drizzle-orm';

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

        // Map Airtable record to database format
        const leadData = airtable.mapToDatabaseLead(record, clientId);

        // Check if lead already exists
        const existing = await db.query.leads.findFirst({
          where: eq(leads.airtableRecordId, record.id),
        });

        if (existing) {
          // Update existing lead
          await db
            .update(leads)
            .set({
              firstName: leadData.firstName,
              lastName: leadData.lastName,
              email: leadData.email,
              phone: leadData.phone,
              company: leadData.company,
              title: leadData.title,
              icpScore: leadData.icpScore,
              status: leadData.status,
              isActive: leadData.isActive,

              // Campaign & Sequence Tracking
              campaignName: leadData.campaignName,
              campaignVariant: leadData.campaignVariant,
              campaignBatch: leadData.campaignBatch,
              smsSequencePosition: leadData.smsSequencePosition,
              smsSentCount: leadData.smsSentCount,
              smsLastSentAt: leadData.smsLastSentAt,
              smsEligible: leadData.smsEligible,

              // Status Fields
              processingStatus: leadData.processingStatus,
              hrqStatus: leadData.hrqStatus,
              smsStop: leadData.smsStop,
              smsStopReason: leadData.smsStopReason,
              booked: leadData.booked,
              bookedAt: leadData.bookedAt,

              // Click Tracking
              shortLinkId: leadData.shortLinkId,
              shortLinkUrl: leadData.shortLinkUrl,
              clickCount: leadData.clickCount,
              clickedLink: leadData.clickedLink,
              firstClickedAt: leadData.firstClickedAt,

              // LinkedIn & Enrichment
              linkedinUrl: leadData.linkedinUrl,
              companyLinkedin: leadData.companyLinkedin,
              enrichmentOutcome: leadData.enrichmentOutcome,
              enrichmentAttemptedAt: leadData.enrichmentAttemptedAt,

              // Webinar & Campaign fields
              formId: leadData.formId,
              webinarDatetime: leadData.webinarDatetime,
              leadSource: leadData.leadSource,

              // Custom Campaigns
              kajabiTags: leadData.kajabiTags,
              engagementLevel: leadData.engagementLevel,

              // CRITICAL: Update timestamp for change tracking
              updatedAt: new Date(),
            })
            .where(eq(leads.airtableRecordId, record.id));

          result.stage1.updated++;
        } else {
          // Insert new lead
          await db.insert(leads).values({
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

            createdAt: leadData.createdAt || new Date(),
            updatedAt: new Date(),
          });

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
        result.stage1.errors.push(errorMsg);
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
 * @param lookbackMinutes - How far back to query PostgreSQL
 * @param result - Result object to populate with stats
 */
async function reconcileStage2(
  lookbackMinutes: number,
  result: ReconciliationResult
): Promise<void> {
  console.log(`   Querying PostgreSQL for changes in last ${lookbackMinutes} minutes...`);

  // TODO: Implement Stage 2 in Commit 3
  // - Query PostgreSQL for recently updated leads
  // - For each lead, check if Airtable is newer (conflict prevention)
  // - Update Airtable with PostgreSQL changes (claim, notes, etc.)
  // - Update result.stage2 stats

  console.log(`   ⏭️  Stage 2 not yet implemented (Commit 3)`);
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
