// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { clients, leads } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAirtableClient } from '@/lib/airtable/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

/**
 * POST /api/admin/sync
 * 
 * Manually trigger Airtable → PostgreSQL sync for a specific client
 * SUPER_ADMIN only
 * Body: { clientId: string } - which client to sync
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

    const body = await request.json();
    const clientId = body.clientId;

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId is required in request body' },
        { status: 400 }
      );
    }

    // Get the client record to fetch their Airtable Base ID
    const client = await db.query.clients.findFirst({
      where: eq(clients.id, clientId),
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    if (!client.airtableBaseId) {
      return NextResponse.json(
        { error: `Client ${client.companyName} does not have an Airtable Base ID configured` },
        { status: 400 }
      );
    }

    // Initialize Airtable client with THIS client's base ID
    const airtable = getAirtableClient(client.airtableBaseId);
    let totalFetched = 0;
    let totalInserted = 0;
    let totalUpdated = 0;
    let errors = 0;
    const errorDetails: Array<{recordId: string; error: string}> = [];
    
    const batchSize = 500; // Larger batches = faster sync
    let batch: any[] = [];

    await airtable.streamAllLeads(async (record) => {
      totalFetched++;
      
      try {
        const leadData = airtable.mapToDatabaseLead(record, clientId);
        batch.push({ record, leadData });

        // Process batch when full
        if (batch.length >= batchSize) {
          await processBatch(batch);
          console.log(`✅ Synced ${totalFetched} leads...`);
          batch = [];
        }
      } catch (error: any) {
        errors++;
        const errorMsg = error.message || 'Unknown error';
        console.error(`Error mapping record ${record.id}:`, errorMsg);
        errorDetails.push({
          recordId: record.id,
          error: errorMsg
        });
      }
    });

    // Process remaining batch
    if (batch.length > 0) {
      await processBatch(batch);
      console.log(`✅ Final batch: ${totalFetched} leads total`);
    }

    async function processBatch(batchItems: any[]) {
      // Use PostgreSQL UPSERT (INSERT ... ON CONFLICT UPDATE) - MUCH FASTER
      const values = batchItems.map(item => ({
        ...item.leadData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      try {
        // Insert all, update on conflict with airtable_record_id
        await db.insert(leads)
          .values(values)
          .onConflictDoUpdate({
            target: leads.airtableRecordId,
            set: {
              ...values[0], // Use first item as template (all will be updated)
              updatedAt: new Date(),
            },
          });
        
        totalInserted += batchItems.length; // Approximate - some might be updates
      } catch (error: any) {
        console.error('Batch upsert error:', error.message);
        // Fallback to individual inserts if batch fails
        for (const item of batchItems) {
          try {
            await db.insert(leads).values({
              ...item.leadData,
              createdAt: new Date(),
              updatedAt: new Date(),
            }).onConflictDoNothing();
            totalInserted++;
          } catch (e: any) {
            errors++;
          }
        }
      }
    }

    // Update client's last sync timestamp
    await db.update(clients)
      .set({ lastSyncAt: new Date() })
      .where(eq(clients.id, clientId));

    return NextResponse.json({
      success: true,
      client: {
        id: client.id,
        companyName: client.companyName,
        airtableBaseId: client.airtableBaseId,
      },
      results: {
        totalFetched,
        totalInserted,
        totalUpdated,
        errors,
        errorDetails: errors > 0 ? errorDetails.slice(0, 10) : [], // Return first 10 errors
      },
      message: `Sync complete for ${client.companyName}! Fetched ${totalFetched}, inserted ${totalInserted}, updated ${totalUpdated}, errors: ${errors}`
    });

  } catch (error: any) {
    console.error('Sync failed:', error);
    return NextResponse.json(
      { error: error.message || 'Sync failed' },
      { status: 500 }
    );
  }
}

