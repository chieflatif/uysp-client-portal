#!/usr/bin/env tsx
/**
 * Check current Airtable data to compare with database
 */

async function checkAirtableData() {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const apiKey = process.env.AIRTABLE_API_KEY;

  if (!baseId || !apiKey) {
    console.error('Missing AIRTABLE_BASE_ID or AIRTABLE_API_KEY');
    process.exit(1);
  }

  console.log('Fetching latest leads from Airtable...\n');

  try {
    // Fetch leads modified in the last 24 hours
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const filterFormula = `DATETIME_DIFF(NOW(), {Last Modified Time}, 'hours') < 24`;

    const response = await fetch(
      `https://api.airtable.com/v0/${baseId}/Leads?` + new URLSearchParams({
        maxRecords: '10',
        sort: '[{field:"Last Modified Time",direction:"desc"}]',
        filterByFormula: filterFormula
      }),
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Airtable API error: ${response.status} - ${error}`);
      return;
    }

    const data = await response.json();

    console.log(`Found ${data.records?.length || 0} leads modified in the last 24 hours:\n`);

    if (data.records && data.records.length > 0) {
      data.records.forEach((record: any, index: number) => {
        console.log(`Lead ${index + 1}:`);
        console.log(`  ID: ${record.id}`);
        console.log(`  Name: ${record.fields['First Name']} ${record.fields['Last Name']}`);
        console.log(`  Email: ${record.fields.Email}`);
        console.log(`  Status: ${record.fields.Status}`);
        console.log(`  Last Modified: ${record.fields['Last Modified Time']}`);
        console.log(`  Campaign: ${record.fields['Campaign Name']}`);
        console.log('');
      });
    }

    // Now fetch total count
    const countResponse = await fetch(
      `https://api.airtable.com/v0/${baseId}/Leads?` + new URLSearchParams({
        maxRecords: '1',
        fields: 'RECORD_ID()'
      }),
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );

    if (countResponse.ok) {
      const countData = await countResponse.json();
      console.log('📊 Airtable Statistics:');
      console.log(`   Total records accessible: ${countData.records?.length > 0 ? 'Yes' : 'No'}`);

      // Check if there are any records we haven't synced
      const allResponse = await fetch(
        `https://api.airtable.com/v0/${baseId}/Leads?` + new URLSearchParams({
          maxRecords: '5',
          sort: '[{field:"Created Time",direction:"desc"}]'
        }),
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        }
      );

      if (allResponse.ok) {
        const allData = await allResponse.json();
        console.log(`   Latest ${allData.records?.length || 0} leads (by creation date):`);
        allData.records?.forEach((record: any) => {
          console.log(`     - ${record.fields['First Name']} ${record.fields['Last Name']} (Created: ${record.fields['Created Time']})`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAirtableData();