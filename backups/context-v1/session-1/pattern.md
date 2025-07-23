# Implementation Pattern: Webhook & Airtable Integration

## Webhook Receiver Configuration

```javascript
// Node: Webhook
Type: n8n-nodes-base.webhook
Settings:
  HTTP Method: POST
  Path: kajabi-leads
  Authentication: Header Auth
  Header Auth:
    Name: X-API-Key
    Value: {{ $credentials.webhookApiKey }}
  Response Code: 200
  Response Data: { "status": "received", "id": "{{ $json.request_id }}" }
```

## Import Field Normalization

```javascript
// Node: Execute Workflow - Field Normalizer
Type: n8n-nodes-base.executeWorkflow
Settings:
  Source: Database
  Workflow: uysp-field-normalizer-v1
  Mode: Run Once for All Items
```

## Test Mode Check

```javascript
// Node: Check Test Mode
Type: n8n-nodes-base.code
const testMode = $env.TEST_MODE === 'true';
const normalized = $json.normalized;

return {
  ...normalized,
  test_mode_record: testMode,
  processing_mode: testMode ? 'test' : 'production',
  timestamp: new Date().toISOString()
};
```

## Identity Resolution

```javascript
// Node: Search Existing Records
Type: n8n-nodes-base.airtable
Operation: Search
Base ID: appuBf0fTe8tp8ZaF  // Use YOUR base ID
Table ID: tblXXXXXXXXXXXXXX  // Use People table ID
Options:
  Filter By Formula: OR({email} = '{{ $json.email }}', {phone_primary} = '{{ $json.phone }}')
  Return All: true
Settings Tab:
  Always Output Data: ON  // CRITICAL UI SETTING
```

## Duplicate Prevention Logic

```javascript
// Node: Route Create vs Update
Type: n8n-nodes-base.switch
Mode: Rules
Rules:
  - When: {{ $json.length > 0 }}
    Output: Update Existing
  - When: {{ $json.length === 0 }}
    Output: Create New
Settings Tab:
  Always Output Data: ON  // CRITICAL UI SETTING
```

## Create Branch

```javascript
// Node: Create New Person
Type: n8n-nodes-base.airtable
Operation: Create
Table ID: tblXXXXXXXXXXXXXX  // People table
Fields:
  email: {{ $json.email }}
  name: {{ $json.name }}
  phone_primary: {{ $json.phone }}
  company: {{ $json.company }}
  source_form: {{ $json.source_form }}
  test_mode_record: {{ $json.test_mode_record }}
  request_id: {{ $json.request_id }}
  created_at: {{ $json.timestamp }}
```

## Update Branch

```javascript
// Node: Update Existing Person
Type: n8n-nodes-base.airtable
Operation: Update
Table ID: tblXXXXXXXXXXXXXX  // People table
Record ID: {{ $json[0].id }}  // First match from search
Fields:
  name: {{ $json.name }}  // Update name if provided
  phone_primary: {{ $json.phone }}  // Update phone if different
  company: {{ $json.company }}
  last_form_submission: {{ $json.source_form }}
  updated_at: {{ $json.timestamp }}
```

## Error Handling

```javascript
// Node: Error Handler
Type: n8n-nodes-base.code
// Capture errors and log to Error_Log table
const error = $json.error || 'Unknown error';
return {
  error_type: 'webhook_processing',
  error_message: error,
  request_data: $json,
  timestamp: new Date().toISOString()
};
``` 