import { NextResponse } from 'next/server';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

/**
 * EMERGENCY API ENDPOINT: Run Migration 0035
 *
 * This endpoint applies the missing password_setup_token columns to production database.
 *
 * ⚠️ SECURITY: This endpoint should be deleted after the migration is complete!
 *
 * Usage: POST https://uysp-portal-v2.onrender.com/api/setup/run-migration-0035
 */

export async function POST(request: Request) {
  try {
    console.log('🔄 Starting migration 0035...');

    // Check DATABASE_URL
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return NextResponse.json(
        { error: 'DATABASE_URL not configured' },
        { status: 500 }
      );
    }

    // Read migration SQL
    const migrationPath = path.join(process.cwd(), 'migrations', '0035_fix_missing_password_setup_token_columns.sql');

    if (!fs.existsSync(migrationPath)) {
      return NextResponse.json(
        { error: 'Migration file not found', path: migrationPath },
        { status: 500 }
      );
    }

    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    // Connect to database
    const client = postgres(databaseUrl, {
      ssl: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false'
        ? { rejectUnauthorized: false }
        : undefined,
    });

    const results: string[] = [];

    try {
      // Execute migration SQL (split by statements)
      const statements = migrationSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`Executing: ${statement.substring(0, 60)}...`);
          await client.unsafe(statement);
          results.push(`✅ Executed: ${statement.substring(0, 60)}...`);
        }
      }

      // Verify columns were added
      const verification = await client`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'users'
          AND column_name LIKE '%password_setup%'
        ORDER BY column_name;
      `;

      const verificationResults = verification.map(row =>
        `✅ ${row.column_name} (${row.data_type})`
      );

      return NextResponse.json({
        success: true,
        message: 'Migration 0035 applied successfully',
        executed: results,
        verified: verificationResults,
        timestamp: new Date().toISOString(),
      });

    } finally {
      await client.end();
    }

  } catch (error) {
    console.error('❌ Migration 0035 failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
