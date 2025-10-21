/**
 * Quick re-sync with direct database connection
 * Ensures DATABASE_URL is loaded before creating db connection
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load env FIRST before any other imports
config({ path: resolve(__dirname, '../.env.local') });

// NOW import database modules
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/lib/db/schema';
import { leads } from '../src/lib/db/schema';
import { getAirtableClient } from '../src/lib/airtable/client';
import { eq } from 'drizzle-orm';

const DEFAULT_CLIENT_ID = '00000000-0000-0000-0000-000000000000';

async function quickResync() {
  console.log('🔄 Starting quick re-sync with corrected field mappings...\n');
  
  // Create fresh db connection with env loaded
  const databaseUrl = process.env.DATABASE_URL!;
  console.log('📍 Database:', databaseUrl.replace(/:[^:]*@/, ':***@'));
  
  const client = postgres(databaseUrl);
  const db = drizzle(client, { schema });
  
  try {
    const airtable = getAirtableClient();
    let totalFetched = 0;
    let totalUpdated = 0;
    let errors = 0;

    console.log('📥 Fetching leads from Airtable...\n');

    await airtable.streamAllLeads(async (record) => {
      totalFetched++;

      try {
        // Map using CORRECTED field names
        const leadData = airtable.mapToDatabaseLead(record, DEFAULT_CLIENT_ID);

        // Find existing lead
        const existing = await db.query.leads.findFirst({
          where: (leads, { eq }) => eq(leads.airtableRecordId, record.id),
        });

        if (existing) {
          // Update with new field mappings
          await db.update(leads)
            .set({
              ...leadData,
              updatedAt: new Date(),
            })
            .where(eq(leads.id, existing.id));
          
          totalUpdated++;
          if (totalUpdated % 500 === 0) {
            console.log(`  ✓ Updated ${totalUpdated} leads...`);
          }
        }
      } catch (error) {
        errors++;
        if (errors < 5) {
          console.error(`  ❌ Error syncing record ${record.id}:`, error);
        }
      }
    });

    console.log('\n✅ Sync complete!');
    console.log(`📊 Results:`);
    console.log(`  - Total fetched from Airtable: ${totalFetched}`);
    console.log(`  - Existing leads updated: ${totalUpdated}`);
    console.log(`  - Errors: ${errors}`);
    
    // Show sample of campaign data
    console.log('\n🔍 Checking campaign data...');
    const sampleWithCampaigns = await db.select({
      campaignName: leads.campaignName,
      campaignVariant: leads.campaignVariant,
      linkedinUrl: leads.linkedinUrl,
      enrichmentOutcome: leads.enrichmentOutcome,
    })
    .from(leads)
    .where(sql`${leads.campaignName} IS NOT NULL`)
    .limit(5);
    
    console.log('\nSample leads with campaign data:');
    sampleWithCampaigns.forEach((lead, idx) => {
      console.log(`${idx + 1}. Campaign: "${lead.campaignName}" | Variant: ${lead.campaignVariant} | LinkedIn: ${lead.linkedinUrl ? '✓' : '✗'} | Enrichment: ${lead.enrichmentOutcome}`);
    });

    await client.end();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    await client.end();
    process.exit(1);
  }
}

import { sql } from 'drizzle-orm';

quickResync();



