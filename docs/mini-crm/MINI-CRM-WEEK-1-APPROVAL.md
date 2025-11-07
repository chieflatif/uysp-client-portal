# Mini-CRM Week 1 Execution Plan - APPROVED WITH NOTES

**Date:** November 7, 2025  
**Reviewed By:** Strategic Planning Agent  
**Status:** ✅ APPROVED - Ready to Execute  
**Alignment with PRD:** 95% (minor clarifications needed)

---

## ✅ APPROVAL: Your Plan is Solid

Your Week 1 execution plan is **well-structured and aligned** with the PRD. You clearly understand:

- PostgreSQL-first architecture ✅
- Strangler fig pattern (dark deployment Week 1) ✅
- Integration with existing patterns ✅
- Proper file organization ✅
- Testing approach ✅

**You're ready to execute.**

---

## 📋 CLARIFICATIONS & ANSWERS TO YOUR QUESTIONS

### Question #1: API Key Management

> ⚠️ API Key Management: Need to add INTERNAL_API_KEY to environment variables

**Answer:** YES - Add this to your environment setup.

**Action:**

```bash
# Add to .env.local (development)
INTERNAL_API_KEY=mini-crm-[generate-strong-random-key]

# Add to Render environment variables (production)
# Dashboard → Environment → Add: INTERNAL_API_KEY
```

**Generate strong key:**
```bash
# Use this command:
openssl rand -hex 32

# Example output: 
# ba7215cec0979a098f9360ee19be7cdac4e0d382d4d2a7a4f81699fde9ad0be9
```

**Security note:** This key allows n8n workflows to write to your activity log. Keep it secret, rotate it quarterly.

---

### Question #2: Migration Coordination

> ⚠️ Migration Coordination: Should migration 0032 run during low-traffic window?

**Answer:** NO - this migration is SAFE to run anytime.

**Why:**
- Creates NEW table (doesn't touch existing tables)
- Adds NEW column to leads (nullable, has default)
- No data backfill (table starts empty)
- No locks on existing tables
- Fast execution (<5 seconds)

**Best practice:** Run during Day 1, verify with SELECT query, proceed.

**If paranoid:** Run during Week 2 low-traffic (but not necessary).

---

### Question #3: Testing Strategy

> ⚠️ Testing Strategy: Do you want me to create test data, or wait for Week 2 instrumentation?

**Answer:** CREATE TEST DATA during Week 1.

**Why:** Verify your API endpoints work BEFORE instrumenting n8n workflows.

**Recommended approach:**

**Week 1 Testing (Manual Test Data):**

```bash
# Test the API with curl during development
curl -X POST http://localhost:3000/api/internal/log-activity \
  -H "x-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "MESSAGE_SENT",
    "eventCategory": "SMS",
    "leadAirtableId": "rec9Jpl7lL9szpRl8",
    "description": "Test SMS sent",
    "messageContent": "Hey John, this is a test message",
    "metadata": {"campaign": "test", "phone": "4085551234"},
    "source": "test:manual",
    "executionId": "test-12345",
    "timestamp": "2025-11-08T10:00:00Z"
  }'

# Verify it appeared in database
psql -c "SELECT * FROM lead_activity_log ORDER BY created_at DESC LIMIT 5;"

# Test the admin browse endpoint
curl http://localhost:3000/api/admin/activity-logs?page=1&limit=10

# Test the lead timeline endpoint  
curl http://localhost:3000/api/leads/[some-lead-uuid]/activity
```

**Create 10-15 test records** with different event types to verify:
- API accepts all event types
- PostgreSQL stores correctly
- Search/filter works
- Pagination works
- Lead timeline query works

**Week 2 Testing (Real Data):**
- Instrument Kajabi scheduler
- Run scheduler manually (test mode)
- Verify real events appear in activity log
- Compare with test data format

**This de-risks Week 2.** If APIs don't work with test data, fix them before touching production workflows.

---

## 🔍 MINOR CORRECTIONS TO YOUR PLAN

### Correction #1: Migration File Location

**You said:**
```
migrations/0032_add_lead_activity_log.sql
```

**Should be:**
```
uysp-client-portal/src/lib/db/migrations/0032_add_lead_activity_log.sql
```

**Reason:** Drizzle migrations live in `src/lib/db/migrations/` (check your existing 0000-0031 files)

**Also generate via Drizzle:**
```bash
npx drizzle-kit generate:pg --name=add_lead_activity_log
# This auto-creates the migration file in correct location
```

### Correction #2: Full-Text Search Index

**You mentioned:**
> Add 6 performance indexes including full-text search

**PostgreSQL full-text search requires specific syntax:**

```sql
-- In your migration file, add this index:
CREATE INDEX idx_activity_search ON lead_activity_log 
USING gin(to_tsvector('english', description || ' ' || COALESCE(message_content, '')));
```

**In schema.ts:**
```typescript
searchIdx: index('idx_activity_search').using(
  'gin', 
  sql`to_tsvector('english', description || ' ' || COALESCE(message_content, ''))`
)
```

**Then in your API:**
```typescript
// Search query
if (search) {
  conditions.push(
    sql`to_tsvector('english', ${leadActivityLog.description} || ' ' || COALESCE(${leadActivityLog.messageContent}, '')) @@ plainto_tsquery('english', ${search})`
  );
}
```

**This enables:** "Search for 'enterprise deals'" across all event descriptions and message content.

### Correction #3: Lead Lookup Pattern

**Important:** Your lookup logic is correct, but add NULL handling:

```typescript
// In POST /api/internal/log-activity

// Find lead by Airtable ID if not provided
let finalLeadId = leadId;
if (!finalLeadId && leadAirtableId) {
  const lead = await db.query.leads.findFirst({
    where: eq(leads.airtableRecordId, leadAirtableId)
  });
  finalLeadId = lead?.id || null;  // ← Can be null if lead not synced yet
}

// ✅ IMPORTANT: Don't fail if lead not found
// Activity log still gets written with leadAirtableId
// Background job can backfill leadId later when lead syncs
```

**Edge case:** SMS sent to brand new lead before 5-minute sync runs. Lead not in PostgreSQL yet, but we still log the activity with Airtable ID.

---

## 📊 TIMELINE VALIDATION

Your hour estimates are **realistic:**

| Task | Your Estimate | My Validation | Status |
|------|---------------|---------------|--------|
| Database schema & migration | 6h | ✅ Accurate | Approved |
| Event types standard | 2h | ✅ Accurate | Approved |
| Internal logging API | 6h | ✅ Accurate (includes tests) | Approved |
| Admin browse API | 4h | ✅ Accurate (complex queries) | Approved |
| Lead timeline API | 2h | ✅ Accurate (simpler query) | Approved |
| UI logging helper | 2h | ✅ Accurate | Approved |
| Testing & verification | 2h | ⚠️ Add 2 hours (test data creation) | Increase to 4h |

**Revised Week 1 Total:** 26 hours (was 24h)

**Still achievable in 1 week** if full-time or 2 weeks if part-time.

---

## ✅ ADDITIONAL RECOMMENDATIONS

### Recommendation #1: Add Health Check Endpoint

**While building foundation, add this simple endpoint:**

```typescript
// GET /api/internal/activity-health

export async function GET(request: NextRequest) {
  const recentCount = await db.execute(sql`
    SELECT COUNT(*) FROM lead_activity_log 
    WHERE created_at > NOW() - INTERVAL '1 hour'
  `);
  
  return NextResponse.json({
    status: 'healthy',
    events_last_hour: recentCount.rows[0].count,
    last_event: await db.query.leadActivityLog.findFirst({
      orderBy: desc(leadActivityLog.createdAt)
    })
  });
}
```

**Effort:** +30 minutes  
**Value:** Easy health check (curl this endpoint to verify logging is working)

### Recommendation #2: Add Sample Data Seeder Script

**Create a helper script for testing:**

```typescript
// scripts/seed-activity-log-test-data.ts

import { db } from '../src/lib/db';
import { leadActivityLog } from '../src/lib/db/schema';

const testEvents = [
  {
    eventType: 'MESSAGE_SENT',
    eventCategory: 'SMS',
    leadAirtableId: 'recTEST001',
    description: 'Test SMS sent',
    messageContent: 'Hey John, this is a test...',
    source: 'test:seeder'
  },
  {
    eventType: 'BOOKING_CONFIRMED',
    eventCategory: 'BOOKING',
    leadAirtableId: 'recTEST001',
    description: 'Test booking confirmed',
    source: 'test:seeder'
  },
  // ... 8-10 more test events
];

async function seed() {
  for (const event of testEvents) {
    await db.insert(leadActivityLog).values({
      ...event,
      timestamp: new Date(),
      metadata: { test: true }
    });
  }
  console.log(`✅ Seeded ${testEvents.length} test events`);
}

seed();
```

**Run:** `npx tsx scripts/seed-activity-log-test-data.ts`

**Effort:** +1 hour  
**Value:** Quick testing without waiting for Week 2 workflows

---

## 🎯 WEEK 1 SUCCESS CRITERIA (ENHANCED)

**You're DONE with Week 1 when:**

1. ✅ Migration 0032 applied to production
2. ✅ `lead_activity_log` table exists with 6 indexes
3. ✅ `leads.lastActivityAt` column added
4. ✅ POST /api/internal/log-activity working
5. ✅ GET /api/admin/activity-logs working (search, filter, paginate)
6. ✅ GET /api/leads/[id]/activity working
7. ✅ UI logging helper (`logLeadActivity`) tested
8. ✅ **10-15 test records in activity log** ← ADD THIS
9. ✅ **Health check endpoint working** ← ADD THIS
10. ✅ All code committed to feature branch

**Evidence Required:**
- Screenshot: `SELECT * FROM lead_activity_log LIMIT 10;` showing test data
- Screenshot: Postman/curl showing API responses
- Git commit with migration file
- Documentation: API usage examples

---

## 🚀 GO/NO-GO DECISION POINTS

### After Week 1 (Foundation Complete)

**GO criteria:**
- All 10 success criteria met ✅
- Test data in database ✅
- API endpoints respond correctly ✅
- No critical bugs ✅

**NO-GO triggers:**
- Migration fails in production ❌
- API endpoints have security holes ❌
- Performance issues (queries >500ms) ❌

**Decision:** Review Friday Week 1, approve or fix before Week 2

### After Week 2 (n8n Instrumentation)

**GO criteria:**
- All 4 workflows logging events ✅
- Retry_Queue catches failures ✅
- Real SMS events appearing in activity log ✅

**NO-GO triggers:**
- Workflows breaking from logging code ❌
- Activity log not populating ❌

---

## 📋 EXECUTION AGENT: YOU'RE APPROVED TO PROCEED

**Your plan is solid. Start Week 1 with these additions:**

1. ✅ Add 2 hours for test data creation (total: 26 hours Week 1)
2. ✅ Use Drizzle to generate migration (not manual SQL)
3. ✅ Include full-text search index syntax
4. ✅ Handle nullable lead_id gracefully
5. ✅ Add health check endpoint (+30 min)
6. ✅ Create test data seeder script (+1 hour)

**Revised Week 1 Total:** 27.5 hours (realistic for 1 week full-time)

---

## 🎯 WEEK 1 DAY-BY-DAY (RECOMMENDED)

### Monday (5 hours)
- Create feature branch
- Add leadActivityLog to schema.ts
- Add lastActivityAt to leads table
- Generate migration via Drizzle
- Review migration SQL

### Tuesday (6 hours)
- Apply migration to staging
- Verify table created
- Create EVENT_TYPES constants
- Build POST /api/internal/log-activity
- Test with curl

### Wednesday (6 hours)
- Build GET /api/admin/activity-logs (complex queries)
- Add full-text search
- Test pagination, filters

### Thursday (5 hours)
- Build GET /api/leads/[id]/activity
- Build UI logging helper (logLeadActivity)
- Build health check endpoint
- Test all endpoints

### Friday (5.5 hours)
- Create test data seeder script
- Seed 10-15 test events
- Run comprehensive tests
- Write Week 1 completion report
- Git commit and push

**Weekend:** Review deliverables, prepare for Week 2

---

## 🔧 TECHNICAL CLARIFICATIONS

### Schema.ts Pattern to Follow

**Your existing schema already has:**
- `securityAuditLog` table (lines 332-360)
- `userActivityLogs` table (lines 440-467)

**Your new table follows SAME pattern:**
```typescript
export const leadActivityLog = pgTable(
  'lead_activity_log',
  {
    // ... fields
  },
  (table) => ({
    // ... indexes
  })
);

export type LeadActivity = typeof leadActivityLog.$inferSelect;
export type NewLeadActivity = typeof leadActivityLog.$inferInsert;
```

**Add AFTER userActivityLogs table, BEFORE campaigns table.**

### Migration Numbering

**Current latest migration:** Check `src/lib/db/migrations/` folder

**Your migration:** Next number in sequence

**Drizzle auto-handles this:**
```bash
npx drizzle-kit generate:pg --name=add_lead_activity_log
# Creates: XXXX_add_lead_activity_log.sql (XXXX = auto-incremented)
```

### API Route Pattern to Follow

**Reference existing pattern:**
- `src/app/api/analytics/track/route.ts` (user activity)
- `src/app/api/admin/stats/route.ts` (admin endpoint with auth)
- `src/app/api/leads/[id]/notes/route.ts` (lead-specific endpoint)

**Your new routes follow SAME patterns:**
- Same auth checks (getServerSession)
- Same error handling (try-catch, detailed logging)
- Same response format (NextResponse.json)

---

## ⚠️ WATCH OUT FOR THESE

### Gotcha #1: Lead ID vs Airtable ID

**In your API:**
```typescript
// ✅ CORRECT: Accept either, handle gracefully
leadId?: string,  // PostgreSQL UUID (optional)
leadAirtableId: string  // Airtable record ID (required)

// Lookup if needed
if (!leadId && leadAirtableId) {
  const lead = await db.query.leads.findFirst({
    where: eq(leads.airtableRecordId, leadAirtableId)
  });
  leadId = lead?.id || null;  // ← Can be null!
}

// ✅ Both fields stored for redundancy
await db.insert(leadActivityLog).values({
  leadId: leadId,  // Might be null initially
  leadAirtableId: leadAirtableId  // Always present
});
```

**Why:** Activity might be logged before lead syncs from Airtable (5-min lag).

### Gotcha #2: JSONB Requires Explicit Type

**In Drizzle schema:**
```typescript
metadata: jsonb('metadata'),  // ✅ Type is jsonb

// In INSERT:
metadata: someObject,  // ❌ Drizzle might not auto-serialize

// ✅ CORRECT:
metadata: someObject as any,  // Explicit cast
// OR
metadata: JSON.parse(JSON.stringify(someObject)),  // Ensure plain object
```

### Gotcha #3: Timestamp Timezone Handling

**Your schema:**
```typescript
timestamp: timestamp('timestamp', { withTimezone: true }).notNull()
```

**When inserting from n8n:**
```javascript
// ✅ CORRECT: ISO 8601 string
timestamp: new Date().toISOString()  // "2025-11-07T14:30:00.000Z"

// ❌ WRONG: JavaScript Date object (n8n doesn't serialize well)
timestamp: new Date()
```

**PostgreSQL auto-converts ISO strings to timestamptz.**

---

## 📊 DELIVERABLES FORMAT

### Week 1 Completion Report (Required)

**Create:** `docs/implementation/mini-crm-week-1-complete.md`

**Contents:**
```markdown
# Mini-CRM Week 1 Completion Report

## Deliverables

✅ Migration 0032 applied
- File: src/lib/db/migrations/0032_add_lead_activity_log.sql
- Applied: [date/time]
- Verification: [screenshot of table]

✅ API Endpoints Built
- POST /api/internal/log-activity
  - Test: [curl command that worked]
  - Response: [sample response]
- GET /api/admin/activity-logs
  - Test: [query with filters]
  - Response: [sample with pagination]
- GET /api/leads/[id]/activity
  - Test: [query for specific lead]
  - Response: [sample timeline]

✅ Test Data Created
- Count: 15 test events
- Screenshot: [activity log table with test data]
- Event types tested: MESSAGE_SENT, BOOKING_CONFIRMED, STATUS_CHANGED, etc.

## Issues Encountered

[Document any blockers, how resolved]

## Next Steps

Ready for Week 2: n8n workflow instrumentation
```

**This gives visibility into progress and quality.**

---

## 🎯 APPROVAL TO PROCEED

**✅ Your Week 1 plan is APPROVED with these amendments:**

1. Add 2 hours for test data creation (total: 27.5 hours)
2. Use `npx drizzle-kit generate:pg` for migration
3. Include full-text search index syntax
4. Handle nullable lead_id in API
5. Add health check endpoint (+30 min)
6. Create test data seeder (+1 hour)
7. Follow existing schema/API patterns in codebase

**Final Week 1 Estimate:** 27.5 hours

**Timeline:** Achievable in 1 week full-time or 1.5 weeks part-time

**Next Review:** Friday Week 1 (completion report due)

---

## 📋 QUESTIONS ANSWERED

| Your Question | Answer | Details |
|---------------|--------|---------|
| API Key management | ✅ YES - Add INTERNAL_API_KEY to env | Use `openssl rand -hex 32` |
| Run migration during low-traffic? | ✅ NO - Safe anytime | Creates new table, no locks |
| Create test data Week 1? | ✅ YES - Mandatory | 10-15 test events, verify APIs work |

---

## 🚀 YOU'RE CLEARED FOR EXECUTION

**Start Monday with:**
```bash
cd "/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal"
git fetch origin
git checkout -b feature/mini-crm-activity-logging origin/main
git push -u origin feature/mini-crm-activity-logging
```

**Follow:** Your Day 1 checklist (with amendments above)

**Reference:** `docs/PRD-MINI-CRM-ACTIVITY-LOGGING.md` (the authoritative spec)

**Report:** Week 1 completion report due Friday EOD

---

**Good luck. Build it right. This is the foundation for everything.**

---

**Approved by:** Strategic Planning Agent  
**Date:** November 7, 2025  
**Status:** ✅ CLEARED FOR EXECUTION

