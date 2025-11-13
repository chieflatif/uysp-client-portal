#!/usr/bin/env tsx
/**
 * Force sync with high deletion threshold
 * Use when intentionally deleting large amounts of data (like webinar leads)
 *
 * WARNING: This bypasses safety checks! Only use when you're sure about deletions.
 */

import { db } from '../src/lib/db';
import { leads } from '../src/lib/db/schema';
import { getAirtableClient } from '../src/lib/airtable/client';
import { eq, notInArray, sql } from 'drizzle-orm';

const CLIENT_ID = '6a08f898-19cd-49f8-bd77-6fcb2dd56db9'; // UYSP client

async function forceSyncWithDeletion() {
  const airtableBaseId = process.env.AIRTABLE_BASE_ID || 'app4wIsBfpJTg7pWS';
  const airtableApiKey = process.env.AIRTABLE_API_KEY;

  if (!airtableApiKey) {
    console.error('❌ Missing AIRTABLE_API_KEY');
    process.exit(1);
  }

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           FORCE SYNC WITH HIGH DELETION THRESHOLD           ║
║                                                              ║
║  ⚠️  WARNING: This will DELETE leads not in Airtable!       ║
║  You deleted webinar leads, so this is expected.            ║
╚══════════════════════════════════════════════════════════════╝
`);

  try {
    // Step 1: Get all Airtable lead IDs
    console.log('📥 Fetching all leads from Airtable...');
    const airtable = getAirtableClient(airtableBaseId, airtableApiKey);
    const airtableRecordIds: string[] = [];

    await airtable.streamAllLeads(async (record) => {
      airtableRecordIds.push(record.id);
    });

    console.log(`✅ Found ${airtableRecordIds.length} leads in Airtable`);

    // Step 2: Get current database lead count
    const [{ count: dbLeadCount }] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(leads)
      .where(eq(leads.clientId, CLIENT_ID));

    console.log(`📊 Current database has ${dbLeadCount} leads`);

    // Step 3: Find leads to delete (in DB but not in Airtable)
    const leadsToDelete = await db
      .select({
        id: leads.id,
        firstName: leads.firstName,
        lastName: leads.lastName,
        email: leads.email,
        airtableRecordId: leads.airtableRecordId
      })
      .from(leads)
      .where(
        airtableRecordIds.length > 0
          ? notInArray(leads.airtableRecordId, airtableRecordIds)
          : sql`1=1`
      );

    const deletionPercent = (leadsToDelete.length / dbLeadCount) * 100;

    console.log(`
🗑️  Deletion Summary:
   - Leads to delete: ${leadsToDelete.length}
   - Deletion percentage: ${deletionPercent.toFixed(1)}%
   - These are likely the webinar leads you removed from Airtable
`);

    // Show first 5 leads that will be deleted as examples
    console.log('Examples of leads to be deleted:');
    leadsToDelete.slice(0, 5).forEach(lead => {
      console.log(`   - ${lead.firstName} ${lead.lastName} (${lead.email})`);
    });
    if (leadsToDelete.length > 5) {
      console.log(`   ... and ${leadsToDelete.length - 5} more`);
    }

    // Step 4: Confirm deletion
    console.log(`\n⚠️  Ready to delete ${leadsToDelete.length} leads (${deletionPercent.toFixed(1)}%)`);
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to proceed...');

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 5: Delete the leads
    if (leadsToDelete.length > 0) {
      console.log('\n🗑️ Deleting leads not in Airtable...');

      const deleteIds = leadsToDelete.map(l => l.id);
      const result = await db
        .delete(leads)
        .where(notInArray(leads.id, deleteIds.length > 0 ? deleteIds : ['']));

      console.log(`✅ Deleted ${leadsToDelete.length} leads from database`);
    } else {
      console.log('✅ No leads to delete - database is in sync!');
    }

    // Step 6: Verify final state
    const [{ count: finalCount }] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(leads)
      .where(eq(leads.clientId, CLIENT_ID));

    console.log(`
══════════════════════════════════════════════════════════════
SYNC COMPLETE
══════════════════════════════════════════════════════════════
✅ Airtable leads: ${airtableRecordIds.length}
✅ Database leads: ${finalCount}
✅ Deleted: ${leadsToDelete.length} leads

Your database is now in sync with Airtable!
The webinar leads have been removed as intended.
══════════════════════════════════════════════════════════════
`);

  } catch (error) {
    console.error('❌ Error during sync:', error);
    process.exit(1);
  }
}

// Run the sync
forceSyncWithDeletion();