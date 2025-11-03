#!/usr/bin/env node

/**
 * Emergency Password Reset Script
 *
 * Usage:
 *   node scripts/reset-password.js latifhorst@gmail.com NewPassword123!
 *
 * This script directly updates the password in the database.
 */

const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const bcrypt = require('bcryptjs');
const { eq } = require('drizzle-orm');

// Check command line arguments
const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.error('❌ Usage: node scripts/reset-password.js <email> <new-password>');
  console.error('');
  console.error('Example:');
  console.error('  node scripts/reset-password.js latifhorst@gmail.com NewPassword123!');
  process.exit(1);
}

// Validate password strength
if (newPassword.length < 8) {
  console.error('❌ Password must be at least 8 characters');
  process.exit(1);
}

async function resetPassword() {
  console.log('🔄 Resetting password for:', email);
  console.log('');

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable not set');
    console.error('');
    console.error('Set it with:');
    console.error('  export DATABASE_URL="postgresql://..."');
    process.exit(1);
  }

  const client = postgres(process.env.DATABASE_URL, {
    ssl: { rejectUnauthorized: false },
  });

  const db = drizzle(client);

  try {
    // Import schema
    const { users } = require('../src/lib/db/schema');

    // Find user
    const user = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);

    if (user.length === 0) {
      console.error('❌ User not found:', email);
      await client.end();
      process.exit(1);
    }

    console.log('✅ Found user:', user[0].email);
    console.log('   Role:', user[0].role);
    console.log('   Name:', user[0].firstName, user[0].lastName);
    console.log('');

    // Hash new password
    console.log('🔐 Hashing new password...');
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    console.log('💾 Updating password in database...');
    await db
      .update(users)
      .set({
        passwordHash,
        mustChangePassword: false, // Clear the must change password flag
        updatedAt: new Date(),
      })
      .where(eq(users.id, user[0].id));

    console.log('');
    console.log('✅ Password reset successful!');
    console.log('');
    console.log('You can now login with:');
    console.log('  Email:', email);
    console.log('  Password:', newPassword);
    console.log('');

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
    await client.end();
    process.exit(1);
  }
}

resetPassword();
