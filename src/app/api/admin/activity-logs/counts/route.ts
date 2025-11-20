import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { leadActivityLog } from '@/lib/db/schema';
import { sql, and, or, eq } from 'drizzle-orm';

/**
 * GET /api/admin/activity-logs/counts
 *
 * Returns per-category counts for activity logs.
 * Used by UI to display accurate counts on filter chips.
 *
 * Query Parameters:
 *   - search: optional search term (filters counts to matching activities)
 *   - leadId: optional lead UUID (filters counts to specific lead)
 *
 * Returns:
 *   {
 *     all: 67,
 *     SMS: 42,
 *     BOOKING: 18,
 *     CAMPAIGN: 7,
 *     ...
 *   }
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authentication & Authorization
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;
    const userClientId = session.user.clientId;
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    const isClientUser = userRole === 'CLIENT_USER';

    if (!isAdmin && !isClientUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (isClientUser && !userClientId) {
      return NextResponse.json(
        { error: 'Forbidden - Missing client context' },
        { status: 403 }
      );
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const leadId = searchParams.get('leadId') || undefined;
    const leadAirtableId = searchParams.get('leadAirtableId') || undefined;

    // 3. Build WHERE clause for filters (if provided)
    // Use same full-text search as main endpoint for consistency and security
    const conditions = [];

    // Full-text search filter
    if (search) {
      conditions.push(
        sql`to_tsvector('english', ${leadActivityLog.description} || ' ' || COALESCE(${leadActivityLog.messageContent}, '')) @@ plainto_tsquery('english', ${search})`
      );
    }

    const leadFilters = [];
    if (leadId) {
      leadFilters.push(eq(leadActivityLog.leadId, leadId));
    }
    if (leadAirtableId) {
      leadFilters.push(eq(leadActivityLog.leadAirtableId, leadAirtableId));
    }
    if (leadFilters.length === 1) {
      conditions.push(leadFilters[0]);
    } else if (leadFilters.length > 1) {
      conditions.push(or(...leadFilters));
    }

    if (isAdmin) {
      const clientIdParam = searchParams.get('clientId');
      if (clientIdParam) {
        conditions.push(eq(leadActivityLog.clientId, clientIdParam));
      }
    } else if (isClientUser && userClientId) {
      conditions.push(eq(leadActivityLog.clientId, userClientId));
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    // 4. Get category counts with single query
    const countResults = await db
      .select({
        category: leadActivityLog.eventCategory,
        count: sql<number>`count(*)`,
      })
      .from(leadActivityLog)
      .where(whereClause)
      .groupBy(leadActivityLog.eventCategory);

    // 5. Transform to object format
    const counts: Record<string, number> = {
      all: 0,
    };

    for (const row of countResults) {
      const category = row.category;
      const count = Number(row.count);
      counts[category] = count;
      counts.all += count;
    }

    return NextResponse.json(counts);
  } catch (error) {
    console.error('[ACTIVITY-LOGS-COUNTS] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch category counts',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
