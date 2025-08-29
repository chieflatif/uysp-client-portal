# SMS Sequencer v1 — Operational SOP (n8n Cloud + Airtable + SimpleTexting)

Last updated: 2025-08-28
Owner: LATIF / Project: UYSP Lead Qualification Agent
Workflow ID: D10qtcjjf2Vmmp5j (UYSP-SMS-Scheduler)

---

## Scope
This SOP defines day-to-day operations, safe testing, activation windows, and troubleshooting for the outbound SMS sequencer (A/B, 3 steps), with Airtable-backed templates and safety controls.

## Components
- Airtable base: UYSP Lead Qualification (Option C)
  - Table: Leads (tblYUvhGADerbD8EO)
  - Table: SMS_Templates (tblsSX9dYMnexdAa7)
  - Table: Settings (tblErXnFNMKYhh3Xr) ← Test Mode controls
- n8n Cloud workflow: UYSP-SMS-Scheduler (D10qtcjjf2Vmmp5j)
- Provider: SimpleTexting (header API key)
- Slack: Notifications channel (C097CHUHNTG)

## Safety Controls
- Test Mode (Airtable → Settings):
  - Fields: Test Mode (checkbox), Test Phone (text)
  - When checked, ALL sends are redirected to Test Phone. Real lead phones are never used.
  - Slack prefix shows [TEST MODE].
- Business hours: Cron expression (UTC) 0 14-21 * * 1-5 (maps to 10–17 ET while UTC-4). Adjust seasonally if needed.
- Idempotency: Update node increments counts post-send; HTTP node set to neverError to log failures safely.

## Runbook
1) Preflight
- Airtable → Settings: confirm Test Mode state (ON for testing, OFF for production) and Test Phone value if ON.
- Airtable → SMS_Templates: confirm copy, Variant (A/B), Step (1–3), Delay Days (0/3/7).
- Leads view “SMS Pipeline”: confirm due leads (eligible, not stopped/booked, phone valid).

2) Manual test
- n8n → open workflow → Manual Trigger → Execute workflow.
- Expect: Slack notification for at least one lead; SimpleTexting may return test-limit errors (allowed). Airtable updates should apply (Sequence Position +1, Last Sent At, Sent Count +1, Status).

3) Activate schedule
- Node “Schedule” → Parameters → Mode: Custom → Cron Expression: 0 14-21 * * 1-5.
- Activate workflow (toggle ON). Next execution should show hourly Mon–Fri.

4) Monitoring
- Slack “SMS Test Notify” for status per item.
- Airtable Leads: fields updated as sends occur.
- n8n Executions: watch SimpleTexting HTTP responses for rate limits or INVALID_CONTACT.

## A/B & Templates
- Ratios stored in Settings: ab_ratio_a / ab_ratio_b (defaults 50/50 if absent).
- Template selection uses Variant + Step. Personalization replaces {Name}.
- Delay Days per step can be set per-template; defaults: Step2=3, Step3=7.

## Stop Conditions
- Not-sent if: missing/invalid phone, outside country guard, or not-due by delay.
- Future (separate workflows): STOP inbound keyword and Calendly booking webhook to set Lead flags and halt further sends.

## Troubleshooting
- Credentials dropped after node edits (Cloud gotcha): reselect creds in UI for HTTP/Airtable/Slack and verify URL.
- Airtable 422 INVALID_FILTER_BY_FORMULA: ensure field exists in the table being queried; for Test Mode use the Settings table.
- Cron UI errors: set Mode=Custom and paste cron into “Cron Expression”; timezone is not available in your node version, so use UTC mapping.

## Change Log (highlights)
- Added Test Mode override (redirect all sends to Airtable Settings.Test Phone when enabled).
- Moved due-check logic into Prepare Text; removed extra filter node.
- Server-side Airtable Search with limit and formula to fetch only due leads.
- Safe Airtable Update (no computed fields).

## Rollback
- Deactivate workflow (toggle OFF).
- Revert SimpleTexting `contactPhone` expression to `$json.phone_digits` if you temporarily hardcoded a number.
- Restore previous snapshot from `workflows/backups/` and re-import if needed.

---

## Status Snapshot — 2025-08-29

- 🟢 Delivery webhook (UYSP-ST-Delivery V2, ID: vA0Gkp2BrxKppuSu)
  - Path verified end-to-end: Webhook → Parse Delivery → Find Lead (Record→Search) → Update Lead Delivery → Respond 200 → Slack → Audit
  - Evidence (executions): 2960, 2959
  - Airtable updates: `recjRGAiCez377jWm` (8319990500) set to Delivered; `recax23rhooohXVv3` already Delivered; fields persisted without touching computed columns
  - Slack: Delivery notifications posted to channel `C097CHUHNTG`
  - Audit rows: created in `SMS_Audit` (e.g., `recki1fqwX1Ru3exp`, `rec4Ln2jfzYOWMBFm`, `rec5VeCaQ7RIjecEP`)

- 🟢 Respond 200 (Code)
  - Mode: Run once for each item
  - Code: `return $input.item;`

- 🟢 Find Lead (by Campaign/Phone)
  - Airtable v2 → Resource: Record, Operation: Search, Return all: ON
  - filterByFormula (Expression): `={{`OR({SMS Campaign ID}='${$json.campaign_id||''}', {Phone}='${$json.phone_digits||''}', {Phone}='+1${$json.phone_digits||''}')`}}`

- 🟡 Write Audit Row
  - Working with dual inputs (connected from both Parse Delivery and Find Lead)
  - Uses Find Lead output for `Lead Record ID` and Parse output for campaign/phone/status/carrier

- 🟡 Outbound scheduler (UYSP-SMS-Scheduler)
  - A/B, dedupe, Test Mode verified previously; Step 2/3 same-session proof pending using Fast Mode delays

- 🔴 Inbound STOP webhook → mark `SMS Stop=true`, `SMS Stop Reason=STOP`, set `Processing Status='Stopped'` (Pending activation)
- 🔴 Calendly `invitee.created` webhook → set `Booked=true`, `Booked At`, `SMS Stop=true`, `SMS Stop Reason=BOOKED`, `Processing Status='Completed'` (Pending activation)

### Blockers / Gotchas
- n8n Cloud credential/URL wipe on credentialed nodes if parameter blocks are replaced wholesale; always reselect credentials in UI and avoid replacing `parameters`/`operation`/`resource`/`url` via API.
- Airtable `filterByFormula` must be a single expression; avoid stray leading `=` or multiline IF syntax in the node UI.
- Avoid writing to computed/readonly Airtable fields; map only writable fields under Update.

### Next Core Tasks (Handover)
1) Inbound STOP: Activate workflow; ensure Airtable Update sets `SMS Stop=true`, `SMS Stop Reason=STOP`, `Processing Status='Stopped'`; test with "STOP" reply.
2) Calendly booked: Activate webhook; on `invitee.created` update lead as booked + stop; verify with a test invitee.
3) Scheduler Step 2/3 proof: Enable Fast Mode; set `Fast Delay Minutes` on Step 2 and 3 templates; run two spaced tests (≥3 min apart) to confirm advancement.
4) Sent audit at send-time: Ensure outbound scheduler writes a minimal `SMS_Audit` "Sent" row immediately after HTTP 200.
5) Delivery backfill hardening: Keep current logic that sets `SMS Status=Delivered` and writes carrier; ensure it can backfill `SMS Campaign ID` if missing.
6) Monitoring: Add a daily count sanity Slack post (optional) showing sends/deliveries/errors.

---

## Sequencer Controls & Guards (Definitive)
- Dedupe:
  - Per-run: `Prepare Text (A/B)` keeps a Set of phone digits to prevent multiple sends in the same run
  - Cross-record (same phone on multiple leads): seeded with any lead whose `SMS Status='Sent'` today in ET; only one send per phone/day
- Timing:
  - Step 1: no delay; per-day guard applies only to Step 1
  - Step 2/3: enforce `Delay Days` (or `Fast Delay Minutes` when Fast Mode ON)
- Eligibility (Airtable filter): `Processing Status` in {Queued, In Sequence}, `Phone Valid`, `SMS Eligible`, not `SMS Stop`, not `Booked`, `Phone` len>0
- Phone guard: US only; exactly 10 digits after stripping non-digits and optional leading 1
- A/B:
  - Ratios from `Settings.ab_ratio_a / ab_ratio_b`; variant chosen once and persisted in `SMS Variant`
  - Templates selected by Variant + Step; `{Name}` personalization applied
- Test Mode (Airtable → `Settings`):
  - `Test Mode` (checkbox), `Test Phone` (text)
  - When ON, SimpleTexting send redirects to `Test Phone`; Slack prefix `[TEST MODE]`
- Fast Mode (Airtable → `Settings`):
  - `Fast Mode` (checkbox), `Fast Delay Minutes` on templates
  - When ON, Step 2/3 delays use minutes instead of days
- Business hours: UTC cron `0 14-21 * * 1-5` (maps 10–17 ET). Adjust seasonally.

## Click Tracking v1 (Design — disabled by default)
- Purpose: Mark `SMS Status=Clicked` and log click events without stopping the sequence.
- Pattern: HMAC-signed URL proxy
  - Before send: replace any `https://…` in the SMS body with a proxy URL `https://your-domain/click/:token`
  - Token payload: `{ leadId, campaignId, ts }` signed with secret; short-lived (e.g., 7 days)
  - Store mapping (optional) in `SMS_Audit` with Event="LinkIssued"
- Inbound (new workflow: UYSP-ST-Click-Proxy):
  - Webhook receives `GET /click/:token`
  - Verify HMAC; decode payload; 302 redirect to original URL
  - Update lead: `SMS Status='Clicked'` (do not change `Processing Status`)
  - Write `SMS_Audit` row: Event="Click", Campaign ID, Lead Record ID, Clicked At
- Done-when checks:
  - Two test links redirect correctly; Airtable shows `SMS Status=Clicked`; Audit rows exist (Click + LinkIssued)
  - Slack optional: post `[CLICK]` notices to channel

## Monitoring & Alerting
- Daily Slack summary (new workflow): counts for last 24h
  - Sends, Delivered, Undelivered, Clicks, STOPs, Booked, Errors
  - Link to latest executions
- Error Slack alerts: any node error in scheduler/delivery/inbound flows sends a short summary + execution link

## Inbound STOP (Current State)
- Workflow: `UYSP-SMS-Inbound-STOP` (active)
- Webhook path: `/webhook/simpletexting-inbound`
- Parse rules: text contains STOP/END/QUIT/UNSUB/UNSUBSCRIBE/CANCEL (case-insensitive); phone normalized to 10 digits
- Airtable nodes:
  - Find Lead by Phone → Resource: Record; Operation: Search; Return all: ON; filterByFormula:
    ```javascript
    ={{`OR(REGEX_REPLACE({Phone}, "\\D", "")='${$json.phone_digits||''}', REGEX_REPLACE({Phone}, "\\D", "")='1${$json.phone_digits||''}')`}}
    ```
  - Mark STOP → Resource: Record; Operation: Update; match on `id`; set: `SMS Stop=true`, `SMS Stop Reason=STOP`, `Processing Status=Stopped`
- Done-when: Replying "STOP" updates the matching lead(s) and excludes them on next scheduler run

## Calendly Booked (Pending)
- Webhook: `invitee.created`
- Update lead: `Booked=true`, `Booked At`, `SMS Stop=true`, `SMS Stop Reason=BOOKED`, `Processing Status=Completed`
- Done-when: Test invitee updates a target lead and excludes it from scheduler

## Node UI Configuration Cheatsheet (Cloud-safe)
- Airtable v2 (Search): Resource=Record, Operation=Search, Return all=ON, `filterByFormula` (Expression), Base ID, Table ID
- Airtable v2 (Update/Create): `columns.mappingMode=defineBelow`, `matchingColumns=['id']` for updates, map only writable fields, Options→Typecast=ON
- HTTP (SimpleTexting): keep method=POST and full URL; never replace entire `parameters` via API; reselect credential after edits
- Slack: OAuth credential must be selected in UI after any bulk change

## Done-When Checklists (quick)
- Outbound send: Slack posted, Airtable lead updated (variant/position/last sent/status/campaign id), Sent audit row created
- Delivery: Airtable status set to Delivered, carrier logged, delivery audit row created, Slack delivery posted
- STOP: STOP reply sets fields and excludes lead on next run
- Step 2/3: With Fast Mode ON, both steps fire within one session with expected delays and audit entries
- Clicks (when enabled): Click updates status, logs audit, and redirects correctly
