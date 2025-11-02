/**
 * AIRTABLE NAME CLEANUP SCRIPT
 * 
 * Problem: After Clay enrichment, records with no enriched last name
 * have duplicate first names in both First Name and Last Name fields.
 * 
 * Solution: Find records where First Name === Last Name and clear the Last Name.
 * 
 * Safety: Only modifies records where names are identical (clear data corruption).
 */

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = 'app4wIsBfpJTg7pWS';
const TABLE_ID = 'tblYUvhGADerbD8EO';

async function getAllLeads() {
  const records = [];
  let offset = null;

  do {
    const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`);
    url.searchParams.append('fields[]', 'First Name');
    url.searchParams.append('fields[]', 'Last Name');
    url.searchParams.append('pageSize', '100');
    if (offset) url.searchParams.append('offset', offset);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    records.push(...data.records);
    offset = data.offset;
  } while (offset);

  return records;
}

async function updateRecords(updates) {
  const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`;
  
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ records: updates })
  });

  if (!response.ok) {
    throw new Error(`Airtable update error: ${response.status} ${await response.text()}`);
  }

  return await response.json();
}

async function cleanupDuplicateNames() {
  console.log('🔍 Fetching all leads from Airtable...');
  const allRecords = await getAllLeads();
  console.log(`✅ Found ${allRecords.length} total records`);

  // Find records where First Name === Last Name
  const corrupted = allRecords.filter(record => {
    const firstName = String(record.fields['First Name'] || '').trim();
    const lastName = String(record.fields['Last Name'] || '').trim();
    
    // Both must exist and be identical for this to be corruption
    return firstName && lastName && firstName === lastName;
  });

  console.log(`\n🚨 Found ${corrupted.length} records with duplicate names`);

  if (corrupted.length === 0) {
    console.log('✅ No cleanup needed!');
    return;
  }

  // Show sample of what we're fixing
  console.log('\n📋 Sample of records to fix:');
  corrupted.slice(0, 10).forEach(rec => {
    console.log(`   - ID: ${rec.id} | First: "${rec.fields['First Name']}" | Last: "${rec.fields['Last Name']}" → Will clear Last Name`);
  });

  console.log(`\n🔧 Preparing to update ${corrupted.length} records in batches of 10...`);

  // Process in batches of 10 (Airtable limit)
  let updatedCount = 0;
  for (let i = 0; i < corrupted.length; i += 10) {
    const batch = corrupted.slice(i, i + 10);
    const updates = batch.map(rec => ({
      id: rec.id,
      fields: {
        'Last Name': '' // Clear the duplicate name
      }
    }));

    try {
      await updateRecords(updates);
      updatedCount += updates.length;
      console.log(`   ✅ Batch ${Math.floor(i / 10) + 1}/${Math.ceil(corrupted.length / 10)}: Updated ${updates.length} records (Total: ${updatedCount}/${corrupted.length})`);
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`   ❌ Batch ${Math.floor(i / 10) + 1} failed:`, error.message);
      throw error;
    }
  }

  console.log(`\n✅ CLEANUP COMPLETE!`);
  console.log(`   Total records fixed: ${updatedCount}`);
  console.log(`   All duplicate Last Names have been cleared.`);
}

// Run the cleanup
cleanupDuplicateNames()
  .then(() => {
    console.log('\n🎉 Script finished successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });


