import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { validatePassword } from '@/lib/utils/password';

/**
 * POST /api/admin/users/[id]/reset-password
 *
 * Reset a user's password (admin only)
 * SUPER_ADMIN can reset any user
 * ADMIN can reset users in their client
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // SECURITY: Only SUPER_ADMIN and CLIENT_ADMIN can reset passwords
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'CLIENT_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get the target user
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, params.id),
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // SECURITY: Authorization check - CLIENT_ADMIN can only reset passwords for their own client
    if (session.user.role === 'CLIENT_ADMIN') {
      if (session.user.clientId !== targetUser.clientId) {
        return NextResponse.json(
          { error: 'Forbidden - Can only reset passwords for your own client' },
          { status: 403 }
        );
      }

      // CLIENT_ADMIN cannot reset SUPER_ADMIN passwords
      if (targetUser.role === 'SUPER_ADMIN') {
        return NextResponse.json(
          { error: 'Forbidden - Cannot reset SUPER_ADMIN password' },
          { status: 403 }
        );
      }
    }
    // SUPER_ADMIN can reset any password (except other SUPER_ADMINs)

    const body = await request.json();
    const { newPassword } = body;

    // SECURITY FIX: Use comprehensive password validation (12+ characters)
    if (!newPassword) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid password format' },
        { status: 400 }
      );
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    await db
      .update(users)
      .set({
        passwordHash,
        mustChangePassword: false, // Clear the flag since admin is setting it
        updatedAt: new Date(),
      })
      .where(eq(users.id, params.id));

    // SECURITY: Log with IDs only (not PII)
    console.log(
      `✅ [AUDIT] Password reset by user ${session.user.id} (role: ${session.user.role}) for user ${targetUser.id}`
    );

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
