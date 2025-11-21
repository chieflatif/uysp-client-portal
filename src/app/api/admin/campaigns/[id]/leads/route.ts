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

    const searchParams = request.nextUrl.searchParams;
    const statusFilter = searchParams.get('status');
    const eligibilityFilter = searchParams.get('eligibility');

    const rawLeads = await db
      .select({
        id: leads.id,
        firstName: leads.firstName,
        lastName: leads.lastName,
        email: leads.email,
        phone: leads.phone,
        company: leads.company,
        jobTitle: leads.title,
        leadSource: leads.leadSource,
        engagementLevel: leads.engagementLevel,
        createdAt: leads.createdAt,
        enrolledAt: leads.enrolledAt,
        icpScore: leads.icpScore,
        smsSequencePosition: leads.smsSequencePosition,
        smsEligible: leads.smsEligible,
        processingStatus: leads.processingStatus,
        smsStop: leads.smsStop,
        smsStopReason: leads.smsStopReason,
      })
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

    const normalizeStatus = (status?: string | null) => {
      const trimmed = status?.trim();
      return trimmed && trimmed.length > 0 ? trimmed : 'Unknown';
    };

    const ARCHIVED_STATUSES = new Set(['complete', 'completed', 'archived']);

    const enrichedLeads = rawLeads.map((lead) => {
      const processingStatus = normalizeStatus(lead.processingStatus);
      const isArchived = ARCHIVED_STATUSES.has(processingStatus.toLowerCase());
      const whatsappEligible =
        !lead.smsEligible && Boolean(lead.phone) && !isArchived && !lead.smsStop;

      return {
        ...lead,
        processingStatus,
        isArchived,
        whatsappEligible,
        smsEligible: Boolean(lead.smsEligible),
        enrolledAt: lead.enrolledAt ?? lead.createdAt,
      };
    });

    const filteredLeads = enrichedLeads.filter((lead) => {
      let matchesStatus = true;
      if (statusFilter && statusFilter.toLowerCase() !== 'all') {
        matchesStatus = lead.processingStatus.toLowerCase() === statusFilter.toLowerCase();
      }

      let matchesEligibility = true;
      if (eligibilityFilter) {
          switch (eligibilityFilter.toLowerCase()) {
            case 'sms':
              matchesEligibility = lead.smsEligible && !lead.isArchived && !lead.smsStop;
              break;
            case 'whatsapp':
              matchesEligibility = lead.whatsappEligible;
              break;
            case 'archived':
              matchesEligibility = lead.isArchived || lead.smsStop;
              break;
            default:
              matchesEligibility = true;
          }
      }

      return matchesStatus && matchesEligibility;
    });

    const statusCounts = enrichedLeads.reduce<Record<string, number>>((acc, lead) => {
      const key = lead.processingStatus || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const eligibilityCounts = enrichedLeads.reduce(
      (acc, lead) => {
        if (lead.smsEligible && !lead.isArchived && !lead.smsStop) {
          acc.sms += 1;
        } else if (lead.whatsappEligible) {
          acc.whatsapp += 1;
        } else if (lead.isArchived || lead.smsStop) {
          acc.archived += 1;
        }
        return acc;
      },
      { sms: 0, whatsapp: 0, archived: 0 }
    );

    return NextResponse.json({
      leads: filteredLeads,
      summary: {
        total: enrichedLeads.length,
        filtered: filteredLeads.length,
        statusCounts,
        eligibilityCounts,
      },
    });
  } catch (error) {
    console.error('Error fetching campaign leads:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
