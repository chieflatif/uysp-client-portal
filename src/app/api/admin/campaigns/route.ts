import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { campaigns, airtableSyncQueue, leads } from '@/lib/db/schema';
import { eq, desc, and, or, ilike, SQL, sql } from 'drizzle-orm';
import { z } from 'zod';
import { VALID_TYPE_FILTERS, VALID_STATUS_FILTERS, CAMPAIGN_TYPE_UI_TO_DB } from '@/lib/constants/campaigns';

/**
 * GET /api/admin/campaigns
 *
 * Fetch campaigns for authenticated user with server-side filtering.
 * Implements database-level filtering for performance and security.
 *
 * @param request - Next.js request object
 * @returns JSON response with campaigns array and count
 *
 * Query params:
 *   - clientId: (optional) Filter by client (SUPER_ADMIN only)
 *   - type: (optional) Filter by campaign type (see VALID_TYPE_FILTERS in @/lib/constants/campaigns)
 *   - status: (optional) Filter by status (see VALID_STATUS_FILTERS in @/lib/constants/campaigns)
 *
 * SECURITY: Client isolation enforced
 * - SUPER_ADMIN/ADMIN: can query any client with ?clientId param
 * - CLIENT_ADMIN/CLIENT_USER: only see their client's campaigns
 *
 * @example
 * GET /api/admin/campaigns?type=Lead%20Form&status=Active&clientId=abc123
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

    // SUPER_ADMIN can query any client
    if (session.user.role === 'SUPER_ADMIN' && queryClientId) {
      clientId = queryClientId;
    }

    // SERVER-SIDE FILTERING: Parse and validate filter parameters
    const typeParam = request.nextUrl.searchParams.get('type') || 'All';
    const statusParam = request.nextUrl.searchParams.get('status') || 'All';
    const searchParam = request.nextUrl.searchParams.get('search')?.trim() || '';

    // Validate input parameters for security monitoring
    if (!VALID_TYPE_FILTERS.includes(typeParam as typeof VALID_TYPE_FILTERS[number])) {
      console.warn(`[CAMPAIGNS API] Invalid type parameter: "${typeParam}", falling back to 'All'. Client: ${clientId}`);
    }
    if (!VALID_STATUS_FILTERS.includes(statusParam as typeof VALID_STATUS_FILTERS[number])) {
      console.warn(`[CAMPAIGNS API] Invalid status parameter: "${statusParam}", falling back to 'All'. Client: ${clientId}`);
    }

    // Map user-friendly labels to database values using centralized constants
    const dbType = CAMPAIGN_TYPE_UI_TO_DB[typeParam] || 'All';

    // Build dynamic WHERE clause with explicit type for TypeScript safety
    const filters: SQL<unknown>[] = [];

    // Client isolation filter
    if (clientId) {
      filters.push(eq(campaigns.clientId, clientId));
    }

    // Type filter
    if (dbType !== 'All') {
      filters.push(eq(campaigns.campaignType, dbType));
    }

    // Status filter (isPaused boolean)
    if (statusParam === 'Active') {
      filters.push(eq(campaigns.isPaused, false));
    } else if (statusParam === 'Paused') {
      filters.push(eq(campaigns.isPaused, true));
    }
    // 'All' status means no filter needed

    // Text search filter (case-insensitive search on name and formId)
    if (searchParam) {
      const searchFilter = or(
        ilike(campaigns.name, `%${searchParam}%`),
        ilike(campaigns.formId, `%${searchParam}%`)
      );
      if (searchFilter) {
        filters.push(searchFilter);
      }
    }

    // Fetch campaigns with filters
    const allCampaigns = await db.query.campaigns.findMany({
      where: filters.length > 0 ? and(...filters) : undefined,
      orderBy: desc(campaigns.createdAt),
    });

    // Calculate actual message counts and lead counts from leads table
    // Group by campaign_id and aggregate sms_sent_count
    const leadStats = await db
      .select({
        campaignId: leads.campaignId,
        totalLeads: sql<number>`COUNT(*)::int`,
        messagesSent: sql<number>`COALESCE(SUM(${leads.smsSentCount}), 0)::int`,
      })
      .from(leads)
      .where(eq(leads.isActive, true))
      .groupBy(leads.campaignId);

    // Create a map of campaign stats for O(1) lookup
    const statsMap = new Map(
      leadStats.map((stat) => [
        stat.campaignId,
        {
          totalLeads: stat.totalLeads,
          messagesSent: stat.messagesSent,
        },
      ])
    );

    // Merge stats with campaigns
    const campaignsWithStats = allCampaigns.map((campaign) => {
      const stats = statsMap.get(campaign.id) || { totalLeads: 0, messagesSent: 0 };
      return {
        ...campaign,
        totalLeads: stats.totalLeads,
        messagesSent: stats.messagesSent,
      };
    });

    return NextResponse.json({
      campaigns: campaignsWithStats,
      count: campaignsWithStats.length,
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/campaigns
 *
 * Create a new campaign
 * Body: CreateCampaignInput (see schema below)
 *
 * Flow:
 * 1. Validate input
 * 2. Check form_id uniqueness within client
 * 3. Insert into PostgreSQL
 * 4. Queue to Airtable sync
 * 5. Return created campaign
 */

const createCampaignSchema = z.object({
  clientId: z.string().uuid('Valid client ID required'),
  name: z.string().min(1, 'Campaign name is required').max(255),
  campaignType: z.enum(['Webinar', 'Standard']),
  formId: z.string().min(1, 'Form ID is required').max(255),
  isPaused: z.boolean().default(false),
  // Webinar-specific fields
  webinarDatetime: z.string().datetime().optional().nullable(),
  zoomLink: z.string().url('Zoom link must be a valid URL').optional().nullable(),
  resourceLink: z.string().url('Resource link must be a valid URL').optional().nullable(),
  resourceName: z.string().max(255).optional().nullable(),
}).refine((data) => {
  // HIGH PRIORITY FIX: "Both or None" validation for resource fields
  // Ensure resourceName and resourceLink are either both filled or both empty
  const hasLink = !!data.resourceLink && data.resourceLink.trim() !== '';
  const hasName = !!data.resourceName && data.resourceName.trim() !== '';
  return hasLink === hasName; // Both true or both false
}, {
  message: 'Both resource name and link are required, or both must be empty',
  path: ['resourceLink'], // Error will be attached to resourceLink field
});

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

    // For non-SUPER_ADMIN, force their clientId
    if (session.user.role !== 'SUPER_ADMIN') {
      body.clientId = session.user.clientId;
    }

    // Validate input
    const validation = createCampaignSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Additional validation for webinar campaigns
    if (data.campaignType === 'Webinar') {
      if (!data.isPaused && (!data.webinarDatetime || !data.zoomLink)) {
        return NextResponse.json(
          {
            error: 'Active webinar campaigns require webinarDatetime and zoomLink',
          },
          { status: 400 }
        );
      }

      // Webinar must be in future (warning, not blocker)
      if (data.webinarDatetime && new Date(data.webinarDatetime) < new Date()) {
        console.warn('⚠️ Creating webinar campaign with past datetime');
      }
    }

    // Check form_id uniqueness within client
    const existingCampaign = await db.query.campaigns.findFirst({
      where: and(
        eq(campaigns.clientId, data.clientId),
        eq(campaigns.formId, data.formId)
      ),
    });

    if (existingCampaign) {
      return NextResponse.json(
        {
          error: `Form ID "${data.formId}" is already in use for this client`,
        },
        { status: 409 }
      );
    }

    // Insert into PostgreSQL
    const newCampaign = await db.insert(campaigns).values({
      clientId: data.clientId,
      name: data.name,
      campaignType: data.campaignType,
      formId: data.formId,
      isPaused: data.isPaused,
      webinarDatetime: data.webinarDatetime ? new Date(data.webinarDatetime) : null,
      zoomLink: data.zoomLink || null,
      resourceLink: data.resourceLink || null,
      resourceName: data.resourceName || null,
      airtableRecordId: '', // Will be filled when synced to Airtable
      messagesSent: 0,
      totalLeads: 0,
    }).returning();

    const campaign = newCampaign[0];

    // Queue to Airtable sync
    await db.insert(airtableSyncQueue).values({
      clientId: data.clientId,
      tableName: 'Campaigns',
      recordId: campaign.id,
      operation: 'create',
      payload: {
        'Campaign Name': campaign.name,
        'Campaign Type': campaign.campaignType,
        'Form ID': campaign.formId,
        'Active': !campaign.isPaused,
        'Version': campaign.version || 1, // AUDIT FIX: Sync version on create
        'Webinar Datetime': campaign.webinarDatetime?.toISOString(),
        'Zoom Link': campaign.zoomLink,
        'Resource Link': campaign.resourceLink,
        'Resource Name': campaign.resourceName,
      },
      status: 'pending',
    });

    console.log(`✅ Created campaign "${campaign.name}" (${campaign.id})`);

    return NextResponse.json({
      campaign,
      message: 'Campaign created successfully. It will sync to Airtable within 5 minutes.',
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
