import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { airtableSyncQueue, clients } from '@/lib/db/schema';
import { eq, and, lte } from 'drizzle-orm';
import { getAirtableClient } from '@/lib/airtable/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

/**
 * POST /api/cron/process-sync-queue
 *
 * Background job to retry failed Airtable syncs
 * Should be called every 5 minutes by a cron job or Render cron
 *
 * SECURITY: This endpoint should be protected by a cron secret or IP whitelist
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-cron-secret-change-in-production';

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔄 [Sync Queue] Starting retry job...');

    // Find pending sync items that are ready to retry
    const now = new Date();
    const pendingItems = await db
      .select()
      .from(airtableSyncQueue)
      .where(
        and(
          eq(airtableSyncQueue.status, 'pending'),
          lte(airtableSyncQueue.nextRetryAt, now)
        )
      )
      .limit(50); // Process max 50 items per run

    console.log(`📦 [Sync Queue] Found ${pendingItems.length} items to process`);

    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    let maxAttemptsReached = 0;

    for (const item of pendingItems) {
      processed++;

      try {
        // Mark as processing
        await db
          .update(airtableSyncQueue)
          .set({ status: 'processing' })
          .where(eq(airtableSyncQueue.id, item.id));

        // Get client to access Airtable base
        const client = await db.query.clients.findFirst({
          where: eq(clients.id, item.clientId),
        });

        if (!client || !client.airtableBaseId) {
          throw new Error('Client not found or missing Airtable Base ID');
        }

        // Get Airtable client
        const airtable = getAirtableClient(client.airtableBaseId);

        // Execute the operation
        if (item.operation === 'update') {
          await airtable.updateRecord(
            item.tableName,
            item.recordId,
            item.payload as any
          );
        } else if (item.operation === 'create') {
          await airtable.createRecord(
            item.tableName,
            item.payload as any
          );
        } else {
          throw new Error(`Unknown operation: ${item.operation}`);
        }

        // Mark as completed
        await db
          .update(airtableSyncQueue)
          .set({
            status: 'completed',
            completedAt: new Date(),
          })
          .where(eq(airtableSyncQueue.id, item.id));

        succeeded++;
        console.log(`✅ [Sync Queue] Succeeded: ${item.tableName} ${item.recordId}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const newAttempts = item.attempts + 1;

        // Check if max attempts reached
        if (newAttempts >= item.maxAttempts) {
          // Mark as failed permanently
          await db
            .update(airtableSyncQueue)
            .set({
              status: 'failed',
              attempts: newAttempts,
              lastError: errorMessage,
              lastAttemptAt: new Date(),
            })
            .where(eq(airtableSyncQueue.id, item.id));

          maxAttemptsReached++;
          console.error(`❌ [Sync Queue] Max attempts reached: ${item.tableName} ${item.recordId}`);
        } else {
          // Schedule next retry with exponential backoff
          const backoffMinutes = Math.pow(2, newAttempts) * 5; // 5, 10, 20, 40, 80 minutes
          const nextRetryAt = new Date(Date.now() + backoffMinutes * 60 * 1000);

          await db
            .update(airtableSyncQueue)
            .set({
              status: 'pending',
              attempts: newAttempts,
              lastError: errorMessage,
              lastAttemptAt: new Date(),
              nextRetryAt,
            })
            .where(eq(airtableSyncQueue.id, item.id));

          failed++;
          console.warn(`⚠️ [Sync Queue] Retry scheduled in ${backoffMinutes}min: ${item.tableName} ${item.recordId}`);
        }
      }
    }

    // Clean up old completed items (older than 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const { rowCount } = await db
      .delete(airtableSyncQueue)
      .where(
        and(
          eq(airtableSyncQueue.status, 'completed'),
          lte(airtableSyncQueue.completedAt, sevenDaysAgo)
        )
      );

    console.log(`🗑️ [Sync Queue] Cleaned up ${rowCount} old completed items`);

    const result = {
      success: true,
      processed,
      succeeded,
      failed,
      maxAttemptsReached,
      cleanedUp: rowCount,
      timestamp: new Date().toISOString(),
    };

    console.log('✅ [Sync Queue] Job complete:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ [Sync Queue] Job failed:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
