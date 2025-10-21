import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { clients, leads } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAirtableClient } from '@/lib/airtable/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await request.json();
  const clientId = body.clientId;

  if (!clientId) {
    return new Response('clientId required', { status: 400 });
  }

  const client = await db.query.clients.findFirst({
    where: eq(clients.id, clientId),
  });

  if (!client || !client.airtableBaseId) {
    return new Response('Client not found', { status: 404 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const airtable = getAirtableClient(client.airtableBaseId);
        let totalFetched = 0;
        let totalInserted = 0;
        let totalUpdated = 0;
        let errors = 0;

        const batchSize = 100;
        let batch: any[] = [];

        // Send initial message
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'start', message: 'Starting sync...' })}\n\n`));

        await airtable.streamAllLeads(async (record) => {
          totalFetched++;
          
          try {
            const leadData = airtable.mapToDatabaseLead(record, clientId);
            batch.push({ record, leadData });

            if (batch.length >= batchSize) {
              await processBatch(batch);
              
              // Send progress update
              const progress = {
                type: 'progress',
                totalFetched,
                totalInserted,
                totalUpdated,
                errors,
                percentage: Math.round((totalFetched / 11000) * 100), // Estimate
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(progress)}\n\n`));
              
              batch = [];
            }
          } catch (error: any) {
            errors++;
          }
        });

        // Process remaining
        if (batch.length > 0) {
          await processBatch(batch);
        }

        // Update client sync time
        await db.update(clients)
          .set({ lastSyncAt: new Date() })
          .where(eq(clients.id, clientId));

        // Send completion
        const final = {
          type: 'complete',
          totalFetched,
          totalInserted,
          totalUpdated,
          errors,
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(final)}\n\n`));
        controller.close();

        async function processBatch(batchItems: any[]) {
          const recordIds = batchItems.map(b => b.record.id);
          const existing = await db.query.leads.findMany({
            where: (leads, { inArray }) => inArray(leads.airtableRecordId, recordIds),
          });
          
          const existingMap = new Map(existing.map(e => [e.airtableRecordId, e]));
          const toInsert: any[] = [];
          const toUpdate: any[] = [];
          
          for (const item of batchItems) {
            const existingLead = existingMap.get(item.record.id);
            if (existingLead) {
              toUpdate.push({ id: existingLead.id, data: { ...item.leadData, updatedAt: new Date() } });
            } else {
              toInsert.push({ ...item.leadData, createdAt: new Date(), updatedAt: new Date() });
            }
          }
          
          if (toInsert.length > 0) {
            await db.insert(leads).values(toInsert);
            totalInserted += toInsert.length;
          }
          
          for (const item of toUpdate) {
            await db.update(leads).set(item.data).where(eq(leads.id, item.id));
            totalUpdated++;
          }
        }

      } catch (error: any) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}


