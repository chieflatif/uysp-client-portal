import { db } from '../db';
import { campaigns, type NewCampaign } from '../db/schema';
import { getAirtableClient } from '../airtable/client';

/**
 * Sync campaigns from Airtable to PostgreSQL
 * Phase A: Backend implementation (read cache only)
 */
export async function syncCampaignsFromAirtable(
  clientId: string,
  airtableBaseId: string,
  dryRun: boolean = false
) {
  const airtable = getAirtableClient(airtableBaseId);
  let synced = 0;
  let errors = 0;

  console.log(`🔄 Syncing campaigns for client ${clientId}${dryRun ? ' (DRY RUN)' : ''}...`);

  await airtable.streamAllCampaigns(async (record) => {
    try {
      const campaignData = airtable.mapToDatabaseCampaign(record, clientId);

      // Ensure required fields are not undefined
      if (!campaignData.name || !campaignData.clientId || !campaignData.airtableRecordId) {
        console.warn(`⚠️ Skipping campaign ${record.id}: missing required fields (name, clientId, or airtableRecordId)`);
        errors++;
        return;
      }

      // Skip database write if dry run
      if (!dryRun) {
        // CRITICAL FIX: Remove type safety bypass by casting to NewCampaign
        const insertData: NewCampaign = {
          ...campaignData,
          createdAt: campaignData.createdAt || new Date(),
          updatedAt: campaignData.updatedAt || new Date(),
        } as NewCampaign;

        // Upsert with conflict on airtableRecordId
        await db.insert(campaigns)
          .values(insertData)
          .onConflictDoUpdate({
            target: campaigns.airtableRecordId,
            set: {
              ...campaignData,
              updatedAt: new Date(),
            } as NewCampaign,
          });
      }

      synced++;

      // Progress indicator
      if (synced % 10 === 0) {
        console.log(`  ⏳ Synced ${synced} campaigns...`);
      }
    } catch (error) {
      console.error(`❌ Error syncing campaign ${record.id}:`, error);
      errors++;
    }
  });

  console.log(`✅ Campaigns sync complete: ${synced} synced, ${errors} errors`);

  return { synced, errors };
}

