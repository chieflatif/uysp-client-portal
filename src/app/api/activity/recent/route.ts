import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { leadActivityLog } from '@/lib/db/schema';
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

    // Fetch recent activity from lead_activity_log (SMS and other lead activities)
    // If user has clientId, filter by their client
    // If admin, show all activity
    const activities = await db.query.leadActivityLog.findMany({
      where: session.user.clientId && session.user.role !== 'ADMIN'
        ? (log, { eq }) => eq(log.clientId, session.user.clientId!)
        : undefined,
      orderBy: [desc(leadActivityLog.timestamp)],
      limit: Math.min(limit, 50), // Max 50
    });

    // Transform activities to match expected format
    const transformedActivities = activities.map(activity => ({
      id: activity.id,
      action: activity.eventType,
      details: activity.messageContent || activity.description || '',
      leadId: activity.leadId,
      clientId: activity.clientId,
      createdAt: activity.timestamp || activity.createdAt,
      metadata: activity.metadata,
    }));

    return NextResponse.json({
      success: true,
      activities: transformedActivities,
      count: transformedActivities.length,
    });

  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }
}






