SimpleTexting + n8n + Airtable gotchas (current system)

- Airtable Update (n8n): prefer single-record path with explicit Record ID; only writable fields. Avoid computed fields (Airtable 422).
- Airtable v2 on n8n Cloud: list via Resource=Record + Operation=Search (Return all ON or limit), not `list/getAll`. Use `filterByFormula` for due logic. [[memory:7536884]]
- Credentials/URL loss: Bulk/API param replacement on credentialed nodes (HTTP/Airtable/Slack) can clear creds/URL. Only change specific keys; reselect creds in UI if needed.
- UI safety: Do not toggle Airtable node Resource/Operation via API on existing nodes; it can detach credentials.
- Cron timezone: If node lacks timezone selector, use UTC cron; for 10–17 ET (DST -4) use `0 14-21 * * 1-5`. Review at DST switch.
- Expression context: `$json` is current item; if referencing earlier nodes use `$node['Name'].json…`. Avoid hardcoded `$item(0)` in per-item paths.
- SimpleTexting API: v2 JSON payloads `contactPhone`, `accountPhone`, `mode`, `text`; enable neverError to log failures without halting.
- Webhooks: Set delivery/unsubscribe + Calendly handlers; confirm schemas and retries.
- STOP parsing: SimpleTexting inbound may send various key names (`text`, `message`, `Message`, `from`, `phone`, `Phone`); normalize and uppercase for matching; strip non-digits on phone and drop leading 1.
- Airtable formula gotcha: Use Expression mode; avoid stray leading `=` and multiline `IF`; prefer one OR expression.


