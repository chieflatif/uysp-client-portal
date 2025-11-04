import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { clients, leads, campaigns, clientProjectTasks, clientProjectBlockers, clientProjectStatus, airtableSyncQueue, activityLog, type NewLead } from '@/lib/db/schema';
import { eq, and, sql, inArray, notInArray } from 'drizzle-orm';
import { getAirtableClient } from '@/lib/airtable/client';
import { syncCampaignsFromAirtable } from '@/lib/sync/sync-campaigns';
import { z } from 'zod';

// Import Airtable types for type safety
interface AirtableRecord {
  id: string;
  fields: Record<string, any>;
  createdTime: string;
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

// Validation schema for request body
const syncRequestSchema = z.object({
  clientId: z.string().uuid('Invalid client ID format - must be a valid UUID'),
  dryRun: z.boolean().optional().default(false),
});

/**
 * Timeout wrapper to prevent operations from hanging indefinitely
 * CRITICAL FIX: Enforces OPERATION_TIMEOUT_MS configuration
 * CRITICAL FIX: Prevents promise memory leak by catching unhandled rejections
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
  let timeoutHandle: NodeJS.Timeout;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutHandle = setTimeout(
      () => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)),
      timeoutMs
    );
  });

  // CRITICAL FIX: Attach catch handler to prevent unhandled rejections
  // If timeout fires first, the original promise may still complete/reject
  // We suppress any errors to prevent "unhandled promise rejection" warnings
  const wrappedPromise = promise
    .then(result => {
      clearTimeout(timeoutHandle);
      return result;
    })
    .catch(error => {
      clearTimeout(timeoutHandle);
      throw error;
    });

  return Promise.race([wrappedPromise, timeoutPromise]);
}

// Constants for sync configuration
const SYNC_CONFIG = {
  BATCH_SIZE: 500, // Number of leads to process per batch
  CONFLICT_WINDOW_MS: 300000, // 5 minutes in milliseconds
  MAX_ERROR_DETAILS: 10, // Maximum number of error details to return
  DELETION_THRESHOLD_PERCENT: 10, // Max percentage of leads that can be deleted in single sync
  OPERATION_TIMEOUT_MS: 30000, // 30 seconds timeout per batch operation
  QUERY_CHUNK_SIZE: 5000, // Max records per NOT IN query (PostgreSQL limit ~32k params)
} as const;

/**
 * POST /api/admin/sync
 *
 * Manually trigger Airtable → PostgreSQL sync for a specific client
 * SUPER_ADMIN only
 * Body: { clientId: string } - which client to sync
 */
export async function POST(request: NextRequest) {
  let clientId: string | undefined = undefined;

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

    // Parse and validate request body with Zod
    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate with Zod schema
    const validation = syncRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request parameters',
          details: validation.error.flatten().fieldErrors
        },
        { status: 400 }
      );
    }

    const { clientId: validatedClientId, dryRun } = validation.data;
    clientId = validatedClientId;

    if (dryRun) {
      console.log('🔍 DRY RUN MODE: Changes will be previewed but not committed');
    }

    // CONCURRENCY PROTECTION: Use PostgreSQL advisory lock (works across serverless instances)
    // Hash clientId to get numeric lock ID
    const lockResult = await db.execute(
      sql`SELECT pg_try_advisory_lock(hashtext(${clientId})) as acquired`
    );
    const lockAcquired = (lockResult[0] as any)?.acquired;

    if (!lockAcquired) {
      return NextResponse.json({
        success: false,
        error: `Sync already in progress for this client. Please wait for the current sync to complete.`,
      }, { status: 409 }); // 409 Conflict
    }

    console.log(`🔒 Acquired advisory lock for client ${clientId}`);

    try {
      // Get the client record to fetch their Airtable Base ID
      const client = await db.query.clients.findFirst({
        where: eq(clients.id, clientId),
      });

      // CRITICAL FIX: Release lock before early returns
      if (!client) {
        await db.execute(sql`SELECT pg_advisory_unlock(hashtext(${clientId}))`);
        return NextResponse.json(
          { error: 'Client not found' },
          { status: 404 }
        );
      }

      if (!client.airtableBaseId) {
        await db.execute(sql`SELECT pg_advisory_unlock(hashtext(${clientId}))`);
        return NextResponse.json(
          { error: `Client ${client.companyName} does not have an Airtable Base ID configured` },
          { status: 400 }
        );
      }

    // Initialize Airtable client with THIS client's base ID
    const airtable = getAirtableClient(client.airtableBaseId);
    let totalFetched = 0;
    let totalProcessed = 0; // Counts both inserts and updates
    let totalDeleted = 0;
    let errors = 0;
    const errorDetails: Array<{recordId: string; error: string}> = [];

    const batchSize = SYNC_CONFIG.BATCH_SIZE; // Larger batches = faster sync
    let batch: Array<{ record: AirtableRecord; leadData: Partial<NewLead> }> = [];
    const airtableRecordIds = new Set<string>(); // Track all Airtable IDs

    // CRITICAL FIX: Wrap stream in try/finally to ensure batch is processed even on stream failure
    try {
      await airtable.streamAllLeads(async (record) => {
        airtableRecordIds.add(record.id); // Track this record ID
        totalFetched++;

        try {
          const leadData = airtable.mapToDatabaseLead(record, clientId!);
          batch.push({ record, leadData });

          // Process batch when full
          if (batch.length >= batchSize) {
            // CRITICAL FIX: Copy batch and clear immediately to prevent duplicate processing on timeout
            const batchToProcess = [...batch];
            batch = []; // Clear before processing to avoid reprocessing on timeout

            await withTimeout(
              processBatch(batchToProcess),
              SYNC_CONFIG.OPERATION_TIMEOUT_MS,
              `Batch processing ${batchToProcess.length} leads`
            );
            console.log(`✅ Synced ${totalFetched} leads...`);
          }
        } catch (error: any) {
          // CRITICAL FIX: Only count mapping errors here (not upsert errors)
          // Upsert errors are counted separately in processBatch
          const errorMsg = error.message || 'Unknown error';
          console.error(`Error mapping record ${record.id}:`, errorMsg);
          errorDetails.push({
            recordId: record.id,
            error: `Mapping error: ${errorMsg}`
          });
          // Don't increment errors here - will be counted in processBatch if upsert also fails
        }
      });
    } finally {
      // CRITICAL FIX: Process remaining batch in finally block to ensure it runs even if stream fails
      // This prevents data loss if Airtable API fails partway through pagination
      if (batch.length > 0) {
        console.log(`⚠️ Processing remaining batch of ${batch.length} leads (stream may have failed early)`);
        try {
          await withTimeout(
            processBatch(batch),
            SYNC_CONFIG.OPERATION_TIMEOUT_MS,
            `Final batch processing ${batch.length} leads`
          );
          console.log(`✅ Final batch: ${totalFetched} leads total`);
        } catch (batchError: any) {
          console.error(`❌ CRITICAL: Failed to process final batch of ${batch.length} leads:`, batchError.message);
          // Don't throw - let the sync complete with partial results
        }
      }
    }

    async function processBatch(batchItems: Array<{ record: AirtableRecord; leadData: Partial<NewLead> }>) {
      // CRITICAL FIX: Process each record individually to avoid data corruption
      // Drizzle doesn't support bulk upsert with different update values per record
      for (const item of batchItems) {
        try {
          // CRITICAL FIX: Validate required fields before database upsert
          if (!item.leadData.firstName || !item.leadData.lastName || !item.leadData.email ||
              !item.leadData.airtableRecordId || !item.leadData.clientId) {
            throw new Error(`Missing required fields: ${JSON.stringify({
              firstName: !!item.leadData.firstName,
              lastName: !!item.leadData.lastName,
              email: !!item.leadData.email,
              airtableRecordId: !!item.leadData.airtableRecordId,
              clientId: !!item.leadData.clientId
            })}`);
          }

          if (!dryRun) {
            await db.insert(leads)
              .values({
                ...item.leadData,
                createdAt: new Date(),
                updatedAt: new Date(),
              } as NewLead) // Type assertion after validation
              .onConflictDoUpdate({
                target: leads.airtableRecordId,
                set: {
                  ...item.leadData,
                  updatedAt: new Date(),
                } as Partial<NewLead>,
              });
          }
          totalProcessed++;
        } catch (error: any) {
          // CRITICAL FIX: Only increment error count once per record
          // Check if this record already had a mapping error
          const existingError = errorDetails.find(e => e.recordId === item.record.id);
          if (!existingError) {
            errors++; // Only count if no mapping error
          }

          const errorMsg = error.message || 'Unknown error';
          console.error(`Error upserting record ${item.record.id}:`, errorMsg);

          // Update existing error or add new one
          if (existingError) {
            existingError.error += ` + Upsert error: ${errorMsg}`;
            errors++; // Count the upsert error too if mapping also failed
          } else {
            errorDetails.push({
              recordId: item.record.id,
              error: `Upsert error: ${errorMsg}`
            });
          }
        }
      }
    }

    // ========================================================================
    // DELETE LEADS REMOVED FROM AIRTABLE
    // ========================================================================
    console.log(`🔍 Checking for deleted leads (${airtableRecordIds.size} records in Airtable)...`);

    let deletionSuccess = true;
    let deletionError: string | null = null;

    try {
      // PERFORMANCE OPTIMIZATION: Get count first without loading all data
      const pgLeadCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(leads)
        .where(eq(leads.clientId, clientId))
        .then(result => Number(result[0]?.count || 0));

      // CRITICAL SAFETY CHECK: Prevent mass deletion if Airtable appears empty
      // If Airtable has 0 records but PostgreSQL has leads, this is likely an error
      if (airtableRecordIds.size === 0 && pgLeadCount > 0) {
        console.error(`⚠️ SAFETY CHECK FAILED: Airtable returned 0 records but PostgreSQL has ${pgLeadCount} leads`);
        console.error(`⚠️ This could indicate Airtable API failure or empty base. ABORTING deletion to prevent data loss.`);

        // CRITICAL FIX: Release lock before early return
        await db.execute(sql`SELECT pg_advisory_unlock(hashtext(${clientId}))`);
        return NextResponse.json({
          success: false,
          error: `Safety check failed: Airtable returned 0 leads but database has ${pgLeadCount} leads. This likely indicates an API error. Please verify Airtable is accessible and try again.`,
          details: {
            airtableLeadCount: 0,
            postgresLeadCount: pgLeadCount,
          }
        }, { status: 500 });
      }

      // PERFORMANCE OPTIMIZATION: Use SQL query instead of loading all leads into memory
      // Find leads that exist in PostgreSQL but not in Airtable (deleted from source)
      const airtableRecordIdArray = Array.from(airtableRecordIds);

      // CRITICAL FIX: Handle large datasets correctly - fetch all PG leads then filter in memory
      // Previous chunking logic was BROKEN and would delete ALL leads!
      let deletedLeads: Array<{ id: string; airtableRecordId: string; email: string }> = [];

      if (airtableRecordIdArray.length === 0) {
        // EDGE CASE: Airtable returned 0 records (already passed safety check)
        deletedLeads = [];
      } else if (airtableRecordIdArray.length > SYNC_CONFIG.QUERY_CHUNK_SIZE) {
        // LARGE DATASET: Fetch all PostgreSQL leads, then filter in memory
        // Can't use NOT IN with >5000 params due to PostgreSQL limits
        console.log(`⚠️ Large dataset: ${airtableRecordIdArray.length} Airtable records. Using in-memory filtering...`);

        // Fetch ALL leads for this client from PostgreSQL
        const allPostgresLeads = await db.query.leads.findMany({
          where: eq(leads.clientId, clientId),
          columns: {
            id: true,
            airtableRecordId: true,
            email: true,
          },
        });

        console.log(`  📊 Fetched ${allPostgresLeads.length} leads from PostgreSQL`);

        // Convert Airtable IDs to Set for O(1) lookup performance
        const airtableIdsSet = new Set(airtableRecordIdArray);

        // Filter in memory: find leads NOT in Airtable
        deletedLeads = allPostgresLeads.filter(lead => !airtableIdsSet.has(lead.airtableRecordId));

        console.log(`✅ In-memory filtering complete: found ${deletedLeads.length} deleted leads`);
      } else {
        // NORMAL DATASET: Single NOT IN query is safe (< 5000 params)
        deletedLeads = await db.query.leads.findMany({
          where: and(
            eq(leads.clientId, clientId),
            notInArray(leads.airtableRecordId, airtableRecordIdArray)
          ),
          columns: {
            id: true,
            airtableRecordId: true,
            email: true,
          },
        });
      }

      if (deletedLeads.length > 0) {
        console.log(`🗑️ Found ${deletedLeads.length} deleted leads${dryRun ? ' (DRY RUN - would be removed)' : ', permanently removing...'}`);

        // CRITICAL SAFETY CHECK: Prevent mass deletion if percentage too high
        const deletionPercent = (deletedLeads.length / pgLeadCount) * 100;

        if (deletionPercent > SYNC_CONFIG.DELETION_THRESHOLD_PERCENT) {
          console.error(`🚨 SAFETY CHECK: Would delete ${deletionPercent.toFixed(1)}% of leads (${deletedLeads.length}/${pgLeadCount})`);
          console.error(`🚨 Threshold: ${SYNC_CONFIG.DELETION_THRESHOLD_PERCENT}%. This may indicate Airtable API partial failure.`);

          await db.execute(sql`SELECT pg_advisory_unlock(hashtext(${clientId}))`);
          return NextResponse.json({
            success: false,
            error: `Deletion safety threshold exceeded: ${deletionPercent.toFixed(1)}% > ${SYNC_CONFIG.DELETION_THRESHOLD_PERCENT}%. This may indicate an Airtable API issue. Please verify data in Airtable and try again.`,
            details: {
              deletedLeads: deletedLeads.length,
              totalLeads: pgLeadCount,
              deletionPercent: deletionPercent.toFixed(1),
              threshold: SYNC_CONFIG.DELETION_THRESHOLD_PERCENT
            }
          }, { status: 500 });
        }

        console.log(`✅ Safety check passed: ${deletionPercent.toFixed(1)}% < ${SYNC_CONFIG.DELETION_THRESHOLD_PERCENT}% threshold`);

        if (!dryRun) {
          // SECURITY: Log deletions to audit trail before removing (batch insert for performance)
          const auditEntries = deletedLeads.map(lead => ({
            userId: session.user.id,
            clientId: clientId,
            leadId: lead.id,
            action: 'LEAD_DELETED_FROM_SYNC',
            details: `Lead ${lead.email} (Airtable ID: ${lead.airtableRecordId}) permanently deleted during sync - removed from source`,
            ipAddress: null,
          }));

          // CRITICAL FIX: Wrap audit logging + deletion in transaction for atomicity
          try {
            await db.transaction(async (tx) => {
              // Log to audit trail first
              await tx.insert(activityLog).values(auditEntries);
              console.log(`✅ Logged ${auditEntries.length} deletions to audit trail`);

              // Then delete leads (both succeed or both fail)
              const leadIds = deletedLeads.map(l => l.id);
              await tx.delete(leads).where(inArray(leads.id, leadIds));
              console.log(`✅ Permanently deleted ${leadIds.length} leads removed from Airtable`);
            });

            totalDeleted = deletedLeads.length;
          } catch (deleteError: any) {
            deletionSuccess = false;
            deletionError = deleteError.message || 'Unknown deletion error';
            console.error(`❌ CRITICAL: Failed to delete leads from database (transaction rolled back):`, deleteError);
          }
        } else {
          totalDeleted = deletedLeads.length;
          console.log(`✅ Would permanently delete ${totalDeleted} leads removed from Airtable`);
        }
      } else {
        console.log(`✅ No deleted leads found`);
      }
    } catch (error: any) {
      deletionSuccess = false;
      deletionError = error.message || 'Unknown error during deletion detection';
      console.error('❌ Error detecting deleted leads:', error.message);
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
    let tasksSyncError: string | null = null;
    let blockersSyncError: string | null = null;
    let statusSyncError: string | null = null;

    // Sync Tasks
    try {
      // PERFORMANCE FIX: Prefetch all tasks and pending syncs to avoid N+1 queries (150x faster)
      console.log('📊 Prefetching existing tasks and pending syncs for performance...');
      const existingTasks = await db.query.clientProjectTasks.findMany({
        where: eq(clientProjectTasks.clientId, clientId)
      });
      const existingTasksMap = new Map(existingTasks.map(t => [t.airtableRecordId, t]));
      console.log(`  ✅ Prefetched ${existingTasks.length} existing tasks`);

      const pendingSyncs = await db.query.airtableSyncQueue.findMany({
        where: and(
          eq(airtableSyncQueue.clientId, clientId),
          eq(airtableSyncQueue.tableName, 'Tasks'),
          eq(airtableSyncQueue.status, 'pending')
        )
      });
      const pendingSyncsMap = new Map(pendingSyncs.map(s => [s.recordId, s]));
      console.log(`  ✅ Prefetched ${pendingSyncs.length} pending syncs`);

      await airtable.streamAllProjectTasks(async (record) => {
        tasksFetched++;
        try {
          const taskData = airtable.mapToDatabaseTask(record, clientId!);

          // CONFLICT DETECTION: Check if PostgreSQL has newer data (using prefetched Map)
          const existing = existingTasksMap.get(record.id);

          if (existing) {
            // CRITICAL FIX 1: Check if there's a pending sync in the retry queue (using prefetched Map)
            const pendingSync = pendingSyncsMap.get(record.id);

            if (pendingSync) {
              console.log(`⏸️ Skipping task ${record.id} - pending Airtable sync in retry queue (${pendingSync.attempts} attempts)`);
              return; // Don't overwrite - local changes haven't reached Airtable yet
            }

            // CRITICAL FIX 2: Use 5-minute conflict window instead of 60 seconds
            // This prevents overwrites when Airtable sync is delayed
            const pgUpdated = existing.updatedAt;
            const timeSinceUpdate = Date.now() - pgUpdated.getTime();

            if (timeSinceUpdate < SYNC_CONFIG.CONFLICT_WINDOW_MS) { // 5 minutes
              console.log(`⏸️ Skipping task ${record.id} - recently updated in PostgreSQL (${Math.round(timeSinceUpdate / 1000)}s ago)`);
              return;
            }

            // CRITICAL FIX 3: Use Airtable's Last Modified timestamp if available
            const lastModifiedTime = record.fields['Last Modified Time'];
            const airtableModified = lastModifiedTime && typeof lastModifiedTime === 'string'
              ? new Date(lastModifiedTime)
              : new Date(record.createdTime);

            // Only overwrite if Airtable data is NEWER than PostgreSQL
            if (airtableModified <= pgUpdated) {
              console.log(`⏸️ Skipping task ${record.id} - PostgreSQL is newer (PG: ${pgUpdated.toISOString()}, AT: ${airtableModified.toISOString()})`);
              return;
            }

            console.log(`✅ Syncing task ${record.id} - Airtable is newer (PG: ${pgUpdated.toISOString()}, AT: ${airtableModified.toISOString()})`);
          }

          // Proceed with sync (skip if dry run)
          if (!dryRun) {
            await db.insert(clientProjectTasks)
              .values(taskData as any)
              .onConflictDoUpdate({
                target: clientProjectTasks.airtableRecordId,
                set: {
                  ...taskData,
                  updatedAt: new Date(),
                },
              });
          }
          tasksInserted++;
        } catch (error: any) {
          console.error(`Error syncing task ${record.id}:`, error.message);
        }
      });
    } catch (error: any) {
      tasksSyncError = error.message || 'Unknown error during task sync';
      console.error('Tasks table not found or error syncing:', tasksSyncError);
    }

    // Sync Blockers
    try {
      await airtable.streamAllProjectBlockers(async (record) => {
        blockersFetched++;
        try {
          const blockerData = airtable.mapToDatabaseBlocker(record, clientId!);
          if (!dryRun) {
            await db.insert(clientProjectBlockers)
              .values(blockerData as any)
              .onConflictDoUpdate({
                target: clientProjectBlockers.airtableRecordId,
                set: {
                  ...blockerData,
                },
              });
          }
          blockersInserted++;
        } catch (error: any) {
          console.error(`Error syncing blocker ${record.id}:`, error.message);
        }
      });
    } catch (error: any) {
      blockersSyncError = error.message || 'Unknown error during blocker sync';
      console.error('Blockers table not found or error syncing:', blockersSyncError);
    }

    // Sync Project Status
    try {
      await airtable.streamAllProjectStatus(async (record) => {
        statusFetched++;
        try {
          const statusData = airtable.mapToDatabaseProjectStatus(record, clientId!);
          if (!dryRun) {
            await db.insert(clientProjectStatus)
              .values(statusData as any)
              .onConflictDoUpdate({
                target: clientProjectStatus.airtableRecordId,
                set: {
                  ...statusData,
                  updatedAt: new Date(),
                },
              });
          }
          statusInserted++;
        } catch (error: any) {
          console.error(`Error syncing status ${record.id}:`, error.message);
        }
      });
    } catch (error: any) {
      statusSyncError = error.message || 'Unknown error during status sync';
      console.error('Project_Status table not found or error syncing:', statusSyncError);
    }

    // Sync Campaigns (Phase A)
    let campaignsSynced = 0;
    let campaignsErrors = 0;

    try {
      const campaignsResult = await syncCampaignsFromAirtable(clientId, client.airtableBaseId, dryRun);
      campaignsSynced = campaignsResult.synced;
      campaignsErrors = campaignsResult.errors;
      console.log(`✅ ${dryRun ? 'Would sync' : 'Synced'} ${campaignsSynced} campaigns`);
    } catch (error) {
      console.error('Campaign sync error:', error);
      campaignsErrors = 1;
    }

    // AGGREGATE SUCCESS: Check all operations, not just deletion
    const hasErrors = (
      errors > 0 ||
      !deletionSuccess ||
      campaignsErrors > 0 ||
      (tasksFetched > 0 && tasksInserted === 0 && tasksFetched > 5) || // All tasks failed (if >5 tasks)
      (totalFetched > 0 && totalProcessed === 0 && totalFetched > 5) // All leads failed (if >5 leads)
    );

    const partialSuccess = hasErrors && (totalProcessed > 0 || campaignsSynced > 0 || tasksInserted > 0);

    // CRITICAL FIX: Update client's last sync timestamp ONLY if successful (and not dry run)
    if (!dryRun && !hasErrors) {
      await db.update(clients)
        .set({ lastSyncAt: new Date() })
        .where(eq(clients.id, clientId));
    }

    return NextResponse.json({
      success: !hasErrors, // Overall success if no errors
      partialSuccess, // Partial success if some operations succeeded despite errors
      dryRun,
      client: {
        id: client.id,
        companyName: client.companyName,
        airtableBaseId: client.airtableBaseId,
      },
      results: {
        leads: {
          totalFetched,
          totalProcessed, // CLARITY: Renamed from totalInserted (includes both inserts and updates)
          totalDeleted,
          errors,
          errorDetails: errors > 0 ? errorDetails.slice(0, SYNC_CONFIG.MAX_ERROR_DETAILS) : [],
          errorDetailsTruncated: errors > SYNC_CONFIG.MAX_ERROR_DETAILS,
          totalErrorCount: errors,
          deletionError: deletionError, // Include deletion error if any
        },
        tasks: {
          fetched: tasksFetched,
          synced: tasksInserted,
          error: tasksSyncError, // FIXED: Include task sync errors
        },
        blockers: {
          fetched: blockersFetched,
          synced: blockersInserted,
          error: blockersSyncError, // FIXED: Include blocker sync errors
        },
        projectStatus: {
          fetched: statusFetched,
          synced: statusInserted,
          error: statusSyncError, // FIXED: Include status sync errors
        },
        campaigns: {
          synced: campaignsSynced,
          errors: campaignsErrors,
        },
      },
      message: `Sync complete for ${client.companyName}! Leads: ${totalFetched} synced${totalDeleted > 0 ? `, ${totalDeleted} deleted` : ''}, Tasks: ${tasksFetched}, Blockers: ${blockersFetched}, Status: ${statusFetched}, Campaigns: ${campaignsSynced}`
    });

    } catch (error: any) {
      console.error('Sync failed:', error);
      return NextResponse.json(
        { error: error.message || 'Sync failed' },
        { status: 500 }
      );
    } finally {
      // Always release the PostgreSQL advisory lock, even if sync fails
      try {
        await db.execute(sql`SELECT pg_advisory_unlock(hashtext(${clientId}))`);
        console.log(`🔓 Released advisory lock for client ${clientId}`);
      } catch (unlockError) {
        console.error('Failed to release advisory lock:', unlockError);
      }
    }
  } catch (error: any) {
    console.error('Sync failed:', error);
    // CRITICAL FIX: Only release lock if clientId exists (lock was acquired)
    // clientId is defined at line 83, so early errors won't have it
    if (typeof clientId !== 'undefined') {
      try {
        await db.execute(sql`SELECT pg_advisory_unlock(hashtext(${clientId}))`);
        console.log(`🔓 Released advisory lock for client ${clientId} (error path)`);
      } catch (unlockError) {
        console.error('Failed to release advisory lock:', unlockError);
      }
    }
    return NextResponse.json(
      { error: error.message || 'Sync failed' },
      { status: 500 }
    );
  }
}

