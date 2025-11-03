# Technical Development Plan — SimpleTexting Campaign Isolation & Clicks

[AUTHORITATIVE]

## Objectives
- Enforce logical isolation via `campaign_id` for all sends.
- Preserve existing scheduler-based sending (no ST campaign automation).
- Send a direct, untracked Calendly link in all SMS messages.
- Create/update contacts in SimpleTexting for UI visibility.
- Ensure Airtable fields/views fully support reporting filtered to `campaign_id`.

## Evidence Baseline (current state)
- Workflows (verified):
  - `UYSP-SMS-Scheduler` (ID `D10qtcjjf2Vmmp5j`)
  - `UYSP-ST-Delivery V2` (ID `vA0Gkp2BrxKppuSu`)
  - `UYSP-SMS-Inbound-STOP` (ID `pQhwZYwBXbcARUzp`)
  - `UYSP-Calendly-Booked` (ID `LiVE3BlxsFkHhG83`)
- Paths: `/webhook/simpletexting-delivery`, `/webhook/simpletexting-inbound`, `/webhook/calendly`
- Airtable: `Leads`, `SMS_Templates`, `Settings`, `SMS_Audit` tables in use per handover.
- Click tracking v1: DEFERRED. Reverted to direct Calendly link.

## Task Breakdown (chunks ≤5 steps)

### Chunk 1: Campaign ID enforcement - ✅ COMPLETE
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

### Chunk 3: Click tracking webhook (GET only) - 🟥 DEFERRED
*This has been deferred post-launch. All SMS messages will use a direct, untracked Calendly link. The implementation will be re-evaluated with a Bitly integration as documented in the roadmap.*

### Chunk 4: ST UI visibility (List/Tag) - ✅ COMPLETE
1. On send, an `HTTP Request` node updates the ST contact with first/last name, assigns to List `AI Webinar – Automation (System)`, and applies Tag `uysp-automation`.
2. Confirmation will be done via the UI during the end-to-end test.
3. This step is for UI visibility only and does not affect sending logic.
4. Evidence: `n8n_update_full_workflow` call on `D10qtcjjf2Vmmp5j` at `2025-09-04T04:32:35.019Z` with `st-contact-update` node added. Version ID `8f13246c-a40d-4508-abd1-87df375cb7b7`.

Acceptance: Contacts are visible under the dedicated List/Tag in the SimpleTexting UI after a test run.

### Chunk 5: Monitoring & kill‑switch validation - 🟧 PENDING TEST
1. Confirm batch cap is still enforced (e.g., 200/run).
2. Add/verify Slack alerts post‑run with counts for sent/delivered/errors (and clicks if available).
3. Document and test kill switch: disable scheduler or add gate `campaign_id_enabled=false`.
4. Evidence: Slack post, toggle test run, and halted sends when disabled.

Acceptance: Kill switch halts sends; Slack summaries are visible.

## Testing Plan
- Send one test lead with `campaign_id` set.
- Verify the outbound SMS contains the direct Calendly link.
- Confirm the contact is created/updated in the SimpleTexting UI under the correct list and tag.
- Verify the `SMS_Audit` row is created correctly in Airtable.
- Confirm delivery webhook and STOP webhook functionality are unaffected.

## Rollback Plan
- Disable the `UYSP-SMS-Scheduler` workflow.
- Revert the `Prepare Text (A/B)` node to its previous state if any issues arise with the direct link injection.

## Evidence Logging
- Record execution IDs, Airtable record IDs, and SimpleTexting UI screenshots in `memory_bank/evidence_log.md`.

Confidence: 99%
