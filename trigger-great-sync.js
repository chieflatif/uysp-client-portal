/**
 * TEMPORARY: Trigger Great Sync directly via imported functions
 *
 * This script bypasses API authentication by calling the sync functions directly.
 * Used once to execute Phase P2.2 (Great Sync) on staging environment.
 *
 * USAGE:
 * node trigger-great-sync.js
 */

// Import the sync modules
const { syncCampaignsFromAirtable } = require('./src/lib/sync/sync-campaigns');
const { syncAirtableLeads } = require('./src/lib/sync/airtable-to-postgres');
const { backfillCampaignForeignKeys, updateAllCampaignAggregates } = require('./src/lib/sync/backfill-campaign-fk');

const CLIENT_ID = process.env.DEFAULT_CLIENT_ID || '550e8400-e29b-41d4-a716-446655440000';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || '';

async function executeGreatSync() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    THE GREAT SYNC                             ║');
  console.log('║              Data Integrity Restoration - Phase 2             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const startTime = new Date();
  console.log(`⏰ Start Time: ${startTime.toISOString()}`);
  console.log(`📊 Client ID: ${CLIENT_ID}`);
  console.log(`🗃️  Airtable Base: ${AIRTABLE_BASE_ID}\n`);

  try {
    // Step 1: Sync Campaigns
    console.log('🔄 Step 1: Syncing campaigns from Airtable...');
    const campaignResult = await syncCampaignsFromAirtable(CLIENT_ID, AIRTABLE_BASE_ID, false);
    console.log(`✅ Campaigns synced: ${campaignResult.synced} campaigns, ${campaignResult.errors} errors\n`);

    // Step 2: Sync Leads
    console.log('🔄 Step 2: Syncing leads from Airtable...');
    const leadsResult = await syncAirtableLeads();
    console.log(`✅ Leads synced: ${leadsResult.totalRecords} total, ${leadsResult.inserted} inserted, ${leadsResult.updated} updated, ${leadsResult.errors.length} errors\n`);

    // Step 3: Backfill Campaign Foreign Keys
    console.log('🔄 Step 3: Running campaign FK backfill...');
    const backfillResult = await backfillCampaignForeignKeys(false); // Live mode
    const matched = backfillResult.matchedByCampaignName +
                    backfillResult.matchedByLeadSource +
                    backfillResult.matchedByFormId;
    console.log(`✅ Backfill complete: ${matched} matched, ${backfillResult.noMatchFound} unmatched, ${backfillResult.errors.length} errors\n`);

    // Step 4: Calculate Campaign Aggregates
    console.log('🔄 Step 4: Calculating campaign aggregates...');
    const aggregatesResult = await updateAllCampaignAggregates();
    console.log(`✅ Aggregates updated: ${aggregatesResult.updated} campaigns, ${aggregatesResult.errors} errors\n`);

    // Summary
    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

    console.log('\n' + '═'.repeat(70));
    console.log('📊 GREAT SYNC COMPLETE - FINAL SUMMARY');
    console.log('═'.repeat(70));
    console.log(`⏰ Start Time:    ${startTime.toISOString()}`);
    console.log(`⏰ End Time:      ${endTime.toISOString()}`);
    console.log(`⏱️  Duration:      ${duration} seconds`);
    console.log('');
    console.log(`📦 Campaigns:     ${campaignResult.synced} synced, ${campaignResult.errors} errors`);
    console.log(`👥 Leads:         ${leadsResult.totalRecords} total (${leadsResult.inserted} new, ${leadsResult.updated} updated, ${leadsResult.errors.length} errors)`);
    console.log(`🔗 Backfill:      ${matched} matched, ${backfillResult.noMatchFound} unmatched, ${backfillResult.errors.length} errors`);
    console.log(`📊 Aggregates:    ${aggregatesResult.updated} campaigns updated, ${aggregatesResult.errors} errors`);
    console.log('═'.repeat(70));

    const totalErrors = campaignResult.errors + leadsResult.errors.length + backfillResult.errors.length + aggregatesResult.errors;

    if (totalErrors === 0) {
      console.log('\n✅ SUCCESS: All sync operations completed without errors!');
      process.exit(0);
    } else {
      console.log(`\n⚠️  PARTIAL SUCCESS: Sync completed with ${totalErrors} total errors`);
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ GREAT SYNC FAILED:', error);
    process.exit(1);
  }
}

// Execute
executeGreatSync();
