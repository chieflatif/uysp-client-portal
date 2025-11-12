import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { reconcileRecentChanges } from '../../../../../../scripts/reconcile-recent-changes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes (reconciler can take time for large datasets)

/**
 * POST /api/admin/sync/delta
 *
 * Trigger bi-directional reconciliation for recently changed leads.
 * Runs two-stage sync:
 *   Stage 1: Airtable → PostgreSQL (changes in last N minutes)
 *   Stage 2: PostgreSQL → Airtable (portal-owned fields: claimedBy, claimedAt, notes)
 *
 * SUPER_ADMIN only
 * Body: { minutes?: number } - how many minutes to look back (default: 20)
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Authorization - SUPER_ADMIN only
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - SUPER_ADMIN access required' },
        { status: 403 }
      );
    }

    // Parse request body
    let body: any = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate minutes parameter
    const minutes = body.minutes ?? 20;
    if (typeof minutes !== 'number' || minutes < 1 || minutes > 1440) {
      return NextResponse.json(
        {
          error: 'Invalid minutes parameter',
          details: 'minutes must be a number between 1 and 1440 (24 hours)',
        },
        { status: 400 }
      );
    }

    console.log(`\n🔄 Delta Sync triggered by ${session.user.email} (${minutes} minutes)`);

    // Run reconciler
    const startTime = Date.now();
    const result = await reconcileRecentChanges(minutes);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`✅ Delta Sync complete in ${duration}s`);

    // Return results
    return NextResponse.json({
      success: true,
      triggeredBy: session.user.email,
      minutes,
      duration: `${duration}s`,
      results: {
        stage1: {
          processed: result.stage1.recordsProcessed,
          errors: result.stage1.errors.length,
          description: 'Airtable → PostgreSQL',
        },
        stage2: {
          updated: result.stage2.updated,
          skipped: result.stage2.skipped,
          errors: result.stage2.errors.length,
          description: 'PostgreSQL → Airtable',
        },
      },
      message: `Delta sync complete: Stage 1 processed ${result.stage1.recordsProcessed} leads, Stage 2 updated ${result.stage2.updated} leads`,
    });
  } catch (error: any) {
    console.error('Delta sync failed:', error);
    return NextResponse.json(
      {
        error: 'Delta sync failed',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
