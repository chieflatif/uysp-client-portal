/**
 * SINGLE-RECORD TEST SYNC SCRIPT
 *
 * PURPOSE:
 * Test the corrected sync logic on a single lead before running the full sync.
 * This is Part C of the Safety Protocol.
 *
 * WHAT IT DOES:
 * 1. Syncs ALL campaigns (needed for lookup map)
 * 2. Syncs ONE specific lead by Airtable Record ID
 * 3. Displays the synced lead's data for verification
 *
 * USAGE:
 * npm run tsx scripts/test-sync-single-lead.ts <LEAD_RECORD_ID>
 *
 * Example:
 * npm run tsx scripts/test-sync-single-lead.ts rec0CWXP3Sy9Mvsjj
 */

import { db } from '../src/lib/db';
import { campaigns, leads } from '../src/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { syncCampaignsFromAirtable } from '../src/lib/sync/sync-campaigns';
import { getAirtableClient } from '../src/lib/airtable/client';

// Configuration
const CLIENT_ID = process.env.DEFAULT_CLIENT_ID || '550e8400-e29b-41d4-a716-446655440000';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || '';

async function testSyncSingleLead(leadRecordId: string) {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║          SINGLE-RECORD TEST SYNC - SAFETY PROTOCOL           ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log(`📊 Test Lead Record ID: ${leadRecordId}`);
  console.log(`📊 Client ID: ${CLIENT_ID}`);
  console.log(`🗃️  Airtable Base: ${AIRTABLE_BASE_ID}\n`);

  // =================================================================
  // STEP 0: Clear test lead from database if exists
  // =================================================================
  console.log('🔄 Step 0: Clearing test lead from database (if exists)...');
  await db.delete(leads).where(eq(leads.airtableRecordId, leadRecordId));
  console.log(`✅ Test lead cleared from database\n`);

  // =================================================================
  // STEP 1: Sync ALL campaigns (needed for lookup map)
  // =================================================================
  console.log('🔄 Step 1: Syncing campaigns from Airtable...');
  const campaignResult = await syncCampaignsFromAirtable(CLIENT_ID, AIRTABLE_BASE_ID, false);
  console.log(`✅ Campaigns synced: ${campaignResult.synced} campaigns, ${campaignResult.errors} errors\n`);

  // =================================================================
  // STEP 2: Build campaign lookup map (same logic as Enhanced sync)
  // =================================================================
  console.log('🔄 Step 2: Building campaign lookup map...');
  const allCampaigns = await db.query.campaigns.findMany({
    columns: {
      id: true,
      name: true,
      messages: true,
    },
  });

  const campaignLookup = new Map<string, { id: string; messages: any }>();
  for (const campaign of allCampaigns) {
    const normalizedName = campaign.name.trim().toLowerCase();
    campaignLookup.set(normalizedName, {
      id: campaign.id,
      messages: campaign.messages,
    });
  }

  console.log(`✅ Built lookup map for ${campaignLookup.size} campaigns\n`);

  // =================================================================
  // STEP 3: Fetch and sync ONLY the test lead
  // =================================================================
  console.log(`🔄 Step 3: Fetching test lead ${leadRecordId} from Airtable...`);

  const airtable = getAirtableClient(AIRTABLE_BASE_ID);

  // Fetch specific lead record
  const record = await airtable.getRecord(leadRecordId);

  if (!record) {
    console.error(`❌ Lead ${leadRecordId} not found in Airtable!`);
    process.exit(1);
  }

  console.log(`✅ Found lead in Airtable`);
  console.log(`   Name: ${record.fields['First Name']} ${record.fields['Last Name']}`);
  console.log(`   Email: ${record.fields['Email']}`);
  console.log(`   Campaign (CORRECTED): ${record.fields['Campaign (CORRECTED)']}\n`);

  // Map to database format
  const leadData = airtable.mapToDatabaseLead(record, CLIENT_ID);

  // PART B.2: Calculate enrolled_message_count using Campaign (CORRECTED)
  let enrolledMessageCount = 0;
  let matchedCampaignId: string | undefined;

  const campaignCorrectedField = record.fields['Campaign (CORRECTED)'] as string | undefined;

  if (campaignCorrectedField) {
    const normalizedCampaignName = campaignCorrectedField.trim().toLowerCase();
    const campaignInfo = campaignLookup.get(normalizedCampaignName);

    if (campaignInfo) {
      matchedCampaignId = campaignInfo.id;

      if (campaignInfo.messages && Array.isArray(campaignInfo.messages)) {
        enrolledMessageCount = campaignInfo.messages.length;
      }
    }
  }

  // TASK 2.3: Reconciliation logic
  let smsSequencePosition = leadData.smsSequencePosition;
  let completedAt = leadData.completedAt;

  if (leadData.processingStatus === 'Completed') {
    smsSequencePosition = 0;
    if (!completedAt) {
      completedAt = new Date();
    }
  }

  console.log('🔄 Step 4: Inserting lead into database...');

  // Insert lead
  await db.insert(leads).values({
    airtableRecordId: leadData.airtableRecordId!,
    clientId: leadData.clientId!,
    firstName: leadData.firstName!,
    lastName: leadData.lastName || '',
    email: leadData.email || '',
    phone: leadData.phone,
    company: leadData.company,
    title: leadData.title,
    icpScore: leadData.icpScore || 0,
    status: leadData.status || 'New',
    isActive: leadData.isActive !== false,
    processingStatus: leadData.processingStatus,
    smsSequencePosition: smsSequencePosition,
    completedAt: completedAt,
    enrolledMessageCount: enrolledMessageCount,
    campaignId: matchedCampaignId || null,
    campaignName: leadData.campaignName,
    leadSource: leadData.leadSource,
    formId: leadData.formId,
    createdAt: leadData.createdAt || new Date(),
  });

  console.log(`✅ Lead inserted into database\n`);

  // =================================================================
  // STEP 5: Verification - Query and display the synced lead
  // =================================================================
  console.log('═══════════════════════════════════════════════════════════');
  console.log('VERIFICATION RESULTS');
  console.log('═══════════════════════════════════════════════════════════\n');

  const syncedLead = await db.query.leads.findFirst({
    where: eq(leads.airtableRecordId, leadRecordId),
    with: {
      campaign: {
        columns: {
          id: true,
          name: true,
          messages: true,
        },
      },
    },
  });

  if (!syncedLead) {
    console.error('❌ FAILED: Lead not found in database after sync!');
    process.exit(1);
  }

  console.log('✅ Test Lead Data:');
  console.log(`   Airtable Record ID: ${syncedLead.airtableRecordId}`);
  console.log(`   Name: ${syncedLead.firstName} ${syncedLead.lastName}`);
  console.log(`   Email: ${syncedLead.email}`);
  console.log(`   Processing Status: ${syncedLead.processingStatus || 'null'}`);
  console.log(`   SMS Sequence Position: ${syncedLead.smsSequencePosition}`);
  console.log(`   Completed At: ${syncedLead.completedAt?.toISOString() || 'null'}`);
  console.log(`   enrolled_message_count: ${syncedLead.enrolledMessageCount} ${syncedLead.enrolledMessageCount > 0 ? '✅' : '❌'}`);
  console.log(`   campaign_id: ${syncedLead.campaignId || 'null'} ${syncedLead.campaignId ? '✅' : '❌'}`);

  if (syncedLead.campaign) {
    console.log(`\n✅ Matched Campaign:`);
    console.log(`   ID: ${syncedLead.campaign.id}`);
    console.log(`   Name: ${syncedLead.campaign.name}`);
    console.log(`   Message Count: ${syncedLead.campaign.messages && Array.isArray(syncedLead.campaign.messages) ? syncedLead.campaign.messages.length : 0}`);
  } else {
    console.log(`\n⚠️  No campaign matched (campaign_id is null)`);
  }

  // =================================================================
  // SUCCESS CRITERIA CHECK
  // =================================================================
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('SUCCESS CRITERIA');
  console.log('═══════════════════════════════════════════════════════════\n');

  const passed: string[] = [];
  const failed: string[] = [];

  if (syncedLead.enrolledMessageCount > 0) {
    passed.push('✅ enrolled_message_count > 0');
  } else {
    failed.push('❌ enrolled_message_count is 0 (should be > 0)');
  }

  if (syncedLead.campaignId) {
    passed.push('✅ campaign_id is set');
  } else {
    failed.push('❌ campaign_id is null (should be set)');
  }

  if (syncedLead.processingStatus === 'Completed') {
    if (syncedLead.smsSequencePosition === 0) {
      passed.push('✅ Completed lead has sms_sequence_position = 0');
    } else {
      failed.push(`❌ Completed lead has sms_sequence_position = ${syncedLead.smsSequencePosition} (should be 0)`);
    }

    if (syncedLead.completedAt) {
      passed.push('✅ Completed lead has completed_at timestamp');
    } else {
      failed.push('❌ Completed lead missing completed_at timestamp');
    }
  }

  passed.forEach(msg => console.log(msg));
  failed.forEach(msg => console.log(msg));

  if (failed.length > 0) {
    console.log('\n❌ TEST FAILED: Some criteria not met. DO NOT proceed with full sync.');
    console.log('   Review the issues above and fix the sync logic.');
    process.exit(1);
  } else {
    console.log('\n✅ ALL TESTS PASSED!');
    console.log('   Safe to proceed with full sync (wipe + full-airtable-sync-ENHANCED.ts)');
    process.exit(0);
  }
}

// Execute
if (require.main === module) {
  const leadRecordId = process.argv[2];

  if (!leadRecordId) {
    console.error('❌ Usage: npm run tsx scripts/test-sync-single-lead.ts <LEAD_RECORD_ID>');
    console.error('   Example: npm run tsx scripts/test-sync-single-lead.ts rec0CWXP3Sy9Mvsjj');
    process.exit(1);
  }

  testSyncSingleLead(leadRecordId)
    .catch((error) => {
      console.error('\n❌ Test sync failed:', error);
      process.exit(1);
    });
}

export { testSyncSingleLead };
