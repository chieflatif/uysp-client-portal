// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { clients, users } from '@/lib/db/schema';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  try {
    // Simple auth check
    const secret = new URL(req.url).searchParams.get('secret');
    if (secret !== process.env.NEXTAUTH_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Just try to insert - Drizzle should handle table creation
    const [client] = await db.insert(clients).values({
      companyName: 'Rebel HQ',
      email: 'rebel@rebelhq.ai',
      airtableBaseId: 'app4wIsBfpJTg7pWS',
      isActive: true,
    }).returning().onConflictDoNothing();

    if (!client) {
      // Client already exists, get it
      const existing = await db.select().from(clients).where(sql`email = 'rebel@rebelhq.ai'`).limit(1);
      if (existing[0]) {
        return NextResponse.json({ ok: true, message: 'Setup already complete' });
      }
      return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
    }

    // Create user
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
      message: 'SUCCESS! You can now login',
      credentials: {
        email: 'rebel@rebelhq.ai',
        password: 'RElH0rst89!'
      }
    });

  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      details: error.toString()
    }, { status: 500 });
  }
}

