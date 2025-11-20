import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { clients as clientsTable, leads, campaigns } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * GET /api/analytics/dashboard
 * 
 * Get high-level overview stats for dashboard display.
 * 
 * Contract: See docs/api-contracts/ANALYTICS-REPORTING-API.md#contract-4
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
    const period = searchParams.get('period') || '30d';

    // Authorization - SECURITY FIX: Strict client isolation for CLIENT_ADMIN/CLIENT_USER
    let clientId = session.user.clientId;

    // SUPER_ADMIN can see all clients or specify one
    if (session.user.role === 'SUPER_ADMIN') {
      clientId = requestedClientId || null; // null = show all
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

    // For SUPER_ADMIN without clientId specified, default to UYSP for now
    if (session.user.role === 'SUPER_ADMIN' && !clientId) {
      // Get UYSP client ID
      const uyspClient = await db.query.clients.findFirst({
        where: () => eq(clientsTable.companyName, 'UYSP'),
      });
      if (uyspClient) {
        clientId = uyspClient.id;
      }
    }

    // Calculate time boundaries
    const now = new Date();
    let startDate: Date | undefined;
    
    switch (period) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        startDate = undefined;
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // CRITICAL FIX: Fetch all leads with LEFT JOIN to campaigns for campaign names
    const allLeadsQuery = db
      .select({
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
        createdAt: leads.createdAt,
        campaignId: leads.campaignId,
        // Campaign name with COALESCE for NULL campaign_id
        campaignName: sql<string>`COALESCE(${campaigns.name}, 'Unassigned')`.as('campaignName'),
      })
      .from(leads)
      .leftJoin(campaigns, eq(leads.campaignId, campaigns.id));

    const allLeads = clientId
      ? await allLeadsQuery.where(eq(leads.clientId, clientId))
      : await allLeadsQuery;

    // Time-filtered leads
    const periodLeads = startDate
      ? allLeads.filter(l => l.createdAt >= startDate!)
      : allLeads;

    // Overview stats
    const overview = {
      totalLeads: allLeads.length,
      activeLeads: allLeads.filter(l => 
        l.processingStatus === 'In Sequence' || l.processingStatus === 'Ready for SMS'
      ).length,
      completedLeads: allLeads.filter(l => 
        l.processingStatus === 'Completed' || l.processingStatus === 'Stopped'
      ).length,
      
      newToday: allLeads.filter(l => 
        l.createdAt >= new Date(now.getTime() - 24 * 60 * 60 * 1000)
      ).length,
      newThisWeek: allLeads.filter(l => 
        l.createdAt >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      ).length,
    };

    // Campaign stats
    const uniqueCampaigns = new Set(allLeads.map(l => l.campaignName).filter(Boolean));
    const activeCampaigns = new Set(
      allLeads
        .filter(l => l.processingStatus === 'In Sequence')
        .map(l => l.campaignName)
        .filter(Boolean)
    );

    const campaignsStats = {
      total: uniqueCampaigns.size,
      active: activeCampaigns.size,
      paused: uniqueCampaigns.size - activeCampaigns.size,
    };

    // Performance metrics
    const messagesSent = allLeads.reduce((sum, l) => sum + (l.smsSentCount || 0), 0);
    const messagesThisPeriod = periodLeads
      .filter(l => l.smsLastSentAt && l.smsLastSentAt >= (startDate || new Date(0)))
      .reduce((sum, l) => sum + (l.smsSentCount || 0), 0);

    const totalBooked = allLeads.filter(l => l.booked === true).length;
    const bookedThisPeriod = periodLeads.filter(l => 
      l.booked === true && l.bookedAt && l.bookedAt >= (startDate || new Date(0))
    ).length;

    const totalOptedOut = allLeads.filter(l => l.smsStop === true).length;
    const optedOutThisPeriod = periodLeads.filter(l => l.smsStop === true).length;

    const totalClicks = allLeads.reduce((sum, l) => sum + (l.clickCount || 0), 0);
    const uniqueClickers = allLeads.filter(l => l.clickedLink === true).length;

    const performance = {
      messagesSent,
      messagesThisPeriod,
      
      totalBooked,
      bookedThisPeriod,
      bookingRate: allLeads.length > 0 ? (totalBooked / allLeads.length) * 100 : 0,
      
      totalOptedOut,
      optedOutThisPeriod,
      optOutRate: messagesSent > 0 ? (totalOptedOut / messagesSent) * 100 : 0,
      
      totalClicks,
      clickRate: allLeads.length > 0 ? (uniqueClickers / allLeads.length) * 100 : 0,
    };

    // Top performing campaigns
    const campaignPerformance = new Map<string, { booked: number; total: number }>();
    for (const lead of allLeads) {
      const campaign = lead.campaignName || 'Unassigned';
      if (!campaignPerformance.has(campaign)) {
        campaignPerformance.set(campaign, { booked: 0, total: 0 });
      }
      const stats = campaignPerformance.get(campaign)!;
      stats.total++;
      if (lead.booked) stats.booked++;
    }

    // FIX: Exclude "Unassigned" from top performers since it's not a real campaign
    const topCampaigns = Array.from(campaignPerformance.entries())
      .filter(([name]) => name !== 'Unassigned')
      .map(([name, stats]) => ({
        name,
        bookingRate: stats.total > 0 ? (stats.booked / stats.total) * 100 : 0,
        totalBooked: stats.booked,
      }))
      .sort((a, b) => b.bookingRate - a.bookingRate)
      .slice(0, 5);

    // Top leads (by ICP score, clicked, not booked yet)
    const topLeads = allLeads
      .filter(l => l.clickedLink === true && l.booked !== true)
      .sort((a, b) => b.icpScore - a.icpScore)
      .slice(0, 10)
      .map(l => ({
        id: l.id,
        name: `${l.firstName} ${l.lastName}`.trim(),
        icpScore: l.icpScore,
        status: l.processingStatus || 'Unknown',
        clicked: l.clickedLink || false,
        booked: l.booked || false,
      }));

    const topPerformers = {
      campaigns: topCampaigns,
      leads: topLeads,
    };

    return NextResponse.json({
      success: true,
      overview,
      campaigns: campaignsStats,
      performance,
      topPerformers,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard analytics', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }
}

