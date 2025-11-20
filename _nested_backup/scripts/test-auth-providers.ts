/**
 * AUTH PROVIDER TEST SCRIPT
 * Tests all authentication providers to determine which one works
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

import { db } from '../src/lib/db';
import { users } from '../src/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

interface TestResult {
  provider: string;
  success: boolean;
  duration: number;
  error?: string;
  userData?: any;
}

async function testDrizzleORM(email: string): Promise<TestResult> {
  const startTime = Date.now();

  try {
    console.log('\n[Test] Testing Drizzle ORM provider...');

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    const duration = Date.now() - startTime;

    if (!user) {
      return {
        provider: 'Drizzle ORM',
        success: false,
        duration,
        error: 'User not found',
      };
    }

    return {
      provider: 'Drizzle ORM',
      success: true,
      duration,
      userData: {
        id: user.id,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      provider: 'Drizzle ORM',
      success: false,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function testRawSQL(email: string): Promise<TestResult> {
  const startTime = Date.now();

  try {
    console.log('\n[Test] Testing Raw SQL provider...');

    const result = await db.execute(sql`
      SELECT
        id::text as id,
        email,
        password_hash,
        first_name,
        last_name,
        role,
        client_id::text as client_id,
        is_active,
        must_change_password
      FROM users
      WHERE email = ${email}
      AND is_active = true
      LIMIT 1
    `);

    const duration = Date.now() - startTime;

    if (!result.rows || result.rows.length === 0) {
      return {
        provider: 'Raw SQL',
        success: false,
        duration,
        error: 'User not found',
      };
    }

    const row = result.rows[0] as any;

    return {
      provider: 'Raw SQL',
      success: true,
      duration,
      userData: {
        id: row.id,
        email: row.email,
        role: row.role,
        mustChangePassword: row.must_change_password,
      },
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      provider: 'Raw SQL',
      success: false,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function testDirectPostgres(email: string): Promise<TestResult> {
  const startTime = Date.now();

  try {
    console.log('\n[Test] Testing Direct PostgreSQL provider...');

    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    const result = await pool.query(
      'SELECT id, email, role, must_change_password, is_active FROM users WHERE email = $1 LIMIT 1',
      [email]
    );

    await pool.end();

    const duration = Date.now() - startTime;

    if (result.rows.length === 0) {
      return {
        provider: 'Direct PostgreSQL',
        success: false,
        duration,
        error: 'User not found',
      };
    }

    const row = result.rows[0];

    return {
      provider: 'Direct PostgreSQL',
      success: true,
      duration,
      userData: {
        id: row.id,
        email: row.email,
        role: row.role,
        mustChangePassword: row.must_change_password,
      },
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      provider: 'Direct PostgreSQL',
      success: false,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function main() {
  const testEmail = process.argv[2] || 'rebel@rebelhq.ai';

  console.log('='.repeat(60));
  console.log('AUTH PROVIDER TEST SUITE');
  console.log('='.repeat(60));
  console.log(`Testing email: ${testEmail}`);
  console.log(`Database: ${process.env.DATABASE_URL?.substring(0, 50)}...`);
  console.log('='.repeat(60));

  // Run all tests
  const results: TestResult[] = [];

  results.push(await testDrizzleORM(testEmail));
  results.push(await testRawSQL(testEmail));
  results.push(await testDirectPostgres(testEmail));

  // Print results
  console.log('\n' + '='.repeat(60));
  console.log('TEST RESULTS');
  console.log('='.repeat(60));

  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`\n${status} ${result.provider} (${result.duration}ms)`);

    if (result.success && result.userData) {
      console.log('  User Data:', JSON.stringify(result.userData, null, 2));
    } else if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
  });

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));

  const passCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  console.log(`Passed: ${passCount}/${results.length}`);
  console.log(`Failed: ${failCount}/${results.length}`);

  if (passCount > 0) {
    console.log('\n✅ At least one provider works - auth system can recover');
    const workingProviders = results.filter(r => r.success).map(r => r.provider);
    console.log(`Working providers: ${workingProviders.join(', ')}`);
  } else {
    console.log('\n❌ ALL PROVIDERS FAILED - Critical system failure');
    console.log('Database connection or schema issue');
  }

  console.log('='.repeat(60));

  process.exit(failCount === results.length ? 1 : 0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
