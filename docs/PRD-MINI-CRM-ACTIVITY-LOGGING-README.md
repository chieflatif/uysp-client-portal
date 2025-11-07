# Mini-CRM Activity Logging System - Documentation Hub

**PRD Location:** `docs/PRD-MINI-CRM-ACTIVITY-LOGGING.md`  
**Status:** ✅ APPROVED - AUTHORITATIVE SOURCE OF TRUTH  
**Version:** 3.0 FINAL  
**Date:** November 7, 2025

---

## ⚠️ CRITICAL: THIS IS THE AUTHORITATIVE SPECIFICATION

**For Implementation Agents:**

This PRD is the **single source of truth** for the Mini-CRM Activity Logging System. Any implementation work MUST follow this specification exactly. Architectural decisions in this document are **NON-NEGOTIABLE** and have been vetted through multiple iterations.

**Do not:**
- ❌ Deviate from the PostgreSQL-first architecture
- ❌ Add Airtable Message_Decision_Log writes (intentionally omitted)
- ❌ Change the strangler fig migration strategy
- ❌ Skip the retry queue error handling
- ❌ Modify the schema without explicit approval

**Do:**
- ✅ Follow the 4-phase implementation plan exactly
- ✅ Deliver week-by-week as specified
- ✅ Provide evidence for each deliverable
- ✅ Ask clarifying questions if anything is unclear
- ✅ Reference this PRD in all code comments and commit messages

---

## 📋 QUICK REFERENCE

### What This System Does

**Solves:** "System memory loss" - no comprehensive lead activity tracking  
**Delivers:** Complete lead timelines, trustworthy analytics, Mini-CRM foundation  
**Architecture:** PostgreSQL-first, admin UI for browsing, resilient error handling

### Key Architectural Decisions

1. **PostgreSQL = Single Source of Truth** (not Airtable)
2. **Admin UI for Browsing** (not Airtable browsing)
3. **Direct Writes** (n8n → PostgreSQL, UI → PostgreSQL)
4. **Strangler Fig Migration** (parallel build → dual-write → cutover → decommission)
5. **Retry_Queue for Resilience** (zero data loss guarantee)

### Implementation Timeline

**Week 1:** Foundation (PostgreSQL table, API endpoints, admin UI)  
**Week 2:** n8n workflows (SMS scheduler, Calendly, reply handler, delivery)  
**Week 3:** UI actions (campaigns, status, notes)  
**Week 4:** Cutover (go live, deprecate SMS_Audit)

**Total:** 68 hours over 4 weeks

---

## 🔗 RELATED DOCUMENTATION

### Pre-Requisites (Read First)

- `UYSP-COMPLETE-STATUS-AND-ROADMAP.md` - Current system status
- `PRD-TWO-WAY-AI-MESSAGING-SYSTEM.md` - Two-way messaging context (uses same activity log)

### Supporting Docs

- `docs/sops/SOP-Airtable-SMS_Audit.md` - Old system (being replaced)
- `docs/architecture/CLIENT-PORTAL-COMPLETE-SPECIFICATION.md` - Portal architecture
- `docs/USER-ACTIVITY-TRACKING.md` - User analytics (different from lead activity)

### Implementation Tools

- Drizzle ORM documentation (database migrations)
- n8n PostgreSQL connector docs
- React Query documentation (timeline component)

---

## 📊 SUCCESS CRITERIA

**The system is DONE when:**

1. ✅ All 10 "Definition of Done" criteria met (see PRD Section 12)
2. ✅ Admin confirms UI meets troubleshooting needs
3. ✅ Zero silent data loss for 1 week continuous operation
4. ✅ All event types logging (SMS, campaigns, bookings, manual actions)
5. ✅ Lead timelines visible and accurate in portal

---

## 🚨 ESCALATION

**If you encounter:**
- Architectural decisions that seem wrong → **STOP, ask for clarification**
- Technical blockers → Document in issue, escalate
- Timeline slippage → Report immediately, don't hide it

**This is critical infrastructure. Better to ask than assume.**

---

**For Questions:** Reference PRD section numbers in your questions  
**For Changes:** Propose as PR to this PRD, get approval before implementing  
**For Status:** Update weekly progress against PRD timeline

---

**Last Reviewed:** November 7, 2025  
**Next Review:** When implementation begins (Week 1 kickoff)

