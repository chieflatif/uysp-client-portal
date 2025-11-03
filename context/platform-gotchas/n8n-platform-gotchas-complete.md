# N8N Platform Gotchas - Complete Reference
**UPDATED: Post-Investigation Protocol**

## 🚨 CRITICAL GOTCHAS (WILL CAUSE HOURS OF DEBUGGING)

### 1. Airtable Date Field Type Formatting - GOTCHA #17
**Issue**: Airtable `date` vs `dateTime` fields require DIFFERENT expression formats  
**Symptom**: "Field cannot accept the provided value" error even with valid expressions  
**Why It Happens**: Different field types expect different date string formats  
**CRITICAL RULES**:
- **`date` fields**: Use `{{DateTime.now().toFormat('M/d/yyyy')}}` (US format: 7/23/2025)  
- **`dateTime` fields**: Use `{{DateTime.now().toISO()}}` (ISO format: 2025-07-23T10:00:00.000Z)  
- **NEVER use**: `{{$now}}` (not a valid n8n expression)  
**Detection**: Check Airtable field schema FIRST before setting date expressions  
**MCP Investigation**: Always use `mcp_airtable_describe_table` to verify field types  
**PREVENTION**: Create expression templates for each Airtable date field type

### 2. Airtable Field Mode: Fixed vs Expression  
**Issue**: Date/DateTime fields have TWO modes - "Fixed" and "Expression"  
**Symptom**: Valid n8n expressions like {{DateTime.now()}} show as empty/invalid in UI  
**Why It Happens**: Incorrect MCP parameter format for expressions  
**MCP SOLUTION**: Use double equals `={{expression}}` format in MCP tools  
**CORRECT MCP SYNTAX**: `"parameters.columns.value.created_date": "={{DateTime.now().toFormat('M/d/yyyy')}}"`  
**Detection**: MCP shows correct values but UI shows empty = check expression format  
**CRITICAL**: MCP tools CAN control field modes via resourceMapper dot notation

### 3. Credential Selection & Corruption
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

### 17. Credential JSON Null Display (Not a Bug!)
**Issue**: Credentials show as `null` in workflow JSON exports/API responses
**Symptom**: `"credentials": { "airtableApi": { "id": null, "name": "Airtable API" } }`
**Why It Happens**: n8n security feature - never exposes credential IDs in exports
**Occurs When**: Exporting workflows, using GET workflow API, viewing JSON
**This Is NORMAL**: Credentials ARE connected and working in the UI
**Fix**: None needed - trust UI display, not JSON representation
**Detection**: Only worry if you get actual authentication errors during execution
**Prevention**: Test execution to verify credentials, not JSON inspection

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

### 17. Workspace Contamination 
**Issue**: n8n MCP tools connect to personal workspace, not project workspace
**Symptom**: Workflows appear in both personal and project workspaces
**Why It Happens**: n8n MCP uses default workspace authentication, not project-specific
**Correct Workspace**: https://rebelhq.app.n8n.cloud/projects/H4VRaaZhd8VKQANf/workflows
**Wrong Workspace**: https://rebelhq.app.n8n.cloud/workflow/ (personal)
**Fix**: Manual workflow export/import between workspaces required
**Prevention**: ALWAYS verify workspace URL before any n8n operations
**Cannot Be**: Automated via MCP - workspace isolation requires manual management

### 18. Credential JSON Null Display
**Issue**: Credential values show as null in workflow JSON view
**Symptom**: {"credential": null} appears in exported workflows
**Why It Happens**: Security feature - n8n never exports actual credential values
**This Is NORMAL**: Not corruption, working as designed
**Fix**: No fix needed - credentials work normally despite null display
**Prevention**: Don't assume credential corruption from JSON null values
**Cannot Be**: Changed - this is intended security behavior 