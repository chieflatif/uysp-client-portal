require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL;

async function runInitialMigration() {
  const client = new Client({
    connectionString,
    ssl: true,
    connectionTimeoutMillis: 30000
  });

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    console.log('📁 Reading initial migration file...');
    const migrationPath = path.join(__dirname, 'src/lib/db/migrations/0000_outgoing_absorbing_man.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('⚡ Executing migration...\n');
    
    // Split statements and execute
    const statements = migrationSql
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      console.log(`  Executing: ${statement.substring(0, 50)}...`);
      await client.query(statement);
    }

    console.log('\n✅ Initial migration complete!');
    console.log('📊 Created tables:');
    console.log('  - clients');
    console.log('  - users');
    console.log('  - leads');
    console.log('  - campaigns');
    console.log('  - notes');
    console.log('  - activity_log');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

runInitialMigration();