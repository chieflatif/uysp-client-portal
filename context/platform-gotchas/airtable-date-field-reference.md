# Airtable Date Field Expression Reference
**CRITICAL: Prevents Hours of Debugging**

## 🚨 FIELD TYPE DETECTION PROTOCOL

### STEP 1: ALWAYS CHECK FIELD SCHEMA FIRST
```bash
# Use MCP to get field schema
mcp_airtable_describe_table(baseId, tableId, detailLevel="full")

# Look for field type in response:
"type": "date"        # US format required
"type": "dateTime"    # ISO format required  
```

### STEP 2: MATCH EXPRESSION TO FIELD TYPE

## ✅ CORRECT EXPRESSIONS BY FIELD TYPE

### For `"type": "date"` Fields
```javascript
// CORRECT: US Format (M/d/yyyy)
"created_date": "={{DateTime.now().toFormat('M/d/yyyy')}}"

// RESULTS IN: "7/23/2025"
// COMPATIBLE WITH: Airtable date field with US format
```

### For `"type": "dateTime"` Fields  
```javascript
// CORRECT: ISO Format
"created_at": "={{DateTime.now().toISO()}}"

// RESULTS IN: "2025-07-23T10:00:00.000Z"
// COMPATIBLE WITH: Airtable dateTime field
```

## ❌ NEVER USE THESE (WILL FAIL)

```javascript
// INVALID - Not a real n8n expression
"date_field": "={{$now}}"

// WRONG FORMAT - ISO for date field
"created_date": "={{DateTime.now().toISO()}}"  // date field expects M/d/yyyy

// WRONG FORMAT - US format for dateTime field  
"created_at": "={{DateTime.now().toFormat('M/d/yyyy')}}"  // dateTime expects ISO
```

## 🎯 MCP TOOL SYNTAX

### Update via MCP Partial Workflow
```javascript
{
  "type": "updateNode",
  "nodeId": "node-id-here", 
  "changes": {
    "parameters.columns.value.created_date": "={{DateTime.now().toFormat('M/d/yyyy')}}"
    //                                      ^^ DOUBLE EQUALS for expressions
  }
}
```

## 🔍 DETECTION PATTERNS

### When You See This Error:
```
"Field \"created_date\" cannot accept the provided value"
```

### Check These Things:
1. **Field Type**: Is it `date` or `dateTime`?
2. **Expression Format**: Does format match field type?  
3. **Expression Syntax**: Using double equals `={{...}}`?
4. **Valid Expression**: Is the n8n expression actually valid?

## 📚 QUICK REFERENCE TABLE

| Airtable Field Type | n8n Expression | Result Format | Example |
|---------------------|----------------|---------------|---------|
| `date` | `{{DateTime.now().toFormat('M/d/yyyy')}}` | `M/d/yyyy` | `7/23/2025` |
| `dateTime` | `{{DateTime.now().toISO()}}` | ISO | `2025-07-23T10:00:00.000Z` |

## 🚨 PREVENTION CHECKLIST

- [ ] Check Airtable field schema BEFORE writing expressions
- [ ] Match expression format to field type exactly  
- [ ] Use double equals `={{...}}` in MCP tools
- [ ] Test workflow execution after MCP updates
- [ ] Never assume - always verify field types first

**REMEMBER**: One wrong character in date format = hours of debugging! 