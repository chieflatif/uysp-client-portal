import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

/**
 * GET /api/admin/stats
 * 
 * Get system-wide statistics (ADMIN only)
 * TDD: Implementation to pass tests in tests/api/admin/clients.test.ts
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

    // Authorization - Only ADMIN or SUPER_ADMIN
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Get all clients
    const allClients = await db.query.clients.findMany();

    // Get all users
    const allUsers = await db.query.users.findMany();

    // Get total leads
    const leadsCount = await db.execute<{count: string}>(sql`SELECT COUNT(*) as count FROM leads`);
    const totalLeads = Number(leadsCount[0]?.count || 0);

    // Get leads and users per client
    const leadsByClient = await db.execute(sql`
      SELECT 
        c.id as client_id,
        c.company_name as client_name,
        COUNT(DISTINCT l.id) as lead_count,
        COUNT(DISTINCT u.id) as user_count
      FROM clients c
      LEFT JOIN leads l ON l.client_id = c.id
      LEFT JOIN users u ON u.client_id = c.id
      GROUP BY c.id, c.company_name
      ORDER BY lead_count DESC
    `);

    // Get recent activity (last 50)
    const recentActivity = await db.query.activityLog.findMany({
      orderBy: (log, { desc }) => [desc(log.createdAt)],
      limit: 50,
    });

    return NextResponse.json({
      totalClients: allClients.length,
      activeClients: allClients.filter(c => c.isActive).length,
      totalUsers: allUsers.length,
      totalLeads,
      leadsByClient: leadsByClient.rows.map((row: any) => ({
        clientId: row.client_id,
        clientName: row.client_name,
        leadCount: Number(row.lead_count),
        userCount: Number(row.user_count),
      })),
      recentActivity: recentActivity.map(a => ({
        id: a.id,
        action: a.action,
        details: a.details,
        createdAt: a.createdAt.toISOString(),
        userId: a.userId,
      })),
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

