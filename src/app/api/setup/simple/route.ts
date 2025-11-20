import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
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
    const insertedClients = await db.insert(clients).values({
      companyName: 'Rebel HQ',
      email: 'rebel@rebelhq.ai',
      airtableBaseId: 'app4wIsBfpJTg7pWS',
      isActive: true,
    }).onConflictDoNothing().returning();

    const client = insertedClients[0];

    if (!client) {
      // Client already exists, get it
      const existing = await db
        .select()
        .from(clients)
        .where(eq(clients.email, 'rebel@rebelhq.ai'))
        .limit(1);
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

  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.toString() : 'Unknown error'
    }, { status: 500 });
  }
}

