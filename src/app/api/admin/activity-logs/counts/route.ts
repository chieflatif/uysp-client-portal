import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { leadActivityLog } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

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
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const leadId = searchParams.get('leadId') || undefined;

    // 3. Build WHERE clause for filters (if provided)
    // Use same full-text search as main endpoint for consistency and security
    const conditions = [];

    // Lead ID filter
    if (leadId) {
      conditions.push(sql`${leadActivityLog.leadId} = ${leadId}`);
    }

    // Full-text search filter
    if (search) {
      // PostgreSQL full-text search (same as main activity-logs endpoint)
      // Uses GIN index and is immune to SQL injection
      conditions.push(sql`to_tsvector('english', ${leadActivityLog.description} || ' ' || COALESCE(${leadActivityLog.messageContent}, '')) @@ plainto_tsquery('english', ${search})`);
    }

    // Combine conditions with AND
    const whereClause = conditions.length > 0
      ? sql`${sql.join(conditions, sql` AND `)}`
      : sql`1=1`;

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
