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
- Node configs (key):
  - Find Lead: Resource=Record, Operation=Search, Return all=ON, filterByFormula = `OR({SMS Campaign ID}='{{$json.campaign_id}}', {Phone}='{{$json.phone_digits}}', {Phone}='+1{{$json.phone_digits}}')`
  - Update Lead Delivery: match on `id`, write `SMS Status`, `Error Log`; no computed fields
