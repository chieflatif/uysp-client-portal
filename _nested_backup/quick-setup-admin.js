require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL || 'postgresql://uysp_client_portal_db_user:PuLMS841kifvBNpl3mGcLBl1WjIs0ey2@dpg-d3q9raodl3ps73bp1r50-a.virginia-postgres.render.com/uysp_client_portal_db?sslmode=require';

async function setup() {
  const client = new Client({ 
    connectionString, 
    ssl: true,
    connectionTimeoutMillis: 30000,
    query_timeout: 30000
  });
  
  try {
    console.log('🔄 Attempting to connect to database...');
    console.log('Connection string:', connectionString.replace(/:[^@]*@/, ':****@')); // Hide password
    await client.connect();
    console.log('✅ Connected to database');

    // Create client
    const clientResult = await client.query(`
      INSERT INTO clients (id, company_name, email, airtable_base_id, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), 'Rebel HQ', 'rebel@rebelhq.ai', 'app4wIsBfpJTg7pWS', true, NOW(), NOW())
      RETURNING id
    `);
    
    const clientId = clientResult.rows[0].id;
    console.log('✅ Client created:', clientId);

    // Hash password
    const passwordHash = bcrypt.hashSync('RElH0rst89!', 10);

    // Create user
    await client.query(`
      INSERT INTO users (id, email, password_hash, first_name, last_name, role, client_id, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, true, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET role = 'SUPER_ADMIN', updated_at = NOW()
    `, ['rebel@rebelhq.ai', passwordHash, 'Rebel', 'Admin', 'SUPER_ADMIN', clientId]);

    console.log('\n✅ SUPER_ADMIN CREATED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email: rebel@rebelhq.ai');
    console.log('Password: RElH0rst89!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nLogin at: https://uysp-portal-v2.onrender.com/login');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Error code:', error.code);
    console.error('Error details:', error.detail || 'No additional details');
    if (error.code === 'ENOTFOUND') {
      console.error('🚨 DNS lookup failed - check your internet connection and database host');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🚨 Connection refused - database server may be down or unreachable');
    } else if (error.code === '28P01') {
      console.error('🚨 Authentication failed - check username and password');
    }
  } finally {
    await client.end();
  }
}

setup();
