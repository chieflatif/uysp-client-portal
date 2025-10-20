import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function POST() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    
    try {
      // Read migration files
      const migrations = [
        `CREATE TABLE IF NOT EXISTS clients (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          phone VARCHAR(20),
          airtable_base_id VARCHAR(255) NOT NULL,
          is_active BOOLEAN DEFAULT true,
          last_sync_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          first_name VARCHAR(255),
          last_name VARCHAR(255),
          role VARCHAR(50) DEFAULT 'CLIENT',
          client_id UUID REFERENCES clients(id),
          is_active BOOLEAN DEFAULT true,
          last_login_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )`
      ];

      for (const migration of migrations) {
        await client.query(migration);
      }

      client.release();

      return NextResponse.json({
        success: true,
        message: 'Database tables created successfully'
      });

    } catch (error: any) {
      client.release();
      throw error;
    }

  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message
    }, { status: 500 });
  } finally {
    await pool.end();
  }
}
