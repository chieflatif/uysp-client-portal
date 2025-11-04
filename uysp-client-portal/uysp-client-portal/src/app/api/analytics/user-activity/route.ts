import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { userActivityLogs, userActivitySessions, users } from '@/lib/db/schema';
import { eq, and, gte, lte, desc, sql, count } from 'drizzle-orm';
import { isSuperAdmin } from '@/lib/auth/permissions';

/**
 * GET /api/analytics/user-activity
 *
 * Get user activity analytics data
 * Query params:
 * - period: 7d, 30d, 90d (default: 30d)
 * - userId: filter by specific user (super admin only)
 * - clientId: filter by client (defaults to session user's client)
 *
 * Auth: CLIENT_ADMIN and SUPER_ADMIN
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only SUPER_ADMIN can view user activity analytics
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    const userIdFilter = searchParams.get('userId');
    const clientIdFilter = searchParams.get('clientId');

    // Calculate date range
    const now = new Date();
    const daysBack = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysBack);

    // Determine which client to filter by
    let targetClientId = session.user.clientId;
    if (isSuperAdmin(session.user.role)) {
      targetClientId = clientIdFilter || null;
    }

    // Build base conditions
    const conditions = [
      gte(userActivityLogs.createdAt, startDate),
    ];

    if (targetClientId) {
      conditions.push(eq(userActivityLogs.clientId, targetClientId));
    }

    if (userIdFilter && (isSuperAdmin(session.user.role) || userIdFilter === session.user.id)) {
      conditions.push(eq(userActivityLogs.userId, userIdFilter));
    }

    // 1. Get total events count
    const totalEventsResult = await db
      .select({ count: count() })
      .from(userActivityLogs)
      .where(and(...conditions));

    const totalEvents = totalEventsResult[0]?.count || 0;

    // 2. Get unique users count
    const uniqueUsersResult = await db
      .selectDistinct({ userId: userActivityLogs.userId })
      .from(userActivityLogs)
      .where(and(...conditions));

    const uniqueUsers = uniqueUsersResult.length;

    // 3. Get events by type
    const eventsByTypeResult = await db
      .select({
        eventType: userActivityLogs.eventType,
        count: count(),
      })
      .from(userActivityLogs)
      .where(and(...conditions))
      .groupBy(userActivityLogs.eventType)
      .orderBy(desc(count()));

    const eventsByType = eventsByTypeResult.map(row => ({
      eventType: row.eventType,
      count: Number(row.count),
    }));

    // 4. Get events by category
    const eventsByCategoryResult = await db
      .select({
        eventCategory: userActivityLogs.eventCategory,
        count: count(),
      })
      .from(userActivityLogs)
      .where(and(...conditions))
      .groupBy(userActivityLogs.eventCategory)
      .orderBy(desc(count()));

    const eventsByCategory = eventsByCategoryResult.map(row => ({
      category: row.eventCategory || 'uncategorized',
      count: Number(row.count),
    }));

    // 5. Get daily activity (events per day)
    const dailyActivityResult = await db
      .select({
        date: sql<string>`DATE(${userActivityLogs.createdAt})`,
        count: count(),
      })
      .from(userActivityLogs)
      .where(and(...conditions))
      .groupBy(sql`DATE(${userActivityLogs.createdAt})`)
      .orderBy(sql`DATE(${userActivityLogs.createdAt})`);

    const dailyActivity = dailyActivityResult.map(row => ({
      date: row.date,
      events: Number(row.count),
    }));

    // 6. Get top active users
    const topUsersResult = await db
      .select({
        userId: userActivityLogs.userId,
        userName: users.firstName,
        userEmail: users.email,
        eventCount: count(),
      })
      .from(userActivityLogs)
      .leftJoin(users, eq(userActivityLogs.userId, users.id))
      .where(and(...conditions))
      .groupBy(userActivityLogs.userId, users.firstName, users.email)
      .orderBy(desc(count()))
      .limit(10);

    const topUsers = topUsersResult.map(row => ({
      userId: row.userId,
      name: row.userName || row.userEmail || 'Unknown',
      email: row.userEmail,
      eventCount: Number(row.eventCount),
    }));

    // 7. Get recent sessions
    const sessionConditions = [
      gte(userActivitySessions.sessionStart, startDate),
    ];
    if (targetClientId) {
      sessionConditions.push(eq(userActivitySessions.clientId, targetClientId));
    }

    const recentSessionsResult = await db
      .select({
        sessionId: userActivitySessions.sessionId,
        userId: userActivitySessions.userId,
        userName: users.firstName,
        userEmail: users.email,
        sessionStart: userActivitySessions.sessionStart,
        sessionEnd: userActivitySessions.sessionEnd,
        pageViews: userActivitySessions.pageViews,
        durationSeconds: userActivitySessions.durationSeconds,
        browser: userActivitySessions.browser,
        deviceType: userActivitySessions.deviceType,
      })
      .from(userActivitySessions)
      .leftJoin(users, eq(userActivitySessions.userId, users.id))
      .where(and(...sessionConditions))
      .orderBy(desc(userActivitySessions.sessionStart))
      .limit(20);

    const recentSessions = recentSessionsResult.map(row => ({
      sessionId: row.sessionId,
      userId: row.userId,
      userName: row.userName || row.userEmail || 'Unknown',
      sessionStart: row.sessionStart,
      sessionEnd: row.sessionEnd,
      pageViews: row.pageViews,
      durationSeconds: row.durationSeconds,
      browser: row.browser,
      deviceType: row.deviceType,
    }));

    // 8. Calculate average session duration
    const avgDurationResult = await db
      .select({
        avgDuration: sql<number>`AVG(${userActivitySessions.durationSeconds})`,
      })
      .from(userActivitySessions)
      .where(and(...sessionConditions));

    const avgSessionDuration = Math.round(Number(avgDurationResult[0]?.avgDuration || 0));

    return NextResponse.json({
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      summary: {
        totalEvents,
        uniqueUsers,
        avgSessionDuration,
      },
      eventsByType,
      eventsByCategory,
      dailyActivity,
      topUsers,
      recentSessions,
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
