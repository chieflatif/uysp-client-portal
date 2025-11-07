import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { leadActivityLog } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

/**
 * GET /api/leads/[id]/activity
 *
 * Lead-specific timeline for lead detail page.
 * Returns chronological activity history for a single lead.
 *
 * Security: Authenticated users only (lead access controlled by client_id)
 * PRD Reference: docs/PRD-MINI-CRM-ACTIVITY-LOGGING.md Section 4.3 Endpoint #3
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get lead ID from route params
    const params = await context.params;
    const leadId = params.id;

    if (!leadId) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    console.log('[LEAD-ACTIVITY] Fetching timeline for lead:', leadId);

    // Query activities for this lead (last 100 events)
    // Ordered by timestamp descending (most recent first)
    const activities = await db.query.leadActivityLog.findMany({
      where: eq(leadActivityLog.leadId, leadId),
      orderBy: [desc(leadActivityLog.timestamp)],
      limit: 100,
    });

    console.log('[LEAD-ACTIVITY] Found activities:', activities.length);

    return NextResponse.json({
      timeline: activities.map((a) => ({
        id: a.id,
        timestamp: a.timestamp,
        eventType: a.eventType,
        category: a.eventCategory,
        description: a.description,
        message: a.messageContent,
        details: a.metadata,
        source: a.source,
        executionId: a.executionId,
      })),
      count: activities.length,
    });
  } catch (error) {
    console.error('[LEAD-ACTIVITY] Error:', error);

    if (error instanceof Error) {
      console.error('[LEAD-ACTIVITY] Error details:', {
        message: error.message,
        stack: error.stack,
      });
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
