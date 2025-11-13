# AGENT HANDOFF: Data Flow Issues - Leads & Activity

**Date:** 2025-11-13
**Status:** CRITICAL ISSUES - Previous fixes incomplete
**Branch:** `feature/data-integrity-restoration`
**Service:** uysp-portal-test-fresh (staging)

---

## REPOSITORY LOCATION

**Root Directory:** `/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/`
- ⚠️ This contains BOTH repos - see DIR001 protocol in CLAUDE.md

**Frontend Repo (WHERE ALL WORK HAPPENS):**
```
/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal
```

**MANDATORY:** ALL commands MUST be prefixed with:
```bash
cd /Users/latifhorst/cursor\ projects/UYSP\ Lead\ Qualification\ V1/uysp-client-portal
```

---

## DATABASE CONNECTION

**PostgreSQL (Render):**
```
DATABASE_URL="postgresql://uysp_client_portal_db_user:PuLMS841kifvBNpl3mGcLBl1WjIs0ey2@dpg-d3q9raodl3ps73bp1r50-a.virginia-postgres.render.com/uysp_client_portal_db"
```

**Test queries:**
```bash
cd /Users/latifhorst/cursor\ projects/UYSP\ Lead\ Qualification\ V1/uysp-client-portal
DATABASE_URL="..." npx tsx scripts/diagnose-leads-status.ts
```

---

## CURRENT CRITICAL ISSUES

### Issue 1: WRONG STATUS FIELD BEING DISPLAYED ❌

**What user sees:**
- Status column showing: "Active", "Completed"
- User quote: *"what the fuck is active mean where is active as a status in our airtable"*

**What user expects:**
- ONLY show the **Airtable `status` field** values
- Should be: "Queued" or "Completed" (from Airtable)
- NOT processing_status, NOT hrq_status

**Root Cause:**
The database has **THREE status columns** (see evidence below):
1. `status` - Airtable SMS status: 'Sent', 'New', 'Failed' ← **USER WANTS THIS ONE**
2. `processing_status` - Internal workflow: 'Completed', 'Queued', 'Complete'
3. `hrq_status` - HRQ review: 'None', 'Review', 'Archive'

**Current code (WRONG):**
- File: `src/app/(client)/leads/page.tsx:557`
- Displaying: `lead.processingStatus || lead.status`
- This is WRONG - user wants Airtable status field ONLY

**What to fix:**
- UI should display the actual Airtable `status` field values
- Check Airtable to see what values exist in the Status field
- Map those values to the UI display
- User says leads should only be "Queued" or "Completed"

---

### Issue 2: ACTIVITY TIMELINE STILL EMPTY ❌

**What user sees:**
- Lead shows as "Completed"
- But clicking into lead detail shows NO activity timeline
- User quote: *"I'd like to hand this over to a new agent. We're still seeing issues... there is still no activity timeline"*

**What user expects:**
- If lead is "Completed", should see SMS in activity timeline
- Activity Timeline section should show events with timestamps, descriptions

**Evidence from database:**
```
Chris Sullivan:
- id: 67f21f2f-628a-45f3-9c88-3f1c69d9afb5
- status: 'Sent'
- processing_status: 'Completed'
- sms_sent_count: 1
- sms_last_sent_at: '2025-11-06 21:33:55+00'
- campaign_id: fbcddc7c-90b1-4669-b964-9fa0eb3290c6
```

Lead HAS:
- ✅ 1 SMS sent
- ✅ Last sent timestamp
- ✅ Campaign ID
- ❌ But NO activity showing in UI

**Where activity is fetched:**
- Component: `src/components/activity/LeadTimeline.tsx`
- API: `/api/admin/activity-logs?leadId=...`
- Route file: `src/app/api/admin/activity-logs/route.ts`

**Possible causes:**
1. No data in `lead_activity_log` table for this lead
2. API returning data but component not rendering it
3. Permissions issue (ADMIN vs CLIENT_USER)

**What to check:**
```sql
SELECT COUNT(*) FROM lead_activity_log WHERE lead_id = '67f21f2f-628a-45f3-9c88-3f1c69d9afb5';
```

**Files to investigate:**
1. `src/components/activity/LeadTimeline.tsx:64` - API call
2. `src/app/api/admin/activity-logs/route.ts:37-43` - Authorization check
3. Database: Check if `lead_activity_log` has records for completed leads

---

## DATABASE SCHEMA EVIDENCE

### Leads Table - THREE Status Columns:

```
┌──────┬───────────────────────┬──────────────────────┐
│ col  │ column_name           │ data_type            │
├──────┼───────────────────────┼──────────────────────┤
│ 10   │ status                │ character varying    │  ← AIRTABLE STATUS (USER WANTS THIS)
│ 21   │ processing_status     │ character varying    │  ← Internal workflow
│ 22   │ hrq_status            │ character varying    │  ← HRQ review status
└──────┴───────────────────────┴──────────────────────┘
```

### Actual Status Values in Production Database:

```
┌───────┬──────────┬───────────────────┬────────────┬───────┐
│ idx   │ status   │ processing_status │ hrq_status │ count │
├───────┼──────────┼───────────────────┼────────────┼───────┤
│ 0     │ 'Sent'   │ 'Completed'       │ 'None'     │ 112   │
│ 1     │ 'New'    │ 'Queued'          │ 'None'     │ 92    │
│ 2     │ 'New'    │ 'Complete'        │ 'Archive'  │ 77    │
│ 3     │ 'Sent'   │ 'Queued'          │ 'None'     │ 76    │
│ 4     │ 'Sent'   │ 'Completed'       │ 'Review'   │ 40    │
└───────┴──────────┴───────────────────┴────────────┴───────┘
```

**Note:** `processing_status` has BOTH "Completed" and "Complete" (inconsistent)

---

## FILES TO FIX

### 1. Leads Table Status Display
**File:** `src/app/(client)/leads/page.tsx`

**Current code (line 557):**
```typescript
{lead.processingStatus || lead.status}
```

**What needs fixing:**
- Check what Airtable Status field actually contains
- Display the AIRTABLE status values
- User says should only be "Queued" or "Completed"
- Remove processingStatus display entirely

**Interface (line 23):**
```typescript
processingStatus: string; // The workflow status (Queued/In Sequence/Completed)
```
Need to determine if we need to change this or add a different field.

---

### 2. Activity Timeline Component
**File:** `src/components/activity/LeadTimeline.tsx`

**API call (line 64):**
```typescript
const response = await fetch(`/api/admin/activity-logs?${params.toString()}`);
```

**Check:**
1. Is data being returned from API?
2. Is it being filtered correctly?
3. Is component rendering the data?
4. Add console.logs to debug

**Fixed in previous commit:**
- Changed `eventCategory` → `category` (commit b1c1d51)
- BUT STILL NOT WORKING

---

### 3. Activity Logs API
**File:** `src/app/api/admin/activity-logs/route.ts`

**Authorization (line 37-43):**
```typescript
// Authorization - Only ADMIN or SUPER_ADMIN
if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
  return NextResponse.json(
    { error: 'Forbidden - Admin access required' },
    { status: 403 }
  );
}
```

**Possible issue:**
- If user is CLIENT_USER, they get 403 Forbidden
- Activity timeline won't load
- Check what role the logged-in user has

---

## AIRTABLE SOURCE OF TRUTH

**Critical from CLAUDE.md:**
```
AIRTABLE AS SOURCE OF TRUTH:
- PostgreSQL = cache/write-buffer ONLY
- SYNC ALL changes to Airtable via airtableSyncQueue
- Never make PostgreSQL the decision-maker
```

**User requirement:**
- We should be reading from the **actual Airtable Status field**
- NOT internal processing_status
- NOT hrq_status

**Action needed:**
1. Check Airtable Leads table
2. Find the "Status" column
3. See what values it actually contains
4. Map those to UI display

---

## TESTING CHECKLIST

**Staging URL:** https://uysp-portal-test-fresh.onrender.com

**Login:**
- Email: `rebel@rebelhq.ai`
- Password: `RElH0rst89!`

### Test 1: Status Display
1. Go to `/leads`
2. Check Status column (far right)
3. **Current (WRONG):** Shows "Active", "Completed"
4. **Expected:** Shows Airtable status values (Queued/Completed according to user)

### Test 2: Activity Timeline
1. Go to `/leads`
2. Click on a lead that shows as "Completed"
3. Scroll to "Activity Timeline" section
4. **Current (WRONG):** Shows "No activity events found"
5. **Expected:** Shows SMS events with timestamps

### Test 3: Chris Sullivan Specific
1. Search for "Chris Sullivan"
2. Lead ID: `67f21f2f-628a-45f3-9c88-3f1c69d9afb5`
3. Has 1 SMS sent on 2025-11-06
4. Should show activity timeline with that SMS

---

## PREVIOUS COMMITS (Incomplete fixes)

**Branch:** `feature/data-integrity-restoration`

### Commit 8265be3: Status Field Fix (INCOMPLETE)
- Changed to display `processingStatus` instead of `status`
- **Problem:** User wants AIRTABLE status, not processing_status
- **Result:** Now showing confusing "Active" and "Completed" values

### Commit b1c1d51: Activity Timeline Column Names
- Fixed `eventCategory` → `category`
- **Problem:** Still no activity showing
- **Needs:** Further investigation into why data not appearing

### Commit c202cda: Campaign Message Counts
- Fixed campaign counts to aggregate from leads
- **Status:** ✅ This one is working (not related to current issues)

---

## DEBUGGING COMMANDS

### Check Activity Log Data:
```bash
cd /Users/latifhorst/cursor\ projects/UYSP\ Lead\ Qualification\ V1/uysp-client-portal

DATABASE_URL="postgresql://..." npx tsx -e "
import { db } from './src/lib/db/index.js';
import { sql } from 'drizzle-orm';

async function check() {
  const result = await db.execute(sql\`
    SELECT
      id,
      event_type,
      event_category,
      description,
      timestamp
    FROM lead_activity_log
    WHERE lead_id = '67f21f2f-628a-45f3-9c88-3f1c69d9afb5'
    ORDER BY timestamp DESC
    LIMIT 10
  \`);
  console.table(result.rows || result);
}

check();
"
```

### Check Airtable Sync:
```bash
# Check what's in airtable_sync_queue
DATABASE_URL="postgresql://..." npx tsx -e "
import { db } from './src/lib/db/index.js';
import { sql } from 'drizzle-orm';

async function check() {
  const result = await db.execute(sql\`
    SELECT
      operation,
      table_name,
      status,
      created_at
    FROM airtable_sync_queue
    ORDER BY created_at DESC
    LIMIT 20
  \`);
  console.table(result.rows || result);
}

check();
"
```

---

## DEPLOYMENT INFO

**Staging Service:**
- Name: `uysp-portal-test-fresh`
- ID: `srv-d4b3099r0fns73elfphg`
- URL: https://uysp-portal-test-fresh.onrender.com
- Branch: `feature/data-integrity-restoration`
- Auto-deploy: ✅ Enabled

**Current Deploy:**
- Commit: `0ae0db1` (docs commit)
- Status: LIVE
- Includes all previous fixes

**To redeploy after fixes:**
```bash
git add .
git commit -m "fix: [description]"
git push origin feature/data-integrity-restoration
# Auto-deploys to staging
```

---

## CRITICAL USER REQUIREMENTS

From user's message:

1. **"We should be using our actual Airtable statuses"**
   - Check Airtable Status field
   - Display THOSE values in UI
   - NOT processing_status

2. **"All leads should either be queued or completed"**
   - Only two valid statuses
   - No "Active", no "In Sequence"
   - Source: Airtable

3. **"If they're completed, I would expect to see they have an SMS in their activity"**
   - Completed leads MUST show SMS activity
   - Activity timeline MUST populate
   - Currently showing empty

4. **"We have a fucking status field"**
   - User is emphatic: use the STATUS field
   - It exists in Airtable
   - It's column 10 in leads table

---

## NEXT AGENT ACTION PLAN

### Step 1: Investigate Airtable
- Access Airtable base
- Find Leads table
- Check "Status" column
- Document actual values (Queued, Completed, or others?)

### Step 2: Check Activity Log Data
- Run query to see if lead_activity_log has data for completed leads
- If NO data: Problem is data not being logged
- If HAS data: Problem is UI/API not fetching/displaying

### Step 3: Fix Status Display
- Update `src/app/(client)/leads/page.tsx`
- Change from `processingStatus` to actual Airtable `status`
- Map values correctly
- Update badge colors

### Step 4: Fix Activity Timeline
- Determine why no events showing
- Check API response
- Check component rendering
- Fix authorization if needed (CLIENT_USER vs ADMIN)

### Step 5: Test & Verify
- Deploy to staging
- Test all three scenarios
- Get user approval

---

## QUESTIONS FOR USER (If needed)

1. What are the EXACT values in Airtable Status field?
2. Should CLIENT_USER role be able to see activity timeline?
3. Is data being logged to lead_activity_log when SMS sent?
4. Where is "Active" status coming from? (not in processing_status values)

---

## SUCCESS CRITERIA

✅ **Status column shows Airtable status values (Queued/Completed)**
✅ **NO "Active" or confusing statuses**
✅ **Completed leads show SMS activity in timeline**
✅ **Chris Sullivan (and similar leads) show activity events**
✅ **User is satisfied with data flow**

---

**CRITICAL:** Read CLAUDE.md in repo root for mandatory development protocols (DIR001, SYNC001, etc.)
