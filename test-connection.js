require('dotenv').config();
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;

console.log('Testing connection to:', connectionString.replace(/:[^@]*@/, ':****@'));

const client = new Client({
  connectionString,
  ssl: false // Try without SSL first
});

client.connect()
  .then(() => {
    console.log('✅ Connected successfully without SSL');
    return client.query('SELECT NOW() as current_time');
  })
  .then(result => {
    console.log('✅ Query successful:', result.rows[0]);
  })
  .catch(error => {
    console.log('❌ Failed without SSL, trying with SSL...');
    console.error('Error:', error.message);
    
    // Try with SSL
    const sslClient = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });
    
    return sslClient.connect()
      .then(() => {
        console.log('✅ Connected successfully with SSL');
        return sslClient.query('SELECT NOW() as current_time');
      })
      .then(result => {
        console.log('✅ SSL Query successful:', result.rows[0]);
        return sslClient.end();
      });
  })
  .catch(error => {
    console.error('❌ Both connections failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error detail:', error.detail);
  })
  .finally(() => {
    client.end();
  });