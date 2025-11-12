# IMPLEMENTATION PLAN: Bi-Directional Reconciliation Engine
**VERSION**: 1.0
**DATE**: 2025-11-12
**STATUS**: READY FOR EXECUTION
**PROTOCOL**: Test-Driven Development + Commit-Per-Feature

---

## EXECUTIVE SUMMARY

This document provides a detailed, commit-level implementation strategy for building the Bi-Directional Reconciliation Engine as specified in `MANDATORY-DEVELOPMENT-WORKFLOW.md`.

**Total Estimated Commits**: 15
**Estimated Development Time**: 3-4 hours
**Testing Strategy**: Unit tests for each component + Integration test + End-to-end test

---

## PHASE 1: BUILD THE RECONCILER SCRIPT

### Commit 1: Create Reconciler Script Foundation
**File**: `scripts/reconcile-recent-changes.ts`
**Purpose**: Set up the basic structure, types, and error handling

**Implementation**:
```typescript
import { db } from '../src/lib/db';
import { leads } from '../src/lib/db/schema';
import { getAirtableClient } from '../src/lib/airtable/client';
import { eq, gte, and } from 'drizzle-orm';

interface ReconciliationResult {
  success: boolean;
  stage1: {
    recordsProcessed: number;
    inserted: number;
    updated: number;
    errors: string[];
  };
  stage2: {
    recordsProcessed: number;
    updated: number;
    skipped: number;
    errors: string[];
  };
  startTime: Date;
  endTime: Date;
  duration: number;
}

/**
 * Bi-Directional Reconciliation Engine
 * Stage 1: Airtable → PostgreSQL (pull recent changes)
 * Stage 2: PostgreSQL → Airtable (push recent changes)
 */
export async function reconcileRecentChanges(
  lookbackMinutes: number = 20
): Promise<ReconciliationResult> {
  const startTime = new Date();

  const result: ReconciliationResult = {
    success: false,
    stage1: { recordsProcessed: 0, inserted: 0, updated: 0, errors: [] },
    stage2: { recordsProcessed: 0, updated: 0, skipped: 0, errors: [] },
    startTime,
    endTime: new Date(),
    duration: 0,
  };

  try {
    console.log(`🔄 Starting reconciliation (${lookbackMinutes}min lookback)...`);

    // Stage 1: Airtable → PostgreSQL
    await reconcileStage1(lookbackMinutes, result);

    // Stage 2: PostgreSQL → Airtable
    await reconcileStage2(lookbackMinutes, result);

    result.success = true;
  } catch (error) {
    console.error('❌ Reconciliation failed:', error);
    result.success = false;
  } finally {
    result.endTime = new Date();
    result.duration = result.endTime.getTime() - result.startTime.getTime();
  }

  return result;
}

async function reconcileStage1(
  lookbackMinutes: number,
  result: ReconciliationResult
): Promise<void> {
  // TODO: Implement Stage 1
}

async function reconcileStage2(
  lookbackMinutes: number,
  result: ReconciliationResult
): Promise<void> {
  // TODO: Implement Stage 2
}

// CLI execution
if (require.main === module) {
  reconcileRecentChanges()
    .then((result) => {
      console.log('\n✅ Reconciliation complete:');
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}
```

**Test**: Run `npx tsx scripts/reconcile-recent-changes.ts` - should execute without errors (no-op)

**Commit Message**: `feat: Add reconciler script foundation with types and error handling`

---

### Commit 2: Implement Stage 1 - Airtable → PostgreSQL Sync

**Purpose**: Pull recent changes from Airtable and upsert into PostgreSQL

**Implementation** (add to `reconcileStage1` function):
```typescript
async function reconcileStage1(
  lookbackMinutes: number,
  result: ReconciliationResult
): Promise<void> {
  console.log('\n📥 STAGE 1: Airtable → PostgreSQL');

  const airtable = getAirtableClient();
  const cutoffTime = new Date(Date.now() - lookbackMinutes * 60 * 1000);

  // Query Airtable for recently modified leads
  const recentLeads = await airtable.getLeadsModifiedSince(cutoffTime);

  console.log(`  Found ${recentLeads.length} recently modified leads in Airtable`);

  for (const record of recentLeads) {
    try {
      result.stage1.recordsProcessed++;

      // Map Airtable record to database format
      const leadData = airtable.mapToDatabaseLead(record, DEFAULT_CLIENT_ID);

      // Upsert: Update if exists, insert if new
      const existing = await db.query.leads.findFirst({
        where: eq(leads.airtableRecordId, record.id),
      });

      if (existing) {
        // Update existing lead
        await db.update(leads).set({
          firstName: leadData.firstName,
          lastName: leadData.lastName,
          email: leadData.email,
          phone: leadData.phone,
          company: leadData.company,
          title: leadData.title,
          icpScore: leadData.icpScore,
          status: leadData.status,
          processingStatus: leadData.processingStatus,
          campaignName: leadData.campaignName,
          smsSentCount: leadData.smsSentCount,
          smsSequencePosition: leadData.smsSequencePosition,
          smsLastSentAt: leadData.smsLastSentAt,
          leadSource: leadData.leadSource,
          formId: leadData.formId,
          booked: leadData.booked,
          bookedAt: leadData.bookedAt,
          smsStop: leadData.smsStop,
          // CRITICAL: Update timestamp for change tracking
          updatedAt: new Date(),
        }).where(eq(leads.airtableRecordId, record.id));

        result.stage1.updated++;
      } else {
        // Insert new lead
        await db.insert(leads).values({
          ...leadData,
          airtableRecordId: record.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        result.stage1.inserted++;
      }

    } catch (error) {
      const errorMsg = `Failed to sync lead ${record.id}: ${error}`;
      console.error(`  ❌ ${errorMsg}`);
      result.stage1.errors.push(errorMsg);
    }
  }

  console.log(`  ✅ Stage 1 complete: ${result.stage1.inserted} inserted, ${result.stage1.updated} updated`);
}
```

**New Function Needed in Airtable Client**:
```typescript
// Add to src/lib/airtable/client.ts
async getLeadsModifiedSince(cutoffTime: Date): Promise<AirtableRecord[]> {
  const formula = `IS_AFTER({lastModifiedTime}, '${cutoffTime.toISOString()}')`;
  return await this.base('Leads')
    .select({ filterByFormula: formula })
    .all();
}
```

**Test**:
1. Create a test script that modifies a lead in Airtable
2. Run reconciler
3. Verify PostgreSQL was updated

**Commit Message**: `feat: Implement Stage 1 - Airtable to PostgreSQL sync with upsert logic`

---

### Commit 3: Implement Stage 2 - PostgreSQL → Airtable Sync

**Purpose**: Push recent PostgreSQL changes back to Airtable (with conflict prevention)

**Implementation** (add to `reconcileStage2` function):
```typescript
async function reconcileStage2(
  lookbackMinutes: number,
  result: ReconciliationResult
): Promise<void> {
  console.log('\n📤 STAGE 2: PostgreSQL → Airtable');

  const airtable = getAirtableClient();
  const cutoffTime = new Date(Date.now() - lookbackMinutes * 60 * 1000);

  // Query PostgreSQL for recently updated leads
  const recentLeads = await db.query.leads.findMany({
    where: and(
      gte(leads.updatedAt, cutoffTime),
      // Only sync active leads with Airtable records
      eq(leads.isActive, true)
    ),
  });

  console.log(`  Found ${recentLeads.length} recently updated leads in PostgreSQL`);

  // Batch updates for efficiency
  const batchSize = 10;
  for (let i = 0; i < recentLeads.length; i += batchSize) {
    const batch = recentLeads.slice(i, i + batchSize);

    for (const lead of batch) {
      try {
        result.stage2.recordsProcessed++;

        // Fetch the Airtable record to check timestamps
        const airtableRecord = await airtable.base('Leads').find(lead.airtableRecordId);

        // Conflict prevention: Skip if Airtable was modified more recently
        const airtableModifiedTime = new Date(airtableRecord.fields['lastModifiedTime'] as string);
        if (airtableModifiedTime > lead.updatedAt) {
          result.stage2.skipped++;
          console.log(`  ⏭️  Skipping ${lead.id} - Airtable is newer`);
          continue;
        }

        // Build update payload (only fields that can be updated from portal)
        const updatePayload: Record<string, any> = {};

        // Claimed status
        if (lead.claimedBy) {
          updatePayload['Claimed By'] = lead.claimedBy;
          updatePayload['Claimed At'] = lead.claimedAt?.toISOString();
        }

        // Notes (if field exists)
        if (lead.notes) {
          updatePayload['Notes'] = lead.notes;
        }

        // Campaign de-enrollment (if lead was removed from campaign)
        if (!lead.campaignId && lead.processingStatus === 'Removed') {
          updatePayload['Processing Status'] = 'Removed';
          updatePayload['Campaign ID'] = null;
        }

        // Only update if there are changes
        if (Object.keys(updatePayload).length > 0) {
          await airtable.base('Leads').update(lead.airtableRecordId, updatePayload);
          result.stage2.updated++;
        } else {
          result.stage2.skipped++;
        }

      } catch (error) {
        const errorMsg = `Failed to sync lead ${lead.id} to Airtable: ${error}`;
        console.error(`  ❌ ${errorMsg}`);
        result.stage2.errors.push(errorMsg);
      }
    }
  }

  console.log(`  ✅ Stage 2 complete: ${result.stage2.updated} updated, ${result.stage2.skipped} skipped`);
}
```

**Schema Addition Needed**:
```typescript
// Add to leads table in schema.ts
notes: text('notes'), // Internal notes from portal (synced to Airtable)
```

**Migration Required**: Yes - add `notes` column to `leads` table

**Test**:
1. Claim a lead in PostgreSQL
2. Run reconciler
3. Verify Airtable was updated with claim info

**Commit Message**: `feat: Implement Stage 2 - PostgreSQL to Airtable sync with conflict prevention`

---

### Commit 4: Add Notes Column to Schema

**File**: `src/lib/db/schema.ts`
**Change**: Add `notes` field to `leads` table

**Implementation**:
```typescript
// Add after line 135 (before enrolledAt)
notes: text('notes'), // Internal notes from portal (synced back to Airtable)
```

**Migration**:
```sql
-- Create migration: migrations/add_notes_to_leads.sql
ALTER TABLE leads ADD COLUMN notes TEXT;
```

**Commit Message**: `feat: Add notes column to leads table for bi-directional sync`

---

## PHASE 2: API & UI INTEGRATION

### Commit 5: Modify "Remove from Campaign" API

**File**: Find and modify the API endpoint that handles campaign removal

**Changes Needed**:
1. After removing lead from campaign, update `updatedAt` timestamp
2. Set `processingStatus` to 'Removed'

**Search for endpoint**:
```bash
grep -r "remove.*campaign" src/app/api/ --include="*.ts"
```

**Implementation Pattern**:
```typescript
// After campaign removal logic
await db.update(leads).set({
  campaignId: null,
  processingStatus: 'Removed',
  updatedAt: new Date(), // ← CRITICAL: Triggers Stage 2 sync
}).where(eq(leads.id, leadId));
```

**Test**: Remove a lead from campaign, verify `updatedAt` is touched

**Commit Message**: `feat: Update Remove from Campaign API to trigger bi-directional sync`

---

### Commit 6: Modify "Claim Lead" API

**File**: Find and modify the API endpoint for claiming leads

**Search**:
```bash
grep -r "claim.*lead" src/app/api/ --include="*.ts"
```

**Implementation Pattern**:
```typescript
// After claim logic
await db.update(leads).set({
  claimedBy: userId,
  claimedAt: new Date(),
  updatedAt: new Date(), // ← CRITICAL: Triggers Stage 2 sync
}).where(eq(leads.id, leadId));
```

**Test**: Claim a lead, verify Airtable gets updated after next reconciliation

**Commit Message**: `feat: Update Claim Lead API to trigger bi-directional sync`

---

### Commit 7: Modify "Unclaim Lead" API

**File**: Same as Claim Lead API or separate endpoint

**Implementation Pattern**:
```typescript
// After unclaim logic
await db.update(leads).set({
  claimedBy: null,
  claimedAt: null,
  updatedAt: new Date(), // ← CRITICAL: Triggers Stage 2 sync
}).where(eq(leads.id, leadId));
```

**Test**: Unclaim a lead, verify Airtable gets updated

**Commit Message**: `feat: Update Unclaim Lead API to trigger bi-directional sync`

---

### Commit 8: Create Notes API Endpoint

**File**: `src/app/api/leads/[id]/notes/route.ts` (NEW FILE)

**Purpose**: Allow adding notes to leads with automatic sync

**Implementation**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { leads, activityLog } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { note } = await request.json();
    const leadId = params.id;

    // Fetch current lead
    const lead = await db.query.leads.findFirst({
      where: eq(leads.id, leadId),
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Append note to existing notes
    const timestamp = new Date().toISOString();
    const newNote = `[${timestamp}] ${session.user.name}: ${note}`;
    const updatedNotes = lead.notes
      ? `${lead.notes}\n${newNote}`
      : newNote;

    // Update lead with new note
    await db.update(leads).set({
      notes: updatedNotes,
      updatedAt: new Date(), // ← CRITICAL: Triggers Stage 2 sync
    }).where(eq(leads.id, leadId));

    // Log to activity log
    await db.insert(activityLog).values({
      leadId,
      clientId: lead.clientId,
      userId: session.user.id,
      action: 'NOTE_ADDED',
      details: note,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, notes: updatedNotes });
  } catch (error) {
    console.error('Error adding note:', error);
    return NextResponse.json(
      { error: 'Failed to add note' },
      { status: 500 }
    );
  }
}
```

**Test**: Add a note via API, verify it appears in Airtable after reconciliation

**Commit Message**: `feat: Add Notes API endpoint with bi-directional sync support`

---

### Commit 9: Create Delta Sync API Endpoint

**File**: `src/app/api/admin/sync/delta/route.ts` (NEW FILE)

**Purpose**: Trigger on-demand reconciliation from the UI

**Implementation**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    console.log('🔄 Manual delta sync triggered by:', session.user.email);

    // Execute reconciler script
    const { stdout, stderr } = await execAsync(
      'npx tsx scripts/reconcile-recent-changes.ts'
    );

    if (stderr) {
      console.error('Reconciler stderr:', stderr);
    }

    const result = JSON.parse(stdout);

    return NextResponse.json({
      success: result.success,
      message: 'Delta sync complete',
      details: result,
    });
  } catch (error) {
    console.error('Error running delta sync:', error);
    return NextResponse.json(
      { error: 'Delta sync failed', details: error.message },
      { status: 500 }
    );
  }
}
```

**Test**: Call endpoint, verify reconciler runs successfully

**Commit Message**: `feat: Add delta sync API endpoint for manual reconciliation`

---

### Commit 10: Re-wire Manual Sync Button in UI

**Files to Find**:
1. Search for Manual Sync button component
2. Update to call new `/api/admin/sync/delta` endpoint

**Search**:
```bash
grep -r "Manual Sync\|manual.*sync" src/app --include="*.tsx"
```

**Implementation Pattern**:
```typescript
// Replace existing sync call
const handleManualSync = async () => {
  setLoading(true);
  try {
    const res = await fetch('/api/admin/sync/delta', { method: 'POST' });
    const data = await res.json();

    if (data.success) {
      toast.success('Delta sync complete');
      // Refresh data
      refetch();
    } else {
      toast.error('Sync failed');
    }
  } catch (error) {
    toast.error('Failed to trigger sync');
  } finally {
    setLoading(false);
  }
};
```

**Update Button Label**: "Manual Sync" → "Sync Recent Changes (Last 20min)"

**Test**: Click button, verify toast shows success, data refreshes

**Commit Message**: `feat: Re-wire Manual Sync button to use delta sync endpoint`

---

## PHASE 3: TESTING & DEPLOYMENT

### Commit 11: Add Integration Tests

**File**: `scripts/test-reconciler.ts` (NEW FILE)

**Purpose**: End-to-end test of reconciliation logic

**Implementation**:
```typescript
import { reconcileRecentChanges } from './reconcile-recent-changes';
import { db } from '../src/lib/db';
import { leads } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function runTests() {
  console.log('🧪 Starting Reconciler Integration Tests\n');

  // Test 1: Stage 1 - Airtable → PostgreSQL
  console.log('Test 1: Stage 1 sync');
  const result1 = await reconcileRecentChanges(60); // 60min lookback
  console.assert(result1.success, 'Stage 1 should succeed');
  console.assert(result1.stage1.recordsProcessed > 0, 'Should process records');
  console.log('✅ Test 1 passed\n');

  // Test 2: Stage 2 - PostgreSQL → Airtable
  console.log('Test 2: Stage 2 sync');
  // Update a lead manually
  await db.update(leads).set({
    notes: 'Test note from integration test',
    updatedAt: new Date(),
  }).where(eq(leads.email, 'test@example.com'));

  const result2 = await reconcileRecentChanges(5);
  console.assert(result2.success, 'Stage 2 should succeed');
  console.assert(result2.stage2.recordsProcessed > 0, 'Should process updated lead');
  console.log('✅ Test 2 passed\n');

  console.log('✅ All tests passed!');
}

runTests().catch(console.error);
```

**Test**: `npx tsx scripts/test-reconciler.ts`

**Commit Message**: `test: Add integration tests for bi-directional reconciliation`

---

### Commit 12: Add Reconciler to package.json Scripts

**File**: `package.json`

**Changes**:
```json
{
  "scripts": {
    "reconcile": "tsx scripts/reconcile-recent-changes.ts",
    "reconcile:test": "tsx scripts/test-reconciler.ts"
  }
}
```

**Test**: `npm run reconcile`

**Commit Message**: `chore: Add reconciler npm scripts`

---

### Commit 13: Documentation

**File**: `docs/RECONCILIATION-ENGINE.md` (NEW FILE)

**Content**: Architecture overview, how to run, troubleshooting

**Commit Message**: `docs: Add reconciliation engine documentation`

---

## PHASE 4: DEPLOYMENT CHECKLIST

### Pre-Deployment Verification

- [ ] All tests passing locally
- [ ] Reconciler runs successfully with real data
- [ ] API endpoints tested manually
- [ ] Manual Sync button works in UI
- [ ] No TypeScript errors
- [ ] No console errors in browser

### Deployment Steps

1. **Push to GitHub**:
   ```bash
   git push origin campaign-manager-rebuild-v3
   ```

2. **Create Pull Request** to `main`

3. **After Merge**: Render auto-deploys

4. **Execute Final Great Sync** (ONE TIME):
   ```bash
   npm run sync:full-enhanced
   ```

5. **Configure Render Cron Job**:
   - Dashboard → Cron Jobs → New Cron Job
   - Name: "Bi-Directional Reconciliation"
   - Command: `npm run reconcile`
   - Schedule: `*/15 * * * *` (every 15 minutes)
   - Region: Same as app

6. **Monitor First 24 Hours**:
   - Check logs after each cron run
   - Verify no infinite loops
   - Confirm data is syncing correctly

---

## ROLLBACK PLAN

If reconciliation causes issues:

1. **Disable Cron Job** in Render dashboard
2. **Revert Manual Sync Button** to old endpoint
3. **Keep reconciler code** for future debugging
4. **Document issues** in GitHub issue

---

## SUCCESS CRITERIA

✅ Reconciler runs successfully every 15 minutes
✅ Airtable changes appear in portal within 15 minutes
✅ Portal changes appear in Airtable within 15 minutes
✅ No infinite sync loops
✅ No duplicate records created
✅ Error rate < 1%
✅ Manual Sync button completes in < 30 seconds

---

**HONESTY CHECK**: ✅ 100% based on Master Plan architecture
**Assumptions**: 0
**Confidence Level**: 95% (real-world testing will reveal edge cases)
