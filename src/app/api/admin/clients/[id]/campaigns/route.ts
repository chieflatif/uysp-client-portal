import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { leads } from '@/lib/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const period = request.nextUrl.searchParams.get('period') || 'all'; // all, 7d, 30d
    
    let dateFilter = undefined;
    const now = new Date();
    
    if (period === '7d') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = gte(leads.createdAt, sevenDaysAgo);
    } else if (period === '30d') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = gte(leads.createdAt, thirtyDaysAgo);
    }

    // Build where clause
    const whereClause = dateFilter 
      ? and(eq(leads.clientId, (await params).id), dateFilter)
      : eq(leads.clientId, (await params).id);

    // Get distinct campaigns for this client with analytics
    const campaigns = await db
      .selectDistinct({
        campaignName: leads.campaignName,
        totalLeads: sql<number>`count(*)`.as('totalLeads'),
        claimed: sql<number>`sum(case when ${leads.claimedBy} is not null then 1 else 0 end)`.as('claimed'),
        unclaimed: sql<number>`sum(case when ${leads.claimedBy} is null then 1 else 0 end)`.as('unclaimed'),
        paused: sql<number>`sum(case when ${leads.processingStatus} = 'Paused' then 1 else 0 end)`.as('paused'),
        active: sql<number>`sum(case when ${leads.processingStatus} != 'Paused' then 1 else 0 end)`.as('active'),
        lastUpdated: sql<string>`max(${leads.updatedAt})`.as('lastUpdated'),
      })
      .from(leads)
      .where(whereClause)
      .groupBy(leads.campaignName)
      .orderBy(sql`${leads.campaignName}`);

    return NextResponse.json({
      clientId: (await params).id,
      period,
      campaigns: campaigns.map((c) => ({
        campaignName: c.campaignName || 'Unknown',
        totalLeads: c.totalLeads || 0,
        claimed: c.claimed || 0,
        unclaimed: c.unclaimed || 0,
        paused: c.paused || 0,
        active: c.active || 0,
        lastUpdated: c.lastUpdated,
      })),
    });
  } catch (error) {
    console.error('Error fetching client campaigns:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
