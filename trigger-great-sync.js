/**
 * TEMPORARY: Trigger Great Sync via API endpoint
 *
 * This script calls the sync API endpoint with fullSync=true to execute Phase P2.2.
 * Uses the deployed API with bypass token to avoid authentication issues.
 *
 * USAGE:
 * node trigger-great-sync.js
 */

const CLIENT_ID = process.env.DEFAULT_CLIENT_ID || '550e8400-e29b-41d4-a716-446655440000';
const BYPASS_TOKEN = process.env.SYNC_BYPASS_TOKEN || '';
const API_URL = 'http://localhost:3000'; // Internal network call

async function executeGreatSync() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    THE GREAT SYNC                             ║');
  console.log('║              Data Integrity Restoration - Phase 2             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const startTime = new Date();
  console.log(`⏰ Start Time: ${startTime.toISOString()}`);
  console.log(`📊 Client ID: ${CLIENT_ID}`);
  console.log(`🌐 API URL: ${API_URL}\n`);

  try {
    console.log('🔄 Calling sync API with fullSync=true...\n');

    const response = await fetch(`${API_URL}/api/admin/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-sync-bypass-token': BYPASS_TOKEN,
      },
      body: JSON.stringify({
        clientId: CLIENT_ID,
        fullSync: true,
        dryRun: false,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ API request failed');
      console.error(`Status: ${response.status}`);
      console.error(`Error: ${result.error || 'Unknown error'}`);
      process.exit(1);
    }

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
    console.log(`✅ Success:       ${result.success}`);
    console.log(`📦 Campaigns:     ${result.results.campaigns.synced} synced`);
    console.log(`👥 Leads:         ${result.results.leads.totalFetched} synced`);
    if (result.results.backfill) {
      console.log(`🔗 Backfill:      ${result.results.backfill.matched} matched, ${result.results.backfill.unmatched} unmatched`);
    }
    if (result.results.aggregates) {
      console.log(`📊 Aggregates:    ${result.results.aggregates.updated} campaigns updated`);
    }
    console.log('═'.repeat(70));
    console.log(`\n${result.message}`);

    if (result.success) {
      console.log('\n✅ SUCCESS: All sync operations completed without errors!');
      process.exit(0);
    } else {
      console.log('\n⚠️  PARTIAL SUCCESS: Some errors occurred');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ GREAT SYNC FAILED:', error);
    process.exit(1);
  }
}

// Execute
executeGreatSync();
