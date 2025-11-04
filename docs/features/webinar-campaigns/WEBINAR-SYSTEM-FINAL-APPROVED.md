# Webinar Campaign System - FINAL APPROVED SPECIFICATION

**Date**: 2025-11-02  
**Status**: ✅ APPROVED - Ready for Implementation  
**Format**: Machine-readable, AI agent executable

---

## ARCHITECTURE (Confirmed Correct)

```
AIRTABLE (Source of Truth)
  ├─ Campaigns table (NEW - will create)
  └─ Leads table (ADD 3 fields)
       ↓
  Background Sync (5 min)
       ↓
POSTGRESQL (Read Cache)
  ├─ campaigns table (EXTEND existing with 9 fields)
  └─ leads table (ADD 4 fields)
       ↑
  UI Reads (fast queries)
       ↑
/admin/campaigns (NEW UI page)
  - List campaigns
  - Create/edit campaigns
  - Client dropdown (SUPER_ADMIN)
       ↓
  UI Writes (via sync queue)
       ↓
airtableSyncQueue → Airtable
  (Existing pattern: queued writes with retry)
```

**n8n Workflows**:
- Kajabi API Polling: Reads Campaigns from Airtable → routes leads
- Webinar Scheduler: Reads Leads from Airtable → sends messages

---

## PHASE 1: AIRTABLE SCHEMA

### 1.1 CREATE Campaigns Table

**Execute**: Manually in Airtable UI or via MCP

**Table Name**: `Campaigns`  
**Base ID**: `app4wIsBfpJTg7pWS`

**Fields** (EXACT names - copy/paste):
```
1. Campaign Name
   Type: Single line text
   Required: Yes

2. Campaign Type
   Type: Single select
   Options: "Webinar", "Standard"
   Default: "Standard"

3. Form ID
   Type: Single line text
   Required: Yes
   Note: Must be unique per client

4. Webinar Datetime
   Type: Date (with time)
   Timezone: America/New_York
   Format: YYYY-MM-DD HH:mm

5. Zoom Link
   Type: URL

6. Resource Link
   Type: URL

7. Resource Name
   Type: Single line text

8. Active
   Type: Checkbox
   Default: Unchecked

9. Auto Discovered
   Type: Checkbox
   Default: Unchecked

10. Messages Sent
    Type: Number
    Precision: 0
    Default: 0

11. Total Leads
    Type: Count (linked records from Leads table)

12. Created At
    Type: Created time

13. Created By
    Type: Single line text
```

**Capture After Creation**:
- Table ID: `tbl_______________`
- Field IDs for all 13 fields
- Update COMPLETE-DEPENDENCY-MATRIX.md

---

### 1.2 UPDATE Leads Table

**Table**: `Leads` (`tblYUvhGADerbD8EO`)

**ADD Fields** (EXACT names):
```
1. Form ID
   Type: Single line text

2. Webinar Datetime
   Type: Date (with time)
   Timezone: America/New_York

3. Lead Source
   Type: Single select
   Options: "Webinar", "Standard", "Unknown"
   Default: "Standard"

4. Linked Campaign
   Type: Link to another record
   Links to: Campaigns table
   Allow linking to multiple records: No
```

**Capture After Creation**:
- Field IDs for all 4 new fields
- Update COMPLETE-DEPENDENCY-MATRIX.md

---

## PHASE 2: POSTGRESQL SCHEMA

### 2.1 Create Migration File

**File**: `uysp-client-portal/migrations/0009_add_webinar_campaigns.sql`

```sql
-- ============================================================================
-- PHASE 1: Extend SMS_Templates (Backward Compatible)
-- ============================================================================
ALTER TABLE sms_templates
  ADD COLUMN IF NOT EXISTS template_type VARCHAR(50) DEFAULT 'Standard'
    CHECK (template_type IN ('Webinar', 'Standard'));

CREATE INDEX IF NOT EXISTS idx_sms_templates_type ON sms_templates(template_type);

-- ============================================================================
-- PHASE 2: Extend Campaigns Table
-- ============================================================================
ALTER TABLE campaigns 
  ADD COLUMN IF NOT EXISTS campaign_type VARCHAR(50) DEFAULT 'Standard' 
    CHECK (campaign_type IN ('Webinar', 'Standard')),
  ADD COLUMN IF NOT EXISTS form_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS webinar_datetime TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS zoom_link VARCHAR(500),
  ADD COLUMN IF NOT EXISTS resource_link VARCHAR(500),
  ADD COLUMN IF NOT EXISTS resource_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS auto_discovered BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS messages_sent INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_leads INTEGER DEFAULT 0;

-- Add unique constraint (client_id, form_id combination)
ALTER TABLE campaigns 
  ADD CONSTRAINT unique_form_id_per_client UNIQUE(client_id, form_id);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_form_id ON campaigns(form_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_campaigns_active ON campaigns(is_paused);

-- ============================================================================
-- PHASE 3: Extend Leads Table
-- ============================================================================
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS form_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS webinar_datetime TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lead_source VARCHAR(50) DEFAULT 'Standard' 
    CHECK (lead_source IN ('Webinar', 'Standard', 'Unknown')),
  ADD COLUMN IF NOT EXISTS campaign_link_id UUID REFERENCES campaigns(id);

-- Add indexes for leads
CREATE INDEX IF NOT EXISTS idx_leads_form_id ON leads(form_id);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(lead_source);
CREATE INDEX IF NOT EXISTS idx_leads_webinar_datetime ON leads(webinar_datetime);
CREATE INDEX IF NOT EXISTS idx_leads_campaign_link ON leads(campaign_link_id);
```

---

### 2.2 Update TypeScript Schema

**File**: `uysp-client-portal/src/lib/db/schema.ts`

**UPDATE campaigns table** (around line 159):
```typescript
export const campaigns = pgTable(
  'campaigns',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clientId: uuid('client_id').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    airtableRecordId: varchar('airtable_record_id', { length: 255 }),
    messageTemplate: text('message_template'),
    sendInterval: integer('send_interval').default(3600),
    isPaused: boolean('is_paused').notNull().default(false),
    
    // NEW WEBINAR FIELDS
    campaignType: varchar('campaign_type', { length: 50 }).default('Standard'),
    formId: varchar('form_id', { length: 255 }),
    webinarDatetime: timestamp('webinar_datetime', { withTimezone: true }),
    zoomLink: varchar('zoom_link', { length: 500 }),
    resourceLink: varchar('resource_link', { length: 500 }),
    resourceName: varchar('resource_name', { length: 255 }),
    autoDiscovered: boolean('auto_discovered').default(false),
    messagesSent: integer('messages_sent').default(0),
    totalLeads: integer('total_leads').default(0),
    
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    clientIdIdx: index('idx_campaigns_client_id').on(table.clientId),
    formIdIdx: index('idx_campaigns_form_id').on(table.formId),
    typeIdx: index('idx_campaigns_type').on(table.campaignType),
    activeIdx: index('idx_campaigns_active').on(table.isPaused),
  })
);
```

**UPDATE leads table** (around line 64):
```typescript
export const leads = pgTable(
  'leads',
  {
    // ... existing fields ...
    
    // NEW WEBINAR FIELDS (add after line 112)
    formId: varchar('form_id', { length: 255 }),
    webinarDatetime: timestamp('webinar_datetime', { withTimezone: true }),
    leadSource: varchar('lead_source', { length: 50 }).default('Standard'),
    campaignLinkId: uuid('campaign_link_id').references(() => campaigns.id),
    
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    // ... existing indexes ...
    
    // NEW INDEXES
    formIdIdx: index('idx_leads_form_id').on(table.formId),
    leadSourceIdx: index('idx_leads_lead_source').on(table.leadSource),
    webinarDatetimeIdx: index('idx_leads_webinar_datetime').on(table.webinarDatetime),
    campaignLinkIdx: index('idx_leads_campaign_link').on(table.campaignLinkId),
  })
);
```

---

## PHASE 3: AIRTABLE CLIENT UPDATES

### 3.1 Add streamAllCampaigns Method

**File**: `uysp-client-portal/src/lib/airtable/client.ts`

**ADD** (after line 297, following existing pattern):

```typescript
/**
 * Stream all campaigns with pagination handling
 */
async streamAllCampaigns(onRecord: (record: AirtableRecord) => Promise<void>) {
  return this.streamFromTable('Campaigns', onRecord);
}
```

**Note**: `streamFromTable()` already exists (line 302), just reuse it.

---

### 3.2 Add mapToDatabaseCampaign Method

**File**: `uysp-client-portal/src/lib/airtable/client.ts`

**ADD** (after `mapToDatabaseLead()`, around line 387):

```typescript
/**
 * Map Airtable campaign record to database format
 */
mapToDatabaseCampaign(
  record: AirtableRecord,
  clientId: string
): Partial<NewCampaign> {
  const fields = record.fields;

  return {
    clientId,
    airtableRecordId: record.id,
    name: (fields['Campaign Name'] as string) || '',
    campaignType: (fields['Campaign Type'] as string) || 'Standard', // Keep Pascal case
    formId: (fields['Form ID'] as string) || '',
    webinarDatetime: fields['Webinar Datetime'] 
      ? new Date(fields['Webinar Datetime'] as string) 
      : undefined,
    zoomLink: (fields['Zoom Link'] as string) || undefined,
    resourceLink: (fields['Resource Link'] as string) || undefined,
    resourceName: (fields['Resource Name'] as string) || undefined,
    isPaused: !(fields['Active'] as boolean), // Active checkbox → isPaused inverted
    autoDiscovered: (fields['Auto Discovered'] as boolean) || false,
    messagesSent: Number(fields['Messages Sent']) || 0,
    totalLeads: Number(fields['Total Leads']) || 0,
    createdAt: new Date(record.createdTime),
    updatedAt: new Date(),
  };
}
```

---

## PHASE 4: SYNC LOGIC

### 4.1 Create Campaign Sync Function

**File**: `uysp-client-portal/src/lib/sync/sync-campaigns.ts` (NEW)

```typescript
import { db } from '@/lib/db';
import { campaigns } from '@/lib/db/schema';
import { getAirtableClient } from '@/lib/airtable/client';

export async function syncCampaignsFromAirtable(
  clientId: string, 
  airtableBaseId: string
) {
  const airtable = getAirtableClient(airtableBaseId);
  let synced = 0;
  let errors = 0;

  await airtable.streamAllCampaigns(async (record) => {
    try {
      const campaignData = airtable.mapToDatabaseCampaign(record, clientId);

      // Upsert with conflict on airtableRecordId
      await db.insert(campaigns)
        .values(campaignData)
        .onConflictDoUpdate({
          target: campaigns.airtableRecordId,
          set: campaignData,
        });

      synced++;
    } catch (error) {
      console.error(`Error syncing campaign ${record.id}:`, error);
      errors++;
    }
  });

  return { synced, errors };
}
```

---

### 4.2 Update Admin Sync Route

**File**: `uysp-client-portal/src/app/api/admin/sync/route.ts`

**ADD** after Tasks sync (around line 220):

```typescript
// Sync Campaigns
let campaignsSynced = 0;
let campaignsErrors = 0;

try {
  const campaignsResult = await syncCampaignsFromAirtable(clientId, client.airtableBaseId);
  campaignsSynced = campaignsResult.synced;
  campaignsErrors = campaignsResult.errors;
  console.log(`✅ Synced ${campaignsSynced} campaigns`);
} catch (error) {
  console.error('Campaign sync error:', error);
  campaignsErrors = 1;
}
```

**UPDATE response** (around line 275):

```typescript
return NextResponse.json({
  success: true,
  data: {
    leads: { fetched: totalFetched, inserted: totalInserted, updated: totalUpdated, errors },
    campaigns: { synced: campaignsSynced, errors: campaignsErrors }, // ADD THIS
    tasks: { fetched: tasksFetched, inserted: tasksInserted, errors: tasksErrors },
    blockers: { fetched: blockersFetched, inserted: blockersInserted, errors: blockersErrors },
    status: { fetched: statusFetched, inserted: statusInserted, errors: statusErrors },
  }
});
```

---

## PHASE 5: UI IMPLEMENTATION

### 5.1 Campaigns Management Page

**File**: `uysp-client-portal/src/app/(client)/admin/campaigns/page.tsx` (NEW)

**Features**:
- Client dropdown (SUPER_ADMIN only) - same pattern as analytics page
- Campaign list table (all campaigns for selected client)
- Filter by type (All/Webinar/Standard)
- Filter by status (All/Active/Inactive)
- Create campaign button
- Edit/Activate/Deactivate actions

**Data Flow**:
- Reads from PostgreSQL via `GET /api/admin/campaigns?clientId={id}`
- Writes via `POST /api/admin/campaigns` → sync queue → Airtable

---

### 5.2 Campaign Form (Create/Edit)

**Conditional Fields**:
```typescript
// Always show:
- Campaign Name
- Campaign Type (radio: Webinar / Standard)
- Form ID (text input or Kajabi dropdown if auto-discovery enabled)
- Active toggle

// Show ONLY if Campaign Type = "Webinar":
- Webinar Date (date picker)
- Webinar Time (time picker)
- Zoom Link (URL input)
- Resource Link (URL input)
- Resource Name (text input)
```

**Validation**:
```typescript
if (campaignType === 'Webinar') {
  required: [name, formId, webinarDatetime, zoomLink]
  optional: [resourceLink, resourceName]
  
  // Cannot activate without required fields
  if (active && (!webinarDatetime || !zoomLink)) {
    return error('Cannot activate webinar without datetime and zoom link');
  }
  
  // Webinar must be in future
  if (webinarDatetime < new Date()) {
    return error('Webinar datetime must be in future');
  }
}
```

---

### 5.3 API Routes

**File**: `uysp-client-portal/src/app/api/admin/campaigns/route.ts` (NEW)

**GET /api/admin/campaigns**:
```typescript
// Query params: clientId (SUPER_ADMIN), type, status
// Returns: campaigns[] from PostgreSQL
// Auth: ADMIN (their client) or SUPER_ADMIN (any client)

// Multi-tenant isolation:
if (session.user.role === 'ADMIN') {
  clientId = session.user.clientId; // Force their client
} else if (session.user.role === 'SUPER_ADMIN') {
  clientId = searchParams.get('clientId'); // Can specify via param
}

const campaigns = await db.query.campaigns.findMany({
  where: eq(campaigns.clientId, clientId),
  orderBy: desc(campaigns.createdAt)
});
```

**POST /api/admin/campaigns**:
```typescript
// Create campaign
// Body: { name, campaignType, formId, webinarDatetime?, zoomLink?, ... }
// Auth: ADMIN or SUPER_ADMIN

// Flow:
// 1. Validate input
// 2. Check form_id uniqueness (within client)
// 3. Insert into PostgreSQL
// 4. Add to airtableSyncQueue for background write
// 5. Return campaign ID
```

**File**: `uysp-client-portal/src/app/api/admin/campaigns/[id]/route.ts` (NEW)

**PATCH /api/admin/campaigns/[id]**:
```typescript
// Update campaign
// 1. Update PostgreSQL
// 2. Add to sync queue
// 3. Return updated campaign
```

---

## PHASE 6: SMS TEMPLATES EXTENSION

### 6.1 Update SMS_Templates Table

**CRITICAL**: This extends the existing SMS_Templates structure without breaking backward compatibility.

**Airtable SMS_Templates Table** - ADD FIELD:
```
Field Name: Template Type
Type: Single select
Options: "Webinar", "Standard"
Default: "Standard"
Required: Yes
```

**PostgreSQL sms_templates** - ADD COLUMN:
```sql
ALTER TABLE sms_templates 
  ADD COLUMN IF NOT EXISTS template_type VARCHAR(50) DEFAULT 'Standard' 
    CHECK (template_type IN ('Webinar', 'Standard'));

CREATE INDEX IF NOT EXISTS idx_sms_templates_type ON sms_templates(template_type);
```

**Update schema.ts** (line 140):
```typescript
export const smsTemplates = pgTable(
  'sms_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    airtableRecordId: varchar('airtable_record_id', { length: 255 }).notNull().unique(),
    
    campaign: varchar('campaign', { length: 255 }).notNull(),
    variant: varchar('variant', { length: 10 }), // A or B
    step: integer('step').notNull(),
    delayDays: integer('delay_days'),
    fastDelayMinutes: integer('fast_delay_minutes'),
    body: text('body').notNull(),
    templateType: varchar('template_type', { length: 50 }).default('Standard'), // ← ADD THIS
    
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    campaignIdx: index('idx_sms_templates_campaign').on(table.campaign),
    stepIdx: index('idx_sms_templates_step').on(table.step),
    typeIdx: index('idx_sms_templates_type').on(table.templateType), // ← ADD THIS
  })
);
```

**Backward Compatibility**:
- ✅ All existing 21 campaigns default to `Template Type = "Standard"`
- ✅ All existing templates continue working without modification
- ✅ Webinar templates are isolated by `Template Type = "Webinar"`
- ✅ No changes to existing campaign behavior

**Example Data After Migration**:
```
EXISTING TEMPLATES (no change in behavior):
Campaign                | Template Type | Step | Variant | Body
─────────────────────────────────────────────────────────────────────────
AI Webinar- AI SMS      | Standard      | 1    | A       | "Hi {{name}}, thanks for your interest..."
AI Webinar- AI SMS      | Standard      | 2    | A       | "Quick follow-up {{name}}, a reminder..."
pricing_rules           | Standard      | 1    | A       | "Hi {{name}}, noticed you grabbed..."
chatgpt_use_cases       | Standard      | 1    | A       | "Hi {{name}}, this is Ian's team..."
default_nurture         | Standard      | 1    | A       | "Hi {{name}}, thanks for your interest..."
...all other existing campaigns...

NEW WEBINAR TEMPLATES (for actual webinar leads):
Campaign                | Template Type | Step | Variant | Body
─────────────────────────────────────────────────────────────────────────
Q4-Planning-Webinar     | Webinar       | 1    | A       | "✅ You're registered! Nov 6 @ 2pm ET"
Q4-Planning-Webinar     | Webinar       | 2    | A       | "Here's why this matters: [resource]"
Q4-Planning-Webinar     | Webinar       | 3    | A       | "⏰ Tomorrow at 2pm ET! Zoom: [link]"
Q4-Planning-Webinar     | Webinar       | 4    | A       | "⏰ Starting in 1 hour!"
```

**Critical Distinction**:
- "AI Webinar- AI SMS" (Standard) = Old campaign mentioning a past webinar
- "Q4-Planning-Webinar" (Webinar) = New time-sensitive nurture for active webinar

These are **completely separate** and routed by `Lead Source` field.

---

## PHASE 7: N8N WORKFLOWS

### 7.1 Update Kajabi API Polling

**Workflow**: `UYSP-Kajabi-API-Polling` (`0scB7vqk8QHp8s5b`)

**ADD TWO NODES** after "Parse & Map Submissions", before duplicate check:

**NODE A: Get Active Campaigns**
```json
{
  "name": "Get Active Campaigns",
  "type": "n8n-nodes-base.airtable",
  "operation": "search",
  "base": "app4wIsBfpJTg7pWS",
  "table": "Campaigns",
  "options": {
    "filterByFormula": "{Active} = TRUE()"
  }
}
```

**NODE B: Campaign Lookup & Route**
```javascript
// Type: Code node
// Input: Lead from Parse node, Campaigns from Get Active Campaigns

const lead = $input.first().json;
const campaignsData = $node["Get Active Campaigns"].json;
const campaigns = campaignsData.records || [];
const formId = lead.form?.id || lead.form_id;

// Default to standard if no form ID
if (!formId) {
  return {
    json: {
      ...lead,
      lead_source: 'Standard',
      form_id: null,
    }
  };
}

// Find campaign by form_id
const campaign = campaigns.find(c => c.fields['Form ID'] === formId);

if (!campaign) {
  // Unknown form - route to HRQ
  return {
    json: {
      ...lead,
      lead_source: 'Unknown',
      form_id: formId,
      processing_status: 'HRQ Review',
      hrq_reason: `Unknown form ID: ${formId}`,
    }
  };
}

// Check campaign type
const campaignType = campaign.fields['Campaign Type']; // "Webinar" or "Standard"

if (campaignType === 'Webinar') {
  const webinarDatetime = campaign.fields['Webinar Datetime'];
  
  // Validate webinar has datetime
  if (!webinarDatetime) {
    return {
      json: {
        ...lead,
        lead_source: 'Unknown',
        form_id: formId,
        processing_status: 'HRQ Review',
        hrq_reason: 'Webinar missing datetime',
      }
    };
  }
  
  // Check if webinar already passed
  if (new Date(webinarDatetime) < new Date()) {
    return {
      json: {
        ...lead,
        lead_source: 'Webinar',
        form_id: formId,
        webinar_datetime: webinarDatetime,
        processing_status: 'Complete',
        hrq_reason: 'Webinar already passed',
      }
    };
  }
  
  // SUCCESS: Webinar lead
  return {
    json: {
      ...lead,
      lead_source: 'Webinar',
      form_id: formId,
      webinar_datetime: webinarDatetime,
      linked_campaign: [campaign.id], // Array for Airtable linkedRecord
      processing_status: 'Ready for SMS',
    }
  };
  
} else {
  // Standard campaign
  return {
    json: {
      ...lead,
      lead_source: 'Standard',
      form_id: formId,
      linked_campaign: [campaign.id],
      processing_status: 'Ready for SMS',
    }
  };
}
```

**UPDATE Airtable Create/Update Nodes**:
Add new fields to the field mapping:
- Form ID: `{{$json.form_id}}`
- Webinar Datetime: `{{$json.webinar_datetime}}`
- Lead Source: `{{$json.lead_source}}`
- Linked Campaign: `{{$json.linked_campaign}}` (array)

---

### 7.2 Update Standard SMS Scheduler

**Workflow**: Current SMS scheduler (probably `UYSP-SMS-Scheduler-v2`)

**CHANGE 1**: "List Due Leads" node filter formula

**ADD** to existing filter:
```javascript
AND(
  {Lead Source} = "Standard",  // ← ADD THIS LINE
  {Processing Status} = "Ready for SMS",
  {Phone Valid} = TRUE,
  NOT({SMS Stop}),
  NOT({Booked}),
  NOT({Current Coaching Client}),
  // ... rest of existing filter
)
```

**CHANGE 2**: Template lookup in "Prepare Text (A/B)" or "List Templates" node

**UPDATE Airtable query filter** (or add to code filter):
```javascript
// In Airtable filter formula:
{Template Type} = "Standard"

// OR in JavaScript node after fetching templates:
const templates = allTemplates.filter(t => t.template_type === 'Standard');
```

**Purpose**: 
1. Exclude webinar leads from standard scheduler
2. Only use Standard templates for existing campaigns

---

### 7.3 Create Webinar Scheduler

**Workflow**: `UYSP-Webinar-Nurture-Scheduler` (NEW)

**Copy from**: Standard SMS Scheduler

**CHANGES**:

**CHANGE 1**: Filter formula (List Due Leads node):
```javascript
AND(
  {Lead Source} = "Webinar",  // ← CHANGED FROM "Standard"
  {Processing Status} = "Ready for SMS",
  {Webinar Datetime} > NOW(),  // ← ADD THIS (skip past webinars)
  {Phone Valid} = TRUE,
  NOT({SMS Stop}),
  NOT({Booked}),
  NOT({Current Coaching Client}),
  OR(
    {SMS Sequence Position} = 0,
    AND(
      {SMS Sequence Position} > 0,
      {SMS Sequence Position} < 4,
      DATETIME_DIFF(NOW(), {SMS Last Sent At}, 'hours') >= 1
    )
  )
)
```

**CHANGE 2**: Message timing logic (in "Prepare Messages" node):
```javascript
const position = lead.sms_sequence_position || 0;
const webinarTime = new Date(lead.webinar_datetime);
const now = new Date();
const hoursUntil = (webinarTime - now) / (1000 * 60 * 60);

let shouldSend = false;
let messageStep = null;

if (position === 0) {
  // Message 1: Acknowledgment - Send immediately
  shouldSend = true;
  messageStep = 1;
  
} else if (position === 1) {
  // Message 2: Value/Anticipation - Send 12-24 hours after Message 1
  const hoursSinceLastSMS = (now - new Date(lead.sms_last_sent_at)) / (1000 * 60 * 60);
  if (hoursSinceLastSMS >= 12 && hoursUntil > 24) {
    shouldSend = true;
    messageStep = 2;
  }
  
} else if (position === 2) {
  // Message 3: 24-hour reminder
  if (hoursUntil <= 24 && hoursUntil > 1) {
    shouldSend = true;
    messageStep = 3;
  }
  
} else if (position === 3) {
  // Message 4: 1-hour reminder
  if (hoursUntil <= 1 && hoursUntil > 0) {
    shouldSend = true;
    messageStep = 4;
  }
}

return { ...lead, should_send: shouldSend, message_step: messageStep };
```

**CHANGE 3**: SMS Templates lookup (in template query node):
```javascript
// Airtable filter formula in "List Templates" node:
AND(
  {Campaign} = [lead.campaign_name],  // e.g., "Q4-Planning-Webinar"
  {Template Type} = "Webinar",         // ← CRITICAL: Only webinar templates
  {Step} = [messageStep],              // 1, 2, 3, or 4
  {Variant} = [lead.campaign_variant]  // A or B
)

// OR in JavaScript after fetching all templates:
const template = allTemplates.find(t => 
  t.campaign === lead.campaign_name && 
  t.template_type === 'Webinar' &&     // ← CRITICAL
  t.step === messageStep && 
  t.variant === lead.campaign_variant
);
```

**CHANGE 4**: After send, increment counter in Campaigns table:
```javascript
// Add to airtableSyncQueue:
{
  tableName: 'Campaigns',
  recordId: lead.linked_campaign_id,
  operation: 'update',
  payload: {
    'Messages Sent': currentCount + 1
  }
}
```

---

## PHASE 8: OPTIONAL AUTO-DISCOVERY

### 8.1 Kajabi Form Sync Workflow

**Workflow**: `Kajabi-Campaign-Sync` (NEW, OPTIONAL)

**IF ENABLED**:
- Runs daily at 6 AM ET
- Fetches forms from Kajabi API
- Filters to forms with "webinar" in name (case-insensitive)
- Creates inactive campaigns in Airtable
- Slack notification of new forms

**IF DISABLED**:
- Admin manually creates campaigns in UI
- Enters Form ID from Kajabi manually
- 5 extra minutes per webinar

**RECOMMENDATION**: Start without auto-discovery, add later if needed.

---

## IMPLEMENTATION SEQUENCE

### Week 1: Schema
- [ ] Create Campaigns table in Airtable
- [ ] Add 4 fields to Leads table in Airtable
- [ ] Run PostgreSQL migration
- [ ] Update schema.ts
- [ ] Capture all field IDs

### Week 2: Sync & Backend
- [ ] Add `streamAllCampaigns()` to AirtableClient
- [ ] Add `mapToDatabaseCampaign()` to AirtableClient
- [ ] Create `sync-campaigns.ts`
- [ ] Update admin sync route
- [ ] Test: Sync campaigns from Airtable → PostgreSQL

### Week 3: UI
- [ ] Create `/admin/campaigns` page
- [ ] Create campaign list component
- [ ] Create campaign form component
- [ ] Create API routes (GET, POST, PATCH)
- [ ] Add navigation link
- [ ] Test: CRUD operations

### Week 4: SMS Templates Update
- [ ] Add "Template Type" field to Airtable SMS_Templates
- [ ] Set default "Standard" for all existing templates
- [ ] Run PostgreSQL migration (add template_type column)
- [ ] Update sync logic to include template_type field
- [ ] Test: Sync templates, verify backward compatibility

### Week 5: N8N Updates
- [ ] Update Kajabi API polling (campaign lookup)
- [ ] Update standard scheduler (exclude webinars + filter templates)
- [ ] Create webinar scheduler
- [ ] Test: Lead routing by source
- [ ] Test: Template isolation (Standard vs Webinar)

### Week 6: Testing
- [ ] End-to-end webinar sequence
- [ ] Timing validation
- [ ] Multi-tenant isolation test
- [ ] Admin workflows test

### Week 7: Production
- [ ] Activate webinar scheduler
- [ ] Monitor for 48 hours
- [ ] Document final field IDs
- [ ] Update COMPLETE-DEPENDENCY-MATRIX.md

---

## TESTING SCENARIOS

### Test 1: Create Webinar Campaign
```
1. Admin logs in → /admin/campaigns
2. Selects client (if SUPER_ADMIN)
3. Clicks "+ Create Campaign"
4. Fills:
   - Name: "Q4 Planning Webinar"
   - Type: Webinar
   - Form ID: "form_q4_nov6"
   - Date: Nov 6, 2025
   - Time: 2:00 PM
   - Zoom: https://zoom.us/j/123
5. Clicks "Save & Activate"
6. Verify:
   - Campaign in PostgreSQL (isPaused = FALSE)
   - Added to sync queue
   - Background job writes to Airtable
   - Appears in campaigns list (Active)
```

### Test 2: Lead Routing
```
1. Lead registers for webinar form "form_q4_nov6"
2. Kajabi API polling picks up lead
3. Looks up campaign in Airtable (Active = TRUE)
4. Sets Lead Source = "Webinar"
5. Copies webinar datetime
6. Writes to Airtable Leads
7. Sync to PostgreSQL
8. Webinar scheduler picks up (Lead Source = "Webinar")
9. Standard scheduler ignores (Lead Source != "Standard")
```

### Test 3: Message Sequence
```
1. Test lead with webinar 7 days out
2. Position 0 → Message 1 sent immediately
3. Wait 12 hours → Position 1 → Message 2 sent
4. Fast-forward to -24 hours → Position 2 → Message 3 sent
5. Fast-forward to -1 hour → Position 3 → Message 4 sent
6. Verify all timing within ±5 minutes
7. Verify Messages Sent counter incremented in Airtable
```

### Test 4: Multi-Tenant Isolation
```
1. SUPER_ADMIN creates campaign for Client A
2. SUPER_ADMIN switches to Client B
3. Verify Client A's campaigns NOT visible
4. CLIENT_ADMIN for Client A logs in
5. Verify ONLY Client A's campaigns visible
6. Verify cannot see Client B's campaigns
```

---

## CRITICAL FIELD MAPPINGS

### Airtable → PostgreSQL

```typescript
// EXACT field name mappings for sync

'Campaign Name'      → name
'Campaign Type'      → campaignType      // "Webinar" or "Standard" - keep Pascal
'Form ID'            → formId
'Webinar Datetime'   → webinarDatetime
'Zoom Link'          → zoomLink
'Resource Link'      → resourceLink
'Resource Name'      → resourceName
'Active'             → isPaused           // INVERTED: TRUE in AT = FALSE in PG
'Auto Discovered'    → autoDiscovered
'Messages Sent'      → messagesSent
'Total Leads'        → totalLeads         // Count field, read-only from Airtable
'Created By'         → createdBy (not in current schema, optional)
```

### PostgreSQL → Airtable (via sync queue)

```typescript
// When UI creates/updates campaign

payload: {
  'Campaign Name': name,
  'Campaign Type': campaignType,  // "Webinar" or "Standard"
  'Form ID': formId,
  'Webinar Datetime': webinarDatetime?.toISOString(),
  'Zoom Link': zoomLink,
  'Resource Link': resourceLink,
  'Resource Name': resourceName,
  'Active': !isPaused,  // INVERTED
  'Messages Sent': messagesSent,
}
```

---

## SUCCESS CRITERIA

**Week 1**: Airtable schema exists (Campaigns table + Lead fields)  
**Week 2**: PostgreSQL schema updated, sync working  
**Week 3**: UI can create campaigns, appears in Airtable  
**Week 4**: SMS Templates extended, backward compatible  
**Week 5**: Lead routing working by source  
**Week 6**: Webinar messages sending with correct timing  
**Week 7**: Zero interference with existing 21 standard campaigns  

---

## ROLLBACK

If critical issues:
1. Set all Campaigns Active = FALSE in Airtable
2. Deactivate `UYSP-Webinar-Nurture-Scheduler`
3. Remove campaign lookup from Kajabi polling (leads default to "Standard")
4. Diagnose, fix, re-test
5. Resume

---

**APPROVED DECISIONS**:
- ✅ Pascal case ('Webinar', 'Standard', 'Unknown')
- ✅ Client dropdown at page level (SUPER_ADMIN)
- ✅ Field names finalized (title case with spaces)
- ✅ Linked Campaign in PostgreSQL only (skip Airtable linkedRecord)
- ✅ One base per client (no shared base)
- ✅ Airtable = source of truth, PostgreSQL = cache
- ✅ Writes via sync queue with retry
- ✅ SMS_Templates extended with "Template Type" field
- ✅ Existing 21 campaigns default to "Standard" type
- ✅ Webinar templates isolated via "Webinar" type
- ✅ Template lookup uses BOTH campaign name AND template type
- ✅ Zero changes to existing campaign behavior

**BACKWARD COMPATIBILITY GUARANTEED**:
- All existing SMS templates continue working unchanged
- All existing campaigns route to Standard scheduler unchanged
- All existing template lookups work (default "Standard")
- Webinar system is completely isolated from standard operations

**READY TO IMPLEMENT**

