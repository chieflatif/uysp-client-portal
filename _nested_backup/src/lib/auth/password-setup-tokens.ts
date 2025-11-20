import { db } from '@/lib/db';
import { passwordSetupTokens, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * Generate a secure password setup token for a user
 *
 * @param userId - UUID of the user who needs to set their password
 * @param createdByUserId - UUID of the admin who generated this token
 * @param expirationHours - Number of hours until token expires (default: 24)
 * @returns The generated token (UUID) and setup URL
 */
export async function generatePasswordSetupToken(
  userId: string,
  createdByUserId: string,
  expirationHours: number = 24
): Promise<{ token: string; setupUrl: string; expiresAt: Date }> {
  // Generate secure random token (UUID v4)
  const token = crypto.randomUUID();

  // Calculate expiration time
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expirationHours);

  // Verify user exists
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    throw new Error(`User with ID ${userId} not found`);
  }

  // Create token in database
  await db.insert(passwordSetupTokens).values({
    userId,
    token,
    expiresAt,
    createdByUserId,
  });

  // Generate setup URL
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const setupUrl = `${baseUrl}/auth/setup-password?token=${token}`;

  return {
    token,
    setupUrl,
    expiresAt,
  };
}

/**
 * Invalidate all password setup tokens for a user
 *
 * Useful when:
 * - User successfully sets password
 * - User requests a new token
 * - Admin wants to revoke access
 *
 * @param userId - UUID of the user
 */
export async function invalidateUserTokens(userId: string): Promise<void> {
  await db
    .update(passwordSetupTokens)
    .set({
      usedAt: new Date(), // Mark as used to invalidate
    })
    .where(eq(passwordSetupTokens.userId, userId));
}

/**
 * Clean up expired tokens from database
 *
 * Should be run periodically (e.g., via cron job)
 * Deletes tokens that expired more than 7 days ago
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const result = await db
    .delete(passwordSetupTokens)
    .where(eq(passwordSetupTokens.expiresAt, sevenDaysAgo));

  // Note: Drizzle doesn't return affected rows count directly
  // This would need to be implemented with raw SQL if needed
  return 0; // Placeholder
}
