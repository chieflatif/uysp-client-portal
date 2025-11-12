import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { leads } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const lead = await db.query.leads.findFirst({
      where: eq(leads.id, id),
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // SECURITY: Verify user has access to this lead's client
    if (session.user?.clientId && session.user.clientId !== lead.clientId && session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You do not have access to this lead' },
        { status: 403 }
      );
    }

    const updatedLead = await db
      .update(leads)
      .set({
        claimedBy: session.user?.name || session.user?.email || 'Unknown',
        claimedAt: new Date(),
        updatedAt: new Date(), // CRITICAL: Triggers Stage 2 sync to Airtable
      })
      .where(eq(leads.id, id))
      .returning();

    return NextResponse.json({ lead: updatedLead[0] });
  } catch (error) {
    console.error('Error claiming lead:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
