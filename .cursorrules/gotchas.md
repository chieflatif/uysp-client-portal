# n8n Platform Gotchas - Quick Reference for Cursor AI

## 🚨 Webhook Testing Gotcha
- Webhooks require EXTERNAL trigger (curl, script, etc)
- Cannot test by just clicking Execute
- Use production URL for automated testing: `https://rebelhq.app.n8n.cloud/webhook/kajabi-leads`
- Test URL requires manual "Execute Workflow" click each time
- **Solution**: Use `/scripts/automated-webhook-test.sh` for testing

## 🚨 Credential JSON Null Gotcha  
- Credentials showing as null in JSON is NORMAL
- This is n8n security, not corruption
- Trust the UI, not the JSON export
- Test execution to verify, not JSON inspection
- Only worry if you get actual authentication errors during execution

## 🚨 Always Output Data Toggle
- Location: Settings tab (NOT Parameters tab) in n8n UI
- Must be ON for IF/Switch nodes to continue on empty
- Cannot be set via API/JSON
- Symptom: "No output data returned" errors
- **Human must enable manually in UI**

## 🚨 Expression Syntax Spacing
- MUST have spaces: `{{ $json.field }}` ✓
- Will fail silently: `{{$json.field}}` ✗
- Applies to all formula fields
- No error message - just empty results

## 🚨 Table References
- Use Table IDs: `tblXXXXXXXXXXXXXX` ✓
- Never table names: `People` ✗
- Names work intermittently = silent failures

## 🚨 Credential Corruption on Updates
- ANY programmatic update can null credential IDs
- Symptom: "No authentication data defined on node!"
- Solution: Manual UI re-selection only
- NEVER use MCP for workflow updates that have credentials

## Quick Fix Reference
- "No output data returned" → Enable "Always Output Data" in Settings tab
- "Expression error: filterByFormula" → Add spaces: `{{ $json.field }}`
- "No authentication data defined" → Credential corrupted, needs UI re-selection
- "Webhook won't test" → Use external trigger (curl/script)
- "Credentials show null in JSON" → Normal behavior, ignore unless auth fails
