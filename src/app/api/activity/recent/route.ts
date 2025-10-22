import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { activityLog } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

/**
 * GET /api/activity/recent
 * 
 * Fetch recent activity log entries for the dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Fetch recent activity
    // If user has clientId, filter by their client
    // If admin, show all activity
    const activities = await db.query.activityLog.findMany({
      where: session.user.clientId && session.user.role !== 'ADMIN'
        ? (log, { eq }) => eq(log.clientId, session.user.clientId!)
        : undefined,
      orderBy: [desc(activityLog.createdAt)],
      limit: Math.min(limit, 50), // Max 50
    });

    return NextResponse.json({
      success: true,
      activities,
      count: activities.length,
    });

  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }
}






