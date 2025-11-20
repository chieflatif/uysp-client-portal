import 'dotenv/config';
import { db } from '../src/lib/db';
import { clients, users } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function createSuperAdmin() {
  console.log('🔧 Creating Super Admin user...\n');

  try {
    // Check if Rebel HQ client exists
    let client = await db.query.clients.findFirst({
      where: eq(clients.email, 'rebel@rebelhq.ai'),
    });

    // Create client if doesn't exist
    if (!client) {
      console.log('📝 Creating Rebel HQ client...');
      const [newClient] = await db.insert(clients).values({
        companyName: 'Rebel HQ',
        email: 'rebel@rebelhq.ai',
        airtableBaseId: 'app4wIsBfpJTg7pWS',
        isActive: true,
      }).returning();
      client = newClient;
      console.log('✅ Client created successfully!');
    } else {
      console.log('✅ Rebel HQ client already exists');
    }

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, 'rebel@rebelhq.ai'),
    });

    if (existingUser) {
      console.log('⚠️  User rebel@rebelhq.ai already exists');
      console.log(`   Current role: ${existingUser.role}`);
      
      // Update to SUPER_ADMIN if not already
      if (existingUser.role !== 'SUPER_ADMIN') {
        await db.update(users)
          .set({ role: 'SUPER_ADMIN' })
          .where(eq(users.id, existingUser.id));
        console.log('✅ Updated to SUPER_ADMIN role');
      }
      
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash('RElH0rst89!', 10);

    // Create super admin user
    const [newUser] = await db.insert(users).values({
      email: 'rebel@rebelhq.ai',
      passwordHash,
      firstName: 'Rebel',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      clientId: client.id,
      isActive: true,
    }).returning();

    console.log('\n✅ SUPER_ADMIN user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: rebel@rebelhq.ai');
    console.log('🔑 Password: RElH0rst89!');
    console.log('👤 Role: SUPER_ADMIN');
    console.log('🏢 Client: Rebel HQ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🚀 You can now login at: https://uysp-portal-v2.onrender.com/login');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

createSuperAdmin()
  .then(() => {
    console.log('\n✅ Setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  });

