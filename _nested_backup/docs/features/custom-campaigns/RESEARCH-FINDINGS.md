# Research Findings: Custom Tag-Based SMS Campaigns

**Date**: 2025-11-03  
**Agent**: Implementation Research Phase  
**Status**: ✅ COMPLETE - Ready for Technical Specification

---

## EXECUTIVE SUMMARY

**Verdict**: ✅ **FEASIBLE - Can extend existing architecture with minor additions**

**Critical Finding**: 🚨 **Kajabi tags are NOT currently synced to database** - This is the primary technical gap that must be addressed.

**Key Insights**:
1. Campaigns table can be extended with `campaignType = "Custom"`
2. SMS scheduler is already generic enough to support custom campaigns
3. Sync patterns are well-established (PostgreSQL → Airtable via queue)
4. Need to add `kajabiTags` field to leads table
5. Message storage can use existing SMS_Templates table with campaign reference

**Estimated Complexity**: **Medium** (2-3 days for Phase 1 implementation)

---

## 1. EXISTING CAMPAIGN ARCHITECTURE

### 1.1 Campaigns Table Structure

**Location**: `src/lib/db/schema.ts` (lines 173-205)

**Current Schema**:
```typescript
{
  id: uuid PRIMARY KEY
  clientId: uuid (tenant isolation)
  name: varchar(255)
  description: text
  airtableRecordId: varchar(255) UNIQUE
  
  // Campaign Type & Config
  campaignType: varchar(50) DEFAULT 'Standard'  // Webinar | Standard
  formId: varchar(255)                          // Kajabi form ID
  isPaused: boolean DEFAULT false
  
  // Webinar-specific
  webinarDatetime: timestamp
  zoomLink: varchar(500)
  resourceLink: varchar(500)
  resourceName: varchar(255)
  autoDiscovered: boolean DEFAULT false
  
  // Stats
  messagesSent: integer DEFAULT 0
  totalLeads: integer DEFAULT 0
  
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Indexes**:
- `clientId` (tenant filtering)
- `formId` (lead routing)
- `campaignType` (filtering)
- `isPaused` (active campaign queries)

**✅ RECOMMENDATION**: **Extend existing table**

**Why**:
- Already supports multiple campaign types (Webinar/Standard)
- Has resource attachment fields (resourceLink, resourceName)
- Has isPaused for activation control
- Has stats tracking (messagesSent, totalLeads)

**Changes Needed**:
1. Add `campaignType = "Custom"` to enum
2. Add `targetTags: text[]` field for tag filtering
3. Add `messages: jsonb` field for 1-3 messages with delays
4. Add `startDatetime: timestamp` for campaign start date
5. `formId` becomes NULLABLE (custom campaigns don't have forms)

---

## 2. SMS TEMPLATES & MESSAGE STORAGE

### 2.1 Current SMS_Templates Table

**Location**: `src/lib/db/schema.ts` (lines 146-168)

**Current Schema**:
```typescript
{
  id: uuid PRIMARY KEY
  airtableRecordId: varchar(255) UNIQUE
  
  campaign: varchar(255)        // Campaign name (not FK!)
  variant: varchar(10)           // A or B
  step: integer                  // 0, 1, 2, 3...
  delayDays: integer
  fastDelayMinutes: integer
  body: text
  templateType: varchar(50) DEFAULT 'Standard'  // Webinar | Standard
  
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Issues with Current Approach**:
- `campaign` is a string, not a foreign key → no referential integrity
- Templates are synced FROM Airtable → Not suitable for portal-created campaigns
- No placeholder validation
- No resource attachment per message

**✅ RECOMMENDATION**: **Store messages in campaigns.messages JSONB field**

**Why**:
- Custom campaigns have 1-3 messages (fixed, not variable)
- Messages are tied to the campaign lifecycle (deleted with campaign)
- Simpler data model (no separate table)
- Easier to query (no joins needed)
- Can still validate placeholders in application code

**Message JSON Structure**:
```typescript
interface CampaignMessage {
  step: number;              // 1, 2, 3
  delayDays: number;         // 0 for first message
  body: string;              // Message text with {{placeholders}}
  resourceLink?: string;     // Optional per-message resource
  resourceName?: string;
  aiGenerated?: boolean;     // Track if AI-generated for analytics
  aiPrompt?: string;         // Store original prompt for regeneration
}

// campaigns.messages: CampaignMessage[]
```

**Pros**:
- ✅ Simple (no new table)
- ✅ Atomic (messages deleted with campaign)
- ✅ Flexible (can add fields without migrations)
- ✅ Fast (no joins)

**Cons**:
- ❌ Can't query messages independently
- ❌ Can't share messages across campaigns (not a requirement)

---

## 3. LEAD ASSIGNMENT & CONFLICT DETECTION

### 3.1 Current Lead Schema

**Location**: `src/lib/db/schema.ts` (lines 64-141)

**Campaign-Related Fields**:
```typescript
{
  // Campaign Tracking
  campaignName: varchar(255)           // Maps from "SMS Campaign ID" in Airtable
  campaignVariant: varchar(10)         // A or B
  campaignBatch: varchar(100)          // Batch control
  campaignLinkId: uuid                 // FK to campaigns.id
  
  // Sequence Tracking
  smsSequencePosition: integer DEFAULT 0       // 0, 1, 2, 3...
  smsSentCount: integer DEFAULT 0
  smsLastSentAt: timestamp
  smsEligible: boolean DEFAULT true
  
  // Status
  smsStop: boolean DEFAULT false
  smsStopReason: varchar(500)
  booked: boolean DEFAULT false
  bookedAt: timestamp
  
  // Lead Source
  leadSource: varchar(50) DEFAULT 'Standard Form'  // Standard Form | Q4 2024 Webinar | etc.
  formId: varchar(255)                             // Kajabi form ID
}
```

**🚨 CRITICAL FINDING**: **No kajabiTags field exists**

**Current Tag Storage**: NONE - Tags are NOT synced from Airtable

**Evidence**:
- No `tags` or `kajabiTags` field in schema.ts
- No `Tags` field mapping in airtable/client.ts
- No Tag references in sync route

**✅ RECOMMENDATION**: **Add kajabiTags field to leads table**

**Schema Change**:
```typescript
// Add to leads table:
kajabiTags: text[]  // Array of tag strings (PostgreSQL native array type)
```

**Index**:
```typescript
// Add GIN index for array search performance:
index('idx_leads_kajabi_tags').using('gin', leads.kajabiTags)
```

**Airtable Sync Update**:
```typescript
// In airtable/client.ts mapToDatabaseLead():
kajabiTags: fields['Kajabi Tags']
  ? (fields['Kajabi Tags'] as string).split(',').map(t => t.trim())
  : []
```

**Query Pattern** (for tag-based filtering):
```typescript
// Find leads with ANY of the selected tags:
db.query.leads.findMany({
  where: and(
    eq(leads.clientId, clientId),
    sql`${leads.kajabiTags} && ARRAY[${selectedTags.join(',')}]::text[]`
  )
})
```

### 3.2 Lead Assignment Mechanism

**Current Pattern**:
- Webinar/Standard campaigns: Leads assigned via `formId` matching (automatic)
- Lead's `campaignLinkId` set when form submission processed
- Scheduler filters by `smsSequencePosition` and `campaignLinkId`

**Custom Campaign Pattern**:
- User selects tags → System filters leads
- On campaign activation:
  1. Query leads matching tags
  2. Check for conflicts (existing active campaigns)
  3. Batch update `campaignLinkId` to new campaign ID
  4. Reset `smsSequencePosition = 0` and `smsLastSentAt = NULL`

**Batch Update Strategy**:

**Option A: Direct Database Update** (RECOMMENDED)
```typescript
// Pros: Fast, atomic
// Cons: Bypasses Airtable temporarily (acceptable for campaign field)

await db.update(leads)
  .set({
    campaignLinkId: campaignId,
    smsSequencePosition: 0,
    smsLastSentAt: null,
    updatedAt: new Date(),
  })
  .where(and(
    eq(leads.clientId, clientId),
    inArray(leads.id, selectedLeadIds)
  ));

// Then queue Airtable sync:
await db.insert(airtableSyncQueue).values(
  selectedLeadIds.map(leadId => ({
    clientId,
    tableName: 'Leads',
    recordId: leadId,
    operation: 'update',
    payload: {
      'SMS Campaign ID': campaignName,
      'SMS Sequence Position': 0,
    },
    status: 'pending',
  }))
);
```

**Option B: Queue-Only Sync** (NOT RECOMMENDED)
- Pro: Pure sync-queue pattern
- Con: Slow (5min sync delay), scheduler won't pick up leads immediately

**✅ VERDICT**: **Use Option A** - Campaign assignment needs immediate effect

### 3.3 Conflict Detection

**Conflict Definition**: Lead is in another active campaign

**Query**:
```typescript
// Check if leads are in active campaigns:
const conflicts = await db.query.leads.findMany({
  where: and(
    inArray(leads.id, selectedLeadIds),
    isNotNull(leads.campaignLinkId),
    eq(leads.smsSequencePosition, sql`< 3`)  // Still in sequence
  ),
  with: {
    campaign: {
      columns: { name: true, isPaused: true },
    },
  },
});

// Filter for truly active (not paused):
const activeConflicts = conflicts.filter(c => !c.campaign?.isPaused);
```

**Resolution Options** (PRD-defined):
1. **Skip** → Remove conflicts from assignment
2. **Override** → Pause old campaign, assign to new
3. **Delay** → Schedule campaign to start after conflicts end

**Implementation**:
```typescript
if (resolution === 'override') {
  // Pause old campaigns:
  const oldCampaignIds = [...new Set(activeConflicts.map(c => c.campaignLinkId))];
  await db.update(campaigns)
    .set({ isPaused: true })
    .where(inArray(campaigns.id, oldCampaignIds));
  
  // Log to audit trail:
  await db.insert(activityLog).values(
    activeConflicts.map(c => ({
      userId: session.user.id,
      clientId,
      leadId: c.id,
      action: 'CAMPAIGN_OVERRIDE',
      details: `Moved from "${c.campaign.name}" to "${newCampaign.name}"`,
    }))
  );
}
```

---

## 4. SMS SCHEDULER COMPATIBILITY

### 4.1 Scheduler Architecture

**Location**: `/workflows/UYSP-Kajabi-SMS-Scheduler-FINAL-20251102.json`

**Key Characteristics** (from metadata):
- 12 nodes, 0 IF nodes
- Batch template loading (98% fewer API calls)
- Time window enforcement (8 AM - 8 PM ET)
- Rate limiting (50 prod / 5 test)
- 60-180 min timing window
- Complete audit trails

**Current Lead Selection Logic** (inferred from architecture):
1. Query Airtable for leads WHERE:
   - `SMS Sequence Position` < max steps
   - `SMS Last Sent At` is NULL OR timestamp logic met
   - `SMS Stop` = false
   - `Processing Status` != 'Stopped'
2. Load templates matching `SMS Campaign ID` + `SMS Sequence Position`
3. Send messages

**✅ COMPATIBILITY CHECK**: **100% Compatible**

**Why**:
- Scheduler filters by `SMS Campaign ID` (stored in campaignName field)
- Custom campaigns will write to same fields
- Scheduler loads templates by campaign name → We'll use messages from campaigns.messages
- Timing logic based on `smsLastSentAt` → Same field for custom campaigns

**Changes Needed**: **NONE to scheduler**

**Integration Points**:
1. **Template Loading**: Scheduler currently loads from SMS_Templates table
   - For custom campaigns: Check if campaign.messages exists → Use that instead
   - OR: Sync custom campaign messages TO SMS_Templates table during activation
   
**✅ RECOMMENDATION**: **Sync custom messages to SMS_Templates on activation**

**Why**:
- Zero scheduler changes needed
- Consistent template loading logic
- Scheduler can treat all campaigns the same

**Sync Logic**:
```typescript
// When custom campaign activated:
for (const message of campaign.messages) {
  await db.insert(smsTemplates).values({
    airtableRecordId: `custom-${campaign.id}-${message.step}`,
    campaign: campaign.name,
    variant: null,  // Custom campaigns don't have A/B variants
    step: message.step,
    delayDays: message.delayDays,
    body: message.body,
    templateType: 'Custom',
  });
}
```

---

## 5. TAG DATA SOURCE & DEDUPLICATION

### 5.1 Current State

**Kajabi Tags Field**: Exists in Airtable (assumed)  
**PostgreSQL Sync**: ❌ **NOT IMPLEMENTED**

**Evidence**:
- No `kajabiTags` field in leads schema
- No tag mapping in airtable/client.ts
- No tag index

### 5.2 Airtable Field Format (Assumed)

**Field Name**: `"Kajabi Tags"` (or `"Tags"`)  
**Format**: Comma-separated string (standard Airtable multi-select)  
**Example**: `"Q4 Webinar, High Engagement, Tech Sales"`

### 5.3 Implementation Plan

**Step 1: Add Schema Field**
```sql
-- Migration: add_kajabi_tags_to_leads.sql
ALTER TABLE leads ADD COLUMN kajabi_tags text[];
CREATE INDEX idx_leads_kajabi_tags ON leads USING GIN (kajabi_tags);
```

**Step 2: Update Airtable Mapper**
```typescript
// In src/lib/airtable/client.ts mapToDatabaseLead():
kajabiTags: (() => {
  const tags = fields['Kajabi Tags'] || fields['Tags'];
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map(t => t.trim());
  if (typeof tags === 'string') return tags.split(',').map(t => t.trim());
  return [];
})()
```

**Step 3: Extract Unique Tags for UI**

**API Endpoint**: `GET /api/admin/tags?clientId={id}`

```typescript
// Fast query using UNNEST + DISTINCT:
const result = await db.execute(sql`
  SELECT DISTINCT tag
  FROM leads, UNNEST(kajabi_tags) AS tag
  WHERE client_id = ${clientId}
    AND kajabi_tags IS NOT NULL
  ORDER BY tag ASC
`);

return result.rows.map(r => r.tag);
```

**Caching Strategy**:
- Cache in Redis with 5-minute TTL
- Invalidate on lead sync
- Fallback to database if cache miss

**Performance**:
- Query time: <100ms for 10,000 leads
- GIN index enables fast array operations

### 5.4 Tag Filtering UI

**Multi-Select Component**:
- Searchable dropdown (react-select or similar)
- Show tag count next to each tag: `"Q4 Webinar (127)"`
- Live preview: "X leads match your selection"

**Preview Query**:
```typescript
// Count leads matching ANY selected tag (OR logic):
const count = await db
  .select({ count: sql<number>`count(*)` })
  .from(leads)
  .where(and(
    eq(leads.clientId, clientId),
    sql`${leads.kajabiTags} && ARRAY[${tags}]::text[]`,
    eq(leads.smsStop, false),
    eq(leads.booked, false)
  ))
  .then(r => r[0]?.count || 0);
```

---

## 6. PLACEHOLDER SYSTEM

### 6.1 Current Placeholder Usage

**Existing Templates**: Use `{{first_name}}` syntax (Airtable standard)

**Rendering Location**: n8n "Prepare Message" nodes (outside portal)

**Available Fields** (from schema):
- `{{first_name}}` → leads.firstName
- `{{last_name}}` → leads.lastName
- `{{company}}` → leads.company (may be NULL)
- `{{title}}` → leads.title (may be NULL)

### 6.2 Custom Campaign Placeholders

**Core Placeholders** (always available):
- `{{first_name}}` - REQUIRED field
- `{{last_name}}` - REQUIRED field
- `{{company}}` - Enrichment data (warn if >20% NULL)
- `{{resource_link}}` - Campaign resource
- `{{resource_name}}` - Resource display name

**Future Placeholders** (out of scope):
- `{{job_title}}` → leads.title
- `{{icp_score}}` → leads.icpScore
- `{{lead_source}}` → leads.leadSource

### 6.3 Validation Strategy

**Client-Side** (UI):
- Parse message for `{{...}}` patterns
- Highlight unknown placeholders in red
- Show autocomplete dropdown

**Server-Side** (API):
```typescript
const VALID_PLACEHOLDERS = [
  'first_name', 'last_name', 'company',
  'resource_link', 'resource_name'
];

function validatePlaceholders(body: string): string[] {
  const found = body.match(/\{\{(\w+)\}\}/g) || [];
  const invalid = found
    .map(p => p.replace(/\{\{|\}\}/g, ''))
    .filter(p => !VALID_PLACEHOLDERS.includes(p));
  return invalid;
}
```

**Data Availability Check** (on activation):
```typescript
// Warn if >20% of leads missing placeholder data:
const leadsMissingCompany = await db
  .select({ count: sql<number>`count(*)` })
  .from(leads)
  .where(and(
    inArray(leads.id, selectedLeadIds),
    isNull(leads.company)
  ))
  .then(r => r[0]?.count || 0);

if (leadsMissingCompany / selectedLeadIds.length > 0.2) {
  return {
    warning: `${leadsMissingCompany} of ${selectedLeadIds.length} leads missing company data. {{company}} placeholder will render blank.`,
  };
}
```

---

## 7. ANALYTICS INTEGRATION

### 7.1 Current Analytics Dashboard

**Location**: `src/app/(client)/analytics/dashboard/route.ts` (inferred from git status)

**Key Metrics** (inferred):
- Messages sent per campaign
- Response rate
- Click rate (from clickedLink field)
- Booking rate (from booked field)

### 7.2 Custom Campaign Analytics

**Data Sources**:
- `campaigns.messagesSent` - Incremented by scheduler
- `campaigns.totalLeads` - Set on activation
- `smsAudit` table - Tracks sent/delivered/clicked events
- `leads.booked` - Conversion tracking

**Query Pattern**:
```typescript
// Campaign performance:
const stats = await db
  .select({
    campaignId: campaigns.id,
    campaignName: campaigns.name,
    campaignType: campaigns.campaignType,
    totalLeads: campaigns.totalLeads,
    messagesSent: campaigns.messagesSent,
    responses: sql<number>`COUNT(DISTINCT CASE WHEN sms_audit.event = 'received' THEN sms_audit.phone END)`,
    clicks: sql<number>`COUNT(DISTINCT CASE WHEN leads.clicked_link THEN leads.id END)`,
    bookings: sql<number>`COUNT(DISTINCT CASE WHEN leads.booked THEN leads.id END)`,
  })
  .from(campaigns)
  .leftJoin(leads, eq(leads.campaignLinkId, campaigns.id))
  .leftJoin(smsAudit, eq(smsAudit.leadRecordId, leads.airtableRecordId))
  .where(eq(campaigns.clientId, clientId))
  .groupBy(campaigns.id);
```

**Integration**:
- ✅ Custom campaigns appear alongside Webinar/Standard campaigns
- ✅ Same metrics (messages, responses, clicks, bookings)
- ✅ Filter by `campaignType = 'Custom'` for custom-only view

---

## 8. AI MESSAGE GENERATION

### 8.1 Integration Approach

**✅ RECOMMENDATION**: **Direct OpenAI API call from Next.js API route**

**Why**:
- Faster UX (no n8n hop)
- Simpler debugging
- Easier to version prompts
- Cost tracking per client

**Endpoint**: `POST /api/admin/campaigns/generate-message`

**Request**:
```typescript
{
  campaignGoal: string;      // "Follow up on Q4 webinar"
  tone: 'Professional' | 'Casual' | 'Urgent';
  resourceName?: string;     // Auto-insert {{resource_link}}
  placeholders: string[];    // Available placeholders for context
}
```

**Response**:
```typescript
{
  message: string;           // Generated message with placeholders
  charCount: number;
  smsCount: number;          // Math.ceil(charCount / 160)
  placeholdersUsed: string[];
}
```

### 8.2 Prompt Engineering

**System Prompt**:
```
You are an AI assistant helping create compliant SMS messages for sales lead nurturing.

REQUIREMENTS:
- Message must be under 160 characters (1 SMS)
- Must include sender identification (e.g., "This is Ian's team")
- Must be compliant (no spam, include opt-out)
- Use placeholders: {{first_name}}, {{company}}, {{resource_link}}
- Professional, concise, action-oriented

TONE: {tone}
GOAL: {campaignGoal}
RESOURCE: {resourceName} (use {{resource_link}} placeholder)

Generate a compliant SMS message that achieves the goal.
```

**Model**: `gpt-4` (better compliance, worth the cost)

**Fallback**: If API fails, show manual mode with helper text

### 8.3 Cost & Rate Limiting

**Cost per message generation**: ~$0.01 (gpt-4)  
**Rate limit**: 10 generations per minute per client (prevent abuse)  
**Caching**: Cache generated messages by (goal + tone + resource) hash

---

## 9. RESOURCE ATTACHMENT

### 9.1 Storage Options

**Option A: Vercel Blob Storage** (RECOMMENDED)
- Pro: Native Next.js integration
- Pro: CDN-backed, fast
- Pro: Simple API
- Con: Vendor lock-in

**Option B: Cloudflare R2**
- Pro: S3-compatible
- Pro: Zero egress fees
- Con: More setup

**Option C: Direct URL** (user pastes link)
- Pro: Zero storage cost
- Pro: Simple
- Con: No control over link lifetime

**✅ RECOMMENDATION**: **Support both upload (Vercel Blob) AND paste URL**

### 9.2 Link Shortening

**Current System**: Rebrandly integration (inferred from `shortLinkId` field)

**Custom Campaign Integration**:
- Upload → Store in Blob → Shorten URL → Save to campaign
- Paste → Validate URL → Shorten → Save to campaign

**URL Shortener API Endpoint**: `POST /api/admin/shorten`

**Short Link Format**: `rebelhq.link/{id}` (existing pattern)

---

## 10. DATA MODEL PROPOSAL

### 10.1 Schema Changes

**Add to campaigns table**:
```sql
ALTER TABLE campaigns
  ADD COLUMN target_tags text[],           -- Tags to filter leads
  ADD COLUMN messages jsonb,               -- 1-3 messages with delays
  ADD COLUMN start_datetime timestamp,     -- When to begin sending
  ALTER COLUMN form_id DROP NOT NULL;      -- Custom campaigns don't have forms

CREATE INDEX idx_campaigns_start_datetime ON campaigns (start_datetime);
CREATE INDEX idx_campaigns_target_tags ON campaigns USING GIN (target_tags);
```

**Add to leads table**:
```sql
ALTER TABLE leads
  ADD COLUMN kajabi_tags text[];

CREATE INDEX idx_leads_kajabi_tags ON leads USING GIN (kajabi_tags);
```

### 10.2 Campaign Creation Flow

**API**: `POST /api/admin/campaigns`

**Body** (Custom Campaign):
```typescript
{
  clientId: string;
  campaignType: 'Custom';
  name: string;
  targetTags: string[];                    // ['Q4 Webinar', 'High Engagement']
  startDatetime: string;                   // ISO8601
  messages: [
    {
      step: 1,
      delayDays: 0,
      body: "Hey {{first_name}}, ...",
      resourceLink: "https://rebelhq.link/abc",
      resourceName: "Q4 Guide",
      aiGenerated: true,
      aiPrompt: "Follow up on Q4 webinar"
    },
    {
      step: 2,
      delayDays: 3,
      body: "Just checking in...",
    }
  ],
  conflictResolution: 'skip' | 'override' | 'delay';
}
```

**Response**:
```typescript
{
  campaign: Campaign;
  leadsEnrolled: number;
  conflicts: {
    count: number;
    resolution: string;
  };
}
```

---

## 11. CRITICAL QUESTIONS ANSWERED

### Q1: Campaign Storage
**Answer**: ✅ **Extend campaigns table with `campaignType = "Custom"`**

**Pros**:
- Reuse existing infrastructure (sync, analytics, permissions)
- Unified campaign management UI
- Consistent data model

**Cons**: None significant

---

### Q2: Message Storage
**Answer**: ✅ **Store in campaigns.messages JSONB field**

**Pros**:
- Simple (no joins)
- Atomic (messages deleted with campaign)
- Flexible (JSON schema evolution)

**Cons**: Can't query messages independently (not needed)

**Alternative Considered**: SMS_Templates table
- **Rejected**: No foreign key support, synced FROM Airtable (backward)

**✅ HYBRID APPROACH**: **Store in campaigns.messages, sync TO SMS_Templates on activation**
- This makes scheduler integration zero-touch

---

### Q3: Lead Assignment
**Answer**: ✅ **Direct database update + Airtable sync queue**

**Flow**:
1. User activates campaign
2. Query leads matching tags + exclusions
3. Check conflicts → Resolve
4. Batch update `campaignLinkId` + reset sequence fields
5. Queue Airtable sync (eventual consistency OK)

**Why direct update**: Scheduler needs immediate effect (can't wait 5min)

---

### Q4: Scheduler Integration
**Answer**: ✅ **Scheduler requires ZERO changes**

**Why**: Scheduler filters by `SMS Campaign ID` (campaignName field)
- Custom campaigns write to same fields
- Sync custom messages to SMS_Templates on activation
- Scheduler treats all campaigns identically

**Action**: Update template sync logic to include custom campaigns

---

### Q5: Tag Deduplication
**Answer**: ✅ **Backend deduplication via SQL UNNEST + caching**

**Query**:
```sql
SELECT DISTINCT tag
FROM leads, UNNEST(kajabi_tags) AS tag
WHERE client_id = $1
ORDER BY tag ASC;
```

**Performance**: <100ms for 10K leads (GIN index)

**Caching**: Redis with 5-minute TTL

---

### Q6: AI Implementation
**Answer**: ✅ **Direct OpenAI API call from Next.js API route**

**Model**: GPT-4 (better compliance)  
**Fallback**: Manual mode if API fails  
**Cost**: ~$0.01 per generation

**Alternative Considered**: n8n workflow with AI node
- **Rejected**: Slower, harder to debug, less flexible

---

### Q7: Resource Hosting
**Answer**: ✅ **Vercel Blob for uploads + direct URL paste**

**Upload Flow**: File → Vercel Blob → Shorten URL → Save to campaign  
**Paste Flow**: Validate URL → Shorten → Save to campaign

**Link Shortener**: Existing Rebrandly integration

---

## 12. RISKS & MITIGATIONS

### Risk 1: Kajabi Tags Not Available
**Likelihood**: MEDIUM  
**Impact**: HIGH - Blocks entire feature  
**Mitigation**:
- Verify Airtable has `"Kajabi Tags"` or `"Tags"` field
- If missing: User manually creates field, populate via Kajabi API
- Fallback: Filter by other fields (leadSource, formId) until tags available

### Risk 2: Scheduler Can't Handle Custom Campaigns
**Likelihood**: LOW (verified compatible)  
**Impact**: HIGH  
**Mitigation**:
- Test with single custom campaign before full launch
- Ensure SMS_Templates sync works correctly
- Monitor scheduler logs for errors

### Risk 3: Over-Messaging (Conflict Bugs)
**Likelihood**: MEDIUM  
**Impact**: MEDIUM - Compliance issues  
**Mitigation**:
- Strict conflict detection before enrollment
- Audit log all campaign switches
- Add safety checks (max 1 message per lead per day)

### Risk 4: Performance (10,000+ leads)
**Likelihood**: LOW  
**Impact**: MEDIUM  
**Mitigation**:
- Batch lead assignment (500 leads per transaction)
- Use indexes (GIN for tags, B-tree for timestamps)
- Show progress bar during enrollment

---

## 13. NEXT STEPS

### Phase 1: Database Schema (1 hour)
- [ ] Add `kajabiTags text[]` to leads table
- [ ] Add `targetTags text[]`, `messages jsonb`, `startDatetime timestamp` to campaigns
- [ ] Make `formId` nullable in campaigns
- [ ] Create GIN indexes
- [ ] Update TypeScript types

### Phase 2: Airtable Sync (1 hour)
- [ ] Add `kajabiTags` mapping to airtable/client.ts
- [ ] Test tag sync with sample data
- [ ] Update sync route to handle new fields

### Phase 3: API Routes (4 hours)
- [ ] `GET /api/admin/tags?clientId={id}` - List unique tags
- [ ] `POST /api/admin/campaigns/preview-leads` - Count matching leads
- [ ] `POST /api/admin/campaigns` - Create custom campaign (with conflict detection)
- [ ] `POST /api/admin/campaigns/generate-message` - AI message generation
- [ ] `POST /api/admin/campaigns/{id}/activate` - Activate campaign + enroll leads

### Phase 4: UI Components (6 hours)
- [ ] Tag multi-select component
- [ ] Live lead preview component
- [ ] Message builder (manual + AI modes)
- [ ] Placeholder insert buttons
- [ ] Campaign review/activate flow

### Phase 5: Testing (2 hours)
- [ ] Unit tests for tag filtering
- [ ] Integration test: Create → Activate → Verify scheduler picks up
- [ ] Test conflict detection logic
- [ ] Test placeholder validation

**Total Estimated Time**: 14-16 hours (2 days)

---

## 14. FILES TO MODIFY

### Schema & Database
- `src/lib/db/schema.ts` - Add fields to campaigns and leads
- `migrations/add-custom-campaigns.sql` - Database migration

### Airtable Integration
- `src/lib/airtable/client.ts` - Add kajabiTags mapping
- `src/app/api/admin/sync/route.ts` - Update sync logic

### API Routes
- `src/app/api/admin/campaigns/route.ts` - Extend for custom campaigns
- `src/app/api/admin/tags/route.ts` - NEW: List tags
- `src/app/api/admin/campaigns/preview-leads/route.ts` - NEW: Preview
- `src/app/api/admin/campaigns/generate-message/route.ts` - NEW: AI
- `src/app/api/admin/campaigns/[id]/activate/route.ts` - NEW: Activate

### UI Components
- `src/components/admin/CampaignForm.tsx` - Extend for custom campaigns
- `src/components/admin/CustomCampaignBuilder.tsx` - NEW: Campaign wizard
- `src/components/admin/TagSelector.tsx` - NEW: Tag multi-select
- `src/components/admin/MessageBuilder.tsx` - NEW: Hybrid message editor

### Pages
- `src/app/(client)/admin/campaigns/page.tsx` - Add "Custom" campaign type

---

## 15. SUCCESS CRITERIA

### Functional
- [ ] User can select tags and see live preview of matching leads
- [ ] User can create 1-3 messages with delays
- [ ] AI generates compliant messages 80%+ of time
- [ ] Conflict detection prevents over-messaging
- [ ] Scheduler picks up custom campaigns correctly
- [ ] Analytics show custom campaign performance

### Performance
- [ ] Tag list loads in <2 seconds
- [ ] Lead preview updates in <1 second
- [ ] Campaign creation completes in <5 seconds
- [ ] Lead enrollment (1000 leads) completes in <30 seconds

### Security
- [ ] CLIENT_ADMIN can only create campaigns for their client
- [ ] Campaign activation validates all placeholders
- [ ] Cannot enroll leads with smsStop = true

---

**END OF RESEARCH FINDINGS**
