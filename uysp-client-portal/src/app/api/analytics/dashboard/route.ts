import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

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

    // Authorization
    let clientId = session.user.clientId;
    if (session.user.role === 'ADMIN' && requestedClientId) {
      clientId = requestedClientId;
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

    // Fetch all leads
    const allLeads = await db.query.leads.findMany({
      where: clientId 
        ? (leads, { eq }) => eq(leads.clientId, clientId)
        : undefined,
    });

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

    const topCampaigns = Array.from(campaignPerformance.entries())
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

