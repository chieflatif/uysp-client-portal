import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, passwordSetupTokens } from '@/lib/db/schema';
import { eq, and, isNull, gt } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { validatePassword } from '@/lib/utils/password';

/**
 * POST /api/auth/setup-password
 *
 * SECURE PASSWORD SETUP ENDPOINT
 *
 * Requires a valid, unexpired, unused token to set a password.
 * Fixes CVE 9.1 Critical Authentication Bypass vulnerability.
 *
 * Body:
 * - token: Secure setup token (UUID)
 * - password: New password
 *
 * Security Controls:
 * 1. Token must exist and be valid
 * 2. Token must not be expired
 * 3. Token must not have been used before
 * 4. User must not already have a password (unless mustChangePassword=true)
 * 5. Token is invalidated after successful use
 */
export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    // Validate required fields
    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    const validation = validatePassword(password);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Find valid token
    const setupToken = await db.query.passwordSetupTokens.findFirst({
      where: and(
        eq(passwordSetupTokens.token, token),
        isNull(passwordSetupTokens.usedAt), // Not used yet
        gt(passwordSetupTokens.expiresAt, new Date()) // Not expired
      ),
    });

    if (!setupToken) {
      return NextResponse.json(
        { error: 'Invalid or expired token. Please request a new password setup link.' },
        { status: 401 }
      );
    }

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.id, setupToken.userId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if password already set (unless mustChangePassword flag is set)
    if (user.passwordHash && user.passwordHash.length > 0 && !user.mustChangePassword) {
      return NextResponse.json(
        { error: 'Password already set. Please use forgot password to reset it.' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update user with new password
    await db
      .update(users)
      .set({
        passwordHash,
        mustChangePassword: false,
      })
      .where(eq(users.id, user.id));

    // Mark token as used (invalidate it)
    await db
      .update(passwordSetupTokens)
      .set({
        usedAt: new Date(),
      })
      .where(eq(passwordSetupTokens.id, setupToken.id));

    return NextResponse.json({
      success: true,
      message: 'Password set successfully. You can now log in.',
    });
  } catch (error) {
    console.error('Setup password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
