# 🛠️ UYSP MCP TOOL SPECIFICATIONS - COMPLETE SYSTEM

**Date**: January 27, 2025  
**Status**: SYSTEMATICALLY UPDATED  
**Project**: UYSP Lead Qualification System  

---

## 🎯 **EXECUTIVE SUMMARY**

Updated MCP tool configuration for UYSP Lead Qualification System development. **Context7 migrated from STDIO to HTTP endpoint** with enhanced tool suite including DocFork and Exa Search integration.

**KEY CHANGES:**
- ✅ Context7: STDIO → HTTP (https://context7.liam.sh/mcp)  
- ✅ DocFork: Added for latest n8n documentation (66.5K tokens)
- ✅ Exa Search: Added with API key for implementation research
- ✅ Tool precedence hierarchy established
- ✅ Context7 role clarified: Documentation helper (NOT workflow validator)

---

## 🔧 **CORE MCP TOOL SPECIFICATIONS**

### **1. CONTEXT7 HTTP** 
**Tool ID**: `context7-http`  
**URL**: `https://context7.liam.sh/mcp`  
**Tools**: `resolve-library-id`, `get-library-docs`

**WHEN TO USE**:
- ✅ Before creating/modifying ANY n8n nodes
- ✅ When building PDL API integration nodes  
- ✅ For version-specific library documentation (n8n, PDL APIs)
- ✅ To prevent deprecated API usage in workflows

**HOW TO USE**:
```
1. Add "use context7" to prompts for documentation accuracy
2. Example: "Create n8n workflow with Airtable nodes. use context7"
3. Tools work via HTTP endpoint, not direct MCP calls
```

**PROJECT-SPECIFIC USAGE**:
- **PDL Integration**: Validate PDL Company API and Person API specifications
- **n8n Node Creation**: Ensure current n8n node parameters and schemas
- **Smart Field Mapper**: Validate field mapping specifications for v4.6 compatibility

### **2. DOCFORK**
**Tool ID**: `docfork`  
**Command**: `npx docfork@latest`

**WHEN TO USE**:
- ✅ When Context7 lacks coverage for specific libraries
- ✅ For daily-updated n8n documentation (66.5K tokens updated every 16 hours)
- ✅ When building workflows requiring latest best practices
- ✅ For current community patterns and examples

**PROJECT-SPECIFIC USAGE**:
- **n8n Workflow Enhancement**: Latest n8n node configurations and patterns
- **Best Practices**: Current workflow optimization techniques
- **Community Solutions**: Recent solutions for UYSP-like use cases

### **3. EXA SEARCH**
**Tool ID**: `exa`  
**API Key**: `f82c9e48-3488-4468-a9b0-afe595d99c30`

**WHEN TO USE**:
- ✅ Research PDL API implementation patterns
- ✅ Find integration examples for Apollo → PDL migration
- ✅ Discover SMS compliance requirements (10DLC, TCPA)
- ✅ Secondary research when primary tools lack coverage

**PROJECT-SPECIFIC USAGE**:
- **PDL Research**: Implementation patterns for Company and Person APIs
- **Compliance Research**: TCPA and 10DLC SMS requirements
- **Architecture Research**: Similar lead qualification system patterns

### **4. N8N MCP SUITE** (39 TOOLS)
**Tool IDs**: `mcp_n8n_*` (comprehensive n8n management suite)

**MANDATORY USAGE SEQUENCE**:
```
1. mcp_n8n_list_workflows → Identify target workflow
2. mcp_n8n_get_workflow → Analyze current structure  
3. mcp_n8n_validate_workflow → Pre-modification validation
4. mcp_n8n_n8n_update_partial_workflow → Make changes (≤5 operations)
5. mcp_n8n_validate_workflow → Post-modification validation
6. mcp_n8n_n8n_get_execution → Collect evidence
```

**CRITICAL PROTOCOLS**:
- **≤5 Operations Per Chunk**: Mandatory chunking with user confirmation waits
- **Evidence Collection**: All operations must capture execution IDs and validation results
- **NO MANUAL JSON**: All workflow operations through N8N MCP tools only
- **Baseline Preservation**: PRE COMPLIANCE workflow (wpg9K9s8wlfofv1u) must remain functional

**PROJECT-SPECIFIC USAGE**:
- **PDL Integration**: Add Company API and Person API nodes to PRE COMPLIANCE baseline
- **Smart Field Mapper**: Preserve existing v4.6 functionality while enhancing
- **Cost Tracking**: Extend existing Daily_Costs system for PDL API calls
- **Validation**: Use comprehensive 5-layer testing architecture

### **5. AIRTABLE MCP SUITE** (13 TOOLS)
**Tool IDs**: `mcp_airtable_*`

**USAGE PROTOCOLS**:
- **mcp_airtable_get_record**: Verify lead record creation and updates
- **mcp_airtable_list_records**: Monitor Daily_Costs and lead status
- **mcp_airtable_update_records**: Batch lead qualification updates
- **mcp_airtable_describe_table**: Validate schema compatibility

**PROJECT-SPECIFIC USAGE**:
- **Lead Verification**: Confirm webhook → Airtable integration success
- **Cost Monitoring**: Track PDL API costs in Daily_Costs table
- **Schema Validation**: Ensure 11-table structure maintained
- **Evidence Collection**: Record IDs for all test validations

### **6. CLAUDE CODE SERVER MCP SUITE**
**Tool IDs**: `mcp_claude-code-server_*`

**WHEN TO USE (FALLBACK ONLY)**:
- ❌ **NOT for primary development** - use N8N MCP tools first
- ✅ Code execution when N8N MCP tools fail
- ✅ Terminal commands for npm workflows (start-work, branch, real-backup)
- ✅ Testing script execution and file analysis

**MANDATORY PROTOCOL**:
```
1. ALWAYS announce switch to Claude Code Server
2. State reason why N8N MCP tools insufficient
3. Execute specific task only
4. Return to N8N MCP tools for main workflow operations
```

**PROJECT-SPECIFIC USAGE**:
- **Testing Execution**: Run comprehensive test suites when needed
- **Git Operations**: Execute npm run real-backup and branching
- **Evidence Collection**: Analyze test results and execution logs

---

## 🔄 **TOOL PRECEDENCE HIERARCHY**

### **For n8n Workflow Operations**:
1. **N8N MCP Suite** (primary) → All workflow CRUD operations
2. **Context7 HTTP** (documentation) → API specifications via "use context7" prompts  
3. **DocFork** (enhancement) → Latest patterns: npx docfork@latest
4. **Claude Code Server** (fallback only) → When MCP tools fail

### **For Project Research**:
1. **Context7 HTTP** → Specific library documentation via prompts
2. **DocFork** → Current community knowledge (66.5K tokens)
3. **Exa Search** → Broader pattern research with API key

### **For Data Operations**:
1. **Airtable MCP Suite** → All database operations
2. **N8N MCP Suite** → Integration testing
3. **Claude Code Server** → Evidence analysis only

---

## 📋 **EVIDENCE & VALIDATION REQUIREMENTS**

### **Mandatory Evidence Collection**:
```
✅ N8N Execution IDs: For all workflow operations
✅ Airtable Record IDs: For all database operations  
✅ Context7 Validation: Documentation accuracy confirmed via prompts
✅ Cost Tracking: PDL API call costs recorded
✅ Test Results: Success rates and failure analysis
```

### **Quality Gates**:
1. **Component Level**: Individual API validation with Context7 HTTP documentation
2. **Integration Level**: End-to-end n8n → Airtable → SMS validation
3. **Performance Level**: Cost tracking and execution time metrics  
4. **Business Level**: Lead qualification accuracy and conversion rates

---

## 🚨 **ENFORCEMENT PROTOCOLS**

### **Chunking Requirements**:
- **Maximum**: ≤5 operations per chunk
- **User Confirmation**: Required between chunks
- **Evidence Block**: Mandatory at chunk completion
- **Validation**: Tool-verified results before proceeding

### **Failure Recovery**:
```
IF N8N MCP FAILS → Try alternative N8N MCP tools → Use Claude Code Server (announce switch)
IF Context7 FAILS → Use DocFork → Use Exa Search → Proceed with caution
IF Airtable MCP FAILS → Verify connection → Use Claude Code Server for verification
```

### **Project-Specific Constraints**:
- **PRE COMPLIANCE Baseline**: Must remain functional throughout development
- **Smart Field Mapper v4.6**: Cannot be modified without extensive testing
- **Daily Cost Limits**: $50 budget enforcement through DAILY_COST_LIMIT
- **Testing Requirements**: All changes require 5-layer testing architecture validation

---

## 📊 **MIGRATION SUMMARY**

### **Files Updated (17 total)**:
✅ `.cursorrules/PM/PM-MASTER-GUIDE.md` - Complete MCP tool specifications updated  
✅ `docs/pdl-architecture/PDL-MASTER-ARCHITECTURE.md` - Tool requirements updated
✅ `DEVELOPER-AGENT-HANDOVER-PACKAGE.md` - Verification commands updated
✅ `DEVELOPER-AGENT-KICKOFF-PROMPT.md` - Tool checklist updated
✅ `context/session-developer-pdl/README.md` - Developer context updated
✅ `HANDOVER-VALIDATION-CHECKLIST.md` - Validation protocol updated
✅ `PRODUCTION-READINESS-ASSESSMENT.md` - Tool reference corrected
✅ `memory_bank/active_context.md` - Tool status updated

### **Key Changes**:
- ❌ **Removed**: All `mcp_context7_*` function call references
- ✅ **Added**: Context7 HTTP endpoint specifications  
- ✅ **Added**: DocFork tool for n8n documentation
- ✅ **Added**: Exa Search with API key
- ✅ **Updated**: Tool precedence hierarchy
- ✅ **Clarified**: Context7 role as documentation helper (NOT validator)

---

## 🎯 **DEVELOPER AGENT READY**

**ALL DOCUMENTATION SYSTEMATICALLY UPDATED**

The UYSP Lead Qualification System is now equipped with complete, accurate MCP tool specifications. Developer Agent can proceed with PDL integration development using:

1. **Context7 HTTP** for documentation accuracy via prompts
2. **DocFork** for latest n8n patterns and community knowledge  
3. **Exa Search** for implementation research
4. **N8N MCP Suite** for all workflow operations
5. **Airtable MCP Suite** for database operations
6. **Evidence-based validation** with 5-layer testing architecture

**PROJECT MANAGER HANDOVER COMPLETE** - All MCP tool documentation systematically updated and aligned.