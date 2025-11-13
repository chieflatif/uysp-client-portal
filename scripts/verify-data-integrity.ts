/**
 * DATA INTEGRITY VERIFICATION SCRIPT
 *
 * PURPOSE: Run 5 SQL verification queries to validate Enhanced Great Sync results
 *
 * USAGE:
 * npm run tsx scripts/verify-data-integrity.ts
 */

import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function runVerificationQueries() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║         DATA INTEGRITY VERIFICATION - PHASE 6                ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const startTime = new Date();
  console.log(`⏰ Start Time: ${startTime.toISOString()}\n`);

  // =================================================================
  // QUERY 1: enrolled_message_count Distribution
  // =================================================================
  console.log('═'.repeat(70));
  console.log('QUERY 1: enrolled_message_count Distribution');
  console.log('═'.repeat(70));
  console.log('Expected: Various counts (3, 4, 5, etc.), NOT all zeros\n');

  const query1 = await db.execute(sql`
    SELECT
      enrolled_message_count,
      COUNT(*) as lead_count
    FROM leads
    GROUP BY enrolled_message_count
    ORDER BY enrolled_message_count;
  `);

  console.table(query1);

  // Calculate stats
  const totalLeads = query1.reduce((sum, row: any) => sum + parseInt(row.lead_count), 0);
  const zeroCount = query1.find((row: any) => row.enrolled_message_count === 0);
  const nonZeroCount = totalLeads - (zeroCount ? parseInt((zeroCount as any).lead_count) : 0);

  console.log(`\n📊 Summary:`);
  console.log(`   Total leads: ${totalLeads}`);
  console.log(`   Leads with enrolled_message_count = 0: ${zeroCount ? (zeroCount as any).lead_count : 0}`);
  console.log(`   Leads with enrolled_message_count > 0: ${nonZeroCount}`);

  const query1Pass = nonZeroCount > 0;
  console.log(`   ${query1Pass ? '✅ PASS' : '❌ FAIL'}: ${query1Pass ? 'enrolled_message_count populated' : 'All counts are zero'}\n`);

  // =================================================================
  // QUERY 2: Specific Test Lead (rec0CWXP3Sy9Mvsjj)
  // =================================================================
  console.log('═'.repeat(70));
  console.log('QUERY 2: Specific Test Lead (rec0CWXP3Sy9Mvsjj)');
  console.log('═'.repeat(70));
  console.log('Expected: enrolled_message_count > 0, valid processing_status\n');

  const query2 = await db.execute(sql`
    SELECT
      airtable_record_id,
      processing_status,
      sms_sequence_position,
      enrolled_message_count,
      completed_at
    FROM leads
    WHERE airtable_record_id = 'rec0CWXP3Sy9Mvsjj';
  `);

  console.table(query2);

  const testLead = query2[0] as any;
  if (testLead) {
    console.log(`\n📊 Analysis:`);
    console.log(`   processing_status: ${testLead.processing_status}`);
    console.log(`   sms_sequence_position: ${testLead.sms_sequence_position}`);
    console.log(`   enrolled_message_count: ${testLead.enrolled_message_count}`);
    console.log(`   completed_at: ${testLead.completed_at || 'NULL'}`);

    const query2Pass = testLead.enrolled_message_count > 0;
    console.log(`   ${query2Pass ? '✅ PASS' : '❌ FAIL'}: ${query2Pass ? 'enrolled_message_count correctly populated' : 'enrolled_message_count is zero'}\n`);
  } else {
    console.log(`   ❌ FAIL: Test lead not found in database\n`);
  }

  // =================================================================
  // QUERY 3: SMS Activity Count
  // =================================================================
  console.log('═'.repeat(70));
  console.log('QUERY 3: SMS Activity Count');
  console.log('═'.repeat(70));
  console.log('Expected: Should match total SMS_Audit records in Airtable (400-500+)\n');

  const query3 = await db.execute(sql`
    SELECT COUNT(*) as sms_activity_count
    FROM lead_activity_log
    WHERE event_type = 'SMS_SENT';
  `);

  console.table(query3);

  const smsCount = parseInt((query3[0] as any).sms_activity_count);
  console.log(`\n📊 Summary:`);
  console.log(`   SMS_SENT activity records: ${smsCount}`);

  const query3Pass = smsCount > 0;
  console.log(`   ${query3Pass ? '✅ PASS' : '❌ FAIL'}: ${query3Pass ? 'SMS audit data synced successfully' : 'No SMS activity found'}\n`);

  // =================================================================
  // QUERY 4: Activity Timeline for Test Lead
  // =================================================================
  console.log('═'.repeat(70));
  console.log('QUERY 4: Activity Timeline for Test Lead (rec0CWXP3Sy9Mvsjj)');
  console.log('═'.repeat(70));
  console.log('Expected: SMS_SENT events with timestamps and message content\n');

  const query4 = await db.execute(sql`
    SELECT
      timestamp,
      event_type,
      description,
      message_content
    FROM lead_activity_log
    WHERE lead_airtable_id = 'rec0CWXP3Sy9Mvsjj'
    ORDER BY timestamp DESC
    LIMIT 10;
  `);

  console.table(query4);

  const activityCount = query4.length;
  console.log(`\n📊 Summary:`);
  console.log(`   Activity records for test lead: ${activityCount}`);

  const query4Pass = activityCount > 0;
  console.log(`   ${query4Pass ? '✅ PASS' : '❌ FAIL'}: ${query4Pass ? 'Activity timeline populated' : 'No activity found for test lead'}\n`);

  // =================================================================
  // QUERY 5: Completed Leads Reconciliation Check
  // =================================================================
  console.log('═'.repeat(70));
  console.log('QUERY 5: Completed Leads Reconciliation Check');
  console.log('═'.repeat(70));
  console.log('Expected: All Completed leads have sms_sequence_position = 0 and completed_at set\n');

  const query5 = await db.execute(sql`
    SELECT
      COUNT(*) as completed_leads,
      COUNT(CASE WHEN sms_sequence_position != 0 THEN 1 END) as incorrect_position,
      COUNT(CASE WHEN completed_at IS NULL THEN 1 END) as missing_completed_at
    FROM leads
    WHERE processing_status = 'Completed';
  `);

  console.table(query5);

  const completedStats = query5[0] as any;
  console.log(`\n📊 Summary:`);
  console.log(`   Total Completed leads: ${completedStats.completed_leads}`);
  console.log(`   Leads with incorrect sms_sequence_position (!=0): ${completedStats.incorrect_position}`);
  console.log(`   Leads with missing completed_at: ${completedStats.missing_completed_at}`);

  const query5Pass = completedStats.incorrect_position === '0' && completedStats.missing_completed_at === '0';
  console.log(`   ${query5Pass ? '✅ PASS' : '❌ FAIL'}: ${query5Pass ? 'All Completed leads reconciled correctly' : 'Some Completed leads have data inconsistencies'}\n`);

  // =================================================================
  // FINAL SUMMARY
  // =================================================================
  const endTime = new Date();
  const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

  console.log('\n' + '═'.repeat(70));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('═'.repeat(70));
  console.log(`⏰ Start Time:  ${startTime.toISOString()}`);
  console.log(`⏰ End Time:    ${endTime.toISOString()}`);
  console.log(`⏱️  Duration:    ${duration} seconds`);
  console.log('');
  console.log(`Query 1 (enrolled_message_count): ${query1Pass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Query 2 (Test Lead Data):         ${testLead && testLead.enrolled_message_count > 0 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Query 3 (SMS Activity Count):     ${query3Pass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Query 4 (Activity Timeline):      ${query4Pass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Query 5 (Completed Reconcile):    ${query5Pass ? '✅ PASS' : '❌ FAIL'}`);
  console.log('═'.repeat(70));

  const allPass = query1Pass &&
                  (testLead && testLead.enrolled_message_count > 0) &&
                  query3Pass &&
                  query4Pass &&
                  query5Pass;

  if (allPass) {
    console.log('\n✅ SUCCESS: All verification queries passed!');
    console.log('   Data integrity has been restored.');
  } else {
    console.log('\n⚠️  PARTIAL SUCCESS: Some verification queries failed.');
    console.log('   Review the details above for more information.');
  }

  console.log('');
}

// Execute if run directly
if (require.main === module) {
  runVerificationQueries()
    .then(() => {
      console.log('✅ Verification complete. Exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Verification failed:', error);
      process.exit(1);
    });
}

export { runVerificationQueries };
