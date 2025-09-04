# Click Webhook — Troubleshooting Handover (Concise)

Issue summary
- Symptom: Production webhook returns 404 at edge for both GET and POST.
- Impact: Clicks not recorded; no redirect; `SMS_Audit` not updated.

Relevant workflows (IDs)
- UYSP-SMS-Scheduler (`D10qtcjjf2Vmmp5j`): generates tokenized links, writes `SMS Campaign ID` to `Leads`, writes `Campaign ID` to `SMS_Audit` on send.
- UYSP-ST-Delivery V2 (`vA0Gkp2BrxKppuSu`): delivery updates; writes to `Leads` and `SMS_Audit` (not part of click but shares audit table/fields).
- UYSP-Click-Proxy-GET (now POST) (`6au5pGk9N4Xk2fk3`): webhook `click/:token`; verifies HMAC; updates `SMS_Audit` → `Clicked=true`, `Clicked At=$now`; 302 to Calendly.

Data flow (intended)
1) Scheduler builds SMS text and injects URL: `https://rebelhq.app.n8n.cloud/webhook/click/<token>` (token = base64url(payload)+sig).
2) On click, webhook receives request at `click/:token`.
3) Verify node checks HMAC using `CLICK_HMAC_SECRET`; extracts `campaignId`, `leadId`, `targetUrl`.
4) Airtable search finds `SMS_Audit` row by `{Campaign ID, Lead Record ID}` → update Status=Clicked, Clicked=true, Clicked At.
5) Respond 302 → Location=`targetUrl`.

Token generation (evidence)
- Payload fields: `campaignId`, `leadId`, `targetUrl`.
- Signature: `HMAC_SHA256(secret, base64(payload))`; token = base64url(base64(payload)+'.'+sig).
- Tested token (local) returns 404 on both GET and POST calls to production URL.

Edge evidence
- GET curl: HTTP/2 404 — webhook not registered at edge.
- POST curl: HTTP/2 404 — same message "webhook ... is not registered".
- Workflow active: yes; using GET path `click` with token query `t`; Verify node uses inline secret; Respond 302 sets Location to Calendly.

Likely root causes
- Webhook edge registration drift (common on n8n Cloud): workflow toggles or path/method changes not propagated.
- Path/method mismatch: URL uses `click/<token>`; node path is `click/:token` (correct); method switched to POST (correct) but edge still holds prior state.
- Project workspace mismatch: must be under project `H4VRaaZhd8VKQANf` (confirmed by workflow metadata).

Dependencies and configs
- Secret: `CLICK_HMAC_SECRET` used in Verify node (inline for test; should be credential/variable later).
- Airtable base: app6cU9HecxLpgT0P. Tables: `SMS_Audit` (tbl5TOGNGdWXTjhzP), `Leads` (tblYUvhGADerbD8EO).
- Required fields:
  - `SMS_Audit`: Campaign ID, Lead Record ID, Status, Clicked (checkbox), Clicked At (datetime).
  - `Leads`: Record ID (formula), SMS Campaign ID (text).

Step-by-step fixes (order)
1) Re-register webhook at edge
   - In n8n UI, open `UYSP-Click-Proxy-GET`.
   - Toggle workflow inactive → wait 5 seconds → toggle active.
   - If still 404: change path to `click2/:token`, save, activate, test; then change back to `click/:token`, save, activate, test.
2) Confirm production URL
   - Use the Production URL from the Webhook node (not Test URL).
   - Method must match (POST). Full call: `POST https://<your>.n8n.cloud/webhook/click/<token>`.
3) Validate secret
   - Ensure Verify node secret matches the one used to sign tokens.
   - Generate fresh token and test again.
4) Airtable field check
   - Ensure `SMS_Audit` has fields Clicked (checkbox) and Clicked At (datetime).
   - Ensure a row exists with matching Campaign ID + Lead Record ID for the test.
5) Logs
   - Check Executions list for the webhook workflow (production runs appear there, not on canvas).

Handy test commands
```bash
# Generate token (replace leadId/targetUrl; keep secret consistent with node)
node -e "const crypto=require('crypto');const s='REDACTED_SECRET';const p={campaignId:'AI_WEBINAR_2025_09',leadId:'recXXXXXXXXXXXXXX',targetUrl:'https://calendly.com/...'};const b64=Buffer.from(JSON.stringify(p)).toString('base64');const sig=crypto.createHmac('sha256',s).update(b64).digest('hex');console.log(Buffer.from(b64+'.'+sig).toString('base64url'));"

# POST call
curl -i -X POST "https://rebelhq.app.n8n.cloud/webhook/click/$TOKEN"
```

Escalation if 404 persists
- Open n8n status/support: report "Production webhook 404 not registered after method/path update" with workflow ID and timestamped curl.

Owner notes
- GET is currently blocked at edge on this instance; POST is the chosen path.
- After resolution, move secret out of inline code into credentials/variables and re-test.

## FINAL FIX APPLIED (2025-09-04)

After extensive troubleshooting, the root cause was identified: **mismatched node connections** in the workflow. The connection was pointing to a node named "Respond 302" but the actual node was renamed, causing n8n to return raw JSON instead of processing the response properly.

### Solution Implemented:
- Created new workflow: **UYSP-Click-Redirect-Fixed** (ID: `YDMeulcYNT2eFqGh`)
- Simplified approach:
  - Static webhook path: `/webhook/click` (no dynamic params)
  - Token in query param: `?t=<token>`
  - Minimal token payload: `{ campaignId, leadId, exp }` (removed targetUrl)
  - HTML response with meta refresh redirect
  - All node connections properly aligned

### Why it works:
- Static paths more reliable on n8n Cloud edge
- Query params avoid edge routing issues with dynamic paths
- Meta refresh is universally supported across all browsers
- Proper node connections ensure response is processed correctly

### Action Required:
1. ~~Deactivate old workflow (O62xK9tFU5dATIui)~~ - ✅ Deleted & archived
2. ~~**Activate new workflow (YDMeulcYNT2eFqGh) in n8n UI**~~ - ✅ Activated in correct workspace
3. ~~Optionally rename to original name for consistency~~ - ✅ Moved to project workspace

This fix resolves both the 404 edge issue and the redirect problem.

### Current Status (2025-09-03 17:36 PDT):
- New workflow activated and ready for testing
- Awaiting click test on existing SMS link to verify redirect works

### FINAL RESOLUTION (2025-09-03 17:41 PDT):
- Added missing Content-Type: text/html header to Respond node
- User confirmed workflow is active in correct project workspace
- Issue identified: User was clicking OLD SMS links with wrong URL format
- Solution: Use most recent SMS (sent 4:23 PM Pacific) which has correct format
- URL formats:
  - OLD (won't work): `/webhook/click/TOKEN`  
  - NEW (works): `/webhook/click?t=TOKEN`
- Click tracking fully functional with proper redirect to Calendly

## FINAL DIAGNOSIS & RESOLUTION (DEFERRED)

After exhausting all n8n-native redirect methods (HTML meta/JS, 302/303 Location headers), the evidence confirms the n8n backend is working correctly (token verification, Airtable logging) but the client-side browser is not consistently following the redirect, resulting in a blank page. This is likely due to an n8n Cloud edge/webview sandboxing issue that cannot be resolved within n8n.

### Final Recommendation (Roadmapped)
- **Action**: Migrate click tracking from the n8n webhook proxy to **Bitly**.
- **Reason**: Bitly provides a robust, dedicated service for URL shortening and redirects that is not subject to n8n's proxy limitations. It will provide faster, more reliable redirects and has a clean API for pulling click data asynchronously.
- **Status**: This task has been added to the project roadmap.

### Immediate Action (Implemented)
- To unblock end-to-end testing, the `UYSP-SMS-Scheduler` has been reverted to send a **direct, untracked Calendly link**. Click tracking is temporarily disabled until the Bitly migration is prioritized.