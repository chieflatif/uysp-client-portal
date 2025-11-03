[AUTHORITATIVE]
Last Updated: 2025-08-09

> This is a platform‑specific annex focused on MCP contamination. The master context engineering SSOT is `.cursorrules/CONTEXT-ENGINEERING-STANDARD.md`. Follow the SSOT in all responses; use this file only for MCP‑specific constraints.

# DEVELOPER AGENT MCP CONTAMINATION PREVENTION
## **MANDATORY BOUNDARIES FOR ALL DEVELOPMENT WORK**

### 🚨 **CRITICAL REFERENCE**
**GLOBAL PROTOCOL**: `.cursorrules/GLOBAL-MCP-CONTAMINATION-PREVENTION.md`
**HISTORICAL EVIDENCE**: 67 files deleted in massive contamination cleanup
**TECHNICAL TRUTH**: MCP tools CANNOT be embedded in scripts

---

## **🔒 DEVELOPER AGENT SPECIFIC RESTRICTIONS**

### **ABSOLUTE TECHNICAL BOUNDARIES**
- ❌ **NEVER write code** that claims to embed MCP tools
- ❌ **NEVER create scripts** that promise MCP tool integration  
- ❌ **NEVER suggest** embedding MCP tools in Node.js/JavaScript/Python
- ❌ **NEVER promise** automation that requires MCP tools in scripts

### **MANDATORY SEPARATION OF CONCERNS**
```markdown
SCRIPTS DOMAIN (Developer Agent Creates):
- Node.js test runners
- Webhook trigger scripts  
- Data processing utilities
- Configuration files

MCP TOOLS DOMAIN (AI Agent Uses Separately):
- Workflow analysis (mcp_n8n_*)
- Database verification (mcp_airtable_*)
- System validation tools
- Evidence collection

NEVER MIX THESE DOMAINS
```

### **CORRECT DEVELOPMENT PATTERNS**
- ✅ **Create independent scripts** that generate results
- ✅ **AI agent uses MCP tools SEPARATELY** to analyze script outputs
- ✅ **Orchestration model**: Scripts → Results → MCP Analysis → Coordination
- ✅ **Clear boundaries**: Script execution ≠ MCP tool analysis

---

## **📋 PRE-DEVELOPMENT CONTAMINATION CHECK**

### **BEFORE WRITING ANY CODE**
```markdown
MANDATORY VERIFICATION:
1. Does this code claim MCP tool integration? → BLOCK
2. Does this promise impossible automation? → BLOCK  
3. Does this maintain separation of concerns? → PROCEED
4. Does this require human/AI coordination for MCP tools? → PROCEED
```

### **FORBIDDEN CODE PATTERNS**
```javascript
❌ // Import MCP tools (IMPOSSIBLE)
❌ const mcpTools = require('mcp-tools');
❌ // Call MCP tools from script (IMPOSSIBLE)  
❌ await mcpTools.n8n_get_workflow();
❌ // Promise embedded automation (VIOLATION)
❌ "This script will use MCP tools automatically"
```

### **CORRECT CODE PATTERNS**
```javascript
✅ // Independent script execution
✅ const results = await executeWebhookTest(payload);
✅ console.log('Results ready for MCP analysis:', results);
✅ // Note: AI agent will use MCP tools separately to analyze results
```

---

## **🎯 DEVELOPMENT WORKFLOW COMPLIANCE**

### **Phase 1: Script Development**
- Developer Agent creates independent scripts
- Scripts execute without MCP dependencies
- Results saved to files/logs for analysis

### **Phase 2: AI Orchestration**  
- AI agent executes scripts (or coordinates human execution)
- AI agent uses MCP tools SEPARATELY to analyze results
- AI coordinates human validation where needed

### **Phase 3: Evidence Collection**
- MCP tools gather evidence independently
- AI provides systematic analysis
- Human validates findings

**NEVER COMBINE THESE PHASES IN CODE**

---

## **⚠️ EMERGENCY CONTAMINATION RESPONSE**

### **IF CONTAMINATION DETECTED IN DEVELOPMENT**
1. **IMMEDIATE HALT** - Stop all development
2. **REFERENCE GLOBAL PROTOCOL** - Load contamination prevention
3. **CORRECT APPROACH** - Use proper separation of concerns
4. **PM AGENT COORDINATION** - Report contamination prevention applied
5. **PROCEED ONLY** - When boundaries clearly established

---

**DEVELOPER CONTAMINATION PREVENTION**: ✅ **MANDATORY COMPLIANCE**  
**REFERENCE**: Global contamination prevention protocol  
**ENFORCEMENT**: Pre-development checks required  
**BOUNDARIES**: Scripts ≠ MCP Tools ≠ AI Analysis  

This ensures Developer Agent never recreates the contamination patterns that required massive cleanup (67 files deleted, 21% reduction).