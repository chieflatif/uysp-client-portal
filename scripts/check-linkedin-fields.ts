/**
 * Check for LinkedIn and enrichment fields across multiple records
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

async function checkLinkedInFields() {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const apiKey = process.env.AIRTABLE_API_KEY;

  if (!baseId || !apiKey) {
    console.error('Missing credentials');
    process.exit(1);
  }

  try {
    // Fetch 100 records to find LinkedIn fields
    const response = await fetch(
      `https://api.airtable.com/v0/${baseId}/Leads?maxRecords=100`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    
    console.log(`📊 Analyzing ${data.records.length} records for LinkedIn/enrichment fields...\n`);
    
    // Collect all unique field names
    const allFields = new Set<string>();
    data.records.forEach((record: any) => {
      Object.keys(record.fields).forEach(field => allFields.add(field));
    });
    
    // Find LinkedIn-related fields
    const linkedinFields = Array.from(allFields).filter(f =>
      f.toLowerCase().includes('linkedin') ||
      f.toLowerCase().includes('linked in') ||
      f.toLowerCase().includes('li_')
    );
    
    console.log('🔗 LinkedIn Fields Found:');
    if (linkedinFields.length > 0) {
      linkedinFields.forEach(field => {
        // Find a record with this field populated
        const example = data.records.find((r: any) => r.fields[field]);
        const value = example ? example.fields[field] : '(empty in sample)';
        console.log(`  ✓ "${field}": ${JSON.stringify(value).substring(0, 80)}`);
      });
    } else {
      console.log('  ❌ No LinkedIn fields found');
    }
    
    // Find enrichment-related fields
    const enrichmentFields = Array.from(allFields).filter(f =>
      f.toLowerCase().includes('enrich') ||
      f.toLowerCase().includes('clay') ||
      f.toLowerCase().includes('apollo') ||
      f.toLowerCase().includes('clearbit')
    );
    
    console.log('\n📈 Enrichment Status Fields:');
    if (enrichmentFields.length > 0) {
      enrichmentFields.forEach(field => {
        const example = data.records.find((r: any) => r.fields[field]);
        const value = example ? example.fields[field] : '(empty in sample)';
        console.log(`  ✓ "${field}": ${JSON.stringify(value).substring(0, 80)}`);
      });
    } else {
      console.log('  ❌ No enrichment fields found');
    }
    
    // Find A/B variant field
    const variantFields = Array.from(allFields).filter(f =>
      f.toLowerCase().includes('variant') ||
      f.toLowerCase().includes('a/b') ||
      f.toLowerCase().includes('test group')
    );
    
    console.log('\n🧪 A/B Testing Fields:');
    if (variantFields.length > 0) {
      variantFields.forEach(field => {
        const example = data.records.find((r: any) => r.fields[field]);
        const value = example ? example.fields[field] : '(empty in sample)';
        console.log(`  ✓ "${field}": ${JSON.stringify(value).substring(0, 80)}`);
      });
    } else {
      console.log('  ❌ No A/B variant fields found');
    }
    
    console.log('\n📋 All Available Fields:');
    console.log('======================');
    Array.from(allFields).sort().forEach((field, idx) => {
      console.log(`${idx + 1}. "${field}"`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkLinkedInFields()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });






