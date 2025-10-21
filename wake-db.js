require('dotenv').config();
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;

console.log('🔄 Attempting to wake up database (free tier may be sleeping)...');

async function attemptConnection(attempt = 1, maxAttempts = 5) {
  console.log(`\nAttempt ${attempt}/${maxAttempts}`);
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully!');
    
    const result = await client.query('SELECT NOW() as current_time, version()');
    console.log('✅ Database is active:', result.rows[0]);
    
    await client.end();
    return true;
  } catch (error) {
    console.log(`❌ Attempt ${attempt} failed:`, error.message);
    await client.end().catch(() => {});
    
    if (attempt < maxAttempts) {
      console.log('⏳ Waiting 3 seconds before retry...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      return attemptConnection(attempt + 1, maxAttempts);
    } else {
      throw error;
    }
  }
}

attemptConnection()
  .then(() => {
    console.log('\n🎉 Database is now awake and ready!');
  })
  .catch((error) => {
    console.error('\n❌ All connection attempts failed:', error.message);
    console.error('This might indicate:');
    console.error('  - Database credentials are incorrect');
    console.error('  - Database has been deleted or suspended');
    console.error('  - Network connectivity issues');
  });