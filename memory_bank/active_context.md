# Active Context: UYSP Lead Qualification - Post-Recovery

**Session Status**: ✅ **ACTIVE**
**Branch**: `feature/clay-sms-integration`
**Date**: 2025-08-28

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
- Implement inbound STOP webhook → set `SMS Stop = true`, reason.
- Implement Calendly `invitee.created` webhook → set `Booked = true`, `Booked At`.
- Optional: click tracking proxy (HMAC + 302) and fresh-stop recheck before send.

---

## 🧪 Verification
Last manual run succeeded: Airtable Update 200 OK; fields updated per design. Airtable fetch latency acceptable; further optimization available by fully removing the extra "Airtable Get Record" hop (safe to do later).
