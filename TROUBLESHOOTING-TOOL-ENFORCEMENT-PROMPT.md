# 🚨 STOP LYING - IT'S NOT WORKING

## **FORBIDDEN SUCCESS CLAIMS**

### **❌ NEVER SAY THESE WITHOUT PROOF:**
- "It's working perfectly"
- "The configuration looks correct"
- "Everything is set up properly"
- "The workflow is functioning as expected"
- "No issues detected"

## **MANDATORY PROOF BEFORE ANY SUCCESS CLAIM**

### **1. EXECUTION EVIDENCE (REQUIRED)**
```
✅ MUST SHOW: Recent execution ID with SUCCESS status
✅ MUST SHOW: Execution timestamp within last 5 minutes
✅ MUST SHOW: Complete execution data from mcp_n8n_n8n_get_execution
❌ FORBIDDEN: Claiming success without execution ID
```Just give it to me as plain text

### **2. AIRTABLE VERIFICATION (REQUIRED)**
```
✅ MUST SHOW: Actual record ID created/updated
✅ MUST SHOW: Field values from mcp_airtable_get_record
✅ MUST SHOW: Record timestamp matching execution
❌ FORBIDDEN: Assuming data was saved without verification
```

### **3. DOCUMENTATION RESEARCH (REQUIRED)**
```
✅ MUST USE: Context7 "use context7" for current n8n documentation
✅ MUST USE: mcp_n8n_get_node_documentation for exact node schemas
✅ MUST USE: mcp_n8n_search_nodes to find correct node types
✅ MUST SHOW: Documentation evidence proving your configuration is correct
❌ FORBIDDEN: Guessing node parameters without documentation lookup
```

### **4. WORKFLOW VALIDATION (REQUIRED)**
```
✅ MUST SHOW: mcp_n8n_validate_workflow output with ZERO errors
✅ MUST SHOW: Current workflow state from mcp_n8n_n8n_get_workflow
❌ FORBIDDEN: Claiming "no errors" without validation tool
```

## **ENFORCEMENT PROTOCOL**

### **IF YOU CLAIM SUCCESS WITHOUT PROOF:**
1. **STOP IMMEDIATELY**
2. **RUN THE TOOLS**
3. **SHOW THE EVIDENCE**
4. **ADMIT IF IT'S ACTUALLY BROKEN**

### **REQUIRED EVIDENCE FORMAT:**
EXECUTION PROOF:
- ID: [execution_id]
- Status: [success/error]
- Timestamp: [exact_time]

AIRTABLE PROOF:
- Record ID: [record_id]
- Fields Updated: [field_list]
- Values: [actual_values]

DOCUMENTATION PROOF:
- Context7 output: [copy/paste documentation]
- Node schema: [exact parameters from mcp_n8n_get_node_documentation]
- Configuration match: [prove your config matches schema]

VALIDATION PROOF:
- Errors: [zero_or_list_errors]
- Warnings: [any_warnings]

## **ABSOLUTE REQUIREMENTS**

1. **NO SUCCESS CLAIMS** without execution ID + record ID + documentation + validation
2. **USE DOCUMENTATION TOOLS FIRST** - Context7, node docs, search before configuring
3. **SHOW EVIDENCE** - copy/paste ALL tool outputs
4. **PROVE CONFIGURATION MATCHES SCHEMA** - show documentation vs your config
5. **ADMIT FAILURES** when tools show errors

**STOP GUESSING - RESEARCH FIRST - PROVE IT WORKS**