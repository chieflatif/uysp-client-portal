# Refactor Clay – Architecture Summary

Purpose
- Concise, high-level view of end-state architecture for Phase 1 (Clay + Single SMS).

Core Components
- Ingestion: Webhook + Normalization → Airtable Leads
- Enrichment: Clay API → ICP gating (≥70)
- SMS: Single daily program (5×100 hourly from 10am ET)
- Tracking: First‑party click redirect `/webhook/c/:token`, delivery/unsub webhooks, Calendly webhook
- Templates: Airtable `SMS_Templates` with optional A/B per campaign
- Campaigns: `lead_source` (Name – Type) + `campaign_batch_id`
- Business Hours: 9–5 ET; skip weekends & US federal holidays

Key Decisions
- Global Calendly link; clicks tracked via redirect; tokens retained
- Eligibility requires: Enriched, ICP≥70, valid US E.164 mobile, not opted out
- Clay failure: skip send, retry 3×, route to Enrichment Review
- Payload storage toggle: store only if zero‑hassle

Outcomes
- Reliable single‑message outreach with measurable funnel:
  - Delivered → Clicked → Booked (Calendly)
- Clean separation for future sequences and reply handling

See Also
- Main Plan: `docs/architecture/MAIN-DEVELOPMENT-PLAN.md`
- Wireframe: `docs/architecture/SMS-CLAY-ENRICHMENT-WIREFRAME.md`
- Sessions Plan: `docs/architecture/SMS-CLAY-ENRICHMENT-SESSIONS-PLAN.md`
- Approved Decisions: `docs/architecture/SMS-DECISIONS-AND-OPEN-QUESTIONS.md`
