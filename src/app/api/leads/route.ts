import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';

/**
 * GET /api/leads
 * Fetch all leads for the authenticated user
 */
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all leads, sorted by ICP score (highest first)
    const allLeads = await db.query.leads.findMany({
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
