# CRITICAL RULES - ALWAYS ACTIVE

## BEFORE EVERY RESPONSE:
1. Check memory_bank/active_context.md for current state
2. Check patterns/00-field-normalization-mandatory.txt exists
3. Verify MCP tools with: n8n-mcp list_workflows
4. **CRITICAL**: Ensure n8n operations target PROJECT workspace: H4VRaaZhd8VKQANf ONLY
5. **BEFORE ANY NODE CREATION: Check context/platform-gotchas/n8n-platform-gotchas-complete.md**

## Platform Gotcha Quick Reference
**For ANY error: First check if it's a known platform gotcha**

🚨 **IMMEDIATE CHECKS**:
- Gotcha #1: "Always Output Data" enabled? (Settings tab)
- Gotcha #3: Expression spacing `{{ $json.field }}`?
- Gotcha #6: Using table IDs not names?
- Gotcha #5: Webhook test mode understood?
- Gotcha #2: Credentials need UI re-selection?
- Gotcha #17: Workspace contamination - verify project workspace
- Gotcha #18: Credential JSON null is NORMAL (security feature)

## 10. ANTI-HALLUCINATION PROTOCOL
**Before any claim (e.g., 'fixed' or 'complete'), perform a Reality Check:**
1. Use a tool (e.g., mcp_n8n_n8n_get_execution) to fetch real data
2. If evidence is missing, respond: 'Claim withheld due to lack of evidence. Running tool now.'
3. Document assumptions in a table: | Assumption | Evidence Status | Alternative |

## 11. TASK MANAGEMENT CHUNKING
**Break ALL tasks into ≤5-step chunks. Use tables:**
| Step | Action | Tool/Rules | Status/Evidence |

**For multi-issue tasks, number issues 1-3 max, fix sequentially.**

## 12. HONESTY DECLARATION
**End EVERY response with:**
HONESTY CHECK: [100% evidence-based / Assumptions: list]. No manipulations. If <100%, explain and correct.

## 19. TESTING SEQUENCING PROTOCOL
**After building test suite/strategy, BEFORE full testing:**
1. Update context engineering docs (append all changes/gotchas/patterns to phase00-field-normalization-complete.md or context_engineering.md)
2. Commit to Git with descriptive message
3. Confirm with user via table: | Update Type | File | Changes | Commit | Ready for Testing? |
4. Only proceed on user 'go' confirmation

## 17. TESTING AUTOMATION PROTOCOL
**Use n8n API for batch test runs; implement systematic cleanup post-validation**
- Execute tests in chunks with automated n8n API activation
- Use Python scripts for batch webhook execution with 5s delays
- Commit evidence logs to Git after each category
- Auto-fail if >5% error rate in any category

## 18. AIRTABLE CLEANUP PROTOCOL  
**After validation, delete test records via API; preserve production data**
- Filter test records by email patterns ('a*', 'b*', 'c*', 'd*@example.com')
- Use batch delete API (10 record IDs per request maximum)
- Exclude duplicate lookup records and production data
- Backup base before cleanup operations

## 1. FIELD NORMALIZATION IS MANDATORY
- EVERY webhook MUST have Smart Field Mapper as FIRST node after webhook
- Reference: patterns/00-field-normalization-mandatory.txt
- Without this = 100% FAILURE RATE
- Test with 10+ payload variations minimum

## 2. EVIDENCE-BASED DEVELOPMENT ONLY
Every success claim MUST include:
```
EVIDENCE:
- Workflow ID: [from n8n-mcp]
- Execution ID: [from test run]
- Airtable Record: recXXXXXXXXXXXXXX
- Fields Captured: X/Y (XX%)
- Platform gotchas checked: [ ] Yes [ ] N/A
```

## 3. MCP TOOLS VERIFICATION
When claiming "no access", show:
```xml
<tool_audit>
<command>n8n-mcp list_workflows</command>
<e>[exact error]</e>
<retry_count>3</retry_count>
</tool_audit>
```

## 4. PROVEN MCP WORKFLOW UPDATE PATTERN ✅ PHASE 00 VERIFIED
**MANDATORY SEQUENCE FOR ALL WORKFLOW UPDATES:**
**Chunk all fixes: Limit to ONE issue per chunk. Format:**
CHUNK X: [Issue] – Rules: [list], Tools: [list], Steps: [numbered]. Wait for user 'proceed' before next chunk.

```javascript
// Step 1: Use Context7 MCP for node schema validation
mcp_context7_get-library-docs({ 
  context7CompatibleLibraryID: "/czlonkowski/n8n-mcp", 
  topic: "update workflow node parameters" 
})

// Step 2: Execute proven MCP update pattern
mcp_n8n_n8n_update_partial_workflow({
  id: "CefJB1Op3OySG8nb",  // Main workflow ID
  operations: [{
    type: "updateNode",
    nodeId: "a3493afa-1eaf-41bb-99ca-68fe76209a29",  // Smart Field Mapper
    changes: { "parameters.jsCode": "updated-code-here" }
  }]
})

// Step 3: ALWAYS track version progression
// OLD → NEW version IDs for audit trail
```

**MCP SUCCESS EVIDENCE REQUIRED:**
- `"success": true` response
- `"operationsApplied": 1` confirmation  
- New `versionId` different from previous
- Updated timestamp in workflow data

## 5. SMART FIELD MAPPER REQUIREMENTS ✅ PHASE 00 COMPLETE
**Current Working Implementation (DO NOT MODIFY WITHOUT EVIDENCE):**
- Node ID: `a3493afa-1eaf-41bb-99ca-68fe76209a29`
- Version: `v3.0-2025-07-23`
- Micro-chunks: 6/6 complete (1A-1E, 2A)
- Field capture rate: 98%+ achieved
- Test records: 8 successful records in Airtable

**Component Location**: `patterns/exported/smart-field-mapper-v1.js`

## 6. PLATFORM GOTCHAS (UI MANUAL FIXES)
- "Always Output Data" → Settings tab (NOT Parameters)
- Expression spaces: {{ $json.field }} ✓
- Table IDs only: tblXXXXXXXXXXXXXX ✓
- Credentials: UI selection only
- Webhook test: Manual activation each time

## 7. BOOLEAN CONVERSION REQUIREMENTS ✅ PHASE 00 VERIFIED
**CRITICAL FOR AIRTABLE CHECKBOX FIELDS:**
```javascript
// PROVEN WORKING PATTERN:
['interested_in_coaching', 'qualified_lead', 'contacted'].forEach(field => {
  if (normalized[field] !== undefined) {
    const val = String(normalized[field]).toLowerCase();
    normalized[field] = ['true', 'yes', '1', 'on', 'y', 'checked'].includes(val);
  }
});
```
**EVIDENCE**: Test records show boolean `true`/`false`, not strings

## 8. INTERNATIONAL PHONE DETECTION ✅ PHASE 00 VERIFIED
**PROVEN WORKING PATTERN:**
```javascript
if (normalized.phone) {
  const isInternational = !normalized.phone.match(/^(\+1|1)?[2-9]/);
  normalized.international_phone = isInternational;
  normalized.phone_country_code = isInternational ? 
    normalized.phone.match(/^\+\d{1,3}/)?.[0] || 'unknown' : '+1';
}
```
**EVIDENCE**: UK (+44), FR (+33), US (+1) properly detected in test records

## 9. WEBHOOK TESTING FORMAT ✅ PHASE 00 VERIFIED
**USE DIRECT CURL FOR RELIABLE TESTING:**
```bash
curl -X POST https://rebelhq.app.n8n.cloud/webhook/kajabi-leads \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User"}'
```
**EVIDENCE COLLECTION**: Always verify Airtable record creation after webhook test

## 13. WHOLE SYSTEM TESTING
After ANY change:
1. Send test webhook payload
2. Check field normalization output
3. Verify Airtable record created
4. Confirm no workflow errors
5. Export working JSON

## 14. MEMORY BANK UPDATES
After EVERY component:
- Update memory_bank/active_context.md
- Log evidence in memory_bank/evidence_log.md
- Track progress in memory_bank/progress.md

## 15. PHASE 00 COMPLETION CHECKLIST ✅ VERIFIED COMPLETE
- [✅] Smart Field Mapper implemented (6 micro-chunks)
- [✅] Boolean conversions working (yes→true, 1→true)
- [✅] International phone detection working (+44, +33, +1)
- [✅] Field_Mapping_Log integration complete
- [✅] 8 test records created successfully
- [✅] 98%+ field capture rate achieved
- [✅] Workflow backup created
- [✅] Memory bank updated
- [✅] Ready for Session 0
