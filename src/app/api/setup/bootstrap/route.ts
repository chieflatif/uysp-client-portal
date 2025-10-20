// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { clients, users } from '@/lib/db/schema';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';
import { join } from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getSecret(req: NextRequest) {
  return req.headers.get('x-setup-secret') || new URL(req.url).searchParams.get('secret');
}

async function runMigrations() {
  // Read and run migration files
  const migrationPath = join(process.cwd(), 'src/lib/db/migrations');
  
  const migration0000 = readFileSync(join(migrationPath, '0000_outgoing_absorbing_man.sql'), 'utf-8');
  const migration0001 = readFileSync(join(migrationPath, '0001_familiar_rage.sql'), 'utf-8');
  
  // Split by statement-breakpoint and run each statement
  const statements = [...migration0000.split('--> statement-breakpoint'), ...migration0001.split('--> statement-breakpoint')]
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));
  
  for (const statement of statements) {
    if (statement) {
      await db.execute(sql.raw(statement));
    }
  }
}

async function handle(req: NextRequest) {
  try {
    // Check secret
    const secret = getSecret(req);
    const expected = process.env.NEXTAUTH_SECRET || '';
    if (!secret || secret !== expected) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }

    // Run migrations
    await runMigrations();

    // Create Rebel HQ client
    const [client] = await db.insert(clients).values({
      companyName: 'Rebel HQ',
      email: 'rebel@rebelhq.ai',
      airtableBaseId: process.env.AIRTABLE_BASE_ID || 'app4wIsBfpJTg7pWS',
      isActive: true,
    }).returning();

    // Create SUPER_ADMIN user
    const passwordHash = await bcrypt.hash('RElH0rst89!', 10);
    
    await db.insert(users).values({
      email: 'rebel@rebelhq.ai',
      passwordHash,
      firstName: 'Rebel',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      clientId: client.id,
      isActive: true,
    });

    return NextResponse.json({
      ok: true,
      message: 'Setup complete! Login now.',
      login: {
        url: 'https://uysp-portal-v2.onrender.com/login',
        email: 'rebel@rebelhq.ai',
        password: 'RElH0rst89!'
      }
    });

  } catch (error: any) {
    return NextResponse.json({ 
      ok: false, 
      error: error.message || String(error),
      stack: error.stack
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) { return handle(req); }
export async function POST(req: NextRequest) { return handle(req); }
