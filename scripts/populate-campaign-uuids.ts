#!/usr/bin/env tsx
/**
 * Populate Campaign ID (PostgreSQL) field in Airtable
 * Fetches campaigns from PostgreSQL and updates corresponding Airtable records
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load env FIRST before any other imports
config({ path: resolve(__dirname, '../.env.local') });

// NOW import database modules
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/lib/db/schema';
import { getAirtableClient } from '../src/lib/airtable/client';

const AIRTABLE_BASE_ID = 'app4wIsBfpJTg7pWS';

async function populateCampaignUUIDs() {
  console.log('🔍 Fetching campaigns from PostgreSQL...\n');

  // Create fresh db connection with env loaded
  const databaseUrl = process.env.DATABASE_URL!;
  console.log('📍 Database:', databaseUrl.replace(/:[^:]*@/, ':***@'));
  
  const client = postgres(databaseUrl);
  const db = drizzle(client, { schema });

  try {
    // Fetch all campaigns from PostgreSQL
    const pgCampaigns = await db.query.campaigns.findMany({
      columns: {
        id: true,
        airtableRecordId: true,
        name: true,
      },
      where: (campaigns, { isNotNull }) => isNotNull(campaigns.airtableRecordId),
    });

    console.log(`✅ Found ${pgCampaigns.length} campaigns with Airtable Record IDs\n`);

    if (pgCampaigns.length === 0) {
      console.log('⚠️  No campaigns found with Airtable Record IDs. Nothing to sync.');
      return;
    }

    // Initialize Airtable client (uses env vars)
    const airtable = getAirtableClient(AIRTABLE_BASE_ID);

    let successCount = 0;
    let errorCount = 0;

    // Update each campaign in Airtable
    for (const pgCampaign of pgCampaigns) {
      if (!pgCampaign.airtableRecordId) continue;

      try {
        console.log(`🔄 Updating "${pgCampaign.name}" (${pgCampaign.airtableRecordId})...`);

        await airtable.updateRecord('Campaigns', pgCampaign.airtableRecordId, {
          'Campaign ID (PostgreSQL)': pgCampaign.id,
        } as any);

        console.log(`   ✅ Success: ${pgCampaign.id}\n`);
        successCount++;
      } catch (error: any) {
        console.error(`   ❌ Error: ${error.message}\n`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total campaigns: ${pgCampaigns.length}`);
    console.log(`✅ Successfully updated: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log('='.repeat(60) + '\n');

    if (successCount > 0) {
      console.log('✅ Campaign UUIDs successfully populated in Airtable!');
      console.log('   The lookup field in Leads table will auto-populate.');
    }
  } catch (error: any) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

populateCampaignUUIDs();

