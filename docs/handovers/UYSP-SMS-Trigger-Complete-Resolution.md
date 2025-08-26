# UYSP SMS Trigger - Complete Resolution Guide

## Issue Summary
The SMS trigger workflow has a fundamental bug in n8n's Airtable Update node when using "Columns to match on" mode.

### Current Status:
- ✅ SMS messages ARE being sent successfully (3 sent in last test)
- ❌ Airtable records are NOT being updated
- 🐛 n8n bug: "Columns to match on" mode incorrectly formats the API request

### The Bug:
When using "Columns to match on" with "id", n8n puts the ID inside the fields object:
```json
{
  "fields": {
    "id": "recXXX",
    "Processing Status": "Complete",
    // other fields...
  }
}
```

But Airtable API requires:
```json
{
  "id": "recXXX",
  "fields": {
    "Processing Status": "Complete",
    // other fields...
  }
}
```

## Resolution Options:

### Option 1: Switch to Standard Update Mode
1. In the Airtable Update node, look for a way to switch from "match by columns" to standard "update by ID" mode
2. This should reveal a dedicated ID field separate from the column mappings
3. Put `{{$json.id}}` in that ID field

### Option 2: Use HTTP Request Node Instead
Replace the Airtable Update node with an HTTP Request node to call Airtable API directly:
- Method: PATCH
- URL: `https://api.airtable.com/v0/app6cU9HecxLpgT0P/tblYUvhGADerbD8EO`
- Authentication: Use your Airtable credentials
- Body:
```json
{
  "records": [
    {
      "id": "{{$json.id}}",
      "fields": {
        "Processing Status": "Complete",
        "SMS Eligible": false,
        "SMS Status": "{{$json.sms_status}}",
        "SMS Campaign ID": "{{$json.campaign_id}}",
        "SMS Cost": {{$json.estimated_cost || 0}},
        "Last SMS Sent": "{{$now}}",
        "SMS Sent Count": {{($json.fields['SMS Sent Count'] || 0) + 1}},
        "Error Log": "{{$json.error_reason || ''}}"
      }
    }
  ]
}
```

### Option 3: Report Bug to n8n
This is a bug in n8n's implementation of the "Columns to match on" feature for Airtable updates.

## Immediate Next Steps:
1. Try to find a way to switch the update mode in the Airtable node
2. If not possible, implement the HTTP Request node workaround
3. The workflow is otherwise functioning correctly - only this final update step is broken

