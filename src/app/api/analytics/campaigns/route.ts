import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { clients as clientsTable, leads, campaigns } from '@/lib/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

/**
 * GET /api/analytics/campaigns
 * 
 * Get comprehensive analytics for all campaigns including sequence distribution,
 * conversion metrics, and click tracking.
 * 
 * Contract: See docs/api-contracts/ANALYTICS-REPORTING-API.md#contract-1
 * SOP: SOP§1.1 Step 2 - Implementation to pass tests
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const requestedClientId = searchParams.get('clientId');
    const campaignFilter = searchParams.get('campaignName');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Authorization - SECURITY FIX: Strict client isolation for CLIENT_ADMIN/CLIENT_USER
    let clientId = session.user.clientId;

    // SUPER_ADMIN can see any client or all clients
    if (session.user.role === 'SUPER_ADMIN') {
      clientId = requestedClientId || null;

      // Default to UYSP if no client specified
      if (!clientId) {
        const uyspClient = await db.query.clients.findFirst({
          where: () => eq(clientsTable.companyName, 'UYSP'),
        });
        if (uyspClient) clientId = uyspClient.id;
      }
    } else if (session.user.role === 'CLIENT_ADMIN' || session.user.role === 'CLIENT_USER') {
      // SECURITY FIX: CLIENT_ADMIN/USER can ONLY access their own client data
      if (requestedClientId && requestedClientId !== session.user.clientId) {
        return NextResponse.json(
          { error: 'Forbidden - can only access your own client data', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
      clientId = session.user.clientId;
    } else if (requestedClientId) {
      // Other roles cannot request different client data
      return NextResponse.json(
        { error: 'Access denied', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // CRITICAL FIX: Use proper LEFT JOIN on campaign_id to get actual campaign names
    // Build WHERE conditions
    const conditions = [];
    if (clientId) {
      conditions.push(eq(leads.clientId, clientId));
    }
    if (startDate) {
      conditions.push(gte(leads.createdAt, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(leads.createdAt, new Date(endDate)));
    }

    // Query with LEFT JOIN to campaigns table
    const leadsWithCampaigns = await db
      .select({
        // Lead fields
        id: leads.id,
        email: leads.email,
        firstName: leads.firstName,
        lastName: leads.lastName,
        phone: leads.phone,
        company: leads.company,
        title: leads.title,
        icpScore: leads.icpScore,
        status: leads.status,
        booked: leads.booked,
        bookedAt: leads.bookedAt,
        smsStop: leads.smsStop,
        smsSequencePosition: leads.smsSequencePosition,
        smsSentCount: leads.smsSentCount,
        smsLastSentAt: leads.smsLastSentAt,
        processingStatus: leads.processingStatus,
        clickedLink: leads.clickedLink,
        clickCount: leads.clickCount,
        firstClickedAt: leads.firstClickedAt,
        shortLinkId: leads.shortLinkId,
        shortLinkUrl: leads.shortLinkUrl,
        createdAt: leads.createdAt,
        formId: leads.formId,
        campaignId: leads.campaignId,
        // Campaign name with COALESCE for NULL campaign_id
        campaignName: sql<string>`COALESCE(${campaigns.name}, 'Unassigned')`.as('campaignName'),
      })
      .from(leads)
      .leftJoin(campaigns, eq(leads.campaignId, campaigns.id))
      .where(conditions.length > 1 ? and(...conditions) : conditions[0]);

    // Filter by campaign name if requested
    const allLeads = campaignFilter
      ? leadsWithCampaigns.filter(l => l.campaignName === campaignFilter)
      : leadsWithCampaigns;

    // Group leads by campaign name (now using the actual campaign name from JOIN)
    const campaignGroups = new Map<string, typeof allLeads>();

    for (const lead of allLeads) {
      const campaignName = lead.campaignName;

      if (!campaignGroups.has(campaignName)) {
        campaignGroups.set(campaignName, []);
      }
      campaignGroups.get(campaignName)!.push(lead);
    }

    // Calculate analytics for each campaign
    const campaignStats = Array.from(campaignGroups.entries()).map(([name, campaignLeads]) => {
      const totalLeads = campaignLeads.length;

      // Sequence distribution
      const sequenceSteps = {
        notStarted: campaignLeads.filter(l => (l.smsSequencePosition || 0) === 0).length,
        step1: campaignLeads.filter(l => l.smsSequencePosition === 1).length,
        step2: campaignLeads.filter(l => l.smsSequencePosition === 2).length,
        step3: campaignLeads.filter(l => l.smsSequencePosition === 3).length,
        completed: campaignLeads.filter(l => l.processingStatus === 'Completed').length,
      };

      // Status breakdown
      const statusBreakdown = {
        queued: campaignLeads.filter(l => l.processingStatus === 'Queued').length,
        readyForSMS: campaignLeads.filter(l => l.processingStatus === 'Ready for SMS').length,
        inSequence: campaignLeads.filter(l => l.processingStatus === 'In Sequence').length,
        stopped: campaignLeads.filter(l => l.processingStatus === 'Stopped').length,
        completed: campaignLeads.filter(l => l.processingStatus === 'Completed').length,
      };

      // Conversions
      const booked = campaignLeads.filter(l => l.booked === true).length;
      const optedOut = campaignLeads.filter(l => l.smsStop === true).length;
      const replied = 0; // Will need to implement reply tracking

      const conversions = {
        booked,
        optedOut,
        replied,
        bookingRate: totalLeads > 0 ? (booked / totalLeads) * 100 : 0,
        optOutRate: totalLeads > 0 ? (optedOut / totalLeads) * 100 : 0,
      };

      // Click tracking
      const totalClicks = campaignLeads.reduce((sum, l) => sum + (l.clickCount || 0), 0);
      const uniqueClickers = campaignLeads.filter(l => l.clickedLink === true).length;

      const clicks = {
        totalClicks,
        uniqueClickers,
        clickRate: totalLeads > 0 ? (uniqueClickers / totalLeads) * 100 : 0,
      };

      // Message stats
      const totalSent = campaignLeads.reduce((sum, l) => sum + (l.smsSentCount || 0), 0);
      const leadsWithMessages = campaignLeads.filter(l => l.smsLastSentAt);
      const lastSentAt = leadsWithMessages.length > 0
        ? leadsWithMessages.reduce((latest, l) => 
            (l.smsLastSentAt && (!latest || l.smsLastSentAt > latest)) ? l.smsLastSentAt : latest,
            null as Date | null
          )
        : null;

      const messages = {
        totalSent,
        avgPerLead: totalLeads > 0 ? totalSent / totalLeads : 0,
        lastSentAt: lastSentAt ? lastSentAt.toISOString() : null,
      };

      return {
        name,
        totalLeads,
        sequenceSteps,
        statusBreakdown,
        conversions,
        clicks,
        messages,
      };
    });

    // Sort campaigns by total leads (descending)
    campaignStats.sort((a, b) => b.totalLeads - a.totalLeads);

    // Filter out "Unassigned" from the response (not a real campaign)
    const filteredCampaigns = campaignStats.filter(c => c.name !== 'Unassigned');

    return NextResponse.json({
      success: true,
      campaigns: filteredCampaigns,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching campaign analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }
}

