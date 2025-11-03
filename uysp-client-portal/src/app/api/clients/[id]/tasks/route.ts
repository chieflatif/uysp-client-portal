import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { clientProjectTasks, clients } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAirtableClient } from '@/lib/airtable/client';
import { randomUUID } from 'crypto';

/**
 * POST /api/clients/[id]/tasks
 *
 * Create a new project task
 * Creates in Airtable first (source of truth), then stores in PostgreSQL
 *
 * Auth: SUPER_ADMIN or ADMIN (must be their own client)
 */
export async function POST(
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
    if (session.user.role === 'CLIENT_ADMIN') {
      // ADMIN can only create tasks for their own client
      if (session.user.clientId !== params.id) {
        return NextResponse.json(
          { error: 'Forbidden - can only create tasks for your own client' },
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

    // Get client to access their Airtable base
    const client = await db.query.clients.findFirst({
      where: eq(clients.id, params.id),
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { task, status, priority, owner, dueDate, notes, dependencies } = body;

    // Validate required fields
    if (!task || !task.trim()) {
      return NextResponse.json(
        { error: 'Task name is required' },
        { status: 400 }
      );
    }

    // 1. Create in Airtable FIRST (source of truth)
    const airtable = getAirtableClient(client.airtableBaseId);
    const airtableRecord = await airtable.createRecord('Tasks', {
      'Task': task,
      'Status': status || 'Not Started',
      'Priority': priority || '🟡 Medium',
      'Owner': owner || '',
      'Due Date': dueDate || null,
      'Notes': notes || '',
      'Dependencies': dependencies || '',
    } as any);

    if (!airtableRecord || !airtableRecord.id) {
      throw new Error('Failed to create task in Airtable');
    }

    // 2. Store in PostgreSQL for fast access
    const newTask = await db
      .insert(clientProjectTasks)
      .values({
        id: randomUUID(),
        clientId: params.id,
        airtableRecordId: airtableRecord.id,
        task,
        status: status || 'Not Started',
        priority: priority || '🟡 Medium',
        owner: owner || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null,
        dependencies: dependencies || null,
      })
      .returning();

    return NextResponse.json({
      success: true,
      task: newTask[0],
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
