# 🚨 STOP - YOU'RE VIOLATING CORE PROTOCOLS

## **MANDATORY TOOL USAGE (NON-NEGOTIABLE)**

### **1. CONTEXT7 FIRST (ALWAYS)**
- Add "use context7" to prompts BEFORE creating any n8n nodes
- Get current node documentation to prevent outdated configurations

### **2. N8N MCP TOOLS ONLY**
- `mcp_n8n_n8n_get_workflow(wpg9K9s8wlfofv1u)` - Check current state FIRST
- `mcp_n8n_n8n_update_partial_workflow` - Make ALL workflow changes via MCP
- `mcp_n8n_validate_workflow` - Validate before claiming success
- **❌ FORBIDDEN**: Manual JSON creation

### **3. EVIDENCE REQUIRED**
- Execution ID from `mcp_n8n_n8n_get_execution`
- Airtable record ID from `mcp_airtable_search_records`
- **❌ FORBIDDEN**: Claims without tool verification

## **IMMEDIATE ACTIONS REQUIRED**

1. **VERIFY TOOLS NOW**:
   - Context7: Add "use context7" to next prompt
   - N8N MCP: Use `mcp_n8n_n8n_get_workflow(wpg9K9s8wlfofv1u)`
   - Airtable MCP: Use `mcp_airtable_list_bases`

2. **GET WORKFLOW STATE**: Use MCP tools to check PRE COMPLIANCE workflow before making ANY changes

3. **COLLECT EVIDENCE**: Every implementation claim needs execution IDs and record IDs

**NO EXCEPTIONS - USE THE TOOLS OR DEVELOPMENT FAILS**