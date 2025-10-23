import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { clients } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAirtableClient } from '@/lib/airtable/client';

/**
 * GET /api/clients/[id]/call-history
 *
 * Fetch all project call summaries for a client (sorted by date desc)
 *
 * Auth: SUPER_ADMIN (all clients) or ADMIN (their client only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    if (session.user.role === 'ADMIN') {
      if (session.user.clientId !== params.id) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        );
      }
    } else if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Verify client exists
    const client = await db.query.clients.findFirst({
      where: eq(clients.id, params.id),
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Fetch all call summaries from Airtable (sorted by date desc)
    const airtable = getAirtableClient(client.airtableBaseId);
    const response = await fetch(
      `https://api.airtable.com/v0/${client.airtableBaseId}/Project_Call_Summaries?sort[0][field]=Call Date&sort[0][direction]=desc`,
      {
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Airtable API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();

    const callHistory = (data.records || []).map((record: any) => ({
      id: record.id,
      callDate: record.fields['Call Date'] || null,
      executiveSummary: record.fields['Executive Summary'] || '',
      topPriorities: record.fields['Top Priorities'] || '',
      keyDecisions: record.fields['Key Decisions'] || '',
      blockersDiscussed: record.fields['Blockers Discussed'] || '',
      nextSteps: record.fields['Next Steps'] || '',
      attendees: record.fields['Attendees'] || '',
      callRecordingUrl: record.fields['Call Recording URL'] || null,
      isLatest: record.fields['Is Latest'] || false,
    }));

    return NextResponse.json({ callHistory });
  } catch (error) {
    console.error('Error fetching call history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
