# Product Roadmap (SSOT)

This file tracks product/features only (no process). It is the source for next‑session planning.

Legend
- Status: CRITICAL_DEFERRED | BLOCKED_PLATFORM | NEXT_SESSION | NICE_TO_HAVE | IDEA
- Area: SMS | Webhooks | Enrichment | Monitoring | Dashboards | Ops
- Where: workflow/table or system touched

Template
```
- Title: <short name>
  Status: <one of legend>
  Priority: P1/P2/P3
  Area: <area>
  Owner: <name>
  Where: <workflow/table>
  Rationale: <why it matters>
  Prereqs: <ids/decisions>
  Done-when: <single, testable condition>
  Last-reviewed: <YYYY-MM-DD>
```

## P1 — Now / Critical
- Title: Daily Monitoring (activate cron)
  Status: NEXT_SESSION
  Priority: P1
  Area: Monitoring
  Owner: LATIF
  Where: n8n `5xW2QG8x2RFQP8kx`
  Rationale: Daily ops visibility
  Prereqs: Slack cred confirmed
  Done-when: One scheduled Slack post appears next business day using `Delivery At`
  Last-reviewed: 2025-09-03

- Title: Inbound STOP (confirm active)
  Status: NEXT_SESSION
  Priority: P1
  Area: SMS/Webhooks
  Owner: LATIF
  Where: n8n `pQhwZYwBXbcARUzp`
  Rationale: Compliance / exclusion
  Prereqs: Toggle Active
  Done-when: Test “STOP” sets fields and lead is excluded next scheduler run
  Last-reviewed: 2025-09-03

- Title: Calendly webhook (invitee.created)
  Status: NEXT_SESSION
  Priority: P1
  Area: Webhooks
  Owner: Client Admin → LATIF verify
  Where: n8n `LiVE3BlxsFkHhG83`
  Rationale: Booking stops sequence
  Prereqs: Org webhook set; signing secret captured
  Done-when: Test booking sets `Booked=true` and stops sequence
  Last-reviewed: 2025-09-03

- Title: Switch SMS link to client URL
  Status: NEXT_SESSION
  Priority: P1
  Area: SMS/Templates
  Owner: LATIF
  Where: Airtable `Settings` + `SMS_Templates`
  Rationale: Production cleanliness
  Prereqs: Client link confirmed
  Done-when: Scheduler preview shows clean client link only
  Last-reviewed: 2025-09-03

- Title: SimpleTexting on client account
  Status: NEXT_SESSION
  Priority: P1
  Area: SMS/Provider
  Owner: LATIF
  Where: n8n HTTP credential
  Rationale: Send from client
  Prereqs: API key
  Done-when: Test send succeeds; `SMS_Audit` row written
  Last-reviewed: 2025-09-03

- Title: Final Texting Pipeline Cutover
  Status: NEXT_SESSION
  Priority: P1
  Area: SMS/Ops
  Owner: LATIF
  Where: See Dev Plan `DEV-PLAN-SimpleTexting-Campaign-Isolation-and-Clicks.md`
  Rationale: Move from test mode to steady-state with campaign_id isolation
  Prereqs: ST API key on client account; Scheduler active; STOP/Delivery verified; SMS_Audit views created
  Done-when: Two real sends show `campaign_id`; delivery updates and reports filter correctly
  Last-reviewed: 2025-09-03

- Title: Kajabi realtime intake (enable)
  Status: NEXT_SESSION
  Priority: P1
  Area: Ingestion
  Owner: LATIF
  Where: n8n `2cdgp1qr9tXlONVL`
  Rationale: Live pipeline
  Prereqs: Fields/triggers agreed
  Done-when: Test POST creates queued lead
  Last-reviewed: 2025-09-03

## P2 — Next
- Title: Slack channel separation (Sales vs Ops)
  Status: NEXT_SESSION
  Priority: P2
  Area: Monitoring
  Owner: LATIF
  Where: Airtable `Settings` + n8n
  Rationale: Reduce noise
  Prereqs: Settings fields
  Done-when: One day shows summaries in Sales and errors in Ops
  Last-reviewed: 2025-09-03

- Title: Automated backups (nightly)
  Status: NEXT_SESSION
  Priority: P2
  Area: Ops
  Owner: LATIF
  Where: CI/script
  Rationale: Recovery safety
  Prereqs: Repo access
  Done-when: 3 nightly artifacts exist (workflows + schema)
  Last-reviewed: 2025-09-03

- Title: Backlog CSV processing (30k plan)
  Status: NEXT_SESSION
  Priority: P2
  Area: Ingestion
  Owner: LATIF
  Where: n8n `qMXmmw4NUCh1qu8r`
  Rationale: Scale activation
  Prereqs: Batching guide
  Done-when: Batch 1 imports clean; metrics captured
  Last-reviewed: 2025-09-03

- Title: Health Monitor enhancements
  Status: NEXT_SESSION
  Priority: P2
  Area: Monitoring
  Owner: LATIF
  Where: n8n Health Monitor workflow
  Rationale: Actionable alerts without noise
  Prereqs: Define stuck/queued age thresholds
  Done-when: Alerts only on critical; no duplicate daily posts for one week
  Last-reviewed: 2025-09-03

- Title: Airtable Interface dashboard (customer‑facing)
  Status: NEXT_SESSION
  Priority: P2
  Area: Dashboards
  Owner: LATIF
  Where: Airtable Interfaces
  Rationale: Visual KPIs for client
  Prereqs: Confirm required widgets/filters
  Done-when: Interface shows Sends/Delivered/Stops/Booked over last 7/30 days
  Last-reviewed: 2025-09-03

## P3 — Later / Blocked
- Title: Click tracking v1 (n8n GET blocked)
  Status: CRITICAL_DEFERRED
  Priority: P3
  Area: Webhooks/Tracking
  Owner: LATIF
  Where: GET redirect workflow (blocked)
  Rationale: Key conversion metric
  Prereqs: n8n GET registration fixed
  Done-when: GET path registers; 302 Location works; click logged
  Last-reviewed: 2025-09-03

- Title: Cloudflare Worker redirect (option)
  Status: NICE_TO_HAVE
  Priority: P3
  Area: Webhooks/Tracking
  Owner: LATIF
  Where: Worker on client domain
  Rationale: Bypass n8n GET limitation
  Prereqs: HMAC secret; deploy
  Done-when: `curl -I` returns 302 Location; optional POST logged
  Last-reviewed: 2025-09-03

- Title: Airtable‑first company cache (optional cost saver)
  Status: NICE_TO_HAVE
  Priority: P3
  Area: Enrichment
  Owner: LATIF
  Where: Airtable `Companies` + Automations
  Rationale: Reduce Clay per‑lead lookups; enrich from Airtable cache
  Prereqs: Stable domain normalization; automation quotas
  Done-when: Known domains populate lead fields via Airtable only; zero Clay company lookups for hits
  Last-reviewed: 2025-09-03

## Design Truth (Clay)
- Current production: Clay “companies to enrich” is the company cache; Clay “Airtable → Upsert Record (Leads)” maps company fields directly to `Leads`. Airtable `Companies`/automations are optional and currently OFF.


