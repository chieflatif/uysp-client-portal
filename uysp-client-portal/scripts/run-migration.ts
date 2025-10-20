/**
 * Run database migration manually
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import postgres from 'postgres';

config({ path: resolve(__dirname, '../.env.local') });

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }
  
  console.log('📁 Reading migration file...');
  const migrationSql = readFileSync(
    resolve(__dirname, '../src/lib/db/migrations/0001_familiar_rage.sql'),
    'utf-8'
  );
  
  console.log('🔗 Connecting to database...');
  const sql = postgres(databaseUrl);
  
  try {
    console.log('⚡ Executing migration...\n');
    
    // Split statements and execute
    const statements = migrationSql
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      console.log(`  Executing: ${statement.substring(0, 60)}...`);
      await sql.unsafe(statement);
    }
    
    console.log('\n✅ Migration complete!');
    console.log('📊 New columns added to leads table:');
    console.log('  - campaign_variant (A/B testing)');
    console.log('  - sms_eligible');
    console.log('  - linkedin_url');
    console.log('  - company_linkedin');
    console.log('  - enrichment_outcome');
    console.log('  - enrichment_attempted_at');
    
    await sql.end();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    await sql.end();
    process.exit(1);
  }
}

runMigration();

