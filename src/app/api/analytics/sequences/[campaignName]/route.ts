import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

/**
 * GET /api/analytics/sequences/[campaignName]
 * 
 * Get detailed breakdown of leads at each sequence step for a specific campaign.
 * 
 * Contract: See docs/api-contracts/ANALYTICS-REPORTING-API.md#contract-2
 * SOP: SOP§1.1 Step 2 - Implementation to pass tests
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignName: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { campaignName: rawCampaignName } = await params;
    const campaignName = decodeURIComponent(rawCampaignName);
    const { searchParams } = new URL(request.url);
    const requestedClientId = searchParams.get('clientId');

    // Authorization - SECURITY FIX: Strict client isolation for CLIENT_ADMIN/CLIENT_USER
    let clientId = session.user.clientId;

    // SUPER_ADMIN can see any client
    if (session.user.role === 'SUPER_ADMIN' && requestedClientId) {
      clientId = requestedClientId;
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

    // Fetch all leads for this campaign
    const campaignLeads = await db.query.leads.findMany({
      where: (leads, { eq, and }) => {
        const conditions = [eq(leads.campaignName, campaignName)];
        if (clientId) {
          conditions.push(eq(leads.clientId, clientId));
        }
        return conditions.length > 1 ? and(...conditions) : conditions[0];
      },
      orderBy: (leads, { desc }) => [desc(leads.icpScore)],
    });

    // Group by sequence step
    const stepGroups = new Map<number, typeof campaignLeads>();
    [0, 1, 2, 3].forEach(step => stepGroups.set(step, []));

    for (const lead of campaignLeads) {
      const step = lead.smsSequencePosition || 0;
      if (stepGroups.has(step)) {
        stepGroups.get(step)!.push(lead);
      }
    }

    // Calculate metrics for each step
    const steps = Array.from(stepGroups.entries()).map(([stepNumber, stepLeads]) => {
      const totalLeads = stepLeads.length;

      // Calculate avg days at step
      const leadsWithTimestamp = stepLeads.filter(l => l.smsLastSentAt);
      const avgDaysAtStep = leadsWithTimestamp.length > 0
        ? leadsWithTimestamp.reduce((sum, l) => {
            const daysSince = l.smsLastSentAt
              ? (Date.now() - l.smsLastSentAt.getTime()) / (1000 * 60 * 60 * 24)
              : 0;
            return sum + daysSince;
          }, 0) / leadsWithTimestamp.length
        : 0;

      // Conversion rates
      const movedToNext = stepLeads.filter(l => (l.smsSequencePosition || 0) > stepNumber).length;
      const booked = stepLeads.filter(l => l.booked === true && (l.smsSentCount || 0) > 0).length;
      const optedOut = stepLeads.filter(l => l.smsStop === true).length;

      return {
        stepNumber,
        totalLeads,
        
        leads: stepLeads.map(l => ({
          id: l.id,
          name: `${l.firstName} ${l.lastName}`.trim(),
          company: l.company || '',
          icpScore: l.icpScore,
          status: l.processingStatus || 'Unknown',
          lastSentAt: l.smsLastSentAt?.toISOString() || null,
          sentCount: l.smsSentCount || 0,
          clicked: l.clickedLink || false,
          booked: l.booked || false,
          stopped: l.smsStop || false,
        })),
        
        metrics: {
          avgDaysAtStep: Number(avgDaysAtStep.toFixed(1)),
          conversionRate: totalLeads > 0 ? (movedToNext / totalLeads) * 100 : 0,
          bookingRate: totalLeads > 0 ? (booked / totalLeads) * 100 : 0,
          optOutRate: totalLeads > 0 ? (optedOut / totalLeads) * 100 : 0,
        },
      };
    });

    return NextResponse.json({
      success: true,
      campaignName,
      steps,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching sequence analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sequence analytics', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }
}

