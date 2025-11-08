import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export async function GET(request: NextRequest) {
  // SECURITY: Block in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  // SECURITY: Require SUPER_ADMIN authentication
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // SECURITY: Use header instead of query param (not logged)
  const debugSecret = request.headers.get('x-debug-secret');
  if (debugSecret !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: 'Invalid debug secret' }, { status: 403 });
  }

  return NextResponse.json({
    DATABASE_URL: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@') || 'NOT SET',
    hasSSL: process.env.DATABASE_URL?.includes('ssl') || false,
    length: process.env.DATABASE_URL?.length || 0
  });
}

