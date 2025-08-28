# Architecture Addendum — SMS Sequencer v1 (Safety + Scheduling)

Date: 2025-08-28
Workflow: UYSP-SMS-Scheduler (D10qtcjjf2Vmmp5j)

## Additions to core design
- Single outbound scheduler with hourly cron (UTC): `0 14-21 * * 1-5` (10–17 ET).
- A/B selection and templating inside a single Code node; Delay Days driven by `SMS_Templates` or defaults (0/3/7).
- Test Mode override: Settings.Test Mode + Test Phone short-circuits all sends to the specified number; Slack prefixes `[TEST MODE]`.
- Server-side Airtable search to list due leads (eligible, not stopped/booked, phone valid, step due by days), with per-run cap (tunable).
- Safe writeback pattern: single-record update by ID; only writable fields.

## Node map (final)
- Manual Trigger → List Due Leads (Airtable Search) → Get Settings (Airtable Search) → List Templates (Airtable Search) → Prepare Text (A/B) [due-gate + variant + personalization] → SimpleTexting HTTP → Parse SMS Response → [Airtable Update, Slack Notify]

## Key decisions & rationale
- One workflow: simplest monitoring and change control.
- UTC cron due to node version without timezone selector; avoids hidden offsets.
- Credentials safety: no bulk parameter replacements on credentialed nodes; UI rebind only when needed.
- Test Mode centralization: Airtable Settings (single row) so behavior applies to every lead without mutating lead data.

## Future hooks (separate workflows)
- Inbound STOP webhook → set `SMS Stop` + reason.
- Calendly webhook → set `Booked` + `Booked At`; halts sequence.
- Optional click proxy with HMAC redirect (deferred).

## Risks & mitigations
- Provider daily send limits (observed): Slack shows failure reason; Airtable logs Error.
- International numbers: currently guarded to US 10-digit; extend with E.164 formatting by country if needed.
- Cron DST shift: adjust the UTC window seasonally or upgrade node to support timezone.

## References
- SOP: `docs/handovers/SMS-SEQUENCER-V1-SOP.md`
- Backups: `workflows/backups/…` snapshots
