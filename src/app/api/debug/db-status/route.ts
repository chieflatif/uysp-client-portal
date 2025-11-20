import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  // SECURITY: Block in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  // SECURITY: Require SUPER_ADMIN authentication
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      ok: false,
      error: message,
      hint: 'Tables probably do not exist'
    }, { status: 500 });
  }
}

