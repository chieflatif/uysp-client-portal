import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { airtableSyncQueue } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/sync-queue
 *
 * Get sync queue status
 * SUPER_ADMIN only
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - SUPER_ADMIN only' },
        { status: 403 }
      );
    }

    // Get queue stats
    const allItems = await db
      .select()
      .from(airtableSyncQueue)
      .orderBy(desc(airtableSyncQueue.createdAt))
      .limit(100);

    const stats = {
      total: allItems.length,
      pending: allItems.filter(i => i.status === 'pending').length,
      processing: allItems.filter(i => i.status === 'processing').length,
      completed: allItems.filter(i => i.status === 'completed').length,
      failed: allItems.filter(i => i.status === 'failed').length,
    };

    return NextResponse.json({
      stats,
      items: allItems,
    });
  } catch (error) {
    console.error('Error fetching sync queue:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/sync-queue
 *
 * Clear completed/failed items from queue
 * SUPER_ADMIN only
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - SUPER_ADMIN only' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    if (status === 'completed') {
      // First count the items
      const itemsToDelete = await db
        .select()
        .from(airtableSyncQueue)
        .where(eq(airtableSyncQueue.status, 'completed'));

      // Then delete them
      await db
        .delete(airtableSyncQueue)
        .where(eq(airtableSyncQueue.status, 'completed'));

      return NextResponse.json({
        success: true,
        deleted: itemsToDelete.length,
        message: `Cleared ${itemsToDelete.length} completed items`,
      });
    } else if (status === 'failed') {
      // First count the items
      const itemsToDelete = await db
        .select()
        .from(airtableSyncQueue)
        .where(eq(airtableSyncQueue.status, 'failed'));

      // Then delete them
      await db
        .delete(airtableSyncQueue)
        .where(eq(airtableSyncQueue.status, 'failed'));

      return NextResponse.json({
        success: true,
        deleted: itemsToDelete.length,
        message: `Cleared ${itemsToDelete.length} failed items`,
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid status parameter. Use ?status=completed or ?status=failed' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error clearing sync queue:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
