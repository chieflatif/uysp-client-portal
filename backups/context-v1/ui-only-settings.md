# UI-Only Settings - Cannot Be Automated

## Gotcha #1: "Always Output Data" Toggle
**When**: ALL IF and Switch nodes  
**Location**: Settings tab (NOT Parameters tab)  
**Symptom**: "No output data returned" when condition doesn't match  
**Human Action Required**: Enable toggle manually in UI  
**Cannot**: Set via API, MCP, or JSON import

## Gotcha #2: Credential Selection & Corruption  
**When**: After ANY programmatic workflow update  
**Symptom**: "No authentication data defined on node!"  
**Human Action Required**: Re-select credentials via dropdown  
**Cannot**: Fix via MCP or API  
**Recovery**: Export → Edit JSON → Import → Re-set credentials

## Gotcha #15: Hidden Settings Tab
**Issue**: Settings tab collapsed by default  
**Hidden Options**:
- Always Output Data
- Retry On Fail  
- Timeout settings
- Continue On Fail
**Human Action Required**: Expand Settings tab, configure manually

## Critical UI Workflow
1. **Create node via MCP**
2. **Human opens n8n UI**
3. **Human checks Settings tab**
4. **Human enables "Always Output Data" if IF/Switch**
5. **Human selects credentials if needed**
6. **Test execution** 