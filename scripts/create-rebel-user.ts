import { db } from '../src/lib/db/index.js';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function createRebelUser() {
  try {
    console.log('🔧 Creating rebel@rebelhq.ai user...\n');

    // Get the existing client (there's only 1 client)
    const clientResult = await db.execute(sql`
      SELECT id FROM clients LIMIT 1
    `);

    const clientData = clientResult.rows || clientResult;
    const clientId = clientData[0]?.id;

    if (!clientId) {
      console.error('❌ No client found in database');
      process.exit(1);
    }

    console.log(`✅ Found client: ${clientId}`);

    // Check if user already exists
    const existingUser = await db.execute(sql`
      SELECT id, email, role FROM users
      WHERE LOWER(email) = LOWER('rebel@rebelhq.ai')
    `);

    const userData = existingUser.rows || existingUser;
    if (userData && userData.length > 0) {
      console.log('⚠️  User rebel@rebelhq.ai already exists');
      console.table(userData);
      process.exit(0);
    }

    // Hash password
    const passwordHash = await bcrypt.hash('RElH0rst89!', 10);

    // Create user
    await db.execute(sql`
      INSERT INTO users (email, password_hash, first_name, last_name, role, client_id, is_active, must_change_password)
      VALUES ('rebel@rebelhq.ai', ${passwordHash}, 'Rebel', 'Admin', 'SUPER_ADMIN', ${clientId}, true, false)
    `);

    console.log('\n✅ SUPER_ADMIN user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: rebel@rebelhq.ai');
    console.log('🔑 Password: RElH0rst89!');
    console.log('👤 Role: SUPER_ADMIN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🚀 You can now login at: https://uysp-portal-test-fresh.onrender.com/login');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createRebelUser();
