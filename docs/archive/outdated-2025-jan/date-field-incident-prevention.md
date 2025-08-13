[HISTORICAL]
Last Updated: 2025-08-08

# Date Field Incident Prevention System
**CRITICAL: Prevents Hours of Debugging - Gotcha #17**

## 🚨 INCIDENT SUMMARY

**DATE**: July 23, 2025  
**DURATION**: 3+ hours of circular debugging  
**ROOT CAUSE**: Using wrong date expression format for Airtable `date` field type  
**IMPACT**: Complete workflow failure, wasted development time  

### What Went Wrong:
1. **Used invalid expression**: `{{$now}}` (not a valid n8n expression)
2. **Used wrong format**: `{{DateTime.now().toISO()}}` (ISO format for `date` field expecting US format)
3. **Skipped schema verification**: Failed to check Airtable field type before writing expressions
4. **Made false claims**: Incorrectly blamed MCP tool limitations instead of investigating properly

### What Actually Fixed It:
- **Correct expression**: `{{DateTime.now().toFormat('M/d/yyyy')}}` for Airtable `date` fields
- **Field schema analysis**: Used `mcp_airtable_describe_table` to verify field types
- **Proper MCP usage**: Used dot notation with double equals format

## 📋 PREVENTION SYSTEM IMPLEMENTED

### 1. Updated Documentation
✅ **Platform Gotchas** - Added Gotcha #17 for Airtable date field formatting  
✅ **Date Field Reference** - Created comprehensive expression guide by field type  
✅ **MCP Investigation Protocol** - Added specific date field verification steps  

### 2. Memory Updates
✅ **Memory #4109912** - Root cause analysis and prevention protocol  
✅ **Memory #3932245** - Updated Phase 00 status to reflect completion  
✅ **Memory #3931908** - Enhanced tool sequence with investigation requirements  

### 3. Detection Scripts
✅ **Gotcha Detection Script** - Added automatic detection for:
- Invalid `{{$now}}` expressions
- Potential date/dateTime format mismatches
- Missing "Always Output Data" settings
- Hardcoded table names vs IDs

### 4. Quick Reference Files
✅ **Airtable Date Field Reference** - Field type detection protocol  
✅ **Expression Cheat Sheet** - Correct formats for each field type  
✅ **MCP Syntax Guide** - Proper dot notation and double equals usage  

## 🎯 MANDATORY PREVENTION PROTOCOL

### BEFORE Any Airtable Date Field Work:

#### STEP 1: Check Field Schema FIRST
```bash
mcp_airtable_describe_table(baseId, tableId, detailLevel="full")
```

#### STEP 2: Identify Field Type
```json
"created_date": {
  "type": "date",        ← US format required
  "type": "dateTime"     ← ISO format required
}
```

#### STEP 3: Use Correct Expression
```javascript
// For "type": "date" 
"created_date": "={{DateTime.now().toFormat('M/d/yyyy')}}"

// For "type": "dateTime"
"created_at": "={{DateTime.now().toISO()}}"
```

#### STEP 4: Test Immediately
- Apply MCP changes
- Test workflow execution
- Verify record creation in Airtable

### DETECTION PATTERNS

#### When You See:
```
"Field \"created_date\" cannot accept the provided value"
```

#### Check These:
1. ✅ Field type (`date` vs `dateTime`)
2. ✅ Expression format matches field type
3. ✅ Using double equals `={{...}}` in MCP
4. ✅ Valid n8n expression syntax

## 🚀 AUTOMATED PREVENTION

### Gotcha Detection Script
```bash
# Run before any deployment
node scripts/detect-gotchas.js workflows/workflow-name.json
```

### Checks For:
- ❌ Invalid `{{$now}}` expressions  
- ❌ Format mismatches (ISO for date fields)
- ❌ Missing "Always Output Data" settings
- ❌ Hardcoded table names
- ❌ Missing credentials

## 📚 REFERENCE MATERIALS

### Quick Lookup Table
| Airtable Field | n8n Expression | Format | Example |
|----------------|----------------|---------|----------|
| `date` | `{{DateTime.now().toFormat('M/d/yyyy')}}` | M/d/yyyy | 7/23/2025 |
| `dateTime` | `{{DateTime.now().toISO()}}` | ISO | 2025-07-23T10:00:00.000Z |

### Files Updated:
- `context/platform-gotchas/n8n-platform-gotchas-complete.md`
- `context/platform-gotchas/airtable-date-field-reference.md`
- `context/platform-gotchas/mcp-tool-investigation-protocol.md`
- `scripts/detect-gotchas.js`

## 🎯 SUCCESS METRICS

### Before Prevention System:
- ❌ 3+ hours debugging single date field issue
- ❌ Multiple false assumptions about MCP limitations
- ❌ Circular debugging with no resolution pattern

### After Prevention System:
- ✅ Automatic detection of date field issues
- ✅ Clear schema verification protocol
- ✅ Documented expression patterns by field type
- ✅ MCP investigation checklist prevents false claims

## 🚨 NEVER AGAIN CHECKLIST

- [ ] Check Airtable field schema BEFORE writing expressions
- [ ] Match expression format to exact field type
- [ ] Use double equals `={{...}}` format in MCP tools
- [ ] Test workflow execution after MCP updates
- [ ] Run gotcha detection script before deployment
- [ ] Never claim MCP limitations without thorough investigation
- [ ] Document successful patterns for future reference

**REMEMBER**: One character wrong in date format = hours of debugging wasted! 