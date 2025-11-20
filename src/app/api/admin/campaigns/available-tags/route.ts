import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { campaignTagsCache } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * GET /api/admin/campaigns/available-tags
 *
 * Fetch available Kajabi tags for campaign creation
 * Tags are auto-discovered daily from leads by n8n workflow
 *
 * Query params:
 *   - clientId: (optional) Filter by client (SUPER_ADMIN only)
 *   - direct: (optional) If 'true', bypass cache and query leads table directly
 *   - filterPattern: (optional) Filter tags containing this substring (case-insensitive)
 *     Example: ?filterPattern=webinar - returns only tags containing "webinar"
 *
 * SECURITY: Client isolation enforced
 * - SUPER_ADMIN: can query any client with ?clientId param
 * - Other roles: only see their client's tags
 *
 * CRITICAL-2 FIX: Added direct query fallback when cache is empty
 * MEDIUM-2 FIX: Added filterPattern for webinar tag filtering
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Authorization check
    if (!['SUPER_ADMIN', 'ADMIN', 'CLIENT_ADMIN', 'CLIENT', 'CLIENT_USER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Determine client filter
    let clientId = session.user.clientId;
    const queryClientId = request.nextUrl.searchParams.get('clientId');
    const directQuery = request.nextUrl.searchParams.get('direct') === 'true';
    const filterPattern = request.nextUrl.searchParams.get('filterPattern');

    // SUPER_ADMIN can query any client
    if (session.user.role === 'SUPER_ADMIN' && queryClientId) {
      clientId = queryClientId;
    }

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID required' },
        { status: 400 }
      );
    }

    // CRITICAL-2 FIX: Direct query bypasses cache
    if (directQuery) {
      console.log(`📊 Direct tag query for client ${clientId}${filterPattern ? ` (filter: ${filterPattern})` : ''}`);

      // Query all unique tags from leads table
      // Using PostgreSQL unnest() to expand arrays and get distinct values
      const result = await db.execute(sql`
        WITH all_tags AS (
          SELECT DISTINCT unnest(kajabi_tags) as tag
          FROM leads
          WHERE client_id = ${clientId}
            AND kajabi_tags IS NOT NULL
            AND array_length(kajabi_tags, 1) > 0
        )
        SELECT tag
        FROM all_tags
        ${filterPattern ? sql`WHERE LOWER(tag) LIKE LOWER(${'%' + filterPattern + '%'})` : sql``}
        ORDER BY tag
      `);

      // Handle both result.rows (postgres) and result itself being an array
      const rows = (result as { rows?: Array<{ tag: string | null }> } | Array<{ tag: string | null }>);
      const normalizedRows = Array.isArray(rows) ? rows : rows.rows ?? [];
      const tags = normalizedRows.map(row => row.tag).filter((tag): tag is string => Boolean(tag));

      console.log(`✅ Found ${tags.length} tags directly from leads table`);

      return NextResponse.json({
        tags,
        count: tags.length,
        lastUpdated: new Date().toISOString(),
        source: 'direct_query',
        filterApplied: filterPattern || null,
      });
    }

    // Default: Fetch tags from cache
    const cache = await db.query.campaignTagsCache.findFirst({
      where: eq(campaignTagsCache.clientId, clientId),
    });

    if (!cache) {
      return NextResponse.json({
        tags: [],
        count: 0,
        lastUpdated: null,
        source: 'cache',
        filterApplied: filterPattern || null,
        message: 'No tags discovered yet. Tags are updated daily at 2:00 AM ET. Try using direct query or manual entry.',
      });
    }

    let tags = cache.tags as string[];
    const originalTagCount = tags.length;

    // MEDIUM-2 FIX: Apply filter pattern if provided
    if (filterPattern) {
      const lowerPattern = filterPattern.toLowerCase();
      tags = tags.filter(tag => tag.toLowerCase().includes(lowerPattern));
      console.log(`🔍 Filtered ${originalTagCount} cached tags to ${tags.length} matching "${filterPattern}"`);
    }

    return NextResponse.json({
      tags,
      count: tags.length,
      lastUpdated: cache.generatedAt.toISOString(),
      source: 'cache',
      filterApplied: filterPattern || null,
    });
  } catch (error) {
    console.error('Error fetching available tags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
