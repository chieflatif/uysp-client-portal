import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { leadActivityLog, leads } from '@/lib/db/schema';
import { desc, eq, sql } from 'drizzle-orm';

/**
 * GET /api/leads/[id]/activity
 *
 * Lead-specific timeline for lead detail page.
 * Returns chronological activity history for a single lead.
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 100, max: 500)
 *
 * Security: Authenticated users only (lead access controlled by client_id)
 * PRD Reference: docs/PRD-MINI-CRM-ACTIVITY-LOGGING.md Section 4.3 Endpoint #3
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters for pagination
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(500, Math.max(1, parseInt(searchParams.get('limit') || '100')));
    const offset = (page - 1) * limit;

    // Get lead ID from route params
    const params = await context.params;
    const leadId = params.id;

    if (!leadId) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    console.log('[LEAD-ACTIVITY] Fetching timeline for lead:', leadId, { page, limit });

    // CLIENT ISOLATION: Verify user has access to this lead's client
    const lead = await db.query.leads.findFirst({
      where: eq(leads.id, leadId),
      columns: { id: true, clientId: true },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // SUPER_ADMIN can access all leads, others must match clientId
    if (session.user.role !== 'SUPER_ADMIN' && session.user.clientId !== lead.clientId) {
      console.warn('[LEAD-ACTIVITY] Forbidden: User attempted to access lead from different client', {
        userId: session.user.id,
        userClientId: session.user.clientId,
        leadClientId: lead.clientId,
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Query activities for this lead with pagination
    // Ordered by timestamp descending (most recent first)
    const activities = await db.query.leadActivityLog.findMany({
      where: eq(leadActivityLog.leadId, leadId),
      orderBy: [desc(leadActivityLog.timestamp)],
      limit: limit,
      offset: offset,
    });

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(leadActivityLog)
      .where(eq(leadActivityLog.leadId, leadId));

    const totalCount = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalCount / limit);

    console.log('[LEAD-ACTIVITY] Found activities:', {
      count: activities.length,
      totalCount,
      page,
      totalPages,
    });

    return NextResponse.json({
      timeline: activities.map((a) => ({
        id: a.id,
        timestamp: a.timestamp,
        eventType: a.eventType,
        category: a.eventCategory,
        description: a.description,
        message: a.messageContent,
        details: a.metadata,
        source: a.source,
        executionId: a.executionId,
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error('[LEAD-ACTIVITY] Error:', error);

    if (error instanceof Error) {
      console.error('[LEAD-ACTIVITY] Error details:', {
        message: error.message,
        stack: error.stack,
      });
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
