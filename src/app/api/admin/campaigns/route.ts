import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { leads } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const clientId = request.nextUrl.searchParams.get('clientId');
    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId parameter is required', code: 'BAD_REQUEST' },
        { status: 400 }
      );
    }

    // Get campaign stats for the client
    const stats = await db
      .select({
        total: sql<number>`count(*)`,
        paused: sql<number>`sum(case when ${leads.processingStatus} = 'Paused' then 1 else 0 end)`,
      })
      .from(leads)
      .where(eq(leads.clientId, clientId));

    const totalLeads = stats[0]?.total || 0;
    const pausedLeads = stats[0]?.paused || 0;
    const activeLeads = totalLeads - pausedLeads;

    return NextResponse.json({
      totalLeads,
      pausedLeads,
      activeLeads,
    });
  } catch (error) {
    console.error('Error fetching campaign stats:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
