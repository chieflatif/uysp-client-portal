import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { leads } from '@/lib/db/schema';
import { and, eq, gte, lte, arrayContains, or, sql, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { buildLeadFilterConditions } from '@/lib/utils/campaign-filters';

/**
 * POST /api/admin/campaigns/preview-leads
 *
 * Preview how many leads match campaign filters
 * Used before campaign creation to validate targeting
 *
 * Body: PreviewLeadsInput (see schema below)
 *
 * Returns:
 * - Total leads matching filters
 * - Sample leads (first 10 for preview)
 * - Breakdown by engagement level
 */

const previewLeadsSchema = z.object({
  clientId: z.string().uuid('Valid client ID required'),
  targetTags: z.array(z.string()).min(1, 'At least one tag required'),
  // Date range filters
  createdAfter: z.string().datetime().optional().nullable(),
  createdBefore: z.string().datetime().optional().nullable(),
  // Score filters
  minIcpScore: z.number().min(0).max(100).optional().nullable(),
  maxIcpScore: z.number().min(0).max(100).optional().nullable(),
  // VALIDATION: Ensure empty array is rejected (would cause invalid SQL: WHERE engagement_level IN ())
  engagementLevels: z.array(z.enum(['High', 'Medium', 'Low']))
    .min(1, 'Select at least one engagement level if filtering by engagement')
    .optional()
    .nullable(),
  // Exclusions
  excludeBooked: z.boolean().default(true),
  excludeSmsStop: z.boolean().default(true),
  excludeInActiveCampaign: z.boolean().default(true),
}).refine((data) => {
  // BUG #5 FIX: Validate ICP score range
  // Ensure minIcpScore is not greater than maxIcpScore
  if (
    data.minIcpScore !== null &&
    data.minIcpScore !== undefined &&
    data.maxIcpScore !== null &&
    data.maxIcpScore !== undefined
  ) {
    return data.minIcpScore <= data.maxIcpScore;
  }
  return true; // If either is null/undefined, skip validation
}, {
  message: 'minIcpScore must be less than or equal to maxIcpScore',
  path: ['minIcpScore'], // Error will be attached to minIcpScore field
}).refine((data) => {
  // BUG #10 FIX: Validate date range
  // Ensure createdAfter is not later than createdBefore
  if (data.createdAfter && data.createdBefore) {
    const afterDate = new Date(data.createdAfter);
    const beforeDate = new Date(data.createdBefore);
    return afterDate <= beforeDate;
  }
  return true; // If either is missing, skip validation
}, {
  message: 'createdAfter date must be earlier than or equal to createdBefore date',
  path: ['createdAfter'], // Error will be attached to createdAfter field
});

type PreviewLeadsInput = z.infer<typeof previewLeadsSchema>;

export async function POST(request: NextRequest) {
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

    const body = await request.json();

    // SECURITY: Force clientId IMMEDIATELY for non-SUPER_ADMIN users
    // This prevents any potential timing attacks or validation bypasses
    if (session.user.role !== 'SUPER_ADMIN') {
      body.clientId = session.user.clientId;
      // Make clientId immutable to prevent any further modification attempts
      Object.defineProperty(body, 'clientId', {
        value: session.user.clientId,
        writable: false,
        configurable: false,
      });
    }

    // Validate input
    const validation = previewLeadsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const filters = validation.data;

    // BUG #15 FIX: Use shared filter utility to ensure consistency
    // with campaign creation endpoint (prevents preview/enrollment mismatches)
    const conditions = buildLeadFilterConditions({
      clientId: filters.clientId,
      targetTags: filters.targetTags,
      createdAfter: filters.createdAfter,
      createdBefore: filters.createdBefore,
      minIcpScore: filters.minIcpScore,
      maxIcpScore: filters.maxIcpScore,
      engagementLevels: filters.engagementLevels,
      excludeBooked: filters.excludeBooked,
      excludeSmsStop: filters.excludeSmsStop,
      excludeInActiveCampaign: filters.excludeInActiveCampaign,
    });

    // Fetch matching leads (limit to 10 for preview)
    const matchingLeads = await db.query.leads.findMany({
      where: and(...conditions),
      limit: 10,
      columns: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        icpScore: true,
        engagementLevel: true,
        kajabiTags: true,
        createdAt: true,
      },
    });

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(and(...conditions));

    const totalCount = Number(countResult[0]?.count || 0);

    // Breakdown by engagement level
    const engagementBreakdown = await db
      .select({
        level: leads.engagementLevel,
        count: sql<number>`count(*)`,
      })
      .from(leads)
      .where(and(...conditions))
      .groupBy(leads.engagementLevel);

    return NextResponse.json({
      totalCount,
      sampleLeads: matchingLeads,
      engagementBreakdown: engagementBreakdown.map(row => ({
        level: row.level || 'Unknown',
        count: Number(row.count),
      })),
      filters: {
        targetTags: filters.targetTags,
        dateRange: {
          after: filters.createdAfter,
          before: filters.createdBefore,
        },
        icpScoreRange: {
          min: filters.minIcpScore,
          max: filters.maxIcpScore,
        },
        engagementLevels: filters.engagementLevels,
        exclusions: {
          booked: filters.excludeBooked,
          smsStop: filters.excludeSmsStop,
          inActiveCampaign: filters.excludeInActiveCampaign,
        },
      },
    });
  } catch (error) {
    console.error('Error previewing leads:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
