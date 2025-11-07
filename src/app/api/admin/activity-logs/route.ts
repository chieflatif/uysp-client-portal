import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { leadActivityLog, leads } from '@/lib/db/schema';
import { desc, asc, eq, and, sql, gte, lte } from 'drizzle-orm';

/**
 * GET /api/admin/activity-logs
 *
 * Power admin activity browser UI with search, filters, and pagination.
 * Allows admins to browse all system events without writing SQL queries.
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50, max: 100)
 * - search: Full-text search on description + messageContent
 * - eventType: Filter by specific event type
 * - eventCategory: Filter by event category (SMS, CAMPAIGN, BOOKING, etc.)
 * - leadId: Filter by specific lead UUID
 * - dateFrom: Filter events >= this date (ISO 8601)
 * - dateTo: Filter events <= this date (ISO 8601)
 * - sortBy: Sort field (timestamp, eventType, eventCategory) (default: timestamp)
 * - sortOrder: Sort direction (asc, desc) (default: desc)
 *
 * Security: SUPER_ADMIN or ADMIN only
 * PRD Reference: docs/PRD-MINI-CRM-ACTIVITY-LOGGING.md Section 4.3 Endpoint #2
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Authorization - Only ADMIN or SUPER_ADMIN
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const search = searchParams.get('search');
    const eventType = searchParams.get('eventType');
    const eventCategory = searchParams.get('eventCategory');
    const leadId = searchParams.get('leadId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sortBy = searchParams.get('sortBy') || 'timestamp';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    console.log('[ADMIN-ACTIVITY-LOGS] Query params:', {
      page,
      limit,
      search,
      eventType,
      eventCategory,
      leadId,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    });

    // Build WHERE clause conditions
    const conditions = [];

    // Full-text search on description + messageContent (uses GIN index)
    if (search) {
      conditions.push(
        sql`to_tsvector('english', ${leadActivityLog.description} || ' ' || COALESCE(${leadActivityLog.messageContent}, '')) @@ plainto_tsquery('english', ${search})`
      );
    }

    // Event type filter
    if (eventType) {
      conditions.push(eq(leadActivityLog.eventType, eventType));
    }

    // Event category filter
    if (eventCategory) {
      conditions.push(eq(leadActivityLog.eventCategory, eventCategory));
    }

    // Lead ID filter
    if (leadId) {
      conditions.push(eq(leadActivityLog.leadId, leadId));
    }

    // Date range filters (using Drizzle operators to prevent SQL injection)
    if (dateFrom) {
      try {
        const fromDate = new Date(dateFrom);
        if (!isNaN(fromDate.getTime())) {
          conditions.push(gte(leadActivityLog.timestamp, fromDate));
        } else {
          console.error('[ADMIN-ACTIVITY-LOGS] Invalid dateFrom:', dateFrom);
        }
      } catch (e) {
        console.error('[ADMIN-ACTIVITY-LOGS] Invalid dateFrom:', dateFrom, e);
      }
    }

    if (dateTo) {
      try {
        const toDate = new Date(dateTo);
        if (!isNaN(toDate.getTime())) {
          conditions.push(lte(leadActivityLog.timestamp, toDate));
        } else {
          console.error('[ADMIN-ACTIVITY-LOGS] Invalid dateTo:', dateTo);
        }
      } catch (e) {
        console.error('[ADMIN-ACTIVITY-LOGS] Invalid dateTo:', dateTo, e);
      }
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build dynamic ORDER BY clause
    const sortField = (() => {
      switch (sortBy) {
        case 'eventType':
          return leadActivityLog.eventType;
        case 'eventCategory':
          return leadActivityLog.eventCategory;
        case 'timestamp':
        default:
          return leadActivityLog.timestamp;
      }
    })();

    const sortDirection = sortOrder === 'asc' ? asc : desc;

    // Execute query with pagination and joins
    const activities = await db
      .select({
        // Activity fields
        id: leadActivityLog.id,
        timestamp: leadActivityLog.timestamp,
        eventType: leadActivityLog.eventType,
        eventCategory: leadActivityLog.eventCategory,
        description: leadActivityLog.description,
        messageContent: leadActivityLog.messageContent,
        metadata: leadActivityLog.metadata,
        source: leadActivityLog.source,
        executionId: leadActivityLog.executionId,
        leadAirtableId: leadActivityLog.leadAirtableId,

        // Lead fields (for enriched display)
        leadId: leads.id,
        leadFirstName: leads.firstName,
        leadLastName: leads.lastName,
        leadEmail: leads.email,
      })
      .from(leadActivityLog)
      .leftJoin(leads, eq(leadActivityLog.leadId, leads.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(sortDirection(sortField))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(leadActivityLog)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const totalCount = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalCount / limit);

    console.log('[ADMIN-ACTIVITY-LOGS] Results:', {
      count: activities.length,
      totalCount,
      page,
      totalPages,
    });

    return NextResponse.json({
      activities: activities.map((a) => ({
        id: a.id,
        timestamp: a.timestamp,
        eventType: a.eventType,
        category: a.eventCategory,
        description: a.description,
        messageContent: a.messageContent,
        metadata: a.metadata,
        source: a.source,
        executionId: a.executionId,
        lead: a.leadId
          ? {
              id: a.leadId,
              firstName: a.leadFirstName,
              lastName: a.leadLastName,
              email: a.leadEmail,
            }
          : null,
        leadAirtableId: a.leadAirtableId, // For cases where lead not synced yet
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
    console.error('[ADMIN-ACTIVITY-LOGS] Error:', error);

    if (error instanceof Error) {
      console.error('[ADMIN-ACTIVITY-LOGS] Error details:', {
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
