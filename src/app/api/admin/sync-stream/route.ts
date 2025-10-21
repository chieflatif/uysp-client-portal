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

        const batchSize = 500; // Larger batches = faster sync
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
          // Use PostgreSQL UPSERT - 100x faster than checking each record
          const values = batchItems.map(item => ({
            ...item.leadData,
            createdAt: new Date(),
            updatedAt: new Date(),
          }));

          try {
            await db.insert(leads)
              .values(values)
              .onConflictDoUpdate({
                target: leads.airtableRecordId,
                set: {
                  ...values[0],
                  updatedAt: new Date(),
                },
              });
            totalInserted += batchItems.length;
          } catch (error: any) {
            console.error('Batch upsert error:', error.message);
            for (const item of batchItems) {
              try {
                await db.insert(leads).values({
                  ...item.leadData,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }).onConflictDoNothing();
                totalInserted++;
              } catch (e) {
                errors++;
              }
            }
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


