# Evidence Log - UYSP Lead Qualification System

## 2025-08-28 — SMS Sequencer v1 Test Mode Cutover
- Workflow: UYSP-SMS-Scheduler (ID: D10qtcjjf2Vmmp5j)
- Execution: 2838 (Manual)
- Result: Slack showed `[TEST MODE]`; SimpleTexting returned provider limits and invalid contacts as expected; Airtable Update succeeded for items with valid phones.
- Snapshot: workflows/backups/UYSP-SMS-Scheduler-D10qtcjjf2Vmmp5j-2025-08-28T21-18-10Z.json
- SOP: docs/handovers/SMS-SEQUENCER-V1-SOP.md
- Addendum: docs/architecture/SMS-SEQUENCER-ADDENDUM.md


## Backup Completion Evidence - 2025-08-07

**Backup Task Completion:**
- **Workflow Backup**: Successfully backed up 'UYSP PHASE 2B - COMPLETE CLEAN REBUILD' (ID: Q2ReTnOliUTuuVpl) and 'UYSP WORKING PRE COMPLIANCE - TESTING ACTIVE' (ID: wpg9K9s8wlfofv1u).
- **Airtable Schema Export**: Exported schema for base 'appuBf0fTe8tp8ZaF' with 11 tables and 157 fields.
- **Git Commit**: Commit created with message 'backup: Full system backup and documentation update 20250807_172212'.
- **Files Committed**: 12 files changed (9 added, 3 modified), including workflow backups and schema export.

**Connection Issue Reported:**
- User reported 'connection failed' on 2025-08-07. Further details pending user input.

**Timestamp**: 2025-08-07T17:22:12Z

## 2025-08-29 — Delivery Webhook v2 Verified
- Workflow: UYSP-ST-Delivery V2 (ID: vA0Gkp2BrxKppuSu)
- Executions: 2960, 2959
- Airtable Leads updated:
  - recjRGAiCez377jWm (Phone +18319990500) → SMS Status = Delivered; Carrier = Verizon Wireless; Campaign = 68b12d990f1df339266e50ea
  - recax23rhooohXVv3 (Phone +14085992416) already Delivered; verified no regression
- Slack: Delivery messages posted to channel C097CHUHNTG for both tests
- Audit rows: `recki1fqwX1Ru3exp`, `rec4Ln2jfzYOWMBFm`, `rec5VeCaQ7RIjecEP` created in `SMS_Audit`

## 2025-08-29 — Core SMS System Integration Verification
- **STOP Webhook Complete** (pQhwZYwBXbcARUzp): 
  - Executions 2961/2962 - processed "STOP" replies correctly
  - Updated SMS Stop=true, SMS Stop Reason=STOP, Processing Status=Stopped
  - Phone parsing and lead matching working
- **Calendly Webhook Complete** (LiVE3BlxsFkHhG83):
  - Execution 2965 - test booking processed successfully  
  - Updated Booked=true, Booked At=timestamp, SMS Stop=true, SMS Stop Reason=BOOKED, Processing Status=Completed
  - Fixed parser and field mappings
- **Fast Mode Step Sequencing Proven** (D10qtcjjf2Vmmp5j):
  - Execution 2940 - Step 1 sent to 2 leads (Ryan Lenzen, Chris Rodriguez)
  - Campaign IDs: 68b12d990f1df339266e50ea, 68b12d991112451ec5048296
  - Fast Delay Minutes set to 3 min on Step 2/3 templates
  - Audit logging working: SMS_Audit records rec2x1O6CaS7AIqFW, rec7XlKvpXcM0OGte
- Node configs (key):
  - Find Lead: Resource=Record, Operation=Search, Return all=ON, filterByFormula = `OR({SMS Campaign ID}='{{$json.campaign_id}}', {Phone}='{{$json.phone_digits}}', {Phone}='+1{{$json.phone_digits}}')`
  - Update Lead Delivery: match on `id`, write `SMS Status`, `Error Log`; no computed fields


## 2025-08-29 — Production Readiness Fixes Applied
- **SMS Eligible Logic Fixed** (D10qtcjjf2Vmmp5j):
  - Filter updated: `OR({SMS Sequence Position}>0,{SMS Eligible})`
  - New leads (Position=0) require eligibility: ICP≥70, US, Phone Valid
  - Continuing leads (Position>0) bypass SMS Eligible check
  - Verified: Both leads found after fix (recjRGAiCez377jWm, recuWfN0y81iwqJvC)
- **Same-Day Dedupe Removed** (D10qtcjjf2Vmmp5j):
  - Eliminated blocking logic from "Prepare Text (A/B)" node
  - Removed seenPhones tracking and isSameDayET checks
  - Result: Sequences can send all 3 steps with configured timing
- **Delivery Webhook Fixed** (vA0Gkp2BrxKppuSu):
  - Audit Row references updated to use $('Parse Delivery').item.json
  - Now handles cases where Find Lead returns no results gracefully
  - Verified: Write Audit Row node properly configured

## 2025-08-29: Complete SMS System Live Validation
- **3-Step Sequence**: Executions 2967/2976/2980 - Ryan+Chris full A/B sequence 0→3, Status 'Completed'
- **STOP Processing**: Executions 2989/2990 - Real SMS STOP replies processed, leads marked stopped  
- **Production Fixes**: SMS Eligible logic, same-day dedupe removal, List Due Leads rebuild
- **Business Continuity**: System resumes sequences correctly after stop/restart cycles
- **Delivery Tracking**: Real SimpleTexting webhooks confirmed, audit trail complete
- **Ready for Production**: All core SMS lifecycle functionality verified with live messages
- **Parser Fixed**: STOP webhook handles both INCOMING_MESSAGE and UNSUBSCRIBE_REPORT types

## 2025-08-29: Click Tracking Implementation Blocked  
- **Issue**: n8n Cloud webhook registration bug prevents new webhooks (404 errors)
- **Tested Endpoints**: /click/, /track/, /click-tracking/, /track-clicks/ - all fail with same 404 despite active status
- **Current State**: 
  - ✅ HMAC token generation working in SMS scheduler (`D10qtcjjf2Vmmp5j`)
  - ✅ URL replacement functional (generates tracking links in SMS)  
  - ❌ Receiver webhook fails to register (tried multiple approaches)
- **Platform Issue**: Affects ALL new webhook creation - not specific to our implementation
- **Workaround**: Temporarily disabled click tracking, will resume when n8n fixes infrastructure issue
- **Workflows Created**: Multiple attempts (all non-functional due to platform bug): QAEbqrf5x02PNqAX, PVjnPUUmIz8lK4tb

**Date**: 2025-08-29 23:17  
**Agent**: Developer Agent  
**Action**: HRQ Routing Implementation Complete  
**Evidence**: Added personal email detection to Real-time Ingestion workflow (`2cdgp1qr9tXlONVL`). Both Bulk Import and Real-time now have identical HRQ routing logic. Personal emails (gmail.com, yahoo.com, etc.) automatically set HRQ Status="Archive", Processing Status="Complete" to skip enrichment.  
**Files**: `docs/handovers/HRQ-WORKFLOW-SOP.md` (created), Real-time Ingestion workflow updated  
**Cost Impact**: Personal emails now bypass Clay processing entirely (cost savings)  
**Backup**: Real-time Ingestion workflow backed up before modifications

## 2025-08-30 — Daily Monitoring Workflow Created & Tested
- **Workflow**: UYSP-Daily-Monitoring (ID: 5xW2QG8x2RFQP8kx)
- **Test Execution**: 3026 (Manual)
- **Nodes**: Cron → Airtable (Sent/Delivered/Failed/Stops/Booked) → Build Summary → Slack
- **Fixes Applied**: Enabled "Always Output Data" on Airtable searches; adjusted Delivered filter to use `Delivery At` where available
- **Result**: Slack summary posted with 24h counts; chain no longer stops on empty result sets

## 2025-09-02 — Click Redirect GET Path: Registration Failure Evidence
- Context: Added GET branch for click redirects to `UYSP-SMS-Inbound-STOP` (same webhook path as POST; method GET)
- Observation: Browser previously showed JSON; header test now confirms edge 404 → endpoint not registered at edge
- Evidence:
  - Command: `curl -I "https://rebelhq.app.n8n.cloud/webhook/simpletexting-inbound?token=INVALID"`
  - Expected (working): `HTTP/2 302` with `Location: https://calendly.com/...`
  - Actual: `HTTP/2 404` (no Location) — indicates Cloud edge did not publish the new GET endpoint
- Impact: Existing POST webhooks (STOP, Delivery, Calendly) continue to work; only newly added GET endpoints exhibit 404
- Decision: Ship clean Calendly links in SMS (no tracking) OR move click redirect to a Cloudflare Worker on client domain until GET registration is resolved

## 2025-09-03 — SOP & Dev Plan Filed (Campaign Isolation & Clicks)
- Docs:
  - `context/CURRENT-SESSION/SOP-SimpleTexting-Campaign-Isolation-and-Reporting.md`
  - `context/CURRENT-SESSION/DEV-PLAN-SimpleTexting-Campaign-Isolation-and-Clicks.md`
- Evidence Basis:
  - Workflows (IDs): D10qtcjjf2Vmmp5j, vA0Gkp2BrxKppuSu, pQhwZYwBXbcARUzp, LiVE3BlxsFkHhG83
  - Paths: `/webhook/simpletexting-delivery`, `/webhook/simpletexting-inbound`, `/webhook/calendly`
  - Airtable tables per handover: `Leads`, `SMS_Templates`, `Settings`, `SMS_Audit`
  - ST API docs confirm 1:1 send and webhooks

## 2025-09-03 — Click Webhook Spec Filed
- Doc: `context/CURRENT-SESSION/CLICK-TRACKING-WEBHOOK-SPEC.md`
- Includes: URL design, token format (HMAC), receiver behavior, known GET 404 issue evidence, fallback plan (Cloudflare Worker), configuration summary

## 2025-09-03 — Client Call: SimpleTexting Rollout Decisions & Evidence
- Source: `~/Downloads/Isaac McCauley and LATIF HORST_otter_ai.txt`
- Decisions captured in `context/CURRENT-SESSION/CUSTOMER-CALL-2025-09-03-ISAAC-SIMPLETEXTING.md`
- Key Points:
  - Use ST Campaign/Tag to isolate automated sends for reporting and enable native click tracking
  - Include `first_name`/`last_name` on ST contact create/update via API
  - Interim click tracking via ST campaign short links (HMAC proxy deferred due to n8n GET bug)
  - Maintain NA-only gating, batching caps, Slack alerts, and dual kill switches (ST + scheduler)
  - Admin access to be provisioned via Isaac/Jen; LATIF to validate dashboards
  - Texas compliance requires clarification; avoid premature geo filtering

## 2025-09-04 — Click Webhook Fixed: Working Redirect Implementation
- Issue: Click webhook returning JSON instead of redirecting to Calendly
- Root Cause: Mismatched node connections (connection pointed to "Respond 302" but node was named "Respond HTML")
- Solution: Created new workflow **UYSP-Click-Redirect-Fixed** (ID: `YDMeulcYNT2eFqGh`)
- Implementation:
  - Static webhook path `/webhook/click` with token as query param `?t=`
  - HTML meta refresh redirect for universal browser support
  - Proper node connections ensure response processing
  - Minimal token payload without targetUrl (hardcoded in workflow)
- Evidence: 
  - Multiple executions showing successful token verification and Airtable updates
  - User confirmed Airtable shows click tracking working
  - Workflow activated in project workspace (user confirmed)
  - Execution #3105 (2025-09-04T00:39:13): Click recorded but blank page due to missing headers
  - Fixed with Content-Type: text/html header update at 00:40:26

## 2025-09-04 — Complete SOP Documentation Finalized
- **Document**: `context/CURRENT-SESSION/SOP-Bulk-Import-End-to-End-Test.md` (COMPLETE)
- **Content**: 5-stage sequential protocol with detailed field-by-field verification
- **Scope**: Validates all intelligence and logic built over months of development
- **Key Features**:
  - Exact Airtable field names and expected values at each stage
  - Clay.com monitoring and verification steps
  - SMS Scheduler logic validation (lead selection, contact creation, audit trail)
  - Complete formula validation (ICP Score, SMS Eligible, HRQ routing)
  - Sequential Action → Verification → Next Action format
- **Documentation Updates**: SESSION-GUIDE.md, INDEX.md, active_context.md all updated to reference complete SOP
- **Status**: System ready for final end-to-end test execution

## 2025-09-04 — Critical SOP Fix: Google Sheets CSV Export
- **Issue**: SOP contained completely incorrect instructions for generating CSV export URL from Google Sheets
- **Problem**: Instructions referenced non-existent "File > Share > Publish to web" functionality
- **Root Cause**: AI provided inaccurate UI navigation instructions without verification
- **Fix Applied**: Updated with correct URL conversion method:
  - Copy Google Sheets URL from address bar
  - Remove `/edit` portion and everything after
  - Add `/export?format=csv&gid=SHEET_ID` 
- **Evidence**: User correctly identified error immediately upon testing
- **Impact**: Critical fix - test execution would have failed at Step 2 without this correction

## 2025-09-04 — Google Sheets Permission Issue During Test
- **Issue**: n8n workflow failed with "Bad request" and German error "Datei kann derzeit nicht geöffnet werden"
- **Root Cause**: Google Sheet was private/restricted, preventing n8n from accessing the CSV export URL
- **Error Details**: Permission denied when n8n tried to fetch CSV data from Google Sheets
- **Solution Applied**: Updated SOP with permission fix instructions:
  - Change Google Sheet access from "Restricted" to "Anyone with the link"
  - Set permission to "Viewer"
  - Provided alternative manual CSV download method if needed
- **Status**: Awaiting user permission change to proceed with test

## 2025-09-04 — SMS Scheduler: Add ST Contact Node
- **Workflow**: `UYSP-SMS-Scheduler` (ID: `D10qtcjjf2Vmmp5j`)
- **Change**: Added `Update ST Contact` HTTP Request node before the `SimpleTexting HTTP` send node.
- **Purpose**: To create/update a contact in SimpleTexting, assigning it to the `AI Webinar – Automation (System)` list and tagging it with `uysp-automation` for UI visibility.
- **Evidence**: `n8n_update_full_workflow` successful at `2025-09-04T04:32:35.019Z`, new Version ID `8f13246c-a40d-4508-abd1-87df375cb7b7`.

## 2025-09-05 — SMS Send Expressions Corrected
- Workflow: `UYSP-SMS-Scheduler` (ID: `D10qtcjjf2Vmmp5j`)
- Change: `SimpleTexting HTTP` jsonBody now references prepared values directly:
  - `text` = `$items('Prepare Text (A/B)',0)[$itemIndex].json.text`
  - `contactPhone` (else branch) = `$items('Prepare Text (A/B)',0)[$itemIndex].json.phone_digits`
- Evidence: Workflow updated at `2025-09-05T00:37:17Z`; versionId `75b3606c-7112-4132-a232-76ace7a99037`.

## 2025-09-05 — Airtable Automations Enabled (Helpers)
- Promote Ready: Enrichment Timestamp ≠ empty AND SMS Eligible = true AND Processing Status ≠ "Ready for SMS" → Update record: Processing Status = "Ready for SMS".
- Route Enrichment Failures: Enrichment Timestamp ≠ empty AND Job Title empty AND Linkedin URL - Person empty AND HRQ Status = "Qualified" → Update record: HRQ Status = "Review"; HRQ Reason = "Enrichment failed".
- Evidence: User provided screenshots confirming configuration and successful updates; automations turned ON in Airtable UI.

## 2025-09-05 — Final SMS Scheduler Fixes & System Stabilization
- **Workflow**: `UYSP-SMS-Scheduler-CLEAN` (ID: `UAZWVFzMrJaVbvGM`) created to replace old scheduler (`D10qtcjjf2Vmmp5j`).
- **Change 1 (Link Fix)**: Replaced the `Prepare Text (A/B)` node with a clean version that has all link-rewriting logic permanently removed. The system now sends the direct Calendly URL from the Airtable `SMS_Templates` table.
- **Change 2 (Slack Fix)**: Replaced the `SMS Test Notify` node and updated the `Parse SMS Response` node. The parser now reliably sets the campaign name, and the Slack node correctly references the parser's output to display "Status" and "Campaign".
- **Evidence**: New workflow created `2025-09-05T04:46:36.250Z`. Final fixes applied and verified with user. The system is now stable and ready for production use.

## 2025-09-11 — Scheduler v2: Airtable Partial‑Edit + Shortlink Path Fixed
- **Workflow**: `UYSP-SMS-Scheduler-v2` (ID: `UAZWVFzMrJaVbvGM`)
- **Changes**:
  - Partial update applied to `Save Short Link v3` (Airtable) with `matchingColumns=["id"]`, `options.typecast=true`.
  - `id` expression corrected to direct upstream item to eliminate "No path back" and Airtable 422 errors:
    - `={{ $items('Generate Alias',0)[$itemIndex].json.id }}`
  - Switchy link title simplified to a single expression.
  - `SimpleTexting HTTP` jsonBody ensures text fallback order and sets `campaignId` and `contactPhone` explicitly.
- **Rules Update**: `.cursorrules/00-CRITICAL-ALWAYS.md` updated with §16e Airtable Partial‑Edit Protocol (allowed keys only; never touch credentials or replace whole `parameters`).
- **Validator**: Remaining non-blocking warnings on Slack `SMS Test Notify` nested expressions; to be simplified next.
