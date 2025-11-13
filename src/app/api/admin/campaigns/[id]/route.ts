import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { campaigns, airtableSyncQueue } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

/**
 * GET /api/admin/campaigns/[id]
 *
 * Get single campaign details by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Authorization check
    if (!['SUPER_ADMIN', 'ADMIN', 'CLIENT_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const campaignId = (await params).id;

    // Build where clause based on role
    const whereClause =
      session.user.role === 'SUPER_ADMIN'
        ? eq(campaigns.id, campaignId)
        : and(
            eq(campaigns.id, campaignId),
            eq(campaigns.clientId, session.user.clientId!)
          );

    // Fetch campaign
    const campaign = await db.query.campaigns.findFirst({
      where: whereClause,
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/campaigns/[id]
 *
 * Update an existing campaign (in-place upgrade)
 * Body: Partial campaign update fields
 *
 * PHASE 3: Automatic version bumping when messages change
 * - Compares old vs new messages array
 * - If messages changed → increment version
 * - In-progress leads keep their enrolled version
 * - New enrollments get the updated version
 *
 * Flow:
 * 1. Fetch existing campaign
 * 2. Validate authorization
 * 3. Detect message changes
 * 4. Auto-increment version if needed
 * 5. Update campaign in PostgreSQL
 * 6. Queue to Airtable sync (including version)
 */

const updateCampaignSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  campaignType: z.enum(['Webinar', 'Standard', 'Custom']).optional(),
  formId: z.string().min(1).max(255).optional(),
  isPaused: z.boolean().optional(),
  // Webinar-specific fields
  webinarDatetime: z.string().datetime().optional().nullable(),
  zoomLink: z.string().url().optional().nullable(),
  resourceLink: z.string().url().optional().nullable(),
  resourceName: z.string().max(255).optional().nullable(),
  // Custom campaign fields
  targetTags: z.array(z.string()).optional(),
  messages: z.array(z.object({
    step: z.number(),
    delayMinutes: z.number(),
    text: z.string(),
  })).optional(),
  startDatetime: z.string().datetime().optional().nullable(),
  enrollmentStatus: z.enum(['scheduled', 'active', 'paused', 'completed']).optional(),
  maxLeadsToEnroll: z.number().int().positive().optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Authorization check
    if (!['SUPER_ADMIN', 'ADMIN', 'CLIENT_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const campaignId = (await params).id;

    // Build where clause based on role
    const whereClause =
      session.user.role === 'SUPER_ADMIN'
        ? eq(campaigns.id, campaignId)
        : and(
            eq(campaigns.id, campaignId),
            eq(campaigns.clientId, session.user.clientId!)
          );

    // Fetch existing campaign
    const existingCampaign = await db.query.campaigns.findFirst({
      where: whereClause,
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const validation = updateCampaignSchema.safeParse(body);

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

    // PHASE 3: Detect if messages have changed
    let newVersion = existingCampaign.version || 1;
    let messagesChanged = false;

    if (data.messages !== undefined) {
      // Deep comparison of message arrays
      const oldMessages = JSON.stringify(existingCampaign.messages || []);
      const newMessages = JSON.stringify(data.messages);

      if (oldMessages !== newMessages) {
        messagesChanged = true;
        newVersion = newVersion + 1;
        console.log(
          `📦 Campaign "${existingCampaign.name}" messages changed: ` +
          `version ${existingCampaign.version || 1} → ${newVersion}`
        );
      }
    }

    // Prepare update payload
    const updatePayload: any = {
      ...data,
      updatedAt: new Date(),
    };

    // Add version if messages changed
    if (messagesChanged) {
      updatePayload.version = newVersion;
    }

    // Convert datetime strings to Date objects
    if (data.webinarDatetime) {
      updatePayload.webinarDatetime = new Date(data.webinarDatetime);
    }
    if (data.startDatetime) {
      updatePayload.startDatetime = new Date(data.startDatetime);
    }

    // Update campaign in PostgreSQL
    const updatedCampaigns = await db.update(campaigns)
      .set(updatePayload)
      .where(eq(campaigns.id, campaignId))
      .returning();

    const updatedCampaign = updatedCampaigns[0];

    // Queue to Airtable sync (PHASE 3: include version)
    await db.insert(airtableSyncQueue).values({
      clientId: updatedCampaign.clientId,
      tableName: 'Campaigns',
      recordId: updatedCampaign.id,
      operation: 'update',
      payload: {
        'Campaign Name': updatedCampaign.name,
        'Campaign Type': updatedCampaign.campaignType,
        'Form ID': updatedCampaign.formId,
        'Active': !updatedCampaign.isPaused,
        'Version': updatedCampaign.version, // PHASE 3: Sync version to Airtable
        'Webinar Datetime': updatedCampaign.webinarDatetime?.toISOString(),
        'Zoom Link': updatedCampaign.zoomLink,
        'Resource Link': updatedCampaign.resourceLink,
        'Resource Name': updatedCampaign.resourceName,
        'Target Tags': updatedCampaign.targetTags?.join(', '),
        'Messages': JSON.stringify(updatedCampaign.messages),
        'Enrollment Status': updatedCampaign.enrollmentStatus,
      },
      status: 'pending',
    });

    console.log(
      `✅ Updated campaign "${updatedCampaign.name}" (${updatedCampaign.id})` +
      (messagesChanged ? ` [Version bumped: ${existingCampaign.version || 1} → ${newVersion}]` : '')
    );

    return NextResponse.json({
      campaign: updatedCampaign,
      message: 'Campaign updated successfully. Changes will sync to Airtable within 5 minutes.',
      versionBumped: messagesChanged,
      newVersion: messagesChanged ? newVersion : undefined,
    });

  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
