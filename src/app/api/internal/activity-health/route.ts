import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { leadActivityLog } from '@/lib/db/schema';
import { desc, sql } from 'drizzle-orm';

/**
 * GET /api/internal/activity-health
 *
 * Health check endpoint for activity logging system.
 * Returns quick stats to verify logging is working correctly.
 *
 * This is useful for:
 * - Monitoring dashboards
 * - Debugging (quick way to see if events are being logged)
 * - Automated health checks
 *
 * Security: No authentication required (read-only, no sensitive data)
 * Approval Document: MINI-CRM-WEEK-1-APPROVAL.md Recommendation #1
 */
export async function GET(request: NextRequest) {
  try {
    // Count events in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(leadActivityLog)
      .where(sql`${leadActivityLog.timestamp} > ${oneHourAgo.toISOString()}`);

    const eventsLastHour = Number(recentCountResult[0]?.count || 0);

    // Get the most recent event
    const lastEvent = await db.query.leadActivityLog.findFirst({
      orderBy: [desc(leadActivityLog.createdAt)],
      columns: {
        id: true,
        eventType: true,
        eventCategory: true,
        description: true,
        timestamp: true,
        createdAt: true,
        source: true,
      },
    });

    // Get total count
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(leadActivityLog);

    const totalEvents = Number(totalCountResult[0]?.count || 0);

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      stats: {
        events_last_hour: eventsLastHour,
        total_events: totalEvents,
      },
      last_event: lastEvent
        ? {
            id: lastEvent.id,
            event_type: lastEvent.eventType,
            category: lastEvent.eventCategory,
            description: lastEvent.description,
            timestamp: lastEvent.timestamp,
            created_at: lastEvent.createdAt,
            source: lastEvent.source,
            age_seconds: Math.floor(
              (Date.now() - new Date(lastEvent.createdAt).getTime()) / 1000
            ),
          }
        : null,
    });
  } catch (error) {
    console.error('[ACTIVITY-HEALTH] Error:', error);

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
