import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

/**
 * GET /api/admin/db-health
 * 
 * Get database health status with table counts and last updated times (SUPER_ADMIN ONLY)
 * TDD: Implementation to pass tests in tests/api/admin/db-health.test.ts
 * Endpoint #1 from ADMIN-AUTOMATION-BUILD-TASK.md
 */

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Authorization - SUPER_ADMIN ONLY
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - SUPER_ADMIN access required', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Get table counts and last updated timestamps
    const clientsHealth = await db.execute(sql`
      SELECT 
        'clients' as table_name,
        COUNT(*) as row_count,
        MAX(updated_at)::text as last_updated
      FROM clients
    `);

    const usersHealth = await db.execute(sql`
      SELECT 
        'users' as table_name,
        COUNT(*) as row_count,
        MAX(updated_at)::text as last_updated
      FROM users
    `);

    const leadsHealth = await db.execute(sql`
      SELECT 
        'leads' as table_name,
        COUNT(*) as row_count,
        MAX(updated_at)::text as last_updated
      FROM leads
    `);

    const notesHealth = await db.execute(sql`
      SELECT 
        'notes' as table_name,
        COUNT(*) as row_count,
        MAX(created_at)::text as last_updated
      FROM notes
    `);

    const activityLogHealth = await db.execute(sql`
      SELECT 
        'activity_log' as table_name,
        COUNT(*) as row_count,
        MAX(created_at)::text as last_updated
      FROM activity_log
    `);

    // Get last sync timestamp from clients table
    const lastSync = await db.execute(sql`
      SELECT MAX(last_sync_at)::text as last_sync
      FROM clients
    `);

    // Extract data from results (handle various response formats)
    const getRowCount = (result: any) => {
      if (Array.isArray(result) && result.length > 0) {
        const row = result[0];
        return Number(row.row_count || row.count || 0);
      }
      return 0;
    };

    const getLastUpdated = (result: any) => {
      if (Array.isArray(result) && result.length > 0) {
        const row = result[0];
        return row.last_updated || row.updated_at || null;
      }
      return null;
    };

    const tables = {
      clients: {
        count: getRowCount(clientsHealth),
        last_updated: getLastUpdated(clientsHealth),
      },
      users: {
        count: getRowCount(usersHealth),
        last_updated: getLastUpdated(usersHealth),
      },
      leads: {
        count: getRowCount(leadsHealth),
        last_updated: getLastUpdated(leadsHealth),
      },
      notes: {
        count: getRowCount(notesHealth),
        last_updated: getLastUpdated(notesHealth),
      },
      activity_log: {
        count: getRowCount(activityLogHealth),
        last_updated: getLastUpdated(activityLogHealth),
      },
    };

    // Get last sync
    let lastSyncTime = null;
    if (Array.isArray(lastSync) && lastSync.length > 0) {
      lastSyncTime = lastSync[0].last_sync || null;
    }

    return NextResponse.json({
      ok: true,
      tables,
      connection: 'healthy',
      last_sync: lastSyncTime,
    });

  } catch (error) {
    console.error('Error checking database health:', error);
    return NextResponse.json(
      { 
        ok: false,
        error: 'Failed to check database health',
        code: 'DB_HEALTH_CHECK_FAILED',
      },
      { status: 500 }
    );
  }
}
