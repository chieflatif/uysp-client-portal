import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clients, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Check if setup is already complete
    const existingAdmin = await db.query.users.findFirst({
      where: eq(users.role, 'SUPER_ADMIN'),
    });

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Setup already completed. SUPER_ADMIN account exists.' },
        { status: 403 }
      );
    }

    // SECURITY: Require setup secret (only works first time or in dev)
    const isDev = process.env.NODE_ENV === 'development';
    const setupLocked = process.env.SETUP_COMPLETE === 'true';

    if (setupLocked && !isDev) {
      return NextResponse.json(
        { error: 'Setup is locked. Set SETUP_COMPLETE=false to re-enable.' },
        { status: 403 }
      );
    }

    // Require setup secret header (not in URL)
    if (!isDev) {
      const setupSecret = request.headers.get('x-setup-secret');
      if (!setupSecret || setupSecret !== process.env.SETUP_SECRET) {
        return NextResponse.json(
          { error: 'Invalid setup secret' },
          { status: 401 }
        );
      }
    }

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

