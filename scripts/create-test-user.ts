#!/usr/bin/env tsx
/**
 * Create a test admin user for staging environment
 * with the correct client_id to see campaigns
 */

import bcrypt from 'bcryptjs';
import { db } from '../src/lib/db';
import { users } from '../src/lib/db/schema';

async function createTestUser() {
  const CLIENT_ID = '550e8400-e29b-41d4-a716-446655440000'; // The client_id all campaigns have

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash('TestAdmin123!', 10);

    // Create admin user
    const [newUser] = await db.insert(users).values({
      email: 'admin@test.com',
      passwordHash: hashedPassword,
      firstName: 'Test',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      clientId: CLIENT_ID,
      isActive: true,
    }).returning();

    console.log('✅ Test user created successfully!');
    console.log('📧 Email: admin@test.com');
    console.log('🔐 Password: TestAdmin123!');
    console.log('👤 Role: SUPER_ADMIN');
    console.log(`🏢 Client ID: ${CLIENT_ID}`);
    console.log('');
    console.log('You can now log into the staging site with these credentials.');

  } catch (error) {
    console.error('❌ Error creating test user:', error);
    process.exit(1);
  }
}

createTestUser();