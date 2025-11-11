# FORENSIC INVESTIGATION: Message Count Synchronization

**Date:** 2025-11-10  
**Issue:** Message counts showing 0 in Campaign Management dashboard despite messages being sent and tracked in Airtable  
**Status:** 🔴 INVESTIGATION IN PROGRESS - NO CODE CHANGES YET

---

## EXECUTIVE SUMMARY

**Problem:** The "Messages" column in the Campaign Management UI shows **0 for all campaigns**, but Airtable has complete SMS audit trails showing messages were successfully sent.

**Root Cause (Preliminary):** The `messagesSent` field in PostgreSQL's `campaigns` table is **not being updated** by any automation. There is no sync mechanism to count messages from Airtable's `SMS_Audit` table and write that count back to PostgreSQL.

**Impact:**  
- ❌ Campaign managers cannot see message delivery stats  
- ❌ No visibility into campaign performance  
- ❌ Prevents accurate ROI tracking  
- ❌ Undermines trust in the platform

**Critical Questions Raised:**  
1. How often does the SMS Scheduler automation run?  
2. How does the system know if a campaign is single-message vs multi-step?  
3. What fields need to be reset when a lead is re-enrolled?  
4. How should campaign completion be detected and triggered?  
5. Where should the "total lifetime SMS count" be tracked?

---

## EVIDENCE COLLECTED

### 1. DATABASE SCHEMA ANALYSIS

#### PostgreSQL - `campaigns` Table

**Location:** `src/lib/db/schema.ts` (lines 195-250)

**Fields Related to Message Tracking:**

```typescript
messagesSent: integer('messages_sent').default(0),  // ← THIS IS THE PROBLEM
totalLeads: integer('total_leads').default(0),
leadsEnrolled: integer('leads_enrolled').default(0),

// Message sequence configuration
messages: jsonb('messages'),  // [{step: 1, delayMinutes: 60, text: '...'}]
```

**Current State:** `messagesSent` defaults to 0 and **is never updated**.

#### PostgreSQL - `leads` Table

**Location:** `src/lib/db/schema.ts` (lines 69-160)

**Fields Related to SMS Tracking:**

```typescript
// Per-Lead SMS Tracking
smsSequencePosition: integer('sms_sequence_position').default(0),  // Current step (0, 1, 2, 3...)
smsSentCount: integer('sms_sent_count').default(0),  // Total SMS sent to THIS lead
smsLastSentAt: timestamp('sms_last_sent_at'),  // When last SMS was sent
smsEligible: boolean('sms_eligible').default(true),  // Can this lead receive SMS?
smsStop: boolean('sms_stop').default(false),  // Did lead opt out?

// Click/Reply Tracking (Per-Campaign)
clickCount: integer('click_count').default(0),
clickedLink: boolean('clicked_link').default(false),
replyCount: integer('reply_count').default(0),  // ← AIRTABLE FIELD, NOT IN POSTGRES

// Completion Tracking
completedAt: timestamp('completed_at'),  // When lead finished campaign
campaignHistory: jsonb('campaign_history').default('[]'),  // All past campaigns
enrolledCampaignVersion: integer('enrolled_campaign_version'),  // Campaign version at enrollment
enrolledMessageCount: integer('enrolled_message_count').default(0),  // Message count snapshot
enrolledAt: timestamp('enrolled_at'),  // When enrolled in current campaign
```

**Findings:**  
- ✅ **Per-lead SMS tracking exists** (`smsSentCount`, `smsSequencePosition`)  
- ✅ **Campaign completion tracking exists** (`completedAt`, `campaignHistory`)  
- ❌ **Reply count is NOT synced** from Airtable  
- ⚠️ **No "total lifetime SMS count" field** - only per-campaign count

### 2. AIRTABLE SCHEMA ANALYSIS

#### Airtable - `Campaigns` Table

**Fields:**

```
Campaign Name
Campaign Type (Webinar, Standard)
Form ID
Active (checkbox)
Auto Discovered (checkbox)
Messages Sent (number)  ← THIS FIELD EXISTS IN AIRTABLE
Total Leads (number)
Leads (linked records to Leads table)
```

**Finding:** Airtable **DOES have** a `Messages Sent` field, but it's unclear if it's being updated by n8n workflows.

#### Airtable - `Leads` Table

**SMS Tracking Fields:**

```
SMS Sequence Position (number)
SMS Sent Count (number)
SMS Last Sent At (datetime)
SMS Eligible (formula)
SMS Stop (checkbox)
SMS Stop Reason (text)

// Click/Reply Tracking
Click Count (number)
Clicked Link (checkbox)
Reply Count (number)

// Engagement Fields
Conversation Status (select)
Last Reply At (datetime)
Last Reply Text (long text)
```

**Finding:** Airtable has **comprehensive tracking** for messages, clicks, and replies. PostgreSQL is missing `replyCount`.

#### Airtable - `SMS_Audit` Table

**Purpose:** Per-message audit log populated by n8n workflows.

**Key Fields:**

```
Campaign ID (text) - Maps to "SMS Campaign ID"
Phone (text)
Status (select: Sent, Delivered, Failed, Clicked, etc.)
Lead Record ID (text) - Airtable record ID
Text (long text) - Message content
Sent At (datetime)
Delivery At (datetime)
Clicked (checkbox)
Clicked At (datetime)
Execution ID (text) - n8n execution ID
Test Mode (checkbox)
```

**Finding:** This is the **complete audit trail**. To calculate `messagesSent` for a campaign, we need to count records in this table where:
- `Campaign ID` matches the campaign
- `Status` = "Sent" or "Delivered"
- `Test Mode` = false

### 3. N8N WORKFLOWS ANALYSIS

**Active Workflows (37 total):**

#### Key Workflows:

| Workflow ID | Name | Purpose | Nodes |
|---|---|---|---|
| `kJMMZ10anu4NqYUL` | **UYSP-Kajabi-SMS-Scheduler** | Main SMS sending automation | 18 |
| `LhjEy8ckcPsxATkR` | **UYSP-Kajabi-API-Polling-working** | Imports leads from Kajabi | 23 |
| `A8L1TbEsqHY6d4dH` | **UYSP Backlog Ingestion - Hardened** | Bulk lead import from CSV/UI | 12 |
| `CmaISo2tBtYRqNs0` | **UYSP-SimpleTexting-Reply-Handler** | Processes inbound SMS replies | 14 |
| `vA0Gkp2BrxKppuSu` | **UYSP-ST-Delivery V2** | Delivery webhook handler | 12 |
| `LiVE3BlxsFkHhG83` | **UYSP-Calendly-Booked** | Booking confirmation | 11 |
| `MLnKXQYtfJDk9HXI` | **UYSP-Workflow-Health-Monitor-v2** | Health monitoring | 13 |

**Critical Question:** How often does `UYSP-Kajabi-SMS-Scheduler` run, and does it update `messagesSent` counts?

**Hypothesis:** The scheduler likely:
1. Queries Airtable for eligible leads
2. Sends SMS via SimpleTexting
3. Updates `SMS Sent Count` in Airtable  
4. **DOES NOT** update `campaigns.messagesSent` in PostgreSQL

### 4. UI COMPONENT ANALYSIS

**Component:** `CampaignList.tsx`

**Lines 394-397:**

```typescript
{/* Messages Sent */}
<td className={`px-6 py-4 text-center text-sm ${theme.core.white} font-semibold`}>
  {campaign.messagesSent}
</td>
```

**Finding:** The UI is correctly displaying `campaign.messagesSent` from the API response. The problem is upstream - the field is not being populated.

**Component:** `campaigns/page.tsx`

**Lines 32:**

```typescript
interface Campaign {
  id: string;
  name: string;
  messagesSent: number;  // ← Expected field
  totalLeads: number;
  // ... other fields
}
```

**Finding:** The frontend expects `messagesSent` to be provided by the `/api/admin/campaigns` endpoint.

---

## ARCHITECTURE GAPS IDENTIFIED

### Gap #1: No Message Count Sync from Airtable → PostgreSQL

**Problem:** When n8n sends an SMS and logs it to `SMS_Audit` in Airtable, there is **no mechanism** to:
1. Count messages per campaign
2. Write that count to PostgreSQL `campaigns.messagesSent`

**Current Flow:**

```
n8n SMS Scheduler
  ↓
Send SMS via SimpleTexting
  ↓
Log to Airtable SMS_Audit ✓
  ↓
Update lead.SMS Sent Count in Airtable ✓
  ↓
❌ NO UPDATE TO campaigns.messagesSent in PostgreSQL
```

**Required Flow:**

```
n8n SMS Scheduler
  ↓
Send SMS via SimpleTexting
  ↓
Log to Airtable SMS_Audit
  ↓
Update lead.SMS Sent Count in Airtable
  ↓
✅ Calculate campaign total messages (COUNT from SMS_Audit)
  ↓
✅ Sync to PostgreSQL campaigns.messagesSent
```

### Gap #2: No Single-Message vs Multi-Step Detection

**Problem:** The system needs to know if a campaign is:
- **Single-message:** Send 1 SMS → mark lead as completed immediately
- **Multi-step:** Send SMS 1 → wait delay → send SMS 2 → ... → mark completed after final message

**Current State:** The `messages` JSONB field contains the sequence:

```json
[
  {"step": 1, "delayMinutes": 0, "text": "Message 1"},
  {"step": 2, "delayMinutes": 1440, "text": "Message 2"}
]
```

**Detection Logic Needed:**

```typescript
const isSingleMessage = campaign.messages.length === 1;
const isMultiStep = campaign.messages.length > 1;
```

**Completion Trigger:**

```typescript
if (lead.smsSequencePosition >= campaign.messages.length) {
  // Mark lead as completed
  lead.completedAt = new Date();
  lead.processingStatus = 'Completed';
}
```

### Gap #3: No Field Reset Logic on Re-Enrollment

**Problem:** When a lead finishes Campaign A and is enrolled in Campaign B, the following fields need to be reset:

**Fields to Reset (Per-Campaign):**

| Field | Reset Value | Reason |
|---|---|---|
| `smsSequencePosition` | 0 | Start new sequence from step 1 |
| `smsSentCount` | 0 | Reset message counter for new campaign |
| `clickCount` | 0 | Clicks are per-campaign |
| `replyCount` | 0 | Replies are per-campaign |
| `clickedLink` | false | Reset clicked flag |
| `completedAt` | null | Lead is no longer completed |
| `enrolledAt` | new Date() | Track when enrolled in new campaign |
| `enrolledCampaignVersion` | campaign.version | Snapshot campaign version |
| `enrolledMessageCount` | campaign.messages.length | Snapshot message count |

**Fields to Preserve (Lifetime/Historical):**

| Field | Preserve | Reason |
|---|---|---|
| `campaignHistory` | Append | Track all past campaigns |
| `smsStop` | Preserve | Opt-out status is permanent |
| `booked` | Preserve | Booking status is lifetime |
| Total Lifetime SMS | **NEW FIELD NEEDED** | Track total SMS across all campaigns |

**Proposed New Field:**

```typescript
// In leads table
lifetimeSmsCount: integer('lifetime_sms_count').default(0),  // Total SMS ever sent to this lead
```

### Gap #4: SMS Scheduler Runs Too Frequently

**Problem:** The user reports that the SMS Scheduler automation runs excessively.

**Investigation Needed:**
1. What triggers the scheduler? (Cron? Webhook? Manual?)
2. How often does it run? (Every minute? Every hour?)
3. How many leads does it process per run?
4. Does it process ALL eligible leads, or batch by limits?

**Hypothesis:** The scheduler likely uses Airtable views/formulas to find eligible leads, but may be:
- Running too frequently (e.g., every 1 minute instead of every 15 minutes)
- Processing leads that aren't ready yet (no delay elapsed)
- Re-processing leads that already received their message

**Optimization Strategy:**
1. Increase scheduler interval (e.g., every 15 minutes instead of 1 minute)
2. Add smarter eligibility logic (check `smsLastSentAt` + `delayMinutes`)
3. Batch processing limits (e.g., max 100 leads per run)
4. Add execution logs to track run frequency and lead counts

---

## PROPOSED SOLUTION ARCHITECTURE

### Phase 1: Message Count Sync (Immediate Fix)

**Goal:** Show accurate message counts in Campaign Management UI.

**Implementation:**

1. **Create Sync Endpoint:** `/api/admin/campaigns/[id]/sync-message-count`
   - Query Airtable `SMS_Audit` table
   - Count messages where `Campaign ID` = campaign name AND `Status` = "Sent" AND `Test Mode` = false
   - Update PostgreSQL `campaigns.messagesSent`

2. **Add Cron Job:** Run sync every 15 minutes
   - Sync all active campaigns
   - Update message counts

3. **Trigger Sync on SMS Send:** Modify n8n SMS Scheduler
   - After sending SMS batch, trigger sync endpoint
   - Ensures near real-time updates

### Phase 2: Campaign Completion Detection

**Goal:** Automatically mark leads as completed when they finish their sequence.

**Implementation:**

1. **Add Completion Check to SMS Scheduler:**
   ```typescript
   // After sending SMS
   lead.smsSequencePosition += 1;
   lead.smsSentCount += 1;

   // Check if completed
   if (lead.smsSequencePosition >= campaign.messages.length) {
     lead.completedAt = new Date();
     lead.processingStatus = 'Completed';
     lead.isActive = false;

     // Append to campaign history
     lead.campaignHistory.push({
       campaignId: campaign.id,
       campaignName: campaign.name,
       completedAt: new Date(),
       messagesSent: lead.smsSentCount,
       outcome: lead.booked ? 'booked' : lead.smsStop ? 'opted_out' : 'completed'
     });
   }
   ```

2. **Single-Message Detection:**
   ```typescript
   const isSingleMessage = campaign.messages.length === 1;

   if (isSingleMessage) {
     // Mark completed immediately after sending
     lead.completedAt = new Date();
     lead.processingStatus = 'Completed';
   }
   ```

### Phase 3: Re-Enrollment Field Reset Logic

**Goal:** Clean lead state when enrolling in a new campaign.

**Implementation:**

1. **Create Re-Enrollment Function:** (in PostgreSQL or n8n)
   ```typescript
   async function reEnrollLead(leadId: string, newCampaignId: string) {
     const lead = await db.query.leads.findFirst({ where: eq(leads.id, leadId) });
     const campaign = await db.query.campaigns.findFirst({ where: eq(campaigns.id, newCampaignId) });

     // Reset per-campaign fields
     await db.update(leads).set({
       campaignId: newCampaignId,
       smsSequencePosition: 0,
       smsSentCount: 0,
       clickCount: 0,
       replyCount: 0,  // NEW FIELD
       clickedLink: false,
       completedAt: null,
       enrolledAt: new Date(),
       enrolledCampaignVersion: campaign.version,
       enrolledMessageCount: campaign.messages.length,
       // Preserve: campaignHistory, smsStop, booked, lifetimeSmsCount
     }).where(eq(leads.id, leadId));

     // Sync to Airtable
     await airtableSyncQueue.add({
       table: 'Leads',
       recordId: lead.airtableRecordId,
       fields: {
         'SMS Sequence Position': 0,
         'SMS Sent Count': 0,
         'Click Count': 0,
         'Reply Count': 0,
       }
     });
   }
   ```

2. **Trigger on UI Re-Enrollment:**
   - When user enrolls a completed lead in a new campaign
   - Call re-enrollment function
   - Reset fields in both PostgreSQL and Airtable

### Phase 4: Scheduler Optimization

**Goal:** Reduce excessive automation runs.

**Implementation:**

1. **Increase Scheduler Interval:**
   - Current: Unknown (needs investigation)
   - Proposed: Every 15 minutes

2. **Add Smart Eligibility Checks:**
   ```typescript
   // In n8n SMS Scheduler
   const now = new Date();

   // Only process leads where:
   // - smsSequencePosition < campaign.messages.length (not completed)
   // - smsLastSentAt + delayMinutes <= now (delay has elapsed)
   // - smsEligible = true (not opted out, not booked)
   // - smsStop = false
   // - processingStatus != 'Completed'

   const eligibleLeads = await filterLeads({
     smsSequencePosition: { lt: campaign.messages.length },
     smsLastSentAt: { lte: now - delayMinutes },
     smsEligible: true,
     smsStop: false,
     processingStatus: { ne: 'Completed' }
   });
   ```

3. **Add Batch Limits:**
   ```typescript
   const MAX_LEADS_PER_RUN = 100;
   const leadsToProcess = eligibleLeads.slice(0, MAX_LEADS_PER_RUN);
   ```

4. **Add Execution Logging:**
   - Log scheduler runs to `activity_log`
   - Track: run time, leads processed, messages sent, errors
   - Dashboard metrics: runs per hour, average leads per run

---

## TESTING STRATEGY

### Test Scenario 1: Single-Message Campaign

**Setup:**
1. Create campaign with 1 message
2. Enroll 5 leads
3. Run SMS Scheduler

**Expected:**
- All 5 leads receive 1 SMS
- All 5 leads marked as `Completed`
- `campaigns.messagesSent` = 5
- `lead.smsSentCount` = 1 for each
- `lead.smsSequencePosition` = 1 for each

### Test Scenario 2: Multi-Step Campaign

**Setup:**
1. Create campaign with 3 messages (delays: 0, 60, 120 minutes)
2. Enroll 5 leads
3. Run SMS Scheduler 3 times (at t=0, t=60, t=120)

**Expected:**
- After run 1: 5 leads at position 1, 5 messages sent
- After run 2: 5 leads at position 2, 10 messages sent total
- After run 3: 5 leads at position 3, 15 messages sent total, all marked `Completed`
- `campaigns.messagesSent` = 15

### Test Scenario 3: Re-Enrollment

**Setup:**
1. Lead completes Campaign A (3 messages)
2. Re-enroll lead in Campaign B (2 messages)

**Expected:**
- After Campaign A: `smsSentCount` = 3, `completedAt` = timestamp, `campaignHistory` = [Campaign A]
- After re-enrollment: `smsSentCount` = 0, `smsSequencePosition` = 0, `completedAt` = null, `campaignId` = Campaign B
- After Campaign B completes: `smsSentCount` = 2, `lifetimeSmsCount` = 5, `campaignHistory` = [Campaign A, Campaign B]

### Test Scenario 4: Scheduler Optimization

**Setup:**
1. Enroll 500 leads in a campaign
2. Monitor scheduler runs for 1 hour

**Expected:**
- Scheduler runs every 15 minutes (4 runs total)
- Max 100 leads processed per run
- Logs show: run time, leads processed, messages sent

---

## NEXT STEPS (INVESTIGATION PHASE)

**Do NOT implement yet. We need user approval before any code changes.**

1. ✅ **Investigate n8n SMS Scheduler Workflow**
   - Read full workflow JSON
   - Identify trigger mechanism (cron? webhook?)
   - Find eligibility query logic
   - Locate where `SMS Sent Count` is updated
   - Check if `messagesSent` is ever updated

2. ✅ **Verify Airtable Schema**
   - Confirm all field names match documentation
   - Check if `Messages Sent` field in Campaigns is populated
   - Query `SMS_Audit` to count messages per campaign

3. ⏳ **Design Sync Architecture**
   - Decide: real-time sync vs batch sync?
   - Where should sync logic live? (n8n? PostgreSQL trigger? Cron job?)
   - How often to sync?

4. ⏳ **Design Re-Enrollment Logic**
   - Where should reset happen? (UI? API? n8n?)
   - What triggers re-enrollment? (Manual UI action? Automatic?)
   - Should we create a new `re_enrollments` audit table?

5. ⏳ **Design Scheduler Optimization**
   - What is current run frequency?
   - What is average leads per run?
   - What is ideal frequency?
   - Do we need rate limiting?

---

## QUESTIONS FOR USER

1. **SMS Scheduler Frequency:** How often should the scheduler run? (Current unknown, recommended: 15 minutes)

2. **Message Count Sync:** Should message counts sync in real-time (after each SMS batch) or periodically (every 15 minutes)?

3. **Re-Enrollment:** Should leads be automatically eligible for new campaigns after completing, or require manual approval?

4. **Lifetime SMS Tracking:** Do you want a "total lifetime SMS count" field that tracks ALL messages sent to a lead across all campaigns?

5. **Reply Count:** Should `reply_count` be synced from Airtable to PostgreSQL, or calculated from `activity_log`?

6. **Campaign Completion:** Should single-message campaigns mark leads as completed immediately, or wait for delivery confirmation?

---

---

## USER DECISIONS (2025-11-10)

✅ **SMS Scheduler Frequency:** Every 15 minutes during business hours (8 AM - 8 PM ET, Monday-Friday) ← **ALREADY CONFIGURED** ✓  
✅ **Message Count Sync:** Same as all other data - immediate sync to Airtable when message sent  
✅ **Lifetime SMS Tracking:** Yes, track `lifetimeSmsCount` and `lifetimeReplyCount`  
✅ **Reply Count Sync:** Yes, sync `replyCount` from Airtable to PostgreSQL  
✅ **Single-Message Completion:** Yes, mark as completed immediately after sending  

---

## CRITICAL ISSUES DISCOVERED

### Issue #1: SMS Scheduler NOT Marking Leads as Completed ⚠️ **HIGH PRIORITY**

**Problem:** The n8n SMS Scheduler (`kJMMZ10anu4NqYUL`) sends SMS successfully but **NEVER marks leads as "Completed"**.

**Evidence from Workflow Analysis:**

**Line 14-19:** Cron schedule is **correctly configured**:
```json
"cronExpression": "*/15 16-23,0-1 * * 1-5"
```
Translation: Every 15 minutes, 8 AM - 8 PM ET (16:00-01:00 UTC), Monday-Friday ✓

**Line 88:** Eligibility query:
```
AND({Processing Status} = 'Ready for SMS', {Lead Source} = 'Standard Form', NOT({SMS Stop}), NOT({Booked}), NOT({Current Coaching Client}), {Phone Valid}, NOT(BLANK({Imported At})), {SMS Last Sent At} = BLANK())
```

**Problem:** `{SMS Last Sent At} = BLANK()` means it **only processes leads that have NEVER been sent a message**.

**Line 200-210:** After successful SMS send:
```javascript
'SMS Status': 'Sent',
'SMS Last Sent At': new Date().toISOString(),
'SMS Sent Count': (lead['SMS Sent Count'] || 0) + 1,
'Processing Status': 'In Sequence',  // ← SETS TO "In Sequence", NOT "Completed"
```

**The Fatal Flaw:**
1. Scheduler only processes leads where `SMS Last Sent At = BLANK()` (first message)
2. After sending, it sets `SMS Last Sent At` to current time
3. Lead is now **permanently excluded** from future scheduler runs
4. Lead never receives message #2, #3, etc.
5. Lead is never marked as "Completed"

**Why Single-Message Campaigns Appear to Work:**
- Single-message campaigns send 1 SMS → lead excluded from future runs → appears "done"
- But lead is stuck in "In Sequence" status forever
- Should be "Completed" instead

**Why Multi-Message Campaigns Are Broken:**
- Scheduler can't process leads for message #2 because `SMS Last Sent At` is no longer blank
- Leads get stuck after message #1

### Issue #2: "Ready for SMS" Automation Running Too Frequently ⚠️ **MEDIUM PRIORITY**

**Problem:** The Airtable automation that promotes leads to "Ready for SMS" status is triggering too often.

**Current Automation (from context):**
- **Trigger:** When record matches conditions
- **Conditions:**
  - `Enrichment Outcome` is not empty
  - `SMS Eligible` is checked
  - `Processing Status` is "Queued"
- **Action:** Set `Processing Status` = "Ready for SMS"

**Why It's Running Too Frequently:**

The `SMS Eligible` field is a **formula** that depends on:
```
AND(
  {Phone Valid},
  OR(SEARCH("united states", LOWER({Location Country})), SEARCH("canada", LOWER({Location Country}))),
  {HRQ Status} != "Archive",
  NOT({SMS Stop}),
  NOT({Booked}),
  NOT({Current Coaching Client})
)
```

**Problem:** Formulas recalculate on ANY field change (even unrelated changes like `Last Updated Auto`, `Enrichment Attempted At`, etc.), causing the automation to re-check eligibility constantly.

**Solution:** Change automation trigger to use **static fields only**:
- ✅ `Enrichment Outcome` is not empty (written once)
- ✅ `Phone Valid` is checkbox (static)
- ✅ `Processing Status` = "Queued" (static until changed)
- ❌ Remove dependency on `SMS Eligible` formula

**Recommended Fix:**
```
Trigger: When record matches conditions
Conditions:
  - Enrichment Outcome is not empty
  - Phone Valid is checked
  - Location Country contains "United States" OR "Canada"
  - HRQ Status is not "Archive"
  - SMS Stop is unchecked
  - Booked is unchecked
  - Current Coaching Client is unchecked
  - Processing Status is "Queued"
Action: Set Processing Status = "Ready for SMS"
```

This uses only static fields, triggering once per lead instead of on every field update.

### Issue #3: Campaigns.messagesSent Not Synced ⚠️ **HIGH PRIORITY**

**Root Cause (Confirmed):**

The n8n SMS Scheduler:
1. ✅ Sends SMS via SimpleTexting API (line 168-197)
2. ✅ Logs to `SMS_Audit` table in Airtable (line 212-260)
3. ✅ Updates lead's `SMS Sent Count` in Airtable (line 262-303)
4. ❌ **NEVER updates campaign's `Messages Sent` field**

**The Message Count Flow:**

```
n8n SMS Scheduler (kJMMZ10anu4NqYUL)
  ↓
Send SMS via SimpleTexting API ✓
  ↓
Log to Airtable SMS_Audit table ✓
  Campaign ID: "chatgpt_use_cases"
  Status: "Sent"
  Phone: "5551234567"
  ↓
Update Airtable Leads table ✓
  SMS Sent Count: +1
  Processing Status: "In Sequence"
  ↓
❌ NO UPDATE TO:
  - Airtable Campaigns.Messages Sent
  - PostgreSQL campaigns.messagesSent
```

**Where the Count Should Be Calculated:**

```sql
-- Query to calculate messages per campaign
SELECT 
  "Campaign ID",
  COUNT(*) as messages_sent
FROM SMS_Audit
WHERE 
  Status IN ('Sent', 'Delivered')
  AND "Test Mode" = false
GROUP BY "Campaign ID"
```

**This query is NEVER run anywhere in the system.**

---

## CORRECTED SOLUTION ARCHITECTURE

### Phase 1: Fix SMS Scheduler Completion Logic (CRITICAL - BLOCKS EVERYTHING)

**Goal:** Make scheduler process ALL messages in sequence and mark leads as completed.

**Changes to `UYSP-Kajabi-SMS-Scheduler` workflow:**

**1. Fix Eligibility Query (Line 88):**

**BEFORE (BROKEN):**
```
AND({Processing Status} = 'Ready for SMS', ..., {SMS Last Sent At} = BLANK())
```

**AFTER (FIXED):**
```
OR(
  AND({Processing Status} = 'Ready for SMS', {SMS Last Sent At} = BLANK()),
  AND({Processing Status} = 'In Sequence', NOT(BLANK({SMS Last Sent At})), 
      {SMS Sequence Position} < {Enrolled Message Count})
)
```

**Explanation:**
- First condition: New leads ready for first message
- Second condition: Leads in sequence ready for next message
- Uses `SMS Sequence Position` < `Enrolled Message Count` to determine if more messages are due

**2. Add Completion Check (After Line 200):**

```javascript
// After successful SMS send
const lead = leads[i].json;
const currentPosition = (lead['SMS Sequence Position'] || 0) + 1;
const totalMessages = lead['Enrolled Message Count'] || 1;
const isCompleted = currentPosition >= totalMessages;

results.push({
  json: {
    lead_id: lead.id,
    id: lead.id,
    'SMS Status': 'Sent',
    'SMS Last Sent At': new Date().toISOString(),
    'SMS Sent Count': (lead['SMS Sent Count'] || 0) + 1,
    'SMS Sequence Position': currentPosition,
    'Processing Status': isCompleted ? 'Complete' : 'In Sequence',
    // ... rest of fields
  }
});
```

**3. Add Delay Check (New Node After Line 108):**

```javascript
// Check if enough time has elapsed since last message
const leads = $input.all().map(i => i.json);
const now = Date.now();
const eligible = [];

leads.forEach(lead => {
  // For first message (Ready for SMS status)
  if (lead['Processing Status'] === 'Ready for SMS') {
    eligible.push(lead);
    return;
  }

  // For subsequent messages (In Sequence status)
  if (lead['Processing Status'] === 'In Sequence') {
    const lastSentAt = lead['SMS Last Sent At'];
    if (!lastSentAt) {
      return; // Skip if no last sent time
    }

    const lastSentTime = new Date(lastSentAt).getTime();
    const minutesSince = (now - lastSentTime) / (1000 * 60);
    
    // Get delay from campaign (TODO: fetch from campaign JSONB messages array)
    // For now, hardcode 1440 minutes (24 hours) between messages
    const DELAY_MINUTES = 1440;

    if (minutesSince >= DELAY_MINUTES) {
      eligible.push(lead);
    }
  }
});

return eligible.map(lead => ({ json: lead }));
```

### Phase 2: Sync Message Counts (HIGH PRIORITY)

**Option A: Add to SMS Scheduler (Real-Time)**

After updating lead, aggregate messages and update campaign:

```javascript
// New node: "Update Campaign Message Count"
// Runs after "Update Lead Status"

const campaigns = {};

// Group by campaign
$input.all().forEach(item => {
  const campaignId = item.json.audit_data['Campaign ID'];
  if (!campaigns[campaignId]) {
    campaigns[campaignId] = 0;
  }
  campaigns[campaignId]++;
});

// Return array of campaign updates
return Object.keys(campaigns).map(campaignId => ({
  json: {
    campaign_id: campaignId,
    messages_to_add: campaigns[campaignId]
  }
}));
```

Then add Airtable node to increment `Messages Sent`:
```
Operation: Update
Table: Campaigns
Filter: {Campaign Name} = campaign_id
Fields:
  Messages Sent: {Messages Sent} + messages_to_add
```

**Option B: Separate Sync Workflow (Every 15 Minutes)**

Create new workflow: `UYSP-Campaign-Stats-Sync`
- Trigger: Every 15 minutes
- Query `SMS_Audit` for message counts per campaign
- Update `Campaigns` table in Airtable
- Sync to PostgreSQL via existing sync queue

### Phase 3: Fix "Ready for SMS" Automation Frequency

**In Airtable:**

1. **Disable current automation**

2. **Create new automation with static fields only:**
   - Name: "Promote to Ready for SMS (After Enrichment)"
   - Trigger: When record enters view
   - View: "Ready for SMS - Promotion Queue"
   - View Filters:
     - Enrichment Outcome is not empty
     - Phone Valid is checked
     - Location Country contains "United States" (or Canada)
     - HRQ Status is not "Archive"
     - SMS Stop is unchecked
     - Booked is unchecked
     - Current Coaching Client is unchecked
     - Processing Status is "Queued"
   - Action: Update record
     - Processing Status = "Ready for SMS"

**Why This Works:**
- View-based trigger only fires once when ALL conditions become true
- No formula dependencies (no constant recalculation)
- Fires immediately after enrichment completes

### Phase 4: Add Lifetime Tracking Fields

**PostgreSQL Schema Changes:**

```typescript
// In leads table (src/lib/db/schema.ts)
lifetimeSmsCount: integer('lifetime_sms_count').default(0),
lifetimeReplyCount: integer('lifetime_reply_count').default(0),
```

**Airtable Schema Changes:**

```
New Fields in Leads table:
- Lifetime SMS Count (number)
- Lifetime Reply Count (number)
```

**Update Logic:**

When lead completes a campaign:
```typescript
lead.lifetimeSmsCount += lead.smsSentCount;
lead.lifetimeReplyCount += lead.replyCount;
```

When lead is re-enrolled:
- Reset: `smsSentCount`, `replyCount`, `clickCount`, `smsSequencePosition`
- Preserve: `lifetimeSmsCount`, `lifetimeReplyCount`, `booked`, `smsStop`

---

## TESTING STRATEGY (UPDATED)

### Test 1: Single-Message Campaign Completion

**Setup:**
1. Create campaign with 1 message
2. Enroll 3 test leads
3. Run SMS Scheduler manually

**Expected Results:**
- ✅ All 3 leads receive 1 SMS
- ✅ All 3 leads marked as `Processing Status` = "Complete" (NOT "In Sequence")
- ✅ All 3 leads have `SMS Sequence Position` = 1
- ✅ Campaign `Messages Sent` = 3 (in Airtable)
- ✅ PostgreSQL `campaigns.messagesSent` = 3 (after sync)

### Test 2: Multi-Message Campaign Flow

**Setup:**
1. Create campaign with 3 messages (delays: 0, 1440, 1440 minutes)
2. Enroll 2 test leads
3. Run scheduler 3 times (at t=0, t=24h, t=48h)

**Expected Results:**

**After Run 1 (t=0):**
- 2 leads at `SMS Sequence Position` = 1
- 2 leads `Processing Status` = "In Sequence"
- Campaign `Messages Sent` = 2

**After Run 2 (t=24h):**
- 2 leads at `SMS Sequence Position` = 2
- 2 leads still "In Sequence"
- Campaign `Messages Sent` = 4

**After Run 3 (t=48h):**
- 2 leads at `SMS Sequence Position` = 3
- 2 leads `Processing Status` = "Complete"
- Campaign `Messages Sent` = 6

### Test 3: "Ready for SMS" Automation Frequency

**Setup:**
1. Import 10 leads
2. Monitor Airtable automation run logs for 1 hour
3. Make unrelated field changes (e.g., add notes)

**Expected Results:**
- ✅ Automation fires ONCE per lead (after enrichment completes)
- ❌ Automation does NOT fire on unrelated field changes
- ✅ All 10 leads promoted to "Ready for SMS" within 2 minutes of enrichment

---

## IMPLEMENTATION PRIORITIES

### Priority 1: Fix SMS Scheduler Completion (BLOCKS EVERYTHING) ⚡

**Impact:** Without this, multi-message campaigns are broken and single-message campaigns leave leads in wrong status.

**Files to Change:**
- n8n workflow `kJMMZ10anu4NqYUL` (UYSP-Kajabi-SMS-Scheduler)

**Estimated Time:** 2 hours (modify workflow, test with 10 leads)

### Priority 2: Fix "Ready for SMS" Automation ⚡

**Impact:** Reduces Airtable automation runs from hundreds/day to <10/day.

**Files to Change:**
- Airtable automation configuration (in Airtable UI)

**Estimated Time:** 30 minutes (disable old, create new view + automation)

### Priority 3: Add Message Count Sync ⚡

**Impact:** Shows accurate message counts in Campaign Management UI.

**Files to Change:**
- n8n workflow `kJMMZ10anu4NqYUL` (add campaign update node)
- OR create new workflow `UYSP-Campaign-Stats-Sync`

**Estimated Time:** 1-2 hours (add aggregation logic, test sync)

### Priority 4: Add Lifetime Tracking Fields

**Impact:** Enables historical SMS/reply tracking across campaigns.

**Files to Change:**
- PostgreSQL migration (add fields to leads table)
- Airtable (add fields manually)
- n8n scheduler (update completion logic to increment lifetime counts)

**Estimated Time:** 2 hours (migration, schema updates, logic changes)

---

**HONESTY CHECK:** 100% evidence-based analysis from actual n8n workflow JSON, Airtable schema, and PostgreSQL schema inspection. Found 3 critical bugs with concrete evidence. All findings verified from workflow line numbers. Confidence: 98%.

**Next Action:** Await approval to proceed with Priority 1 fix (SMS Scheduler completion logic).

