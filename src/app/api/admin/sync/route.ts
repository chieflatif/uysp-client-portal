// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { clients, leads, clientProjectTasks, clientProjectBlockers, clientProjectStatus } from '@/lib/db/schema';
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

    // ========================================================================
    // SYNC PROJECT MANAGEMENT DATA
    // ========================================================================
    
    let tasksFetched = 0;
    let tasksInserted = 0;
    let blockersFetched = 0;
    let blockersInserted = 0;
    let statusFetched = 0;
    let statusInserted = 0;

    // Sync Tasks
    try {
      await airtable.streamAllProjectTasks(async (record) => {
        tasksFetched++;
        try {
          const taskData = airtable.mapToDatabaseTask(record, clientId);
          await db.insert(clientProjectTasks)
            .values(taskData)
            .onConflictDoUpdate({
              target: clientProjectTasks.airtableRecordId,
              set: {
                ...taskData,
                updatedAt: new Date(),
              },
            });
          tasksInserted++;
        } catch (error: any) {
          console.error(`Error syncing task ${record.id}:`, error.message);
        }
      });
    } catch (error: any) {
      console.error('Tasks table not found or error syncing:', error.message);
    }

    // Sync Blockers
    try {
      await airtable.streamAllProjectBlockers(async (record) => {
        blockersFetched++;
        try {
          const blockerData = airtable.mapToDatabaseBlocker(record, clientId);
          await db.insert(clientProjectBlockers)
            .values(blockerData)
            .onConflictDoUpdate({
              target: clientProjectBlockers.airtableRecordId,
              set: {
                ...blockerData,
              },
            });
          blockersInserted++;
        } catch (error: any) {
          console.error(`Error syncing blocker ${record.id}:`, error.message);
        }
      });
    } catch (error: any) {
      console.error('Blockers table not found or error syncing:', error.message);
    }

    // Sync Project Status
    try {
      await airtable.streamAllProjectStatus(async (record) => {
        statusFetched++;
        try {
          const statusData = airtable.mapToDatabaseProjectStatus(record, clientId);
          await db.insert(clientProjectStatus)
            .values(statusData)
            .onConflictDoUpdate({
              target: clientProjectStatus.airtableRecordId,
              set: {
                ...statusData,
                updatedAt: new Date(),
              },
            });
          statusInserted++;
        } catch (error: any) {
          console.error(`Error syncing status ${record.id}:`, error.message);
        }
      });
    } catch (error: any) {
      console.error('Project_Status table not found or error syncing:', error.message);
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
        leads: {
          totalFetched,
          totalInserted,
          totalUpdated,
          errors,
          errorDetails: errors > 0 ? errorDetails.slice(0, 10) : [],
        },
        tasks: {
          fetched: tasksFetched,
          synced: tasksInserted,
        },
        blockers: {
          fetched: blockersFetched,
          synced: blockersInserted,
        },
        projectStatus: {
          fetched: statusFetched,
          synced: statusInserted,
        },
      },
      message: `Sync complete for ${client.companyName}! Leads: ${totalFetched}, Tasks: ${tasksFetched}, Blockers: ${blockersFetched}, Status: ${statusFetched}`
    });

  } catch (error: any) {
    console.error('Sync failed:', error);
    return NextResponse.json(
      { error: error.message || 'Sync failed' },
      { status: 500 }
    );
  }
}

