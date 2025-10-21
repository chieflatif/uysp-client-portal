/**
 * Check Airtable Schema - Verify actual field names
 * Tool-first investigation to discover real field structure
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

async function checkAirtableSchema() {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const apiKey = process.env.AIRTABLE_API_KEY;

  if (!baseId || !apiKey) {
    console.error('Missing AIRTABLE_BASE_ID or AIRTABLE_API_KEY');
    process.exit(1);
  }

  try {
    // Fetch just 1 record to see all field names
    const response = await fetch(
      `https://api.airtable.com/v0/${baseId}/Leads?maxRecords=1`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Airtable API error: ${response.status} - ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    
    if (data.records && data.records.length > 0) {
      const record = data.records[0];
      console.log('✅ Airtable Leads Table Fields:\n');
      console.log('Record ID:', record.id);
      console.log('\nAvailable Fields:');
      console.log('================');
      
      const fields = Object.keys(record.fields).sort();
      fields.forEach((field, index) => {
        const value = record.fields[field];
        const type = typeof value;
        const preview = type === 'string' && value.length > 50 
          ? value.substring(0, 50) + '...' 
          : JSON.stringify(value);
        console.log(`${index + 1}. "${field}" (${type}): ${preview}`);
      });
      
      console.log('\n🔍 Campaign-Related Fields:');
      const campaignFields = fields.filter(f => 
        f.toLowerCase().includes('campaign') ||
        f.toLowerCase().includes('sms') ||
        f.toLowerCase().includes('sequence') ||
        f.toLowerCase().includes('variant') ||
        f.toLowerCase().includes('batch')
      );
      
      if (campaignFields.length > 0) {
        campaignFields.forEach(field => {
          console.log(`  - "${field}": ${JSON.stringify(record.fields[field])}`);
        });
      } else {
        console.log('  ❌ No campaign-related fields found!');
        console.log('  📝 Checking for alternative patterns...');
      }
      
      console.log('\n🔗 LinkedIn & Enrichment Fields:');
      const enrichmentFields = fields.filter(f =>
        f.toLowerCase().includes('linkedin') ||
        f.toLowerCase().includes('enriched') ||
        f.toLowerCase().includes('clay')
      );
      
      if (enrichmentFields.length > 0) {
        enrichmentFields.forEach(field => {
          console.log(`  - "${field}": ${JSON.stringify(record.fields[field])}`);
        });
      } else {
        console.log('  ❌ No LinkedIn/enrichment fields found yet');
      }
      
    } else {
      console.log('❌ No records found in Leads table');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAirtableSchema()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });



