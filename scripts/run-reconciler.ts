#!/usr/bin/env tsx
/**
 * CLI Runner for Bi-Directional Reconciliation Engine
 *
 * Usage:
 *   npm run sync:delta           # 20 minutes (default)
 *   npm run sync:delta:1h        # 1 hour
 *   npm run sync:delta:6h        # 6 hours
 *   npm run sync:delta:24h       # 24 hours (max)
 *   npm run sync:help            # Show help
 *
 * Direct usage:
 *   tsx scripts/run-reconciler.ts <minutes>
 *   tsx scripts/run-reconciler.ts 120  # 2 hours
 *
 * Environment:
 *   Requires DATABASE_URL in .env
 */

import { reconcileRecentChanges } from './reconcile-recent-changes';

async function main() {
  try {
    // Parse lookback minutes from command line args
    const args = process.argv.slice(2);
    const lookbackMinutes = args[0] ? parseInt(args[0], 10) : 20;

    // Validate input
    if (isNaN(lookbackMinutes) || lookbackMinutes < 1 || lookbackMinutes > 1440) {
      console.error('\n❌ Invalid lookback minutes');
      console.error('   Must be a number between 1 and 1440 (24 hours)');
      console.error(`\n   Usage: tsx scripts/run-reconciler.ts <minutes>`);
      console.error(`   Example: tsx scripts/run-reconciler.ts 60\n`);
      process.exit(1);
    }

    // Check environment
    if (!process.env.DATABASE_URL) {
      console.error('\n❌ DATABASE_URL not found in environment');
      console.error('   Make sure .env file exists with DATABASE_URL set\n');
      process.exit(1);
    }

    // Display banner
    console.log('\n' + '='.repeat(70));
    console.log('  BI-DIRECTIONAL RECONCILIATION ENGINE');
    console.log('='.repeat(70));
    console.log(`  Lookback window: ${lookbackMinutes} minutes`);
    console.log(`  Started at: ${new Date().toISOString()}`);
    console.log('='.repeat(70) + '\n');

    // Run reconciler
    const result = await reconcileRecentChanges(lookbackMinutes);

    // Display results
    console.log('\n' + '='.repeat(70));
    console.log('  RECONCILIATION COMPLETE');
    console.log('='.repeat(70));

    console.log(`\n📊 Statistics:`);
    console.log(`   Duration: ${(result.duration / 1000).toFixed(2)}s`);
    console.log(`   Client: ${result.clientId}`);
    console.log(`   Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);

    console.log(`\n📥 Stage 1: Airtable → PostgreSQL`);
    console.log(`   Records processed: ${result.stage1.recordsProcessed}`);
    console.log(`   Inserted: ${result.stage1.inserted}`);
    console.log(`   Updated: ${result.stage1.updated}`);
    console.log(`   Errors: ${result.stage1.errors.length}`);
    if (result.stage1.errors.length > 0) {
      console.log(`\n   ⚠️  Stage 1 Errors:`);
      result.stage1.errors.slice(0, 5).forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err}`);
      });
      if (result.stage1.errors.length > 5) {
        console.log(`   ... and ${result.stage1.errors.length - 5} more errors`);
      }
    }

    console.log(`\n📤 Stage 2: PostgreSQL → Airtable`);
    console.log(`   Records processed: ${result.stage2.recordsProcessed}`);
    console.log(`   Updated: ${result.stage2.updated}`);
    console.log(`   Skipped (grace period): ${result.stage2.skipped}`);
    console.log(`   Errors: ${result.stage2.errors.length}`);
    if (result.stage2.errors.length > 0) {
      console.log(`\n   ⚠️  Stage 2 Errors:`);
      result.stage2.errors.slice(0, 5).forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err}`);
      });
      if (result.stage2.errors.length > 5) {
        console.log(`   ... and ${result.stage2.errors.length - 5} more errors`);
      }
    }

    console.log('\n' + '='.repeat(70) + '\n');

    // Exit with appropriate code
    if (!result.success) {
      process.exit(1);
    }

    // Warning if many errors
    const totalErrors = result.stage1.errors.length + result.stage2.errors.length;
    if (totalErrors > 10) {
      console.warn(`\n⚠️  Warning: ${totalErrors} total errors encountered`);
      console.warn('   Review logs above for details\n');
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('\n' + '='.repeat(70));
    console.error('  ❌ RECONCILIATION FAILED');
    console.error('='.repeat(70));
    console.error(`\n${error}\n`);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { main };
