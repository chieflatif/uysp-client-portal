/**
 * Script to run Airtable sync for UYSP
 * Usage: npx tsx run-sync.ts
 */

import { db } from './src/lib/db';
import { clients, leads } from './src/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAirtableClient } from './src/lib/airtable/client';

async function runSync() {
  try {
    console.log('🔍 Finding UYSP client...');
    
    const client = await db.query.clients.findFirst({
      where: eq(clients.companyName, 'UYSP'),
    });

    if (!client) {
      console.error('❌ UYSP client not found in database');
      process.exit(1);
    }

    console.log(`✅ Found UYSP client: ${client.id}`);
    console.log(`📦 Airtable Base ID: ${client.airtableBaseId}`);
    console.log('');
    console.log('🔄 Starting sync from Airtable...');
    
    const airtable = getAirtableClient(client.airtableBaseId);
    let totalFetched = 0;
    let totalInserted = 0;
    let totalUpdated = 0;
    let errors = 0;

    await airtable.streamAllLeads(async (record) => {
      totalFetched++;

      try {
        const leadData = airtable.mapToDatabaseLead(record, client.id);

        const existing = await db.query.leads.findFirst({
          where: eq(leads.airtableRecordId, record.id),
        });

        if (existing) {
          await db.update(leads)
            .set({
              ...leadData,
              updatedAt: new Date(),
            })
            .where(eq(leads.id, existing.id));
          
          totalUpdated++;
        } else {
          await db.insert(leads).values({
            ...leadData,
            id: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          
          totalInserted++;
        }

        if ((totalInserted + totalUpdated) % 100 === 0) {
          console.log(`   Progress: ${totalInserted + totalUpdated} leads synced...`);
        }

      } catch (error: any) {
        errors++;
        console.error(`   Error syncing record ${record.id}:`, error.message);
      }
    });

    console.log('');
    console.log('✅ SYNC COMPLETE!');
    console.log(`   Fetched: ${totalFetched}`);
    console.log(`   Inserted: ${totalInserted}`);
    console.log(`   Updated: ${totalUpdated}`);
    console.log(`   Errors: ${errors}`);

    // Update client lastSyncAt
    await db.update(clients)
      .set({ lastSyncAt: new Date() })
      .where(eq(clients.id, client.id));

    console.log('');
    console.log('🎉 UYSP data is now in the database!');
    process.exit(0);

  } catch (error: any) {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  }
}

runSync();


