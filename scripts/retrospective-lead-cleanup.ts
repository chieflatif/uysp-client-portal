#!/usr/bin/env tsx
/**
 * Retrospective Lead Status Cleanup Script
 *
 * This one-time script is designed to correct lead statuses in Airtable.
 * It aligns the main 'Leads' table with the ground truth from the 'SMS_Audit' log.
 *
 * Operations:
 * 1. Fetches all 'Sent' events from the SMS_Audit log since the go-live date.
 * 2. Compiles a unique list of all leads that have received at least one SMS.
 * 3. Updates the 'Processing Status' of these unique leads to 'Completed'.
 * 4. Performs the updates in safe batches of 10 to respect API rate limits.
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from the project's .env.local file
config({ path: resolve(__dirname, '../.env.local') });

import { getAirtableClient } from '../src/lib/airtable/client';

const AIRTABLE_BASE_ID = 'app4wIsBfpJTg7pWS';
const LEADS_TABLE_ID = 'tblYUvhGADerbD8EO';
const SMS_AUDIT_TABLE_ID = 'tbl5TOGNGdWXTjhzP';
const GO_LIVE_DATE = '2025-11-05';

async function cleanupLeadStatuses() {
  console.log('🚀 Starting retrospective lead status cleanup...');

  if (!process.env.AIRTABLE_API_KEY) {
    console.error('❌ FATAL: AIRTABLE_API_KEY is not set. Please ensure it is available in .env.local');
    process.exit(1);
  }

  try {
    const airtable = getAirtableClient(AIRTABLE_BASE_ID);

    // 1. Fetch all sent records from the SMS_Audit log
    console.log(`🔍 Fetching all sent message records from SMS_Audit since ${GO_LIVE_DATE}...`);
    const sentRecords = await airtable.listRecords(SMS_AUDIT_TABLE_ID, {
      filterByFormula: `AND({Event} = 'Sent', IS_AFTER({Sent At}, '${GO_LIVE_DATE}'))`,
      fields: ['Lead Record ID (from SMS Audit)'],
    });
    console.log(`✅ Found ${sentRecords.length} total sent message events.`);

    if (sentRecords.length === 0) {
      console.log('⚠️ No sent records found. No updates to perform. Exiting.');
      return;
    }

    // 2. Compile a unique list of lead record IDs
    const leadIdsToUpdate = new Set<string>();
    sentRecords.forEach((record: any) => {
      const leadRecordIds = record.fields['Lead Record ID (from SMS Audit)'];
      if (leadRecordIds && leadRecordIds.length > 0) {
        leadIdsToUpdate.add(leadRecordIds[0]);
      }
    });

    const uniqueLeadsCount = leadIdsToUpdate.size;
    console.log(`📊 Compiled a list of ${uniqueLeadsCount} unique leads to update to 'Completed'.`);

    if (uniqueLeadsCount === 0) {
      console.log('⚠️ No unique leads to update. Exiting.');
      return;
    }

    // 3. Prepare the update payloads
    const updatePayloads = Array.from(leadIdsToUpdate).map(id => ({
      id,
      fields: {
        'Processing Status': 'Completed',
      },
    }));

    // 4. Perform the updates in batches of 10
    console.log('🔄 Starting Airtable updates in batches of 10...');
    const batchSize = 10;
    let updatedCount = 0;
    for (let i = 0; i < updatePayloads.length; i += batchSize) {
      const batch = updatePayloads.slice(i, i + batchSize);
      try {
        await airtable.updateRecords(LEADS_TABLE_ID, batch);
        updatedCount += batch.length;
        console.log(`   - Batch ${Math.ceil(updatedCount / batchSize)}/${Math.ceil(uniqueLeadsCount / batchSize)} complete. ${updatedCount}/${uniqueLeadsCount} leads updated.`);
      } catch (error: any) {
        console.error(`❌ Error updating batch starting at index ${i}:`, error.message);
        // Continue to the next batch
      }
    }

    console.log(`\n🎉 Cleanup complete! Successfully updated ${updatedCount} out of ${uniqueLeadsCount} leads to 'Completed'.`);

  } catch (error: any) {
    console.error('❌ An unexpected error occurred during the cleanup process:', error.message);
    process.exit(1);
  }
}

cleanupLeadStatuses();
