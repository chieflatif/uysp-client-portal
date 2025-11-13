/**
 * WIPE STAGING DATA SCRIPT
 *
 * PURPOSE: Clean slate for Enhanced Great Sync execution
 * SAFETY: Only wipes campaigns, leads, and lead_activity_log tables
 *
 * USAGE:
 * npm run tsx scripts/wipe-staging-data.ts
 */

import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function wipeData() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║              WIPE STAGING DATA - CLEAN SLATE                  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const startTime = new Date();
  console.log(`⏰ Start Time: ${startTime.toISOString()}`);
  console.log('⚠️  WARNING: This will DELETE all data from:');
  console.log('   - campaigns');
  console.log('   - leads');
  console.log('   - lead_activity_log');
  console.log('');

  try {
    console.log('🔄 Executing TRUNCATE command...\n');

    // TRUNCATE tables with CASCADE to handle foreign key dependencies
    await db.execute(sql`
      TRUNCATE TABLE campaigns, leads, lead_activity_log RESTART IDENTITY CASCADE;
    `);

    console.log('✅ Tables wiped successfully!\n');

    // Verify tables are empty
    console.log('🔍 Verifying empty state...');

    const campaignCount = await db.execute(sql`SELECT COUNT(*) as count FROM campaigns;`);
    const leadCount = await db.execute(sql`SELECT COUNT(*) as count FROM leads;`);
    const activityCount = await db.execute(sql`SELECT COUNT(*) as count FROM lead_activity_log;`);

    console.log(`   Campaigns: ${(campaignCount[0] as any).count} records`);
    console.log(`   Leads: ${(leadCount[0] as any).count} records`);
    console.log(`   Activity Log: ${(activityCount[0] as any).count} records`);

    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

    console.log('\n' + '═'.repeat(70));
    console.log('✅ WIPE COMPLETE');
    console.log('═'.repeat(70));
    console.log(`⏰ Start Time:  ${startTime.toISOString()}`);
    console.log(`⏰ End Time:    ${endTime.toISOString()}`);
    console.log(`⏱️  Duration:    ${duration} seconds`);
    console.log('═'.repeat(70));
    console.log('\n✅ Database is ready for Enhanced Great Sync execution.');

  } catch (error) {
    console.error('\n❌ WIPE FAILED:', error);
    throw error;
  }
}

// Execute if run directly
if (require.main === module) {
  wipeData()
    .then(() => {
      console.log('\n✅ Script execution complete. Exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script execution failed:', error);
      process.exit(1);
    });
}

export { wipeData };
