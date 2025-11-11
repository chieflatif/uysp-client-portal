import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../src/lib/db';
import { getAirtableClient } from '../../../src/lib/airtable/client';

const AIRTABLE_BASE_ID = 'app4wIsBfpJTg7pWS';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Fetching campaigns from PostgreSQL...');

    // Fetch all campaigns from PostgreSQL
    const pgCampaigns = await db.query.campaigns.findMany({
      columns: {
        id: true,
        airtableRecordId: true,
        name: true,
      },
      where: (campaigns, { isNotNull }) => isNotNull(campaigns.airtableRecordId),
    });

    console.log(`✅ Found ${pgCampaigns.length} campaigns with Airtable Record IDs`);

    if (pgCampaigns.length === 0) {
      return res.json({ success: true, message: 'No campaigns found', updated: 0 });
    }

    // Initialize Airtable client (uses env vars)
    const airtable = getAirtableClient(AIRTABLE_BASE_ID);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Update each campaign in Airtable
    for (const pgCampaign of pgCampaigns) {
      if (!pgCampaign.airtableRecordId) continue;

      try {
        console.log(`🔄 Updating "${pgCampaign.name}" (${pgCampaign.airtableRecordId})...`);

        await airtable.updateRecord('Campaigns', pgCampaign.airtableRecordId, {
          'Campaign ID (PostgreSQL)': pgCampaign.id,
        } as any);

        console.log(`   ✅ Success: ${pgCampaign.id}`);
        successCount++;
      } catch (error: any) {
        console.error(`   ❌ Error: ${error.message}`);
        errors.push(`${pgCampaign.name}: ${error.message}`);
        errorCount++;
      }
    }

    return res.json({
      success: true,
      total: pgCampaigns.length,
      updated: successCount,
      failed: errorCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('❌ Fatal error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}

