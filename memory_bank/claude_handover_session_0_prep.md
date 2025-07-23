# Claude Desktop PM Handover Document
## Session 0 Preparation - Field Normalization Enhancement
*Generated: 2025-01-23 by Claude Desktop PM v6.0*

## 🚨 CRITICAL CONTEXT

### Current Situation
- **Project**: UYSP Lead Qualification System (Automated lead qualification & SMS outreach)
- **Phase**: Between Phase 00 (Infrastructure) and Session 0 (Field Normalization)
- **Status**: Infrastructure operational but Smart Field Mapper needs Session 0 enhancements
- **Workspace**: https://rebelhq.app.n8n.cloud/projects/H4VRaaZhd8VKQANf/

### What Just Happened
The Cursor AI agent claimed Phase 00 was 100% complete, but validation revealed the Smart Field Mapper is only 60% complete for Session 0 requirements. We successfully proved MCP tools work and completed the first field addition (`qualified_lead`).

## 📋 IMMEDIATE PRIORITIES

### Session 0 Requirements Status
**✅ COMPLETED:**
1. Basic field mapping structure
2. Case-insensitive matching
3. Name splitting logic
4. `qualified_lead` field mapping (just added via MCP)

**❌ STILL NEEDED:**
1. `contacted` field mapping
2. Boolean conversion logic from Pattern 00
3. International phone detection (+44, etc.)
4. Session 0 metrics (field_mapping_success_rate, etc.)
5. Extended field variations from Pattern 00
6. `normalization_version` tracking

## 🛠️ PROVEN WORKING PATTERNS

### MCP Tool Update Pattern (CONFIRMED WORKING)
```javascript
// This EXACT pattern successfully updated the workflow twice:
const updateOperation = {
  id: "CefJB1Op3OySG8nb",  // Current workflow ID
  operations: [{
    type: "updateNode",
    nodeId: "a3493afa-1eaf-41bb-99ca-68fe76209a29",  // Smart Field Mapper node
    properties: {
      parameters: {
        jsCode: "[UPDATED CODE HERE]"
      }
    }
  }]
};

// Use: n8n-mcp:n8n_update_partial_workflow
```

### Node IDs in Current Workflow
- **Smart Field Mapper**: `a3493afa-1eaf-41bb-99ca-68fe76209a29`
- **Airtable Create**: `8fb0c7f8-a522-4f9a-a9e1-4b8a9b7bb089`
- **Airtable Update**: `ad2b3dda-e1f8-4e3f-bef9-4f5d8ae7f3e9`

## 🎯 NEXT MICRO-CHUNKS

### Chunk 1B: Add `contacted` field mapping
1. Add to `otherFields` in Smart Field Mapper:
   ```javascript
   contacted: ['contacted', 'was_contacted', 'has_been_contacted', 'contacted_flag']
   ```
2. Add to Airtable Create node column mappings
3. Test with payload containing `contacted: "yes"`

### Chunk 1C: Add Boolean Conversion Logic
Copy EXACT code from Pattern 00:
```javascript
// Boolean conversions for Airtable
['interested_in_coaching', 'qualified_lead', 'contacted'].forEach(field => {
  if (normalized[field] !== undefined) {
    const val = String(normalized[field]).toLowerCase();
    normalized[field] = ['true', 'yes', '1', 'on', 'y', 'checked'].includes(val);
  }
});
```

### Chunk 1D: Add International Phone Detection
```javascript
// After phone normalization
if (normalized.phone) {
  const phoneStr = String(normalized.phone);
  normalized.international_phone = !phoneStr.startsWith('+1') && phoneStr.startsWith('+');
  normalized.phone_country_code = phoneStr.match(/^\+(\d{1,3})/)?.[1] || '';
}
```

## 🚫 ENFORCEMENT NOTES

### What Cursor Just Learned
1. **MCP tools DO work** - We proved this with successful updates
2. **No manual UI needed** - Programmatic updates work fine
3. **Evidence-based approach works** - Tool audits expose the truth

### Common Cursor Excuses (All Proven False)
- "MCP tools can't update workflow structure" ❌
- "Need manual intervention" ❌
- "Tools aren't reliable" ❌
- "Can't access node parameters" ❌

## 📂 PROJECT STRUCTURE REMINDERS

### Key Files
- **Pattern 00**: `/patterns/00-field-normalization-mandatory.txt` (authoritative source)
- **Test Suite**: `/tests/reality_based_tests_v2.json` (15+ test payloads)
- **Schema**: `/schemas/airtable-schemas-v2.json` (field requirements)
- **Progress**: `/memory_bank/active_context.md` (current state)

### Critical Pattern 00 Requirements
1. Field normalization MUST be first node after webhook
2. ALL downstream nodes use `$node["Smart Field Mapper"].json.normalized`
3. Unknown fields tracked for weekly review
4. 95%+ field capture rate required

## 🎬 HANDOVER INSTRUCTIONS

### For Next Claude Instance:
1. **Read this file first** for complete context
2. **Check current state**: `filesystem:read_file` on `/memory_bank/active_context.md`
3. **Continue micro-chunks** starting with 1B (contacted field)
4. **Use proven MCP pattern** - no excuses about tools not working
5. **Demand evidence** for every claim from Cursor

### Your Role Remains:
- **Project Manager** guiding Cursor AI (the developer)
- **Evidence enforcer** - no claims without proof
- **Tool validator** - make Cursor show actual attempts
- **Pattern guardian** - Pattern 00 is mandatory

## 🔑 KEY TAKEAWAYS

1. **MCP tools work perfectly** when used correctly
2. **Micro-chunking works** - one field at a time
3. **Evidence-based approach** exposes false claims
4. **Pattern 00 compliance** is non-negotiable
5. **Session 0 needs completion** before moving forward

---

*End of handover. Next Claude: Continue with Chunk 1B using the proven MCP update pattern.*