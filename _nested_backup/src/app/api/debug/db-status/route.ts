// @ts-nocheck
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Try to query users table
    const usersResult = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
    const clientsResult = await db.execute(sql`SELECT COUNT(*) as count FROM clients`);
    
    return NextResponse.json({
      ok: true,
      tables: {
        users: usersResult[0]?.count || 0,
        clients: clientsResult[0]?.count || 0
      },
      message: 'Database is connected and tables exist'
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error.message,
      hint: 'Tables probably do not exist'
    }, { status: 500 });
  }
}

