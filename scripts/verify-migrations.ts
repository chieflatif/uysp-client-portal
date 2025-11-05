/**
 * Database Migration Verification Script
 * Verifies that critical Phase 2 migrations have been applied
 *
 * Run with: npx tsx scripts/verify-migrations.ts
 */

import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

interface VerificationResult {
  check: string;
  passed: boolean;
  details?: string;
}

const results: VerificationResult[] = [];

async function verifyTableExists(tableName: string): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = ${tableName}
      );
    `);
    return Array.from(result as Iterable<{ exists: boolean }>)[0]?.exists || false;
  } catch (error) {
    console.error(`Error checking table ${tableName}:`, error);
    return false;
  }
}

async function verifyColumnExists(tableName: string, columnName: string): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = ${tableName}
        AND column_name = ${columnName}
      );
    `);
    return Array.from(result as Iterable<{ exists: boolean }>)[0]?.exists || false;
  } catch (error) {
    console.error(`Error checking column ${tableName}.${columnName}:`, error);
    return false;
  }
}

async function verifyFunctionExists(functionName: string): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname = ${functionName}
      );
    `);
    return Array.from(result as Iterable<{ exists: boolean }>)[0]?.exists || false;
  } catch (error) {
    console.error(`Error checking function ${functionName}:`, error);
    return false;
  }
}

async function main() {
  console.log('🔍 Verifying Phase 2 Migrations...\n');

  try {
    // Check Migration 0020: Unify Campaign Model
    console.log('📋 Checking Migration 0020 (Unify Campaign Model)...');

    const v2Fields = [
      'is_active',
      'active_leads_count',
      'completed_leads_count',
      'opted_out_count',
      'booked_count',
      'deactivated_at',
      'last_enrollment_at'
    ];

    for (const field of v2Fields) {
      const exists = await verifyColumnExists('campaigns', field);
      results.push({
        check: `campaigns.${field}`,
        passed: exists,
        details: exists ? '✅ Found' : '❌ Missing'
      });
    }

    // Check Migration 0021: De-enrollment Monitoring
    console.log('\n📋 Checking Migration 0021 (De-enrollment Monitoring)...');

    const monitoringTables = [
      'de_enrollment_runs',
      'de_enrollment_lead_log'
    ];

    for (const table of monitoringTables) {
      const exists = await verifyTableExists(table);
      results.push({
        check: `Table: ${table}`,
        passed: exists,
        details: exists ? '✅ Found' : '❌ Missing'
      });
    }

    // Check for database function
    const functionExists = await verifyFunctionExists('get_leads_for_de_enrollment');
    results.push({
      check: 'Function: get_leads_for_de_enrollment',
      passed: functionExists,
      details: functionExists ? '✅ Found' : '❌ Missing'
    });

    // Print summary
    console.log('\n📊 Verification Summary:');
    console.log('═'.repeat(60));

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    results.forEach(result => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.check.padEnd(40)} ${result.details}`);
    });

    console.log('═'.repeat(60));
    console.log(`Total Checks: ${results.length} | Passed: ${passed} | Failed: ${failed}`);

    if (failed > 0) {
      console.log('\n⚠️  MIGRATIONS MISSING!');
      console.log('\nTo apply missing migrations:');
      console.log('  psql $DATABASE_URL < migrations/0020_unify_campaign_model.sql');
      console.log('  psql $DATABASE_URL < migrations/0021_add_de_enrollment_monitoring.sql');
      process.exit(1);
    } else {
      console.log('\n✅ All Phase 2 migrations verified!');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  }
}

main();
