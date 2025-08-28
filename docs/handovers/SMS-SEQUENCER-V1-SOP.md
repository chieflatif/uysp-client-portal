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
