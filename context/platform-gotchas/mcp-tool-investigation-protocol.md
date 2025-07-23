# MCP Tool Investigation Protocol
**MANDATORY: Before Claiming "MCP Can't Do X"**

## 🚨 CRITICAL INVESTIGATION STEPS

### STEP 1: DOCUMENTATION DEEP DIVE
```bash
# Get FULL tool documentation
mcp_n8n_tools_documentation(topic="tool_name", depth="full")

# Search for specific properties
mcp_n8n_search_node_properties(nodeType="nodes-base.nodename", query="property")

# Get node essentials for parameter structure
mcp_n8n_get_node_essentials(nodeType="nodes-base.nodename")
```

### STEP 2: DOT NOTATION EXPLORATION
- **resourceMapper types**: Use `parameters.columns.value.fieldname` format
- **nested objects**: Use `parameters.nested.property` format  
- **arrays**: Use `parameters.array[0].property` format
- **Test with simple values first**, then complex expressions
- **CRITICAL**: Use double equals `={{expression}}` for n8n expressions

### STEP 3: FIELD SCHEMA VERIFICATION (AIRTABLE CRITICAL)
```bash
# ALWAYS check field types first for Airtable
mcp_airtable_describe_table(baseId="base", tableId="table", detailLevel="full")

# Match expressions to field types:
# date fields → {{DateTime.now().toFormat('M/d/yyyy')}}
# dateTime fields → {{DateTime.now().toISO()}}
```

### STEP 4: SYSTEMATIC TESTING
1. **Start simple**: Test with hardcoded values first
2. **Add complexity**: Then try expressions
3. **Verify changes**: Check workflow JSON after MCP updates
4. **Test execution**: Run workflow to confirm functionality
5. **Document patterns**: Record successful approaches

## 🎯 SPECIFIC LESSONS LEARNED

### AIRTABLE DATE FIELDS - GOTCHA #17
**NEVER AGAIN**: Hours wasted on date formatting
**ROOT CAUSE**: Different Airtable field types need different expression formats
**PREVENTION**: 
1. Check field schema FIRST with `mcp_airtable_describe_table`
2. Use correct expression format for field type
3. Test with simple hardcoded values before expressions

### MCP CAPABILITY ASSUMPTIONS
**NEVER CLAIM**: "MCP tools can't do X" without thorough investigation
**ALWAYS TRY**: Multiple dot notation approaches before giving up
**EVIDENCE REQUIRED**: Show failed attempts with exact syntax before claiming limitations

## 📋 INVESTIGATION CHECKLIST

- [ ] Got full tool documentation with `depth="full"`
- [ ] Searched for relevant properties with multiple keywords
- [ ] Tried different dot notation formats
- [ ] For Airtable: Checked field schema and matched expression format
- [ ] Tested with simple values before complex expressions
- [ ] Verified changes in workflow JSON after MCP updates
- [ ] Tested workflow execution to confirm functionality
- [ ] Documented successful patterns for future reference

## 🚨 ANTI-PATTERNS TO AVOID

❌ **"MCP tools can't control field modes"** → **WRONG** - they can via dot notation  
❌ **"UI refresh issue"** → Usually wrong - investigate real cause  
❌ **"That's just how n8n works"** → Investigate MCP capabilities first  
❌ **Assuming expression formats** → Check Airtable field schema first  
❌ **Claiming success without testing** → Always test workflow execution

## 💡 SUCCESS PATTERNS

✅ **Schema first, expressions second** → Check Airtable field types before writing expressions  
✅ **Double equals for expressions** → `={{expression}}` format in MCP tools  
✅ **Evidence-based claims** → Show working/failing code before conclusions  
✅ **Incremental testing** → Simple → Complex → Test execution  
✅ **Document patterns** → Record successful approaches for reuse

**CORE PRINCIPLE**: Investigate thoroughly before claiming limitations! 