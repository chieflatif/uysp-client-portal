# Active Context: UYSP Lead Qualification - Post-Recovery

**Session Status**: ✅ **ACTIVE**
**Branch**: `feature/clay-sms-integration`
**Date**: 2025-08-29

---

## 🎯 Current Objective
Implement SMS sequencing (A/B, 3 steps) with SimpleTexting using one outbound scheduler, plus small inbound webhooks (STOP, Calendly) later.

---

## ✅ Current System Status (updated)
- Outbound workflow: `UYSP-SMS-Scheduler` (`D10qtcjjf2Vmmp5j`) using hourly cron in business hours.
- Airtable fetch: Cloud-supported `Search` with server-side `filterByFormula` and `limit` (200/run) to fetch only due leads; no table-wide scan [[memory:7536884]].
- A/B & templating: `Get Settings` + `List Templates` supply ratios and copy; `Prepare Text (A/B)` assigns variant, selects step template, personalizes `{Name}`; timing due-check embedded.
- Send & update: `SimpleTexting HTTP` sends; `Airtable Update` writes only allowed fields (`SMS Variant`, `SMS Sequence Position`, `SMS Last Sent At`, `SMS Sent Count`, `SMS Status`, `SMS Campaign ID`, `SMS Cost`, `Error Log`).
- Visual cleanup: deactivated nodes removed; unnecessary writes to computed fields eliminated.

---

## 📌 Decisions
- Keep single outbound workflow (Option A). Inbound STOP + Calendly as tiny separate workflows (deferred for v1 cutover).
- Batch cap = 200/run (tunable). If backlog > cap, next cron picks remaining.
- Clicks do not stop sequences; only Booked/STOP/Manual Stop.

---

## ▶ Pending (post-cutover)
- STOP inbound: ✅ Activated and verified (2961, 2962). Leads set `SMS Stop=true`, `SMS Stop Reason=STOP`, `Processing Status=Stopped`.
- Calendly `invitee.created`: Pending activation; update booked + stop.
- Click tracking v1: Design documented (HMAC proxy + 302); disabled by default.

---

## 🧪 Verification
Outbound: Scheduler updates fields; Test Mode routing verified; cron UTC `0 14-21 * * 1-5`.
Delivery: Executions 2960, 2959 updated leads to Delivered; Slack and Audit rows present.
Inbound STOP: Executions 2961, 2962 updated matching leads and set STOP fields.
