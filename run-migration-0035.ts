/**
 * Migration Runner: Add missing password_setup_token columns
 *
 * This script connects to the production database and applies migration 0035.
 * It must be run with DATABASE_URL environment variable set.
 */

import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  console.log('🔄 Starting migration 0035...\n');

  // Check DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ ERROR: DATABASE_URL environment variable not set');
    process.exit(1);
  }

  console.log('✅ DATABASE_URL is set\n');

  // Read migration SQL
  const migrationPath = path.join(process.cwd(), 'migrations', '0035_fix_missing_password_setup_token_columns.sql');
  const migrationSql = fs.readFileSync(migrationPath, 'utf8');

  console.log('📄 Migration SQL:');
  console.log('----------------------------');
  const cleanSql = migrationSql.split('\n').filter(line => !line.startsWith('--') && line.trim() !== '').join('\n');
  console.log(cleanSql.substring(0, 500) + '...');
  console.log('----------------------------\n');

  // Connect to database
  console.log('🔌 Connecting to database...');
  const client = postgres(databaseUrl, {
    ssl: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false' ? { rejectUnauthorized: false } : undefined,
  });

  try {
    // Execute migration SQL (split by statements)
    const statements = migrationSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        const preview = statement.substring(0, 60).replace(/\s+/g, ' ');
        console.log(`Executing: ${preview}...`);
        await client.unsafe(statement);
      }
    }

    console.log('\n✅ Migration applied successfully!\n');

    // Verify columns were added
    console.log('🔍 Verifying columns...');
    const result = await client`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
        AND column_name LIKE '%password_setup%'
      ORDER BY column_name;
    `;

    console.log('\nColumns added:');
    result.forEach(row => {
      console.log(`  ✅ ${row.column_name} (${row.data_type})`);
    });

    console.log('\n✅ Migration 0035 complete!');
    console.log('🎯 Authentication should now work!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
