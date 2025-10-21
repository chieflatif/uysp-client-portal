import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { clients } from '@/lib/db/schema';

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

    // Authorization
    let clientId = session.user.clientId;
    
    // SUPER_ADMIN can see any client or all clients
    if (session.user.role === 'SUPER_ADMIN') {
      clientId = requestedClientId || null;
      
      // Default to UYSP if no client specified
      if (!clientId) {
        const uyspClient = await db.query.clients.findFirst({
          where: (clients, { eq }) => eq(clients.companyName, 'UYSP'),
        });
        if (uyspClient) clientId = uyspClient.id;
      }
    } else if (session.user.role === 'ADMIN' && requestedClientId) {
      clientId = requestedClientId;
    } else if (session.user.role !== 'ADMIN' && requestedClientId) {
      return NextResponse.json(
        { error: 'Access denied', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Fetch all leads matching criteria
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

    // Group leads by campaign
    const campaignGroups = new Map<string, typeof allLeads>();
    
    for (const lead of allLeads) {
      const campaign = lead.campaignName || 'Unassigned';
      if (!campaignGroups.has(campaign)) {
        campaignGroups.set(campaign, []);
      }
      campaignGroups.get(campaign)!.push(lead);
    }

    // Calculate analytics for each campaign
    const campaigns = Array.from(campaignGroups.entries()).map(([name, campaignLeads]) => {
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
    campaigns.sort((a, b) => b.totalLeads - a.totalLeads);

    return NextResponse.json({
      success: true,
      campaigns,
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

