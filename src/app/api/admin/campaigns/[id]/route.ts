import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { campaigns } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/admin/campaigns/[id]
 *
 * Get single campaign details by ID
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
    if (!['SUPER_ADMIN', 'ADMIN', 'CLIENT_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const campaignId = params.id;

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
