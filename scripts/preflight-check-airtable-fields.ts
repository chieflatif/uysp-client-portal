/**
 * PRE-FLIGHT CHECK: Airtable Field Verification
 *
 * PURPOSE: Verify ALL required Airtable fields exist and have data
 * BEFORE running the full sync (to avoid 30-minute failures)
 */

import { getAirtableClient } from '../src/lib/airtable/client';

const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'app4wIsBfpJTg7pWS';
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;

async function preflightCheck() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║           PRE-FLIGHT CHECK: Airtable Field Verification      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  if (!AIRTABLE_API_KEY) {
    console.error('❌ AIRTABLE_API_KEY not set!');
    process.exit(1);
  }

  const airtable = getAirtableClient(AIRTABLE_BASE_ID);

  // =================================================================
  // CHECK 1: Campaigns Table - Messages Field
  // =================================================================
  console.log('═'.repeat(70));
  console.log('CHECK 1: Campaigns Table - Messages Field');
  console.log('═'.repeat(70));

  let campaignSample: any = null;
  let campaignCount = 0;
  let campaignsWithMessages = 0;
  let campaignsWithEmptyMessages = 0;
  let maxMessageCount = 0;
  let minMessageCount = Infinity;

  await airtable.streamAllCampaigns(async (record) => {
    campaignCount++;
    if (!campaignSample) campaignSample = record;

    // Check for messages field (try common variations)
    const fields = record.fields;
    const messagesField = fields['Messages'] || fields['Message Sequence'] || fields['SMS Messages'];

    if (messagesField) {
      if (Array.isArray(messagesField) && messagesField.length > 0) {
        campaignsWithMessages++;
        const count = messagesField.length;
        maxMessageCount = Math.max(maxMessageCount, count);
        minMessageCount = Math.min(minMessageCount, count);
      } else {
        campaignsWithEmptyMessages++;
      }
    }
  });

  console.log(`\n📊 Campaign Analysis:`);
  console.log(`   Total campaigns: ${campaignCount}`);
  console.log(`   Campaigns with Messages field populated: ${campaignsWithMessages}`);
  console.log(`   Campaigns with empty/null Messages: ${campaignsWithEmptyMessages}`);
  console.log(`   Message count range: ${minMessageCount === Infinity ? 'N/A' : minMessageCount}-${maxMessageCount}`);

  if (campaignSample) {
    console.log(`\n📋 Sample Campaign Fields (${campaignSample.fields['Campaign Name']}):`);
    console.log(`   Available fields: ${Object.keys(campaignSample.fields).join(', ')}`);

    // Check specifically for messages-related fields
    const messagesField = campaignSample.fields['Messages'] ||
                         campaignSample.fields['Message Sequence'] ||
                         campaignSample.fields['SMS Messages'];

    if (messagesField) {
      console.log(`\n✅ Messages field found!`);
      console.log(`   Field name: ${Object.keys(campaignSample.fields).find(k => campaignSample.fields[k] === messagesField)}`);
      console.log(`   Type: ${Array.isArray(messagesField) ? 'Array' : typeof messagesField}`);
      if (Array.isArray(messagesField)) {
        console.log(`   Length: ${messagesField.length}`);
        console.log(`   Sample: ${JSON.stringify(messagesField[0], null, 2).substring(0, 200)}...`);
      }
    } else {
      console.log(`\n❌ NO MESSAGES FIELD FOUND!`);
      console.log(`   This is the ROOT CAUSE. Cannot calculate enrolled_message_count.`);
    }
  }

  // =================================================================
  // CHECK 2: Leads Table - Campaign Link Field
  // =================================================================
  console.log('\n' + '═'.repeat(70));
  console.log('CHECK 2: Leads Table - Campaign Link Field');
  console.log('═'.repeat(70));

  let leadSample: any = null;
  let leadCount = 0;
  let leadsWithCampaign = 0;
  let leadsWithoutCampaign = 0;

  await airtable.streamAllLeads(async (record) => {
    leadCount++;
    if (!leadSample) leadSample = record;

    const campaignLink = record.fields['Campaign'];
    if (campaignLink && Array.isArray(campaignLink) && campaignLink.length > 0) {
      leadsWithCampaign++;
    } else {
      leadsWithoutCampaign++;
    }

    // Stop after 100 leads for performance
    if (leadCount >= 100) {
      return;
    }
  });

  console.log(`\n📊 Lead Analysis (sampled first 100):`);
  console.log(`   Leads with Campaign link: ${leadsWithCampaign}`);
  console.log(`   Leads without Campaign link: ${leadsWithoutCampaign}`);

  if (leadSample) {
    console.log(`\n📋 Sample Lead Fields:`);
    console.log(`   Campaign field: ${leadSample.fields['Campaign'] ? JSON.stringify(leadSample.fields['Campaign']) : 'null'}`);

    if (leadSample.fields['Campaign']) {
      console.log(`   ✅ Campaign link field exists and has format: ${Array.isArray(leadSample.fields['Campaign']) ? 'Array of Record IDs' : 'Unknown'}`);
    } else {
      console.log(`   ⚠️  This lead has no Campaign link (might be unassigned)`);
    }
  }

  // =================================================================
  // CHECK 3: SMS_Audit Table - Lead Record ID Field
  // =================================================================
  console.log('\n' + '═'.repeat(70));
  console.log('CHECK 3: SMS_Audit Table - Lead Record ID Field');
  console.log('═'.repeat(70));

  let smsAuditSample: any = null;
  let smsAuditCount = 0;
  let smsWithLeadId = 0;
  let smsWithoutLeadId = 0;
  let smsWithoutTimestamp = 0;

  const smsResponse = await airtable.getAllSmsAudit();
  const smsRecords = smsResponse.records;

  for (const record of smsRecords) {
    smsAuditCount++;
    if (!smsAuditSample) smsAuditSample = record;

    const leadRecordId = record.fields['Lead Record ID'];
    const sentAt = record.fields['Sent At'];

    if (leadRecordId) {
      smsWithLeadId++;
    } else {
      smsWithoutLeadId++;
    }

    if (!sentAt) {
      smsWithoutTimestamp++;
    }
  }

  console.log(`\n📊 SMS Audit Analysis (first page - ${smsAuditCount} records):`);
  console.log(`   SMS with Lead Record ID: ${smsWithLeadId}`);
  console.log(`   SMS without Lead Record ID: ${smsWithoutLeadId}`);
  console.log(`   SMS without Sent At timestamp: ${smsWithoutTimestamp}`);

  if (smsAuditSample) {
    console.log(`\n📋 Sample SMS Audit Fields:`);
    console.log(`   Available fields: ${Object.keys(smsAuditSample.fields).join(', ')}`);
    console.log(`   Lead Record ID: ${smsAuditSample.fields['Lead Record ID'] || 'null'}`);
    console.log(`   Sent At: ${smsAuditSample.fields['Sent At'] || 'null'}`);
    console.log(`   Text: ${(smsAuditSample.fields['Text'] as string || '').substring(0, 50)}...`);
  }

  // =================================================================
  // FINAL VERDICT
  // =================================================================
  console.log('\n' + '═'.repeat(70));
  console.log('FINAL VERDICT');
  console.log('═'.repeat(70));

  const issues: string[] = [];

  if (campaignsWithMessages === 0) {
    issues.push('❌ CRITICAL: NO campaigns have Messages field populated!');
  } else if (campaignsWithMessages < campaignCount) {
    issues.push(`⚠️  WARNING: Only ${campaignsWithMessages}/${campaignCount} campaigns have Messages field.`);
  } else {
    console.log(`✅ All ${campaignCount} campaigns have Messages field populated.`);
  }

  if (leadsWithoutCampaign === 100) {
    issues.push('❌ CRITICAL: NONE of the sampled leads have Campaign links!');
  } else if (leadsWithoutCampaign > 50) {
    issues.push(`⚠️  WARNING: ${leadsWithoutCampaign}/100 sampled leads have no Campaign link.`);
  } else {
    console.log(`✅ ${leadsWithCampaign}/100 sampled leads have Campaign links.`);
  }

  if (smsWithLeadId === 0) {
    issues.push('❌ CRITICAL: NO SMS audit records have Lead Record ID!');
  } else if (smsWithoutLeadId > smsWithLeadId) {
    issues.push(`⚠️  WARNING: ${smsWithoutLeadId}/${smsAuditCount} SMS records missing Lead Record ID.`);
  } else {
    console.log(`✅ ${smsWithLeadId}/${smsAuditCount} SMS records have Lead Record ID.`);
  }

  if (issues.length > 0) {
    console.log('\n🔴 ISSUES DETECTED:');
    issues.forEach(issue => console.log(`   ${issue}`));
    console.log('\n❌ DO NOT PROCEED WITH SYNC UNTIL THESE ISSUES ARE RESOLVED!');
    process.exit(1);
  } else {
    console.log('\n✅ ALL PRE-FLIGHT CHECKS PASSED!');
    console.log('   Safe to proceed with sync.');
  }
}

// Execute
if (require.main === module) {
  preflightCheck()
    .then(() => {
      console.log('\n✅ Pre-flight check complete. Exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Pre-flight check failed:', error);
      process.exit(1);
    });
}

export { preflightCheck };
