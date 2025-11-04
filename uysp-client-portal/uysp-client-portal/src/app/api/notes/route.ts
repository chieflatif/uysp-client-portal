import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { activityLog } from '@/lib/db/schema';
import { getAirtableClient } from '@/lib/airtable/client';
import { eq } from 'drizzle-orm';

/**
 * GET /api/notes - Fetch notes for a lead (DEPRECATED - use /api/leads/[id]/notes)
 * This route is kept for backward compatibility
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }

    // Get lead from PostgreSQL to find Airtable record ID
    const lead = await db.query.leads.findFirst({
      where: (leads) => eq(leads.id, leadId),
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/notes - Create note (DEPRECATED - use /api/leads/[id]/notes)
 * This route is kept for backward compatibility
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { leadId, content, type = 'General' } = body;

    // Validate required fields
    if (!leadId || !content) {
      return NextResponse.json(
        {
          error: 'Lead ID and content are required',
          code: 'VALIDATION_ERROR',
          field: !leadId ? 'leadId' : 'content',
        },
        { status: 400 }
      );
    }

    // Validate content length
    if (content.length > 5000) {
      return NextResponse.json(
        {
          error: 'Content must be 5000 characters or less',
          code: 'VALIDATION_ERROR',
          field: 'content',
        },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['Call', 'Email', 'Text', 'Meeting', 'General', 'Issue', 'Success'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        {
          error: `Type must be one of: ${validTypes.join(', ')}`,
          code: 'VALIDATION_ERROR',
          field: 'type',
        },
        { status: 400 }
      );
    }

    // Get lead to find Airtable record ID
    const lead = await db.query.leads.findFirst({
      where: (leads) => eq(leads.id, leadId),
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

    // Sanitize content (prevent XSS)
    const sanitizedContent = content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .trim();

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
      type: match[1],
      timestamp: match[2].trim(),
      user: match[3].trim(),
      content: match[4].trim(),
    });
  }

  return notes.reverse(); // Most recent first
}
