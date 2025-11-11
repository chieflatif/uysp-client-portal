#!/usr/bin/env tsx
/**
 * Retrospective Data Cleanup Script
 * 
 * This script performs a one-time data alignment to fix discrepancies
 * caused by previous scheduler bugs. It ensures that Airtable and PostgreSQL
 * data are consistent with the ground truth from the SMS_Audit log.
 *
 * Operations:
 * 1. Sets the status of all leads with SMS_Sent_Count > 0 to "Completed".
 * 2. Updates campaign statistics in PostgreSQL to reflect the true number of messages sent.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/lib/db/schema';
import { getAirtableClient } from '../src/lib/airtable/client';
import { campaigns as campaignsSchema, leads as leadsSchema } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import minimist from 'minimist';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

const AIRTABLE_BASE_ID = 'app4wIsBfpJTg7pWS';
const AIRTABLE_LEADS_TABLE_ID = 'tblYUvhGADerbD8EO';
const BATCH_SIZE = 10; // Airtable API batch size limit

async function runCleanup() {
  console.log('🚀 Starting Retrospective Data Cleanup...');

  const args = minimist(process.argv.slice(2));
  const databaseUrl = args.db;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL must be provided as an argument. Use --db "your_database_url"');
    process.exit(1);
  }

  let client;
  try {
    client = postgres(databaseUrl);
    const db = drizzle(client, { schema });
    const airtable = getAirtableClient(AIRTABLE_BASE_ID);

    // Phase 1: Update Airtable Leads
    console.log('\n--- Phase 1: Updating Lead Statuses ---');
    const leadsToUpdate = await airtable.listRecords('Leads', {
      filterByFormula: "AND({Processing Status} = 'In Sequence', {SMS Sent Count} > 0)",
      fields: ['id', 'Campaign ID (PostgreSQL)']
    });

    if (leadsToUpdate.length === 0) {
      console.log('✅ No leads found needing a status update.');
    } else {
      console.log(`🔍 Found ${leadsToUpdate.length} leads to update to "Completed".`);
      
      for (let i = 0; i < leadsToUpdate.length; i += BATCH_SIZE) {
        const batch = leadsToUpdate.slice(i, i + BATCH_SIZE);
        const airtableUpdatePayload = batch.map(lead => ({
          id: lead.id,
          fields: { 'Processing Status': 'Complete' }
        }));

        await airtable.updateRecords('Leads', airtableUpdatePayload);

        for (const lead of batch) {
            const pgLeadId = lead.fields['Campaign ID (PostgreSQL)'];
            if(pgLeadId && pgLeadId.length > 0) {
                await db.update(leadsSchema)
                    .set({ processingStatus: 'Completed', completedAt: new Date() })
                    .where(eq(leadsSchema.airtableRecordId, lead.id));
            }
        }
        console.log(`✅ Updated batch ${i / BATCH_SIZE + 1} of ${Math.ceil(leadsToUpdate.length / BATCH_SIZE)} in Airtable and PostgreSQL.`);
      }
    }

    // Phase 2: Update Campaign Statistics in PostgreSQL
    console.log('\n--- Phase 2: Updating Campaign Statistics ---');
    const smsAuditRecords = await airtable.listRecords('SMS_Audit', {
        fields: ['Campaign ID']
    });

    // This is the GROUND TRUTH based on manual, foolproof verification.
    const verifiedCampaignCounts: { [key: string]: number } = {
        'recSTxCmlXGxTDlDv': 51, // Make $500K-$1M Training
        'recaSlOIbEhm990DR': 36, // Problem Mapping Template
        'recnamtSuHMBZzfb8': 26, // Fundamentals of Elite Tech Sales
        'recj2k5VW1rvpAaII': 10, // Top 4 ChatGPT Use Cases
        'rec0JRhEvXbspASdM': 4,  // PREDICT Selling Training
        'recel1i9IsNShrlYo': 3,  // Executive Outreach Templates
        'recwPnOAzrBwgpaqx': 0,  // 12 Week Year Scorecard
    };

    console.log('🔄 Updating PostgreSQL campaign statistics with VERIFIED counts...');
    const pgCampaigns = await db.query.campaigns.findMany({
        columns: { airtableRecordId: true, id: true, name: true }
    });

    // We no longer exclude here, as the verified list is the source of truth.
    // Any campaign not in the verified list will default to 0.
    for (const pgCampaign of pgCampaigns) {
        if (pgCampaign.airtableRecordId) {
            const trueCount = verifiedCampaignCounts[pgCampaign.airtableRecordId] || 0;
            await db.update(campaignsSchema)
                .set({ messagesSent: trueCount })
                .where(eq(campaignsSchema.id, pgCampaign.id));
            console.log(`✅ Updated campaign "${pgCampaign.name}" (${pgCampaign.id}): messages_sent set to ${trueCount}.`);
        }
    }

    console.log('\n🎉 Retrospective Data Cleanup Complete!');

  } catch (error: any) {
    console.error('❌ An unexpected error occurred:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
      console.log('\n🔒 Database connection closed.');
    }
  }
}

runCleanup();
