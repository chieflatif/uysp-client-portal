# Implementation Pattern: System Utilities

## Daily Metrics Workflow

```javascript
// Create separate workflow: uysp-daily-metrics-v1

// Node: Schedule Trigger
Type: n8n-nodes-base.scheduleTrigger
Settings:
  Trigger Times:
    Hour: 23
    Minute: 0
  Trigger Days: All
```

```javascript
// Node: Get Today's Data
Type: n8n-nodes-base.airtable
Operation: Search
Table: People
Filter: {created_date} = TODAY()
```

```javascript
// Node: Calculate Metrics
Type: n8n-nodes-base.code
const leads = $items;
const today = new Date().toISOString().split('T')[0];

// Process leads by source
const bySource = {};
leads.forEach(lead => {
  const source = lead.json.lead_source || 'unknown';
  bySource[source] = (bySource[source] || 0) + 1;
});

// Calculate enrichment success
const enriched = leads.filter(l => l.json.title_current).length;
const enrichmentRate = leads.length > 0 ? (enriched / leads.length * 100) : 0;

// Get SMS and meeting counts from other tables...

return {
  date: today,
  leads_processed: leads.length,
  leads_by_source: JSON.stringify(bySource),
  enrichment_success_rate: enrichmentRate,
  avg_processing_time: calculateAvgTime(leads),
  // ... other metrics
};
```

```javascript
// Node: Save Daily Metrics
Type: n8n-nodes-base.airtable
Operation: Create
Table: Daily_Metrics
```

## Calendly Webhook Handler

```javascript
// Create separate workflow: uysp-calendly-webhook-v1

// Node: Webhook Receiver
Type: n8n-nodes-base.webhook
Path: calendly-events
Method: POST
```

```javascript
// Node: Validate Calendly Signature
Type: n8n-nodes-base.code
// TODO: Implement signature validation when ready
const isValid = true; // Placeholder
if (!isValid) throw new Error('Invalid signature');

return $json;
```

```javascript
// Node: Extract Meeting Data
Type: n8n-nodes-base.code
const event = $json.event;
const invitee = $json.invitee;

// Extract tracking parameters from URL
const uri = new URL(invitee.cancel_url);
const utmSource = uri.searchParams.get('utm_source');
const utmContent = uri.searchParams.get('utm_content');

return {
  email: invitee.email,
  meeting_time: event.start_time,
  meeting_type: event.event_type,
  tracking_source: utmSource,
  tracking_content: utmContent,
  calendly_event_id: event.id
};
```

```javascript
// Node: Find Person Record
Type: n8n-nodes-base.airtable
Operation: Search
Table: People
Filter: {email} = '{{ $json.email }}'
```

```javascript
// Node: Create Meeting Record
Type: n8n-nodes-base.airtable
Operation: Create
Table: Meetings
```

## Centralized Error Handler

```javascript
// Add to main workflow error handling

// Node: Capture Error Context
Type: n8n-nodes-base.code
const error = $json.error;
const context = {
  workflow: 'uysp-lead-processing-v1',
  execution_id: $execution.id,
  timestamp: new Date().toISOString(),
  node_name: error.node?.name || 'unknown',
  error_message: error.message,
  error_type: classifyError(error),
  lead_email: $items[0]?.json?.email || 'unknown'
};

function classifyError(err) {
  if (err.message.includes('rate limit')) return 'rate_limit';
  if (err.message.includes('Invalid API')) return 'auth_error';
  if (err.message.includes('Network')) return 'network_error';
  if (err.message.includes('compliance')) return 'compliance_block';
  return 'unknown';
}
```

```javascript
// Node: Log to Error Table
Type: n8n-nodes-base.airtable
Operation: Create
Table: Error_Log
Fields: [context object]
```

```javascript
// Node: Alert if Critical
Type: n8n-nodes-base.switch
Rules:
  - When: {{ $json.error_type === 'auth_error' }}
    Output: Send Alert
  - Default: Log Only
```

## Human Review Queue (Airtable View)

```javascript
// This is configured in Airtable UI, not n8n
/*
View Name: "Human Review Queue"
Table: People
Filters:
  - routing = "human_review"
  - reviewed = false
  - created_date is within last 7 days
Sort:
  - priority DESC
  - created_date ASC
Fields shown:
  - email
  - company
  - routing_reason
  - created_date
  - review button
*/
```

## Complete System Test

```javascript
// Node: Generate Test Batch
Type: n8n-nodes-base.code
const testLeads = [
  {
    email: 'complete-test-1@salesforce.com',
    name: 'High Score Test',
    phone: '415-555-0001',
    company: 'Salesforce',
    source_form: 'system-test'
  },
  {
    email: 'complete-test-2@unknown.com',
    name: 'Medium Score Test',
    phone: '415-555-0002',
    company: 'Unknown Startup'
  },
  {
    email: 'complete-test-3@gmail.com',
    name: 'Low Score Test',
    company: 'Personal'
  }
];

return testLeads.map(lead => ({
  json: { ...lead, request_id: `system-test-${Date.now()}` }
}));

// Process through complete workflow...
``` 