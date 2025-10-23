import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { leads, clients, activityLog } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Get client info including last sync
    const client = await db.query.clients.findFirst({
      where: eq(clients.id, params.id),
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Get lead stats for this client
    const leadStats = await db
      .select({
        total: sql<number>`count(*)`,
        paused: sql<number>`sum(case when ${leads.processingStatus} = 'Paused' then 1 else 0 end)`,
        claimed: sql<number>`sum(case when ${leads.claimedBy} is not null then 1 else 0 end)`,
        unclaimed: sql<number>`sum(case when ${leads.claimedBy} is null then 1 else 0 end)`,
      })
      .from(leads)
      .where(eq(leads.clientId, params.id));

    // Get recent sync activity
    const recentActivity = await db.query.activityLog.findMany({
      where: eq(activityLog.clientId, params.id),
      limit: 5,
      orderBy: (log) => sql`${log.createdAt} desc`,
    });

    const stats = leadStats[0];
    const totalLeads = stats?.total || 0;
    const pausedLeads = stats?.paused || 0;
    const claimedLeads = stats?.claimed || 0;
    const unclaimedLeads = stats?.unclaimed || 0;

    return NextResponse.json({
      client: {
        id: client.id,
        companyName: client.companyName,
        lastSyncAt: client.lastSyncAt,
      },
      leads: {
        total: totalLeads,
        paused: pausedLeads,
        claimed: claimedLeads,
        unclaimed: unclaimedLeads,
        active: totalLeads - pausedLeads,
      },
      recentActivity: recentActivity.map((activity) => ({
        action: activity.action,
        details: activity.details,
        createdAt: activity.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching client health:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}






