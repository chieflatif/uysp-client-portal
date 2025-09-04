# Click Tracking Webhook — Detailed Specification

[AUTHORITATIVE]

## Purpose
Enable reliable per-message click attribution for our SMS campaign, independent of SimpleTexting UI campaigns, using our own signed redirect.

## Evidence Sources
- `memory_bank/active_context.md` (Workflow SSOT; launch decisions)
- `context/CURRENT-SESSION/SMS-SEQUENCER-V1-COMPREHENSIVE-HANDOVER.md` (spec + blocker)
- Evidence log (404 at edge for GET webhooks) in `memory_bank/evidence_log.md`

## Component Overview
- Generator (in Scheduler): builds a signed URL placed in the SMS body
- Receiver (webhook): verifies signature, updates Airtable, redirects (302)
- Storage: `SMS_Audit` row keyed by `smsid` + `campaign_id`; also updates `Leads`

## URL Design
- SMS link format:
  - `https://rebelhq.app.n8n.cloud/webhook/click/<token>`
- Redirect target (on success): client Calendly link (see active_context SSOT)

## Token Format (HMAC)
- Contents (JSON before signing):
  - `campaign_id` (string): e.g., `AI_WEBINAR_2025_09`
  - `smsid` (string): ST response id for the 1:1 send
  - `lead_id` (string): Airtable record id from `Leads` (for fast lookup)
  - `variant` (string): `A` or `B`
  - `step` (number): 1,2,3
  - `exp` (number): UNIX epoch seconds (e.g., now + 90 days)
- Encoding: base64url(JSON) → `payload`
- Signature: `HMAC_SHA256(secret, payload)` → base64url → `sig`
- Token string: `payload.sig`

## Generator (Scheduler) — Pseudocode
- Input: lead record, campaign_id, variant, step
- Build payload (above) and sign with secret from credentials
- URL = `CLICK_BASE + '/' + token`
- Insert URL into message template
- Persist `campaign_id`, `smsid` (after send), `variant`, `step` to `SMS_Audit`

## Receiver (Webhook) — Expected Behavior
- Method: GET (intended; blocked previously by n8n edge 404)
- Path: `/webhook/click/:token`
- Steps:
  1. Parse `:token` into `payload` and `sig`
  2. Recompute `HMAC_SHA256(secret, payload)` and compare with `sig` (constant-time)
  3. Decode payload → extract `campaign_id`, `smsid` or `lead_id`, `variant`, `step`, `exp`
  4. Validate `exp` ≥ now; else 410 Gone
  5. Lookup audit row (preferred key order):
     - By `smsid` in `SMS_Audit`
     - Else by `lead_id` + `campaign_id`
  6. Update `SMS_Audit`: `Clicked=true`, `Clicked At=now`
  7. (Optional) Update `Leads`: `sms_clicked=true`, `sms_click_time=now`
  8. 302 Redirect to Calendly URL
- Error handling:
  - Invalid signature/format → 400
  - Expired token → 410
  - Not found → 204 (no leak), or 302 to clean Calendly (configurable)

## Known Issue & Evidence
- Issue: New GET webhooks fail to register at n8n Cloud edge, returning 404, despite being Active in UI
- Evidence: `curl -I https://rebelhq.app.n8n.cloud/webhook/simpletexting-inbound?token=INVALID` → HTTP/2 404 (see `memory_bank/evidence_log.md` 2025‑09‑02 entry)
- Impact: Prevents GET receiver activation; existing POST webhooks unaffected

## Fallback Plan
Not in scope for this launch. We will implement only the GET webhook receiver.

## Configuration Summary
- CLICK_BASE (env/setting): `https://rebelhq.app.n8n.cloud/webhook/click`
- SECRET (credentials): `CLICK_HMAC_SECRET`
- CALENDLY_URL: from `memory_bank/active_context.md`
- Airtable:
  - Table `SMS_Audit`: fields `campaign_id` (text), `smsid` (text), `Clicked` (checkbox), `Clicked At` (datetime), `variant` (text), `step` (number)
  - Table `Leads`: optional `sms_clicked` (checkbox), `sms_click_time` (datetime)

## Interdependencies
- Scheduler: must output valid token and capture `smsid` into audit row
- Delivery webhook: uses `smsid` to update status; must not overwrite click fields
- STOP webhook: independent; no effect on click except sequence halts
- Reports: filter `SMS_Audit` by `campaign_id`

## Test Plan
- Unit: token sign/verify success and tamper cases
- E2E: send test SMS → open link → verify 302 + Airtable updates
- Header test: `curl -I <click_url>` shows 302 Location (ideal) or 404 (blocked)

## Rollback
- Swap link generation to clean Calendly URL in templates
- Disable click update node; retain audit without click metrics

Confidence: 90%
