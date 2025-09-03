# UYSP — SimpleTexting Delivery (ST Delivery V2) — Operational SOP

### Purpose
- Capture SimpleTexting delivery webhooks and update Airtable lead + audit table.
- Notify Slack on delivery failures only (signal over noise).
- Respond 200 to webhook caller.

### Workflow
- **Name**: `UYSP-ST-Delivery V2`
- **Trigger**: Webhook (POST) — Path: `/webhook/simpletexting-delivery`
- **Core nodes (fan-out order)**:
  1. `Parse Delivery` (Code)
  2. `Find Lead (by Campaign/Phone)` (Airtable → Record → Search)
  3. `Update Lead Delivery` (Airtable → Record → Update)
  4. `Write Audit Row` (Airtable → Record → Create)
  5. `If Undelivered` (If/EF)
  6. `Delivery Notify` (Slack)
  7. `Respond 200` (Code)

### Node details
- **Parse Delivery (Code)**
  - Mode: runOnceForEachItem
  - Extracts: `campaign_id`, `phone_digits` (10 digits; strips non-digits and leading 1), `carrier`, `delivery_status` (Delivered/Undelivered)
  - Downstream fields: `campaign_id`, `phone_digits`, `carrier`, `delivery_status`

- **Find Lead (by Campaign/Phone) (Airtable)**
  - Resource: Record, Operation: Search
  - Base: `app6cU9HecxLpgT0P`
  - Table: `tblYUvhGADerbD8EO`
  - filterByFormula:
    - `OR({SMS Campaign ID}='{{$json.campaign_id}}', {Phone}='{{$json.phone_digits}}', {Phone}='+1{{$json.phone_digits}}')`

- **Update Lead Delivery (Airtable)**
  - Operation: Update by matching `id`
  - Columns (Define below):
    - `id` = `{{$json.id}}`
    - `SMS Status` = `{{$json.delivery_status}}`
    - `Error Log` = `={{$json.carrier ? 'Carrier: ' + $json.carrier : ''}}`
  - Options: typecast = true

- **Write Audit Row (Airtable)**
  - Resource: Record, Operation: Create
  - Base: `app6cU9HecxLpgT0P`
  - Table: `tbl5TOGNGdWXTjhzP`
  - Columns (Define below):
    - `Event` = "Delivery"
    - `Campaign ID` = `={{ $('Parse Delivery').item.json.campaign_id || '' }}`
    - `Phone` = `={{ $('Parse Delivery').item.json.phone_digits || '' }}`
    - `Status` = `={{ $('Parse Delivery').item.json.delivery_status || 'unknown' }}`
    - `Carrier` = `={{ $('Parse Delivery').item.json.carrier || '' }}`
    - `Lead Record ID` = `={{ $('Find Lead (by Campaign/Phone)').item.json.id || '' }}`
    - `Delivery At` = `={{ $now }}`
    - `Webhook Raw` = `={{ JSON.stringify($('Parse Delivery').item.json) }}`
  - Options: typecast = true
  - Notes:
    - Primary fields (Campaign ID, Phone, Status, Carrier, Webhook Raw) reference `Parse Delivery` to avoid nulls when Find Lead returns no rows.
    - `Lead Record ID` is the only field that depends on `Find Lead` and safely defaults to empty string.
    - Use `Delivery At` (timestamp) for downstream reporting (e.g., Daily Monitoring “Delivered Today”).

- **If Undelivered (If/EF)**
  - Purpose: gate Slack noise — only post when not Delivered
  - Conditions:
    - Type: String
    - Value 1: Expression → `{{$json.delivery_status}}`
    - Operation: not equal
    - Value 2: Text → `Delivered`
    - Case sensitive: Off

- **Delivery Notify (Slack)**
  - Authentication: OAuth2
  - Select: Channel
  - Channel ID (ops alerts): `C09DAEWGUSY` (`#uysp-ops-alerts`)
  - Text:
    - `={{ `[DELIVERY] ${$json.phone_digits||''} → ${$json.delivery_status||'unknown'}  Carrier: ${$json.carrier||''}  Campaign: ${$json.campaign_id||''}` }}`

- **Respond 200 (Code)**
  - Mode: runOnceForEachItem
  - Code: `return $input.item;`

### Wiring
- `Webhook (ST Delivery)` → `Parse Delivery`.
- `Parse Delivery` → (fan-out) → `Find Lead (by Campaign/Phone)` AND `Write Audit Row` AND `If Undelivered`.
- `If Undelivered` (True) → `Delivery Notify`.
- `If Undelivered` (False) → leave unconnected (no Slack).
- `Find Lead (by Campaign/Phone)` → `Update Lead Delivery` → `Respond 200`.
- `Write Audit Row` remains parallel; no connection to Respond needed.

### Slack Channels
- **Debug (temporary)**: `C08R958LZQT` (`#UYSP De-bug`) — avoid for production.
- **Ops Alerts**: `C09DAEWGUSY` (`#uysp-ops-alerts`) — failures only (from `If Undelivered: True`).
- **Sales Daily**: `C09D6U5BLG6` (`#uysp-sales-daily`) — from Daily Monitoring workflow, not this one.

### Testing
- Delivered case:
```bash
curl -X POST https://rebelhq.app.n8n.cloud/webhook/simpletexting-delivery \
  -H 'Content-Type: application/json' \
  -d '{"values":{"messageId":"test123","contactPhone":"+1(305) 555-1212","status":"Delivered","carrier":"Verizon"}}'
```
Expect: Airtable Lead `SMS Status=Delivered`; Audit row created; NO Slack post; HTTP 200 returned.

- Undelivered case:
```bash
curl -X POST https://rebelhq.app.n8n.cloud/webhook/simpletexting-delivery \
  -H 'Content-Type: application/json' \
  -d '{"values":{"messageId":"test124","contactPhone":"3055551213","status":"Failed","carrier":"AT&T"}}'
```
Expect: Lead `SMS Status=Undelivered`; Audit row; ONE Slack in `#uysp-ops-alerts`; HTTP 200.

### Done‑when checklist
- Delivered events do not post to Slack; undelivered do, to `#uysp-ops-alerts`.
- Airtable Lead updates and Audit rows present for both cases.
- Webhook always responds 200.
- Slack daily summaries are handled in the separate Daily Monitoring workflow (channel `#uysp-sales-daily`).

### Operations
- If Slack noise increases: verify `If Undelivered` condition and ensure `Delivery Notify` is only on True.
- If Slack posts are missing for failures: check `If Undelivered` condition and channel ID `C09DAEWGUSY`.
- If Airtable updates fail: confirm Airtable credentials and table IDs, and that `Find Lead` returns an `id`.

### Safety (no business logic change)
- Never modify credentials via bulk/API edits; reselect in UI if detached [[memory:7567708]].
- Do not replace entire `parameters` on Slack/Airtable nodes; only adjust specific fields (e.g., text, channelId) [[memory:7567708]].
- Keep webhook method=POST and path unchanged.
