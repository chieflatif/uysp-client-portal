import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { leads } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/leads
 * Fetch all leads for the authenticated user
 *
 * SECURITY: Client isolation enforced
 * - SUPER_ADMIN: sees all leads across all clients
 * - CLIENT_ADMIN/CLIENT_USER: sees only their client's leads
 */
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // CRITICAL FIX: Filter by clientId for non-SUPER_ADMIN users
    const allLeads = await db.query.leads.findMany({
      where: session.user.role === 'SUPER_ADMIN'
        ? undefined // SUPER_ADMIN sees all leads
        : eq(leads.clientId, session.user.clientId!), // CLIENT_ADMIN/USER see only their client's leads
      orderBy: (leads, { desc }) => [desc(leads.icpScore)],
    });

    return NextResponse.json({
      leads: allLeads,
      count: allLeads.length,
    });
  } catch (error) {
    console.error('Error fetching leads:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
