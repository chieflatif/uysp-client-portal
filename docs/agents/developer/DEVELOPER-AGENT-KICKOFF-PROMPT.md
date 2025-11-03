[AUTHORITATIVE]
Last Updated: 2025-08-08

# 🚀 DEVELOPER AGENT KICKOFF PROMPT (ARCHIVED)

## **EXACT PROMPT FOR DEVELOPER AGENT WINDOW:**

---

```markdown
===== ARCHIVED: See SSOT/backlog/session for current scope =====

MANDATORY STARTUP SEQUENCE:
1. Read .cursorrules/00-CRITICAL-ALWAYS.md
2. Type: "I understand evidence requirements and Context7 + N8N MCP protocols"
3. Run these tool verification checks:

MCP TOOL VERIFICATION REQUIRED (UPDATED TOOLS):
□ Context7 HTTP → Add "use context7" to prompts for n8n documentation accuracy
□ DocFork → Run: npx docfork@latest (should return 66.5K tokens of n8n docs)
□ Exa Search → Confirm API key access: f82c9e48-3488-4468-a9b0-afe595d99c30
□ mcp_n8n_list_workflows → Show available workflows in n8n workspace
□ mcp_n8n_get_workflow wpg9K9s8wlfofv1u → Verify PRE COMPLIANCE workflow status
□ mcp_airtable_list_bases → Confirm Airtable access 
□ mcp_airtable_list_tables appuBf0fTe8tp8ZaF → Show UYSP database structure

CONTEXT LOADED - PROJECT STATUS:
- Building: PDL Company API integration on PRE COMPLIANCE foundation
- Baseline: PRE COMPLIANCE workflow (ID: wpg9K9s8wlfofv1u) - 19 nodes, evidence-based choice
- Foundation: Smart Field Mapper v4.6 at node a3493afa-1eaf-41bb-99ca-68fe76209a29
- Critical: Context7 validation MANDATORY for all n8n node operations

PHASE 1 OBJECTIVE: BASELINE VALIDATION & CLEAN DEVELOPMENT STATE

STEP-BY-STEP VALIDATION:
1. **Verify PRE COMPLIANCE Active Status**:
   - Use: mcp_n8n_get_workflow wpg9K9s8wlfofv1u
   - Confirm: Workflow is active and contains 19 nodes
   - Evidence: Show workflow status and node count

2. **Execute Test Webhook Validation**:
   - Use: mcp_n8n_trigger_webhook_workflow
   - Payload: Standard Kajabi form submission test data
   - Evidence: Execution ID, Smart Field Mapper v4.6 function, Airtable record creation

3. **Review Airtable Clean Development State**:
   - Use: mcp_airtable_list_records for Leads table (limit 10)
   - Verify: Core table structure intact, minimal test data
   - Evidence: Table schemas present, no excessive test records

4. **Smart Field Mapper v4.6 Verification**:
   - Target node: a3493afa-1eaf-41bb-99ca-68fe76209a29
   - Verify: 3-field phone strategy operational
   - Evidence: Field mapping success with webhook test

CRITICAL SUCCESS CRITERIA:
□ Context7 + N8N MCP tools confirmed working
□ PRE COMPLIANCE workflow active with 19 nodes
□ Smart Field Mapper v4.6 processes webhook successfully
□ Airtable record created with normalized fields
□ Clean development state confirmed

TESTING PAYLOAD (Use this exact data):
```json
{
  "name": "Test Developer",
  "email": "dev-test@example.com", 
  "company": "Test Company Inc",
  "phone": "+1-555-0123",
  "job_title": "Software Engineer",
  "website": "https://testcompany.com"
}
```

EVIDENCE COLLECTION (Required after EACH step):
- Tool executed: [Tool name]
- Command used: [Exact command]
- Output received: [Key results]
- Record/Execution IDs: [Specific IDs]
- Status: [Success/Failure with details]

MANDATORY PROTOCOLS:
- ALWAYS use Context7 validation before n8n node operations
- Collect execution IDs for all n8n operations
- Provide Airtable record IDs for all database operations
- Use chunked development: ≤5 operations per chunk
- Wait for PM confirmation between validation phases

CRITICAL PLATFORM REQUIREMENTS:
- Workspace: https://rebelhq.app.n8n.cloud/projects/H4VRaaZhd8VKQANf/
- Airtable Base: appuBf0fTe8tp8ZaF
- Test Mode: Enabled (TEST_MODE=true)
- Cost Tracking: Daily_Costs table monitoring

BEGIN ONLY AFTER: Tool verification shows all systems operational

EXPECTED COMPLETION: 
- PRE COMPLIANCE baseline validated and active
- Clean development state confirmed  
- Ready for PDL Company API integration phase
- All evidence collected and documented

===== END DEVELOPER AGENT PROMPT =====
```

---

## **CONTEXT ATTACHMENT INSTRUCTIONS:**

### **MANDATORY FILES TO ATTACH IN DEVELOPER AGENT WINDOW:**

1. **PRIMARY**: `.cursorrules/00-CRITICAL-ALWAYS.md` (194 lines)
2. **CONTEXT**: `context/session-developer-pdl/README.md` (105 lines)  
3. **REFERENCE**: `DEVELOPER-AGENT-HANDOVER-PACKAGE.md` (209 lines)
4. **VALIDATION**: `HANDOVER-VALIDATION-CHECKLIST.md`

### **SESSION CONTEXT ALREADY PREPARED:**
- ✅ Developer context folder: `context/session-developer-pdl/`
- ✅ Handover package: Complete with tool requirements
- ✅ Validation checklist: Evidence-based verification steps

---

## **HUMAN KICKOFF INSTRUCTIONS:**

### **1. Open New Cursor AI Window**
### **2. Attach Required Files (drag & drop):**
```
.cursorrules/00-CRITICAL-ALWAYS.md
context/session-developer-pdl/README.md
DEVELOPER-AGENT-HANDOVER-PACKAGE.md
HANDOVER-VALIDATION-CHECKLIST.md
```

### **3. Paste Complete Prompt Above**
### **4. Wait for Tool Verification Results**
### **5. Confirm All Systems Green Before PDL Development**

**DEVELOPMENT AGENT WILL VALIDATE:**
- ✅ Context7 + N8N MCP tool access
- ✅ PRE COMPLIANCE workflow active status  
- ✅ Smart Field Mapper v4.6 operational
- ✅ Airtable clean development state
- ✅ Ready for PDL Company API integration

**NEXT PHASE**: PDL Company API integration on validated PRE COMPLIANCE foundation