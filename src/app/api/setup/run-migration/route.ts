import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function POST() {
  try {
    // Run the migration SQL directly
    const migrationSQL = `
      CREATE TABLE IF NOT EXISTS clients (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        company_name varchar(255) NOT NULL,
        email varchar(255) NOT NULL,
        phone varchar(20),
        airtable_base_id varchar(255) NOT NULL,
        is_active boolean DEFAULT true NOT NULL,
        last_sync_at timestamp,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        email varchar(255) NOT NULL,
        password_hash text NOT NULL,
        first_name varchar(255),
        last_name varchar(255),
        role varchar(50) DEFAULT 'CLIENT' NOT NULL,
        client_id uuid,
        is_active boolean DEFAULT true NOT NULL,
        last_login_at timestamp,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL,
        CONSTRAINT users_email_unique UNIQUE(email)
      );
      
      CREATE INDEX IF NOT EXISTS idx_users_email ON users USING btree (email);
      CREATE INDEX IF NOT EXISTS idx_users_client_id ON users USING btree (client_id);
    `;

    await db.execute(sql`${sql.raw(migrationSQL)}`);

    return NextResponse.json({
      success: true,
      message: 'Database tables created'
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

