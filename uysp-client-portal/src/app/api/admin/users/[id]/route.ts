import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { canEditUser, canDeleteUser, canManageUsers } from '@/lib/auth/permissions';
import { z } from 'zod';

// Validation schema for updating a user
const updateUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/admin/users/[id]
 * Get a specific user by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to manage users
    if (!canManageUsers(session.user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to view users' },
        { status: 403 }
      );
    }

    const userId = params.id;

    // Get the user
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if requester can view this user
    if (
      !canEditUser(
        session.user.role,
        session.user.clientId,
        user.id,
        user.clientId
      )
    ) {
      return NextResponse.json(
        { error: 'You do not have permission to view this user' },
        { status: 403 }
      );
    }

    // Remove sensitive data
    const sanitizedUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      clientId: user.clientId,
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };

    return NextResponse.json({
      success: true,
      user: sanitizedUser,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/users/[id]
 * Update a specific user
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to manage users
    if (!canManageUsers(session.user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to edit users' },
        { status: 403 }
      );
    }

    const userId = params.id;

    // Get the target user
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if requester can edit this user
    if (
      !canEditUser(
        session.user.role,
        session.user.clientId,
        targetUser.id,
        targetUser.clientId
      )
    ) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this user' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateUserSchema.safeParse(body);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      );
    }

    const updates = validationResult.data;

    // Update the user
    const [updatedUser] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    // Remove sensitive data
    const sanitizedUser = {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      role: updatedUser.role,
      clientId: updatedUser.clientId,
      isActive: updatedUser.isActive,
      mustChangePassword: updatedUser.mustChangePassword,
      lastLoginAt: updatedUser.lastLoginAt,
      createdAt: updatedUser.createdAt,
    };

    return NextResponse.json({
      success: true,
      user: sanitizedUser,
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete a user (hard delete) or deactivate (soft delete)
 * Query param: ?permanent=true for hard delete, otherwise soft delete
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to manage users
    if (!canManageUsers(session.user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to delete users' },
        { status: 403 }
      );
    }

    const userId = params.id;
    const { searchParams } = new URL(request.url);
    const isPermanent = searchParams.get('permanent') === 'true';

    // Prevent self-deletion
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    // Get the target user
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if requester can delete this user
    if (
      !canDeleteUser(
        session.user.role,
        session.user.clientId,
        targetUser.role,
        targetUser.clientId
      )
    ) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this user' },
        { status: 403 }
      );
    }

    if (isPermanent) {
      // Hard delete: permanently remove from database
      await db.delete(users).where(eq(users.id, userId));

      return NextResponse.json({
        success: true,
        message: 'User permanently deleted',
      });
    } else {
      // Soft delete: deactivate the user
      await db
        .update(users)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      return NextResponse.json({
        success: true,
        message: 'User deactivated successfully',
      });
    }
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
