/**
 * DIAGNOSTIC SCRIPT: enrolled_message_count Issue
 *
 * PURPOSE: Identify why enrolled_message_count is zero for all leads
 */

import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function runDiagnostics() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║       DIAGNOSTIC: enrolled_message_count Issue               ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // =================================================================
  // CHECK 1: Do campaigns have airtable_record_id values?
  // =================================================================
  console.log('═══════════════════════════════════════════════════════════');
  console.log('CHECK 1: Campaigns airtable_record_id Values');
  console.log('═══════════════════════════════════════════════════════════\n');

  const campaigns = await db.execute(sql`
    SELECT
      id,
      name,
      airtable_record_id,
      messages
    FROM campaigns
    LIMIT 5;
  `);

  console.log('First 5 campaigns:');
  console.table(campaigns);

  const campaignsWithAirtableId = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM campaigns
    WHERE airtable_record_id IS NOT NULL AND airtable_record_id != '';
  `);

  console.log(`\nCampaigns with airtable_record_id: ${(campaignsWithAirtableId[0] as any).count} / 26`);

  // =================================================================
  // CHECK 2: Do campaigns have messages arrays?
  // =================================================================
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('CHECK 2: Campaigns with Non-Empty Messages');
  console.log('═══════════════════════════════════════════════════════════\n');

  const campaignsWithMessages = await db.execute(sql`
    SELECT
      id,
      name,
      airtable_record_id,
      jsonb_array_length(messages) as message_count
    FROM campaigns
    WHERE messages IS NOT NULL
      AND jsonb_array_length(messages) > 0
    LIMIT 5;
  `);

  console.log('Campaigns with messages:');
  console.table(campaignsWithMessages);

  const totalWithMessages = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM campaigns
    WHERE messages IS NOT NULL
      AND jsonb_array_length(messages) > 0;
  `);

  console.log(`\nTotal campaigns with messages: ${(totalWithMessages[0] as any).count} / 26`);

  // =================================================================
  // CHECK 3: Sample lead record - what's in the 'Campaign' field?
  // =================================================================
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('CHECK 3: Sample Airtable Lead Data');
  console.log('═══════════════════════════════════════════════════════════\n');

  // We need to query Airtable to see what the 'Campaign' field looks like
  console.log('⚠️  Note: This requires direct Airtable API call to inspect raw field data');
  console.log('   The script logic assumes record.fields["Campaign"] is an array of record IDs');
  console.log('   But we need to verify this assumption against actual Airtable data\n');

  // =================================================================
  // CHECK 4: Cross-reference - do any leads have Campaign link?
  // =================================================================
  console.log('═══════════════════════════════════════════════════════════');
  console.log('CHECK 4: PostgreSQL Leads Campaign Linkage');
  console.log('═══════════════════════════════════════════════════════════\n');

  const leadsWithCampaign = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM leads
    WHERE campaign_id IS NOT NULL;
  `);

  console.log(`Leads with campaign_id set: ${(leadsWithCampaign[0] as any).count} / 1255`);

  const sampleLead = await db.execute(sql`
    SELECT
      airtable_record_id,
      campaign_id,
      campaign_name,
      enrolled_message_count
    FROM leads
    WHERE airtable_record_id = 'rec0CWXP3Sy9Mvsjj';
  `);

  console.log('\nTest lead (rec0CWXP3Sy9Mvsjj):');
  console.table(sampleLead);

  // =================================================================
  // ROOT CAUSE ANALYSIS
  // =================================================================
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('ROOT CAUSE ANALYSIS');
  console.log('═══════════════════════════════════════════════════════════\n');

  const campaignsNoAirtableId = 26 - parseInt((campaignsWithAirtableId[0] as any).count);
  const campaignsNoMessages = 26 - parseInt((totalWithMessages[0] as any).count);

  if (campaignsNoAirtableId > 0) {
    console.log(`❌ ISSUE 1: ${campaignsNoAirtableId} campaigns missing airtable_record_id`);
    console.log('   This breaks the lookup map! Campaigns cannot be matched to leads.');
  } else {
    console.log(`✅ All campaigns have airtable_record_id`);
  }

  if (campaignsNoMessages > 0) {
    console.log(`❌ ISSUE 2: ${campaignsNoMessages} campaigns missing messages array`);
    console.log('   enrolled_message_count cannot be calculated without messages.');
  } else {
    console.log(`✅ All campaigns have messages array`);
  }

  console.log('\n💡 NEXT STEPS:');
  console.log('   1. Verify Airtable Lead records have "Campaign" field populated');
  console.log('   2. Check if Airtable field name is exactly "Campaign" (case-sensitive)');
  console.log('   3. Verify campaigns.airtableRecordId matches Airtable Campaign record IDs');
  console.log('   4. Add debug logging to see campaignAirtableId values during sync');
}

// Execute
if (require.main === module) {
  runDiagnostics()
    .then(() => {
      console.log('\n✅ Diagnostics complete. Exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Diagnostics failed:', error);
      process.exit(1);
    });
}

export { runDiagnostics };
