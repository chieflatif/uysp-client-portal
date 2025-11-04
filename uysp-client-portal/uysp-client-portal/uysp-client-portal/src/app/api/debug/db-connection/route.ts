/**
 * DEBUG ENDPOINT: Database Connection Test
 *
 * Tests database connectivity from production environment
 *
 * SECURITY: Remove or protect this endpoint after debugging
 */

import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import postgres from 'postgres';

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {},
  };

  // Check 1: DATABASE_URL exists
  results.checks.database_url = {
    exists: !!process.env.DATABASE_URL,
    format: process.env.DATABASE_URL ? 'SET' : 'MISSING',
    // Show only the hostname (not credentials)
    hostname: process.env.DATABASE_URL
      ? new URL(process.env.DATABASE_URL).hostname
      : 'N/A',
    hasSSLMode: process.env.DATABASE_URL?.includes('sslmode=require') || false,
  };

  // Check 2: Test DNS resolution
  try {
    const dns = require('dns').promises;
    const hostname = process.env.DATABASE_URL
      ? new URL(process.env.DATABASE_URL).hostname
      : null;

    if (hostname) {
      const addresses = await dns.resolve4(hostname);
      results.checks.dns_resolution = {
        success: true,
        hostname,
        addresses,
      };
    } else {
      results.checks.dns_resolution = {
        success: false,
        error: 'No DATABASE_URL hostname to resolve',
      };
    }
  } catch (error) {
    results.checks.dns_resolution = {
      success: false,
      error: error instanceof Error ? error.message : 'DNS resolution failed',
    };
  }

  // Check 3: Test pg Pool connection
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });

    const startTime = Date.now();
    const result = await pool.query('SELECT 1 as test');
    const duration = Date.now() - startTime;

    await pool.end();

    results.checks.pg_pool = {
      success: true,
      duration_ms: duration,
      result: result.rows[0],
    };
  } catch (error) {
    results.checks.pg_pool = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    };
  }

  // Check 4: Test postgres-js connection
  try {
    const client = postgres(process.env.DATABASE_URL!, {
      ssl: { rejectUnauthorized: false },
      connect_timeout: 5,
    });

    const startTime = Date.now();
    const result = await client`SELECT 1 as test`;
    const duration = Date.now() - startTime;

    await client.end();

    results.checks.postgres_js = {
      success: true,
      duration_ms: duration,
      result: result[0],
    };
  } catch (error) {
    results.checks.postgres_js = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    };
  }

  // Determine overall status
  const allChecksPass = Object.values(results.checks).every(
    (check: any) => check.success !== false
  );

  return NextResponse.json({
    status: allChecksPass ? 'healthy' : 'unhealthy',
    ...results,
  }, {
    status: allChecksPass ? 200 : 500,
  });
}
