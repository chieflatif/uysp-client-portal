import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { leads, activityLog } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/leads/[id]/notes
 *
 * Get notes for a lead.
 * Notes are stored in the lead's notes field as a single text field.
 */
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

    // Get the lead with notes
    const lead = await db.query.leads.findFirst({
      where: eq(leads.id, id),
      columns: {
        id: true,
        notes: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Parse notes if they exist
    // Notes are stored as a single text field with timestamps and user info
    const notesArray = [];
    if (lead.notes) {
      // Split by common delimiters if notes are formatted
      // Otherwise return as single note
      const lines = lead.notes.split('\n').filter(line => line.trim());

      // Try to parse structured notes (format: [timestamp] user: content)
      for (const line of lines) {
        const match = line.match(/^\[(.*?)\]\s*([^:]+):\s*(.*)$/);
        if (match) {
          notesArray.push({
            timestamp: match[1],
            user: match[2],
            content: match[3],
            type: 'General',
          });
        } else if (line.trim()) {
          // Unstructured note
          notesArray.push({
            timestamp: 'Unknown',
            user: 'System',
            content: line.trim(),
            type: 'General',
          });
        }
      }
    }

    return NextResponse.json(notesArray);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/leads/[id]/notes
 *
 * Add a note to a lead with automatic bi-directional sync to Airtable.
 * Notes are appended with timestamp and user information.
 * Setting updatedAt triggers Stage 2 reconciler to sync notes to Airtable.
 */
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
    const body = await request.json();

    // Support both old and new format
    const note = body.note || body.content;

    // Validate note input
    if (!note || typeof note !== 'string' || note.trim() === '') {
      return NextResponse.json(
        {
          error: 'Note is required and must be a non-empty string',
          code: 'VALIDATION_ERROR',
          field: 'note',
        },
        { status: 400 }
      );
    }

    // Validate note length (max 10,000 characters for reasonable limit)
    if (note.length > 10000) {
      return NextResponse.json(
        {
          error: 'Note must be 10,000 characters or less',
          code: 'VALIDATION_ERROR',
          field: 'note',
        },
        { status: 400 }
      );
    }

    // Fetch current lead
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

    // Append note to existing notes with timestamp and user info
    const timestamp = new Date().toISOString();
    const userName = session.user?.name || session.user?.email || 'Unknown User';
    const newNote = `[${timestamp}] ${userName}: ${note.trim()}`;
    const updatedNotes = lead.notes
      ? `${lead.notes}\n${newNote}`
      : newNote;

    // Update lead with new note and trigger Stage 2 sync
    const updatedLead = await db
      .update(leads)
      .set({
        notes: updatedNotes,
        updatedAt: new Date(), // CRITICAL: Triggers Stage 2 sync to Airtable
      })
      .where(eq(leads.id, id))
      .returning();

    // Log to activity log
    await db.insert(activityLog).values({
      leadId: id,
      clientId: lead.clientId,
      userId: session.user?.id || 'unknown',
      action: 'NOTE_ADDED',
      details: note.trim(),
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      notes: updatedNotes,
      lead: updatedLead[0],
    });
  } catch (error) {
    console.error('Error adding note to lead:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
