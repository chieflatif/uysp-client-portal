import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { clientProjectTasks, clients, airtableSyncQueue } from '@/lib/db/schema';
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

    // Get task to verify ownership
    const existingTask = await db.query.clientProjectTasks.findFirst({
      where: eq(clientProjectTasks.id, (await params).id),
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Authorization check
    if (session.user.role === 'CLIENT_ADMIN') {
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
      .where(eq(clientProjectTasks.id, (await params).id))
      .returning();

    // 2. Sync to Airtable in background (don't block response)
    const airtable = getAirtableClient(client.airtableBaseId);
    const airtablePayload = {
      'Task': task,
      'Status': status,
      'Priority': priority,
      'Type': taskType || 'Task',
      'Owner': owner || '',
      'Due Date': dueDate || null,
      'Notes': notes || '',
      'Dependencies': dependencies || '',
    };

    airtable.updateRecord('Tasks', existingTask.airtableRecordId, airtablePayload as any).catch(async (err) => {
      console.error('Background Airtable sync failed:', err);

      // Add to retry queue with exponential backoff
      const nextRetryAt = new Date(Date.now() + 5 * 60 * 1000); // Retry in 5 minutes

      try {
        await db.insert(airtableSyncQueue).values({
          clientId: existingTask.clientId,
          tableName: 'Tasks',
          recordId: existingTask.airtableRecordId,
          operation: 'update',
          payload: airtablePayload,
          status: 'pending',
          attempts: 0,
          maxAttempts: 5,
          lastError: err instanceof Error ? err.message : 'Unknown error',
          nextRetryAt,
        });
        console.log(`✅ Added failed sync to retry queue (task ${(await params).id})`);
      } catch (queueError) {
        console.error('Failed to add to retry queue:', queueError);
      }
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

    // Get task
    const task = await db.query.clientProjectTasks.findFirst({
      where: eq(clientProjectTasks.id, (await params).id),
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Authorization check
    if (session.user.role === 'CLIENT_ADMIN') {
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

/**
 * DELETE /api/project/tasks/[id]
 *
 * Delete a project task
 * Deletes from both PostgreSQL and Airtable
 *
 * Auth: SUPER_ADMIN or ADMIN (must own the task's client)
 */
export async function DELETE(
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

    // Get task to verify ownership
    const existingTask = await db.query.clientProjectTasks.findFirst({
      where: eq(clientProjectTasks.id, (await params).id),
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Authorization check
    if (session.user.role === 'CLIENT_ADMIN') {
      // ADMIN can only delete their own client's tasks
      if (session.user.clientId !== existingTask.clientId) {
        return NextResponse.json(
          { error: 'Forbidden - can only delete your own tasks' },
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

    // 1. Delete from PostgreSQL FIRST
    await db
      .delete(clientProjectTasks)
      .where(eq(clientProjectTasks.id, (await params).id));

    // 2. Delete from Airtable (push to source of truth)
    const airtable = getAirtableClient(client.airtableBaseId);
    try {
      await airtable.deleteRecord('Tasks', existingTask.airtableRecordId);
      console.log(`✅ Deleted task from both PostgreSQL and Airtable`);
    } catch (err) {
      console.error('Failed to delete from Airtable:', err);
      // Don't fail the request - task is already deleted from PostgreSQL
      // TODO: Add to retry queue if needed
      console.warn(`⚠️ Task deleted from PostgreSQL but Airtable delete failed. May reappear on next sync.`);
    }

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
