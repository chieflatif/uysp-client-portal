import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email') || 'rebel@rebelhq.ai';

  const results: any = {
    email,
    timestamp: new Date().toISOString(),
    tests: {},
  };

  // Test 1: Direct SQL
  try {
    const directResult = await db.execute({
      sql: 'SELECT email FROM users WHERE email = $1 LIMIT 1',
      args: [email],
    });
    results.tests.direct_sql = {
      success: true,
      result: directResult,
    };
  } catch (error) {
    results.tests.direct_sql = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    };
  }

  // Test 2: Drizzle query builder
  try {
    const drizzleResult = await db.query.users.findFirst({
      where: eq(users.email, email),
      columns: {
        email: true,
        role: true,
      },
    });
    results.tests.drizzle_query = {
      success: true,
      found: !!drizzleResult,
      result: drizzleResult,
    };
  } catch (error) {
    results.tests.drizzle_query = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    };
  }

  // Test 3: Full auth query (same as auth)
  try {
    const authResult = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });
    results.tests.full_auth_query = {
      success: true,
      found: !!authResult,
      hasPassword: !!authResult?.passwordHash,
    };
  } catch (error) {
    results.tests.full_auth_query = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    };
  }

  return NextResponse.json(results);
}
