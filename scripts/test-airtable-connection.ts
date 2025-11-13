#!/usr/bin/env tsx
/**
 * Test Airtable connection and list available tables
 */

async function testAirtableConnection() {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const apiKey = process.env.AIRTABLE_API_KEY;

  console.log('Testing Airtable connection...');
  console.log('Base ID:', baseId);
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'Not set');

  if (!baseId || !apiKey) {
    console.error('Missing AIRTABLE_BASE_ID or AIRTABLE_API_KEY');
    process.exit(1);
  }

  // Test with the exact base ID provided
  const testBaseIds = [
    baseId,                    // As provided
    `app${baseId}`,           // With app prefix
    `appw${baseId}`,          // With appw prefix
  ];

  for (const testId of testBaseIds) {
    console.log(`\nTrying base ID: ${testId}`);

    try {
      const response = await fetch(
        `https://api.airtable.com/v0/${testId}/Campaigns?maxRecords=1`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log(`Response status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Success! Found Campaigns table');
        console.log('Records found:', data.records?.length || 0);

        // Try to list all tables
        const metaResponse = await fetch(
          `https://api.airtable.com/v0/meta/bases/${testId}/tables`,
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
            },
          }
        );

        if (metaResponse.ok) {
          const metaData = await metaResponse.json();
          console.log('\nAvailable tables:');
          metaData.tables?.forEach((table: any) => {
            console.log(`  - ${table.name} (${table.id})`);
          });
        }

        return testId;
      } else {
        const error = await response.text();
        console.log(`❌ Failed: ${error}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error}`);
    }
  }

  console.log('\n❌ Could not connect to Airtable with any base ID variation');
  process.exit(1);
}

testAirtableConnection().then((workingBaseId) => {
  console.log(`\n✅ Working base ID: ${workingBaseId}`);
  console.log('\nUse this in your environment:');
  console.log(`AIRTABLE_BASE_ID="${workingBaseId}"`);
}).catch(console.error);