/**
 * DATABASE WIPE SCRIPT: Staging Environment Only
 *
 * PURPOSE:
 * Completely wipes leads, campaigns, and lead_activity_log tables in preparation
 * for "Great Sync" data restoration from Airtable (source of truth).
 *
 * ⚠️  DANGER: This script performs DESTRUCTIVE operations
 * ⚠️  ONLY run on uysp-portal-staging database
 * ⚠️  NEVER run on production
 *
 * SAFETY CHECKS:
 * - Requires explicit --confirm flag
 * - Validates DATABASE_URL contains "staging"
 * - 10-second countdown before execution
 * - Backup reference captured before wipe
 *
 * USAGE:
 * npm run tsx scripts/wipe-staging-db.ts --confirm
 *
 * RELATED:
 * - Run immediately before scripts/full-airtable-sync.ts
 * - Part of Phase 2 (P2.1) in MASTER-PLAN-DATA-INTEGRITY-RESTORATION.md
 */

import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

interface BackupReference {
  timestamp: Date;
  campaigns: number;
  leads: number;
  leadActivityLog: number;
}

/**
 * Capture current record counts before wipe
 */
async function captureBackupReference(): Promise<BackupReference> {
  console.log('📊 Capturing backup reference...\n');

  const campaignCount = await db.execute(sql`SELECT COUNT(*) FROM campaigns`);
  const leadCount = await db.execute(sql`SELECT COUNT(*) FROM leads`);
  const activityCount = await db.execute(sql`SELECT COUNT(*) FROM lead_activity_log`);

  const ref: BackupReference = {
    timestamp: new Date(),
    campaigns: Number(campaignCount.rows[0].count),
    leads: Number(leadCount.rows[0].count),
    leadActivityLog: Number(activityCount.rows[0].count),
  };

  console.log('Current Record Counts:');
  console.log(`  • campaigns:         ${ref.campaigns}`);
  console.log(`  • leads:             ${ref.leads}`);
  console.log(`  • lead_activity_log: ${ref.leadActivityLog}`);
  console.log(`  • Total Records:     ${ref.campaigns + ref.leads + ref.leadActivityLog}\n`);

  return ref;
}

/**
 * Execute TRUNCATE operations
 */
async function executeTruncate(): Promise<void> {
  console.log('🗑️  Executing TRUNCATE operations...\n');

  try {
    // TRUNCATE with CASCADE to handle foreign key dependencies
    // RESTART IDENTITY resets auto-increment sequences
    await db.execute(sql`
      TRUNCATE TABLE lead_activity_log, leads, campaigns
      RESTART IDENTITY CASCADE;
    `);

    console.log('✅ TRUNCATE completed successfully\n');
  } catch (error) {
    console.error('❌ TRUNCATE failed:', error);
    throw error;
  }
}

/**
 * Verify tables are empty after wipe
 */
async function verifyWipe(): Promise<boolean> {
  console.log('🔍 Verifying wipe...\n');

  const campaignCount = await db.execute(sql`SELECT COUNT(*) FROM campaigns`);
  const leadCount = await db.execute(sql`SELECT COUNT(*) FROM leads`);
  const activityCount = await db.execute(sql`SELECT COUNT(*) FROM lead_activity_log`);

  const campaigns = Number(campaignCount.rows[0].count);
  const leads = Number(leadCount.rows[0].count);
  const activityLog = Number(activityCount.rows[0].count);

  console.log('Post-Wipe Record Counts:');
  console.log(`  • campaigns:         ${campaigns}`);
  console.log(`  • leads:             ${leads}`);
  console.log(`  • lead_activity_log: ${activityLog}\n`);

  const allEmpty = campaigns === 0 && leads === 0 && activityLog === 0;

  if (allEmpty) {
    console.log('✅ All tables successfully wiped\n');
  } else {
    console.error('❌ Wipe verification failed - tables not empty\n');
  }

  return allEmpty;
}

/**
 * Main execution
 */
async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║              DATABASE WIPE - STAGING ONLY                     ║');
  console.log('║         ⚠️  DESTRUCTIVE OPERATION - NO UNDO  ⚠️              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Safety Check 1: Require --confirm flag
  const args = process.argv.slice(2);
  if (!args.includes('--confirm')) {
    console.error('❌ ERROR: Missing --confirm flag');
    console.error('This script requires explicit confirmation due to destructive nature.');
    console.error('Usage: npm run tsx scripts/wipe-staging-db.ts --confirm\n');
    process.exit(1);
  }

  // Safety Check 2: Validate DATABASE_URL contains "staging"
  const dbUrl = process.env.DATABASE_URL || '';
  if (!dbUrl.toLowerCase().includes('staging') && !dbUrl.includes('uysp-portal-staging')) {
    console.error('❌ ERROR: DATABASE_URL does not appear to be staging');
    console.error('This script can only be run against staging databases.');
    console.error('DATABASE_URL must contain "staging" or "uysp-portal-staging".\n');
    process.exit(1);
  }

  console.log('✅ Safety checks passed');
  console.log(`📍 Target Database: ${dbUrl.split('@')[1]?.split('/')[0] || 'Unknown'}\n`);

  // Countdown
  console.log('⏳ Starting countdown...');
  for (let i = 10; i > 0; i--) {
    process.stdout.write(`   ${i} seconds until wipe...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    process.stdout.write('\r');
  }
  console.log('   0 seconds - EXECUTING NOW\n');

  try {
    // Step 1: Capture backup reference
    const backupRef = await captureBackupReference();

    // Step 2: Execute TRUNCATE
    await executeTruncate();

    // Step 3: Verify wipe
    const verified = await verifyWipe();

    if (!verified) {
      throw new Error('Wipe verification failed');
    }

    // Success
    console.log('═'.repeat(70));
    console.log('✅ DATABASE WIPE COMPLETE');
    console.log('═'.repeat(70));
    console.log(`⏰ Timestamp:     ${backupRef.timestamp.toISOString()}`);
    console.log(`📊 Records Wiped: ${backupRef.campaigns + backupRef.leads + backupRef.leadActivityLog}`);
    console.log('');
    console.log('Next Step: Run scripts/full-airtable-sync.ts to restore from Airtable');
    console.log('═'.repeat(70));

    process.exit(0);

  } catch (error) {
    console.error('\n╔══════════════════════════════════════════════════════════════╗');
    console.error('║                    WIPE FAILED                                ║');
    console.error('╚══════════════════════════════════════════════════════════════╝');
    console.error('Error:', error);
    console.error('');
    console.error('⚠️  Database may be in inconsistent state');
    console.error('Manual investigation required before proceeding');
    console.error('═'.repeat(70));

    process.exit(1);
  }
}

// Execute
if (require.main === module) {
  main();
}

export { captureBackupReference, executeTruncate, verifyWipe };
