// @ts-nocheck
import { NextResponse } from 'next/server';

export async function GET(req) {
  const secret = new URL(req.url).searchParams.get('secret');
  if (secret !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  return NextResponse.json({
    DATABASE_URL: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@') || 'NOT SET',
    hasSSL: process.env.DATABASE_URL?.includes('ssl') || false,
    length: process.env.DATABASE_URL?.length || 0
  });
}

