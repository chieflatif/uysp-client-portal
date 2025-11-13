import { getAirtableClient } from '../src/lib/airtable/client.js';

const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID!;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY!;

async function checkAirtableSMSActivity() {
  console.log('🔍 Checking Airtable Leads table for SMS activity data...\n');

  const airtable = getAirtableClient(AIRTABLE_BASE_ID, AIRTABLE_API_KEY);
  const base = airtable['base'];

  // Get sample leads sorted by most recent SMS activity
  const leads = await base('Leads')
    .select({
      maxRecords: 10,
      fields: [
        'First Name',
        'Last Name',
        'SMS Last Sent At',
        'SMS Sent Count',
        'SMS Sequence Position',
        'Engagement - Level',
        'Processing Status'
      ],
      sort: [{ field: 'SMS Last Sent At', direction: 'desc' }]
    })
    .all();

  console.log('📊 Sample leads (sorted by most recent SMS activity):\n');
  leads.forEach((record, i) => {
    console.log(`${i + 1}. ${record.get('First Name')} ${record.get('Last Name')}`);
    console.log(`   SMS Last Sent: ${record.get('SMS Last Sent At') || 'NULL'}`);
    console.log(`   SMS Count: ${record.get('SMS Sent Count') || 0}`);
    console.log(`   Sequence Position: ${record.get('SMS Sequence Position') || 0}`);
    console.log(`   Engagement Level: ${record.get('Engagement - Level') || 'NULL'}`);
    console.log(`   Status: ${record.get('Processing Status') || 'NULL'}`);
    console.log('');
  });

  // Count leads with SMS activity
  const leadsWithActivity = await base('Leads')
    .select({
      fields: ['SMS Last Sent At', 'SMS Sent Count'],
      filterByFormula: 'AND({SMS Last Sent At} != BLANK(), {SMS Sent Count} > 0)'
    })
    .all();

  console.log(`\n📈 Total leads WITH SMS activity in Airtable: ${leadsWithActivity.length}`);

  // Count total leads
  const allLeads = await base('Leads').select({ fields: ['First Name'] }).all();
  console.log(`📊 Total leads in Airtable: ${allLeads.length}`);

  process.exit(0);
}

checkAirtableSMSActivity().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
