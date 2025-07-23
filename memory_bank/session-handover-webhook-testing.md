# UYSP Session Handover - Critical Webhook Testing & Credential Discoveries
*Generated: 2025-07-23 by Claude PM*

## 🚨 CRITICAL DISCOVERIES FROM THIS SESSION

### Discovery 1: Credential JSON Null Behavior is NORMAL
**What happened**: Human saw credentials showing as `null` in workflow JSON and thought they were corrupted.

**Reality**: 
- This is n8n's SECURITY FEATURE, not a bug
- Credentials are hidden in JSON exports/API responses
- The UI shows them as connected (which they are)
- Workflow executes perfectly despite JSON showing null

**Impact**: Wasted time trying to "fix" non-existent credential corruption

### Discovery 2: Webhook Testing Requires External Trigger
**What happened**: Human couldn't test webhook workflow by just clicking "Execute"

**Reality**:
- Webhooks in test mode wait for external HTTP requests
- The workflow hangs waiting for a webhook call
- This is BY DESIGN, not a bug

**Solution Created**: Fully automated test script using actual webhook URLs

## 📋 HANDOVER INSTRUCTIONS FOR NEXT CLAUDE PM

### Your Immediate Tasks:

1. **Update the Platform Gotchas Document**
   - Already created at: `/docs/critical-platform-gotchas.md`
   - Ensure it's linked in all relevant pattern files
   - Add to cursorrules for immediate visibility

2. **Update Pattern Files**
   - Add webhook testing instructions to `01-core-patterns.txt`
   - Reference the automated test script
   - Include credential JSON null explanation

3. **Instruct Cursor AI to Run Tests**
   When human needs to test webhooks, give Cursor this EXACT prompt:

```
===== AUTOMATED WEBHOOK TEST EXECUTION =====

Run the automated webhook test to verify the workflow is working:

1. First, check the test script exists:
```bash
ls -la /Users/latifhorst/Documents/cursor projects/UYSP Lead Qualification V1/scripts/automated-webhook-test.sh
```

2. Execute the test against PRODUCTION webhook (no manual steps needed):
```bash
curl -X POST "https://rebelhq.app.n8n.cloud/webhook/kajabi-leads" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyOWQwYWM3Ni0xYjBlLTRmMGItYTlkZC1iNzEwZDI0NzZlZmEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUyMDYzNTE4LCJleHAiOjE3NTk3ODgwMDB9.IRZEs36NXR6WHcZb1PiC109S70tGKsmzP86zWpun3qg" \
  -d '{"email":"cursor-test-$(date +%s)@example.com","name":"Cursor Test","phone":"555-0001"}'
```

3. Show me:
   - The HTTP response code (should be 200)
   - The response body
   - Any error messages

4. Then check in n8n execution history for the workflow ID: eiVyE76nCF9g20zU
```

## 🎯 SYSTEMATIC WEBHOOK TESTING PROCESS

### For Development (Test Mode):
1. Human clicks "Execute Workflow" in n8n UI
2. Run test within 60 seconds (webhook times out)
3. Check execution results

### For Production (Preferred - FULLY AUTOMATED):
1. Workflow must be ACTIVE
2. Use production URL: `https://rebelhq.app.n8n.cloud/webhook/kajabi-leads`
3. No manual steps required
4. Can run repeatedly without UI interaction

### Test Script Location:
```
/Users/latifhorst/Documents/cursor projects/UYSP Lead Qualification V1/scripts/automated-webhook-test.sh
```

## 📚 KNOWLEDGE BASE UPDATES NEEDED

### 1. Update `.cursorrules/gotchas.md` with:
```markdown
## Webhook Testing Gotcha
- Webhooks require EXTERNAL trigger (curl, script, etc)
- Cannot test by just clicking Execute
- Use production URL for automated testing
- Test URL requires manual "Execute Workflow" click each time

## Credential JSON Null Gotcha  
- Credentials showing as null in JSON is NORMAL
- This is n8n security, not corruption
- Trust the UI, not the JSON export
- Test execution to verify, not JSON inspection
```

### 2. Update `patterns/01-core-patterns.txt` section on webhook testing

### 3. Create new reference: `docs/webhook-testing-guide.md`

## 🚀 AUTOMATED TEST COMMANDS REFERENCE

### Quick Test (Production - No Manual Steps):
```bash
# Unique email with timestamp to avoid duplicates
curl -X POST "https://rebelhq.app.n8n.cloud/webhook/kajabi-leads" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyOWQwYWM3Ni0xYjBlLTRmMGItYTlkZC1iNzEwZDI0NzZlZmEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUyMDYzNTE4LCJleHAiOjE3NTk3ODgwMDB9.IRZEs36NXR6WHcZb1PiC109S70tGKsmzP86zWpun3qg" \
  -d '{"email":"test-'$(date +%s)'@example.com","name":"Auto Test"}'
```

### Field Variation Tests:
```bash
# Test ALL CAPS fields
curl -X POST "https://rebelhq.app.n8n.cloud/webhook/kajabi-leads" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyOWQwYWM3Ni0xYjBlLTRmMGItYTlkZC1iNzEwZDI0NzZlZmEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUyMDYzNTE4LCJleHAiOjE3NTk3ODgwMDB9.IRZEs36NXR6WHcZb1PiC109S70tGKsmzP86zWpun3qg" \
  -d '{"EMAIL":"CAPS-'$(date +%s)'@example.com","NAME":"CAPS TEST"}'
```

## ⚠️ CRITICAL REMINDERS

1. **ALWAYS use production URL for automated testing** - it's active and requires no manual steps
2. **Credential nulls in JSON are NORMAL** - stop trying to "fix" them
3. **Webhook test mode is ONE REQUEST ONLY** - must click Execute for each test
4. **Timestamp emails to avoid duplicates** - use `$(date +%s)` in test emails

## 🔄 WORKFLOW STATUS

- **Workflow ID**: eiVyE76nCF9g20zU
- **Name**: uysp-lead-processing-WORKING
- **Status**: ACTIVE (can receive production webhooks)
- **Webhook Path**: /webhook/kajabi-leads
- **API Key**: Embedded in scripts above
- **Airtable Base**: appuBf0fTe8tp8ZaF

## 📝 PENDING CURSOR FIXES

The human was about to give Cursor the Smart Field Mapper fixes when we discovered the credential/webhook issues. Next steps:

1. Verify webhooks working with test
2. Apply Smart Field Mapper boolean conversion fixes
3. Add Field_Mapping_Log node
4. Test with all 10 payload variations

---

**END OF HANDOVER**

Next Claude PM: Start by reviewing the critical discoveries and updating documentation as instructed above.
