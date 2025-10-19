import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { leads } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const lead = await db.query.leads.findFirst({
      where: eq(leads.id, params.id),
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    const updatedLead = await db
      .update(leads)
      .set({
        claimedBy: session.user?.name || session.user?.email || 'Unknown',
        claimedAt: new Date(),
      })
      .where(eq(leads.id, params.id))
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
