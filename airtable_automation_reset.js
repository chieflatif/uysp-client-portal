const axios = require('axios');

// Configuration
const AIRTABLE_BASE_ID = 'app4wIsBfpJTg7pWS';
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY; // Set this environment variable
const TABLE_NAME = 'tblYUvhGADerbD8EO';

// Step 1: Check automation status
async function checkAutomationStatus() {
  console.log('🔍 Checking automation status...');
  try {
    const response = await axios.get(`https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Base accessible');
    console.log('Available tables:', response.data.tables.map(t => t.name));
    
    // Look for automation-related fields or views
    const leadsTable = response.data.tables.find(t => t.name === 'Leads');
    if (leadsTable) {
      console.log('Leads table views:', leadsTable.views?.map(v => v.name));
    }
    
  } catch (error) {
    console.error('❌ Error accessing base:', error.message);
  }
}

// Step 2: Force automation trigger by updating records
async function triggerAutomation() {
  console.log('🚀 Attempting to trigger automation by updating records...');
  
  try {
    // Get records that should trigger the automation
    const response = await axios.get(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLE_NAME}?filterByFormula=AND({SMS Eligible}, {Phone Valid}, OR({HRQ Status} = 'None', {HRQ Status} = 'Review'))&maxRecords=100`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`📋 Found ${response.data.records.length} eligible records`);
    
    if (response.data.records.length === 0) {
      console.log('❌ No eligible records found - check your automation trigger conditions');
      return;
    }
    
    // Update records to force automation trigger
    const updates = response.data.records.slice(0, 10).map(record => ({
      id: record.id,
      fields: {
        'Processing Status': 'Ready for SMS',
        'Updated At': new Date().toISOString()
      }
    }));
    
    console.log(`⚡ Updating ${updates.length} records to trigger automation...`);
    
    for (const update of updates) {
      await axios.patch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLE_NAME}/${update.id}`,
        { fields: update.fields },
        {
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`✅ Updated record ${update.id}`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
    }
    
    console.log('🎯 Automation trigger completed - check automation history');
    
  } catch (error) {
    console.error('❌ Error triggering automation:', error.message);
  }
}

// Step 3: Create test record to verify automation
async function createTestRecord() {
  console.log('🧪 Creating test record to verify automation works...');
  
  try {
    const testRecord = {
      fields: {
        'Email': `test-automation-${Date.now()}@example.com`,
        'Phone': '+15551234567',
        'First Name': 'Test',
        'Last Name': 'Automation',
        'SMS Eligible': true,
        'Phone Valid': true,
        'HRQ Status': 'None',
        'Processing Status': 'Ready for SMS'
      }
    };
    
    const response = await axios.post(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLE_NAME}`,
      testRecord,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`✅ Test record created: ${response.data.id}`);
    console.log('⏰ Wait 5-10 minutes and check if automation processed this test record');
    
  } catch (error) {
    console.error('❌ Error creating test record:', error.message);
  }
}

// Main execution
async function main() {
  if (!AIRTABLE_API_KEY) {
    console.error('❌ AIRTABLE_API_KEY environment variable not set');
    console.log('💡 Set it with: export AIRTABLE_API_KEY="your_api_key_here"');
    return;
  }
  
  console.log('🔧 Starting Airtable automation troubleshooting...\n');
  
  await checkAutomationStatus();
  console.log('\n');
  
  await triggerAutomation();
  console.log('\n');
  
  await createTestRecord();
  
  console.log('\n🎉 Troubleshooting complete!');
  console.log('📝 Next steps:');
  console.log('1. Wait 5-10 minutes');
  console.log('2. Check automation history in Airtable');
  console.log('3. Verify if test record was processed');
  console.log('4. If still not working, the automation itself may need manual intervention');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, checkAutomationStatus, triggerAutomation, createTestRecord };
