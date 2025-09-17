# Active Context: UYSP Lead Qualification - Post-Recovery

**Session Status**: ✅ **ACTIVE**
**Branch**: `feature/clay-sms-integration`
**Date**: 2025-09-11

---

## 🎯 Current Objective
**FINAL END-TO-END TESTING**: Execute comprehensive bulk import test to validate all system components before production deployment. All workflows are implemented and ready for testing.

---

## 🚨 CRITICAL SYSTEM STATUS - POST SMS DISASTER RECOVERY (2025-09-17)

### **DISASTER SUMMARY:**
- **852 duplicate SMS messages** sent to 284 contacts on September 17th (4 AM, 5 AM, 6 AM executions)
- **Root Cause**: Cron schedule changed to `0 13-23 * * 1-5` (hourly), delay validation bypassed, unlimited batch size
- **Zero audit records** created due to 284-record processing overload
- **Complete violation** of all established safety protocols

### **CURRENT SYSTEM STATUS:**
- **SMS Scheduler v2** (`UAZWVFzMrJaVbvGM`): **DISABLED** - Manual trigger only after emergency repairs
- **Applied Fixes**: 24-hour duplicate prevention, 9 AM-5 PM Eastern time window, 25-lead batch limit
- **Processing Status**: Fixed "Complete" vs "Completed" inconsistency 
- **Local Unsubscribe Analysis**: 42/284 leads show "local unsubscribe" errors but click tracking proves messages delivered
- **Scheduler Disconnected**: No automatic execution - manual trigger only for controlled testing

### **PREVIOUS SYSTEM (Pre-Disaster):**
- Outbound workflow: `UYSP-SMS-Scheduler-v2` (`UAZWVFzMrJaVbvGM`) using cron in business hours
- Airtable fetch: Cloud-supported `Search` with server-side `filterByFormula` and batch limits
- A/B & templating: `Get Settings` + `List Templates` supply ratios and copy; `Prepare Text (A/B)` assigns variant, selects step template, personalizes `{Name}`; timing due-check embedded
- Send & update: `SimpleTexting HTTP` sends; `Airtable Update` writes sequence tracking fields
- Enrichment: Clay is the enrichment provider of record. Clay writes back enrichment data (e.g., company/person fields)
- **Enrichment Timestamp**: Set by Airtable Automation when enrichment fields like `Job Title` are populated

### 2025-09-11 Update — Scheduler v2 Stabilization
- Workflow `UYSP-SMS-Scheduler-v2` (`UAZWVFzMrJaVbvGM`) updated and validated.
- Shortlink path fixed and persisted:
  - `Save Short Link v3` (Airtable) now matches on the direct upstream item id to avoid "No path back":
    - id (using to match): `={{ $items('Generate Alias',0)[$itemIndex].json.id }}`
  - Fields:
    - `Short Link ID`: `={{ $items('Generate Alias',0)[$itemIndex].json.alias_candidate || $items('Create Short Link (Switchy)',0)[$itemIndex].json.id || $json.short_link_id || '' }}`
    - `Short Link URL`: `={{ $items('Create Short Link (Switchy)',0)[$itemIndex].json.shortUrl || ('https://hi.switchy.io/' + ($items('Generate Alias',0)[$itemIndex].json.alias_candidate || '')) || $json.short_link_url || '' }}`
- `SimpleTexting HTTP` JSON body prioritizes: saved short link → Switchy response → alias URL → prepared text; `campaignId` and `contactPhone` are explicitly set.
- Switchy link title simplified to a single expression to remove nested-expression validator errors.
- Rules codified: `.cursorrules/00-CRITICAL-ALWAYS.md` section 16e adds the Airtable Partial‑Edit Protocol (allowed keys: `operation/base/table/columns.*/matchingColumns/options.typecast`; never touch `credentials` or replace entire `parameters`).
- Outstanding validator items (non-blocking): simplify Slack `SMS Test Notify` text to a single expression.

---

## 📌 Decisions
- Keep single outbound workflow (Option A). Inbound STOP + Calendly as tiny separate workflows (deferred for v1 cutover).
- Batch cap = 200/run (tunable). If backlog > cap, next cron picks remaining.
- Clicks do not stop sequences; only Booked/STOP/Manual Stop.
- Clay enrichment remains mandatory pre-SMS; n8n does not replace Clay for enrichment.
- Companies cache-first rule: `Leads.Company` links to `Companies` by `Domain`. If linked company exists, use company fields from `Companies` for scoring and skip company re‑enrichment in Clay; only enrich companies missing from `Companies`.

---

## ✅ COMPLETE SYSTEM VALIDATION (2025-08-29)
**SMS Sequencer v1 FULLY OPERATIONAL - Live tested with real SMS**

- **3-Step Sequence**: ✅ COMPLETE - Executions 2967/2976/2980. Full A/B sequence Ryan+Chris, Position 0→1→2→3, Status "Completed"  
- **STOP Processing**: ✅ COMPLETE - Executions 2989/2990. Real SMS STOP replies processed, leads marked stopped
- **Calendly Integration**: ✅ COMPLETE - Execution 2965. Booking webhook sets Booked=true, stops sequences. Matching upgraded to email OR phone (digits-only) to handle alternate booking emails.
- **Delivery Tracking**: ✅ COMPLETE - Real SimpleTexting delivery webhooks updating Status=Delivered
- **Business Continuity**: ✅ PROVEN - System resumes sequences correctly after stop/restart

## ▶ CRITICAL DEVELOPMENT PRIORITIES (Updated 2025-08-30)

### **🚨 PRIORITY 1: Click Tracking Implementation**
- **Status**: 🟡 BLOCKED - n8n Cloud webhook registration bug
- **Business Impact**: ZERO conversion tracking without this - foundational for metrics
- **Technical Issue**: New webhook endpoints fail to register (404) despite being active
- **Workaround Needed**: Future development when n8n fixes webhook registration
- **Current State**: HMAC generation working in SMS scheduler, receiver workflow built but can't activate

### **📊 PRIORITY 2: Daily Monitoring Workflow**  
- **Status**: 🟢 COMPLETE — Workflow created and tested (ID: 5xW2QG8x2RFQP8kx)
- **Scope**: Daily Cron → Airtable searches (24h) → Summary → Slack (C097CHUHNTG)
- **Notes**: Enabled "Always Output Data" on searches; Delivered uses `Delivery At`; Manual Trigger for ad‑hoc runs.

### **🏢 PRIORITY 3: HRQ Routing Enforcement**
- **Status**: 🟢 CORE COMPLETE — Personal email detection + reviewer flow finalized
- **Business Impact**: Cost savings by skipping enrichment on personal emails (gmail.com, yahoo.com, etc.)
- **Implemented**: HRQ Status="Archive" for personal emails; Enrichment gaps handled via view‑only detection (No Person Data). Reviewer resume: set `HRQ Status="Qualified"` AND `Processing Status="Queued"`.
- **Remaining**: Optional post‑enrichment criteria checker (deferred); no separate action‑processor workflow needed.

### **📈 PRIORITY 4: 30K Lead Spreadsheet Processing**
- **Status**: 🔴 Pipeline architecture needed for massive scale ingestion
- **Business Impact**: MAJOR - Real business growth opportunity, bulk lead activation
- **Requirements**: Bulk ingestion → enrichment → qualification → SMS pipeline (TBD)

### **🛡️ PRIORITY 5: Automated Backup System**
- **Status**: 🟡 Manual process working, automation needed for operational safety

---

## 🧪 Verification
Outbound: Scheduler updates fields; Test Mode routing verified; cron UTC `0 14-21 * * 1-5`.
Delivery: Executions 2960, 2959 updated leads to Delivered; Slack and Audit rows present.
Inbound STOP: Executions 2961, 2962 updated matching leads and set STOP fields.

---

## 🔎 Workflow SSOT (2025-09-05) - STABLE & TESTED STATE

- **Decision**: Click tracking via n8n proxy is permanently disabled. System now sends direct Calendly links from templates. Future tracking will use an external service (e.g., Switchy).
- **Active Scheduler**: The new, clean workflow `UYSP-SMS-Scheduler-CLEAN` (ID: `UAZWVFzMrJaVbvGM`) is now the active scheduler. The old scheduler is archived.

| Workflow | ID | Active | Trigger/Path(s) | Purpose | Evidence | TODO/NEXT |
|---|---|---|---|---|---|---|
| UYSP-SMS-Scheduler-CLEAN | UAZWVFzMrJaVbvGM | ✅ | Cron `0 14-21 * * 1-5` | Outbound sends; A/B; audit; Slack. **Sends direct links.** | Final test runs successful. | Monitor. |
| UYSP-SMS-Scheduler | D10qtcjjf2Vmmp5j | ⛔ (Archived) | Cron `0 14-21 * * 1-5` | Old version. Kept for historical reference. | N/A | Delete after 30 days. |
| UYSP-ST-Delivery V2 | vA0Gkp2BrxKppuSu | ✅ | POST `/webhook/simpletexting-delivery` | Delivery updates → Leads + Audit + Slack | Executions 2960, 2959 | None |
| UYSP-Calendly-Booked | LiVE3BlxsFkHhG83 | ✅ | POST `/webhook/calendly` | Booked=true; stop sequence | Execution 2965 | Confirm final path naming; keep link in Settings |
| UYSP-SMS-Inbound-STOP | pQhwZYwBXbcARUzp | ⛔ | POST `/webhook/simpletexting-inbound` (STOP) | STOP/UNSTOP processing | Real STOP verified earlier | Activate POST |
| UYSP-Daily-Monitoring | 5xW2QG8x2RFQP8kx | ⛔ | Cron `0 14 * * 1-5` | 24h counts → Slack | Manual test 3026 | Ensure Delivered node uses `Delivery At`; activate |
| UYSP-Realtime-Ingestion | 2cdgp1qr9tXlONVL | ⛔ | POST `/webhook/leads-intake` | Kajabi form intake → upsert leads; HRQ archive personal emails | Node review complete | Confirm forms/fields; activate |
| UYSP Backlog Ingestion | qMXmmw4NUCh1qu8r | ⛔ | Manual | CSV → normalize → upsert; HRQ archive personal emails | Node review complete | Provide CSV; run batched |

Notes
- GET webhook 404: New GET methods/paths appear unregistered at n8n Cloud edge (curl -I returns 404) while existing POST webhooks work; STOP path kept isolated.

---

## 📌 Production Links & Secrets (references only)
- Calendly booking link (client, SMS display): `https://calendly.com/d/cwvn-dwy-v5k/sales-coaching-strategy-call-rrl`
- Note: Any signing secrets, API keys, or HMAC secrets are stored in credentials/env, not in repo.

---

## 🔎 Single‑Source Workflow Status (SSOT)

| Workflow | ID | Trigger | Path/Method | Active | Purpose | Evidence | Next Actions |
|---|---|---|---|---|---|---|---|
| UYSP‑SMS‑Scheduler | D10qtcjjf2Vmmp5j | Cron | N/A | ✅ | Outbound SMS (A/B, 3‑step), Slack, Sent audit | Live tests 2967/2976/2980 | If click tracking disabled, ensure URL replacement is OFF for clean link |
| UYSP‑ST‑Delivery V2 | vA0Gkp2BrxKppuSu | Webhook | /webhook/simpletexting‑delivery (POST) | ✅ | Delivery parse → set `SMS Status`, Slack, audit | Exec 2960/2959 | None |
| UYSP‑Calendly‑Booked | LiVE3BlxsFkHhG83 | Webhook | /webhook/calendly (POST) | ✅ | Mark `Booked=true`, stop sequence | Exec 2965 | Standardize docs to this path; client to add org webhook |
| UYSP‑SMS‑Inbound‑STOP | pQhwZYwBXbcARUzp | Webhook | /webhook/simpletexting‑inbound (POST) | ⛔ | STOP/UNSTOP processing | Exec 2989/2990 previously when active | Toggle Active ON; keep GET branch isolated |
| Click Redirect (GET) | in STOP wf | Webhook | /webhook/simpletexting‑inbound (GET) | ⛔ 404 | Intended 302 redirect for clicks | curl shows 404 at edge | Defer or move to Cloudflare Worker |
| UYSP‑Daily‑Monitoring | 5xW2QG8x2RFQP8kx | Cron | N/A | ⛔ | 24h KPIs → Slack | Manual exec 3026 | Activate; ensure Delivered uses `Delivery At` |
| UYSP‑Realtime‑Ingestion | 2cdgp1qr9tXlONVL | Webhook | /webhook/leads‑intake (POST) | ⛔ | Create/queue leads; HRQ personal email | Code node HRQ logic present | Confirm Kajabi forms; activate |
| UYSP Backlog Ingestion | qMXmmw4NUCh1qu8r | Manual | N/A | ⛔ | CSV → upsert leads; HRQ personal email | Parser/Upsert ready | Provide CSV; run batches |

Notes:
- GET click path returns 404 (edge not registered). Existing POST paths are unaffected. This matches curl header evidence gathered 2025‑09‑01.

---

## 🎯 Launch Decisions (Click Tracking)
- For launch: use clean Calendly link in SMS (no token) to keep messages tidy and avoid GET registration bug.
- Alternative (if required now): Cloudflare Worker redirect on client domain verifying HMAC and 302 to Calendly; optionally POST a click event back to existing POST endpoint.

