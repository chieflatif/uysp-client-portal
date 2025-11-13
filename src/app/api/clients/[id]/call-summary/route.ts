import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { clients } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAirtableClient } from '@/lib/airtable/client';

/**
 * GET /api/clients/[id]/call-summary
 *
 * Fetch the latest project call summary for a client
 * Returns the call summary marked as "Is Latest" in Airtable
 *
 * Auth: SUPER_ADMIN (all clients) or ADMIN (their client only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Authorization check
    if (session.user.role === 'CLIENT_ADMIN') {
      // ADMIN can only see their own client
      if (session.user.clientId !== (await params).id) {
        return NextResponse.json(
          { error: 'Forbidden - can only view your own client data' },
          { status: 403 }
        );
      }
    } else if (session.user.role !== 'SUPER_ADMIN') {
      // Only SUPER_ADMIN and ADMIN allowed
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Verify client exists
    const client = await db.query.clients.findFirst({
      where: eq(clients.id, (await params).id),
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Fetch latest call summary from Airtable
    const airtable = getAirtableClient(client.airtableBaseId);
    const summary = await airtable.getLatestCallSummary();

    if (!summary) {
      return NextResponse.json({
        summary: null,
        message: 'No call summary found'
      });
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error fetching call summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
