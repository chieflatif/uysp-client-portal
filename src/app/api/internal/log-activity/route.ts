import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { leadActivityLog, leads } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { EVENT_TYPES, EVENT_CATEGORIES } from '@/lib/activity/event-types';

// NOTE: INTERNAL_API_KEY validation moved to runtime (inside POST function)
// to support Next.js build-time static analysis

/**
 * POST /api/internal/log-activity
 *
 * Central logging endpoint for all system components (n8n workflows, UI actions).
 * This endpoint is the single entry point for writing to the lead_activity_log table.
 *
 * Security: Requires INTERNAL_API_KEY in x-api-key header
 * PRD Reference: docs/PRD-MINI-CRM-ACTIVITY-LOGGING.md Section 4.3
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Validate INTERNAL_API_KEY at runtime (not module load)
    if (!process.env.INTERNAL_API_KEY) {
      console.error('[LOG-ACTIVITY] CRITICAL: INTERNAL_API_KEY environment variable is not set!');
      return NextResponse.json(
        { error: 'Server configuration error: INTERNAL_API_KEY not configured' },
        { status: 500 }
      );
    }

    // SECURITY: Internal API key authentication
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
      console.error('[LOG-ACTIVITY] Unauthorized: Invalid or missing API key');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const {
      eventType,
      eventCategory,
      leadId, // PostgreSQL UUID (optional)
      leadAirtableId, // Airtable record ID (required)
      clientId,
      description,
      messageContent,
      metadata,
      source,
      executionId,
      createdBy,
      timestamp,
    } = body;

    // Validation: Required fields
    if (!eventType || !eventCategory || !leadAirtableId || !description || !source) {
      console.error('[LOG-ACTIVITY] Missing required fields:', {
        eventType: !!eventType,
        eventCategory: !!eventCategory,
        leadAirtableId: !!leadAirtableId,
        description: !!description,
        source: !!source,
      });
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['eventType', 'eventCategory', 'leadAirtableId', 'description', 'source'],
        },
        { status: 400 }
      );
    }

    // Validation: Event type must be one of the defined constants
    const validEventTypes = Object.values(EVENT_TYPES);
    if (!validEventTypes.includes(eventType)) {
      console.error('[LOG-ACTIVITY] Invalid eventType:', {
        provided: eventType,
        valid: validEventTypes,
      });
      return NextResponse.json(
        {
          error: 'Invalid eventType',
          provided: eventType,
          validTypes: validEventTypes,
        },
        { status: 400 }
      );
    }

    // Validation: Event category must be one of the defined constants
    const validEventCategories = Object.values(EVENT_CATEGORIES);
    if (!validEventCategories.includes(eventCategory)) {
      console.error('[LOG-ACTIVITY] Invalid eventCategory:', {
        provided: eventCategory,
        valid: validEventCategories,
      });
      return NextResponse.json(
        {
          error: 'Invalid eventCategory',
          provided: eventCategory,
          validCategories: validEventCategories,
        },
        { status: 400 }
      );
    }

    // Find lead by Airtable ID if PostgreSQL UUID not provided
    let finalLeadId = leadId;
    if (!finalLeadId && leadAirtableId) {
      console.log('[LOG-ACTIVITY] Looking up lead by Airtable ID:', leadAirtableId);
      const lead = await db.query.leads.findFirst({
        where: eq(leads.airtableRecordId, leadAirtableId),
        columns: { id: true },
      });

      if (lead) {
        finalLeadId = lead.id;
        console.log('[LOG-ACTIVITY] Found lead:', finalLeadId);
      } else {
        console.warn('[LOG-ACTIVITY] Lead not found in PostgreSQL yet:', leadAirtableId);
        // Don't fail - activity will be logged with Airtable ID
        // Background job can backfill leadId later when lead syncs
      }
    }

    // Insert activity log
    const [activity] = await db
      .insert(leadActivityLog)
      .values({
        eventType,
        eventCategory,
        leadId: finalLeadId || null, // Can be null if lead not synced yet
        leadAirtableId,
        clientId: clientId || null,
        description,
        messageContent: messageContent || null,
        metadata: metadata ? (metadata as any) : null,
        source,
        executionId: executionId || null,
        createdBy: createdBy || null,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
      })
      .returning();

    console.log('[LOG-ACTIVITY] Activity logged:', {
      activityId: activity.id,
      eventType,
      leadId: finalLeadId,
      leadAirtableId,
    });

    // Update lead's last_activity_at timestamp (if lead exists in PostgreSQL)
    // Use the SAME timestamp as the activity record to prevent race conditions
    if (finalLeadId) {
      await db
        .update(leads)
        .set({ lastActivityAt: activity.timestamp })
        .where(eq(leads.id, finalLeadId));

      console.log('[LOG-ACTIVITY] Updated lead lastActivityAt:', finalLeadId);
    }

    return NextResponse.json({
      success: true,
      activityId: activity.id,
      timestamp: activity.timestamp,
      leadId: finalLeadId,
    });
  } catch (error) {
    console.error('[LOG-ACTIVITY] Error:', error);

    // Detailed error logging for debugging
    if (error instanceof Error) {
      console.error('[LOG-ACTIVITY] Error details:', {
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

/**
 * GET /api/internal/log-activity
 *
 * Not supported - this endpoint only accepts POST requests
 */
export async function GET() {
  return NextResponse.json(
    {
      error: 'Method not allowed',
      message: 'This endpoint only accepts POST requests',
    },
    { status: 405 }
  );
}
