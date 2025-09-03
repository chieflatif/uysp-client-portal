# Technical Development Plan — SimpleTexting Campaign Isolation & Clicks

[AUTHORITATIVE]

## Objectives
- Enforce logical isolation via `campaign_id` for all sends
- Preserve existing scheduler-based sending (no ST campaign automation)
- Re-enable click tracking via our GET proxy webhook (assume platform fix or alternate path)
- Ensure Airtable fields/views fully support reporting filtered to `campaign_id`

## Evidence Baseline (current state)
- Workflows (verified):
  - `UYSP-SMS-Scheduler` (ID `D10qtcjjf2Vmmp5j`)
  - `UYSP-ST-Delivery V2` (ID `vA0Gkp2BrxKppuSu`)
  - `UYSP-SMS-Inbound-STOP` (ID `pQhwZYwBXbcARUzp`)
  - `UYSP-Calendly-Booked` (ID `LiVE3BlxsFkHhG83`)
- Paths: `/webhook/simpletexting-delivery`, `/webhook/simpletexting-inbound`, `/webhook/calendly`
- Airtable: `Leads`, `SMS_Templates`, `Settings`, `SMS_Audit` tables in use per handover
- Click tracking v1: HMAC token creation working; GET webhook registration blocked at n8n Cloud edge (404)

## Task Breakdown (chunks ≤5 steps)

### Chunk 1: Campaign ID enforcement
1. Define constant `campaign_id` for this initiative (e.g., `AI_WEBINAR_2025_09`) in `Settings` table or scheduler node settings.
2. Update scheduler personalization step to attach `campaign_id`, `step`, `variant` to context going into the send node.
3. Ensure `SMS_Audit` create writes include: `campaign_id`, `smsid`, `step`, `variant`, `Sent At`, `Cost`.
4. Verify Delivery webhook matches rows by `smsid` and updates only records that carry our `campaign_id`.
5. Test with 2 records; capture execution IDs and resulting `SMS_Audit` rows.

Acceptance: Two sends show `campaign_id` populated; Delivery updates only those rows.

### Chunk 2: Airtable schema/view verification
1. Confirm `SMS_Audit` has fields for `campaign_id`, `smsid`, `Clicked`, `Clicked At`, `SMS Status`, `Cost`.
2. If `campaign_id` missing: add field (single line text) in `SMS_Audit`.
3. Create Airtable views:
   - `Audit — AI_WEBINAR_2025_09` filter `campaign_id = AI_WEBINAR_2025_09`
   - `Leads — AI_WEBINAR_2025_09` if needed for joinable reporting
4. Update any dashboards/queries to read from these views or apply equivalent filters.
5. Evidence: screenshots or CSV export showing only our campaign rows.

Acceptance: Views present and correct; sample export shows isolation.

### Chunk 3: Click tracking webhook (ideal path)
1. Recreate GET webhook in n8n: Path `/webhook/click/:token` within a new or existing workflow.
2. Node logic:
   - Validate method=GET; extract `token` and optional `p` params
   - Verify HMAC with shared secret (stored in credentials/settings)
   - Look up `SMS_Audit` row by decoded token payload (lead/campaign/smsid)
   - Set `Clicked=true`, `Clicked At=now`
   - Respond 302 Location to Calendly URL
3. Activate workflow; test with curl GET; expect 302.
4. Evidence: execution ID; Airtable row updated; curl headers with 302 Location.

Acceptance: GET endpoint returns 302; Audit row updated.

### Chunk 4: Click tracking fallback (if GET still blocked)
1. Provision alternate redirect endpoint:
   - Option A: Cloudflare Worker on client domain (preferred); or
   - Option B: Temporary POST bridge in existing STOP workflow with short-lived signed URL
2. Replicate steps: verify token → update `SMS_Audit` → 302 redirect.
3. Update scheduler to generate links to the alternate domain/path.
4. Evidence: Worker logs + Airtable update + real device test.

Acceptance: Live tested redirect and audit update outside n8n GET constraint.

### Chunk 5: Optional ST UI visibility
1. On send (or pre‑send), add/update ST contact with first/last name into List `AI Webinar – Automation (System)`; Tag `uysp-automation`.
2. Confirm in ST UI that contacts for this initiative appear under the List/Tag.
3. Ensure this does not affect our logic (UI visibility only).
4. Evidence: ST screenshots filtered by Tag/List.

Acceptance: Contacts visible under dedicated List/Tag.

### Chunk 6: Monitoring & kill‑switch validation
1. Confirm batch cap still enforced (e.g., 200/run).
2. Add/verify Slack alerts post‑run with counts for sent/delivered/errors (and clicks if available).
3. Document and test kill switch: disable scheduler or add gate `campaign_id_enabled=false`.
4. Evidence: Slack post, toggle test run, and halted sends when disabled.

Acceptance: Kill switch halts sends; Slack summaries visible.

## Testing Plan
- Send two test leads (Variant A/B) with campaign_id set; verify send→delivery→click→reporting chain.
- Collect execution IDs for: scheduler send, delivery webhook, click webhook.
- Confirm Airtable rows updated with correct fields and timestamps.

## Rollback Plan
- Toggle `campaign_id_enabled=false` in scheduler or disable the cron.
- Revert URL generation to clean Calendly link if redirect misbehaves.
- Remove/disable fallback worker if no longer needed.

## Evidence Logging
- Record execution IDs, Airtable record IDs, and any external logs in `memory_bank/evidence_log.md` under dated entries.

Confidence: 90%
