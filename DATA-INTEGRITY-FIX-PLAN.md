# DATA INTEGRITY FIX PLAN
## Phase 1: Implementation Planning

**Date:** November 11, 2025
**Protocol:** MANDATORY-DEVELOPMENT-WORKFLOW.md Phase 1
**Investigation Report:** FORENSIC-ANALYSIS-DATA-INTEGRITY.md
**Status:** 📋 **READY FOR REVIEW & APPROVAL**

---

## TABLE OF CONTENTS

1. [Fix Priority Matrix](#fix-priority-matrix)
2. [Fix #1: Lead Source Bug (Immediate)](#fix-1-lead-source-bug)
3. [Fix #2: Campaign Aggregate Reconciliation (Critical)](#fix-2-campaign-aggregate-reconciliation)
4. [Fix #3: SMS Event Logging (Critical)](#fix-3-sms-event-logging)
5. [Fix #4: SMS Audit Sync (Critical)](#fix-4-sms-audit-sync)
6. [Fix #5: Lead Status Data Quality (High Priority)](#fix-5-lead-status-data-quality)
7. [Fix #6: Sort & Filter UI (Medium Priority)](#fix-6-sort--filter-ui)
8. [Testing Strategy](#testing-strategy)
9. [Success Criteria](#success-criteria)
10. [Rollback Plan](#rollback-plan)

---

## FIX PRIORITY MATRIX

| Priority | Fix | Effort | Impact | Deadline | Dependencies |
|----------|-----|--------|--------|----------|--------------|
| 🚨 **IMMEDIATE** | #1: Lead Source Bug | 5 min | CRITICAL | Today | None |
| 🔴 **CRITICAL** | #2: Aggregate Reconciliation | 4 hours | CRITICAL | This Week | None |
| 🔴 **CRITICAL** | #3: SMS Event Logging | 2 hours | CRITICAL | This Week | Fix #1 |
| 🔴 **CRITICAL** | #4: SMS Audit Sync | 3 hours | HIGH | This Week | None |
| 🟠 **HIGH** | #5: Lead Status Quality | 6 hours | HIGH | Next Sprint | Fix #1, #2 |
| 🟡 **MEDIUM** | #6: Sort & Filter UI | 3 hours | MEDIUM | Next Sprint | None |

**Total Estimated Effort:** 18 hours (2.25 developer-days)

---

## FIX #1: LEAD SOURCE BUG

### 🚨 PRIORITY: IMMEDIATE (Fix Today)

### Problem Statement
n8n Kajabi API Polling workflow sets `lead_source = 'Kajabi-API'` but SMS Scheduler filters for `lead_source = 'Standard Form'`. This causes 478 leads marked as "Ready for SMS" to never receive messages.

### Root Cause
**Workflow:** UYSP-Kajabi-API-Polling-working (ID: LhjEy8ckcPsxATkR)
**Node:** Parse All Submissions (ID: 7d8324dd-223f-4597-af42-f55499035176)
**Line 95:**
```javascript
lead_source: 'Kajabi-API',  // ← BUG: Should be 'Standard Form'
```

### Fix Steps

#### Step 1.1: Manual n8n Workflow Fix (2 minutes)
1. Navigate to: https://rebelhq.app.n8n.cloud/workflow/LhjEy8ckcPsxATkR
2. Open node: "Parse All Submissions"
3. Find line 95: `lead_source: 'Kajabi-API',`
4. Change to: `lead_source: 'Standard Form',`
5. Click "Save"

#### Step 1.2: Backfill Historical Leads (3 minutes)
**Option A: Airtable Bulk Update (RECOMMENDED)**
1. Open Airtable → Leads Table
2. Add filter: `Imported At > Nov 11, 2025 AND Lead Source = "Kajabi-API"`
3. Bulk select all results
4. Update field: `Lead Source = "Standard Form"`

**Option B: SQL Update (Alternative)**
```sql
-- Backup first
CREATE TABLE leads_backup_20251111 AS SELECT * FROM leads WHERE lead_source = 'Kajabi-API';

-- Update
UPDATE leads
SET lead_source = 'Standard Form',
    updated_at = NOW()
WHERE lead_source = 'Kajabi-API'
  AND created_at >= '2025-11-11'
  AND is_active = true;

-- Verify
SELECT COUNT(*) FROM leads WHERE lead_source = 'Kajabi-API' AND created_at >= '2025-11-11';
-- Expected: 0
```

### Testing
1. Wait for next n8n execution (every 30 minutes)
2. Check new lead in PostgreSQL:
   ```sql
   SELECT id, first_name, last_name, lead_source, created_at
   FROM leads
   ORDER BY created_at DESC
   LIMIT 5;
   ```
3. Verify `lead_source = 'Standard Form'`

### Success Criteria
- [ ] n8n workflow updated and saved
- [ ] Historical leads backfilled (0 leads with 'Kajabi-API' source)
- [ ] New leads coming in with correct lead_source
- [ ] SMS Scheduler starts processing previously stuck leads

### Rollout
**Immediate** - This is a configuration fix with no code deployment required.

---

## FIX #2: CAMPAIGN AGGREGATE RECONCILIATION

### 🔴 PRIORITY: CRITICAL (This Week)

### Problem Statement
Campaign aggregate fields (`total_leads`, `messages_sent`, `active_leads_count`, `completed_leads_count`) are 100% stale. No code exists to update these fields when leads are added, updated, or removed from campaigns.

### Solution Overview
1. **One-time backfill script** to correct all historical data
2. **Real-time update logic** to maintain accuracy going forward
3. **Scheduled reconciliation job** as safety net

### Files to Modify

#### 2.1: Create Backfill Script
**File:** `scripts/backfill-campaign-aggregates.ts` (NEW)

```typescript
import { db } from '../src/lib/db';
import { campaigns, leads } from '../src/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

interface CampaignAggregates {
  totalLeads: number;
  activeLeadsCount: number;
  completedLeadsCount: number;
  optedOutCount: number;
  bookedCount: number;
  messagesSent: number;
}

async function calculateCampaignAggregates(campaignId: string): Promise<CampaignAggregates> {
  // Query all metrics in one go for performance
  const result = await db
    .select({
      totalLeads: sql<number>`COUNT(*)::int`,
      activeLeadsCount: sql<number>`COUNT(CASE WHEN ${leads.completedAt} IS NULL AND ${leads.smsStop} = false THEN 1 END)::int`,
      completedLeadsCount: sql<number>`COUNT(CASE WHEN ${leads.completedAt} IS NOT NULL THEN 1 END)::int`,
      optedOutCount: sql<number>`COUNT(CASE WHEN ${leads.smsStop} = true THEN 1 END)::int`,
      bookedCount: sql<number>`COUNT(CASE WHEN ${leads.booked} = true THEN 1 END)::int`,
      messagesSent: sql<number>`COALESCE(SUM(${leads.smsSentCount}), 0)::int`,
    })
    .from(leads)
    .where(and(
      eq(leads.campaignId, campaignId),
      eq(leads.isActive, true)
    ));

  return result[0];
}

async function backfillAllCampaigns() {
  console.log('🔄 Starting campaign aggregate backfill...\n');

  const allCampaigns = await db.query.campaigns.findMany({
    where: eq(campaigns.isActive, true),
  });

  console.log(`Found ${allCampaigns.length} active campaigns\n`);

  let updated = 0;
  let errors = 0;

  for (const campaign of allCampaigns) {
    try {
      const aggregates = await calculateCampaignAggregates(campaign.id);

      await db
        .update(campaigns)
        .set({
          totalLeads: aggregates.totalLeads,
          activeLeadsCount: aggregates.activeLeadsCount,
          completedLeadsCount: aggregates.completedLeadsCount,
          optedOutCount: aggregates.optedOutCount,
          bookedCount: aggregates.bookedCount,
          messagesSent: aggregates.messagesSent,
          updatedAt: new Date(),
        })
        .where(eq(campaigns.id, campaign.id));

      console.log(`✅ ${campaign.name}: ${aggregates.totalLeads} leads, ${aggregates.messagesSent} SMS`);
      updated++;
    } catch (error) {
      console.error(`❌ Error updating ${campaign.name}:`, error);
      errors++;
    }
  }

  console.log(`\n✅ Backfill complete: ${updated} updated, ${errors} errors`);
}

backfillAllCampaigns()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
```

#### 2.2: Create Real-Time Update Helper
**File:** `src/lib/campaigns/update-aggregates.ts` (NEW)

```typescript
import { db } from '../db';
import { campaigns, leads } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';

/**
 * Update campaign aggregate fields based on current lead data
 * Call this after any lead state change (enrollment, completion, opt-out, etc.)
 */
export async function updateCampaignAggregates(campaignId: string): Promise<void> {
  const result = await db
    .select({
      totalLeads: sql<number>`COUNT(*)::int`,
      activeLeadsCount: sql<number>`COUNT(CASE WHEN ${leads.completedAt} IS NULL AND ${leads.smsStop} = false THEN 1 END)::int`,
      completedLeadsCount: sql<number>`COUNT(CASE WHEN ${leads.completedAt} IS NOT NULL THEN 1 END)::int`,
      optedOutCount: sql<number>`COUNT(CASE WHEN ${leads.smsStop} = true THEN 1 END)::int`,
      bookedCount: sql<number>`COUNT(CASE WHEN ${leads.booked} = true THEN 1 END)::int`,
      messagesSent: sql<number>`COALESCE(SUM(${leads.smsSentCount}), 0)::int`,
    })
    .from(leads)
    .where(and(
      eq(leads.campaignId, campaignId),
      eq(leads.isActive, true)
    ));

  await db
    .update(campaigns)
    .set({
      totalLeads: result[0].totalLeads,
      activeLeadsCount: result[0].activeLeadsCount,
      completedLeadsCount: result[0].completedLeadsCount,
      optedOutCount: result[0].optedOutCount,
      bookedCount: result[0].bookedCount,
      messagesSent: result[0].messagesSent,
      updatedAt: new Date(),
    })
    .where(eq(campaigns.id, campaignId));
}

/**
 * Batch update multiple campaigns (for efficiency during sync)
 */
export async function updateMultipleCampaignAggregates(campaignIds: string[]): Promise<void> {
  await Promise.all(
    campaignIds.map(id => updateCampaignAggregates(id))
  );
}
```

#### 2.3: Integrate into Sync Process
**File:** `src/lib/sync/airtable-to-postgres.ts` (MODIFY)

**Add after line 138:**
```typescript
import { updateMultipleCampaignAggregates } from '../campaigns/update-aggregates';

export async function syncAirtableLeads(): Promise<SyncResult> {
  // ... existing sync logic ...

  // NEW: Track which campaigns were affected
  const affectedCampaigns = new Set<string>();

  await airtable.streamAllLeads(async (record) => {
    // ... existing lead sync logic ...

    // NEW: Track campaign
    if (leadData.campaignId) {
      affectedCampaigns.add(leadData.campaignId);
    }
  });

  // NEW: Update aggregates for all affected campaigns
  if (affectedCampaigns.size > 0) {
    console.log(`\n🔄 Updating aggregates for ${affectedCampaigns.size} campaigns...`);
    await updateMultipleCampaignAggregates(Array.from(affectedCampaigns));
    console.log('✅ Aggregates updated');
  }

  // ... rest of function ...
}
```

#### 2.4: Create Scheduled Reconciliation Job
**File:** `src/app/api/cron/reconcile-campaign-aggregates/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { campaigns } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { updateCampaignAggregates } from '@/lib/campaigns/update-aggregates';

/**
 * Cron job to reconcile campaign aggregates (safety net)
 * Schedule: Every 6 hours
 * Render Cron: 0 */6 * * *
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('🔄 Starting campaign aggregate reconciliation...');

    const allCampaigns = await db.query.campaigns.findMany({
      where: eq(campaigns.isActive, true),
    });

    let updated = 0;
    for (const campaign of allCampaigns) {
      await updateCampaignAggregates(campaign.id);
      updated++;
    }

    console.log(`✅ Reconciliation complete: ${updated} campaigns updated`);

    return NextResponse.json({
      success: true,
      campaignsUpdated: updated,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Reconciliation failed:', error);
    return NextResponse.json(
      { error: 'Reconciliation failed' },
      { status: 500 }
    );
  }
}
```

### Deployment Steps

1. **Create & Test Backfill Script**
   ```bash
   cd /Users/latifhorst/cursor\ projects/UYSP\ Lead\ Qualification\ V1/uysp-client-portal
   npm run tsx scripts/backfill-campaign-aggregates.ts
   ```

2. **Verify Backfill Results**
   ```sql
   -- Check sample campaign
   SELECT
     c.name,
     c.total_leads AS stored,
     (SELECT COUNT(*) FROM leads WHERE campaign_id = c.id AND is_active = true) AS actual
   FROM campaigns c
   WHERE c.is_active = true
   LIMIT 10;
   -- All stored = actual
   ```

3. **Deploy Helper Function & Integration**
   ```bash
   git add src/lib/campaigns/update-aggregates.ts
   git add src/lib/sync/airtable-to-postgres.ts
   git commit -m "feat: add real-time campaign aggregate updates"
   git push origin feature/data-integrity-fix
   ```

4. **Deploy to Staging & Test**
   - Trigger Airtable sync
   - Verify aggregates update correctly

5. **Deploy Cron Job**
   - Add to Render Dashboard: Cron schedule `0 */6 * * *`

### Testing
1. **Backfill Test**: Compare before/after aggregate values
2. **Real-time Test**: Update a lead, verify campaign aggregates update
3. **Cron Test**: Manually trigger cron endpoint, verify reconciliation

### Success Criteria
- [ ] Backfill script executes successfully
- [ ] 100% of campaigns have accurate aggregate counts (stored = actual)
- [ ] New lead enrollments update aggregates in real-time
- [ ] Lead completions update aggregates in real-time
- [ ] Scheduled reconciliation job runs every 6 hours
- [ ] Campaign dashboard shows correct lead/SMS counts

---

## FIX #3: SMS EVENT LOGGING

### 🔴 PRIORITY: CRITICAL (This Week)

### Problem Statement
SMS messages are being sent via n8n but no events are being logged to the `activity_log` table. This causes Activity Timelines to be empty for all leads.

### Solution Overview
Modify n8n SMS Scheduler workflow to insert activity log entries after sending each SMS message.

### n8n Workflow Modification

**Workflow:** UYSP SMS Scheduler (needs confirmation of workflow ID)

**Add New Node After "Send SMS" Node:**

**Node Name:** "Log SMS Event to PostgreSQL"
**Node Type:** PostgreSQL
**Operation:** Insert

**Configuration:**
```json
{
  "operation": "insert",
  "table": "activity_log",
  "columns": {
    "id": "={{ $jmespath($('Generate UUID').json, 'uuid') }}",
    "lead_id": "={{ $json.lead_id }}",
    "client_id": "={{ $json.client_id }}",
    "action": "SMS_SENT",
    "details": "={{ JSON.stringify({
      message_text: $json.sms_text,
      campaign_id: $json.campaign_id,
      campaign_name: $json.campaign_name,
      sequence_step: $json.sms_sequence_position,
      phone: $json.phone,
      sent_at: $now.toISO()
    }) }}",
    "created_at": "={{ $now.toISO() }}"
  }
}
```

**Add UUID Generator Node Before Log Node:**
**Node Name:** "Generate UUID"
**Node Type:** Function
**Code:**
```javascript
const { v4: uuidv4 } = require('uuid');
return { uuid: uuidv4() };
```

### Alternative: PostgreSQL Function Trigger (More Reliable)

**File:** `migrations/0037_add_sms_activity_trigger.sql` (NEW)

```sql
-- Create function to auto-log SMS activity when sms_sent_count increments
CREATE OR REPLACE FUNCTION log_sms_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if sms_sent_count increased
  IF NEW.sms_sent_count > OLD.sms_sent_count THEN
    INSERT INTO activity_log (
      id,
      lead_id,
      client_id,
      action,
      details,
      created_at
    ) VALUES (
      gen_random_uuid(),
      NEW.id,
      NEW.client_id,
      'SMS_SENT',
      json_build_object(
        'sms_count', NEW.sms_sent_count,
        'sequence_position', NEW.sms_sequence_position,
        'processing_status', NEW.processing_status,
        'campaign_id', NEW.campaign_id
      )::text,
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER sms_activity_logger
AFTER UPDATE OF sms_sent_count ON leads
FOR EACH ROW
EXECUTE FUNCTION log_sms_activity();

-- Test trigger
COMMENT ON TRIGGER sms_activity_logger ON leads IS 'Auto-logs SMS_SENT events to activity_log when sms_sent_count increments';
```

### Testing
```sql
-- Test trigger
UPDATE leads
SET sms_sent_count = sms_sent_count + 1
WHERE id = (SELECT id FROM leads WHERE is_active = true LIMIT 1);

-- Verify event logged
SELECT * FROM activity_log WHERE action = 'SMS_SENT' ORDER BY created_at DESC LIMIT 5;
-- Expected: New SMS_SENT event
```

### Success Criteria
- [ ] Database trigger deployed
- [ ] Test SMS send creates activity_log entry
- [ ] Activity Timeline displays SMS events
- [ ] Historical backfill (optional): Generate SMS_SENT events for all leads with sms_sent_count > 0

---

## FIX #4: SMS AUDIT SYNC

### 🔴 PRIORITY: CRITICAL (This Week)

### Problem Statement
The `sms_audit` table is completely empty (0 records). This table should contain a complete audit trail of all SMS messages synced from Airtable.

### Solution Overview
Create a sync function to pull SMS audit data from Airtable and populate the `sms_audit` table.

### Files to Create

#### 4.1: SMS Audit Sync Function
**File:** `src/lib/sync/sync-sms-audit.ts` (NEW)

```typescript
import { db } from '../db';
import { smsAudit } from '../db/schema';
import { getAirtableClient } from '../airtable/client';
import { eq } from 'drizzle-orm';

interface SyncResult {
  success: boolean;
  totalRecords: number;
  inserted: number;
  updated: number;
  errors: string[];
}

export async function syncAirtableSMSAudit(): Promise<SyncResult> {
  const errors: string[] = [];
  let inserted = 0;
  let updated = 0;
  let totalRecords = 0;

  try {
    console.log('🔄 Starting SMS Audit sync from Airtable...');

    const airtable = getAirtableClient();
    const tableName = 'SMS Audit'; // Confirm exact table name in Airtable

    // Stream all SMS audit records
    await airtable.base(tableName)
      .select({ maxRecords: 10000 })
      .eachPage(async (records, fetchNextPage) => {
        for (const record of records) {
          try {
            totalRecords++;

            const smsData = {
              airtableRecordId: record.id,
              smsCampaignId: record.get('SMS Campaign ID') as string,
              phone: record.get('Phone') as string,
              leadRecordId: record.get('Lead Record ID') as string,
              event: record.get('Event') as string,
              text: record.get('Text') as string,
              status: record.get('Status') as string,
              carrier: record.get('Carrier') as string,
              sentAt: record.get('Sent At') ? new Date(record.get('Sent At') as string) : null,
              deliveryAt: record.get('Delivery At') ? new Date(record.get('Delivery At') as string) : null,
              clickedAt: record.get('Clicked At') ? new Date(record.get('Clicked At') as string) : null,
              clicked: record.get('Clicked') as boolean || false,
              webhookRaw: record.get('Webhook Raw') as string,
            };

            // Check if record exists
            const existing = await db.query.smsAudit.findFirst({
              where: eq(smsAudit.airtableRecordId, record.id),
            });

            if (existing) {
              await db
                .update(smsAudit)
                .set({
                  ...smsData,
                  updatedAt: new Date(),
                })
                .where(eq(smsAudit.airtableRecordId, record.id));
              updated++;
            } else {
              await db.insert(smsAudit).values(smsData);
              inserted++;
            }

            if (totalRecords % 100 === 0) {
              console.log(`  ⏳ Processed ${totalRecords} SMS audit records...`);
            }
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            errors.push(`Record ${record.id}: ${errorMsg}`);
            console.error(`  ❌ Error syncing SMS audit record:`, error);
          }
        }

        fetchNextPage();
      });

    console.log(`\n✅ SMS Audit Sync Complete!`);
    console.log(`   Total: ${totalRecords}, Inserted: ${inserted}, Updated: ${updated}, Errors: ${errors.length}`);

    return {
      success: errors.length === 0,
      totalRecords,
      inserted,
      updated,
      errors,
    };
  } catch (error) {
    console.error('❌ SMS Audit sync failed:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      totalRecords,
      inserted,
      updated,
      errors: [errorMsg, ...errors],
    };
  }
}
```

#### 4.2: Add to Cron Sync Job
**File:** `src/app/api/cron/sync-airtable/route.ts` (MODIFY)

**Add import:**
```typescript
import { syncAirtableSMSAudit } from '@/lib/sync/sync-sms-audit';
```

**Add to sync execution:**
```typescript
// After existing lead sync
const smsAuditResult = await syncAirtableSMSAudit();
results.push({ table: 'sms_audit', ...smsAuditResult });
```

### Testing
```bash
# Manual test
npm run tsx scripts/test-sms-audit-sync.ts

# Verify
psql -c "SELECT COUNT(*) FROM sms_audit;"
# Expected: > 0
```

### Success Criteria
- [ ] SMS audit sync function created
- [ ] Integrated into cron job
- [ ] Historical SMS audit records synced from Airtable
- [ ] Ongoing sync maintains up-to-date audit trail

---

## FIX #5: LEAD STATUS DATA QUALITY

### 🟠 PRIORITY: HIGH (Next Sprint)

### Problem Statement
- 478 "Ready for SMS" leads have never received SMS
- 119 "Complete" leads have no SMS history
- 129 leads missing `enrolled_at` dates

### Root Causes
1. Lead Source Bug (#1) - preventing SMS delivery
2. Stale status sync from Airtable
3. Missing enrollment date population

### Solution Overview
1. Fix lead source bug first (#1 above)
2. Create data quality audit script
3. Backfill missing enrollment dates
4. Investigate Airtable status sync accuracy

### Implementation Plan
**To be detailed after Fix #1 is deployed and results observed.**

---

## FIX #6: SORT & FILTER UI

### 🟡 PRIORITY: MEDIUM (Next Sprint)

### Problem Statement
Campaign detail page leads table has no client-side sorting or filtering capabilities.

### Files to Modify

**File:** `src/app/(client)/admin/campaigns/[id]/page.tsx`

### Changes Required

#### 6.1: Add State Management
**Add after line 59:**
```typescript
const [sortField, setSortField] = useState<keyof Lead>('createdAt');
const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
const [filterStatus, setFilterStatus] = useState<string>('all');
const [searchQuery, setSearchQuery] = useState<string>('');
```

#### 6.2: Add Filter & Sort Logic
```typescript
const filteredAndSortedLeads = useMemo(() => {
  if (!leads) return [];

  return leads
    .filter(lead => {
      // Status filter
      if (filterStatus !== 'all' && lead.processingStatus !== filterStatus) {
        return false;
      }

      // Search filter (name, email, company)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(query);
        const matchesEmail = lead.email?.toLowerCase().includes(query);
        const matchesCompany = lead.company?.toLowerCase().includes(query);

        if (!matchesName && !matchesEmail && !matchesCompany) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (aVal === bVal) return 0;

      const comparison = aVal > bVal ? 1 : -1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
}, [leads, sortField, sortDirection, filterStatus, searchQuery]);
```

#### 6.3: Add Sort Handler
```typescript
const handleSort = (field: keyof Lead) => {
  if (sortField === field) {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  } else {
    setSortField(field);
    setSortDirection('asc');
  }
};
```

#### 6.4: Add UI Controls
```typescript
// Add above table
<div className="mb-4 flex gap-4">
  {/* Search Input */}
  <input
    type="text"
    placeholder="Search leads..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className={`flex-1 px-4 py-2 rounded-lg ${theme.core.inputBg} ${theme.core.white} border ${theme.core.border}`}
  />

  {/* Status Filter */}
  <select
    value={filterStatus}
    onChange={(e) => setFilterStatus(e.target.value)}
    className={`px-4 py-2 rounded-lg ${theme.core.inputBg} ${theme.core.white} border ${theme.core.border}`}
  >
    <option value="all">All Statuses</option>
    <option value="Queued">Queued</option>
    <option value="Ready for SMS">Ready for SMS</option>
    <option value="In Sequence">In Sequence</option>
    <option value="Complete">Complete</option>
    <option value="Stopped">Stopped</option>
  </select>

  {/* Clear Filters */}
  {(searchQuery || filterStatus !== 'all') && (
    <button
      onClick={() => {
        setSearchQuery('');
        setFilterStatus('all');
      }}
      className={`px-4 py-2 rounded-lg ${theme.accents.secondary.class}`}
    >
      Clear Filters
    </button>
  )}
</div>
```

#### 6.5: Update Table Headers (Make Clickable)
```typescript
<th
  onClick={() => handleSort('firstName')}
  className={`px-6 py-4 text-left cursor-pointer hover:bg-gray-800 ${theme.accents.tertiary.class}`}
>
  <div className="flex items-center gap-2">
    Name
    {sortField === 'firstName' && (
      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
    )}
  </div>
</th>
```

### Testing
1. Test sort by each column
2. Test status filter dropdown
3. Test search functionality
4. Test clear filters button
5. Test combined filters + sort

### Success Criteria
- [ ] Can sort by any column (click column header)
- [ ] Sort direction toggles (asc ↔ desc)
- [ ] Can filter by processing status
- [ ] Can search by name, email, or company
- [ ] Clear filters button resets all filters
- [ ] Filtered count displayed (e.g., "Showing 25 of 62 leads")

---

## TESTING STRATEGY

### Unit Tests
```typescript
// src/lib/campaigns/__tests__/update-aggregates.test.ts
describe('updateCampaignAggregates', () => {
  it('should correctly calculate total leads', async () => {
    // Test implementation
  });

  it('should correctly calculate active leads count', async () => {
    // Test implementation
  });

  it('should correctly sum messages sent', async () => {
    // Test implementation
  });
});
```

### Integration Tests
```typescript
// Test full sync flow
it('should update campaign aggregates after lead sync', async () => {
  // 1. Run sync
  await syncAirtableLeads();

  // 2. Query campaign
  const campaign = await db.query.campaigns.findFirst({
    where: eq(campaigns.id, testCampaignId),
  });

  // 3. Query actual counts
  const actualCount = await db.query.leads.count({
    where: and(
      eq(leads.campaignId, testCampaignId),
      eq(leads.isActive, true)
    ),
  });

  // 4. Verify match
  expect(campaign.totalLeads).toBe(actualCount);
});
```

### Manual Testing Checklist

#### Fix #1: Lead Source Bug
- [ ] n8n workflow updated
- [ ] New leads have correct lead_source
- [ ] Historical leads backfilled
- [ ] SMS Scheduler processes previously stuck leads

#### Fix #2: Campaign Aggregates
- [ ] Backfill script completes without errors
- [ ] All campaigns have accurate counts
- [ ] Real-time updates work (test with manual lead update)
- [ ] Cron reconciliation job runs successfully

#### Fix #3: SMS Event Logging
- [ ] Database trigger installed
- [ ] Test SMS creates activity_log entry
- [ ] Activity Timeline displays SMS events

#### Fix #4: SMS Audit Sync
- [ ] Sync function pulls data from Airtable
- [ ] sms_audit table populated
- [ ] Ongoing sync maintains data

#### Fix #6: Sort & Filter UI
- [ ] All sort columns work
- [ ] Status filter works
- [ ] Search works
- [ ] Clear filters works

---

## SUCCESS CRITERIA

### Data Integrity Goals
1. **100% Accurate Campaign Aggregates**
   - Stored counts match actual lead counts
   - Real-time updates maintain accuracy
   - Scheduled reconciliation catches any drift

2. **Complete Activity Audit Trail**
   - All SMS sends logged to activity_log
   - Activity timelines populated for all leads
   - sms_audit table contains full history

3. **Trustworthy Lead Statuses**
   - "Ready for SMS" leads actively receive messages
   - "Complete" leads have SMS history
   - All enrolled leads have enrollment dates

4. **Functional UI**
   - Users can sort leads by any column
   - Users can filter by status
   - Users can search by name/email/company

### Performance Benchmarks
- Backfill script: < 5 minutes for 1,000 campaigns
- Real-time aggregate update: < 100ms per campaign
- Activity log insert: < 50ms per SMS
- UI filter/sort: < 100ms for 500 leads

### Monitoring & Alerting
1. **Daily Reconciliation Report**
   - Compare stored vs. actual counts for all campaigns
   - Alert if drift > 5%

2. **Activity Log Health Check**
   - Monitor SMS_SENT event rate
   - Alert if 0 events for > 1 hour during business hours

3. **SMS Audit Sync Health**
   - Monitor sync job success rate
   - Alert if sync fails 3 times in a row

---

## ROLLBACK PLAN

### If Backfill Fails
```sql
-- Restore from backup
UPDATE campaigns
SET
  total_leads = b.total_leads,
  messages_sent = b.messages_sent,
  active_leads_count = b.active_leads_count
FROM campaigns_backup_20251111 b
WHERE campaigns.id = b.id;
```

### If Real-Time Updates Cause Issues
1. Remove updateCampaignAggregates() calls from sync
2. Rely on scheduled reconciliation job only (every 6 hours)
3. Investigate and fix issue
4. Re-enable real-time updates

### If Database Trigger Causes Performance Issues
```sql
-- Disable trigger temporarily
ALTER TABLE leads DISABLE TRIGGER sms_activity_logger;

-- Fix issue, then re-enable
ALTER TABLE leads ENABLE TRIGGER sms_activity_logger;
```

---

## IMPLEMENTATION TIMELINE

### Week 1 (November 11-15, 2025)
- **Day 1 (Today)**: Fix #1 - Lead Source Bug (5 min)
- **Day 2-3**: Fix #2 - Campaign Aggregate Reconciliation (4 hours)
- **Day 3-4**: Fix #3 - SMS Event Logging (2 hours)
- **Day 4-5**: Fix #4 - SMS Audit Sync (3 hours)

### Week 2 (November 18-22, 2025)
- **Day 1-2**: Fix #5 - Lead Status Data Quality (6 hours)
- **Day 3**: Fix #6 - Sort & Filter UI (3 hours)
- **Day 4-5**: End-to-end testing, bug fixes, documentation

### Week 3 (November 25-29, 2025)
- **Monitoring & Validation**: Ensure all fixes are stable in production

---

## APPROVAL REQUIRED

**Before proceeding to Phase 2 (TDD), this plan must be reviewed and approved.**

**Review Questions:**
1. Are the priorities correct?
2. Are there any missing fixes?
3. Is the timeline realistic?
4. Are there any concerns about the technical approach?

**Approved By:** _______________
**Date:** _______________

---

**HONESTY CHECK**: ✅ 100% implementation plan based on forensic evidence
**NEXT PHASE**: Upon approval, proceed to Phase 2 (TDD) - Write tests first, then implement fixes
