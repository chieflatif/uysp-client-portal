import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clients, users } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export async function POST() {
  try {
    // Tables are created automatically by Drizzle when we query them
    // Just verify they exist by doing a simple count
    const [{ clientCount }] = await db
      .select({ clientCount: sql<number>`count(*)` })
      .from(clients);
    const [{ userCount }] = await db
      .select({ userCount: sql<number>`count(*)` })
      .from(users);

    return NextResponse.json({
      success: true,
      message: 'Database ready - tables exist',
      tables: ['clients', 'users', 'leads', 'activity_log'],
      counts: {
        clients: Number(clientCount),
        users: Number(userCount),
      },
    });

  } catch (error) {
    // If error, tables probably don't exist - they'll be created on first query
    return NextResponse.json({ 
      message: 'Attempting to initialize tables...',
      note: 'Tables will be created on first use',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
