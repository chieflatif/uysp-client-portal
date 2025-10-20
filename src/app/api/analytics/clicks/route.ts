import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * GET /api/analytics/clicks
 * 
 * Get click tracking analytics across campaigns.
 * Shows who clicked links, click rates, and correlation with bookings.
 * 
 * Contract: See docs/api-contracts/ANALYTICS-REPORTING-API.md#contract-3
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

    // Authorization
    let clientId = session.user.clientId;
    if (session.user.role === 'ADMIN' && requestedClientId) {
      clientId = requestedClientId;
    } else if (session.user.role !== 'ADMIN' && requestedClientId) {
      return NextResponse.json(
        { error: 'Access denied', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Fetch leads with click tracking data
    const allLeads = await db.query.leads.findMany({
      where: (leads, { eq, and, gte: gteOp, lte: lteOp }) => {
        const conditions = [];
        
        if (clientId) {
          conditions.push(eq(leads.clientId, clientId));
        }
        if (campaignFilter) {
          conditions.push(eq(leads.campaignName, campaignFilter));
        }
        if (startDate) {
          conditions.push(gteOp(leads.createdAt, new Date(startDate)));
        }
        if (endDate) {
          conditions.push(lteOp(leads.createdAt, new Date(endDate)));
        }
        
        return conditions.length > 1 ? and(...conditions) : conditions[0];
      },
    });

    // Overall summary
    const leadsWithLinks = allLeads.filter(l => l.shortLinkUrl);
    const totalClicks = allLeads.reduce((sum, l) => sum + (l.clickCount || 0), 0);
    const uniqueClickers = allLeads.filter(l => l.clickedLink === true).length;

    const summary = {
      totalLinks: leadsWithLinks.length,
      totalClicks,
      uniqueClickers,
      clickRate: leadsWithLinks.length > 0 ? (uniqueClickers / leadsWithLinks.length) * 100 : 0,
    };

    // By campaign
    const campaignMap = new Map<string, typeof allLeads>();
    for (const lead of allLeads) {
      const campaign = lead.campaignName || 'Unassigned';
      if (!campaignMap.has(campaign)) {
        campaignMap.set(campaign, []);
      }
      campaignMap.get(campaign)!.push(lead);
    }

    const byCampaign = Array.from(campaignMap.entries()).map(([name, leads]) => {
      const withLinks = leads.filter(l => l.shortLinkUrl);
      const clicks = leads.reduce((sum, l) => sum + (l.clickCount || 0), 0);
      const clickers = leads.filter(l => l.clickedLink === true).length;

      return {
        campaignName: name,
        totalLinks: withLinks.length,
        totalClicks: clicks,
        uniqueClickers: clickers,
        clickRate: withLinks.length > 0 ? (clickers / withLinks.length) * 100 : 0,
      };
    });

    // By sequence step
    const stepMap = new Map<number, typeof allLeads>();
    for (const lead of allLeads) {
      const step = lead.smsSequencePosition || 0;
      if (!stepMap.has(step)) {
        stepMap.set(step, []);
      }
      stepMap.get(step)!.push(lead);
    }

    const bySequenceStep = Array.from(stepMap.entries()).map(([step, leads]) => {
      const withLinks = leads.filter(l => l.shortLinkUrl);
      const clicks = leads.reduce((sum, l) => sum + (l.clickCount || 0), 0);
      const clickers = leads.filter(l => l.clickedLink === true).length;

      return {
        step,
        totalLinks: withLinks.length,
        totalClicks: clicks,
        clickRate: withLinks.length > 0 ? (clickers / withLinks.length) * 100 : 0,
      };
    }).sort((a, b) => a.step - b.step);

    // Top clickers
    const clickersWithData = allLeads
      .filter(l => (l.clickCount || 0) > 0)
      .sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))
      .slice(0, 20);

    const topClickers = clickersWithData.map(l => ({
      leadId: l.id,
      name: `${l.firstName} ${l.lastName}`.trim(),
      company: l.company || '',
      clicks: l.clickCount || 0,
      linkUrl: l.shortLinkUrl || '',
      booked: l.booked || false,
    }));

    return NextResponse.json({
      success: true,
      summary,
      byCampaign,
      bySequenceStep,
      topClickers,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching click analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch click analytics', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }
}

