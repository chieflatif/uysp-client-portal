# UI-Only Settings vs MCP-Controllable Settings
**UPDATED: Post-Investigation Protocol**

## 🚨 CONFIRMED UI-ONLY SETTINGS

### 1. "Always Output Data" Toggle  
**Status**: REQUIRES INVESTIGATION - NOT CONFIRMED UI-ONLY
**Location**: Settings tab in IF/Switch nodes  
**TODO**: Test if `alwaysOutputData: true` parameter works via MCP  
**Current Workaround**: Manual UI toggle  

### 2. Credential Re-selection After MCP Updates
**Status**: CONFIRMED UI-ONLY  
**Issue**: MCP workflow updates null credential references  
**Evidence**: Credential IDs stored separately from workflow JSON  
**Workaround**: Re-select credentials via UI dropdown after MCP updates  

## ✅ MCP-CONTROLLABLE (PREVIOUSLY MISUNDERSTOOD)

### 1. Airtable Field Expression Mode
**Status**: MCP CAN CONTROL  
**Method**: Use double equals format in dot notation  
**Example**: `"parameters.columns.value.created_date": "={{$now}}"`  
**Previous Error**: Claimed this was UI-only due to insufficient investigation  

## 🔍 INVESTIGATION REQUIRED

**Before adding anything to "UI-Only" list:**
1. **Test multiple dot notation approaches**
2. **Check full MCP documentation** 
3. **Verify parameter exists in node schema**
4. **Test with simple values first**
5. **Get evidence of MCP failure** before claiming limitation

## 🛡️ UPDATED PROTOCOL

**Default Assumption**: MCP tools CAN control it until proven otherwise with evidence  
**Investigation First**: Always try MCP solutions before manual workarounds  
**Evidence Required**: Show attempted MCP calls and specific error responses  
**Documentation**: Update this file ONLY after thorough investigation proves UI-only requirement 