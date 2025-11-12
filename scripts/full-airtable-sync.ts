/**
 * MASTER SYNC SCRIPT: The "Great Sync"
 *
 * PURPOSE:
 * Complete resynchronization of all data from Airtable (source of truth) to PostgreSQL.
 * This is the definitive data restoration script for Phase 2.
 *
 * EXECUTION SEQUENCE:
 * 1. Sync all campaigns from Airtable
 * 2. Sync all leads from Airtable
 * 3. Sync historical SMS audit data (for activity timeline)
 * 4. Run backfill script to fix campaign_id relationships
 * 5. Calculate and update campaign aggregates
 *
 * PREREQUISITES:
 * - Database must be wiped (TRUNCATE completed)
 * - Airtable schema ready (Task A1 complete)
 * - Environment variables configured
 *
 * USAGE:
 * npm run tsx scripts/full-airtable-sync.ts
 */

import { db } from '../src/lib/db';
import { campaigns, leads } from '../src/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { syncCampaignsFromAirtable } from '../src/lib/sync/sync-campaigns';
import { syncAirtableLeads } from '../src/lib/sync/airtable-to-postgres';
import { backfillCampaignForeignKeys } from './backfill-campaign-fk';

// Configuration
const CLIENT_ID = process.env.DEFAULT_CLIENT_ID || '550e8400-e29b-41d4-a716-446655440000';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || '';

interface SyncStats {
  startTime: Date;
  endTime?: Date;
  durationSeconds?: number;
  campaigns: { synced: number; errors: number };
  leads: { inserted: number; updated: number; total: number; errors: number };
  backfill: { matched: number; unmatched: number; errors: number };
  aggregates: { updated: number; errors: number };
  smsAudit: { synced: number; errors: number };
}

/**
 * Calculate and update campaign aggregates
 */
async function updateAllCampaignAggregates(): Promise<{ updated: number; errors: number }> {
  console.log('\n🔄 Step 5: Calculating campaign aggregates...');

  let updated = 0;
  let errors = 0;

  try {
    const allCampaigns = await db.query.campaigns.findMany({
      where: eq(campaigns.isActive, true),
    });

    console.log(`Found ${allCampaigns.length} active campaigns to update`);

    for (const campaign of allCampaigns) {
      try {
        // Calculate aggregates with a single query
        const aggregates = await db
          .select({
            totalLeads: sql<number>`COUNT(*)::int`,
            activeLeadsCount: sql<number>`COUNT(CASE WHEN ${leads.completedAt} IS NULL AND ${leads.smsStop} = false THEN 1 END)::int`,
            completedLeadsCount: sql<number>`COUNT(CASE WHEN ${leads.completedAt} IS NOT NULL THEN 1 END)::int`,
            optedOutCount: sql<number>`COUNT(CASE WHEN ${leads.smsStop} = true THEN 1 END)::int`,
            bookedCount: sql<number>`COUNT(CASE WHEN ${leads.booked} = true THEN 1 END)::int`,
            messagesSent: sql<number>`COALESCE(SUM(${leads.smsSentCount}), 0)::int`,
          })
          .from(leads)
          .where(
            sql`${leads.campaignId} = ${campaign.id} AND ${leads.isActive} = true`
          );

        const stats = aggregates[0];

        // Update campaign
        await db
          .update(campaigns)
          .set({
            totalLeads: stats.totalLeads,
            activeLeadsCount: stats.activeLeadsCount,
            completedLeadsCount: stats.completedLeadsCount,
            optedOutCount: stats.optedOutCount,
            bookedCount: stats.bookedCount,
            messagesSent: stats.messagesSent,
            updatedAt: new Date(),
          })
          .where(eq(campaigns.id, campaign.id));

        updated++;

        if (updated % 10 === 0) {
          console.log(`  ⏳ Updated ${updated}/${allCampaigns.length} campaigns...`);
        }
      } catch (error) {
        console.error(`❌ Error updating campaign ${campaign.id}:`, error);
        errors++;
      }
    }

    console.log(`✅ Aggregates updated: ${updated} campaigns, ${errors} errors`);
  } catch (error) {
    console.error('❌ Failed to update campaign aggregates:', error);
    throw error;
  }

  return { updated, errors };
}

/**
 * Sync SMS audit data from Airtable (for historical activity timeline)
 * Note: This is a placeholder - actual implementation would require SMS Audit table access
 */
async function syncSMSAuditData(): Promise<{ synced: number; errors: number }> {
  console.log('\n🔄 Step 3: Syncing SMS audit data...');

  // TODO: Implement if SMS Audit table needs to be synced
  // For now, the database trigger will handle future SMS activity logging

  console.log('⏭️  Skipping SMS audit sync (will be logged by database trigger going forward)');

  return { synced: 0, errors: 0 };
}

/**
 * Main sync orchestration function
 */
async function executeGreatSync(): Promise<SyncStats> {
  const stats: SyncStats = {
    startTime: new Date(),
    campaigns: { synced: 0, errors: 0 },
    leads: { inserted: 0, updated: 0, total: 0, errors: 0 },
    backfill: { matched: 0, unmatched: 0, errors: 0 },
    aggregates: { updated: 0, errors: 0 },
    smsAudit: { synced: 0, errors: 0 },
  };

  try {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    THE GREAT SYNC                             ║');
    console.log('║              Data Integrity Restoration - Phase 2             ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    console.log(`⏰ Start Time: ${stats.startTime.toISOString()}`);
    console.log(`📊 Client ID: ${CLIENT_ID}`);
    console.log(`🗃️  Airtable Base: ${AIRTABLE_BASE_ID}\n`);

    // =================================================================
    // STEP 1: Sync Campaigns from Airtable
    // =================================================================
    console.log('🔄 Step 1: Syncing campaigns from Airtable...');

    const campaignResult = await syncCampaignsFromAirtable(CLIENT_ID, AIRTABLE_BASE_ID, false);
    stats.campaigns = campaignResult;

    console.log(`✅ Campaigns synced: ${campaignResult.synced} campaigns, ${campaignResult.errors} errors\n`);

    // =================================================================
    // STEP 2: Sync Leads from Airtable
    // =================================================================
    console.log('🔄 Step 2: Syncing leads from Airtable...');

    const leadsResult = await syncAirtableLeads();
    stats.leads = {
      inserted: leadsResult.inserted,
      updated: leadsResult.updated,
      total: leadsResult.totalRecords,
      errors: leadsResult.errors.length,
    };

    console.log(`✅ Leads synced: ${leadsResult.totalRecords} total, ${leadsResult.inserted} inserted, ${leadsResult.updated} updated, ${leadsResult.errors.length} errors\n`);

    // =================================================================
    // STEP 3: Sync SMS Audit Data (Optional)
    // =================================================================
    stats.smsAudit = await syncSMSAuditData();

    // =================================================================
    // STEP 4: Run Backfill Script (Fix campaign_id relationships)
    // =================================================================
    console.log('\n🔄 Step 4: Running campaign FK backfill...');

    const backfillResult = await backfillCampaignForeignKeys(false); // Live mode
    stats.backfill = {
      matched: backfillResult.matchedByCampaignName +
               backfillResult.matchedByLeadSource +
               backfillResult.matchedByFormId,
      unmatched: backfillResult.noMatchFound,
      errors: backfillResult.errors.length,
    };

    console.log(`✅ Backfill complete: ${stats.backfill.matched} matched, ${stats.backfill.unmatched} unmatched, ${stats.backfill.errors} errors\n`);

    // =================================================================
    // STEP 5: Calculate Campaign Aggregates
    // =================================================================
    stats.aggregates = await updateAllCampaignAggregates();

    // =================================================================
    // FINALIZATION
    // =================================================================
    stats.endTime = new Date();
    stats.durationSeconds = Math.round((stats.endTime.getTime() - stats.startTime.getTime()) / 1000);

    // Print final summary
    console.log('\n' + '═'.repeat(70));
    console.log('📊 GREAT SYNC COMPLETE - FINAL SUMMARY');
    console.log('═'.repeat(70));
    console.log(`⏰ Start Time:    ${stats.startTime.toISOString()}`);
    console.log(`⏰ End Time:      ${stats.endTime.toISOString()}`);
    console.log(`⏱️  Duration:      ${stats.durationSeconds} seconds`);
    console.log('');
    console.log(`📦 Campaigns:     ${stats.campaigns.synced} synced, ${stats.campaigns.errors} errors`);
    console.log(`👥 Leads:         ${stats.leads.total} total (${stats.leads.inserted} new, ${stats.leads.updated} updated, ${stats.leads.errors} errors)`);
    console.log(`🔗 Backfill:      ${stats.backfill.matched} matched, ${stats.backfill.unmatched} unmatched, ${stats.backfill.errors} errors`);
    console.log(`📊 Aggregates:    ${stats.aggregates.updated} campaigns updated, ${stats.aggregates.errors} errors`);
    console.log(`📨 SMS Audit:     ${stats.smsAudit.synced} records synced, ${stats.smsAudit.errors} errors`);
    console.log('═'.repeat(70));

    // Success or partial success check
    const totalErrors =
      stats.campaigns.errors +
      stats.leads.errors +
      stats.backfill.errors +
      stats.aggregates.errors +
      stats.smsAudit.errors;

    if (totalErrors === 0) {
      console.log('\n✅ SUCCESS: All sync operations completed without errors!');
    } else {
      console.log(`\n⚠️  PARTIAL SUCCESS: Sync completed with ${totalErrors} total errors`);
      console.log('Review the logs above for details.');
    }

    return stats;

  } catch (error) {
    stats.endTime = new Date();
    stats.durationSeconds = Math.round((stats.endTime.getTime() - stats.startTime.getTime()) / 1000);

    console.error('\n' + '═'.repeat(70));
    console.error('❌ GREAT SYNC FAILED');
    console.error('═'.repeat(70));
    console.error('Fatal error occurred during sync:', error);
    console.error(`Duration before failure: ${stats.durationSeconds} seconds`);
    console.error('═'.repeat(70));

    throw error;
  }
}

// Execute if run directly
if (require.main === module) {
  executeGreatSync()
    .then(() => {
      console.log('\n✅ Script execution complete. Exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script execution failed:', error);
      process.exit(1);
    });
}

// Export for use in other scripts
export { executeGreatSync };
