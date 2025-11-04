import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { leads } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/leads/[id]
 *
 * Get single lead details by ID
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

    const leadId = params.id;

    // Build where clause based on role
    const whereClause =
      session.user.role === 'SUPER_ADMIN'
        ? and(eq(leads.id, leadId), eq(leads.isActive, true))
        : and(
            eq(leads.id, leadId),
            eq(leads.clientId, session.user.clientId!),
            eq(leads.isActive, true)
          );

    // Fetch lead
    const lead = await db.query.leads.findFirst({
      where: whereClause,
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error('Error fetching lead:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
