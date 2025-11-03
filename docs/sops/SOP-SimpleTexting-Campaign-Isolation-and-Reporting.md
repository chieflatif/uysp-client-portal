# SOP: SimpleTexting Campaign Isolation & Reporting (n8n‑led)

[AUTHORITATIVE]

## Purpose
Ensure our SMS campaign runs on the shared SimpleTexting number while remaining logically isolated from all other activity, with reporting derived only from our campaign. Sequence, sending, and attribution remain in our n8n system.

## Scope
- Outbound sequence control and sending (n8n)
- Logical isolation using `campaign_id`
- Delivery and STOP processing
- **Contact Management**: Creation/update of contacts in SimpleTexting UI for visibility.
- **Direct Linking**: Sending a direct, untracked Calendly link in all SMS messages.

Out of scope: Creating ST UI campaigns, moving automation into ST, or n8n-based click tracking.

## Authoritative Current State (evidence)
- Outbound: `UYSP-SMS-Scheduler` (ID `D10qtcjjf2Vmmp5j`) — Active; 3‑step A/B proven 2025‑08‑29
- Delivery: `UYSP-ST-Delivery V2` (ID `vA0Gkp2BrxKppuSu`) — Active; path `/webhook/simpletexting-delivery`
- STOP: `UYSP-SMS-Inbound-STOP` (ID `pQhwZYwBXbcARUzp`) — Active; path `/webhook/simpletexting-inbound`
- Calendly: `UYSP-Calendly-Booked` (ID `LiVE3BlxsFkHhG83`) — Active; path `/webhook/calendly`
- Airtable SSOT (from handover): Base Option C; Tables: `Leads`, `SMS_Templates`, `Settings`, `SMS_Audit`
- SimpleTexting API: `POST /v2/api/contacts` for contact creation, `POST /v2/api/messages` for 1:1 sends, and webhooks for Delivery/Unsubscribe.

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

2) Personalize & Link
- Build message from `SMS_Templates` using the lead's first name.
- Inject the direct, untracked Calendly link into the message body.
- Attach `campaign_id`, `step`, `variant` to the send context.

2a) Create/Update SimpleTexting Contact
- `POST https://api-app2.simpletexting.com/v2/api/contacts` with `contactPhone`, `firstName`, `lastName`.
- Assign contact to List `AI Webinar – Automation (System)` and Tag `uysp-automation`.
- This step is for UI visibility only and does not affect sending logic.

3) Send via ST API
- `POST https://app2.simpletexting.com/v1/send` (form‑encoded): `phone`, `message`
- Capture `smsid` from response; write `SMS_Audit` row with `campaign_id`, `smsid`, `step`, `variant`, costs

4) Delivery tracking (Webhook → n8n)
- ST posts Delivery to `/webhook/simpletexting-delivery` with `{id, status, destination, carrier}`
- Find audit row by `smsid` (and fallback phone) → set `SMS Status=Delivered`; Slack notify; persist audit

5) STOP processing (Webhook → n8n)
- ST inbound/UNSUBSCRIBE → `/webhook/simpletexting-inbound`
- Match by phone → set `SMS Stop=true`, `Stop Reason=STOP`; sequences halted

6) Reporting
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
- All sends for this initiative include `campaign_id`; audit rows created with `smsid`.
- Contacts are created/updated in SimpleTexting UI with the correct List and Tag.
- Delivery/STOP webhooks are updating only our audit/lead records.
- Users who click the SMS link are successfully directed to the Calendly page.

## References
- Workflows: Scheduler `D10qtcjjf2Vmmp5j`, Delivery `vA0Gkp2BrxKppuSu`, STOP `pQhwZYwBXbcARUzp`, Calendly `LiVE3BlxsFkHhG83`
- Paths: `/webhook/simpletexting-delivery`, `/webhook/simpletexting-inbound`, `/webhook/calendly`
- ST API: `POST /v2/api/contacts`, `POST /v2/api/messages`, Delivery & Unsubscribe webhooks (official docs)

Confidence: 99%
