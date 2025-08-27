# Active Context: UYSP Lead Qualification - Post-Recovery

**Session Status**: ✅ **ACTIVE**
**Branch**: `feature/clay-sms-integration`
**Date**: 2025-08-26

---

## 🎯 **Current Objective: Implement SMS + Clay Phase 1 (single-message, tracked)**

- Follow the MAIN Development Plan and Sessions Plan:
  - `docs/architecture/MAIN-DEVELOPMENT-PLAN.md`
  - `docs/architecture/SMS-CLAY-ENRICHMENT-SESSIONS-PLAN.md`
- Architecture and wireframe finalized:
  - `docs/architecture/SMS-CLAY-ENRICHMENT-WIREFRAME.md`
  - `docs/architecture/SMS-SEQUENCE-REALISTIC-ARCHITECTURE.md`
  - Decisions approved: `docs/architecture/SMS-DECISIONS-AND-OPEN-QUESTIONS.md`

---

## 📋 **Current System Status**

### ✅ **COMPLETED & VERIFIED**
-   **Architecture:** The "Option C" (Minimalist n8n + Clay.com Engine) architecture is confirmed and documented.
-   **Real-time Ingestion:** `UYSP-Realtime-Ingestion` workflow (`2cdgp1qr9tXlONVL`) is live and operational.
-   **Backlog Ingestion:** `UYSP Backlog Ingestion` workflow (`qMXmmw4NUCh1qu8r`) is configured and ready for manual execution.
-   **Airtable Base:** `app6cU9HecxLpgT0P` is configured with the correct `Leads` and `Companies` schemas.

### 🟡 **PENDING FINAL CONFIGURATION**
-   **SMS Phase 1 Build (this branch):** Implement Clay enrichment, single SMS sender (5×100 hourly from 10am ET), click redirect, delivery/unsub webhooks, business hours + holidays.
-   **Credentials:** Confirm Clay and SimpleTexting tokens in n8n.
-   **Health Monitor Workflow:** (`wNvsJojWTr0U2ypz`) can be activated post Phase 1.

---

## ✅ **Key Decisions Snapshot**
- One global Calendly link; campaign attribution via `lead_source` (Name – Type) + `campaign_batch_id`.
- Eligibility: Enriched=true, ICP≥70, US E.164 mobile, not opted out.
- Clay failure: skip send, retry up to 3x, route to Enrichment Review.
- Sends: 500/day via 5 hourly runs of 100 (start 10am ET); enforce 9–5 ET; no weekends/US holidays.
- Templates: Airtable-managed; per campaign choose 1 or 2; if 2 → 50/50.
- Clicks: First‑party redirect `/webhook/c/:token`; tokens retained indefinitely.
- Payloads: Store only if zero-hassle (config‑toggled).

---

## 🚀 **Next Steps**

- Start Session 1 on `feature/clay-sms-integration`:
  - Add Airtable fields and `SMS_Templates` table; add `Holidays` table; set business-hours vars
  - Validate Clay + SimpleTexting credentials in n8n
  - Commit after each milestone
- Then proceed with Sessions 2–5 per `docs/architecture/SMS-CLAY-ENRICHMENT-SESSIONS-PLAN.md`.

---

## Progress Snapshot (Today)

Done:
- Clay: company enrichment (Apollo + GPT), join-back, field extraction
- Airtable writeback: company fields, Job Title, phone normalization (Significant → Phone, Successfully Parsed → Phone Valid)
- Scoring: Company Score (from Clay), Role Score (AI from Job Title), Location Score (US tiers), ICP formula (+5 Prime Fit Bonus)
- Docs: runbook HRQ routing, schema updates, batching plan status, A/B testing note

Pending:
- HRQ routing enforcement in Clay mapping (exclude personal emails rows in downstream steps)
- SMS Eligible (calc) field usage in view; optional automation to mirror into checkbox
- n8n: Personal Email Filter (optional), Batch Monitor (Option A), later Batch Orchestrator (Option B)
- A/B testing fields in Airtable (Template Variant, Campaign) if not yet created

Planned (new todos):
- SMS Sent Count auto-update via SimpleTexting webhooks
- Clay per-row Enrichment Cost writeback + batch rollups by Batch ID
- Kajabi schema (member status, purchases, newsletter/learning engagement), bulk import + webhooks
- Pre-production cleanup workflow: split work/personal, reverse lookup to resolve work email, merge identities, reintegrate
- LinkedIn engagement roadmap (fields + fetch)