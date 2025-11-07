# Product Requirements Document: Mini-CRM Activity Logging System
## PostgreSQL-First Architecture with Admin UI

**Version:** 3.0 FINAL - THE GUIDING LIGHT  
**Date:** November 7, 2025  
**Status:** ✅ APPROVED - SINGLE SOURCE OF TRUTH  
**Author:** System Architect  
**Execution Timeline:** 4 weeks (72 hours total)

---

## 1. EXECUTIVE SUMMARY & VISION

### 1.1 The Problem: "System Memory Loss"

The current UYSP platform has a critical architectural flaw: **it lacks a reliable system for historical activity tracking.** It operates as a state machine, only knowing a lead's *current* status and overwriting past data. This results in "system memory loss," making it impossible to:

- See a lead's complete journey from first touch to booking
- Diagnose issues when a lead falls through the cracks
- Trust analytics (incomplete data = unreliable insights)
- Answer basic questions ("Which campaign stage has highest drop-off?")

**Current Logging (Fragile):**
- SMS_Audit table in Airtable (only SMS events)
- Written by n8n workflows with `continueOnFail: true` (silent failures possible)
- September 17, 2025 incident: 852 SMS sent, 0 audit records created
- No logging for campaigns, bookings, manual actions, or conversations

### 1.2 The Vision: A Resilient "History Book"

We will build a robust, centralized activity logging system—a **Mini-CRM**—that serves as the definitive history book for every lead. This system will:

✅ **Capture every significant interaction** as an immutable event  
✅ **Provide complete lead timelines** from first touch to conversion  
✅ **Enable trustworthy analytics** with comprehensive, reliable data  
✅ **Foundation for advanced features** (predictive scoring, automation, ML)

**The Mini-CRM will be:**
- **Resilient:** Dead-letter queue ensures zero data loss
- **Fast:** PostgreSQL queries return timelines in <50ms
- **Comprehensive:** All event types (SMS, campaigns, bookings, conversations, manual actions)
- **Queryable:** Admin UI for browsing, searching, filtering without SQL
- **Scalable:** Foundation for two-way messaging (5-7x event volume) and future features

---

## 2. GUIDING ARCHITECTURAL PRINCIPLES

This project adheres to the following **non-negotiable** principles:

### Principle #1: PostgreSQL as Single Source of Truth

**For all historical activity data, the PostgreSQL `lead_activity_log` table is the single, definitive source of truth.**

- No Airtable Message_Decision_Log writes (eliminates sync complexity)
- No dual sources of truth (eliminates sync lag and conflicts)
- Direct writes from all sources (n8n workflows, UI actions)

### Principle #2: Admin UI Replaces Airtable Browsing

**An admin UI provides BETTER visibility than Airtable:**

- Real-time viewing (no sync lag)
- Full-text search across all events
- Custom filters and views
- Fast PostgreSQL queries (<50ms)
- Export to CSV for analysis

**Investment:** 12 hours to build admin UI  
**Savings:** Zero ongoing sync maintenance (eliminates sync job complexity forever)  
**ROI:** Payback in 6 months vs maintaining sync infrastructure

### Principle #3: The "Strangler Fig" Migration Strategy

**Zero disruption to live system:**

1. **Build in parallel** (new system runs alongside old)
2. **Dual-write temporarily** (write to both old and new during transition)
3. **Cutover** (make new system primary)
4. **Decommission old** (archive SMS_Audit after proven stability)

**No big-bang migration. Gradual, safe, verifiable.**

### Principle #4: Resiliency Through Dead-Letter Queue

**All n8n workflow writes MUST be resilient:**

```
Try: Write to PostgreSQL (via API)
  ↓ Success? → Continue
  ↓ Fail after 3 retries? → Write to Retry_Queue in Airtable
                          → Alert DevOps via Slack
                          → Manual recovery process
```

**Result:** No event is ever permanently lost.

### Principle #5: Clay Integration Unchanged

**Lead enrichment waterfall remains untouched:**

```
Kajabi Form → Airtable Leads
  ↓
Airtable triggers Clay webhook
  ↓
Clay enriches (company, title, etc.)
  ↓
Clay writes back to Airtable
  ↓
Existing sync: Airtable Leads → PostgreSQL leads (every 5 min)
```

**Activity logging is independent:** Clay never touches activity logs. This separation ensures clean architecture.

---

## 3. USER STORIES & CORE FEATURES

### User Story #1: Complete Lead Timeline

**As an Admin, I want to see a complete, chronological history of all interactions with a lead** (messages sent, replies received, campaigns enrolled, bookings confirmed, status changes, notes added) **so that I can quickly understand their full journey and spot issues.**

**Acceptance Criteria:**
- Lead detail page has "Activity Timeline" tab
- Shows all events in reverse chronological order
- Each event shows: timestamp, type, description, details
- Events are categorized with icons/colors for quick scanning
- Clicking event expands to show full metadata

### User Story #2: Zero Data Loss

**As an Operator, I want to be 100% confident that every single message sent is logged,** even if a downstream service is temporarily unavailable, **so that I can trust our analytics and maintain compliance.**

**Acceptance Criteria:**
- n8n workflows retry activity log writes 3 times
- Failed writes go to Retry_Queue (visible in Airtable)
- Slack alerts fire on persistent failures
- Manual recovery process documented
- Health dashboard shows logging status

### User Story #3: Fast, Queryable History

**As an Analyst, I want to query a fast, reliable, and well-structured database of lead events** so that I can build accurate dashboards (e.g., "What % of leads reply within 24 hours?", "Which campaign has highest drop-off?").

**Acceptance Criteria:**
- PostgreSQL queries return results in <100ms
- Proper indexes on lead_id, timestamp, event_type
- Can join with leads table for enriched queries
- Support for date range, event type, lead filters

### User Story #4: Admin Browsing & Troubleshooting

**As an Admin, I want to browse all system events in a user-friendly interface** (search, filter, sort) **without writing SQL queries, so I can troubleshoot issues and spot patterns.**

**Acceptance Criteria:**
- Admin UI at /admin/activity-logs
- Search by lead name, email, message content
- Filter by event type, category, date range
- Sort by timestamp, lead, event type
- Pagination (50 events per page)
- Export to CSV
- Auto-refresh every 30 seconds

---

## 4. TECHNICAL SPECIFICATION

### 4.1 PostgreSQL Schema

**Table: `lead_activity_log`**

```typescript
// uysp-client-portal/src/lib/db/schema.ts

export const leadActivityLog = pgTable(
  'lead_activity_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // Event Classification
    eventType: varchar('event_type', { length: 100 }).notNull(),
    eventCategory: varchar('event_category', { length: 50 }).notNull(),
    
    // Lead Context
    leadId: uuid('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
    leadAirtableId: varchar('lead_airtable_id', { length: 255 }),  // For correlation before sync
    clientId: uuid('client_id').references(() => clients.id),
    
    // Event Details
    description: text('description').notNull(),  // Human-readable event description
    messageContent: text('message_content'),  // For SMS/conversation events
    metadata: jsonb('metadata'),  // Flexible JSON for event-specific data
    
    // Source Attribution
    source: varchar('source', { length: 100 }).notNull(),  // 'n8n:workflow_id' or 'ui:endpoint_name'
    executionId: varchar('execution_id', { length: 255 }),  // n8n execution ID for tracing
    createdBy: uuid('created_by').references(() => users.id),  // For UI actions
    
    // Timestamps
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    // Performance indexes
    leadIdTimeIdx: index('idx_activity_lead_time').on(table.leadId, table.timestamp),
    leadAirtableIdx: index('idx_activity_lead_airtable').on(table.leadAirtableId),
    eventTypeIdx: index('idx_activity_event_type').on(table.eventType),
    eventCategoryIdx: index('idx_activity_event_category').on(table.eventCategory),
    timestampIdx: index('idx_activity_timestamp').on(table.timestamp),
    // Full-text search index on description + messageContent
    searchIdx: index('idx_activity_search').using('gin', sql`to_tsvector('english', description || ' ' || COALESCE(message_content, ''))`)
  })
);
```

**Key Design Decisions:**

- **Simple schema:** 11 core fields + indexes
- **Flexible metadata:** JSONB for event-specific data (no schema drift)
- **leadAirtableId:** Allows logging events even if lead not yet synced to PostgreSQL
- **Full-text search index:** Fast search across descriptions and message content
- **Cascade delete:** When lead deleted, activity log deleted too (data cleanup)

### 4.2 Event Type Standard

**File:** `uysp-client-portal/src/lib/activity/event-types.ts`

```typescript
export const EVENT_TYPES = {
  // SMS Events
  MESSAGE_SENT: 'MESSAGE_SENT',
  MESSAGE_FAILED: 'MESSAGE_FAILED',
  MESSAGE_DELIVERED: 'MESSAGE_DELIVERED',
  INBOUND_REPLY: 'INBOUND_REPLY',
  LINK_CLICKED: 'LINK_CLICKED',
  OPT_OUT: 'OPT_OUT',
  
  // Campaign Events
  CAMPAIGN_ENROLLED: 'CAMPAIGN_ENROLLED',
  CAMPAIGN_REMOVED: 'CAMPAIGN_REMOVED',
  CAMPAIGN_COMPLETED: 'CAMPAIGN_COMPLETED',
  
  // Booking Events
  BOOKING_CONFIRMED: 'BOOKING_CONFIRMED',
  BOOKING_CANCELLED: 'BOOKING_CANCELLED',
  BOOKING_RESCHEDULED: 'BOOKING_RESCHEDULED',
  
  // Manual Events
  STATUS_CHANGED: 'STATUS_CHANGED',
  NOTE_ADDED: 'NOTE_ADDED',
  LEAD_CLAIMED: 'LEAD_CLAIMED',
  
  // Two-Way Conversation Events (Future)
  AI_RESPONSE_SENT: 'AI_RESPONSE_SENT',
  QUALIFYING_QUESTION_ASKED: 'QUALIFYING_QUESTION_ASKED',
  QUALIFYING_ANSWER_CAPTURED: 'QUALIFYING_ANSWER_CAPTURED',
  NURTURE_SCHEDULED: 'NURTURE_SCHEDULED',
  CIRCUIT_BREAKER_TRIGGERED: 'CIRCUIT_BREAKER_TRIGGERED',
  CONVERSATION_ESCALATED: 'CONVERSATION_ESCALATED',
  
  // System Events
  ENRICHMENT_COMPLETED: 'ENRICHMENT_COMPLETED',
  ICP_SCORE_UPDATED: 'ICP_SCORE_UPDATED'
} as const;

export const EVENT_CATEGORIES = {
  SMS: 'SMS',
  CAMPAIGN: 'CAMPAIGN',
  BOOKING: 'BOOKING',
  CONVERSATION: 'CONVERSATION',
  MANUAL: 'MANUAL',
  SYSTEM: 'SYSTEM'
} as const;
```

### 4.3 Backend API Endpoints

#### Endpoint #1: POST /api/internal/log-activity

**Purpose:** Central logging endpoint for all system components

**File:** `src/app/api/internal/log-activity/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { leadActivityLog, leads } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  // SECURITY: Internal API key or n8n source IP whitelist
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== process.env.INTERNAL_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const {
      eventType,
      eventCategory,
      leadId,  // PostgreSQL UUID (if known)
      leadAirtableId,  // Always provided
      description,
      messageContent,
      metadata,
      source,
      executionId,
      createdBy,
      timestamp
    } = await request.json();
    
    // Validation
    if (!eventType || !eventCategory || !leadAirtableId || !description || !source) {
      return NextResponse.json(
        { error: 'Missing required fields: eventType, eventCategory, leadAirtableId, description, source' },
        { status: 400 }
      );
    }
    
    // Find lead by Airtable ID if not provided
    let finalLeadId = leadId;
    if (!finalLeadId && leadAirtableId) {
      const lead = await db.query.leads.findFirst({
        where: eq(leads.airtableRecordId, leadAirtableId)
      });
      finalLeadId = lead?.id || null;
    }
    
    // Insert activity log
    const [activity] = await db.insert(leadActivityLog).values({
      eventType,
      eventCategory,
      leadId: finalLeadId,
      leadAirtableId,
      clientId: null,  // TODO: Multi-tenant support later
      description,
      messageContent: messageContent || null,
      metadata: metadata || null,
      source,
      executionId: executionId || null,
      createdBy: createdBy || null,
      timestamp: timestamp ? new Date(timestamp) : new Date()
    }).returning();
    
    // Update lead's last_activity_at timestamp (if lead exists)
    if (finalLeadId) {
      await db.update(leads)
        .set({ lastActivityAt: new Date() })
        .where(eq(leads.id, finalLeadId));
    }
    
    return NextResponse.json({
      success: true,
      activityId: activity.id,
      timestamp: activity.timestamp
    });
    
  } catch (error) {
    console.error('[LOG-ACTIVITY] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
```

**Key Features:**
- ✅ Accepts either PostgreSQL UUID or Airtable ID for lead
- ✅ Looks up lead if only Airtable ID provided
- ✅ Updates lead.lastActivityAt for UI display
- ✅ Returns activity ID for correlation
- ✅ Comprehensive error logging

#### Endpoint #2: GET /api/admin/activity-logs

**Purpose:** Power admin activity browser UI

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { leadActivityLog, leads } from '@/lib/db/schema';
import { desc, eq, and, like, sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // SECURITY: Admin only
  if (!session?.user || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const searchParams = request.nextUrl.searchParams;
  
  // Query parameters
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const search = searchParams.get('search');
  const eventType = searchParams.get('eventType');
  const eventCategory = searchParams.get('eventCategory');
  const leadId = searchParams.get('leadId');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  
  // Build WHERE clause
  const conditions = [];
  
  if (search) {
    // Full-text search on description + messageContent
    conditions.push(
      sql`to_tsvector('english', ${leadActivityLog.description} || ' ' || COALESCE(${leadActivityLog.messageContent}, '')) @@ plainto_tsquery('english', ${search})`
    );
  }
  
  if (eventType) {
    conditions.push(eq(leadActivityLog.eventType, eventType));
  }
  
  if (eventCategory) {
    conditions.push(eq(leadActivityLog.eventCategory, eventCategory));
  }
  
  if (leadId) {
    conditions.push(eq(leadActivityLog.leadId, leadId));
  }
  
  if (dateFrom) {
    conditions.push(sql`${leadActivityLog.timestamp} >= ${new Date(dateFrom)}`);
  }
  
  if (dateTo) {
    conditions.push(sql`${leadActivityLog.timestamp} <= ${new Date(dateTo)}`);
  }
  
  // Execute query with pagination
  const offset = (page - 1) * limit;
  
  const activities = await db.select({
    activity: leadActivityLog,
    lead: {
      id: leads.id,
      firstName: leads.firstName,
      lastName: leads.lastName,
      email: leads.email
    }
  })
  .from(leadActivityLog)
  .leftJoin(leads, eq(leadActivityLog.leadId, leads.id))
  .where(conditions.length > 0 ? and(...conditions) : undefined)
  .orderBy(desc(leadActivityLog.timestamp))
  .limit(limit)
  .offset(offset);
  
  // Get total count for pagination
  const [{ count }] = await db.select({ count: sql<number>`count(*)` })
    .from(leadActivityLog)
    .where(conditions.length > 0 ? and(...conditions) : undefined);
  
  return NextResponse.json({
    activities: activities.map(a => ({
      id: a.activity.id,
      timestamp: a.activity.timestamp,
      eventType: a.activity.eventType,
      category: a.activity.eventCategory,
      description: a.activity.description,
      messageContent: a.activity.messageContent,
      metadata: a.activity.metadata,
      source: a.activity.source,
      lead: a.lead
    })),
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  });
}
```

#### Endpoint #3: GET /api/leads/[id]/activity

**Purpose:** Lead-specific timeline for lead detail page

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const activities = await db.query.leadActivityLog.findMany({
    where: eq(leadActivityLog.leadId, id),
    orderBy: desc(leadActivityLog.timestamp),
    limit: 100
  });
  
  return NextResponse.json({
    timeline: activities.map(a => ({
      id: a.id,
      timestamp: a.timestamp,
      eventType: a.eventType,
      category: a.eventCategory,
      description: a.description,
      message: a.messageContent,
      details: a.metadata,
      source: a.source
    }))
  });
}
```

### 4.4 UI Logging Helper Function

**File:** `src/lib/activity/logger.ts`

```typescript
import { db } from '@/lib/db';
import { leadActivityLog, leads } from '@/lib/db/schema';
import { EVENT_TYPES, EVENT_CATEGORIES } from './event-types';
import { eq } from 'drizzle-orm';

interface LogActivityParams {
  eventType: keyof typeof EVENT_TYPES;
  eventCategory: keyof typeof EVENT_CATEGORIES;
  leadId?: string;  // PostgreSQL UUID
  leadAirtableId?: string;  // Airtable record ID
  description: string;
  messageContent?: string;
  metadata?: Record<string, any>;
  source: string;
  createdBy?: string;
  timestamp?: Date;
}

export async function logLeadActivity(params: LogActivityParams): Promise<void> {
  try {
    // Require either leadId or leadAirtableId
    if (!params.leadId && !params.leadAirtableId) {
      throw new Error('Must provide either leadId or leadAirtableId');
    }
    
    // Find lead if only Airtable ID provided
    let finalLeadId = params.leadId;
    if (!finalLeadId && params.leadAirtableId) {
      const lead = await db.query.leads.findFirst({
        where: eq(leads.airtableRecordId, params.leadAirtableId)
      });
      finalLeadId = lead?.id;
    }
    
    // Insert activity log
    await db.insert(leadActivityLog).values({
      eventType: EVENT_TYPES[params.eventType],
      eventCategory: EVENT_CATEGORIES[params.eventCategory],
      leadId: finalLeadId || null,
      leadAirtableId: params.leadAirtableId || null,
      description: params.description,
      messageContent: params.messageContent || null,
      metadata: params.metadata || null,
      source: params.source,
      createdBy: params.createdBy || null,
      timestamp: params.timestamp || new Date()
    });
    
    // Update lead's last activity timestamp
    if (finalLeadId) {
      await db.update(leads)
        .set({ lastActivityAt: new Date() })
        .where(eq(leads.id, finalLeadId));
    }
    
  } catch (error) {
    // CRITICAL: Activity logging must NEVER break the application
    console.error('[ACTIVITY LOG] Failed to log event:', error);
    console.error('[ACTIVITY LOG] Event params:', params);
    // Don't throw - application continues
  }
}
```

### 4.5 n8n Logging Pattern (Resilient)

**Standard pattern for ALL n8n workflows:**

**Step 1: Prepare Log Data (Code Node)**

```javascript
// Node: "Prepare Activity Log Entry"
const logEntry = {
  eventType: 'MESSAGE_SENT',
  eventCategory: 'SMS',
  leadAirtableId: $json.lead_airtable_id,
  description: `SMS sent: ${$json.message_text.substring(0, 50)}...`,
  messageContent: $json.message_text,
  metadata: {
    campaign_id: $json.campaign,
    phone: $json.phone,
    template_id: $json.template_id
  },
  source: 'n8n:kJMMZ10anu4NqYUL',
  executionId: $execution.id,
  timestamp: new Date().toISOString()
};

return [{ json: logEntry }];
```

**Step 2: Write to PostgreSQL via API (HTTP Request Node)**

```json
{
  "name": "Write to Activity Log",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "https://uysp-portal-v2.onrender.com/api/internal/log-activity",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={{ $json }}"
  },
  "retryOnFail": true,
  "maxTries": 3,
  "waitBetweenTries": 2000,
  "continueOnFail": true
}
```

**Step 3: Catch Failures → Retry_Queue (Error Output)**

```json
{
  "name": "Fallback to Retry_Queue",
  "type": "n8n-nodes-base.airtable",
  "parameters": {
    "operation": "create",
    "base": "app4wIsBfpJTg7pWS",
    "table": "tblsmRKDX7chymBwp",
    "columns": {
      "queue_id": "={{ $execution.id }}-{{ $itemIndex }}",
      "operation_type": "activity_log",
      "lead_id": "={{ $json.leadAirtableId }}",
      "payload": "={{ JSON.stringify($json) }}",
      "retry_count": 0,
      "next_retry_at": "={{ $now.plus({minutes: 5}).toISO() }}",
      "created_at": "={{ $now.toISO() }}"
    }
  }
}
```

**Step 4: Alert on Failure (Slack)**

```json
{
  "name": "Alert DevOps",
  "type": "n8n-nodes-base.slack",
  "parameters": {
    "channelId": "C09DAEWGUSY",
    "text": "⚠️ Activity Log Failed\n\nExecution: {{ $execution.id }}\nLead: {{ $json.leadAirtableId }}\nEvent: {{ $json.eventType }}\n\nWritten to Retry_Queue."
  }
}
```

**Result:** Resilient logging with visible failure recovery

---

## 5. THE STRANGLER FIG MIGRATION PLAN

### Phase 1: Parallel Build (Week 1) - 20 Hours

**Goal:** Build new system "dark" without affecting live application

**Tasks:**
1. Create PostgreSQL table (lead_activity_log)
2. Run migration
3. Build POST /api/internal/log-activity endpoint
4. Build GET /api/admin/activity-logs endpoint  
5. Build admin activity browser UI at /admin/activity-logs
6. Build GET /api/leads/[id]/activity endpoint
7. Test all endpoints with mock data

**Verification:**
- Screenshot of empty admin UI (functional but no data yet)
- API endpoint tests passing
- PostgreSQL table created and indexed

**Deliverables:**
- Migration file
- 3 API endpoints
- Admin browser UI component
- Test suite

### Phase 2: Dual-Writing & Instrumentation (Week 2-3) - 28 Hours

**Goal:** Start populating new system while old system continues

#### Week 2: n8n Workflows (16 hours)

**Instrument:**
1. **UYSP-Kajabi-SMS-Scheduler** - Add MESSAGE_SENT/MESSAGE_FAILED logging
2. **UYSP-Calendly-Booked** - Add BOOKING_CONFIRMED logging
3. **UYSP-SimpleTexting-Reply-Handler** - Add INBOUND_REPLY logging
4. **UYSP-ST-Delivery V2** - Add MESSAGE_DELIVERED logging

**Pattern for each:**
- Add "Prepare Activity Log Entry" code node
- Add "Write to Activity Log" HTTP request node (with retry)
- Add "Fallback to Retry_Queue" error handler
- Add "Alert DevOps" Slack notification
- Test and deploy

**Keep SMS_Audit writes** (dual-write phase)

#### Week 3: UI Actions (12 hours)

**Instrument:**
1. Campaign enrollment (`/api/campaigns/[id]/enroll`)
2. Campaign removal (`/api/leads/[id]/remove-from-campaign`)
3. Status changes (`/api/leads/[id]/status`)
4. Notes added (`/api/leads/[id]/notes`)
5. Lead claimed (add to existing claim endpoint)

**Pattern for each:**
```typescript
import { logLeadActivity } from '@/lib/activity/logger';

await logLeadActivity({
  eventType: 'CAMPAIGN_ENROLLED',
  eventCategory: 'CAMPAIGN',
  leadId: lead.id,
  description: `Enrolled in ${campaign.name}`,
  metadata: { campaign_id: campaign.id },
  source: 'ui:campaign-enroll',
  createdBy: session.user.id
});
```

**Verification:**
- Activity log table populating
- All event types appearing
- Admin UI shows real data

### Phase 3: The Cutover (Week 4) - 12 Hours

**Goal:** Make new system the primary user interface

**Tasks:**
1. **Add navigation link** - Activity Logs visible in admin sidebar
2. **Integrate timeline** - Add "Activity" tab to lead detail page
3. **Build timeline component** - Beautiful, informative activity feed
4. **Remove SMS_Audit writes** - Stop writing to old table in n8n workflows
5. **Add deprecation notice** - Mark SMS_Audit as deprecated in Airtable

**Verification:**
- Users can browse activity logs via admin UI
- Lead timelines visible in portal
- SMS_Audit no longer receiving new writes

**Deliverables:**
- Lead timeline component
- Updated lead detail page
- Navigation updates
- User announcement

### Phase 4: Decommissioning (Future) - 8 Hours

**Goal:** Clean up legacy system after proven stability

**Tasks:**
1. **Backfill historical data** - One-time migration of SMS_Audit → activity_log
2. **Archive SMS_Audit** - Export to CSV, mark as archived in Airtable
3. **Remove old code** - Clean up SMS_Audit references in codebase
4. **Documentation update** - Update SOPs to reference new system

**Timeline:** 30 days after Phase 3 cutover (only after proven stable)

---

## 6. IMPLEMENTATION TIMELINE

### Week 1: Foundation (20 hours)

**Monday (6 hours):**
- Create feature branch
- Define EVENT_TYPES constants
- Create PostgreSQL schema
- Generate and run migration

**Tuesday (6 hours):**
- Build POST /api/internal/log-activity endpoint
- Write comprehensive tests
- Deploy to staging

**Wednesday (4 hours):**
- Build UI logging helper (lib/activity/logger.ts)
- Test from UI context

**Thursday (4 hours):**
- Build GET /api/admin/activity-logs endpoint
- Test with mock data

**Friday:** BUFFER DAY (catch-up, code review)

**Weekend deliverable:** Foundation complete, ready for instrumentation

---

### Week 2: n8n Workflows (16 hours)

**Monday (4 hours):**
- Backup Kajabi scheduler workflow
- Add activity logging to Kajabi scheduler
- Add retry queue fallback

**Tuesday (4 hours):**
- Test Kajabi scheduler with activity logging
- Deploy to production
- Monitor for issues

**Wednesday (4 hours):**
- Add activity logging to Calendly workflow
- Add activity logging to Reply Handler workflow

**Thursday (4 hours):**
- Add activity logging to Delivery Status workflow
- Test all workflows end-to-end

**Friday:** VERIFY - Check activity_log table has events from all sources

**Weekend deliverable:** All n8n workflows logging successfully

---

### Week 3: UI Actions (12 hours)

**Monday (3 hours):**
- Add logging to campaign enrollment
- Add logging to campaign removal

**Tuesday (3 hours):**
- Add logging to status changes
- Add logging to notes

**Wednesday (3 hours):**
- Add logging to lead claiming
- Test all UI logging

**Thursday (3 hours):**
- End-to-end testing
- Verify all touchpoints logging

**Friday:** VERIFY - Create test lead, perform all actions, check timeline

**Weekend deliverable:** Comprehensive event coverage

---

### Week 4: UI & Cutover (12 hours)

**Monday (6 hours):**
- Build admin activity browser UI
- Add search, filters, pagination
- Add export to CSV

**Tuesday (4 hours):**
- Build lead timeline component
- Integrate into lead detail page

**Wednesday (2 hours):**
- Add navigation links
- Deploy admin UI
- User testing

**Thursday:** CUTOVER
- Remove SMS_Audit writes from n8n workflows
- Announce new Activity Log feature
- Monitor for issues

**Friday:** VERIFY - Confirm new system is primary, old system deprecated

**Weekend deliverable:** Mini-CRM activity logging LIVE

---

## 7. ADMIN ACTIVITY BROWSER UI SPECIFICATION

### Page: /admin/activity-logs

**Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│ 🔍 Search: [________________________] 🔄 Auto-refresh: [ON ▼]   │
├─────────────────────────────────────────────────────────────────┤
│ Filters:                                                        │
│ Event Type: [All ▼] Category: [All ▼] Date: [Last 24h ▼]     │
├─────────────────────────────────────────────────────────────────┤
│ 💬 MESSAGE_SENT • John Smith • 2 minutes ago                   │
│ ├─ "Hey John, saw your form submission..."                     │
│ ├─ Campaign: chatgpt_use_cases | Phone: 408-555-1234          │
│ └─ Source: n8n:kajabi-scheduler | Execution: 28973            │
│    [📋 Copy Execution ID] [👁️ View Full Details]               │
├─────────────────────────────────────────────────────────────────┤
│ 📅 BOOKING_CONFIRMED • Sarah Lee • 15 minutes ago              │
│ ├─ Calendly booking confirmed                                  │
│ ├─ Scheduled: Nov 10, 2pm ET                                   │
│ └─ Source: n8n:calendly-webhook | Event: evt_abc123           │
├─────────────────────────────────────────────────────────────────┤
│ 📊 CAMPAIGN_ENROLLED • Mike Chen • 1 hour ago                  │
│ ├─ Enrolled in campaign: Problem Mapping Template              │
│ ├─ By: admin@rebel.com (UI)                                    │
│ └─ Source: ui:campaign-enroll                                  │
└─────────────────────────────────────────────────────────────────┘
Showing 1-50 of 2,847 events        [Export CSV] [< 1 2 3 4 ... >]
```

**Features:**
- ⚡ **Fast:** PostgreSQL full-text search
- 🔍 **Powerful:** Search message content, lead names, metadata
- 📊 **Filterable:** Event type, category, date range, lead
- 📥 **Exportable:** CSV download for analysis
- 🔄 **Real-time:** Auto-refresh every 30 seconds (toggleable)
- 👁️ **Detailed:** Click to expand full metadata JSON

**File:** `src/app/(dashboard)/admin/activity-logs/page.tsx`

---

## 8. SUCCESS METRICS & VERIFICATION

### Week 2 Metrics (After n8n Instrumentation)

**✅ Coverage:**
- 100% of SMS sends logged
- 100% of bookings logged
- 100% of replies logged
- 100% of delivery status logged

**✅ Performance:**
- API latency <200ms (p99)
- Zero workflow failures from logging

**✅ Reliability:**
- Retry_Queue size <5 (occasional failures acceptable)
- Zero silent data loss

### Week 4 Metrics (After Full Deployment)

**✅ Completeness:**
- Campaign enrollments logged
- Status changes logged
- Notes logged
- Manual actions logged

**✅ UI Performance:**
- Timeline loads in <500ms
- Admin browser query <200ms
- Full-text search <300ms

**✅ Adoption:**
- Admin team uses activity browser for troubleshooting
- PM team uses lead timelines for context
- Analytics queries use activity_log table

---

## 9. RISKS & MITIGATIONS

### Risk #1: PostgreSQL Endpoint Down

**Likelihood:** Low (Render 99.9% uptime)  
**Impact:** High (no activity logging during outage)  
**Mitigation:**
- n8n continueOnFail (workflows don't break)
- Retry_Queue captures failures
- Slack alerts fire immediately
- Manual recovery from n8n execution logs
- **Acceptable:** Temporary gap better than sync complexity

### Risk #2: Lead Not Yet Synced to PostgreSQL

**Likelihood:** Medium (activity happens before 5-min lead sync)  
**Impact:** Low (activity logged with Airtable ID, still queryable)  
**Mitigation:**
- leadAirtableId always captured
- leadId nullable in schema
- Activity log queries can use Airtable ID if needed
- Background process can backfill leadId when lead syncs

### Risk #3: Admin UI Not as Good as Airtable

**Likelihood:** Low (we control the UI, can make it better)  
**Impact:** Medium (user frustration)  
**Mitigation:**
- Build with user feedback
- Include features Airtable doesn't have (full-text search, real-time)
- Export to CSV for analysis in Excel/Sheets
- Can always add features (Airtable is limited)

---

## 10. TOTAL INVESTMENT

**Week 1:** 20 hours (foundation)  
**Week 2:** 16 hours (n8n workflows)  
**Week 3:** 12 hours (UI actions)  
**Week 4:** 12 hours (admin UI + cutover)  
**Future:** 8 hours (cleanup + backfill)

**TOTAL:** 68 hours over 4 weeks

**ROI:**
- Zero ongoing sync maintenance (vs 24 hours/year if we had sync)
- Complete lead history tracking
- Foundation for predictive analytics, automation, ML
- Trustworthy data for business decisions

---

## 11. FUTURE ENHANCEMENTS (Post-Launch)

### Quarter 2: Advanced Features

**Real-Time Activity Stream** (8 hours)
- WebSocket connection
- Live activity updates without refresh
- "Lead is replying..." live indicators

**Activity-Based Triggers** (20 hours)
- Auto-escalate if lead views resource 3x but doesn't book
- Alert when high-value lead goes quiet for 7 days
- Workflow automation based on activity patterns

### Quarter 3: Analytics & ML

**Predictive Lead Scoring** (40 hours)
- ML model: Predict likelihood to book from activity pattern
- Example: Reply within 2 hours + link click = 85% book rate
- Auto-prioritize high-score leads

**Funnel Optimization** (20 hours)
- Identify drop-off points in sequence
- A/B test optimal timing based on activity data
- Automated campaign tuning

---

## 12. ACCOUNTABILITY & SUCCESS CRITERIA

### For Execution Agent

**You MUST deliver:**
- [ ] All 4 phases completed in 4 weeks
- [ ] Zero disruption to live system
- [ ] 100% event coverage (all touchpoints logging)
- [ ] Admin UI functional and performant
- [ ] Documentation complete
- [ ] Zero data loss events

**Evidence required:**
- Migration files in git
- Test results for all endpoints
- Screenshot of working admin UI
- Query showing activity log records
- Verification that all workflows logging

### Definition of Done

**The Mini-CRM Activity Logging System is DONE when:**

1. ✅ PostgreSQL lead_activity_log table exists and indexed
2. ✅ All n8n workflows log events (SMS scheduler, Calendly, reply handler, delivery)
3. ✅ All UI actions log events (campaign enrollment, status changes, notes)
4. ✅ Admin activity browser UI is live and accessible
5. ✅ Lead detail page shows activity timeline
6. ✅ Retry_Queue catches and alerts on failures
7. ✅ SMS_Audit deprecated and marked for archival
8. ✅ Documentation updated (SOPs reference new system)
9. ✅ Zero silent data loss for 1 week continuous operation
10. ✅ Admin team confirms UI meets their troubleshooting needs

---

## 13. KEY DECISIONS CODIFIED

### Decision #1: PostgreSQL as Single Source of Truth

**Rationale:**
- Admin UI provides same browsing capability as Airtable
- Eliminates sync complexity (one less thing to fail)
- Faster queries for UI (direct PostgreSQL vs Airtable API)
- Scales to millions of events (Airtable has record limits)

**Trade-off accepted:** 12 hours to build admin UI vs ongoing sync maintenance

### Decision #2: Direct Writes from n8n

**Rationale:**
- n8n → API → PostgreSQL (one hop, minimal latency)
- Retry logic in n8n (3 attempts built-in)
- Retry_Queue catches persistent failures (visible in Airtable)
- Simpler than dual writes (Airtable + PostgreSQL)

### Decision #3: Flexible Metadata JSON

**Rationale:**
- Different event types need different data
- JSONB metadata field = no schema drift
- Can add new event types without migrations
- PostgreSQL JSONB is fast and queryable

### Decision #4: Clay Integration Unchanged

**Rationale:**
- Lead enrichment is separate concern from activity logging
- Clay works with Airtable Leads table (keep as-is)
- Activity logs are pure operational data (Clay doesn't need them)
- Clean separation of concerns

---

## 14. EXECUTION CHECKLIST (FOR IMPLEMENTATION AGENT)

### Pre-Flight

- [ ] Read this entire PRD
- [ ] Understand strangler fig pattern
- [ ] Understand PostgreSQL-first architecture
- [ ] Review EVENT_TYPES specification
- [ ] Create feature branch: `feature/mini-crm-activity-logging`

### Week 1: Foundation

- [ ] Create lead_activity_log table schema
- [ ] Generate migration
- [ ] Run migration in staging
- [ ] Build POST /api/internal/log-activity
- [ ] Build GET /api/admin/activity-logs
- [ ] Build admin activity browser UI
- [ ] Build GET /api/leads/[id]/activity
- [ ] Test all endpoints
- [ ] Deploy to production (no user-facing changes yet)

### Week 2: n8n Workflows

- [ ] Backup all workflows
- [ ] Add logging to Kajabi scheduler
- [ ] Add logging to Calendly workflow
- [ ] Add logging to Reply Handler
- [ ] Add logging to Delivery Status
- [ ] Add Retry_Queue fallback to all
- [ ] Test each workflow
- [ ] Deploy to production
- [ ] Monitor Retry_Queue (should be empty or <5 records)

### Week 3: UI Actions

- [ ] Add logging to campaign enrollment
- [ ] Add logging to campaign removal
- [ ] Add logging to status changes
- [ ] Add logging to notes
- [ ] Add logging to lead claiming
- [ ] Test all UI actions
- [ ] Verify events appearing in activity log

### Week 4: Cutover

- [ ] Add "Activity Logs" to admin navigation
- [ ] Build lead timeline component
- [ ] Add "Activity" tab to lead detail page
- [ ] Remove SMS_Audit writes from workflows
- [ ] Add deprecation notice to SMS_Audit
- [ ] Announce feature to users
- [ ] Monitor for 1 week

### Post-Launch (Week 5+)

- [ ] Backfill SMS_Audit historical data
- [ ] Archive SMS_Audit table
- [ ] Document recovery procedures
- [ ] Update all SOPs

---

## 15. TECHNICAL REFERENCE

### Complete Event Types

```typescript
MESSAGE_SENT          // SMS sent successfully
MESSAGE_FAILED        // SMS send failed (API error)
MESSAGE_DELIVERED     // Delivery confirmation from carrier
INBOUND_REPLY         // Lead replied to SMS
LINK_CLICKED          // Lead clicked link in message
OPT_OUT               // Lead sent STOP command

CAMPAIGN_ENROLLED     // Lead added to campaign
CAMPAIGN_REMOVED      // Lead removed from campaign
CAMPAIGN_COMPLETED    // Lead completed campaign sequence

BOOKING_CONFIRMED     // Calendly booking confirmed
BOOKING_CANCELLED     // Calendly booking cancelled
BOOKING_RESCHEDULED   // Calendly booking rescheduled

STATUS_CHANGED        // Manual status update via UI
NOTE_ADDED            // Note added to lead via UI
LEAD_CLAIMED          // PM claimed lead via UI

// Two-Way Messaging (Future)
AI_RESPONSE_SENT
QUALIFYING_QUESTION_ASKED
QUALIFYING_ANSWER_CAPTURED
NURTURE_SCHEDULED
CIRCUIT_BREAKER_TRIGGERED
CONVERSATION_ESCALATED

// System Events
ENRICHMENT_COMPLETED
ICP_SCORE_UPDATED
```

### Example Activity Log Records

**SMS Sent:**
```json
{
  "event_type": "MESSAGE_SENT",
  "event_category": "SMS",
  "lead_airtable_id": "recABC123",
  "description": "SMS sent: Hey John, saw your form submission...",
  "message_content": "Hey John, saw your form submission. If you want help...",
  "metadata": {
    "campaign_id": "chatgpt_use_cases",
    "phone": "4085551234",
    "template_id": "recXYZ789",
    "simpletexting_id": "12345"
  },
  "source": "n8n:kJMMZ10anu4NqYUL",
  "execution_id": "28973",
  "timestamp": "2025-11-07T08:15:05Z"
}
```

**Campaign Enrollment:**
```json
{
  "event_type": "CAMPAIGN_ENROLLED",
  "event_category": "CAMPAIGN",
  "lead_id": "uuid-123",
  "description": "Enrolled in campaign: Problem Mapping Template",
  "metadata": {
    "campaign_id": "uuid-456",
    "campaign_name": "Problem Mapping Template",
    "enrolled_by_user_id": "uuid-789",
    "enrolled_by_email": "admin@rebel.com"
  },
  "source": "ui:campaign-enroll",
  "created_by": "uuid-789",
  "timestamp": "2025-11-07T14:30:00Z"
}
```

**Booking Confirmed:**
```json
{
  "event_type": "BOOKING_CONFIRMED",
  "event_category": "BOOKING",
  "lead_id": "uuid-123",
  "description": "Calendly booking confirmed",
  "metadata": {
    "calendly_event_uri": "evt_abc123",
    "scheduled_at": "2025-11-10T14:00:00Z",
    "invitee_name": "Sarah Lee",
    "event_type": "Strategy Call"
  },
  "source": "n8n:LiVE3BlxsFkHhG83",
  "execution_id": "29045",
  "timestamp": "2025-11-07T15:22:10Z"
}
```

---

## 16. DEPENDENCIES & PREREQUISITES

### System Dependencies

- ✅ PostgreSQL database (Render) - already provisioned
- ✅ n8n Cloud account - already configured
- ✅ Airtable base (for Retry_Queue only) - already exists
- ✅ uysp-client-portal codebase - already built
- ✅ Drizzle ORM - already configured

### Code Dependencies

**New npm packages:**
- None (uses existing stack)

**Existing packages used:**
- @tanstack/react-query (for timeline component)
- date-fns (for timestamp formatting)
- drizzle-orm (for database queries)

### Access Requirements

- [ ] PostgreSQL database credentials
- [ ] n8n workflow edit permissions
- [ ] Airtable API token (for Retry_Queue writes)
- [ ] GitHub repository access
- [ ] Render deployment permissions

---

## 17. ROLLBACK PLAN

### If Phase 1 Fails
- Delete migration
- Remove API endpoints
- Remove admin UI component
- **Impact:** Zero (nothing is live yet)

### If Phase 2 Fails
- Remove activity logging nodes from n8n workflows
- Remove UI logging calls
- **Impact:** Low (old SMS_Audit still working)

### If Phase 3 Fails
- Hide admin UI navigation link
- Remove timeline tab from lead detail
- Re-enable SMS_Audit writes
- **Impact:** Medium (revert to old system)

### If Phase 4 Fails
- Keep both systems running (belt and suspenders)
- Fix issues before final deprecation
- **Impact:** Low (redundancy is acceptable short-term)

---

## 18. APPENDIX: ALTERNATIVES CONSIDERED & REJECTED

### Alternative A: Airtable-First with Sync

**Description:** Write to Airtable Message_Decision_Log, sync to PostgreSQL

**Rejected Because:**
- Sync complexity (one more thing to maintain)
- Sync lag (5 minutes)
- Two sources of truth (conflict resolution needed)
- Ongoing maintenance cost >12 hours/year

### Alternative B: Airtable-Only (No PostgreSQL)

**Description:** Use only Airtable for activity logging

**Rejected Because:**
- Slow queries (Airtable API is 10-100x slower)
- Record limits (50K-100K records on plans)
- No complex joins (can't join with leads efficiently)
- Rate limits (API quota constraints)

### Alternative C: Third-Party Service (Segment, Mixpanel)

**Description:** Use external event tracking service

**Rejected Because:**
- Additional cost ($500-2000/month)
- External dependency (vendor lock-in)
- Overkill for our use case (we need CRM, not product analytics)
- Data privacy concerns (lead data leaves our infrastructure)

---

## 19. FINAL SIGN-OFF

**This document represents the final, approved architecture for the Mini-CRM Activity Logging System.**

**Key Architectural Decisions:**
✅ PostgreSQL as single source of truth  
✅ Admin UI for browsing (not Airtable)  
✅ Direct writes from n8n + UI  
✅ Retry_Queue dead-letter queue  
✅ Strangler fig migration pattern

**Timeline:** 4 weeks, 68 hours  
**Outcome:** Comprehensive activity logging, complete lead timelines, Mini-CRM foundation

**This is the guiding light. The execution agent must deliver this system as specified.**

---

**Prepared by:** System Architect  
**Approved by:** Product Owner  
**Date:** November 7, 2025  
**Status:** ✅ FINAL - READY FOR EXECUTION

**File:** `MINI-CRM-PRD-FINAL.md`

---

**END OF DOCUMENT**

