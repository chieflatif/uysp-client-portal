# Mini-CRM: Agent Integration Contract

**Purpose:** Coordination protocol for parallel development  
**Agents:** Cursor Conversation (n8n) + Claude Code (UI)  
**Timeline:** Week 2-4 running in parallel

---

## 🔀 Parallel Execution Model

### Track 1: Cursor Conversation Agent (Week 2)
**Work:** Instrument 4 n8n workflows  
**Touches:** External n8n workflows only  
**Deliverable:** Events flowing into PostgreSQL  
**Timeline:** 16 hours

### Track 2: Claude Code (Week 3-4)
**Work:** Build admin UI and lead timeline  
**Touches:** `src/app/`, `src/components/` only  
**Deliverable:** UI for browsing activity logs  
**Timeline:** 12 hours

**No file conflicts:** Agents work in different domains

---

## 📡 API Contract (Already Delivered)

Both agents rely on these APIs (built in Week 1):

### POST /api/internal/log-activity
**Owner:** Week 1 foundation (complete)  
**Consumer:** n8n workflows (Cursor agent)  
**Status:** ✅ READY

**Contract:**
```typescript
Request: {
  eventType: string;        // Required - from EVENT_TYPES
  eventCategory: string;    // Required - from EVENT_CATEGORIES
  leadAirtableId: string;   // Required
  description: string;      // Required
  messageContent?: string;
  metadata?: object;
  source: string;           // Required - format: "n8n:workflowId"
  executionId?: string;
  timestamp?: string;       // ISO 8601
}

Response: {
  success: boolean;
  activityId: string;
  timestamp: string;
  leadId: string | null;
}
```

### GET /api/admin/activity-logs
**Owner:** Week 1 foundation (complete)  
**Consumer:** Admin browser UI (Claude Code)  
**Status:** ✅ READY

**Contract:** See UI-IMPLEMENTATION-GUIDE.md for response schema

### GET /api/leads/[id]/activity
**Owner:** Week 1 foundation (complete)  
**Consumer:** Lead timeline UI (Claude Code)  
**Status:** ✅ READY

**Contract:** See UI-IMPLEMENTATION-GUIDE.md for response schema

---

## 🧪 Testing Strategy

### Phase 1: Independent Testing

**Cursor Agent (n8n):**
- Use existing health check: `GET /api/internal/activity-health`
- Verify events in database: `SELECT * FROM lead_activity_log`
- Check each workflow individually

**Claude Code (UI):**
- Use seed data: `npx tsx scripts/seed-activity-log-test-data.ts`
- Test with 15 mock events
- Verify UI renders correctly

**No coordination needed for independent testing.**

### Phase 2: Integration Testing (Week 4 End)

**Together:**
1. Cursor agent triggers real workflow (send test SMS)
2. Claude Code verifies event appears in UI (<30 seconds)
3. Both verify data matches across systems

---

## 🔄 Data Flow Architecture

```
n8n Workflow (Cursor Agent)
  ↓ HTTP POST
POST /api/internal/log-activity (Week 1 - complete)
  ↓ INSERT
PostgreSQL lead_activity_log table
  ↓ SELECT
GET /api/admin/activity-logs (Week 1 - complete)
  ↓ RENDER
Admin Browser UI (Claude Code - Week 3-4)
```

**Each agent owns one piece. APIs are the contract between them.**

---

## 📂 File Ownership (Zero Conflicts)

### Cursor Agent Territory
```
External:
- n8n workflows (cloud-hosted, not in repo)

Database:
- Can query for verification only
```

### Claude Code Territory
```
src/app/(dashboard)/admin/activity-logs/
src/app/(dashboard)/leads/[id]/activity-tab.tsx
src/components/activity/
src/lib/activity/ui-helpers.ts (NEW)
__tests__/components/
```

### Shared (Read-Only)
```
src/lib/activity/event-types.ts (both read, neither modifies)
src/lib/db/schema.ts (both read, neither modifies)
docs/mini-crm/PRD-MINI-CRM-ACTIVITY-LOGGING.md (both reference)
```

**No merge conflicts possible.**

---

## 🎯 Handoff Checkpoints

### Checkpoint 1: APIs Deployed (Week 1 Complete)

**Cursor Agent verifies:**
- [ ] Health check returns 200 OK
- [ ] Can POST activity via API
- [ ] Activity appears in database

**Claude Code can start:**
- ✅ Build UI against deployed APIs
- ✅ Use seed data for development
- ✅ No dependency on n8n work

### Checkpoint 2: n8n Instrumentation Complete (Week 2 End)

**Cursor Agent delivers:**
- [ ] All 4 workflows logging events
- [ ] Real events in database
- [ ] Retry_Queue monitored

**Claude Code verifies:**
- [ ] UI shows real events (not just seed data)
- [ ] Event types render correctly
- [ ] Search/filter work with production data

### Checkpoint 3: UI Complete (Week 4 Mid)

**Claude Code delivers:**
- [ ] Admin browser functional
- [ ] Lead timeline integrated
- [ ] Navigation updated

**Cursor Agent verifies:**
- [ ] Can browse all n8n-logged events
- [ ] Troubleshooting workflow works via UI
- [ ] No events missing from display

### Checkpoint 4: Full Integration (Week 4 End)

**Both agents together:**
- [ ] End-to-end test: Send SMS → Verify in UI
- [ ] Performance test: 10K events load fast
- [ ] Verify all 23 event types render correctly

---

## 🚨 Conflict Resolution

### If API Changes Needed

**Process:**
1. Claude Code identifies API limitation
2. Reports to strategic agent (you)
3. Strategic agent decides: modify API or work around in UI
4. If API change approved: Claude Code updates API + UI together
5. Cursor agent re-tests n8n integration

### If Event Type Changes Needed

**Process:**
1. Either agent identifies new event type needed
2. Strategic agent approves
3. Update `src/lib/activity/event-types.ts` (shared file)
4. Both agents pull latest
5. Both agents test their components

### If Schema Changes Needed

**Process:**
1. Strategic agent reviews request
2. If approved: New migration generated
3. Both agents notified
4. Deploy migration
5. Both agents update their code

**In practice:** Schema shouldn't change (JSONB metadata is flexible)

---

## 📋 Communication Protocol

### Status Updates

**After each major milestone:**
- Cursor agent: Report n8n workflow instrumentation progress
- Claude Code: Report UI component completion
- Strategic agent: Coordinate and unblock

**Format:**
```
AGENT: [Cursor/Claude Code]
MILESTONE: [Workflow X instrumented / Component Y complete]
STATUS: [✅ Complete / ⚠️ Blocked / 🔄 In Progress]
BLOCKERS: [None / Issue description]
NEXT: [Next task]
```

### Blockers & Questions

**Don't assume—ask immediately:**
- API doesn't return expected data → Strategic agent
- Event type missing from constants → Strategic agent
- n8n pattern unclear → Reference PRD or ask
- UI spec ambiguous → Reference PRD Section 7 or ask

---

## 🎯 Success Criteria (Combined)

**Mini-CRM is COMPLETE when:**

**Backend (Cursor Agent):**
- [x] All 4 APIs working (Week 1 - complete)
- [ ] All 4 workflows logging events (Week 2)
- [ ] Events appearing in database
- [ ] Retry_Queue <5 records
- [ ] Health check shows events_last_hour > 0

**Frontend (Claude Code):**
- [ ] Admin browser deployed (Week 3-4)
- [ ] Lead timeline integrated (Week 3-4)
- [ ] Search/filter working
- [ ] Performance targets met
- [ ] Export CSV working

**Integration (Both):**
- [ ] Real n8n events visible in UI
- [ ] All 23 event types render correctly
- [ ] End-to-end latency <30 seconds (event → UI)
- [ ] Zero data loss for 1 week
- [ ] Admin team confirms usability

---

## 🚀 Parallel Start Commands

### For Cursor Agent (Week 2):

**Reference:** `docs/mini-crm/N8N-INSTRUMENTATION-GUIDE.md`

**Start with:** UYSP-Kajabi-SMS-Scheduler (highest volume)

**Verify:** Health check shows events after first instrumentation

### For Claude Code (Week 3-4):

**Reference:** `docs/mini-crm/UI-IMPLEMENTATION-GUIDE.md`

**Start with:** Admin browser page shell (routing + basic table)

**Test with:** Seed data (`npx tsx scripts/seed-activity-log-test-data.ts`)

---

## 📞 Escalation Path

**If either agent gets blocked:**
1. Check PRD first (Section 4.5 for n8n, Section 7 for UI)
2. Check integration contract (this doc)
3. Ask strategic agent (don't guess or assume)

**Strategic agent coordinates:**
- API contract changes
- Event type additions
- Schema modifications
- Priority conflicts

---

**Both agents can START NOW. No dependencies between tracks.**

