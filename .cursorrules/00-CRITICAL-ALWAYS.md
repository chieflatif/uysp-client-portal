# CRITICAL RULES - ALWAYS ACTIVE

## 0. THE GOLDEN RULE: RESEARCH FIRST, ACT LAST (MANDATORY FOR ALL PHASES)
- **FORENSIC ANALYSIS IS NON-NEGOTIABLE**: Before proposing any plan or action, you must first conduct a deep, read-only forensic analysis of the current state of all relevant components (n8n workflows, nodes, code, Airtable fields, formulas, etc.).
- **STATE YOUR FINDINGS**: You must present the verified "current state" to the user as the foundation for your plan. Every proposal must be justified by this fresh, evidence-based understanding.
- **LASER FOCUS - ONE TASK AT A TIME**: Do not touch, edit, analyze, or even reference any workflow or system component that is not directly part of the approved, active task. Any deviation from the laser-focused objective is a critical failure.

---

## GLOBAL ANTI-HALLUCINATION PROTOCOL (ALL AGENTS)

### **MANDATORY UNCERTAINTY QUANTIFICATION**
- ALL responses MUST include confidence scores [0-100%]
- Trigger verification when confidence <80%
- Format: "Confidence: 75% - requires peer verification"

### **MULTI-AGENT DEBATE ARCHITECTURE**
- Every claim verified by ≥2 independent sources/tools
- Consensus required before final output
- Disagreement triggers evidence gathering

### **LAYERED VERIFICATION SEQUENCE**
1. Generate partial response
2. Cross-check via available tools
3. Update confidence based on evidence
4. Proceed only if confidence >threshold

## BEFORE EVERY RESPONSE:
1. **TECHNICAL ENFORCEMENT**: Run anti-hallucination enforcement system (tests/anti-hallucination-enforcement.js)
2. **CONFIDENCE ASSESSMENT**: Rate response confidence [0-100%] - TECHNICALLY ENFORCED
3. **MCP VERIFICATION**: Verify all MCP calls are real, not simulated - TECHNICALLY ENFORCED  
4. **MCP CONTAMINATION CHECK**: Verify no claims about embedding MCP tools in scripts (.cursorrules/GLOBAL-MCP-CONTAMINATION-PREVENTION.md)
5. Check memory_bank/active_context.md for current state
6. Check patterns/00-field-normalization-mandatory.txt exists
7. Verify MCP tools with: n8n-mcp list_workflows
8. **CRITICAL**: Ensure n8n operations target PROJECT workspace: H4VRaaZhd8VKQANf ONLY
9. **BEFORE ANY NODE CREATION: Check context/platform-gotchas/n8n-platform-gotchas-complete.md**
10. **🚨 NODE CONFIGURATION CLAIMS**: MANDATORY mcp_n8n_n8n_get_workflow verification before ANY configuration claims
11. **🚨 USER VISUAL EVIDENCE**: MANDATORY acknowledgment and tool verification when user provides screenshots

## 🔒 ENHANCED TECHNICAL ANTI-HALLUCINATION ENFORCEMENT (MANDATORY)
**AUTOMATIC TECHNICAL BARRIERS - CANNOT BE BYPASSED:**

### **ENHANCED ENFORCEMENT SYSTEM ACTIVATION**
- **System**: tests/enhanced-anti-hallucination-enforcement.js
- **Version**: v2.0-enhanced (100% bypass protection validated)
- **Status**: MANDATORY for all responses 
- **Bypass**: TECHNICALLY IMPOSSIBLE

### **ENHANCED TECHNICAL BARRIERS (AUTO-ENFORCED)**
1. **SUCCESS CLAIM DETECTION**: Detects automation/completion claims without evidence
   - Triggers: "flows smoothly", "API endpoints respond", "system working", etc.
   - Action: IMMEDIATE BLOCK - no automation claims without MCP evidence
   
2. **EVIDENCE VALIDATION**: Requires specific evidence patterns for success claims
   - Requirement: Workflow IDs, execution IDs, tool names, record IDs
   - Action: AUTOMATIC BLOCK - success claims require documented evidence
   
3. **ENCODING BYPASS DETECTION**: Detects base64/hex encoded violation attempts
   - Triggers: Base64/hex encoded mock patterns, simulation terms
   - Action: IMMEDIATE BLOCK - encoding cannot hide violation patterns
   
4. **INTENT ANALYSIS**: Scores automation intent vs supporting evidence
   - Scoring: High automation intent + low evidence = violation
   - Action: INTELLIGENT BLOCK - prevents sophisticated deception
   
5. **CONFIDENCE SCORE ENFORCEMENT**: No output without confidence assessment
   - Requirement: All responses MUST include "Confidence: X%" 
   - Action: AUTOMATIC BLOCK - technically impossible to respond without score
   
6. **DEEP MCP VALIDATION**: Enhanced fake response detection
   - Analysis: Structure, signatures, fabrication indicators
   - Action: IMMEDIATE BLOCK - only authentic MCP responses accepted

### **MANDATORY VALIDATION GATES**
- **Technical Implementation**: Cannot proceed without explicit user confirmation
- **Gate Triggers**: After ANY automation claim, evidence presentation, chunk completion
- **Required Response**: User must type "PROCEED" or "STOP" - no other input accepted
- **Enforcement**: System technically locked until valid user response received

## ⛔ EMERGENCY ANTI-STEAMROLLING PROTOCOL  
**🚨 MANDATORY STOPS - NO EXCEPTIONS:**
1. **TECHNICAL VALIDATION GATE**: System automatically creates validation gate after ≤5 operations
2. **NO COMPLETION CLAIMS**: NEVER use words "COMPLETE", "FINISHED", "DONE" without explicit user validation of results
3. **NO DOCUMENTATION CREATION**: NEVER create completion docs, evidence packages, or handover materials until user confirms success
4. **FORCED BREAKS**: Between EVERY major operation (workflow mod, testing, documentation) → STOP and wait for user "proceed"
5. **EVIDENCE VERIFICATION STOP**: After claiming ANY success → STOP and ask user to verify evidence before proceeding

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
- Gotcha #19: Boolean fields "missing" from Airtable = NORMAL (false = absent)

## 10. ANTI-HALLUCINATION & HOLISTIC PROBLEM-SOLVING PROTOCOL
**MANDATORY: NO "EUREKA" OR "ROOT CAUSE" CLAIMS WITHOUT VALIDATION**

### **BEFORE ANY INVESTIGATION:**
1. **System Map First**: Create comprehensive map of ALL connected components
2. **Hypothesis Log**: Track ALL previous theories with evidence status
3. **Multi-Source Validation**: Gather data from ≥3 independent sources
4. **Alternative Testing**: Rule out ≥2 alternative explanations before concluding

### **STRUCTURED DEBUGGING PROCESS (MANDATORY):**
```
Step 1: Reproduce Issue - Exact steps, timestamps, patterns
Step 2: Gather Data Holistically - Query ALL relevant systems  
Step 3: Analyze Patterns - Look for correlations, edge cases
Step 4: Test Hypotheses - 2-3 tests per theory, report results verbatim
Step 5: Propose Next Actions - User-confirmable, not assumptions
```

### **RESPONSE FORMAT (MANDATORY):**
```
Current System Map: [Table/list of ALL connected components]
Hypothesis Log: [Table with #, Description, Evidence For/Against, Status, Next Test]
Investigation Steps: [Numbered list with actual results]
Findings: [Evidence-based only - NO HYPE]
Next Steps: [User-actionable list]
```

### **FORBIDDEN PHRASES:**
❌ "EUREKA" ❌ "CRITICAL FINDING" ❌ "ROOT CAUSE IDENTIFIED" ❌ "Found the issue"
❌ "COMPLETE" ❌ "FINISHED" ❌ "DONE" ❌ "SUCCESS" ❌ "ACHIEVED" (without user validation)
✅ Use: "Evidence suggests", "Requires validation", "Testing hypothesis", "Awaiting user confirmation"

### **🚨 EMERGENCY FORBIDDEN BEHAVIORS:**
❌ **CREATING COMPLETION DOCUMENTATION** without user validation
❌ **CLAIMING SESSION COMPLETE** without comprehensive user review
❌ **PROCEEDING TO NEXT CHUNK** without explicit user "proceed" command
❌ **MAKING SUCCESS CLAIMS** based on limited testing (1-2 records)
❌ **GENERATING HANDOVER MATERIALS** before user confirms all work validated

## 11. TASK MANAGEMENT CHUNKING
**Break ALL tasks into ≤5-step chunks. Use tables:**
| Step | Action | Tool/Rules | Status/Evidence |

**For multi-issue tasks, number issues 1-3 max, fix sequentially.**

## 11b. BUSINESS LOGIC CHANGE CONTROL (NON-NEGOTIABLE)
- Do NOT alter business logic, routing thresholds, or outcome semantics without explicit user approval.
- Before any change: present justification, impact analysis, and the full code block to be replaced. No diffs-only proposals.
- All edits must preserve existing business KPIs and data contracts unless an approved change request states otherwise.
- Evidence requirements for approval: input→output examples, affected nodes list, rollback steps.

### **🚨 CHUNK EXECUTION PROTOCOL (EMERGENCY UPDATE):**
```
CHUNK FORMAT (MANDATORY):
1. Present chunk plan with ≤5 operations
2. Execute operations with evidence collection
3. Present evidence block with specific results
4. STOP and ask: "EVIDENCE COLLECTED. Ready for next chunk? (Type 'proceed')"
5. WAIT for explicit user confirmation before ANY next action
```

### **ANTI-WHACK-A-MOLE PROTOCOL:**
- **If similar issue repeats**: PAUSE → Review hypothesis log → Escalate to deep dive mode
- **No quick fixes without system mapping**: Always map full system before proposing solutions
- **Track failure patterns**: | Previous Fix | Why It Failed | System Component Missed |
- **🚨 STEAMROLL DETECTION**: If executing >1 chunk without user confirmation → EMERGENCY STOP

## 12. ENHANCED HONESTY DECLARATION WITH CONFIDENCE SCORING
**End EVERY response with MANDATORY sections:**
```
SYSTEM MAP COMPLETENESS: [% of components mapped / Missing components: list]
HYPOTHESIS VALIDATION: [# tested / # validated / # refuted]
EVIDENCE SOURCES: [List 3+ independent sources used]
CONFIDENCE SCORE: [0-100%] - [rationale for score]
UNCERTAINTY FACTORS: [List specific unknowns/assumptions]
VERIFICATION STATUS: [Peer validated: Yes/No] [Tool verified: Yes/No]
HONESTY CHECK: [100% evidence-based / Assumptions: list]. No manipulations.
```
**If confidence <80%, MANDATORY verification required before proceeding.**
**If <100% evidence-based, explain gaps and propose validation plan.**

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
// Step 1: Use Context7 for documentation accuracy (add "use context7" to prompts)
// Example: "Create n8n workflow with HTTP nodes. use context7"
// Context7 provides current documentation, prevents hallucinated APIs

// Step 2: Use n8n MCP tools for node information
mcp_n8n_get_node_info({ nodeType: "nodes-base.httpRequest" })

// Step 3: Execute proven MCP update pattern
mcp_n8n_n8n_update_partial_workflow({
  id: "wpg9K9s8wlfofv1u",  // Main workflow ID - CORRECTED 2025-01-27
  operations: [{
    type: "updateNode",
    nodeId: "b8d9c432-2f9f-455e-a0f4-06863abfa10f",  // Smart Field Mapper - CORRECTED 2025-01-27
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
- Node ID: `b8d9c432-2f9f-455e-a0f4-06863abfa10f` - CORRECTED 2025-01-27
- Version: `v4.6-boolean-null-fix` - CORRECTED 2025-01-27
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

## 16. CREDENTIAL & HTTP NODE SAFETY PROTOCOL (MANDATORY)

### 16a. CRITICAL: CREDENTIALED NODE FIX PROTOCOL (PROVEN WORKING 2025-09-16)
**WHEN ANY CREDENTIALED NODE (SLACK/AIRTABLE/HTTP) CREDENTIALS GET WIPED:**

**🚨 UNIVERSAL RULE: NEVER DENY PROGRAMMATIC CREDENTIAL FIXES ARE POSSIBLE - THEY ARE 100% FIXABLE**

**Step 1: Identify the credential ID from a working node or previous workflow export**
- Slack: Look for `credentials.slackOAuth2Api.id` (e.g., `"OyxQzoqNPQocHdnn"`)
- Airtable: Look for `credentials.airtableTokenApi.id` (e.g., `"Zir5IhIPeSQs72LR"`)
- HTTP: Look for `credentials.httpHeaderAuth.id` or relevant auth type

**Step 2: Fix ANY credentialed node with COMPLETE updateNode operation**

**SLACK NODE FIX:**
```javascript
mcp_n8n_n8n_update_partial_workflow({
  id: "WORKFLOW_ID",
  operations: [{
    type: "updateNode",
    nodeName: "Slack Node Name",
    changes: {
      "parameters": {
        "authentication": "oAuth2",
        "select": "channel",
        "channelId": {
          "__rl": true,
          "value": "C09D6U5BLG6", // Actual channel ID
          "mode": "list",
          "cachedResultName": "channel-name" // Actual channel name
        },
        "text": "Your message template with {{ $json.field }} expressions",
        "color": "good",
        "iconEmoji": ":bell:",
        "username": "n8n Bot",
        "otherOptions": {}
      },
      "credentials": {
        "slackOAuth2Api": {
          "id": "OyxQzoqNPQocHdnn", // CRITICAL: Use existing credential ID
          "name": "Slack account"
        }
      }
    }
  }]
})
```

**AIRTABLE NODE FIX:**
```javascript
mcp_n8n_n8n_update_partial_workflow({
  id: "WORKFLOW_ID",
  operations: [{
    type: "updateNode",
    nodeName: "Airtable Node Name",
    changes: {
      "parameters": {
        "operation": "update", // or "search", etc.
        "base": {
          "mode": "id",
          "value": "app6cU9HecxLpgT0P" // Actual base ID
        },
        "table": {
          "mode": "list",
          "value": "tblYUvhGADerbD8EO" // Actual table ID
        },
        // ... other parameters as needed
      },
      "credentials": {
        "airtableTokenApi": {
          "id": "Zir5IhIPeSQs72LR", // CRITICAL: Use existing credential ID
          "name": "Airtable UYSP Option C"
        }
      }
    }
  }]
})
```

**HTTP NODE FIX:**
```javascript
mcp_n8n_n8n_update_partial_workflow({
  id: "WORKFLOW_ID",
  operations: [{
    type: "updateNode",
    nodeName: "HTTP Node Name",
    changes: {
      "parameters": {
        "method": "POST",
        "url": "https://api.example.com/endpoint",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "Bearer token_or_expression"
            }
          ]
        },
        // ... other parameters as needed
      },
      "credentials": {
        "httpHeaderAuth": { // or relevant auth type
          "id": "CREDENTIAL_ID", // CRITICAL: Use existing credential ID
          "name": "Credential Name"
        }
      }
    }
  }]
})
```

**EVIDENCE REQUIRED:**
- `"success": true` response
- `credentials` block present in subsequent `get_workflow` call
- Node shows proper configuration instead of errors
- Test execution works with authenticated API calls

**NEVER DENY THIS IS POSSIBLE - IT IS 100% PROGRAMMATICALLY FIXABLE FOR ALL NODE TYPES**

## 16c. SMS SCHEDULER DISASTER PREVENTION PROTOCOL (MANDATORY)
**AFTER SEPTEMBER 17, 2025 DISASTER - 852 DUPLICATE MESSAGES TO 284 CONTACTS**

### **CRITICAL SAFEGUARDS (NON-NEGOTIABLE)**
1.  **MANUAL BATCH CONTROL**: The batch size and selection of leads is controlled **manually and exclusively** in Airtable via the `{SMS Batch Control}` field. The n8n workflow has no hard-coded limit and will process all leads marked "Active".
2.  **24-HOUR DUPLICATE PREVENTION**: The system checks `{SMS Last Sent At}` for any lead with a sequence position > 0, preventing rapid duplicate sends to leads already in a sequence.
3.  **TIME WINDOW ENFORCEMENT**: 9 AM - 5 PM Eastern ONLY - block execution outside hours.
4.  **MANUAL OPERATION ONLY**: The scheduler workflow must remain disconnected from any automatic cron/schedule trigger.
5.  **AUTOMATED PIPELINE CLEANUP**: Two Airtable automations are in place to automatically clear the `{SMS Batch Control}` field for leads that are "Complete" or "Stopped", ensuring the pipeline remains clean.

### **MANDATORY CODE PATTERNS**
**"Prepare Text (A/B)" Node Must Include:**
```javascript
// TIME WINDOW CHECK (9 AM - 5 PM Eastern)
const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
const currentHour = easternTime.getHours();
if (!isTestMode && (currentHour < 9 || currentHour >= 17)) {
  return []; // BLOCK execution outside hours
}

// 24-HOUR DUPLICATE PREVENTION (ONLY FOR POS > 0)
if (pos > 0 && last) {
  const msSinceLastSend = nowMs - new Date(last).getTime();
  if (msSinceLastSend < 24 * 60 * 60 * 1000) {
    continue; // BLOCK duplicate sends
  }
}
```

### **EVIDENCE REQUIREMENTS**
- Execution time < 2 minutes (not 8+ minutes)
- Batch size corresponds exactly to the number of "Active" leads in Airtable.
- No identical timestamps across multiple leads
- Audit table records created successfully
- Debug logs show time window and duplicate prevention working.

### **NEVER AGAIN VIOLATIONS**
❌ **NEVER** enable a cron or schedule trigger on this workflow.  
❌ **NEVER** re-introduce a hard-coded batch size limit to the code.  
❌ **NEVER** bypass the corrected duplicate prevention logic.  
❌ **NEVER** allow unlimited lead processing by changing the Airtable view.  
❌ **NEVER** ignore time window restrictions.  

## 16d. ORIGINAL CREDENTIAL & HTTP NODE SAFETY PROTOCOL
- Never update or overwrite node `credentials` via bulk/API edits. Re‑select in UI (especially OAuth) to avoid silent detachment.
- Never replace whole `parameters` objects on credentialed nodes (Airtable, HTTP, Slack). Update only the specific keys required (e.g., `jsonBody.text`), leaving auth/URL untouched.
- HTTP nodes: keep `method=POST` and the full `url` explicitly set; bulk edits can clear the URL field. Verify visually after each change.
- Airtable v2 (Cloud): preferred UI selection for lists is Resource=Record + Operation=Search. When repairing an existing Airtable node via partial update, it is ALLOWED to set only these keys programmatically: `parameters.operation`, `parameters.base`, `parameters.table`, `parameters.columns.*`, `parameters.columns.matchingColumns`, and `parameters.options.typecast` — provided `credentials` are untouched and `parameters.resource` remains `'record'`. Do NOT replace entire `parameters` objects.
- CRITICAL GOTCHA (n8n Cloud): Bulk/API updates to credentialed nodes (HTTP/Airtable/Slack) can clear credentials and URLs if entire parameter blocks are replaced. Only update specific keys (e.g., `jsonBody.text`). Never modify `credentials`, `resource`, `operation`, or `url` via API on existing nodes.
- After ANY workflow update: immediately verify these nodes still show credentials in UI:
  - `SimpleTexting HTTP` (httpHeaderAuth)
  - `Airtable Update` and any Airtable searches (airtableTokenApi)
  - `SMS Test Notify` (Slack OAuth)
- If any auth/URL is missing, STOP. Rebind creds in UI, re‑run Manual Trigger, then commit a snapshot.
- Evidence gate: include workflow ID, execution ID, and a screenshot/JSON confirming auth+URL fields before declaring success.

### Save‑and‑Reopen Persistence Check (MANDATORY)
- After ANY node or workflow edit (of any type):
  1) Click Save.
  2) Close the node panel.
  3) Hard refresh the editor (Cmd+Shift+R) and reopen the workflow.
  4) Reopen the edited node and visually confirm all parameters, expressions, URL, and authentication are still present.
  5) Only then report the change as applied. If anything reverted, re‑apply in the UI (do NOT rely on API diffs) and repeat steps 1‑4.
- For credentialed nodes (HTTP/Airtable/Slack): also Execute step with a safe test item and attach the raw response (or headers) as persistence evidence.

### 16b. Credentialed Node Edit Playbook (MANDATORY ORDER)
- Default (preferred): In‑place partial edits of existing node parameters. Never touch `credentials`, `authentication`, `resource`, `operation` (except the Airtable allowance below), or `url`. Update only specific leaf keys (e.g., `parameters.columns.value.*`, `parameters.columns.matchingColumns`, `parameters.options.typecast`, `parameters.jsonBody.text`).
- Fallback (UI‑only): If an in‑place partial edit is not possible or causes auth/URL loss, open the node UI, re‑select credentials, re‑apply only the changed fields, Save, close, hard refresh, and re‑open to verify.
- Last resort (new node): Create a NEW node only when changing auth type, changing `resource`/`operation` semantics, or when the node is corrupted. Bind creds in UI, copy only required parameters/expressions, wire in parallel, test, then disable the old.
- JSON body edits: add/update only the specific keys (`jsonBody.text`, `jsonBody.campaignId`, etc.). Never replace the whole body object.
- Evidence: include workflow ID and node name, the exact keys changed, and a post‑refresh UI verification.

### 16c. Airtable Update Mapping Checklist (Cloud v2)
- Resource=Record, Operation=Update.
- Base: app ID (e.g., `app6cU9HecxLpgT0P`). Table: by list (`tbl...`).
- Record selector: `Record ID` expression must resolve from an upstream connected node.
- Fields mapping: use “Define below” → set only fields to update.
- Always set `matchingColumns: ["id"]`. Enable `Typecast: true`.

### 16d. Expression Path Rule
- Avoid red "No path back to node" by referencing items from a directly connected upstream node: use `$items('<Upstream>',0)[$itemIndex].json.field` or when already in the stream, prefer `$json.field`.
- If uncertain, add a bridging Code node to pass through required fields explicitly.

### 16e. Airtable Partial‑Edit Protocol (Cloud v2)
- Scope of allowed programmatic changes on existing Airtable nodes:
  - `parameters.operation` (e.g., ensure `update`, no resource change)
  - `parameters.base` (mode=id + app ID)
  - `parameters.table` (mode=list + tbl ID)
  - `parameters.columns.value.*` (field mappings only)
  - `parameters.columns.matchingColumns` (e.g., `["id"]`)
  - `parameters.options.typecast` (e.g., `true`)
- Forbidden: modifying `credentials`, replacing entire `parameters`, changing `parameters.resource` away from `record`, or clearing the node `url` on HTTP nodes.
- Post‑edit: perform Save‑and‑Reopen Persistence Check and execute a safe test item to confirm mappings persist.
