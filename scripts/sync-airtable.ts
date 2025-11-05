/**
 * Airtable → PostgreSQL Sync Script
 * 
 * Syncs all leads from Airtable to PostgreSQL cache
 * Run this manually or via cron job
 */

import { getAirtableClient } from '../src/lib/airtable/client';
import { db } from '../src/lib/db';
import { leads } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

// UYSP client ID from database
const UYSP_CLIENT_ID = '6a08f898-19cd-49f8-bd77-6fcb2dd56db9';

async function syncAirtableToPostgres() {
  const airtable = getAirtableClient();
  console.log('Starting sync...');

  let total = 0;
  await airtable.streamAllLeads(async (record) => {
    total++;
    const leadData = airtable.mapToDatabaseLead(record, UYSP_CLIENT_ID);
    // Original insert/update logic without cleaning or validation
    const existing = await db.query.leads.findFirst({ where: eq(leads.airtableRecordId, record.id) });
    if (existing) {
      await db.update(leads).set(leadData).where(eq(leads.airtableRecordId, record.id));
    } else {
      await db.insert(leads).values(leadData);
    }
  });
  console.log(`Synced ${total} leads.`);
}

syncAirtableToPostgres();

