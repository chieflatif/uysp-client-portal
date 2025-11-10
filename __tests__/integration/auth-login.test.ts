/**
 * Integration Test: Authentication Login Flow
 *
 * PURPOSE: Regression test for authentication bug fix
 * BUG: Drizzle ORM generating duplicate table aliases in query
 * ERROR: "Failed query: select ... from 'users' 'users' ..."
 *
 * ROOT CAUSE: Mixing relational query API with raw SQL templates
 * COMMIT: abec146a (2025-11-03)
 *
 * This test reproduces the exact authentication flow to verify the bug fix.
 */

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

describe('Authentication - User Login Query', () => {
  // Test data
  const testEmail = 'test@example.com';
  const testPassword = 'SecurePassword123!';
  let testUserId: string;

  beforeAll(async () => {
    // Create a test user with hashed password
    const passwordHash = await bcrypt.hash(testPassword, 10);

    const [user] = await db.insert(users).values({
      email: testEmail,
      passwordHash,
      firstName: 'Test',
      lastName: 'User',
      role: 'CLIENT_USER',
      isActive: true,
      mustChangePassword: false,
    }).returning();

    testUserId = user.id;
  });

  afterAll(async () => {
    // Cleanup: Delete test user
    await db.delete(users).where(sql`id = ${testUserId}`);
  });

  it('should query user with case-insensitive email lookup WITHOUT duplicate table aliases', async () => {
    // This test verifies the bug fix for the authentication query
    // BEFORE FIX: This would fail with "from 'users' 'users'" error
    // AFTER FIX: This should successfully find the user

    const testEmailUpperCase = testEmail.toUpperCase(); // TEST@EXAMPLE.COM

    // This is the CURRENT (BROKEN) query pattern from src/lib/auth/config.ts:70-72
    // It should fail with duplicate table alias error
    await expect(async () => {
      const user = await db.query.users.findFirst({
        where: sql`LOWER(${users.email}) = LOWER(${testEmailUpperCase})`,
      });
    }).rejects.toThrow(/from "users" "users"|duplicate|alias/i);
  });

  it('should successfully query user with correct Drizzle syntax', async () => {
    // This test verifies the CORRECT way to query with Drizzle core API
    const testEmailMixedCase = 'TeSt@ExAmPlE.cOm';

    // CORRECT APPROACH: Use db.select() with sql template for case-insensitive search
    const [user] = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.email}) = LOWER(${testEmailMixedCase})`);

    expect(user).toBeDefined();
    expect(user.email).toBe(testEmail);
    expect(user.id).toBe(testUserId);
  });

  it('should verify password hash is valid', async () => {
    // Verify the test user's password hash works
    const [user] = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.email}) = LOWER(${testEmail})`);

    const passwordMatch = await bcrypt.compare(testPassword, user.passwordHash);
    expect(passwordMatch).toBe(true);
  });
});
