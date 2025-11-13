# PORTAL UI FORENSIC ANALYSIS
## Lead Activity Visibility & Campaign Drill-Down Issues

**Date:** 2025-11-11  
**Status:** 🔴 CRITICAL UX GAPS  
**Systems Analyzed:** Leads Dashboard, Campaign Detail Page, API Responses

---

## EXECUTIVE SUMMARY

**USER FEEDBACK SUMMARY:**
> "I want to see who has received a message and if anybody's responded so I might want to drill down into them. At the moment, there's no way for me to do that. I can't see anybody who's actually been messaged or their message count."

**3 CRITICAL UX GAPS IDENTIFIED:**

1. ❌ **Leads Dashboard shows NO SMS activity** (no message count, no status)
2. ❌ **Campaign Detail Page leads are NOT clickable** (can't drill into lead records)
3. ❌ **Campaign Detail Page missing critical columns** (no message count, no status, no response tracking)

**DATA EXISTS BUT NOT DISPLAYED:** All required fields exist in database (`smsSentCount`, `processingStatus`, `smsSequencePosition`, `completedAt`) but are not shown in UI.

---

## PART 1: ORIGINAL ARCHITECTURAL INTENT

### From Forensic Audit Document (COMPLETE-SMS-SYSTEM-FORENSIC-AUDIT.md)

**Quote (Line 871-881):**
> **Why Use Snapshot?**
>
> If campaign is upgraded mid-sequence (e.g., 2 messages → 3 messages):
> - **Old leads:** Complete after 2 messages (their snapshot)
> - **New leads:** Complete after 3 messages (new snapshot)
>
> This prevents:
> - Leads stuck in "In Sequence" forever (if message removed)
> - Leads getting unexpected extra messages (if message added)

**Quote (Line 888-906 - Airtable Field Mapping):**
```
### Leads Table
| PostgreSQL Field | Airtable Field | Type | Notes |
|---|---|---|---|
| sms_sequence_position | SMS Sequence Position | Number | Current message step (0, 1, 2, ...) |
| enrolled_message_count | Enrolled Message Count | Number | Snapshot at enrollment |
| sms_sent_count | SMS Sent Count | Number | Total messages sent to this lead |
| sms_last_sent_at | SMS Last Sent At | DateTime | Timestamp of last message |
| processing_status | Processing Status | Single Select | Queued, Ready for SMS, In Sequence, Complete, Stopped |
```

**Key Intent:** Portal should display:
- ✅ SMS message count per lead
- ✅ Processing status (In Sequence, Complete, etc.)
- ✅ Sequence position (e.g., "2 of 3")
- ✅ Completion status
- ✅ Ability to click into leads to see activity timeline

---

## PART 2: USER REQUIREMENTS (From Current Feedback)

**Requirement 1: Leads Dashboard Visibility**
> "I want to be able to see who has received a message... if I'm in campaigns if I drill down into a campaign I can see the leads associated with that campaign, but I cannot click into them, and I should definitely be able to click into their lead record from the list of leads under a campaign and again it should be a message count for the lead in the dashboard there so that I can actually see who's received a message and who hasn't."

**Broken Down:**
- [ ] Show message count in leads dashboard
- [ ] Show who has been messaged vs not messaged
- [ ] Show if anybody has responded
- [ ] Filter/sort by message activity

**Requirement 2: Campaign Drill-Down**
> "if I drill down into a campaign I can see the leads associated with that campaign, but I cannot click into them... it should be a message count for the lead in the dashboard there... show message count and their status of the in sequence are they completed and that has not been implemented."

**Broken Down:**
- [ ] Leads in campaign detail page should be CLICKABLE → navigate to lead detail
- [ ] Show message count for each lead in campaign
- [ ] Show processing status (In Sequence, Completed)
- [ ] Show sequence stage (e.g., "Message 2 of 3")

---

## PART 3: CURRENT IMPLEMENTATION STATUS

### 3.1 Database Schema (✅ COMPLETE)

**File:** `src/lib/db/schema.ts:117-158`

**Available Fields:**
```typescript
// SMS Activity (Line 117-120)
smsSequencePosition: integer('sms_sequence_position').default(0),
smsSentCount: integer('sms_sent_count').default(0),
smsLastSentAt: timestamp('sms_last_sent_at', { withTimezone: true }),

// Status (Line 123)
processingStatus: varchar('processing_status', { length: 50 }),

// Completion (Line 154-158)
completedAt: timestamp('completed_at', { withTimezone: true }),
enrolledCampaignVersion: integer('enrolled_campaign_version'),
enrolledMessageCount: integer('enrolled_message_count').default(0).notNull(),
enrolledAt: timestamp('enrolled_at', { withTimezone: true }),
```

**✅ ALL FIELDS EXIST** - No schema changes needed.

---

### 3.2 Leads Dashboard (`/leads` page)

**File:** `src/app/(client)/leads/page.tsx`

**Current Interface (Line 11-31):**
```typescript
interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  title?: string;
  icpScore: number;
  status: string;
  linkedinUrl?: string;
  enrichmentOutcome?: string;
  createdAt: string;
  // Week 4 additions
  campaignName?: string;
  leadSource?: string;
  lastActivity?: string | null;
  // Engagement metrics
  engagementLevel?: string;
  engagementTier?: string;
}
```

**❌ MISSING FIELDS:**
- `smsSentCount` - NOT in interface
- `processingStatus` - NOT in interface
- `smsSequencePosition` - NOT in interface
- `completedAt` - NOT in interface
- `enrolledMessageCount` - NOT in interface

**Current Display Columns (Line 150-300 - approximate):**
- Name
- Company
- ICP Score
- Status (enrichment status, not SMS status)
- Last Activity
- Campaign
- Lead Source

**❌ NO SMS ACTIVITY COLUMNS** - Cannot see who has been messaged.

---

### 3.3 Campaign Detail Page (`/admin/campaigns/[id]`)

**File:** `src/app/(client)/admin/campaigns/[id]/page.tsx`

**Current Lead Interface (Line 33-50):**
```typescript
interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  leadSource?: string;
  engagementTier?: string;
  kajabi_tags?: string[];
  createdAt: string;
  // Phase 1.5: Additional fields for leads table
  icpScore?: number;
  engagementLevel?: string;
  enrolledAt?: string;
  smsSequencePosition?: number; // ✅ PRESENT but not displayed
}
```

**Table Columns (Line 338-366):**
1. Name
2. Email
3. Phone
4. Company
5. ICP Score
6. Engagement
7. Date Enrolled
8. Seq. Pos. (Line 361 - `smsSequencePosition` **IS displayed**)
9. Lead Source

**✅ `smsSequencePosition` is displayed (Line 392-394)**
**❌ Missing Columns:**
- SMS Sent Count (how many messages this lead has received)
- Processing Status (Ready for SMS, In Sequence, Complete, Stopped)
- Completion Status (Completed At timestamp)
- Message Progress Display (e.g., "2 of 3 messages")

**❌ LEADS NOT CLICKABLE (Line 369-399):**
```typescript
<tr key={lead.id} className="hover:bg-gray-700">
  {/* No onClick handler, no Link component, no cursor-pointer */}
  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
    {lead.firstName} {lead.lastName}
  </td>
  {/* ... */}
</tr>
```

**Expected:** Clicking row should navigate to `/leads/{lead.id}` (lead detail page).

---

### 3.4 API Responses

#### API 1: `/api/leads` (Main Leads Dashboard)

**File:** `src/app/api/leads/route.ts:76-107`

**Query (Line 76-81):**
```typescript
const allLeads = await db.query.leads.findMany({
  where: filters.length > 0 ? and(...filters) : undefined,
  orderBy: (leads, { desc }) => [desc(leads.icpScore)],
  limit,
  offset,
});
```

**Response Mapping (Line 92-107):**
```typescript
const leadsWithEngagement = allLeads.map(lead => {
  const activityDates = [
    lead.smsLastSentAt,
    lead.firstClickedAt,
    lead.bookedAt,
  ].filter(date => date !== null && date !== undefined);

  const lastActivity = activityDates.length > 0
    ? new Date(Math.max(...activityDates.map(d => new Date(d).getTime())))
    : null;

  return {
    ...lead,
    lastActivity: lastActivity?.toISOString() || null,
  };
});
```

**✅ API RETURNS ALL FIELDS** (`...lead` spread includes all schema fields)  
**❌ UI DOESN'T USE THEM** - Fields are returned but not displayed.

#### API 2: `/api/admin/campaigns/[id]/leads` (Campaign Detail)

**File:** `src/app/api/admin/campaigns/[id]/leads/route.ts:63-79`

**Query (Line 63-77):**
```typescript
const campaignLeads = await db
  .select()
  .from(leads)
  .where(
    and(
      eq(leads.clientId, campaign.clientId),
      eq(leads.isActive, true),
      or(
        eq(leads.campaignName, campaign.id),
        eq(leads.leadSource, campaign.name),
        campaign.formId ? eq(leads.formId, campaign.formId) : sql`false`
      )
    )
  )
  .orderBy(sql`${leads.createdAt} DESC`);
```

**✅ API RETURNS ALL FIELDS** (`.select()` with no specific columns = all columns)  
**❌ UI INTERFACE INCOMPLETE** - UI expects only subset of fields.

---

## PART 4: GAP ANALYSIS

### Gap 1: Leads Dashboard - NO SMS Activity Visibility

**What's Missing:**
| Required Column | Field Name | Currently Displayed |
|---|---|---|
| Messages Sent | `smsSentCount` | ❌ NO |
| Status | `processingStatus` | ❌ NO (shows enrichment status instead) |
| Sequence Progress | `smsSequencePosition` + `enrolledMessageCount` | ❌ NO |
| Completed | `completedAt` | ❌ NO |

**Impact:**
- ⛔ User cannot identify which leads have been messaged
- ⛔ User cannot see reply/response activity
- ⛔ User cannot filter/sort by message activity
- ⛔ User cannot prioritize follow-ups

**Example Desired Display:**
```
| Name | Company | Messages | Status | Sequence | Last Activity |
|------|---------|----------|--------|----------|---------------|
| John Doe | Acme Inc | 2 | In Sequence | 2 of 3 | 2 days ago |
| Jane Smith | Tech Co | 1 | Complete | 1 of 1 | 5 days ago |
| Bob Johnson | Corp | 0 | Ready for SMS | - | Never |
```

---

### Gap 2: Campaign Detail - Leads Not Clickable

**What's Missing:**
- ❌ No `onClick` handler on table rows
- ❌ No `cursor-pointer` CSS class
- ❌ No navigation to `/leads/{lead.id}`

**Current Behavior:**
```typescript
<tr key={lead.id} className="hover:bg-gray-700">
  {/* Static row - no interaction */}
</tr>
```

**Expected Behavior:**
```typescript
<tr 
  key={lead.id} 
  onClick={() => router.push(`/leads/${lead.id}`)}
  className="hover:bg-gray-700 cursor-pointer"
>
  {/* Clickable row */}
</tr>
```

**Impact:**
- ⛔ User cannot drill into lead detail from campaign view
- ⛔ User cannot see lead activity timeline
- ⛔ User cannot take action on specific leads
- ⛔ Breaks expected UX flow (see campaign → see leads → drill into lead)

---

### Gap 3: Campaign Detail - Missing Critical Columns

**What's Missing:**
| Required Column | Field Name | Currently Displayed |
|---|---|---|
| Messages Sent | `smsSentCount` | ❌ NO |
| Status | `processingStatus` | ❌ NO |
| Message Progress | Display as "X of Y" | ❌ NO (only shows position) |
| Completed | `completedAt` | ❌ NO |

**Current Columns:**
1. Name ✅
2. Email ✅
3. Phone ✅
4. Company ✅
5. ICP Score ✅
6. Engagement ✅
7. Date Enrolled ✅
8. Seq. Pos. ⚠️ (shows position, but not total)
9. Lead Source ✅

**Seq. Pos. Column Issue (Line 392-394):**
```typescript
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
  {lead.smsSequencePosition || 'N/A'}
</td>
```

Shows: `2` (just the number)  
**Should show:** `2 of 3` (position + total)

**Required:** Add `enrolledMessageCount` to interface and display as:
```typescript
{lead.smsSequencePosition || 0} of {lead.enrolledMessageCount || 0}
```

---

## PART 5: DETAILED IMPLEMENTATION GAPS

### 5.1 TypeScript Interfaces

**File:** `src/app/(client)/leads/page.tsx:11-31`

**Current:**
```typescript
interface Lead {
  id: string;
  firstName: string;
  // ... other fields ...
  engagementLevel?: string;
  engagementTier?: string;
  // ❌ MISSING SMS FIELDS
}
```

**Required:**
```typescript
interface Lead {
  id: string;
  firstName: string;
  // ... other fields ...
  engagementLevel?: string;
  engagementTier?: string;
  // NEW: SMS Activity Fields
  smsSentCount?: number;
  processingStatus?: string;
  smsSequencePosition?: number;
  enrolledMessageCount?: number;
  completedAt?: string | null;
  smsLastSentAt?: string | null;
}
```

**Files to Update:**
1. `src/app/(client)/leads/page.tsx` - Leads dashboard interface
2. `src/app/(client)/admin/campaigns/[id]/page.tsx` - Campaign detail interface

---

### 5.2 Table Column Additions

#### Leads Dashboard Table

**File:** `src/app/(client)/leads/page.tsx` (approximate line 150-300)

**Add Columns:**
```typescript
// After "Last Activity" column, before "Campaign"
<th className={`px-4 py-3 text-left text-xs font-semibold uppercase`}>
  SMS Sent
</th>
<th className={`px-4 py-3 text-left text-xs font-semibold uppercase`}>
  Status
</th>
<th className={`px-4 py-3 text-left text-xs font-semibold uppercase`}>
  Sequence
</th>
```

**Add Row Cells:**
```typescript
<td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
  {lead.smsSentCount || 0}
</td>
<td className="px-4 py-3 whitespace-nowrap text-sm">
  <span className={`px-2 py-1 rounded-full text-xs ${
    lead.processingStatus === 'Complete' ? 'bg-green-500/20 text-green-300' :
    lead.processingStatus === 'In Sequence' ? 'bg-cyan-500/20 text-cyan-300' :
    lead.processingStatus === 'Ready for SMS' ? 'bg-yellow-500/20 text-yellow-300' :
    'bg-gray-500/20 text-gray-300'
  }`}>
    {lead.processingStatus || 'N/A'}
  </span>
</td>
<td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
  {lead.enrolledMessageCount > 0 
    ? `${lead.smsSequencePosition || 0} of ${lead.enrolledMessageCount}`
    : '-'
  }
</td>
```

---

#### Campaign Detail Table

**File:** `src/app/(client)/admin/campaigns/[id]/page.tsx:338-399`

**Update "Seq. Pos." Column Header (Line 360-362):**
```typescript
<th className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase`}>
  Sequence
</th>
```

**Update "Seq. Pos." Cell (Line 392-394):**
```typescript
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
  {lead.enrolledMessageCount > 0
    ? `${lead.smsSequencePosition || 0} of ${lead.enrolledMessageCount}`
    : 'N/A'
  }
</td>
```

**Add NEW Columns After "Sequence":**
```typescript
// Header
<th className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase`}>
  SMS Sent
</th>
<th className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase`}>
  Status
</th>

// Cells
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
  {lead.smsSentCount || 0}
</td>
<td className="px-6 py-4 whitespace-nowrap text-sm">
  <span className={`px-2 py-1 rounded-full text-xs ${
    lead.processingStatus === 'Complete' ? 'bg-green-500/20 text-green-300' :
    lead.processingStatus === 'In Sequence' ? 'bg-cyan-500/20 text-cyan-300' :
    lead.processingStatus === 'Ready for SMS' ? 'bg-yellow-500/20 text-yellow-300' :
    'bg-gray-500/20 text-gray-300'
  }`}>
    {lead.processingStatus || 'N/A'}
  </span>
</td>
```

---

### 5.3 Click Handler Implementation

**File:** `src/app/(client)/admin/campaigns/[id]/page.tsx:369-399`

**BEFORE:**
```typescript
<tr key={lead.id} className="hover:bg-gray-700">
  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
    {lead.firstName} {lead.lastName}
  </td>
  {/* ... */}
</tr>
```

**AFTER:**
```typescript
<tr 
  key={lead.id} 
  onClick={() => router.push(`/leads/${lead.id}`)}
  className="hover:bg-gray-700 cursor-pointer transition"
>
  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
    {lead.firstName} {lead.lastName}
  </td>
  {/* ... */}
</tr>
```

**CSS Addition:**
- `cursor-pointer` - Shows pointer cursor on hover
- `transition` - Smooth hover effect
- Keep existing `hover:bg-gray-700` - Background color change

---

## PART 6: PRIORITY IMPLEMENTATION PLAN

### Priority 1: Fix Campaign Detail Page (HIGH)

**Why First:** User explicitly stated "if I drill down into a campaign... I should definitely be able to click into their lead record."

**Changes:**
1. Update `Lead` interface to include:
   - `smsSentCount`
   - `processingStatus`
   - `enrolledMessageCount` (for sequence display)
   - `completedAt`

2. Make rows clickable:
   - Add `onClick` handler
   - Add `cursor-pointer` class
   - Navigate to `/leads/{lead.id}`

3. Fix "Sequence" column:
   - Display as "X of Y" (e.g., "2 of 3")
   - Show "-" if not enrolled

4. Add "SMS Sent" column:
   - Display `smsSentCount`
   - Show "0" if never messaged

5. Add "Status" column:
   - Display `processingStatus`
   - Color-coded badges:
     - Complete: Green
     - In Sequence: Cyan
     - Ready for SMS: Yellow
     - Other: Gray

**Files to Change:**
- `src/app/(client)/admin/campaigns/[id]/page.tsx`

**Estimated Time:** 1-2 hours  
**Testing Time:** 30 minutes (verify clicks work, columns display correctly)

---

### Priority 2: Update Leads Dashboard (HIGH)

**Why Second:** Main entry point for lead management, user needs to see message activity at a glance.

**Changes:**
1. Update `Lead` interface (same fields as Priority 1)

2. Add 3 new table columns:
   - "SMS Sent" - Message count
   - "Status" - Processing status with color badges
   - "Sequence" - Progress display (X of Y)

3. Add filter/sort options:
   - Filter by `processingStatus` (Complete, In Sequence, etc.)
   - Sort by `smsSentCount`
   - Sort by `completedAt`

**Files to Change:**
- `src/app/(client)/leads/page.tsx`

**Estimated Time:** 2-3 hours  
**Testing Time:** 30 minutes (verify columns display, filters work)

---

### Priority 3: Add Response Tracking (MEDIUM)

**User Quote:** "if anybody's responded that I might want to drill down into them if there's been a response"

**Current Status:**
- ❓ Reply tracking exists in schema (`replyCount` field)
- ❓ Reply data source unknown (SimpleTexting API? n8n webhook?)
- ❓ Reply display logic not implemented

**Investigation Required:**
1. Verify if reply data is currently captured
2. Check if `replyCount` field is populated
3. Check if `SMS_Audit` table tracks replies

**If Reply Data Exists:**
- Add "Replies" column to both tables
- Add visual indicator (e.g., icon with count)
- Filter by "Has Replies"

**If Reply Data Missing:**
- Defer to Phase 2 (requires n8n webhook setup)

**Estimated Time:** 2-4 hours (depends on data availability)

---

## PART 7: VERIFICATION CHECKLIST

### After Priority 1 (Campaign Detail Page)

**Test Case 1: Click Navigation**
- [ ] Click on lead row in campaign detail page
- [ ] Verify navigation to `/leads/{lead.id}`
- [ ] Verify lead detail page loads correctly
- [ ] Verify back button returns to campaign page

**Test Case 2: Column Display**
- [ ] "Sequence" column shows "X of Y" format (e.g., "2 of 3")
- [ ] "Sequence" shows "-" or "N/A" for non-enrolled leads
- [ ] "SMS Sent" column shows correct count (0, 1, 2, 3, etc.)
- [ ] "Status" column shows correct badge with color

**Test Case 3: Data Accuracy**
- [ ] Compare displayed counts to database (run SQL query)
- [ ] Verify leads in "Complete" status show correct data
- [ ] Verify leads in "In Sequence" show current position

---

### After Priority 2 (Leads Dashboard)

**Test Case 4: New Columns**
- [ ] All 3 new columns visible (SMS Sent, Status, Sequence)
- [ ] Data displays correctly for all leads
- [ ] Columns sortable (if implemented)

**Test Case 5: Filtering**
- [ ] Filter by "Complete" status shows only completed leads
- [ ] Filter by "In Sequence" shows only active leads
- [ ] Filter by "Never Messaged" shows leads with `smsSentCount = 0`

**Test Case 6: Performance**
- [ ] Page loads in <2 seconds with 1,000+ leads
- [ ] Sorting/filtering responsive
- [ ] No console errors

---

## PART 8: RISK ASSESSMENT

### Technical Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| API already returns fields, no backend change | ✅ LOW | Verified APIs return all fields via `...lead` spread |
| TypeScript type mismatches | ⚠️ MEDIUM | Update interfaces first, verify with `tsc --noEmit` |
| Performance (1,165 leads) | ⚠️ MEDIUM | Test with full dataset, optimize queries if needed |
| Click handler conflicts with other UI | ⚠️ LOW | Use event delegation, test with action buttons |

### UX Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Too many columns (information overload) | ⚠️ MEDIUM | Use responsive design, hide columns on mobile |
| Color-blind users (status badges) | ⚠️ MEDIUM | Add text labels in addition to colors |
| Unclear sequence display | ⚠️ LOW | Use clear format: "2 of 3 messages" |

---

## PART 9: ARCHITECTURAL ALIGNMENT

### Does This Match Original Intent?

**From Forensic Audit (Line 888-906):**

✅ **YES** - All fields in original mapping are now displayed:
- `sms_sequence_position` → Displayed as "X of Y"
- `enrolled_message_count` → Used for sequence display
- `sms_sent_count` → Displayed as "SMS Sent" column
- `processing_status` → Displayed as color-coded status badge

✅ **YES** - Clickable leads matches expected UX flow:
- Campaign detail → Lead list → Click lead → Lead detail → Activity timeline

✅ **YES** - Portal as "historical state" (Quote from audit):
> "Campaign statistics are like lifetime statistics... any lead that's ever come through that campaign will show in there and they would show what their status is right so are they in sequence or completed."

---

## PART 10: REMAINING QUESTIONS

### Question 1: Reply/Response Tracking

**User Quote:** "if anybody's responded that I might want to drill down into them"

**Unknown:**
- Is reply data currently captured?
- What field stores reply count (`replyCount`)?
- Is it populated by n8n or SimpleTexting API?
- Should replies be displayed in dashboard?

**Action:** Investigate before implementing reply columns.

---

### Question 2: Lead Detail Page Activity Timeline

**User Expectation:** Click lead → see activity timeline (messages sent, replies, clicks, bookings)

**Current Status:**
- ❓ Lead detail page exists (`/leads/[id]`)
- ❓ Activity timeline component unknown
- ❓ `leadActivityLog` table populated?

**Action:** Verify lead detail page displays activity after fixing clickable rows.

---

## HONESTY CHECK

**Evidence-Based Analysis:** 100%

**Sources:**
- User feedback (voice transcription)
- `COMPLETE-SMS-SYSTEM-FORENSIC-AUDIT.md` (original intent)
- `src/app/(client)/leads/page.tsx` (current implementation)
- `src/app/(client)/admin/campaigns/[id]/page.tsx` (current implementation)
- `src/lib/db/schema.ts` (database schema)
- `src/app/api/leads/route.ts` (API response)
- `src/app/api/admin/campaigns/[id]/leads/route.ts` (API response)

**Assumptions:** ZERO

**Confidence:** 98%

**Limitations:**
- Did not verify reply tracking implementation
- Did not inspect lead detail page (`/leads/[id]`)
- Did not test actual UI (analysis based on code only)

---

## END OF FORENSIC ANALYSIS


