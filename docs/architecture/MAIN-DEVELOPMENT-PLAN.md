# MAIN DEVELOPMENT PLAN – SMS + Clay Enrichment

## Objective
Deliver Phase 1 (sequencer with clean booking links) on top of Clay enrichment with robust metrics and safety; click redirects via Worker optional later.

## Scope (Phase 1)
- Clay enrichment workflow and ICP gating
- Mirror Companies to Airtable `Companies` table (upsert by `Domain`)
- Outbound SMS sequencer (3 steps) via scheduler (UTC `0 14-21 * * 1-5`)
- Clean Calendly links in SMS (no tracking); Worker-based redirect optional later
- Delivery and unsubscribe webhooks
- Templates in Airtable with optional A/B per campaign/batch
- Business hours, US holidays
- Campaign tracking via `lead_source` (Name – Type) and `campaign_batch_id`

## Deliverables
- n8n workflows: Realtime/Backlog Ingestion, SMS Scheduler, Delivery Webhook, Inbound STOP, Calendly Webhook, Daily Monitoring
- Airtable schema updates and views (including `Companies` authoritative cache)
- Docs: Architecture, Decisions, Sessions, Ops instructions

## Sessions Overview
- Session 1: Foundation (schema, templates, holidays, credentials, branch)
- Session 2: Clay Integration (enrichment + ICP + Companies mirror upsert)
- Session 3: SMS Infrastructure (redirect, sender, webhooks, hours)
- Session 4: Testing (internal numbers, metrics validation)
- Session 5: Production Prep (views, alerts, pilot)

## Success Criteria
- Enriched, eligible leads receive single SMS within business window
- Clicks logged via redirect; bookings via Calendly webhook
- Delivery/unsub recorded; unsubscribe rate measurable per template variant
- 500/day throughput via hourly batches

## Risks & Mitigations
- n8n node persistence quirks → Manual UI verification + backups
- Webhook flakiness → Retry logic, Slack on failure
- Carrier filtering → Business hours, clean templates, monitor unsub rate

## Next Steps
- Implement Session 1 and confirm scaffolding
- Proceed through sessions with commits per milestone
