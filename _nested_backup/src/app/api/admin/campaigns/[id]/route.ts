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
 * Fetch a single campaign by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const campaign = await db.query.campaigns.findFirst({
      where: eq(campaigns.id, params.id),
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Check client access (non-SUPER_ADMIN can only access their client's campaigns)
    if (
      session.user.role !== 'SUPER_ADMIN' &&
      campaign.clientId !== session.user.clientId
    ) {
      return NextResponse.json(
        { error: 'Forbidden - Cannot access this campaign' },
        { status: 403 }
      );
    }

    return NextResponse.json({ campaign });
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
 * Update an existing campaign
 * Body: Partial<CreateCampaignInput>
 */

const updateCampaignSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  campaignType: z.enum(['Webinar', 'Standard']).optional(),
  formId: z.string().min(1).max(255).optional(),
  isPaused: z.boolean().optional(),
  webinarDatetime: z.string().datetime().optional().nullable(),
  zoomLink: z.string().url('Zoom link must be a valid URL').optional().nullable(),
  resourceLink: z.string().url('Resource link must be a valid URL').optional().nullable(),
  resourceName: z.string().max(255).optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Fetch existing campaign
    const existingCampaign = await db.query.campaigns.findFirst({
      where: eq(campaigns.id, params.id),
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Check client access
    if (
      session.user.role !== 'SUPER_ADMIN' &&
      existingCampaign.clientId !== session.user.clientId
    ) {
      return NextResponse.json(
        { error: 'Forbidden - Cannot modify this campaign' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
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

    const updates = validation.data;

    // Additional validation for webinar campaigns
    const finalType = updates.campaignType || existingCampaign.campaignType;
    const finalPaused = updates.isPaused !== undefined ? updates.isPaused : existingCampaign.isPaused;
    const finalWebinarDatetime = updates.webinarDatetime !== undefined
      ? updates.webinarDatetime
      : existingCampaign.webinarDatetime?.toISOString();
    const finalZoomLink = updates.zoomLink !== undefined
      ? updates.zoomLink
      : existingCampaign.zoomLink;

    if (finalType === 'Webinar' && !finalPaused) {
      if (!finalWebinarDatetime || !finalZoomLink) {
        return NextResponse.json(
          {
            error: 'Active webinar campaigns require webinarDatetime and zoomLink',
          },
          { status: 400 }
        );
      }
    }

    // Check form_id uniqueness if being changed
    if (updates.formId && updates.formId !== existingCampaign.formId) {
      const conflictingCampaign = await db.query.campaigns.findFirst({
        where: and(
          eq(campaigns.clientId, existingCampaign.clientId),
          eq(campaigns.formId, updates.formId)
        ),
      });

      if (conflictingCampaign) {
        return NextResponse.json(
          {
            error: `Form ID "${updates.formId}" is already in use for this client`,
          },
          { status: 409 }
        );
      }
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (updates.name) updateData.name = updates.name;
    if (updates.campaignType) updateData.campaignType = updates.campaignType;
    if (updates.formId) updateData.formId = updates.formId;
    if (updates.isPaused !== undefined) updateData.isPaused = updates.isPaused;
    if (updates.webinarDatetime !== undefined) {
      updateData.webinarDatetime = updates.webinarDatetime ? new Date(updates.webinarDatetime) : null;
    }
    if (updates.zoomLink !== undefined) updateData.zoomLink = updates.zoomLink;
    if (updates.resourceLink !== undefined) updateData.resourceLink = updates.resourceLink;
    if (updates.resourceName !== undefined) updateData.resourceName = updates.resourceName;

    // Update in PostgreSQL
    const updatedCampaigns = await db
      .update(campaigns)
      .set(updateData)
      .where(eq(campaigns.id, params.id))
      .returning();

    const updatedCampaign = updatedCampaigns[0];

    // Queue to Airtable sync
    await db.insert(airtableSyncQueue).values({
      clientId: existingCampaign.clientId,
      tableName: 'Campaigns',
      recordId: params.id,
      operation: 'update',
      payload: {
        'Campaign Name': updatedCampaign.name,
        'Campaign Type': updatedCampaign.campaignType,
        'Form ID': updatedCampaign.formId,
        'Active': !updatedCampaign.isPaused,
        'Webinar Datetime': updatedCampaign.webinarDatetime?.toISOString(),
        'Zoom Link': updatedCampaign.zoomLink,
        'Resource Link': updatedCampaign.resourceLink,
        'Resource Name': updatedCampaign.resourceName,
      },
      status: 'pending',
    });

    console.log(`✅ Updated campaign "${updatedCampaign.name}" (${params.id})`);

    return NextResponse.json({
      campaign: updatedCampaign,
      message: 'Campaign updated successfully. Changes will sync to Airtable within 5 minutes.',
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/campaigns/[id]
 *
 * Soft delete: Set isPaused = true (deactivate campaign)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Fetch existing campaign
    const existingCampaign = await db.query.campaigns.findFirst({
      where: eq(campaigns.id, params.id),
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Check client access
    if (
      session.user.role !== 'SUPER_ADMIN' &&
      existingCampaign.clientId !== session.user.clientId
    ) {
      return NextResponse.json(
        { error: 'Forbidden - Cannot delete this campaign' },
        { status: 403 }
      );
    }

    // Soft delete by setting isPaused = true
    const updatedCampaigns = await db
      .update(campaigns)
      .set({
        isPaused: true,
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, params.id))
      .returning();

    const deactivatedCampaign = updatedCampaigns[0];

    // Queue to Airtable sync
    await db.insert(airtableSyncQueue).values({
      clientId: existingCampaign.clientId,
      tableName: 'Campaigns',
      recordId: params.id,
      operation: 'update',
      payload: {
        'Active': false, // Deactivated
      },
      status: 'pending',
    });

    console.log(`✅ Deactivated campaign "${deactivatedCampaign.name}" (${params.id})`);

    return NextResponse.json({
      campaign: deactivatedCampaign,
      message: 'Campaign deactivated successfully. Changes will sync to Airtable within 5 minutes.',
    });
  } catch (error) {
    console.error('Error deactivating campaign:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
