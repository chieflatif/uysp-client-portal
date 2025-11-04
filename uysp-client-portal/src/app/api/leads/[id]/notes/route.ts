import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { activityLog } from '@/lib/db/schema';
import { getAirtableClient } from '@/lib/airtable/client';
import { sanitizeNoteInput, sanitizePlainText } from '@/lib/utils/sanitization';

/**
 * GET /api/leads/[id]/notes
 * 
 * Fetch notes for a lead from Airtable (source of truth)
 * 
 * SOP: SOP§1.1 Step 2 - Implementation to pass tests
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: leadId } = await params;

    // Get lead from PostgreSQL to find Airtable record ID
    const lead = await db.query.leads.findFirst({
      where: (leads, { eq }) => eq(leads.id, leadId),
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Authorization check
    // SUPER_ADMIN and ADMIN can access all leads
    const isSuperUser = session.user.role === 'SUPER_ADMIN' || session.user.role === 'CLIENT_ADMIN';
    if (!isSuperUser && session.user.clientId && session.user.clientId !== lead.clientId) {
      return NextResponse.json(
        { error: 'You do not have access to this lead' },
        { status: 403 }
      );
    }

    // Get notes from Airtable (source of truth)
    const airtable = getAirtableClient();
    const airtableRecord = await airtable.getRecord(lead.airtableRecordId);
    const notesText = airtableRecord.fields['Notes'] || '';

    // Parse notes into structured format for frontend
    const parsedNotes = parseNotesFromAirtable(notesText);

    return NextResponse.json(parsedNotes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    // Return empty array instead of error - allows UI to show "no notes"
    return NextResponse.json([]);
  }
}

/**
 * POST /api/leads/[id]/notes
 * 
 * Add a note to a lead by writing to Airtable Notes field
 * 
 * Contract: See docs/api-contracts/AIRTABLE-WRITE-OPERATIONS.md#contract-1
 * SOP: SOP§1.1 Step 2 - Implementation to pass tests
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id: leadId } = await params;

    // SECURITY: Validate and sanitize input (XSS protection)
    const sanitizationResult = sanitizeNoteInput(body);

    if (!sanitizationResult.isValid) {
      return NextResponse.json(
        {
          error: sanitizationResult.errors.join(', '),
          code: 'VALIDATION_ERROR',
          errors: sanitizationResult.errors,
        },
        { status: 400 }
      );
    }

    const { content: sanitizedContent, type } = sanitizationResult.sanitized;

    // Get lead from PostgreSQL to find Airtable record ID
    const lead = await db.query.leads.findFirst({
      where: (leads, { eq }) => eq(leads.id, leadId),
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Authorization: Verify user can access this lead's client (skip if no clientId assigned)
    if (session.user.clientId && session.user.clientId !== lead.clientId && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You do not have access to this lead', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    try {
      // Write note to Airtable (source of truth)
      const airtable = getAirtableClient();
      const userName = session.user.name || session.user.email || 'Unknown User';
      
      const updatedRecord = await airtable.appendNote(
        lead.airtableRecordId,
        sanitizedContent,
        type,
        userName
      );

      // Log activity in PostgreSQL
      await db.insert(activityLog).values({
        userId: session.user.id,
        leadId: lead.id,
        clientId: lead.clientId,
        action: 'NOTE_ADDED',
        details: `Added ${type} note`,
        createdAt: new Date(),
      });

      return NextResponse.json(
        {
          success: true,
          airtableRecordId: updatedRecord.id,
          notePreview: sanitizedContent.substring(0, 100),
          timestamp: new Date().toISOString(),
        },
        { status: 201 }
      );
    } catch (airtableError) {
      console.error('Airtable API error:', airtableError);
      return NextResponse.json(
        {
          error: 'Failed to update Airtable',
          code: 'AIRTABLE_ERROR',
          details: process.env.NODE_ENV === 'development' ? String(airtableError) : undefined,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'DATABASE_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to parse Airtable Notes field into structured array
 *
 * SECURITY: Sanitizes output to prevent XSS from Airtable data
 */
function parseNotesFromAirtable(notesText: string) {
  if (!notesText || notesText.trim() === '') {
    return [];
  }

  // Parse format: [Type] Timestamp - UserName:\nContent
  const notePattern = /\[([^\]]+)\]\s+([^\-]+)\s+-\s+([^:]+):\n([^\n\[]*(?:\n(?!\[)[^\n]*)*)/g;
  const notes = [];
  let match;

  while ((match = notePattern.exec(notesText)) !== null) {
    notes.push({
      // SECURITY: Sanitize all fields to prevent XSS
      type: sanitizePlainText(match[1], 50),
      timestamp: sanitizePlainText(match[2].trim(), 100),
      user: sanitizePlainText(match[3].trim(), 255),
      content: sanitizePlainText(match[4].trim(), 5000),
    });
  }

  return notes.reverse(); // Most recent first
}

