# SOP: SimpleTexting Campaign Isolation & Reporting (n8n‑led)

[AUTHORITATIVE]

## Purpose
Ensure our SMS campaign runs on the shared SimpleTexting number while remaining logically isolated from all other activity, with reporting derived only from our campaign. Sequence, sending, and attribution remain in our n8n system.

## Scope
- Outbound sequence control and sending (n8n)
- Logical isolation using `campaign_id`
- Delivery and STOP processing
- Click tracking via our proxy (assume webhook re‑enabled)
- Reporting limited to our campaign only

Out of scope: Creating ST UI campaigns or moving automation into ST.

## Authoritative Current State (evidence)
- Outbound: `UYSP-SMS-Scheduler` (ID `D10qtcjjf2Vmmp5j`) — Active; 3‑step A/B proven 2025‑08‑29
- Delivery: `UYSP-ST-Delivery V2` (ID `vA0Gkp2BrxKppuSu`) — Active; path `/webhook/simpletexting-delivery`
- STOP: `UYSP-SMS-Inbound-STOP` (ID `pQhwZYwBXbcARUzp`) — Active; path `/webhook/simpletexting-inbound`
- Calendly: `UYSP-Calendly-Booked` (ID `LiVE3BlxsFkHhG83`) — Active; path `/webhook/calendly`
- Airtable SSOT (from handover): Base Option C; Tables: `Leads`, `SMS_Templates`, `Settings`, `SMS_Audit`
- SimpleTexting API: 1:1 send `POST /v1/send` (form‑encoded), Delivery & Unsubscribe webhooks (docs confirmed)

Sources: `context/CURRENT-SESSION/SMS-SEQUENCER-V1-COMPREHENSIVE-HANDOVER.md`, `memory_bank/active_context.md`, ST API docs.

## Roles & Responsibilities
- Ops: Toggle scheduler, adjust batch caps, confirm Slack alerts, pause if needed
- Dev: Maintain scheduler logic, token/HMAC, webhook receivers, Airtable mappings
- Analyst: Build reports filtering `campaign_id` only; validate KPIs

## Data & Keys
- Shared ST number: used by all campaigns; isolation is logical (not phone‑based)
- Our campaign identifier: `campaign_id` (constant per initiative, e.g., `AI_WEBINAR_2025_09`)
- Message metadata (stored): `campaign_id`, `smsid` (ST), `step`, `variant`, `SMS Status`, costs, timestamps
- Optional ST UI isolation: ST List `AI Webinar – Automation (System)` and Tag `uysp-automation` (visibility only)

## End‑to‑End Procedure
1) Eligibility & selection (n8n)
- Scheduler queries Airtable for due leads: US, ICP≥70, Phone valid, not STOP/Booked
- Maintains A/B assignment, step position, business hours

2) Personalize & link
- Build message from `SMS_Templates`; inject click‑proxy URL with token (HMAC)
- Attach `campaign_id`, `step`, `variant` to the send context

3) Send via ST API
- `POST https://app2.simpletexting.com/v1/send` (form‑encoded): `phone`, `message`
- Capture `smsid` from response; write `SMS_Audit` row with `campaign_id`, `smsid`, `step`, `variant`, costs

4) Delivery tracking (Webhook → n8n)
- ST posts Delivery to `/webhook/simpletexting-delivery` with `{id, status, destination, carrier}`
- Find audit row by `smsid` (and fallback phone) → set `SMS Status=Delivered`; Slack notify; persist audit

5) Click tracking (Proxy → n8n)
- Recipient taps link → our GET click endpoint verifies token (HMAC)
- Update `SMS_Audit` (Clicked=true, Clicked At) → 302 to Calendly
- Note: Clicks do not stop sequences

6) STOP processing (Webhook → n8n)
- ST inbound/UNSUBSCRIBE → `/webhook/simpletexting-inbound`
- Match by phone → set `SMS Stop=true`, `Stop Reason=STOP`; sequences halted

7) Reporting
- All metrics pulled from `SMS_Audit`/`Leads` where `campaign_id = <ours>`
- Daily Slack summary optional (counts: sent, delivered, clicks, stops, booked)

## Guardrails & Kill Switches
- Batch cap: keep current cap (e.g., 200/run) in scheduler
- Kill switches:
  - n8n: disable scheduler or gate on `campaign_id`
  - ST: pause sending by stopping scheduler (we do not auto‑send via ST UI)
- Compliance: STOP/unsubscribes enforced account‑wide (ST). Our logic honors them.

## Failure Modes & Actions
- High credit burn: Pause scheduler; verify selection view; check Slack; re‑enable after fix
- Delivery drops: Inspect delivery webhook executions; carriers in payload; escalate to ST if carrier‑specific
- Clicks not logging: Validate GET click endpoint responding 200/302; verify token/HMAC node, and audit write
- STOP not honored: Check inbound webhook executions; phone normalization edge cases

## Done‑When
- All sends for this initiative include `campaign_id`; audit rows created with `smsid`
- Delivery/STOP webhooks updating only our audit/lead records
- Clicks recorded via proxy; reports filter by `campaign_id`

## References
- Workflows: Scheduler `D10qtcjjf2Vmmp5j`, Delivery `vA0Gkp2BrxKppuSu`, STOP `pQhwZYwBXbcARUzp`, Calendly `LiVE3BlxsFkHhG83`
- Paths: `/webhook/simpletexting-delivery`, `/webhook/simpletexting-inbound`, `/webhook/calendly`, (click) `/webhook/click/:token`
- ST API: `POST /v1/send`, Delivery & Unsubscribe webhooks (official docs)

Confidence: 92%
