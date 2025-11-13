import { db } from '../src/lib/db/index.js';
import { sql } from 'drizzle-orm';

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...\n');

    // Check if rebel@rebelhq.ai exists
    const rebelUser = await db.execute(sql`
      SELECT id, email, role, is_active, first_name, last_name, must_change_password, created_at
      FROM users
      WHERE LOWER(email) = LOWER('rebel@rebelhq.ai')
    `);

    console.log('rebel@rebelhq.ai user:');
    const rebelData = rebelUser.rows || rebelUser;
    if (rebelData && rebelData.length > 0) {
      console.table(rebelData);
    } else {
      console.log('❌ NOT FOUND\n');
    }

    // List all users
    console.log('\nAll users in database:');
    const allUsers = await db.execute(sql`
      SELECT id, email, role, is_active, first_name, last_name, must_change_password, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 10
    `);

    const userData = allUsers.rows || allUsers;
    if (userData && userData.length > 0) {
      console.table(userData);
    } else {
      console.log('❌ No users found in database!\n');
    }

    // Count total users
    const countResult = await db.execute(sql`
      SELECT COUNT(*) as total FROM users
    `);
    const countData = countResult.rows || countResult;
    const total = countData[0]?.total || 0;
    console.log(`\nTotal users: ${total}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUsers();
