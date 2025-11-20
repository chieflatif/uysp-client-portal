/**
 * Test authentication locally against production database
 * This will help us see the ACTUAL error
 */

require('dotenv').config({ path: '.env.local' });
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const bcrypt = require('bcryptjs');

// Use the exact same configuration as the app
const client = postgres(process.env.DATABASE_URL, {
  prepare: false,
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  max_lifetime: 60 * 30,
  ssl: { rejectUnauthorized: false },
});

const db = drizzle(client);

async function testAuth() {
  console.log('\n=== TESTING AUTHENTICATION LOCALLY ===\n');

  const testEmail = 'rebel@rebelhq.ai';
  console.log(`Testing with email: ${testEmail}`);

  try {
    console.log('\n1. Testing database connection...');
    const testQuery = await client`SELECT 1 as test`;
    console.log('   ✅ Database connection works:', testQuery);

    console.log('\n2. Querying user from database...');
    const result = await client`
      SELECT
        id, email, password_hash, first_name, last_name,
        role, client_id, is_active, must_change_password
      FROM users
      WHERE email = ${testEmail}
      LIMIT 1
    `;

    console.log('   Query returned:', result.length, 'rows');

    if (result.length === 0) {
      console.log('   ❌ USER NOT FOUND in database');
      console.log('\n3. Checking what users exist...');
      const allUsers = await client`SELECT email FROM users LIMIT 10`;
      console.log('   Available users:', allUsers.map(u => u.email));
      process.exit(1);
    }

    const user = result[0];
    console.log('   ✅ User found:', {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.is_active,
      hasPasswordHash: !!user.password_hash,
      passwordHashLength: user.password_hash?.length
    });

    console.log('\n3. Testing password verification...');
    const testPassword = 'RElH0rst89!';
    const isValid = await bcrypt.compare(testPassword, user.password_hash);

    if (isValid) {
      console.log('   ✅ Password is CORRECT');
    } else {
      console.log('   ❌ Password is INCORRECT');
      console.log('   Expected password: RElH0rst89!');
      console.log('   Hash in database:', user.password_hash.substring(0, 20) + '...');
    }

    console.log('\n4. Testing with Drizzle query builder...');
    const { users } = require('./src/lib/db/schema');
    const { eq } = require('drizzle-orm');

    const drizzleDb = drizzle(client, { schema: { users } });
    const drizzleUser = await drizzleDb.query.users.findFirst({
      where: eq(users.email, testEmail),
    });

    if (drizzleUser) {
      console.log('   ✅ Drizzle query works:', {
        id: drizzleUser.id,
        email: drizzleUser.email,
        role: drizzleUser.role
      });
    } else {
      console.log('   ❌ Drizzle query returned no user');
    }

    console.log('\n=== AUTHENTICATION TEST COMPLETE ===\n');

    if (isValid && drizzleUser) {
      console.log('✅ ALL TESTS PASSED - Authentication should work');
    } else {
      console.log('❌ TESTS FAILED - Authentication will not work');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
    process.exit(0);
  }
}

testAuth();
