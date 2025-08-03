# CRITICAL RULES - ALWAYS ACTIVE

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
4. Check memory_bank/active_context.md for current state
5. Check patterns/00-field-normalization-mandatory.txt exists
6. Verify MCP tools with: n8n-mcp list_workflows
7. **CRITICAL**: Ensure n8n operations target PROJECT workspace: H4VRaaZhd8VKQANf ONLY
8. **BEFORE ANY NODE CREATION: Check context/platform-gotchas/n8n-platform-gotchas-complete.md**

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

// Step 2: Use n8n MCP tools for schema validation
mcp_n8n_get_node_essentials({ nodeType: "nodes-base.httpRequest" })

// Step 3: Execute proven MCP update pattern
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
