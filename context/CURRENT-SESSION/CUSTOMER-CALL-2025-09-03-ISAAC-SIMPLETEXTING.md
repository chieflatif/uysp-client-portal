# Customer Call Summary – SimpleTexting Rollout (2025-09-03)

**Participants**: LATIF HORST, Isaac McCauley  
**Source**: `~/Downloads/Isaac McCauley and LATIF HORST_otter_ai.txt` (Otter transcript)

---

## Executive Summary

Client is ready to activate SMS outreach for AI webinar leads (~3.5k). SimpleTexting (ST) already contains ~1.8k validated numbers from prior uploads. Our system currently sends via ST API and creates contacts implicitly (without names) but is not associating sends with an ST “Campaign,” which prevents campaign-scoped reporting and native click tracking (via ST short links). We must ensure: admin access, campaign-level association or equivalent tagging, name inclusion on contact create, North America gating, opt-out parity, and clear cost/volume safeguards. Click tracking can be handled by ST campaign short links; our HMAC proxy remains optional until n8n GET webhook issue is resolved.

---

## Key Facts (from call)

- Volume: Target set includes first AI webinar + recording follow-up + post (~3,500 leads).  
- Existing ST data: ~1,800 numbers already uploaded/validated in ST; NA-only enforced at upload.  
- Opt-outs: ST automatically suppresses unsubscribed contacts. If our system creates/uses the same contact, ST will not send to unsubscribed numbers.  
- Contact creation: API sends appear to create ST contacts without names; spreadsheet uploads include names.  
- Campaigns & tracking: ST Campaign messages generate short links (`txt.so`) and provide click tracking per campaign. Individual/API sends without campaign association won’t have that native click tracking.  
- Reporting parity: We need a way to distinguish our sends from Isaac’s manual ST campaigns to keep our metrics accurate.  
- Access: Isaac will arrange admin access (via contact “Jen”); LATIF to provide an email alias if needed.  
- Compliance note (Texas): Possible requirement for surety; unclear impact. Area code ≠ residency; needs guidance.  
- System gating: SMS eligibility requires ICP≥70, US, valid phone, quota-carrying; company email preferred during current testing.

---

## Critical Considerations

1) Campaign association for reporting and tracking  
   - Without campaign context, our reports co-mingle with manual sends and lose click data.  
   - We need a durable identifier (Campaign ID or Tag) consistently applied to all of our sends.

2) Names on contact records  
   - Lack of names on API-created contacts reduces personalization and ST UI clarity.  
   - Investigate API support to include first/last names on create/update.

3) Click tracking strategy  
   - ST campaigns provide built-in short-link tracking.  
   - Our HMAC proxy is currently blocked by n8n GET webhook registration; ST tracking is the pragmatic interim.

4) Cost/rate safeguards  
   - Credit-based costs require batching, caps, and a kill switch with monitoring/alerts.  
   - Isaac wants clear stop-gaps to avoid runaway spend.

5) Compliance (Texas)  
   - Requires clarification; area codes alone are insufficient.  
   - Interim filters may be imperfect; await guidance before enforcing exclusions.

---

## Actions (Owner → Outcome)

1) Access: Coordinate admin access  
   - Isaac → Request/add LATIF (alias if needed) via Jen (ST).  
   - LATIF → Provide alias and confirm login; screenshot ST dashboards.

2) Campaign-scoped sending & tagging  
   - LATIF → Evaluate ST API to (a) create/use a Campaign or (b) apply a unique Tag/Segment for “AI Webinar – Automation.”  
   - LATIF → Ensure our system writes a stable `SMS Campaign ID`/Tag to Airtable and includes it on every send to isolate reporting.  
   - LATIF → Modify reporting to query by Campaign/Tag to separate automated vs manual sends.

3) Include names on contact create/update  
   - LATIF → Verify ST API parameters for contact name fields; update integration to send `first_name`/`last_name` when creating/upserting contacts.

4) Click tracking plan (interim)  
   - LATIF → Prefer ST campaign short-link tracking for this campaign until n8n GET bug is resolved.  
   - Document fallback: our HMAC proxy once GET endpoints can be registered again.

5) Safeguards & monitoring  
   - LATIF → Enforce batch caps per cron (e.g., 200/run) and Slack alerts.  
   - LATIF → Confirm “kill switch” visibility in ST (manual pause) and in our system (disable cron or gating view).

6) Texas compliance follow‑up  
   - Isaac → Obtain written guidance on Texas requirements (surety, allowed messaging).  
   - LATIF → Prepare optional filter by geo (only if legally required and specified), with documentation of limitations.

---

## Technical Implications

- Minimal-change approach: Keep one outbound scheduler; add Campaign/Tag metadata on ST side plus `SMS Campaign ID` in Airtable.  
- Contact enrichment: Add name fields when creating/upserting to ST to improve UI parity and personalization tokens.  
- Reporting isolation: All analytics filtered by Campaign/Tag to avoid mixing automated and manual traffic.  
- Click tracking: Use ST campaign tracking for now; document HMAC proxy re‑enablement once n8n GET issue is fixed.  
- No business logic changes: Entry criteria (ICP≥70, US, valid phone, quota-carrying) remain intact.

---

## Risks / Gaps / Alternatives

- Risk: ST API may not expose full Campaign workflows.  
  - Mitigation: Use consistent Tag + Segment naming to emulate campaign scoping for reporting.  
- Gap: n8n GET webhook registration bug blocks our click proxy.  
  - Mitigation: Use ST campaign tracking; revisit proxy later or consider Cloudflare Worker redirect if needed urgently.  
- Compliance ambiguity (Texas).  
  - Mitigation: Await guidance; avoid premature geo filters that could exclude valid leads.

Alternatives (not recommended now):  
- Migrate all sending into ST Campaign UI workflows (manual) – higher operational load, less automation.  
- Pause click tracking entirely – loses key attribution; ST campaign tracking is available now with low effort.

---

## Decisions to Confirm with Client

1) Use of a dedicated Campaign/Tag name: “AI Webinar – Automation (System).”  
2) Agreement to rely on ST campaign click tracking for this launch.  
3) Acceptance that names will appear in ST once API upsert includes name fields.  
4) Temporary stance on Texas: proceed; adjust upon formal guidance.

---

## Done‑When

- This document lives at `context/CURRENT-SESSION/` and is linked from `INDEX.md`.  
- `SESSION-GUIDE.md` reflects takeaways and immediate next steps.  
- Evidence and progress entries added to `memory_bank/evidence_log.md` and `memory_bank/progress.md`.  
- Action items are tracked and aligned with current session objectives.


