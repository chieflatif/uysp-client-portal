#!/usr/bin/env tsx
/**
 * Retrospective Lead Activity Log Backfill Script
 *
 * This one-time script is designed to backfill the `leadActivityLog` with historical
 * SMS and campaign completion events based on the Airtable `SMS_Audit` log, which serves
 * as the ground truth for all messages sent prior to the implementation of the new logging system.
 *
 * Operations:
 * 1. Fetches all 'Sent' events from the SMS_Audit log since the go-live date.
 * 2. For each audit record, finds the corresponding lead in PostgreSQL.
 * 3. Creates two `leadActivityLog` entries for each message:
 *    - A 'SMS_SENT' event.
 *    - A 'CAMPAIGN_COMPLETED' event (assuming all past campaigns were single-message).
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from the project's .env.local file BEFORE touching db modules
config({ path: resolve(__dirname, '../.env.local') });

const AIRTABLE_BASE_ID = 'app4wIsBfpJTg7pWS';
const SMS_AUDIT_TABLE_ID = 'tbl5TOGNGdWXTjhzP';
const GO_LIVE_DATE = '2025-11-05';

async function backfillActivityLog() {
  console.log('🚀 Starting retrospective activity log backfill...');

  if (!process.env.AIRTABLE_API_KEY || !process.env.DATABASE_URL) {
    console.error('❌ FATAL: AIRTABLE_API_KEY and DATABASE_URL must be set in .env.local');
    process.exit(1);
  }

  try {
    const [{ getAirtableClient }, { db }, { leads, leadActivityLog }, { eq }] = await Promise.all([
      import('../src/lib/airtable/client'),
      import('../src/lib/db'),
      import('../src/lib/db/schema'),
      import('drizzle-orm'),
    ]);

    const airtable = getAirtableClient(AIRTABLE_BASE_ID);

    // 1. Fetch all sent records from the SMS_Audit log
    console.log(`🔍 Fetching all sent message records from SMS_Audit since ${GO_LIVE_DATE}...`);
    const sentRecords = await airtable.listRecords(SMS_AUDIT_TABLE_ID, {
      filterByFormula: `AND({Event} = 'Sent', IS_AFTER({Sent At}, '${GO_LIVE_DATE}'))`,
      fields: ['Lead Record ID (from SMS Audit)', 'SMS Campaign ID', 'Text', 'Sent At'],
    });
    console.log(`✅ Found ${sentRecords.length} total sent message events to backfill.`);

    if (sentRecords.length === 0) {
      console.log('⚠️ No sent records found. No backfill to perform. Exiting.');
      return;
    }

    let logsCreated = 0;
    for (const record of sentRecords) {
      const fields = record.fields;
      const leadAirtableId = fields['Lead Record ID (from SMS Audit)']?.[0];
      const sentAt = fields['Sent At'];
      const text = fields['Text'];
      const campaignAirtableId = fields['SMS Campaign ID']?.[0];

      if (!leadAirtableId || !sentAt) {
        console.warn(`⚠️ Skipping audit record ${record.id} due to missing lead ID or sent date.`);
        continue;
      }

      // 2. Find the corresponding lead in PostgreSQL
      const lead = await db.query.leads.findFirst({
        where: eq(leads.airtableRecordId, leadAirtableId),
        columns: { id: true, clientId: true, campaignId: true, campaignName: true },
      });

      if (!lead) {
        console.warn(`⚠️ Could not find PostgreSQL lead for Airtable record ${leadAirtableId}. Skipping.`);
        continue;
      }

      const timestamp = new Date(sentAt);

      // 3. Create log entries
      const logEntries = [
        {
          eventType: 'SMS_SENT',
          eventCategory: 'COMMUNICATION',
          leadId: lead.id,
          leadAirtableId: leadAirtableId,
          clientId: lead.clientId,
          description: `Historical: SMS sent for campaign "${lead.campaignName}"`,
          messageContent: text,
          metadata: {
            campaignId: lead.campaignId,
            campaignAirtableId: campaignAirtableId,
            source: 'Airtable SMS_Audit Backfill',
          },
          source: 'script:backfill-activity-log',
          timestamp: timestamp,
        },
        {
          eventType: 'CAMPAIGN_COMPLETED',
          eventCategory: 'CAMPAIGN',
          leadId: lead.id,
          leadAirtableId: leadAirtableId,
          clientId: lead.clientId,
          description: `Historical: Marked complete for single-message campaign "${lead.campaignName}"`,
          metadata: {
            campaignId: lead.campaignId,
            campaignAirtableId: campaignAirtableId,
            source: 'Airtable SMS_Audit Backfill',
            reason: 'Assumed single-message campaign during backfill.',
          },
          source: 'script:backfill-activity-log',
          timestamp: timestamp, // Mark completion at the same time as the send
        }
      ];

      await db.insert(leadActivityLog).values(logEntries);
      logsCreated += 2;
    }

    console.log(`\n🎉 Backfill complete! Successfully created ${logsCreated} log entries for ${sentRecords.length} messages.`);

  } catch (error: any) {
    console.error('❌ An unexpected error occurred during the backfill process:', error.message);
    process.exit(1);
  }
}

backfillActivityLog();
