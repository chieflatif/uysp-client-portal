import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userActivityLog, leads, leadActivityLog } from '@/lib/db/schema';
import { and, eq, sql } from 'drizzle-orm';

/**
 * GET /api/cron/reconcile-imports
 *
 * This cron job reconciles bulk imports by creating `ENROLLED` events
 * in the `leadActivityLog`. It is designed to be triggered by a scheduler (e.g., Vercel Cron).
 *
 * Flow:
 * 1. Find unprocessed `BULK_IMPORT_INITIATED` events from the `userActivityLog`.
 * 2. For each event, find the corresponding leads in PostgreSQL by matching the `importId`.
 * 3. For each found lead, create an `ENROLLED` event in the `leadActivityLog`.
 * 4. Mark the `BULK_IMPORT_INITIATED` event as processed by updating its metadata.
 */
export async function GET(request: NextRequest) {
  // Simple secret to prevent unauthorized execution
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('CRON: Starting bulk import reconciliation...');

    // 1. Find unprocessed `BULK_IMPORT_INITIATED` events
    const unprocessedImports = await db.query.userActivityLog.findMany({
      where: and(
        eq(userActivityLog.eventType, 'BULK_IMPORT_INITIATED'),
        sql`event_data->>'reconciled' IS NULL`
      ),
      limit: 10, // Process 10 imports per run to avoid timeouts
    });

    if (unprocessedImports.length === 0) {
      console.log('CRON: No new bulk imports to reconcile.');
      return NextResponse.json({ message: 'No new imports to reconcile.' });
    }

    let totalLeadsLogged = 0;

    // 2. Process each import event
    for (const importEvent of unprocessedImports) {
      const eventData = importEvent.eventData as any;
      const importId = eventData?.importId;

      if (!importId) {
        console.warn(`CRON: Skipping import event ${importEvent.id} due to missing importId.`);
        continue;
      }

      console.log(`CRON: Processing importId: ${importId}`);

      // 3. Find leads in PostgreSQL that have this importId.
      // This relies on the Airtable -> PG sync having completed for these leads.
      const leadsToLog = await db.query.leads.findMany({
        where: eq(leads.importId, importId),
        columns: {
          id: true,
          airtableRecordId: true,
          campaignId: true,
          campaignName: true,
        },
      });
      
      if (leadsToLog.length === 0) {
        console.log(`CRON: No leads found for importId ${importId} yet. Will retry next run.`);
        continue;
      }

      // 4. Create `ENROLLED` events for each lead
      const logEntries = leadsToLog.map(lead => ({
        eventType: 'ENROLLED',
        eventCategory: 'CAMPAIGN',
        leadId: lead.id,
        leadAirtableId: lead.airtableRecordId,
        clientId: importEvent.clientId,
        description: `Enrolled in campaign via bulk import: "${lead.campaignName}"`,
        metadata: {
          campaignId: lead.campaignId,
          source: 'Bulk Import',
          importId: importId,
        },
        source: 'cron:reconcile-imports',
        createdBy: importEvent.userId,
        timestamp: importEvent.createdAt,
      }));

      if (logEntries.length > 0) {
        await db.insert(leadActivityLog).values(logEntries);
        totalLeadsLogged += logEntries.length;
        console.log(`CRON: Logged ${logEntries.length} ENROLLED events for importId ${importId}.`);
      }

      // 5. Mark the import event as reconciled
      await db.update(userActivityLog)
        .set({
          eventData: { ...eventData, reconciled: true, reconciledAt: new Date().toISOString() }
        })
        .where(eq(userActivityLog.id, importEvent.id));
    }

    console.log(`CRON: Reconciliation complete. Logged ${totalLeadsLogged} total events.`);
    return NextResponse.json({
      message: 'Reconciliation complete.',
      reconciledImports: unprocessedImports.length,
      totalLeadsLogged,
    });

  } catch (error: any) {
    console.error('CRON: Error during import reconciliation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
