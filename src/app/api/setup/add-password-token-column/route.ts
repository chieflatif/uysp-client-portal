import { NextResponse } from 'next/server';
import postgres from 'postgres';

/**
 * EMERGENCY ENDPOINT: Add password_setup_token column only
 *
 * The other endpoint is skipping this column for some reason.
 * This endpoint adds ONLY the password_setup_token column.
 *
 * ⚠️ DELETE AFTER USE
 */

export async function POST(request: Request) {
  try {
    console.log('🔄 Adding password_setup_token column...');

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return NextResponse.json(
        { error: 'DATABASE_URL not configured' },
        { status: 500 }
      );
    }

    const client = postgres(databaseUrl, {
      ssl: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false'
        ? { rejectUnauthorized: false }
        : undefined,
    });

    try {
      // Add the column
      console.log('Executing: ALTER TABLE users ADD COLUMN password_setup_token VARCHAR(255)');
      await client.unsafe('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_setup_token VARCHAR(255)');

      // Add index
      console.log('Creating index...');
      await client.unsafe(`
        CREATE INDEX IF NOT EXISTS idx_users_setup_token
          ON users(password_setup_token)
          WHERE password_setup_token IS NOT NULL
      `);

      // Add comment
      console.log('Adding comment...');
      await client.unsafe(`
        COMMENT ON COLUMN users.password_setup_token
          IS 'Secure token for one-time password setup (generated when user created)'
      `);

      // Verify
      const verification = await client`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'users'
          AND column_name LIKE '%password_setup%'
        ORDER BY column_name;
      `;

      return NextResponse.json({
        success: true,
        message: 'password_setup_token column added successfully',
        verified: verification.map(row => `✅ ${row.column_name} (${row.data_type})`),
        timestamp: new Date().toISOString(),
      });

    } finally {
      await client.end();
    }

  } catch (error) {
    console.error('❌ Failed to add column:', error);

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
