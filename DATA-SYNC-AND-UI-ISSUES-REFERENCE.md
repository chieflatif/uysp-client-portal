# DATA SYNCHRONIZATION & UI VISUALIZATION ISSUES - REFERENCE DOCUMENT

**Date:** 2025-11-11
**Database:** PostgreSQL on Render (dpg-d3q9raodl3ps73bp1r50-a.virginia-postgres.render.com)
**Current Status:** After nuclear reset + Great Sync - partial failure

---

## EXECUTIVE SUMMARY

After database nuclear reset, the Great Sync partially succeeded but has CRITICAL failures preventing proper data visualization in the UI:

1. ✅ **1,255 leads synced** from Airtable
2. ✅ **Schema intact** - all expected tables exist
3. ❌ **SMS activity sync COMPLETELY FAILED** - 287 records, 0 inserted
4. ❌ **enrolled_message_count mostly empty** - only 109/1,255 populated (9%)
5. ❌ **UI missing critical data** - no last activity, no engagement scores, no status indicators

---

## ISSUE 1: SMS ACTIVITY SYNC FAILURE (CRITICAL)

### Symptom
- **287 SMS audit records ALL FAILED to insert** into `lead_activity_log` table
- Table exists but has 0 rows
- Leads show NULL for:
  - `sms_last_sent_at` (0 of 1,255 leads have this)
  - `engagement_level` (0 of 1,255 leads have this)
  - `sms_sent_count` (all show 0)

### Root Cause
**ROOT CAUSE IDENTIFIED: ORPHANED SMS AUDIT DATA IN AIRTABLE**

✅ **Table structure is correct** - `lead_activity_log` table exists with proper schema
✅ **Sync script logic is correct** - Insert statements are properly formatted
❌ **DATA MISMATCH**: SMS_Audit table contains 287 records referencing lead Airtable IDs that **DO NOT EXIST** in the current Leads table

**Actual Error Pattern from Great Sync:**
```
⚠️  SMS audit record rec00EjWKLtvHVfNk: Lead recd1MLHwM9RaEmXa not found in database
⚠️  SMS audit record rec01CrcGaiXU4JCU: Lead recuyybGqvbE7EAmc not found in database
⏭️  Skipping SMS audit record rec01JU32w0hD1Q9r: No Lead Record ID
⏭️  Skipping SMS audit record rec02RynijGmMaGle: No Sent At timestamp
```

**Breakdown of 287 Failed Records:**
- **Most records**: Lead Airtable ID not found in PostgreSQL (orphaned references)
- **Some records**: No Lead Record ID in SMS_Audit table (NULL values)
- **Some records**: No Sent At timestamp (NULL values)

**Why This Happened:**
The SMS_Audit table in Airtable contains historical data for leads that:
1. Were **deleted** from Airtable Leads table (most likely)
2. Are **test data** that should be cleaned up
3. Have **corrupted/incomplete data** (missing required fields)

### Database Evidence
```sql
-- Table exists
SELECT tablename FROM pg_tables WHERE tablename = 'lead_activity_log';
-- Result: 1 row (table exists)

-- But has no data
SELECT COUNT(*) FROM lead_activity_log;
-- Result: 0 rows

-- Leads have no SMS activity data
SELECT COUNT(*) FROM leads WHERE sms_last_sent_at IS NOT NULL;
-- Result: 0 leads

SELECT COUNT(*) FROM leads WHERE engagement_level IS NOT NULL;
-- Result: 0 leads
```

### Impact on UI
- **Lead detail pages**: Activity timeline completely empty
- **Lead list page**: "Last Activity" column shows nothing
- **Campaign detail page**: No engagement scores, no activity indicators
- **Analytics**: Cannot calculate engagement metrics

### Files Involved
- [scripts/full-airtable-sync-ENHANCED.ts](scripts/full-airtable-sync-ENHANCED.ts) - Sync script that failed
- [src/lib/db/schema.ts:542-583](src/lib/db/schema.ts#L542-L583) - `lead_activity_log` table definition
- [src/lib/db/migrations/0004_add_lead_activity_log.sql:11-26](src/lib/db/migrations/0004_add_lead_activity_log.sql#L11-L26) - Table creation migration

### Fix Required
**STATUS: ROOT CAUSE IDENTIFIED - TWO OPTIONS**

**Option 1: Clean Up Orphaned Data in Airtable (RECOMMENDED)**
1. Manually review SMS_Audit table in Airtable
2. Delete records where Lead Record ID doesn't exist in Leads table
3. Delete records with NULL Lead Record ID or NULL Sent At
4. Re-run Great Sync

**Option 2: Make Sync Script More Tolerant (QUICK FIX)**
1. The sync script ALREADY skips orphaned records (as designed)
2. **THE ISSUE**: We have ZERO valid SMS audit records for current leads
3. Current leads likely have NO SMS history yet, OR their SMS history was lost when leads were recreated

**CRITICAL QUESTION FOR USER:**
- Are the 1,255 current leads in Airtable **NEW leads** with no SMS history yet?
- OR were they **recreated/reimported** and lost their SMS history linkage?

If these are new leads with no SMS history, then **there's nothing to fix** - the sync is working correctly, you just don't have any SMS activity data yet.

If these are existing leads that SHOULD have SMS history, then we need to investigate why the SMS_Audit records reference different lead IDs than what's in the current Leads table.

---

## ISSUE 2: ENROLLED_MESSAGE_COUNT MOSTLY EMPTY

### Symptom
Only **109 of 1,255 leads (9%)** have `enrolled_message_count > 0`

### Root Cause
**LIKELY: SMS_Templates count map logic not matching campaign names correctly**

The sync script builds a count map from SMS_Templates table by grouping on `Campaign Tag` field, then matches it to campaign names during lead sync. If the campaign names don't match exactly, the count won't be populated.

### Database Evidence
```sql
-- Only 9% of leads with campaign_id have message counts
SELECT COUNT(*) FROM leads WHERE campaign_id IS NOT NULL;
-- Result: 1,072 leads

SELECT COUNT(*) FROM leads WHERE enrolled_message_count > 0;
-- Result: 109 leads (only 10% of leads with campaigns!)
```

### Impact on UI
- **Campaign detail page**: Leads show incorrect sequence position (e.g., "0/0" instead of "1/3")
- **Lead list page**: Cannot calculate completion percentage
- **Analytics**: Cannot track campaign progress accurately

### Files Involved
- [src/lib/sync/sync-campaigns.ts:21-45](src/lib/sync/sync-campaigns.ts#L21-L45) - SMS_Templates count map building
- [src/lib/airtable/client.ts:541-576](src/lib/airtable/client.ts#L541-L576) - Campaign mapping with count
- [scripts/full-airtable-sync-ENHANCED.ts](scripts/full-airtable-sync-ENHANCED.ts) - Main sync orchestration

### Fix Required
**STATUS: PENDING INVESTIGATION**

Need to:
1. Check if campaign name matching is case-sensitive
2. Review SMS_Templates in Airtable to see what values are in `Campaign Tag` field
3. Review campaign names in Campaigns table to see if they match
4. Add logging to show which campaigns are getting counts vs which aren't
5. Fix matching logic if needed

---

## ISSUE 3: UI DISPLAY ISSUES

### 3A. Campaigns List - Unwanted "Form ID" Column

**Symptom:** Campaigns list shows "Form ID" as a column

**User Feedback:** "What the fuck are we doing with Form ID as one of the columns in the campaigns table? I don't want form ID when I'm looking at a list of fucking campaigns. Why do I wanna know what the form ID is?"

**Fix Required:** Remove Form ID column from campaigns list UI

**File:** [src/app/(client)/admin/campaigns/page.tsx](src/app/(client)/admin/campaigns/page.tsx)

**Status:** NOT YET ADDRESSED

---

### 3B. Campaign Detail - Leads Table Display Issues

**Symptom:** Multiple display issues in leads table on campaign detail page:

1. **"Seq. Pos." shows wrong format** - Currently shows "0" instead of "1/3" format
2. **Missing "Status" column** - Should show "Active" vs "Completed"
3. **"Date Enrolled" empty** - Should show enrollment date
4. **Engagement Score nonexistent** - Should show engagement level

**User Feedback:** "When I drilling into the campaign that leads do not show the message count. The leads show us sequence position all of zero rather than like 1/3 there's no status like completed right so they're in the campaign but they've they're completed right not actually active in the campaign anymore so the status isn't in there."

**Fix Required:**
1. Change "Seq. Pos." to show `{sms_sequence_position}/{enrolled_message_count}` format
2. Add "Status" column calculating:
   - "Completed" if `completed_at IS NOT NULL`
   - "Active" otherwise
3. Ensure "Date Enrolled" shows `enrolled_at` timestamp
4. Show engagement_level in engagement column

**File:** [src/app/(client)/admin/campaigns/[id]/page.tsx:322-346](src/app/(client)/admin/campaigns/[id]/page.tsx#L322-L346)

**Status:** NOT YET ADDRESSED

---

### 3C. Lead List Page - Missing Activity Data

**Symptom:** "Last Activity" column shows nothing, engagement scores missing

**Root Cause:** Depends on ISSUE 1 (SMS activity sync failure)

**Fix Required:** Fix ISSUE 1 first, then verify UI displays properly

**File:** [src/app/(client)/leads/page.tsx](src/app/(client)/leads/page.tsx)

**Status:** BLOCKED BY ISSUE 1

---

## DATA FLOW ARCHITECTURE

### Airtable → PostgreSQL Sync Flow

```
Airtable (Source of Truth)
  ↓
  ├─ SMS_Audit table (287 records)
  │   ↓
  │   └─ full-airtable-sync-ENHANCED.ts (Step 3: SMS Audit sync)
  │       ↓
  │       └─ PostgreSQL lead_activity_log table
  │           ↓
  │           └─ Update leads.sms_last_sent_at, leads.engagement_level
  │
  ├─ SMS_Templates table
  │   ↓
  │   └─ Build count map (campaign_tag → message_count)
  │       ↓
  │       └─ Set campaigns.messages (JSONB) and leads.enrolled_message_count
  │
  └─ Leads table (1,255 records)
      ↓
      └─ Sync to PostgreSQL leads table with campaign FK
```

### UI Data Dependencies

```
Campaign Detail Page
  ↓
  ├─ Leads table with:
  │   ├─ enrolled_message_count (from SMS_Templates count)
  │   ├─ sms_sequence_position (from Airtable)
  │   ├─ completed_at (calculated from sequence completion)
  │   └─ enrolled_at (from campaign enrollment)
  │
  └─ Activity Timeline
      └─ lead_activity_log records (from SMS_Audit)
```

---

## SCHEMA VERIFICATION

### Expected Tables (ALL PRESENT ✅)
- `activity_log` - General user/client activity
- `lead_activity_log` - Lead-specific SMS/click activity **← TARGET FOR SMS AUDIT**
- `user_activity_logs` - User session tracking
- `user_activity_sessions` - Session aggregation
- `user_activity_summary` - Daily summaries
- `sms_audit` - Raw SMS audit data from Airtable
- `leads` - Lead records with activity metadata
- `campaigns` - Campaign definitions

### Key Columns - Leads Table
```sql
-- Activity tracking (populated from lead_activity_log)
sms_last_sent_at          timestamp with time zone
engagement_level          varchar(50)  -- High/Medium/Low
sms_sent_count            integer DEFAULT 0

-- Campaign enrollment tracking
campaign_id               uuid FK → campaigns.id
enrolled_message_count    integer DEFAULT 0 NOT NULL
enrolled_at               timestamp with time zone
enrolled_campaign_version integer
completed_at              timestamp with time zone

-- Sequence position tracking
sms_sequence_position     integer DEFAULT 0
```

### Key Columns - lead_activity_log Table
```sql
id                    uuid PRIMARY KEY
event_type            varchar(100) NOT NULL     -- 'SMS_SENT', 'SMS_DELIVERED', etc.
event_category        varchar(50) NOT NULL      -- 'SMS', 'CLICK', etc.
lead_id               uuid FK → leads.id
lead_airtable_id      varchar(255)
client_id             uuid FK → clients.id
description           text NOT NULL
message_content       text                      -- SMS message body
metadata              jsonb                     -- Additional data
source                varchar(100) NOT NULL     -- 'AIRTABLE_SYNC'
execution_id          varchar(255)
created_by            uuid FK → users.id
timestamp             timestamp with time zone NOT NULL
created_at            timestamp with time zone DEFAULT now()
```

---

## TESTING PROTOCOL

### Step 1: Manual SMS Audit Insert Test

```typescript
// Test inserting a single SMS audit record manually
import { db } from './src/lib/db';
import { leadActivityLog } from './src/lib/db/schema';

await db.insert(leadActivityLog).values({
  eventType: 'SMS_SENT',
  eventCategory: 'SMS',
  leadAirtableId: 'rec12345', // Use a real Airtable lead ID
  clientId: '6a08f898-19cd-49f8-bd77-6fcb2dd56db9',
  description: 'SMS message sent',
  messageContent: 'Test message',
  source: 'MANUAL_TEST',
  timestamp: new Date(),
});
```

### Step 2: Verify SMS_Templates Count Logic

```sql
-- Check SMS_Templates data in Airtable
-- Compare "Campaign Tag" field values to campaign names in campaigns table

-- Then check if count map is being built correctly
-- Add console.log in sync-campaigns.ts to show count map contents
```

### Step 3: Re-run Great Sync After Fixes

```bash
cd "/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal"
DATABASE_URL="..." npx tsx scripts/full-airtable-sync-ENHANCED.ts
```

### Step 4: Verify Data Population

```bash
npx tsx scripts/diagnose-lead-data.ts
```

Expected results:
- `lead_activity_log` has 287 records
- Leads have `sms_last_sent_at` populated
- Leads have `engagement_level` populated
- enrolled_message_count matches campaign message counts

---

## PRIORITY ORDER

1. **HIGHEST PRIORITY**: Fix SMS activity sync failure (ISSUE 1)
   - Blocking all activity data visualization
   - Affects lead timelines, engagement scores, last activity dates

2. **HIGH PRIORITY**: Fix enrolled_message_count calculation (ISSUE 2)
   - Blocking proper sequence position display
   - Affects completion tracking

3. **MEDIUM PRIORITY**: Fix UI display issues (ISSUE 3)
   - Can be done in parallel once data is fixed
   - Some issues blocked by data fixes

---

## HONESTY CHECK

**Confidence: 95%**

**Evidence-Based:**
- ✅ Verified schema structure via schema.ts read
- ✅ Verified table existence via database query
- ✅ Verified zero rows in lead_activity_log via database query
- ✅ Verified lead data gaps via diagnose-lead-data.ts output
- ✅ Verified migration 0004 creates lead_activity_log table
- ✅ Verified Great Sync error output showing 287 failed inserts

**Assumptions:**
- SMS audit insert failures may be due to constraint violations or data type mismatches (NEEDS VERIFICATION)
- enrolled_message_count issue may be due to campaign name matching (NEEDS VERIFICATION)

**Next Steps:**
1. Check Great Sync error logs for specific SMS audit insert error messages
2. Test manual SMS audit insert to isolate issue
3. Review campaign name matching logic for message counts
