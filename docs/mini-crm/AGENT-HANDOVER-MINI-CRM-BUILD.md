# AGENT HANDOVER: Mini-CRM Activity Logging Implementation

**Date:** November 7, 2025  
**From:** Strategic Planning Agent  
**To:** Implementation Agent  
**Task:** Build Mini-CRM Activity Logging System  
**Timeline:** 4 weeks starting November 11, 2025

---

## 🎯 MISSION BRIEF

You are implementing a **comprehensive activity logging system** for the UYSP lead qualification platform. This system will capture every lead interaction (SMS, campaigns, bookings, conversations, manual actions) as an immutable event, providing complete lead timelines and trustworthy analytics.

**Current Problem:** "System memory loss" - can only see current state, not full journey  
**Your Solution:** PostgreSQL-backed activity log with admin UI and lead timelines  
**Outcome:** Mini-CRM foundation for advanced features

---

## 📋 AUTHORITATIVE DOCUMENTATION

### Primary Document (READ THIS FIRST)

**File:** `docs/PRD-MINI-CRM-ACTIVITY-LOGGING.md`

**This is your bible.** Every architectural decision, technical specification, and implementation task is defined here. Do not deviate without explicit approval.

**Key Sections:**
- Section 1: Executive summary (the problem and vision)
- Section 2: Guiding principles (non-negotiable constraints)
- Section 4: Technical specification (schema, APIs, patterns)
- Section 5: The strangler fig migration plan (4 phases)
- Section 6: Timeline (week-by-week breakdown)

### Quick Start Guide

**File:** `START-MINI-CRM-IMPLEMENTATION.md`

Your Week 1 checklist, day-by-day tasks, verification steps.

---

## 🏗️ ARCHITECTURE (30-SECOND SUMMARY)

**Single Source of Truth:** PostgreSQL `lead_activity_log` table

**Write Path:**
- n8n workflows → POST /api/internal/log-activity → PostgreSQL
- UI actions → logLeadActivity() helper → PostgreSQL

**Read Path:**
- Admin UI → GET /api/admin/activity-logs → PostgreSQL (search, filter, browse)
- Lead detail page → GET /api/leads/[id]/activity → PostgreSQL (timeline)

**Error Handling:**
- n8n: Retry 3x → If all fail → Retry_Queue (Airtable) → Slack alert
- UI: Try-catch (never break app)

**Migration:** Strangler fig (parallel → dual-write → cutover → decommission old SMS_Audit)

---

## 📅 YOUR 4-WEEK TIMELINE

### Week 1: Foundation (20 hours)
**Deliverable:** PostgreSQL table, API endpoints, admin UI foundation

### Week 2: n8n Instrumentation (16 hours)
**Deliverable:** All n8n workflows logging events (SMS, bookings, replies, delivery)

### Week 3: UI Instrumentation (12 hours)
**Deliverable:** All UI actions logging (campaigns, status, notes)

### Week 4: Go Live (12 hours)
**Deliverable:** Admin browser live, lead timelines visible, SMS_Audit deprecated

**Total:** 60 hours (8 hours buffer included for debugging/testing)

---

## ⚠️ CRITICAL ARCHITECTURAL DECISIONS

These decisions are **FINAL** and **NON-NEGOTIABLE:**

### Decision #1: PostgreSQL ONLY (Not Airtable + PostgreSQL)

**Do NOT write to Airtable Message_Decision_Log.**

That table exists in Airtable but is reserved for the future two-way messaging system. Current activity logging goes ONLY to PostgreSQL.

**Why:** Eliminates sync complexity, one source of truth, simpler architecture

### Decision #2: Admin UI Replaces Airtable Browsing

You will build an admin UI at `/admin/activity-logs` for browsing events.

**Features required:**
- Search (full-text across description + message content)
- Filter (event type, category, date range, lead)
- Sort (timestamp, lead, event type)
- Pagination (50 per page)
- Export CSV
- Auto-refresh (30 seconds)

**Why:** Same visibility as Airtable, but faster queries and custom features

### Decision #3: Direct Writes from n8n

Use n8n → API endpoint → PostgreSQL (NOT n8n → Airtable → Sync → PostgreSQL)

**Pattern:**
1. n8n HTTP Request node calls POST /api/internal/log-activity
2. Retry 3x if fails
3. Error output → Write to Retry_Queue (Airtable)
4. Slack alert on failures

**Why:** Simpler than dual writes, one write path, resilient with retry queue

### Decision #4: Strangler Fig Migration

**Do NOT do big-bang migration.**

Phase 1: Build new system dark (no user impact)  
Phase 2: Start dual-writing (populate new system)  
Phase 3: Cut over (make new system primary)  
Phase 4: Decommission old (archive SMS_Audit)

**Why:** Zero disruption, safe, reversible

---

## 🔧 TECHNICAL SPECIFICATIONS (SUMMARY)

### PostgreSQL Table: lead_activity_log

```sql
- id (UUID primary key)
- event_type (VARCHAR 100) - MESSAGE_SENT, BOOKING_CONFIRMED, etc.
- event_category (VARCHAR 50) - SMS, CAMPAIGN, BOOKING, etc.
- lead_id (UUID FK to leads)
- lead_airtable_id (VARCHAR 255) - For correlation
- description (TEXT) - Human-readable event description
- message_content (TEXT) - For SMS/conversation events
- metadata (JSONB) - Flexible event-specific data
- source (VARCHAR 100) - 'n8n:workflow_id' or 'ui:endpoint'
- execution_id (VARCHAR 255) - n8n execution ID
- created_by (UUID FK to users) - For UI actions
- timestamp (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)

INDEXES on: lead_id+timestamp, event_type, timestamp, lead_airtable_id
```

### API Endpoints (3 Total)

1. **POST /api/internal/log-activity** - Central logging endpoint
2. **GET /api/admin/activity-logs** - Admin browser (search, filter, paginate)
3. **GET /api/leads/[id]/activity** - Lead-specific timeline

### UI Components (2 Total)

1. **Admin Activity Browser** - `/admin/activity-logs`
2. **Lead Timeline Component** - Integrated into lead detail page

---

## 🎯 SUCCESS CRITERIA

**You're DONE when:**

1. ✅ PostgreSQL table exists with indexes
2. ✅ All 3 API endpoints working and tested
3. ✅ All 4 n8n workflows logging events
4. ✅ All UI actions (campaigns, status, notes) logging
5. ✅ Admin browser UI functional
6. ✅ Lead timeline visible in portal
7. ✅ Retry_Queue catches failures
8. ✅ SMS_Audit deprecated
9. ✅ Zero data loss for 1 week
10. ✅ Documentation updated

**Evidence Required:**
- Migration file in git
- API test results
- Screenshot of working admin UI
- Query showing activity log records
- Verification all event types logging

---

## 🚨 ESCALATION PROTOCOL

**If you encounter:**

**Architectural confusion?**
→ Re-read PRD Section 2 (Guiding Principles)
→ If still unclear, STOP and ask for clarification

**Technical blocker?**
→ Document the issue with evidence
→ Propose solution referencing PRD
→ Get approval before proceeding

**Timeline slippage?**
→ Report immediately (don't hide it)
→ Re-prioritize with stakeholder
→ Adjust scope if necessary

**This is critical infrastructure. Better to ask than assume.**

---

## 📂 FILE STRUCTURE

```
docs/
  ├── PRD-MINI-CRM-ACTIVITY-LOGGING.md         ← AUTHORITATIVE PRD
  └── PRD-MINI-CRM-ACTIVITY-LOGGING-README.md  ← Quick reference

uysp-client-portal/
  ├── src/
  │   ├── lib/
  │   │   ├── db/
  │   │   │   └── schema.ts                     ← Add leadActivityLog table
  │   │   └── activity/
  │   │       ├── event-types.ts                ← NEW: Event type constants
  │   │       └── logger.ts                     ← NEW: UI logging helper
  │   ├── app/
  │   │   ├── api/
  │   │   │   ├── internal/
  │   │   │   │   └── log-activity/
  │   │   │   │       └── route.ts              ← NEW: Central logging API
  │   │   │   ├── admin/
  │   │   │   │   └── activity-logs/
  │   │   │   │       └── route.ts              ← NEW: Admin browser API
  │   │   │   └── leads/
  │   │   │       └── [id]/
  │   │   │           └── activity/
  │   │   │               └── route.ts          ← NEW: Lead timeline API
  │   │   └── (dashboard)/
  │   │       └── admin/
  │   │           └── activity-logs/
  │   │               └── page.tsx              ← NEW: Admin browser UI
  │   └── components/
  │       └── lead/
  │           └── LeadTimeline.tsx              ← NEW: Timeline component

workflows/
  └── backups/
      └── [workflow]-before-activity-log.json  ← Backup before changes

START-MINI-CRM-IMPLEMENTATION.md               ← This file
```

---

## 📞 SUPPORT & QUESTIONS

**For clarification:** Reference PRD section numbers in your question  
**For changes:** Propose amendment to PRD, get approval  
**For status:** Update weekly progress against timeline

**Emergency contact:** Document blocker with evidence, escalate immediately

---

## 🚀 READY TO START?

**Your first action:**

```bash
cd "/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal"
git checkout -b feature/mini-crm-activity-logging
git push -u origin feature/mini-crm-activity-logging
```

**Then:** Follow Week 1 Day 1 checklist in `START-MINI-CRM-IMPLEMENTATION.md`

**Reference PRD:** `docs/PRD-MINI-CRM-ACTIVITY-LOGGING.md`

---

**Good luck. This is critical infrastructure. Build it right.**

---

**Prepared:** November 7, 2025  
**Status:** ✅ READY FOR EXECUTION  
**Start Date:** November 11, 2025

