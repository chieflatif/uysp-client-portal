import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { campaigns, airtableSyncQueue } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { z } from 'zod';

/**
 * GET /api/admin/campaigns
 *
 * Fetch all campaigns for authenticated user
 * Query params:
 *   - clientId: (optional) Filter by client (SUPER_ADMIN only)
 *
 * SECURITY: Client isolation enforced
 * - SUPER_ADMIN/ADMIN: can query any client with ?clientId param
 * - CLIENT_ADMIN/CLIENT_USER: only see their client's campaigns
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

    // Fetch campaigns
    const allCampaigns = await db.query.campaigns.findMany({
      where: clientId ? eq(campaigns.clientId, clientId) : undefined,
      orderBy: desc(campaigns.createdAt),
    });

    return NextResponse.json({
      campaigns: allCampaigns,
      count: allCampaigns.length,
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
