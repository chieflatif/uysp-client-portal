import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { clients, users, activityLog } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * PATCH /api/admin/clients/[id]/deactivate
 * 
 * Deactivate a client and all associated users (soft delete - SUPER_ADMIN ONLY)
 * TDD: Implementation to pass tests in tests/api/admin/deactivate-client.test.ts
 * Endpoint #5 from ADMIN-AUTOMATION-BUILD-TASK.md
 */

const deactivateClientSchema = z.object({
  reason: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Authorization - SUPER_ADMIN ONLY
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - SUPER_ADMIN access required', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validation
    const validation = deactivateClientSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { reason } = validation.data;
    const clientId = (await params).id;

    // Verify client exists
    const client = await db.query.clients.findFirst({
      where: eq(clients.id, clientId),
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found', code: 'CLIENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Get all users for this client to know how many we're deactivating
    const clientUsers = await db.query.users.findMany({
      where: eq(users.clientId, clientId),
    });

    // Deactivate client
    await db.update(clients).set({ isActive: false }).where(eq(clients.id, clientId));

    // Deactivate all users for this client
    if (clientUsers.length > 0) {
      await db.update(users)
        .set({ isActive: false })
        .where(eq(users.clientId, clientId));
    }

    // Log activity
    await db.insert(activityLog).values({
      userId: session.user.id,
      clientId: clientId,
      action: 'CLIENT_DEACTIVATED',
      details: `Deactivated client: ${client.companyName}. Affected users: ${clientUsers.length}${reason ? `. Reason: ${reason}` : ''}`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    }).catch(err => {
      console.warn('Failed to log activity:', err);
    });

    return NextResponse.json({
      success: true,
      message: `Client ${client.companyName} and all associated users have been deactivated`,
      client: {
        id: client.id,
        companyName: client.companyName,
        isActive: false,
      },
      affectedUsersCount: clientUsers.length,
    });

  } catch (error) {
    console.error('Error deactivating client:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}

