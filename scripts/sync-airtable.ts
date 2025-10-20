/**
 * Airtable → PostgreSQL Sync Script
 * 
 * Syncs all leads from Airtable to PostgreSQL cache
 * Run this manually or via cron job
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

import { getAirtableClient } from '../src/lib/airtable/client';
import { db } from '../src/lib/db';
import { leads } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

// Hardcode a default client ID for now (should come from env or config)
const DEFAULT_CLIENT_ID = '00000000-0000-0000-0000-000000000000';

async function syncAirtableToPostgres() {
  console.log('🔄 Starting Airtable → PostgreSQL sync...\n');

  try {
    const airtable = getAirtableClient();
    let totalFetched = 0;
    let totalInserted = 0;
    let totalUpdated = 0;
    let errors = 0;

    console.log('📥 Fetching leads from Airtable...');

    await airtable.streamAllLeads(async (record) => {
      totalFetched++;

      try {
        // Map Airtable record to PostgreSQL format
        const leadData = airtable.mapToDatabaseLead(record, DEFAULT_CLIENT_ID);

        // Check if lead already exists
        const existing = await db.query.leads.findFirst({
          where: (leads, { eq }) => eq(leads.airtableRecordId, record.id),
        });

        if (existing) {
          // Update existing lead
          await db.update(leads)
            .set({
              ...leadData,
              updatedAt: new Date(),
            })
            .where(eq(leads.id, existing.id));
          
          totalUpdated++;
          if (totalUpdated % 100 === 0) {
            console.log(`  Updated ${totalUpdated} leads...`);
          }
        } else {
          // Insert new lead
          await db.insert(leads).values({
            ...leadData,
            id: undefined, // Let DB generate
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          
          totalInserted++;
          if (totalInserted % 100 === 0) {
            console.log(`  Inserted ${totalInserted} new leads...`);
          }
        }
      } catch (error) {
        errors++;
        console.error(`  ❌ Error syncing record ${record.id}:`, error);
      }
    });

    console.log('\n✅ Sync complete!');
    console.log(`📊 Results:`);
    console.log(`  - Total fetched from Airtable: ${totalFetched}`);
    console.log(`  - New leads inserted: ${totalInserted}`);
    console.log(`  - Existing leads updated: ${totalUpdated}`);
    console.log(`  - Errors: ${errors}`);

  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    process.exit(1);
  }
}

// Run sync
syncAirtableToPostgres()
  .then(() => {
    console.log('\n🎉 Sync completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });

