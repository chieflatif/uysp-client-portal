const axios = require('axios');

// Configuration - UPDATE THESE VALUES
const CLAY_API_KEY = process.env.CLAY_API_KEY; // Set this in your environment
const TABLE_ID = 'your_table_id_here'; // Get this from Clay URL
const SOURCE_ID = 'your_source_id_here'; // The import source that's stuck

async function checkImportStatus() {
  console.log('🔍 Checking import status...');
  
  try {
    const response = await axios.get(`https://api.clay.com/v3/tables/${TABLE_ID}/sources/${SOURCE_ID}`, {
      headers: {
        'Authorization': `Bearer ${CLAY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Import Status:', response.data);
    console.log('📈 Records Found:', response.data.recordsFound || 'Unknown');
    console.log('📥 Records Imported:', response.data.recordsImported || 'Unknown');
    console.log('🚨 Import Status:', response.data.status);
    
    if (response.data.error) {
      console.log('❌ Import Error:', response.data.error);
    }
    
  } catch (error) {
    console.error('❌ Error checking import:', error.response?.data || error.message);
  }
}

async function retryImport() {
  console.log('🔄 Attempting to retry import...');
  
  try {
    const response = await axios.post(`https://api.clay.com/v3/tables/${TABLE_ID}/sources/${SOURCE_ID}/retry`, {}, {
      headers: {
        'Authorization': `Bearer ${CLAY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Retry initiated:', response.data);
    
  } catch (error) {
    console.error('❌ Error retrying import:', error.response?.data || error.message);
  }
}

async function forceImportCompletion() {
  console.log('⚡ Attempting to force import completion...');
  
  try {
    const response = await axios.post(`https://api.clay.com/v3/tables/${TABLE_ID}/sources/${SOURCE_ID}/complete`, {}, {
      headers: {
        'Authorization': `Bearer ${CLAY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Force completion initiated:', response.data);
    
  } catch (error) {
    console.error('❌ Error forcing completion:', error.response?.data || error.message);
  }
}

async function main() {
  if (!CLAY_API_KEY) {
    console.error('❌ CLAY_API_KEY environment variable not set');
    console.log('💡 Set it with: export CLAY_API_KEY="your_api_key_here"');
    return;
  }

  console.log('🔧 Starting Clay import troubleshooting...\n');
  
  await checkImportStatus();
  console.log('\n');
  
  // Try retry first
  await retryImport();
  console.log('\n');
  
  // If that doesn't work, try force completion
  console.log('⏳ Waiting 30 seconds before force completion...');
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  await forceImportCompletion();
  
  console.log('\n🎉 Troubleshooting complete!');
  console.log('📝 Next steps:');
  console.log('1. Check your Clay table in 2-3 minutes');
  console.log('2. Look for the 1300 new records');
  console.log('3. If still not working, try deleting and recreating the import source');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkImportStatus, retryImport, forceImportCompletion };
