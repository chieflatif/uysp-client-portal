import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { leads, campaigns } from '@/lib/db/schema';
import { eq, and, or, sql } from 'drizzle-orm';

/**
 * GET /api/admin/campaigns/[id]/leads
 *
 * Get all leads associated with a specific campaign
 *
 * Leads are matched to campaigns by:
 * - campaignName field matching campaign.id
 * - OR leadSource matching campaign name
 * - OR formId matching campaign.formId
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
    if (!['SUPER_ADMIN', 'ADMIN', 'CLIENT_ADMIN', 'CLIENT', 'CLIENT_USER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { id: campaignId } = await params;

    // First, get the campaign to check authorization and get details
    const whereClause =
      session.user.role === 'SUPER_ADMIN'
        ? eq(campaigns.id, campaignId)
        : and(
            eq(campaigns.id, campaignId),
            eq(campaigns.clientId, session.user.clientId!)
          );

    const campaign = await db.query.campaigns.findFirst({
      where: whereClause,
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Fetch leads associated with this campaign
    // Match by:
    // 1. campaignName = campaign.id (direct association)
    // 2. leadSource = campaign.name (legacy/fallback)
    // 3. formId = campaign.formId (form-based matching)
    const campaignLeads = await db
      .select()
      .from(leads)
      .where(
        and(
          eq(leads.clientId, campaign.clientId),
          eq(leads.isActive, true),
          or(
            eq(leads.campaignName, campaign.id),
            eq(leads.leadSource, campaign.name),
            campaign.formId ? eq(leads.formId, campaign.formId) : sql`false`
          )
        )
      )
      .orderBy(sql`${leads.createdAt} DESC`);

    return NextResponse.json(campaignLeads);
  } catch (error) {
    console.error('Error fetching campaign leads:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
