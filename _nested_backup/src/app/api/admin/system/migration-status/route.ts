import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

/**
 * GET /api/admin/system/migration-status
 *
 * Check if database migration 0010_add_custom_campaigns.sql has been executed
 * Verifies presence of required columns for Custom Campaign feature
 *
 * Returns:
 * - migrationExecuted: boolean
 * - missingColumns: string[] (if any)
 * - requiredColumns: string[] (expected columns)
 * - timestamp: ISO string
 */

interface ColumnCheck {
  table: string;
  column: string;
}

// Columns added by 0010_add_custom_campaigns.sql migration
const REQUIRED_COLUMNS: ColumnCheck[] = [
  { table: 'campaigns', column: 'target_tags' },
  { table: 'campaigns', column: 'enrollment_status' },
  { table: 'campaigns', column: 'leads_enrolled' },
  { table: 'campaigns', column: 'messages' },
  { table: 'campaign_tags_cache', column: 'client_id' },
  { table: 'campaign_tags_cache', column: 'tags' },
  { table: 'campaign_tags_cache', column: 'generated_at' },
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Authorization check - Only admins can check migration status
    if (!['SUPER_ADMIN', 'ADMIN', 'CLIENT_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Query PostgreSQL information_schema to verify columns exist
    const missingColumns: string[] = [];

    for (const { table, column } of REQUIRED_COLUMNS) {
      // BUGFIX: Use raw SQL string interpolation for identifiers (table/column names)
      // Parameterized queries don't work for information_schema identifier lookups
      const result = await db.execute(
        sql.raw(`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = '${table}'
            AND column_name = '${column}'
        `)
      ) as any;

      // DEBUG: Log result structure to understand Drizzle's format
      console.log(`🔍 Checking ${table}.${column}:`, JSON.stringify({
        hasRows: !!result.rows,
        rowsLength: result.rows?.length,
        hasRowsArray: Array.isArray(result),
        arrayLength: Array.isArray(result) ? result.length : 'N/A',
        resultKeys: Object.keys(result || {}),
        firstItem: Array.isArray(result) ? result[0] : result.rows?.[0],
      }));

      // Check both possible result formats: result.rows or result as array
      const rows = result.rows || (Array.isArray(result) ? result : []);

      // If column doesn't exist, mark as missing
      if (!rows || rows.length === 0) {
        console.log(`❌ Column ${table}.${column} NOT FOUND`);
        missingColumns.push(`${table}.${column}`);
      } else {
        console.log(`✅ Column ${table}.${column} FOUND`);
      }
    }

    const migrationExecuted = missingColumns.length === 0;

    // Log warning if migration not executed
    if (!migrationExecuted) {
      console.warn('⚠️ Migration 0010_add_custom_campaigns.sql NOT executed');
      console.warn(`Missing columns: ${missingColumns.join(', ')}`);
    }

    return NextResponse.json({
      migrationExecuted,
      missingColumns,
      requiredColumns: REQUIRED_COLUMNS.map(c => `${c.table}.${c.column}`),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error checking migration status:', error);

    // If error is related to tables not existing at all, migration definitely not run
    const errorMessage = (error as Error).message;
    if (errorMessage.includes('does not exist') || errorMessage.includes('relation')) {
      return NextResponse.json({
        migrationExecuted: false,
        missingColumns: ['Database schema not initialized'],
        requiredColumns: REQUIRED_COLUMNS.map(c => `${c.table}.${c.column}`),
        error: 'Database tables missing - migration required',
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { error: 'Failed to check migration status' },
      { status: 500 }
    );
  }
}
