/**
 * Sync Campaign PostgreSQL UUIDs to Airtable
 * 
 * This script populates the "Campaign ID (PostgreSQL)" field in Airtable
 * so n8n workflows can update campaign statistics.
 */

import { db } from '../src/lib/db';
import { campaigns } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function syncCampaignUUIDs() {
  console.log('🔍 Fetching campaigns from PostgreSQL...\n');
  
  try {
    // Get all campaigns with their PostgreSQL UUIDs and Airtable record IDs
    const allCampaigns = await db
      .select({
        id: campaigns.id,
        airtableRecordId: campaigns.airtableRecordId,
        name: campaigns.name,
        formId: campaigns.formId,
      })
      .from(campaigns);

    console.log(`Found ${allCampaigns.length} campaigns in PostgreSQL\n`);

    // Output as JSON for Airtable sync
    const syncData = allCampaigns.map(c => ({
      airtableRecordId: c.airtableRecordId,
      postgresqlUuid: c.id,
      name: c.name,
      formId: c.formId
    }));

    console.log(JSON.stringify(syncData, null, 2));
    
    console.log(`\n✅ Ready to sync ${syncData.length} campaign UUIDs to Airtable`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

syncCampaignUUIDs();

