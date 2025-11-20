import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, activityLog } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * PATCH /api/admin/users/[id]/deactivate
 * 
 * Deactivate a user (soft delete - SUPER_ADMIN ONLY)
 * TDD: Implementation to pass tests in tests/api/admin/deactivate-user.test.ts
 * Endpoint #4 from ADMIN-AUTOMATION-BUILD-TASK.md
 */

const deactivateUserSchema = z.object({
  reason: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication
    const session = await auth();
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
    const validation = deactivateUserSchema.safeParse(body);
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
    const userId = params.id;

    // Verify user exists
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Deactivate user
    await db.update(users).set({ isActive: false }).where(eq(users.id, userId));

    // Log activity
    await db.insert(activityLog).values({
      userId: session.user.id,
      clientId: user.clientId,
      action: 'USER_DEACTIVATED',
      details: `Deactivated user: ${user.email}${reason ? ` - Reason: ${reason}` : ''}`,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    }).catch(err => {
      console.warn('Failed to log activity:', err);
    });

    return NextResponse.json({
      success: true,
      message: `User ${user.email} has been deactivated`,
      user: {
        id: user.id,
        email: user.email,
        isActive: false,
      },
    });

  } catch (error) {
    console.error('Error deactivating user:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}







