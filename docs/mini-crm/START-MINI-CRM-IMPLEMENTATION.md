# 🚀 START HERE: Mini-CRM Activity Logging Implementation

**Status:** ✅ APPROVED FOR EXECUTION  
**Start Date:** Week of November 11, 2025  
**Timeline:** 4 weeks (68 hours)  
**PRD:** `docs/PRD-MINI-CRM-ACTIVITY-LOGGING.md`

---

## ⚡ QUICK START FOR IMPLEMENTATION AGENT

### Read First (15 minutes)

**1. Main PRD** (MUST READ)
- File: `docs/PRD-MINI-CRM-ACTIVITY-LOGGING.md`
- Read: Sections 1-5 (Executive Summary through Technical Spec)
- Understand: PostgreSQL-first architecture, strangler fig pattern

**2. Context Documents** (SKIM)
- `UYSP-COMPLETE-STATUS-AND-ROADMAP.md` - Current system state
- `PRD-TWO-WAY-AI-MESSAGING-SYSTEM.md` - Future two-way context
- `docs/sops/SOP-Airtable-SMS_Audit.md` - Old system being replaced

---

## 🎯 YOUR MISSION

**Build a comprehensive activity logging system** that captures every lead interaction as an immutable event in PostgreSQL.

**Why:** Current system has "memory loss" - can only see current state, not full lead journey.

**Outcome:** Complete lead timelines, trustworthy analytics, Mini-CRM foundation.

---

## 📋 WEEK 1 KICKOFF CHECKLIST

### Day 1: Setup & Foundation

- [ ] Read complete PRD (`docs/PRD-MINI-CRM-ACTIVITY-LOGGING.md`)
- [ ] Create feature branch: `feature/mini-crm-activity-logging`
- [ ] Review current database schema (`src/lib/db/schema.ts`)
- [ ] Understand existing sync patterns (`src/app/api/cron/sync-airtable/route.ts`)

### Day 2: Database Schema

- [ ] Add `leadActivityLog` table to schema
- [ ] Add `lastActivityAt` field to leads table
- [ ] Generate migration: `npx drizzle-kit generate:pg`
- [ ] Review migration SQL
- [ ] Apply to staging: `npx drizzle-kit push:pg`
- [ ] Verify: `SELECT * FROM lead_activity_log;`

### Day 3: API Endpoints

- [ ] Create `EVENT_TYPES` constants file
- [ ] Build POST /api/internal/log-activity endpoint
- [ ] Write comprehensive tests
- [ ] Test with curl/Postman

### Day 4: UI Logging Helper

- [ ] Create `lib/activity/logger.ts`
- [ ] Build `logLeadActivity()` helper function
- [ ] Test from UI context
- [ ] Document usage examples

### Day 5: Admin Browser Endpoint

- [ ] Build GET /api/admin/activity-logs endpoint
- [ ] Test search, filters, pagination
- [ ] Test with mock data
- [ ] Prepare for Week 2

**Weekend:** Review Week 1 deliverables, prepare for n8n instrumentation

---

## 🚨 CRITICAL RULES

### Architectural Constraints (NON-NEGOTIABLE)

1. ✅ **PostgreSQL is the ONLY source of truth for activity logs**
   - Do NOT write to Airtable Message_Decision_Log
   - That table is reserved for future two-way messaging

2. ✅ **Follow the strangler fig pattern**
   - Build in parallel (don't break live system)
   - Dual-write temporarily (Week 2-3)
   - Cutover cleanly (Week 4)

3. ✅ **Error handling via Retry_Queue**
   - n8n writes must retry 3x
   - Failures go to Retry_Queue in Airtable
   - Slack alerts on persistent failures

4. ✅ **Clay integration unchanged**
   - Don't touch lead enrichment waterfall
   - Activity logging is independent

### Code Quality Requirements

- [ ] All database queries use prepared statements (SQL injection prevention)
- [ ] All API endpoints have authentication
- [ ] All logging wrapped in try-catch (never break app)
- [ ] All new code has TypeScript types
- [ ] All endpoints have error handling

---

## 📊 DELIVERABLES BY WEEK

### Week 1: Foundation
- PostgreSQL table created (migration file in git)
- API endpoints built and tested
- UI logging helper function
- Admin browser endpoint

### Week 2: n8n Workflows
- Kajabi scheduler logging SMS events
- Calendly workflow logging bookings
- Reply handler logging inbound replies
- Delivery workflow logging statuses
- All with retry queue fallback

### Week 3: UI Actions
- Campaign enrollment logged
- Status changes logged
- Notes logged
- All UI touchpoints covered

### Week 4: Go Live
- Admin activity browser UI
- Lead timeline component
- Navigation updated
- SMS_Audit deprecated
- System live and verified

---

## 🔗 KEY DOCUMENTS

**Primary:**
- `docs/PRD-MINI-CRM-ACTIVITY-LOGGING.md` - AUTHORITATIVE SPEC
- `docs/PRD-MINI-CRM-ACTIVITY-LOGGING-README.md` - This file

**Reference:**
- `uysp-client-portal/src/lib/db/schema.ts` - Database schema
- `uysp-client-portal/src/app/api/cron/sync-airtable/route.ts` - Sync pattern reference
- `workflows/COMPLETE-UYSP-WORKFLOW-REGISTRY.md` - n8n workflow IDs

**Context:**
- `UYSP-COMPLETE-STATUS-AND-ROADMAP.md` - Current system status
- `PRD-TWO-WAY-AI-MESSAGING-SYSTEM.md` - Future two-way context

---

## ✅ VERIFICATION CHECKLIST

**After Week 1:**
- [ ] Can insert test record via API: `curl -X POST .../api/internal/log-activity`
- [ ] Can query via SQL: `SELECT COUNT(*) FROM lead_activity_log;`
- [ ] Migration file exists in git

**After Week 2:**
- [ ] Run Kajabi scheduler manually, see activity log entry created
- [ ] Trigger Calendly test booking, see booking event logged
- [ ] Send test SMS reply, see inbound reply logged

**After Week 4:**
- [ ] Navigate to /admin/activity-logs, see all events
- [ ] Open lead detail page, see activity timeline
- [ ] Perform all actions (enroll, add note, change status), verify logging
- [ ] Export CSV from admin browser, verify data complete

---

## 🆘 SUPPORT

**Questions?** Reference PRD section numbers  
**Blockers?** Document and escalate immediately  
**Changes needed?** Propose as amendment to PRD

**This is critical infrastructure. Don't guess - ask.**

---

**Last Updated:** November 7, 2025  
**Status:** Ready for Week 1 kickoff  
**Next Action:** Create feature branch and begin Day 1 tasks

