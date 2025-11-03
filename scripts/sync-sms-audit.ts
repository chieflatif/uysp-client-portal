/**
 * Sync SMS_Audit table from Airtable to PostgreSQL
 * FIXED: Load env BEFORE importing db to prevent connection errors
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load env FIRST before any other imports
config({ path: resolve(__dirname, '../.env.local') });

// NOW import database modules
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/lib/db/schema';
import { smsAudit } from '../src/lib/db/schema';
import { getAirtableClient } from '../src/lib/airtable/client';

async function syncSmsAudit() {
  console.log('🔄 Syncing SMS_Audit from Airtable...\n');
  
  // Create fresh db connection with env loaded
  const databaseUrl = process.env.DATABASE_URL!;
  console.log('📍 Database:', databaseUrl.replace(/:[^:]*@/, ':***@'));
  
  const client = postgres(databaseUrl);
  const db = drizzle(client, { schema });
  
  const airtable = getAirtableClient();
  let offset: string | undefined;
  let totalSynced = 0;
  let errors = 0;

  try {
    while (true) {
      const batch = await airtable.getAllSmsAudit(offset);
    
      for (const record of batch.records) {
        const fields = record.fields;
        
        try {
          await db.insert(smsAudit).values({
            airtableRecordId: record.id,
            smsCampaignId: fields['SMS Campaign ID'] as string | undefined,
            phone: fields['Phone'] as string,
            leadRecordId: fields['Lead Record ID'] as string | undefined,
            event: fields['Event'] as string | undefined,
            text: fields['Text'] as string | undefined,
            status: fields['Status'] as string | undefined,
            carrier: fields['Carrier'] as string | undefined,
            sentAt: fields['Sent At'] ? new Date(fields['Sent At'] as string) : undefined,
            deliveryAt: fields['Delivery At'] ? new Date(fields['Delivery At'] as string) : undefined,
            clicked: Boolean(fields['Clicked']),
            clickedAt: fields['Clicked At'] ? new Date(fields['Clicked At'] as string) : undefined,
          }).onConflictDoNothing();
          
          totalSynced++;
          if (totalSynced % 100 === 0) {
            console.log(`  Synced ${totalSynced} audit records...`);
          }
        } catch (error) {
          errors++;
          if (errors < 5) {
            console.error(`  ❌ Error syncing ${record.id}:`, error);
          }
        }
      }
      
      if (!batch.nextOffset) break;
      offset = batch.nextOffset;
    }
    
    console.log(`\n✅ Sync complete!`);
    console.log(`  - Total synced: ${totalSynced}`);
    console.log(`  - Errors: ${errors}`);
    
    await client.end();
    
  } catch (error) {
    console.error('\n❌ Sync failed:', error);
    await client.end();
    throw error;
  }
}

syncSmsAudit()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });

