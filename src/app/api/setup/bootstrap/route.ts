// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clients, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getSecret(req: NextRequest) {
  return req.headers.get('x-setup-secret') || new URL(req.url).searchParams.get('secret');
}

async function handle(req: NextRequest) {
  try {
    // Check secret
    const secret = getSecret(req);
    const expected = process.env.NEXTAUTH_SECRET || '';
    if (!secret || secret !== expected) {
      return NextResponse.json({ ok: false, error: 'Unauthorized - invalid secret' }, { status: 403 });
    }

    // Create Rebel HQ client
    let client = await db.query.clients.findFirst({
      where: eq(clients.email, 'rebel@rebelhq.ai'),
    });

    if (!client) {
      const [newClient] = await db.insert(clients).values({
        companyName: 'Rebel HQ',
        email: 'rebel@rebelhq.ai',
        airtableBaseId: process.env.AIRTABLE_BASE_ID || 'app4wIsBfpJTg7pWS',
        isActive: true,
      }).returning();
      client = newClient;
    }

    // Create SUPER_ADMIN user
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, 'rebel@rebelhq.ai'),
    });

    if (existingUser) {
      return NextResponse.json({
        ok: true,
        message: 'User already exists',
        user: { email: 'rebel@rebelhq.ai', role: existingUser.role }
      });
    }

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
      message: 'SUPER_ADMIN created successfully',
      login: {
        url: 'https://uysp-portal-v2.onrender.com/login',
        email: 'rebel@rebelhq.ai',
        password: 'RElH0rst89!'
      }
    });

  } catch (error: any) {
    return NextResponse.json({ 
      ok: false, 
      error: error.message,
      hint: 'Database tables may not exist yet - Drizzle should create them automatically on first query'
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) { return handle(req); }
export async function POST(req: NextRequest) { return handle(req); }
