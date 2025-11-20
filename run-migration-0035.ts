import { db } from './src/lib/db/index.js';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import path from 'path';

async function applyMigration() {
  try {
    const defaultMigrationPath = path.join(
      process.cwd(),
      'src',
      'lib',
      'db',
      'migrations',
      '0035_fix_missing_password_setup_token_columns.sql'
    );
    const migrationPath = process.env.MIGRATION_FILE ?? defaultMigrationPath;

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('🔧 Applying Migration 0035: Fix Missing Password Setup Token Columns');
    console.log('=' .repeat(70));
    console.log(`Migration file: ${migrationPath}\n`);

    console.log('\nExecuting migration...');
    // Execute the entire migration as one transaction
    await db.execute(sql.raw(migrationSQL));

    console.log('\n✅ Migration applied successfully!');

    console.log('\n🔍 Verifying columns exist...');
    const result = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('must_change_password', 'password_setup_token', 'password_setup_token_expiry')
      ORDER BY ordinal_position;
    `);

    console.log('\nColumns in users table:');
    console.table(result.rows);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
