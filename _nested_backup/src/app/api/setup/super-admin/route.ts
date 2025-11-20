import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clients, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    // Create client
    let client = await db.query.clients.findFirst({
      where: eq(clients.email, 'rebel@rebelhq.ai'),
    });

    if (!client) {
      const [newClient] = await db.insert(clients).values({
        companyName: 'Rebel HQ',
        email: 'rebel@rebelhq.ai',
        airtableBaseId: 'app4wIsBfpJTg7pWS',
        isActive: true,
      }).returning();
      client = newClient;
    }

    // Create super admin
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, 'rebel@rebelhq.ai'),
    });

    if (existingUser) {
      return NextResponse.json({ 
        message: 'User already exists',
        email: 'rebel@rebelhq.ai'
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
      success: true,
      message: 'SUPER_ADMIN created',
      email: 'rebel@rebelhq.ai',
      role: 'SUPER_ADMIN'
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

