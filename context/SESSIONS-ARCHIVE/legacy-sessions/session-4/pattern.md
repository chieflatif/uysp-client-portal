# Implementation Pattern: SMS Sending

## Phone Validation
```javascript
// Node: Format Phone Number
Type: n8n-nodes-base.code

function formatToE164(phone) {
  if (!phone) return null;
  
  // Remove all non-numeric
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle US numbers
  if (cleaned.length === 10) {
    cleaned = '1' + cleaned;
  }
  
  // Add + prefix
  if (!cleaned.startsWith('1')) {
    return null; // Non-US, route to human review
  }
  
  return '+' + cleaned;
}

const primaryPhone = $json.phone_primary || $json.phone;
const formatted = formatToE164(primaryPhone);

return {
  ...$json,
  phone_formatted: formatted,
  phone_valid: !!formatted,
  phone_country: formatted ? (formatted.startsWith('+1') ? 'US' : 'International') : 'Invalid'
};
```

## SMS Template Engine
```javascript
// Node: Generate SMS Message
Type: n8n-nodes-base.code

const templates = {
  'high_score': 'Hi {{first_name}}, noticed you\'re {{title}} at {{company}}. Other {{similar_title}}s love how we help close 20% more deals. Quick chat? {{link}}',
  'medium_score': 'Hi {{first_name}}, saw you joined our webinar. {{company}} teams like yours see great results with our framework. Worth discussing? {{link}}',
  'default': 'Hi {{first_name}}, thanks for your interest! Love to show how we help {{company}} teams excel. Free to chat? {{link}}'
};

function fillTemplate(template, data) {
  return template.replace(/{{(\w+)}}/g, (match, key) => {
    if (key === 'similar_title') {
      // Simplify title for readability
      const title = data.title || 'sales pros';
      if (title.includes('Account Executive')) return 'AEs';
      if (title.includes('Sales')) return 'sales pros';
      return 'teams';
    }
    return data[key] || '';
  });
}

const score = $json.icp_score || 0;
const templateKey = score >= 85 ? 'high_score' : score >= 70 ? 'medium_score' : 'default';
const template = templates[templateKey];

// Generate tracking link
const trackingLink = `https://go.uysp.com/${Date.now()}`;

const messageData = {
  first_name: $json.first_name || 'there',
  title: $json.title_current || 'sales professional',
  company: $json.company_enriched || $json.company || 'your company',
  link: trackingLink
};

const message = fillTemplate(template, messageData);
const withOptOut = message + ' Reply STOP to opt out';

if (withOptOut.length > 160) {
  throw new Error(`Message too long: ${withOptOut.length} chars`);
}

return {
  ...$json,
  sms_message: message,
  sms_full_message: withOptOut,
  sms_length: withOptOut.length,
  sms_template: templateKey,
  tracking_link: trackingLink
};
```

## Test Mode Override
```javascript
// Node: Apply Test Mode
Type: n8n-nodes-base.code

const testMode = $env.TEST_MODE === 'true';
const testPhone = $env.TEST_PHONE || '+14155551234';

return {
  ...$json,
  sms_recipient: testMode ? testPhone : $json.phone_formatted,
  sms_test_mode: testMode,
  original_recipient: $json.phone_formatted
};
```

## SimpleTexting Send
```javascript
// Node: Send SMS via SimpleTexting
Type: n8n-nodes-base.httpRequest
Method: POST
URL: https://api-app2.simpletexting.com/v2/api/messages
Authentication: Generic
Headers:
  Authorization: Bearer {{ $credentials.simpleTextingApiKey }}
Body Type: JSON
Body:
{
  "contactPhone": "{{ $json.sms_recipient }}",
  "text": "{{ $json.sms_full_message }}",
  "accountPhone": "{{ $credentials.simpleTextingPhone }}"
}
```

## Log Communication
```javascript
// Node: Log to Communications
Type: n8n-nodes-base.airtable
Operation: Create
Base ID: appuBf0fTe8tp8ZaF
Table ID: [Communications table ID]
Fields:
  person_id: {{ $json.airtable_record_id }}
  message_type: "SMS"
  message_content: {{ $json.sms_full_message }}
  sent_time: {{ $now.toISO() }}
  template_used: {{ $json.sms_template }}
  tracking_link: {{ $json.tracking_link }}
  campaign: "initial_outreach"
  simpletexting_id: {{ $json.messageId }}
  test_mode_send: {{ $json.sms_test_mode }}
  cost_logged: 0.02
  tendlc_compliant: {{ $json.compliance_checks.tendlc_ok }}
  time_window_checked: {{ $json.compliance_checks.time_window_ok }}
  dnd_checked: {{ $json.compliance_checks.dnd_clear }}
```

## Error Handling
```javascript
// Node: Handle SMS Errors
Type: n8n-nodes-base.code

const error = $json.error;
const errorType = error?.response?.status;

let shouldRetry = false;
let errorCategory = 'permanent';

if (errorType === 429) {
  shouldRetry = true;
  errorCategory = 'rate_limit';
} else if (errorType >= 500) {
  shouldRetry = true;
  errorCategory = 'temporary';
}

return {
  ...$input.item.json,
  sms_failed: true,
  sms_error: error.message,
  sms_error_category: errorCategory,
  should_retry: shouldRetry,
  retry_after: errorCategory === 'rate_limit' ? 60000 : 5000
};
``` 