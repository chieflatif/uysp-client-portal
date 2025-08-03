# 🔧 SYSTEMATIC TROUBLESHOOTING FRAMEWORK
## **TOOL-BASED, EVIDENCE-DRIVEN, ROOT-CAUSE METHODOLOGY**

**Date**: January 27, 2025  
**Purpose**: Eliminate guesswork, prevent whack-a-mole, ensure systematic root cause analysis  
**Foundation**: MCP tools + evidence collection + holistic system mapping  

---

## **🚨 CRITICAL PRINCIPLES**

### **ANTI-WHACK-A-MOLE PROTOCOLS**
1. **NO SYMPTOM FIXING**: Always identify root cause before implementing solutions
2. **SYSTEM MAPPING FIRST**: Map ALL connected components before investigating
3. **HYPOTHESIS TRACKING**: Log every theory with evidence status
4. **MULTI-SOURCE VALIDATION**: Gather data from ≥3 independent sources
5. **TOOL-BASED EVIDENCE**: Use MCP tools for data collection, never assumptions

### **EVIDENCE-BASED INVESTIGATION**
- **NO GUESSING**: Every claim must be backed by tool-generated evidence
- **NO EUREKA MOMENTS**: Root cause requires systematic validation
- **NO QUICK FIXES**: Understanding the system before proposing solutions
- **NO COMPLETION CLAIMS**: Without comprehensive evidence verification

---

## **🔍 SYSTEMATIC DEBUGGING PROCESS (MANDATORY)**

### **PHASE 1: SYSTEM MAPPING & PREPARATION**

#### **Step 1.1: Complete System Component Map**
```markdown
SYSTEM MAP TEMPLATE:
| Component | Status | Last Modified | Dependencies | Health Check |
|-----------|--------|---------------|--------------|--------------|
| n8n Workflow | [Tool check] | [Version ID] | [List deps] | [mcp_n8n_get_workflow] |
| Airtable Base | [Tool check] | [Schema version] | [Table IDs] | [mcp_airtable_list_tables] |
| Webhook URL | [Tool check] | [Last tested] | [n8n dependency] | [curl test] |
| MCP Tools | [Tool check] | [Validation run] | [All 54 tools] | [Tool audit] |
| Smart Field Mapper | [Tool check] | [Node version] | [Code version] | [Code review] |
```

#### **Step 1.2: Hypothesis Log Initialization**
```markdown
HYPOTHESIS LOG TEMPLATE:
| # | Description | Evidence For | Evidence Against | Status | Next Test |
|---|-------------|--------------|------------------|--------|-----------|
| 1 | [Theory description] | [Tool results] | [Contradicting data] | [Testing/Validated/Refuted] | [Specific MCP tool] |
| 2 | [Alternative theory] | [Tool results] | [Contradicting data] | [Testing/Validated/Refuted] | [Specific MCP tool] |
```

#### **Step 1.3: Investigation Scope Definition**
- **Problem Statement**: [Exact description with timestamps]
- **Affected Components**: [Based on system map]
- **Reproduction Steps**: [Exact sequence]
- **Expected vs Actual**: [Specific differences]

---

### **PHASE 2: TOOL-BASED DATA COLLECTION**

#### **Step 2.1: Primary Evidence Gathering**
**MANDATORY: Use MCP tools for all data collection**

**n8n Workflow Analysis:**
```bash
# Use these MCP tools systematically:
mcp_n8n_n8n_get_workflow(id: workflow_id)
mcp_n8n_n8n_get_workflow_details(id: workflow_id)
mcp_n8n_n8n_list_executions(workflowId: workflow_id, limit: 10)
mcp_n8n_n8n_get_execution(id: last_execution_id, includeData: true)
```

**Airtable Data Analysis:**
```bash
# Use these MCP tools systematically:
mcp_airtable_list_bases()
mcp_airtable_describe_table(baseId: base_id, tableId: table_id)
mcp_airtable_search_records(baseId: base_id, tableId: table_id, searchTerm: test_email)
mcp_airtable_get_record(baseId: base_id, tableId: table_id, recordId: record_id)
```

**Field Mapping Analysis:**
```bash
# Use these tools for code analysis:
read_file(patterns/exported/smart-field-mapper-v4.6-grok.js)
grep_search(pattern: "field.*mapping", include_pattern: "workflows/**/*.json")
codebase_search(query: "field normalization errors in workflow")
```

#### **Step 2.2: Cross-Reference Validation**
**Validate findings across multiple independent sources:**
1. **Source 1**: MCP tool data
2. **Source 2**: n8n execution logs
3. **Source 3**: Airtable record state
4. **Source 4**: Test payload comparison
5. **Source 5**: Code analysis results

#### **Step 2.3: Pattern Analysis**
```markdown
PATTERN ANALYSIS TEMPLATE:
| Pattern Type | Frequency | Components Affected | Tool Evidence | Root Cause Hypothesis |
|--------------|-----------|---------------------|---------------|----------------------|
| Error Timing | [When occurs] | [Which components] | [MCP tool output] | [Theory] |
| Data Flow Issues | [Where breaks] | [Flow points] | [Execution data] | [Theory] |
| Field Mapping Issues | [Which fields] | [Mapper/Airtable] | [Record comparison] | [Theory] |
```

---

### **PHASE 3: HYPOTHESIS TESTING & VALIDATION**

#### **Step 3.1: Systematic Hypothesis Testing**
**For each hypothesis, perform ≥2 independent tests:**

**Test Design Template:**
```markdown
HYPOTHESIS: [Description]
TEST 1: [Specific tool-based test]
- Tool: [Exact MCP tool]
- Parameters: [Exact parameters]
- Expected Result: [Specific prediction]
- Actual Result: [Tool output]
- Evidence Status: [For/Against/Neutral]

TEST 2: [Different approach to same hypothesis]
- Tool: [Different MCP tool]
- Parameters: [Exact parameters]
- Expected Result: [Specific prediction]
- Actual Result: [Tool output]
- Evidence Status: [For/Against/Neutral]
```

#### **Step 3.2: Alternative Explanation Testing**
**MANDATORY: Rule out ≥2 alternative explanations before concluding**

**Alternative Testing Template:**
```markdown
PRIMARY HYPOTHESIS: [Main theory]
ALTERNATIVE 1: [Different explanation]
- Ruling Out Test: [Specific MCP tool test]
- Result: [Evidence for/against]

ALTERNATIVE 2: [Different explanation]
- Ruling Out Test: [Specific MCP tool test]
- Result: [Evidence for/against]

ALTERNATIVE 3: [Different explanation]
- Ruling Out Test: [Specific MCP tool test]
- Result: [Evidence for/against]
```

---

### **PHASE 4: ROOT CAUSE VALIDATION & SOLUTION**

#### **Step 4.1: Root Cause Validation Requirements**
**Before claiming root cause identification:**
- [ ] ≥3 independent tool sources confirm the same issue
- [ ] ≥2 alternative explanations ruled out with evidence
- [ ] System mapping shows clear component relationship
- [ ] Reproduction steps consistently trigger the same root cause
- [ ] Solution addresses the root cause, not symptoms

#### **Step 4.2: Solution Design Protocol**
```markdown
SOLUTION DESIGN TEMPLATE:
ROOT CAUSE: [Validated cause]
PROPOSED SOLUTION: [Specific action]
COMPONENT CHANGES: [Exact modifications]
VALIDATION PLAN: [How to test fix]
ROLLBACK PLAN: [If solution fails]
SUCCESS CRITERIA: [Measurable outcomes]
```

#### **Step 4.3: Implementation & Evidence Collection**
**Every solution implementation must:**
1. **Use MCP tools for changes**: `mcp_n8n_n8n_update_partial_workflow`
2. **Collect before/after evidence**: Version IDs, execution comparisons
3. **Test with original reproduction steps**: Exact same test that revealed issue
4. **Validate across all affected components**: Full system verification

---

## **🧰 TROUBLESHOOTING TOOL PROTOCOLS**

### **MCP Tool Audit Sequence**
**When investigating any issue, run this systematic audit:**

```bash
# 1. Verify MCP Tool Connectivity
mcp_n8n_n8n_health_check()
mcp_airtable_list_bases()

# 2. Workflow State Analysis
mcp_n8n_n8n_get_workflow_details(id: "wpg9K9s8wlfofv1u")
mcp_n8n_n8n_list_executions(workflowId: "wpg9K9s8wlfofv1u", limit: 5)

# 3. Data State Analysis
mcp_airtable_describe_table(baseId: "appuBf0fTe8tp8ZaF", tableId: "tblMain")
mcp_airtable_search_records(baseId: "appuBf0fTe8tp8ZaF", tableId: "tblMain", searchTerm: "test")

# 4. Code State Analysis
read_file("patterns/exported/smart-field-mapper-v4.6-grok.js")
grep_search(pattern: "error|Error|ERROR", include_pattern: "workflows/**/*.json")
```

### **Evidence Collection Standards**
**Every troubleshooting investigation must collect:**

```markdown
MANDATORY EVIDENCE COLLECTION:
□ System component health status (all MCP tools)
□ Workflow execution IDs and timestamps
□ Airtable record states (before/during/after)
□ Error messages with exact timestamps
□ Code versions and modification dates
□ Test payload and expected vs actual results
□ Network/connectivity status
□ Environment variable states
```

### **Anti-Hallucination Protocols**
**FORBIDDEN troubleshooting behaviors:**
❌ **"I think the issue might be..."** (Use tools to verify)
❌ **"The problem is probably..."** (Gather evidence first)
❌ **"Let's try changing..."** (Map system and hypothesize first)
❌ **"This usually means..."** (Every system is unique)
❌ **"Quick fix approach"** (Root cause analysis required)

**REQUIRED troubleshooting behaviors:**
✅ **"Evidence shows..."** (Based on MCP tool output)
✅ **"System map indicates..."** (Based on comprehensive component analysis)
✅ **"Testing hypothesis that..."** (Based on systematic investigation)
✅ **"Validation confirms..."** (Based on multiple independent sources)

---

## **📊 INVESTIGATION DOCUMENTATION**

### **Mandatory Investigation Report Format**
```markdown
# INVESTIGATION REPORT: [Issue Description]

## SYSTEM MAP COMPLETENESS: [X%]
| Component | Status | Health | Evidence Source |
|-----------|--------|--------|-----------------|
[Complete system component table]

## HYPOTHESIS LOG: [X tested / Y validated / Z refuted]
| # | Description | Evidence For | Evidence Against | Status |
|---|-------------|--------------|------------------|--------|
[Complete hypothesis tracking table]

## EVIDENCE SOURCES: [List 3+ independent sources]
1. MCP Tool: [Specific tool and output]
2. System State: [Specific component analysis]
3. Historical Data: [Comparison/pattern analysis]

## INVESTIGATION STEPS: [Numbered list with actual results]
1. [Step with tool used and exact result]
2. [Step with tool used and exact result]
...

## FINDINGS: [100% evidence-based only]
- Root Cause: [If validated with 3+ sources]
- Contributing Factors: [Evidence-backed factors]
- System Impact: [Measured/observed impact]

## NEXT STEPS: [User-actionable list]
1. [Specific action with success criteria]
2. [Specific action with success criteria]

## HONESTY CHECK: [100% evidence-based / Assumptions: list]
- Evidence Gap: [Any areas requiring more investigation]
- Validation Status: [What still needs confirmation]
```

---

## **🔄 ITERATIVE IMPROVEMENT PROTOCOL**

### **Troubleshooting Pattern Analysis**
**After each investigation, update these patterns:**
```markdown
FAILURE PATTERN TRACKING:
| Previous Issue | Root Cause | Why Missed Initially | System Component | Prevention |
|----------------|------------|---------------------|------------------|------------|
[Track pattern evolution]
```

### **Tool Effectiveness Analysis**
```markdown
TOOL EFFECTIVENESS TRACKING:
| MCP Tool | Investigation Value | Evidence Quality | Time Investment | Recommendation |
|----------|-------------------|------------------|-----------------|----------------|
[Track which tools provide best investigation value]
```

### **Investigation Quality Metrics**
- **Time to Root Cause**: [Hours from issue report to validated cause]
- **False Positive Rate**: [% of initial hypotheses that proved incorrect]
- **Evidence Source Count**: [Average number of independent sources used]
- **Solution Success Rate**: [% of solutions that resolved root cause]

---

## **✅ TROUBLESHOOTING SUCCESS CRITERIA**

**An investigation is complete when:**
- [ ] System map covers ≥95% of potentially affected components
- [ ] ≥3 independent tool sources provide evidence
- [ ] ≥2 alternative explanations ruled out with tool evidence
- [ ] Root cause can be reproduced consistently
- [ ] Solution addresses root cause (not symptoms)
- [ ] Solution validated with original reproduction steps
- [ ] Full investigation documented with evidence links

**NEVER claim "investigation complete" without meeting ALL criteria.**

---

**FRAMEWORK STATUS**: 🚧 **INTEGRATION REQUIRED**  
**NEXT**: Embed in Testing Agent context engineering and testing protocols