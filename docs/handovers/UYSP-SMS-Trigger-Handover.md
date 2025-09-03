## UYSP SMS Trigger – Comprehensive Handover (ARCHIVED)

> Archived in favor of the current scheduler-based architecture. See:
> - SSOT: `memory_bank/active_context.md`
> - SOP: `docs/handovers/SMS-SEQUENCER-V1-SOP.md`

- **Project**: H4VRaaZhd8VKQANf
- **Airtable**: Base `app6cU9HecxLpgT0P`, Table `tblYUvhGADerbD8EO` ("Leads")
- **Workflows**:
  - **UYSP-Realtime-Ingestion** (`2cdgp1qr9tXlONVL`) – active
  - **UYSP Backlog Ingestion** (`qMXmmw4NUCh1qu8r`) – manual
  - **UYSP-SMS-Trigger** (`D10qtcjjf2Vmmp5j`) – active
  - **UYSP-Health-Monitor** (`wNvsJojWTr0U2ypz`) – present

### Current design (key nodes)
- **Trigger**: Airtable Trigger
  - Base=`app6cU9HecxLpgT0P`, Table=`Leads`, View=`SMS Pipeline`, Trigger Field=`Last Updated Auto` (Airtable last-modified)
- **Airtable Get Record**: fetches the triggered record by id
- **SimpleTexting HTTP (v2)**: POST `https://api-app2.simpletexting.com/v2/api/messages`
  - Body: `accountPhone=9094988474`, `contactPhone={{ digits-only, strip leading 1 }}`, `mode=AUTO`
  - Text: uses Name + Company Domain (renders properly)
- **Parse SMS Response (Code)**: per-item; outputs `{ sms_status, campaign_id, estimated_cost, error_reason? }`
- **Airtable Update (per item)**: writes back to the same record
  - Fields: `SMS Status`, `SMS Campaign ID`, `SMS Cost`, `Last SMS Sent`, `SMS Sent Count`, `Processing Status=Complete`, `SMS Eligible=false`, `Error Log`
- **Slack**: channel `C097CHUHNTG`, renders real name/email/phone digits + domain + status/campaign

### Problem statement
- Intermittent misalignment and/or missing writebacks when multiple items are processed: only one of several queued leads may update; others remain in the "SMS Pipeline" view.
- Airtable node parameters have been wiped sporadically after edits (credentials/base/table/id), causing silent failures.

### Confirmed root causes to date
- **Autosave race (last-writer-wins) in n8n UI**
  - Keeping the editor tab open during API or other edits can autosave transient blank parameters (e.g., when Operations toggle), wiping Airtable/HTTP nodes.
- **Record id mis-propagation when a node ran for all items**
  - Earlier, the parse/update path used an id not guaranteed to be the active item’s id, which could update the wrong record or skip updates for other items.

### What changed this session (edits applied)
- Added `Error Log` to `Airtable Update` mapping to persist failure reasons.
- Rewired Slack to run after Parse so it sees `sms_status/campaign_id/error_reason`.
- Restored and locked the `Airtable Update` node atomically after wipes (auth `airtableTokenApi`, base `app6cU9HecxLpgT0P`, table `tblYUvhGADerbD8EO`).
- Switched `Airtable Update` record id to a per-item safe source:
  - Preferred: `$item(0).$node["Airtable Get Record"].json.id` (guaranteed alignment with the fetched item)
  - Parse now emits only status/campaign/cost; it does not set id
- Restored Slack text to render Name/Email/Domain/Phone plus status/campaign.
- Seeded 3 fresh test leads with `SMS Eligible=true`, `SMS Status='Not Sent'`, `Processing Status='Queued'` for controlled testing.

### Current state (mixed observations to reconcile)
- Evidence from runs: at least one lead in the batch updated correctly (SMS sent, Slack rendered, Airtable writeback). Others did not update as expected in Airtable in subsequent polls, per live review.
- Therefore, treat the issue as unresolved until all queued items reliably update in the same polling cycle across multiple runs.

### Likely contributing factors (hypotheses to test)
- **UI autosave wipe still occurring**: any subsequent edit without disabling the trigger and closing the UI can blank params.
- **Per-item context mismatch**: any `$json` or `$item()` reference not anchored to the same item as `Airtable Get Record` can bleed ids across items.
- **View gating / timing**: Airtable trigger polls on a schedule; items may enter/exit the view between polls, leading to partial batches per execution.
- **Phone formatting edge cases**: invalid 10-digit formatting after strip can cause SimpleTexting API rejects without obvious user-visible errors unless parsed and logged.
- **Rate limiting / transient HTTP errors**: updates or sends could fail intermittently; Parse must emit `Failed` with `error_reason`, and Update must always write `Error Log`.

### Minimal, reliable architecture (no workflow bloat)
- Keep the gate in Airtable: View `SMS Pipeline` allows only `SMS Eligible=true` and `SMS Status='Not Sent'`.
- Per-item safety: update record id using `Airtable Get Record`’s id for the same item.
- Parse per item; emit only outcome fields; do not carry id through code.
- Writeback flips `Processing Status=Complete` and `SMS Eligible=false` to exit the view and prevent double-sends.

### Strict operating protocol (must follow every time)
1) Freeze/backup before any change
   - Close/reload n8n editor tabs for the target workflow to avoid UI autosave races.
   - Export workflow JSON via API (store under `workflows/backups/` with timestamp).
2) Apply edits atomically
   - Prefer API-based partial updates in small chunks.
   - Immediately re-fetch the workflow JSON after each edit and verify all Airtable/HTTP/Slack nodes:
     - Credentials present (Airtable token, HTTP headers/OAuth, Slack OAuth)
     - Airtable Base/Table/Record id bindings intact
     - Column mappings present
3) Disable trigger during risky edits
   - Temporarily disable the Airtable Trigger node while editing update/HTTP/parse nodes.
   - Re-enable only after verification step passes.
4) Controlled test cycle
   - Seed or pick 3 test leads known to match the view filter.
   - Bump a harmless field (e.g., `Company`) to update last-modified.
   - Wait for the next poll; fetch the newest execution(s) with full data and verify per item:
     - Trigger id == Airtable Update id
     - SimpleTexting response 200/201 with id present or `Failed` with `error_reason`
     - Slack shows Name/Email/Domain/Phone and status/campaign
     - Airtable fields updated and record exits the view
5) Anti-wipe enforcement
   - If any Airtable/HTTP node appears blank at verification, immediately restore parameters atomically and re-verify before proceeding.
6) Evidence capture
   - Save execution ids and before/after Airtable snapshots for each test.

### Concrete checks (node-by-node)
- Airtable Trigger: Base/Table/View/Trigger Field set; credential attached.
- Airtable Get Record: uses id from trigger item; credential attached.
- SimpleTexting HTTP: endpoint, headers/credential present; body constructs `contactPhone` as digits-only without leading `1`.
- Parse (Code): per-item execution; sets `sms_status` to `Sent` or `Failed`; includes `campaign_id` on success and `error_reason` on failure.
- Airtable Update: record id from `Airtable Get Record` for the same item; columns include `Processing Status`, `SMS Eligible=false`, `SMS Status`, `SMS Campaign ID`, `SMS Cost`, `Last SMS Sent`, `SMS Sent Count` (increment), `Error Log`; `typecast=true`.
- Slack: text references `Airtable Get Record` fields and includes `sms_status/campaign_id/error_reason`.

### Immediate next steps (to resolve the remaining discrepancy)
1) Execute a clean 3-lead test run following the protocol above (disable → verify → enable → run).
2) After the run, compare per-item ids across Trigger → Get Record → Update to confirm strict alignment.
3) If any item fails to update:
   - Inspect Parse output for that item (status, error_reason).
   - Verify Airtable Update id mapping is present at execution time and not blank/wiped.
   - Check SimpleTexting HTTP status/body; re-run with the same item if needed.
4) If alignment is correct but items remain in the view, re-check view filters and writeback fields set by Update.

### Rollback/Recovery
- If a wipe occurs or mapping disappears:
  - Restore the last good JSON from `workflows/backups/` via API.
  - Re-run verification and controlled tests before re-enabling the trigger.

### Appendix A – Slack text template (reference)
```
SMS: {{$node["Airtable Get Record"].json.fields['First Name'] || ''}} {{$node["Airtable Get Record"].json.fields['Last Name'] || ''}} | {{$node["Airtable Get Record"].json.fields.Email || ''}} | {{$node["Airtable Get Record"].json.fields['Company Domain'] || ''}}
Send digits: {{String($node["Airtable Get Record"].json.fields.Phone || '').replace(/\D/g,'').replace(/^1/,'')}} (orig: {{$node["Airtable Get Record"].json.fields.Phone || ''}})
Status: {{$json.sms_status || 'n/a'}}  Campaign: {{$json.campaign_id || 'n/a'}}{{ $json.error_reason ? "\nError: " + $json.error_reason : ''}}
```

### Appendix B – Airtable Update fields (reference)
- `Processing Status = Complete`
- `SMS Eligible = false`
- `SMS Status = {{$json.sms_status}}`
- `SMS Campaign ID = {{$json.campaign_id}}`
- `SMS Cost = {{$json.estimated_cost || 0}}`
- `Last SMS Sent = {{$now}}`
- `SMS Sent Count = {{($item(0).$node["Airtable Get Record"].json.fields['SMS Sent Count'] || 0) + 1}}`
- `Error Log = {{$json.error_reason || ''}}`

### Appendix C – SimpleTexting HTTP (reference)
- Method: POST `https://api-app2.simpletexting.com/v2/api/messages`
- Body core fields:
  - `accountPhone=9094988474`
  - `contactPhone={{digits-only, strip leading 1}}`
  - `mode=AUTO`

---
Owner note: Always re-open and verify HTTP/Airtable nodes after any update to prevent silent wipes. Prefer API-first backups and atomic edits; never rely on the open UI state for accuracy.


