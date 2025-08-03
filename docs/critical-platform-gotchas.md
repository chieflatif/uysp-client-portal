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

## 🧹 AIRTABLE CLEANUP GOTCHA

### The Issue:
After comprehensive testing, Airtable accumulates test records that must be cleaned up systematically.

### The Solution:
**Use Airtable API batch delete with proper filtering**

```python
import requests
API_KEY = 'your_airtable_token'  
BASE_ID = 'appuBf0fTe8tp8ZaF'
TABLE_ID = 'tblSk2Ikg21932uE0'  # People table
HEADERS = {'Authorization': f'Bearer {API_KEY}', 'Content-Type': 'application/json'}

# Step 1: Query test records (filter by email pattern)
def get_test_records():
    formula = "OR(SEARCH('test', {email}), SEARCH('a1-', {email}), SEARCH('b2-', {email}), SEARCH('c3-', {email}), SEARCH('d1-', {email}))"
    response = requests.get(f"https://api.airtable.com/v0/{BASE_ID}/{TABLE_ID}?filterByFormula={formula}", headers=HEADERS)
    # Preserve duplicate lookup records
    return [rec['id'] for rec in response.json().get('records', []) if 'duplicate' not in rec['fields'].get('request_id', '').lower()]

# Step 2: Batch delete (10 at a time - API limit)
def delete_batch(record_ids):
    if record_ids:
        payload = {'records': record_ids}
        requests.delete(f"https://api.airtable.com/v0/{BASE_ID}/{TABLE_ID}", headers=HEADERS, json=payload)

# Execute cleanup
records = get_test_records()
for i in range(0, len(records), 10):
    delete_batch(records[i:i+10])
    print(f"Deleted batch {i//10 + 1}: {len(records[i:i+10])} records")
```

### Critical Gotchas:
- **API Limit**: Maximum 10 record IDs per DELETE request
- **Filter Carefully**: Use specific patterns to avoid deleting production data  
- **Preserve Duplicates**: Exclude records used for duplicate detection testing
- **Rate Limiting**: Airtable API has rate limits (5 requests/second)
- **Backup First**: Always backup base before bulk operations

### Airtable Boolean Gotcha:
**Airtable checkboxes ignore `false` values - use `null` instead**
- `true` → checkbox checked ✅
- `false` → checkbox IGNORED (stays unchecked) ❌  
- `null` → checkbox unchecked ✅

---

## 🚨 TESTING GOTCHA: Boolean Fields "Missing" is NORMAL

### The Confusion:
During testing, agents often report: "Boolean fields are broken - they don't appear in Airtable records!"

### The Reality:
**This is CORRECT Airtable behavior, not a bug:**
- ✅ **True/Checked**: Field appears in API response as `true`
- ✅ **False/Unchecked**: Field is completely absent from API response (NOT `false`)

### Example:
```json
// Input to Smart Field Mapper
{"interested_in_coaching": "no", "qualified_lead": "yes"}

// Airtable record response  
{
  "fields": {
    "qualified_lead": true
    // interested_in_coaching is ABSENT (not false) - this is CORRECT
  }
}
```

### For Testing Agents:
- **Don't panic** when boolean fields are "missing" from Airtable responses
- **Absent field = unchecked/false** in Airtable's design
- **Only investigate** if you expect `true` but field is absent
- **This is documented behavior**, not broken functionality

---

## 🚨 NEW CONTEXT ENGINEERING GOTCHAS

### Gotcha 1: n8n Workflow Automation
**Use REST API for programmatic activation/execution**
- **Activate**: `PUT /api/v1/workflows/{id}/activate`
- **Execute**: `POST /api/v1/workflows/{id}/execute`
- **Auth**: API key in header `X-N8N-API-KEY`
- **Benefits**: Enables automated testing batches; deactivate post-run
- **Reference**: n8n docs API section

### Gotcha 2: Airtable Boolean/Checkbox Handling
**API ignores 'false' for checkboxes (treats as null/unchecked)**
- **Normalization Pattern**: `normalized[field] = isTruthy ? true : null`
- **Never**: Send `false` directly to Airtable API
- **Why**: Airtable API design - false values are ignored completely
- **Reference**: Airtable API documentation

### Gotcha 3: n8n Expression Preservation
**Expressions omit 'false'; use ternaries for safety**
- **Pattern**: `{{$json.normalized.contacted !== undefined ? $json.normalized.contacted : null}}`
- **Avoid**: Direct boolean expressions that may evaluate to false
- **Why**: n8n expression engine can drop false values
- **Reference**: n8n community forums

### Gotcha 4: Airtable Cleanup Protocol
**Post-tests, delete test records via API batch with preservation**
- **Filter Pattern**: Delete emails like 'a*/b*/c*/d*@example.com'
- **Preserve**: Records with `duplicate_count > 0` (lookup integrity)
- **Batch Size**: Maximum 10 IDs per request
- **Backup**: Always backup base before cleanup operations
- **Script Location**: See cleanup gotcha script above
- **Reference**: Airtable API batch operations

## 🚨 CONTEXT ENGINEERING UPGRADE GOTCHAS

### Anti-Hallucination Protocol Gotcha
**Tool calls must precede claims - evidence blocks mandatory**
- **Pattern**: Execute tool → collect evidence → make claim
- **Never**: Claim success without tool verification
- **Evidence Block Format**:
```
EVIDENCE:
- Tool: [tool_name]
- Result: [specific_output]
- Verification: [how_confirmed]
- Record ID: [airtable/workflow_id]
```
- **Self-Correction**: If claim proven false, immediately acknowledge and correct

### Chunking Implementation Gotcha  
**Maximum 5 operations per chunk with user confirmation waits**
- **Pattern**: Plan chunk → execute ≤5 steps → present results table → wait for 'go'
- **Progress Table Format**:
```
| Step | Tool Used | Status | Evidence | Issues |
|------|-----------|--------|----------|--------|
| 1    | [tool]    | ✅/❌   | [ID/ref] | [any]  |
```
- **User Wait**: Never proceed to next chunk without explicit user 'go' or 'proceed'

### Honesty Declaration Gotcha
**End every response with honesty assessment - no exceptions**
- **Format**: "HONESTY CHECK: [percentage]% evidence-based. Assumptions: [list]"
- **100% Standard**: Only claim 100% if every statement has tool verification
- **Assumption Documentation**: List any unverified statements or inferences
- **Correction Protocol**: If later proven wrong, acknowledge and update approach

### Technical Learning Integration Gotcha
**Reference learnings in implementation - don't rediscover**
- **Boolean Mapping**: Always use `false → null` for Airtable
- **Expression Safety**: Always use ternary operators for boolean preservation  
- **API Automation**: Use n8n REST API for batch testing
- **Cleanup Protocol**: Use batch delete with preservation filters
- **Evidence Tables**: Include metrics and verification data in all test results
- **Schema Compatibility**: Use Airtable Schema v3.1 - fully aligned with all context engineering learnings

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

**Need automated testing?**
→ Use n8n REST API for activation/execution

**Boolean conversion failing?**
→ Map false to null, never send false directly

**Boolean fields "missing" during testing?**
→ Normal behavior! False = absent, true = present

**Test cleanup needed?**
→ Use Airtable API batch delete with preservation filters
