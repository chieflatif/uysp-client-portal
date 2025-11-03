import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { clientProjectTasks, clientProjectBlockers, clientProjectStatus } from '../src/lib/db/schema';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testSync() {
  const DATABASE_URL = process.env.DATABASE_URL;
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = 'app4wIsBfpJTg7pWS'; // Main UYSP base
  const CLIENT_ID = '6a08f898-19cd-49f8-bd77-6fcb2dd56db9'; // UYSP client ID
  
  if (!DATABASE_URL || !AIRTABLE_API_KEY) {
    console.error('Missing environment variables');
    process.exit(1);
  }

  console.log('🔗 Connecting to database...');
  const connection = postgres(DATABASE_URL, { ssl: 'require' });
  const db = drizzle(connection, { schema: { clientProjectTasks, clientProjectBlockers, clientProjectStatus } });

  try {
    // ========================================================================
    // SYNC TASKS
    // ========================================================================
    console.log('\n📋 Fetching Tasks from Airtable...');
    
    let offset: string | undefined;
    let taskCount = 0;
    const allTasks: any[] = [];

    while (true) {
      const params = new URLSearchParams({ pageSize: '100' });
      if (offset) params.append('offset', offset);

      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Tasks?${params}`,
        {
          headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Airtable API error: ${response.status} - ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      allTasks.push(...data.records);
      taskCount += data.records.length;
      
      console.log(`  ✓ Fetched ${taskCount} tasks so far...`);
      
      if (!data.offset) break;
      offset = data.offset;
    }

    console.log(`\n📊 Total Tasks Found: ${allTasks.length}`);
    
    // Insert tasks
    console.log('💾 Inserting tasks into PostgreSQL...');
    let inserted = 0;
    
    for (const record of allTasks) {
      try {
        const fields = record.fields;
        const taskData = {
          id: record.id,
          clientId: CLIENT_ID,
          airtableRecordId: record.id,
          task: (fields['Task'] as string) || '',
          status: (fields['Status'] as string) || 'Not Started',
          priority: (fields['Priority'] as string) || '🟡 Medium',
          owner: fields['Owner'] as string | undefined,
          dueDate: fields['Due Date'] ? new Date(fields['Due Date'] as string) : undefined,
          notes: fields['Notes'] as string | undefined,
          dependencies: fields['Dependencies'] as string | undefined,
          createdAt: new Date(record.createdTime),
          updatedAt: new Date(),
        };

        await db.insert(clientProjectTasks)
          .values(taskData)
          .onConflictDoUpdate({
            target: clientProjectTasks.airtableRecordId,
            set: {
              ...taskData,
              updatedAt: new Date(),
            },
          });
        
        inserted++;
        console.log(`  ✓ Synced task ${inserted}/${allTasks.length}: ${taskData.task.substring(0, 50)}...`);
      } catch (error: any) {
        console.error(`  ✗ Error syncing task ${record.id}:`, error.message);
      }
    }

    console.log(`\n✅ Tasks: ${inserted}/${allTasks.length} synced successfully`);

    // ========================================================================
    // SYNC BLOCKERS
    // ========================================================================
    console.log('\n🚫 Fetching Blockers from Airtable...');
    
    offset = undefined;
    let blockerCount = 0;
    const allBlockers: any[] = [];

    while (true) {
      const params = new URLSearchParams({ pageSize: '100' });
      if (offset) params.append('offset', offset);

      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Blockers?${params}`,
        {
          headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Airtable API error: ${response.status} - ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      allBlockers.push(...data.records);
      blockerCount += data.records.length;
      
      console.log(`  ✓ Fetched ${blockerCount} blockers so far...`);
      
      if (!data.offset) break;
      offset = data.offset;
    }

    console.log(`\n📊 Total Blockers Found: ${allBlockers.length}`);
    
    // Insert blockers
    console.log('💾 Inserting blockers into PostgreSQL...');
    let blockersInserted = 0;
    
    for (const record of allBlockers) {
      try {
        const fields = record.fields;
        const blockerData = {
          id: record.id,
          clientId: CLIENT_ID,
          airtableRecordId: record.id,
          blocker: (fields['Blocker'] as string) || '',
          severity: (fields['Severity'] as string) || '🟡 Medium',
          actionToResolve: fields['Action to Resolve'] as string | undefined,
          status: (fields['Status'] as string) || 'Active',
          createdAt: new Date(record.createdTime),
          resolvedAt: fields['Resolved At'] ? new Date(fields['Resolved At'] as string) : undefined,
        };

        await db.insert(clientProjectBlockers)
          .values(blockerData)
          .onConflictDoUpdate({
            target: clientProjectBlockers.airtableRecordId,
            set: blockerData,
          });
        
        blockersInserted++;
        console.log(`  ✓ Synced blocker ${blockersInserted}/${allBlockers.length}: ${blockerData.blocker.substring(0, 50)}...`);
      } catch (error: any) {
        console.error(`  ✗ Error syncing blocker ${record.id}:`, error.message);
      }
    }

    console.log(`\n✅ Blockers: ${blockersInserted}/${allBlockers.length} synced successfully`);

    // ========================================================================
    // SYNC PROJECT STATUS
    // ========================================================================
    console.log('\n📈 Fetching Project Status from Airtable...');
    
    offset = undefined;
    let statusCount = 0;
    const allStatus: any[] = [];

    while (true) {
      const params = new URLSearchParams({ pageSize: '100' });
      if (offset) params.append('offset', offset);

      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Project_Status?${params}`,
        {
          headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Airtable API error: ${response.status} - ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      allStatus.push(...data.records);
      statusCount += data.records.length;
      
      console.log(`  ✓ Fetched ${statusCount} status records so far...`);
      
      if (!data.offset) break;
      offset = data.offset;
    }

    console.log(`\n📊 Total Status Records Found: ${allStatus.length}`);
    
    // Insert status
    console.log('💾 Inserting project status into PostgreSQL...');
    let statusInserted = 0;
    
    for (const record of allStatus) {
      try {
        const fields = record.fields;
        const statusData = {
          id: record.id,
          clientId: CLIENT_ID,
          airtableRecordId: record.id,
          metric: (fields['Metric'] as string) || '',
          value: (fields['Value'] as string) || '',
          category: (fields['Category'] as string) || 'General',
          displayOrder: Number(fields['Display Order']) || 0,
          updatedAt: new Date(),
        };

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
        console.log(`  ✓ Synced status ${statusInserted}/${allStatus.length}: ${statusData.metric}`);
      } catch (error: any) {
        console.error(`  ✗ Error syncing status ${record.id}:`, error.message);
      }
    }

    console.log(`\n✅ Project Status: ${statusInserted}/${allStatus.length} synced successfully`);

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SYNC COMPLETE!');
    console.log('='.repeat(60));
    console.log(`Tasks:          ${inserted}/${allTasks.length} synced`);
    console.log(`Blockers:       ${blockersInserted}/${allBlockers.length} synced`);
    console.log(`Project Status: ${statusInserted}/${allStatus.length} synced`);
    console.log('='.repeat(60));

  } catch (error: any) {
    console.error('\n❌ Sync failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

testSync();

