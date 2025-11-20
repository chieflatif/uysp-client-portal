import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { userActivityLogs, userActivitySessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

interface TrackEventPayload {
  eventType: string;
  eventCategory?: string;
  eventData?: Record<string, unknown>;
  pageUrl?: string;
  referrer?: string;
  sessionId?: string;
}

/**
 * POST /api/analytics/track
 *
 * Track user activity events
 * Logs events to user_activity_logs and updates session data
 *
 * Auth: Any authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      // Don't fail silently for analytics
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = (await request.json()) as TrackEventPayload;
    const {
      eventType,
      eventCategory = 'navigation',
      eventData = {},
      pageUrl,
      referrer,
      sessionId,
    } = body;

    if (!eventType) {
      return NextResponse.json(
        { error: 'eventType is required' },
        { status: 400 }
      );
    }

    // Extract user agent and device info
    const userAgent = request.headers.get('user-agent') || '';
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // Parse device info from user agent
    const deviceInfo = parseUserAgent(userAgent);

    // Generate or use existing session ID
    const currentSessionId = sessionId || randomUUID();

    // Log the activity event
    await db.insert(userActivityLogs).values({
      userId: session.user.id,
      clientId: session.user.clientId || null,
      eventType,
      eventCategory,
      eventData,
      pageUrl: pageUrl || null,
      referrer: referrer || null,
      sessionId: currentSessionId,
      ipAddress,
      userAgent,
      browser: deviceInfo.browser,
      deviceType: deviceInfo.deviceType,
      os: deviceInfo.os,
    });

    // Update or create session
    if (sessionId) {
      // Update existing session
      const existingSession = await db.query.userActivitySessions.findFirst({
        where: eq(userActivitySessions.sessionId, sessionId),
      });

      if (existingSession) {
        const now = new Date();
        const duration = Math.floor(
          (now.getTime() - new Date(existingSession.sessionStart).getTime()) / 1000
        );

        await db
          .update(userActivitySessions)
          .set({
            lastActivity: now,
            pageViews: (existingSession.pageViews || 0) + (eventType === 'page_view' ? 1 : 0),
            durationSeconds: duration,
            updatedAt: now,
          })
          .where(eq(userActivitySessions.sessionId, sessionId));
      }
    } else {
      // Create new session
      await db.insert(userActivitySessions).values({
        sessionId: currentSessionId,
        userId: session.user.id,
        clientId: session.user.clientId || null,
        sessionStart: new Date(),
        lastActivity: new Date(),
        pageViews: eventType === 'page_view' ? 1 : 0,
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        ipAddress,
        userAgent,
      });
    }

    return NextResponse.json({
      success: true,
      sessionId: currentSessionId,
    });
  } catch (error) {
    console.error('Error tracking activity:', error);
    // Don't fail the request for analytics tracking errors
    return NextResponse.json(
      { error: 'Failed to track activity', success: false },
      { status: 500 }
    );
  }
}

/**
 * Simple user agent parser
 * Extracts browser, device type, and OS
 */
function parseUserAgent(userAgent: string): {
  browser: string;
  deviceType: string;
  os: string;
} {
  const ua = userAgent.toLowerCase();

  // Browser detection
  let browser = 'Unknown';
  if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('edg')) browser = 'Edge';
  else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';

  // Device type detection
  let deviceType = 'Desktop';
  if (ua.includes('mobile')) deviceType = 'Mobile';
  else if (ua.includes('tablet') || ua.includes('ipad')) deviceType = 'Tablet';

  // OS detection
  let os = 'Unknown';
  if (ua.includes('win')) os = 'Windows';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  return { browser, deviceType, os };
}
