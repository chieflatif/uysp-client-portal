import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

import { getAirtableClient } from '../src/lib/airtable/client';

async function validateLeadSource() {
  const airtable = getAirtableClient();
  const validSources = ['Webinar Form', 'Standard Form', 'Manual', 'Bulk Import'];
  let invalidCount = 0;

  await airtable.streamAllLeads(async (record) => {
    const leadData = airtable.mapToDatabaseLead(record, 'UYSP_CLIENT_ID');
    if (leadData.leadSource && !validSources.includes(leadData.leadSource)) {
      console.warn(`Invalid lead_source for record ${record.id}: ${leadData.leadSource}`);
      invalidCount++;
    }
  });

  console.log(`Total invalid lead_sources: ${invalidCount}`);
}

validateLeadSource();
