# Mini-CRM: Parallel Execution Plan

**Model:** Two agents working simultaneously  
**Timeline:** Week 2-4 running in parallel  
**Total Time:** 28 hours (16 + 12 overlapping)

---

## 🚀 START NOW - BOTH TRACKS

### TRACK 1: Cursor Conversation Agent
**Agent:** You (with n8n MCP tools)  
**Work:** Week 2 - n8n workflow instrumentation  
**Guide:** [N8N-INSTRUMENTATION-GUIDE.md](./N8N-INSTRUMENTATION-GUIDE.md)  
**Timeline:** 16 hours  
**Can start:** Immediately

### TRACK 2: Claude Code  
**Agent:** IDE-based development  
**Work:** Week 3-4 - Admin UI + Lead Timeline  
**Guide:** [UI-IMPLEMENTATION-GUIDE.md](./UI-IMPLEMENTATION-GUIDE.md)  
**Timeline:** 12 hours  
**Can start:** Immediately

**No conflicts:** Different domains (n8n external, UI in src/)

---

## 📋 Execution Instructions

### For Current Execution Agent (Claude Code)

**You just finished Week 1 foundation. Next:**

**MANDATORY FIRST:** Write API tests (4-6 hours) per TDD protocol
- Create test files for 4 API endpoints
- Minimum coverage: auth, validation, happy path, security
- Run test suite, ensure all pass
- Commit tests to branch

**THEN:** Deploy to staging
- Generate INTERNAL_API_KEY
- Add to Render environment
- Deploy branch
- Run seed data script
- Verify all endpoints work

**THEN:** Start Track 2 (UI development)
- Follow [UI-IMPLEMENTATION-GUIDE.md](./UI-IMPLEMENTATION-GUIDE.md)
- Build admin browser page
- Build lead timeline component
- Test with seed data

### For Cursor Conversation Agent (Starts Week 2)

**After staging deployment verified:**

**Start:** n8n workflow instrumentation
- Follow [N8N-INSTRUMENTATION-GUIDE.md](./N8N-INSTRUMENTATION-GUIDE.md)
- Instrument UYSP-Kajabi-SMS-Scheduler first
- Add 4-node logging pattern
- Test individually
- Deploy remaining 3 workflows

**Verify:** Events appearing in database and health check

---

## 🔗 Coordination Points

**Agents work independently BUT:**

### Checkpoint 1: After Tests Written
- Claude Code commits tests
- Strategic agent reviews
- Approves for staging deployment

### Checkpoint 2: After Staging Deployed
- Claude Code verifies APIs work
- Cursor agent can start n8n instrumentation
- Both work in parallel

### Checkpoint 3: After n8n Instrumented
- Cursor agent reports completion
- Claude Code verifies real events in UI
- Strategic agent approves for production

### Checkpoint 4: After UI Complete
- Claude Code reports completion
- Both agents do integration test
- Strategic agent approves final cutover

---

## 📊 Timeline (Parallel)

```
Week 1: ✅ COMPLETE (Foundation)
  └─ APIs built, schema created, tests written

Week 2-4: PARALLEL EXECUTION
  ├─ Track 1 (Cursor): n8n workflows (16h)
  │   ├─ Kajabi scheduler (4h)
  │   ├─ Calendly webhook (4h)
  │   ├─ Reply handler (4h)
  │   └─ Delivery status (4h)
  │
  └─ Track 2 (Claude Code): UI development (12h)
      ├─ Admin browser (6h)
      ├─ Lead timeline (4h)
      └─ Integration (2h)

Week 4 End: INTEGRATION & CUTOVER (4h)
  └─ Both agents verify end-to-end
```

**Wall-clock time:** 2-3 weeks (not 4) due to parallelization

---

## 🎯 Agent Assignments

### Cursor Conversation Agent Owns:
- ✅ n8n workflow modifications
- ✅ n8n logging pattern implementation
- ✅ Retry_Queue monitoring
- ✅ Database verification (queries)
- ✅ Health check monitoring

### Claude Code Owns:
- ✅ API tests (mandatory first task)
- ✅ Admin browser UI
- ✅ Lead timeline component
- ✅ Navigation integration
- ✅ UI component tests

### Strategic Agent Coordinates:
- ✅ Architecture decisions
- ✅ API contract changes
- ✅ Conflict resolution
- ✅ Checkpoint approvals
- ✅ Final integration verification

---

## 📁 All Coordination Documents

1. **[PARALLEL-EXECUTION-PLAN.md](./PARALLEL-EXECUTION-PLAN.md)** ← This file
2. **[N8N-INSTRUMENTATION-GUIDE.md](./N8N-INSTRUMENTATION-GUIDE.md)** - For Cursor agent
3. **[UI-IMPLEMENTATION-GUIDE.md](./UI-IMPLEMENTATION-GUIDE.md)** - For Claude Code
4. **[INTEGRATION-CONTRACT.md](./INTEGRATION-CONTRACT.md)** - API contracts & coordination
5. **[AIRTABLE-AUTOMATIONS-ANALYSIS.md](./AIRTABLE-AUTOMATIONS-ANALYSIS.md)** - Keep unchanged

---

## 🚨 Critical Reminders

**For Claude Code:**
- TDD is NON-NEGOTIABLE (write tests BEFORE Week 2 work)
- Test all UI components
- Follow PRD Section 7 specs exactly

**For Cursor Agent:**
- Use n8n MCP tools (don't guess node configurations)
- Backup workflows before modifying
- Test each workflow individually
- Monitor Retry_Queue for failures

**For Both:**
- Reference PRD as single source of truth
- Report blockers immediately
- Don't assume—ask if unclear

---

**BOTH AGENTS CAN START NOW. Go build.**

