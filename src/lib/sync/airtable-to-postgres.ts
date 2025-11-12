import { db } from '../db';
import { leads } from '../db/schema';
import { getAirtableClient } from '../airtable/client';
import { eq } from 'drizzle-orm';

interface SyncResult {
  success: boolean;
  totalRecords: number;
  inserted: number;
  updated: number;
  errors: string[];
  startTime: Date;
  endTime: Date;
}

/**
 * Default client ID for portal sync
 * In production, this would iterate through all clients
 */
const DEFAULT_CLIENT_ID = '550e8400-e29b-41d4-a716-446655440000';

/**
 * Sync all leads from Airtable to PostgreSQL
 */
export async function syncAirtableLeads(): Promise<SyncResult> {
  const startTime = new Date();
  const errors: string[] = [];
  let inserted = 0;
  let updated = 0;
  let totalRecords = 0;

  try {
    console.log('🔄 Starting Airtable sync...');

    const airtable = getAirtableClient();

    await airtable.streamAllLeads(async (record) => {
      try {
        totalRecords++;

        // Map Airtable record to database format
        const leadData = airtable.mapToDatabaseLead(record, DEFAULT_CLIENT_ID);

        // Check if lead already exists
        const existing = await db.query.leads.findFirst({
          where: eq(leads.airtableRecordId, record.id),
        });

        if (existing) {
          // Update existing lead
          await db
            .update(leads)
            .set({
              firstName: leadData.firstName,
              lastName: leadData.lastName,
              email: leadData.email,
              phone: leadData.phone,
              company: leadData.company,
              title: leadData.title,
              icpScore: leadData.icpScore,
              status: leadData.status,
              isActive: leadData.isActive,
              // CRITICAL: Campaign matching fields for backfill script
              campaignName: leadData.campaignName,
              leadSource: leadData.leadSource,
              formId: leadData.formId,
              updatedAt: new Date(),
            })
            .where(eq(leads.airtableRecordId, record.id));

          updated++;
        } else {
          // Insert new lead
          await db.insert(leads).values({
            airtableRecordId: leadData.airtableRecordId!,
            clientId: leadData.clientId!,
            firstName: leadData.firstName!,
            lastName: leadData.lastName || '',
            email: leadData.email || '',
            phone: leadData.phone,
            company: leadData.company,
            title: leadData.title,
            icpScore: leadData.icpScore || 0,
            status: leadData.status || 'New',
            isActive: leadData.isActive !== false,
            // CRITICAL: Campaign matching fields for backfill script
            campaignName: leadData.campaignName,
            leadSource: leadData.leadSource,
            formId: leadData.formId,
            createdAt: leadData.createdAt || new Date(),
          });

          inserted++;
        }

        // Progress indicator
        if (totalRecords % 100 === 0) {
          console.log(`  ⏳ Processed ${totalRecords} records...`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`Record ${record.id}: ${errorMsg}`);
        console.error(`  ❌ Error syncing record ${record.id}:`, error);
      }
    });

    const endTime = new Date();
    const duration = Math.round(
      (endTime.getTime() - startTime.getTime()) / 1000
    );

    console.log(`
✅ Sync Complete!
   Total records: ${totalRecords}
   Inserted: ${inserted}
   Updated: ${updated}
   Errors: ${errors.length}
   Duration: ${duration}s
    `);

    return {
      success: errors.length === 0,
      totalRecords,
      inserted,
      updated,
      errors,
      startTime,
      endTime,
    };
  } catch (error) {
    const endTime = new Date();
    const errorMsg = error instanceof Error ? error.message : String(error);

    console.error('❌ Sync failed:', error);

    return {
      success: false,
      totalRecords,
      inserted,
      updated,
      errors: [errorMsg, ...errors],
      startTime,
      endTime,
    };
  }
}

/**
 * Get last sync status
 */
export async function getLastSyncStatus(): Promise<{
  lastSync?: Date;
  recordCount: number;
}> {
  try {
    const latestLead = await db.query.leads.findFirst({
      orderBy: (leads, { desc }) => [desc(leads.updatedAt)],
    });

    const recordCount = await db.query.leads.findMany({
      where: eq(leads.clientId, DEFAULT_CLIENT_ID),
    });

    return {
      lastSync: latestLead?.updatedAt,
      recordCount: recordCount.length,
    };
  } catch (error) {
    console.error('Error getting sync status:', error);
    return {
      recordCount: 0,
    };
  }
}

