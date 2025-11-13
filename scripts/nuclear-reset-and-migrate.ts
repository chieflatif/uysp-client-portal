/**
 * NUCLEAR OPTION: Complete database reset and migration from scratch
 *
 * This script will:
 * 1. Drop ALL tables (including migrations tracker)
 * 2. Recreate migrations schema
 * 3. Run ALL migrations fresh
 * 4. Verify all expected tables exist
 */

import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL must be set');
  process.exit(1);
}

async function nuclearReset() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     NUCLEAR DATABASE RESET - COMPLETE SCHEMA REBUILD         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log('⚠️  This will DROP ALL TABLES and rebuild from scratch!');
  console.log('⏳ Starting in 3 seconds...\n');

  await new Promise(resolve => setTimeout(resolve, 3000));

  // Step 1: Drop ALL tables in public schema
  console.log('🔥 Step 1: Dropping all tables in public schema...');
  try {
    const tables = await db.execute(sql`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public';
    `);

    for (const row of tables as any[]) {
      console.log(`   Dropping table: ${row.tablename}`);
      await db.execute(sql.raw(`DROP TABLE IF EXISTS public."${row.tablename}" CASCADE;`));
    }
    console.log('✅ All public tables dropped\n');
  } catch (error: any) {
    console.log(`⚠️  No public tables to drop or error: ${error.message}\n`);
  }

  // Step 2: Drop and recreate migrations schema
  console.log('🔥 Step 2: Resetting migrations schema...');
  await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE;`);
  await db.execute(sql`CREATE SCHEMA drizzle;`);
  await db.execute(sql`
    CREATE TABLE drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    );
  `);
  console.log('✅ Migrations schema reset\n');

  // Step 3: Run all migrations
  console.log('📦 Step 3: Running all migrations from scratch...');

  const migrationClient = postgres(DATABASE_URL, { max: 1 });

  try {
    await migrate(db as any, {
      migrationsFolder: './src/lib/db/migrations',
    });
    console.log('✅ All migrations applied successfully\n');
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    await migrationClient.end();
    process.exit(1);
  }

  await migrationClient.end();

  // Step 4: Verify all expected tables exist
  console.log('🔍 Step 4: Verifying all tables exist...');

  const expectedTables = [
    'users',
    'clients',
    'campaigns',
    'leads',
    'notes',
    'activity_log',
    'sms_activity',
    'project_tasks',
    'lead_activity_sessions'
  ];

  const tables = await db.execute(sql`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `);

  const actualTables = (tables as any[]).map(t => t.tablename);

  console.log(`\n📊 Found ${actualTables.length} tables:`);
  console.table(actualTables);

  const missingTables = expectedTables.filter(t => !actualTables.includes(t));

  if (missingTables.length > 0) {
    console.error(`\n❌ MISSING TABLES: ${missingTables.join(', ')}`);
    process.exit(1);
  }

  console.log('\n✅ ALL EXPECTED TABLES VERIFIED!\n');

  // Step 5: Show migration history
  const migrations = await db.execute(sql`
    SELECT id, hash, created_at
    FROM drizzle.__drizzle_migrations
    ORDER BY created_at ASC;
  `);

  console.log('📋 Applied migrations:');
  console.table(migrations);

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║              DATABASE RESET COMPLETE ✅                       ║');
  console.log('║         Ready for Great Sync execution                        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  process.exit(0);
}

nuclearReset().catch((error) => {
  console.error('\n💥 Nuclear reset failed:', error);
  process.exit(1);
});
