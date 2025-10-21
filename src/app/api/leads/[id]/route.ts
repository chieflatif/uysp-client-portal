import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { leads } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
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
    // SUPER_ADMIN and ADMIN can see all leads
    const isSuperUser = session.user?.role === 'SUPER_ADMIN' || session.user?.role === 'ADMIN';
    if (!isSuperUser && session.user?.clientId && session.user.clientId !== lead.clientId) {
      return NextResponse.json(
        { error: 'You do not have access to this lead' },
        { status: 403 }
      );
    }

    return NextResponse.json({ lead });
  } catch (error) {
    console.error('Error fetching lead:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
