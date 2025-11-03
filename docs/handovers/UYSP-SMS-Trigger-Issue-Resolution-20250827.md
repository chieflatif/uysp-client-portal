# UYSP SMS Trigger Issue Resolution - 2025-08-27 (ARCHIVED)

> Archived: replaced by stable `UYSP-SMS-Scheduler` flow. Current docs: `memory_bank/active_context.md` and `docs/handovers/SMS-SEQUENCER-V1-SOP.md`.

## Issue Summary (historical)
The SMS trigger workflow had two critical issues causing intermittent failures:

### 1. **Record ID Mis-propagation (FIXED)**
- **Root Cause**: Parse SMS Response node was not set to run once per item, causing all updates to use the same record ID
- **Evidence**: Execution 2770 showed UserB and UserC both updating UserA's record
- **Fix Applied**: Set Parse node to `runOnceForEachItem` and removed ID handling from code

### 2. **Node Parameter Wipe (IDENTIFIED)**
- **Root Cause**: n8n UI autosave race condition corrupted Airtable Update node parameters
- **Evidence**: Execution errors show "Could not get parameter columns.matchingColumns" despite correct API configuration
- **Issue**: The workflow appears correct via API but executions use cached/corrupted parameters

## Current Status
- ✅ SMS messages are being sent successfully (3 test messages sent with campaign IDs)
- ❌ Airtable records are NOT being updated due to corrupted node parameters
- ⚠️ Records remain in SMS Pipeline view after sending

## Resolution Steps Required

### Immediate Fix (Manual Import Required)
Due to the n8n UI autosave corruption issue, the workflow needs to be re-imported:

1. **Close all n8n editor tabs** for workflow D10qtcjjf2Vmmp5j
2. **Delete the existing workflow** in n8n UI
3. **Import the corrected workflow** from: `workflows/backups/UYSP-SMS-Trigger-D10qtcjjf2Vmmp5j-20250827_corrected.json`
4. **Verify all nodes** have proper parameters before activating

### Testing Protocol
After importing the corrected workflow:

1. Check SMS Pipeline view for pending records
2. Update a test record's Company field to trigger
3. Wait for next poll (every minute)
4. Verify:
   - SMS sent with campaign ID
   - Airtable record updated with all fields
   - Record removed from SMS Pipeline view
   - Slack notification shows correct data

## Prevention Measures
Per the handover documentation:
- Always close n8n editor tabs before API updates
- Use API-based updates in small atomic chunks
- Export workflow JSON after each successful change
- Never leave n8n editor open during automated updates

## Evidence Collected
- **Execution IDs**: 2770 (bug demonstrated), 2772, 2773 (failed after attempted fix)
- **SMS Campaign IDs**: Successfully sent to 68adefe4b4d37773b237efb5, 68adefe4c761a25ba9a259a5, 68adf3e5aeeb1620741e52bb
- **Airtable Records**: recmiECNDoJGwuKMe, recEQoFVOyvhZOzsS, recV9LNOIbA8zhxDY (all pending update)

## Code Changes Made
1. Parse SMS Response node:
   - Added: `mode: "runOnceForEachItem"`
   - Removed: ID propagation logic
   
2. Airtable Update node (attempted but blocked by corruption):
   - All required fields properly mapped
   - Correct record ID reference: `$item(0).$node["Airtable Get Record"].json.id`
   - All status fields configured

The corrected workflow JSON is ready for import and should resolve all identified issues.

