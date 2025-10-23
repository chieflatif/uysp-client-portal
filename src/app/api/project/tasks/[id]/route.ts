import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { clientProjectTasks, clients } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAirtableClient } from '@/lib/airtable/client';

/**
 * PATCH /api/project/tasks/[id]
 *
 * Update a project task
 * Writes to Airtable first (source of truth), then updates PostgreSQL
 *
 * Auth: SUPER_ADMIN or ADMIN (must own the task's client)
 */
export async function PATCH(
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

    // Get task to verify ownership
    const existingTask = await db.query.clientProjectTasks.findFirst({
      where: eq(clientProjectTasks.id, params.id),
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Authorization check
    if (session.user.role === 'ADMIN') {
      // ADMIN can only edit their own client's tasks
      if (session.user.clientId !== existingTask.clientId) {
        return NextResponse.json(
          { error: 'Forbidden - can only edit your own tasks' },
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
      where: eq(clients.id, existingTask.clientId),
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { task, status, priority, taskType, owner, dueDate, notes, dependencies } = body;

    // 1. Update PostgreSQL FIRST (fast local database)
    const updatedTask = await db
      .update(clientProjectTasks)
      .set({
        task,
        status,
        priority,
        taskType: taskType || 'Task',
        owner: owner || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null,
        dependencies: dependencies || null,
        updatedAt: new Date(),
      })
      .where(eq(clientProjectTasks.id, params.id))
      .returning();

    // 2. Sync to Airtable in background (don't block response)
    const airtable = getAirtableClient(client.airtableBaseId);
    airtable.updateRecord('Tasks', existingTask.airtableRecordId, {
      'Task': task,
      'Status': status,
      'Priority': priority,
      'Type': taskType || 'Task',
      'Owner': owner || '',
      'Due Date': dueDate || null,
      'Notes': notes || '',
      'Dependencies': dependencies || '',
    } as any).catch(err => {
      console.error('Background Airtable sync failed:', err);
      // TODO: Add to retry queue
    });

    return NextResponse.json({
      success: true,
      task: updatedTask[0],
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/project/tasks/[id]
 *
 * Get a single task
 *
 * Auth: SUPER_ADMIN or ADMIN (must own the task's client)
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

    // Get task
    const task = await db.query.clientProjectTasks.findFirst({
      where: eq(clientProjectTasks.id, params.id),
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Authorization check
    if (session.user.role === 'ADMIN') {
      // ADMIN can only view their own client's tasks
      if (session.user.clientId !== task.clientId) {
        return NextResponse.json(
          { error: 'Forbidden - can only view your own tasks' },
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

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
