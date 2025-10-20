const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL || 'postgresql://uysp_client_portal_db_user@dpg-d3q9raodl3ps73bp1r50-a.virginia-postgres.render.com/uysp_client_portal_db?sslmode=require';

async function setup() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Create client
    const clientResult = await client.query(`
      INSERT INTO clients (id, company_name, email, airtable_base_id, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), 'Rebel HQ', 'rebel@rebelhq.ai', 'app4wIsBfpJTg7pWS', true, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
      RETURNING id
    `);
    
    const clientId = clientResult.rows[0].id;
    console.log('✅ Client created:', clientId);

    // Hash password
    const passwordHash = bcrypt.hashSync('RElH0rst89!', 10);

    // Create user
    await client.query(`
      INSERT INTO users (id, email, password_hash, first_name, last_name, role, client_id, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), 'rebel@rebelhq.ai', $1, 'Rebel', 'Admin', 'SUPER_ADMIN', $2, true, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET role = 'SUPER_ADMIN', updated_at = NOW()
    `, [passwordHash, clientId]);

    console.log('\n✅ SUPER_ADMIN CREATED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email: rebel@rebelhq.ai');
    console.log('Password: RElH0rst89!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nLogin at: https://uysp-portal-v2.onrender.com/login');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

setup();

