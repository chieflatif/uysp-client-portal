# Critical n8n Platform Gotchas - MUST READ

## 🚨 NEW DISCOVERY: Credential JSON Null Behavior (Not a Bug!)

### The Issue:
When retrieving workflows via API or exporting to JSON, all credential IDs show as `null`:
```json
"credentials": {
  "airtableApi": {
    "id": null,
    "name": "Airtable API"
  }
}
```

### The Reality:
- **This is NORMAL n8n security behavior** - not corruption
- Credentials ARE connected and working in the UI
- n8n never exposes credential IDs in exports for security
- The workflow will execute correctly despite JSON showing null

### What This Means:
1. **Don't panic** when you see null credential IDs in JSON
2. **Trust the UI** - if credentials show as selected, they're connected
3. **Test execution** to verify, not JSON inspection
4. **Credential corruption** (from MCP updates) is a DIFFERENT issue

### How to Verify Credentials Work:
1. Execute workflow with test payload
2. Check for authentication errors in execution
3. Only re-select credentials if you get auth failures

---

## 🚨 Webhook Testing in Test Mode

### The Challenge:
- Webhooks in test mode wait for external requests
- Can't just click "Execute" with test data
- Workflow hangs waiting for webhook

### Solution 1: External Test (Recommended)
```bash
# Use webhook test URL from node
curl -X POST https://your-n8n.com/webhook-test/endpoint \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-key" \
  -d '{"email":"test@example.com"}'
```

### Solution 2: Manual Test Branch
Add parallel test path:
- Manual Trigger → Set Test Data → Merge with Webhook

### Solution 3: Pin Data
- Send one real webhook
- Pin the output data
- Re-execute with pinned data

---

## 🚨 Previously Documented Gotchas

### 1. "Always Output Data" Toggle
- **Location**: Settings tab (NOT Parameters tab)
- **Required for**: All IF/Switch nodes
- **Cannot be**: Set via API/JSON
- **Symptom**: "No output data returned"

### 2. Expression Spacing
- **Correct**: `{{ $json.field }}` (with spaces)
- **Wrong**: `{{$json.field}}` (no spaces)
- **Result**: Silent failure, empty values

### 3. Table References
- **Use**: Table IDs `tblXXXXXXXXXXXXXX`
- **Never**: Table names like "People"
- **Why**: Names cause intermittent failures

### 4. Credential Corruption on MCP Updates
- **Trigger**: ANY programmatic workflow update via MCP
- **Result**: Credential IDs actually set to null (not just display)
- **Fix**: Manual re-selection in UI only
- **Prevention**: Never update workflows via MCP

### 5. Webhook Test Mode
- **Behavior**: Listens for ONE request only
- **Process**: Execute Workflow → Send request → Stops
- **Reset**: Must click Execute again for next test

---

## Quick Reference Decision Tree

**See null credentials in JSON?**
→ Normal behavior, test execution first

**Workflow won't run in test mode?**
→ Webhook waiting, use external trigger

**"No output data returned"?**
→ Enable "Always Output Data" in Settings

**Expression not working?**
→ Check spacing: {{ $json.field }}

**Table not found randomly?**
→ Switch to table IDs

**Updated via MCP and auth fails?**
→ Real corruption, re-select in UI
