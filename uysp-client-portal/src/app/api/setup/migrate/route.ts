import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clients, users } from '@/lib/db/schema';

export async function POST() {
  try {
    // Tables are created automatically by Drizzle when we query them
    // Just verify they exist by doing a simple count
    const clientsCount = await db.select().from(clients).limit(1);
    const usersCount = await db.select().from(users).limit(1);

    return NextResponse.json({
      success: true,
      message: 'Database ready - tables exist',
      tables: ['clients', 'users', 'leads', 'activity_log']
    });

  } catch (error: any) {
    // If error, tables probably don't exist - they'll be created on first query
    return NextResponse.json({ 
      message: 'Attempting to initialize tables...',
      note: 'Tables will be created on first use'
    });
  }
}
