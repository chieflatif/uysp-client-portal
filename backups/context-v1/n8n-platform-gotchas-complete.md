# UYSP Platform Gotchas & Workarounds
Critical n8n Platform Limitations That Break Workflows

## 🚨 UI-Only Settings That Cannot Be Automated

### 1. "Always Output Data" Toggle
**Location**: Settings tab (NOT Parameters tab) in n8n node configuration  
**Required For**: ALL IF and Switch nodes  
**Symptom**: "No output data returned" errors when condition doesn't match  
**Why It Matters**: Without this, IF/Switch nodes stop the workflow when no data matches condition  
**Fix**: Human must manually enable in UI for EVERY conditional node  
**Cannot Be**: Set via API, MCP, or workflow JSON import

### 2. Credential Selection & Corruption
**Issue**: ANY programmatic workflow update nulls credential IDs  
**Symptom**: "No authentication data defined on node!" after MCP updates  
**Why It Happens**: n8n stores credential references separately from workflow JSON  
**Fix**: Human must re-select credentials via dropdown in UI  
**Prevention**: NEVER update workflows via MCP after credentials are set  
**Safe Method**: Export workflow → Edit JSON → Import → Re-select credentials

## 🚨 Expression Syntax Requirements

### 3. Spacing in Expressions
**Correct**: `{{ $json.field }}` (with spaces)  
**Wrong**: `{{$json.field}}` (no spaces)  
**Result**: Silent failure - expression returns empty/undefined  
**No Error Message**: Fails without warning  
**Applies To**: ALL formula fields, expressions, and conditionals  

**Common Failures**:
- Filter formulas in Airtable nodes
- IF node conditions  
- Variable references in Code nodes

### 4. Nested Expression Limitations
**Issue**: Airtable filterByFormula doesn't support nested n8n expressions  
**Symptom**: "Expression error: filterByFormula: Nested expressions are not supported"  
**Example That Fails**: `AND({email} = '{{ $node["Webhook"].json.email }}', {date} > '{{ $now.minus(7, 'days') }}')`  
**Workaround**: Use Code node to build formula string first, then reference simple variable

## 🚨 Webhook Development Mode Behavior

### 5. Test Mode Webhook Limitations
**How It Works**: Development mode webhooks are NOT like production  

**Process**:
1. Click "Execute Workflow" button in UI
2. Webhook starts listening for ONE request
3. After receiving one request, it STOPS  
4. Must click Execute again for next test

**Common Mistake**: Sending multiple test payloads without re-executing  
**Result**: Only first payload is processed  
**Cannot**: Test from within n8n interface (test button doesn't work)  
**Must**: Use external tool (curl, Postman, TestSprite)

## 🚨 Table Reference Requirements

### 6. Table IDs vs Names
**Correct**: `tblXXXXXXXXXXXXXX` (table ID from Airtable URL)  
**Wrong**: `People` (table name)  
**Why**: Table names work intermittently, causing random failures  
**Symptom**: "Table not found" errors that come and go  
**Applies To**: ALL Airtable operations  
**Finding IDs**: Look in Airtable URL after /tbl

## 🚨 Data Type Handling

### 7. Boolean Field Conversions
**Issue**: Webhooks send booleans as strings  
**Variations Found**: "yes", "true", "1", "on", "checked", true, 1  
**Airtable Expects**: Actual boolean (true/false)  
**Solution**: Normalize in Smart Field Mapper first node  
**Common Fields**: interested_in_coaching, qualified_lead, contacted

### 8. Date/Time Format Mismatches
**n8n Format**: ISO 8601 with timezone  
**Airtable Expects**: ISO 8601 without timezone for date fields  
**Symptom**: Date fields show as invalid or offset by timezone  
**Fix**: Strip timezone with `.toISOString().split('T')[0]` for date-only fields

## 🚨 Execution & Error Handling

### 9. Error Output Node Behavior
**Issue**: Error workflows receive different data structure  
**Normal**: `$json` contains your data  
**Error Workflow**: `$json.error` contains error, `$json.payload` contains original  
**Common Mistake**: Using same expressions in error handler  
**Fix**: Check for error structure first in error workflows

### 10. Execution Timeout Limits
**Default**: 5 minutes per workflow execution  
**Long Operations**: Batch processing, multiple API calls  
**Symptom**: "Execution timeout" with no other error  
**Fix**: Break into smaller workflows with Execute Workflow nodes  
**Cannot Change**: Timeout is platform-wide setting

## 🚨 API & Integration Gotchas

### 11. OAuth Refresh Issues
**Problem**: OAuth tokens don't auto-refresh in test mode  
**Symptom**: Authentication works, then fails after 1 hour  
**Affected**: Google, Microsoft, Salesforce integrations  
**Workaround**: Re-authenticate manually in development  
**Production**: Auto-refresh works correctly

### 12. Webhook URL Changes
**Issue**: Webhook URLs change between environments  
**Dev Pattern**: `https://[instance].app.n8n.cloud/webhook-test/[path]`  
**Prod Pattern**: `https://[instance].app.n8n.cloud/webhook/[path]`  
**Common Mistake**: Hardcoding webhook URLs  
**Solution**: Use environment variables for base URL

## 🚨 Performance & Limits

### 13. Item Processing Limits
**Default Max**: 10,000 items per execution  
**Memory Usage**: Large items consume memory fast  
**Symptom**: "JavaScript heap out of memory"  
**Fix**: Process in batches using Loop nodes  
**Best Practice**: Keep batches under 100 items for complex operations

### 14. Code Node Restrictions
**No Access To**: External npm packages  
**Available**: Basic Node.js built-ins  
**Common Request**: "Can I use lodash/axios/moment?"  
**Answer**: No - use built-in alternatives or HTTP Request node  
**Workaround**: Implement needed functions in Code node

## 🚨 UI Quirks & Hidden Features

### 15. Node Setting Tabs
**Parameters Tab**: Main node configuration  
**Settings Tab**: Advanced options (hidden by default)  

**Common Hidden Settings**:
- Always Output Data
- Retry On Fail
- Timeout settings
- Continue On Fail

**Easy to Miss**: Settings tab collapsed by default

### 16. Copy/Paste Node Issues
**Problem**: Pasted nodes lose connections  
**Also Lost**: Some settings from Settings tab  
**Credential References**: Always lost on paste  
**Fix**: Reconnect everything manually after paste  
**Better Option**: Duplicate nodes instead of copy/paste

## 🚨 Platform-Specific Workarounds

### For "No Output Data" Errors
```javascript
// Add this pattern to handle empty results
const results = $input.all();
if (results.length === 0) {
  return [{ json: { empty: true, reason: 'No matches found' } }];
}
return results;
```

### For Expression Spacing Issues
```javascript
// Build complex expressions in Code node first
const email = $json.email;
const formula = `{email} = '${email}'`;
return { formula };
// Then use simple reference: {{ $json.formula }}
```

### For Webhook Testing
```bash
# Test script for webhook development
echo "Click 'Execute Workflow' in n8n first!"
read -p "Press enter when ready..."
curl -X POST https://[instance].app.n8n.cloud/webhook-test/[path] \
  -H "Content-Type: application/json" \
  -d '{"test": "payload"}'
echo "Sent! Click Execute again for next test."
```

### For Table ID Discovery
```javascript
// Helper node to get all table IDs
const tables = $input.all();
return tables.map(table => ({
  json: {
    name: table.name,
    id: table.id,
    use_this: `Table ID for ${table.name}: ${table.id}`
  }
}));
```

## 🚨 Critical Integration Points

### When Using with Smart Field Mapper
- Must be FIRST node after webhook (Pattern 00)
- ALL downstream nodes use: `$node["Smart Field Mapper"].json.normalized`
- NEVER reference webhook data directly after mapper
- Unknown fields logged for weekly review

### When Testing with Reality-Based Protocol
- Ignore HTTP 200 responses (meaningless)
- Check ACTUAL Airtable record creation
- Verify field mapping percentage
- Confirm execution completed fully
- Evidence = Record IDs, not status codes

## 🚨 Recovery Procedures

### When Credentials Break
1. DO NOT try to fix via MCP
2. Export workflow to JSON
3. Delete broken workflow
4. Import JSON as new workflow
5. Manually set all credentials via UI
6. Test every connection

### When Expressions Fail Silently
1. Check spacing: `{{ $json.field }}`
2. Try in Code node first
3. Use simple variable references
4. Avoid nested expressions in Airtable
5. Console.log intermediate values

### When Webhook Tests Fail
1. Verify "Execute Workflow" clicked
2. Check URL includes `/webhook-test/` in dev
3. Confirm external tool sending request
4. Look for execution in "Executions" list
5. Check webhook path matches exactly

## 🚨 Prevention Checklist
**Before ANY Session**:
- [ ] All IF/Switch nodes have "Always Output Data" ON
- [ ] Webhook URLs use environment variables
- [ ] Table operations use IDs not names
- [ ] Expressions have proper spacing
- [ ] Credentials selected via UI only
- [ ] Test mode behavior understood
- [ ] Field normalization is first node
- [ ] Boolean conversions handled
- [ ] Error handler checks structure
- [ ] Batch sizes limited to 100

## 🚨 Platform Version Notes
**Current n8n Version**: Latest cloud version (auto-updated)  
**Behavior Changes**: Some gotchas may be fixed in future versions  
**Always Check**: Release notes for platform updates  
**These Gotchas Confirmed**: As of January 2024  
**Most Persistent**: UI-only settings, credential corruption, expression spacing 