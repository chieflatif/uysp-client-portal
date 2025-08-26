SimpleTexting + n8n + Airtable gotchas (current system)

- Airtable Update (n8n): "Columns to match on" with id can behave unexpectedly; prefer direct id field where possible. If using matching, ensure id appears only as a matcher and not accidentally updated.
- Expression context: In mapping, `$json` refers to current item; fields from prior nodes require `$node["Name"].json[...]` and per-item references should not hardcode `$item(0)`.
- UI autosave: Occasionally wipes node params; export backups and re-open after save if behavior is odd.
- SimpleTexting API: v2 JSON payloads work with `contactPhone`, `accountPhone`, `mode`, `text`. For older docs, POSTs may mention `application/x-www-form-urlencoded`. Keep current working JSON unless API indicates otherwise.
- Webhooks: Delivery/unsubscribe/forwarding webhooks exist; confirm event schema, retry policy, and timeouts. Capture delivery callbacks for post-send status if needed.


