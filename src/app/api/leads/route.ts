import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { leads } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

// Pagination constants
const PAGINATION_DEFAULTS = {
  DEFAULT_LIMIT: 100,
  MAX_LIMIT: 500,
  MIN_LIMIT: 1,
  MIN_OFFSET: 0,
} as const;

/**
 * GET /api/leads
 * Fetch leads for the authenticated user with pagination
 *
 * SECURITY: Client isolation enforced
 * - SUPER_ADMIN: sees all leads across all clients
 * - CLIENT_ADMIN/CLIENT_USER: sees only their client's leads
 *
 * Query params:
 * - limit: Number of leads per page (default: 100, max: 500)
 * - offset: Number of leads to skip (default: 0)
 *
 * Week 4 Enhancement: Includes engagement score calculation
 */
export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate pagination params
    const { searchParams } = new URL(request.url);
    const rawLimit = Number(searchParams.get('limit')) || 100;
    const rawOffset = Number(searchParams.get('offset')) || 0;

    // CRITICAL FIX: Validate pagination parameters
    const limit = Math.min(Math.max(rawLimit, 1), 50000); // Between 1 and 50000
    const offset = Math.max(rawOffset, 0); // Must be non-negative

    // CRITICAL FIX: Filter by clientId and isActive
    const allLeads = await db.query.leads.findMany({
      where: session.user.role === 'SUPER_ADMIN'
        ? eq(leads.isActive, true) // SUPER_ADMIN sees all active leads
        : and(
            eq(leads.clientId, session.user.clientId!), // CLIENT_ADMIN/USER see only their client's leads
            eq(leads.isActive, true) // Only active leads (not deleted)
          ),
      orderBy: (leads, { desc }) => [desc(leads.icpScore)],
      limit,
      offset,
    });

    // Get total count for pagination metadata using efficient SQL COUNT
    const whereClause = session.user.role === 'SUPER_ADMIN'
      ? eq(leads.isActive, true)
      : and(
          eq(leads.clientId, session.user.clientId!),
          eq(leads.isActive, true)
        );

    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(whereClause)
      .then(result => Number(result[0]?.count || 0));

    // Calculate engagement score (most recent activity) for each lead
    const leadsWithEngagement = allLeads.map(lead => {
      const activityDates = [
        lead.smsLastSentAt,
        lead.firstClickedAt,
        lead.bookedAt,
      ].filter(date => date !== null && date !== undefined);

      const lastActivity = activityDates.length > 0
        ? new Date(Math.max(...activityDates.map(d => new Date(d).getTime())))
        : null;

      return {
        ...lead,
        lastActivity: lastActivity?.toISOString() || null,
      };
    });

    return NextResponse.json({
      leads: leadsWithEngagement,
      count: leadsWithEngagement.length,
      total: totalCount,
      limit,
      offset,
      hasMore: offset + limit < totalCount,
    });
  } catch (error) {
    console.error('Error fetching leads:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
