# Implementation Pattern: SMS Compliance System

## DND List Check

```javascript
// Node: Check DND List
Type: n8n-nodes-base.airtable
Operation: Search
Base ID: appuBf0fTe8tp8ZaF
Table ID: tblDNDListXXXXXXXX
Options:
  Filter By Formula: OR({phone_number} = '{{ $json.phone_primary }}', {email} = '{{ $json.email }}')
  Return All: true
Settings Tab:
  Always Output Data: ON
```

## TCPA Time Validation

```javascript
// Node: TCPA Time Check
Type: n8n-nodes-base.code
const phone = $json.phone_primary;
const now = new Date();

// Determine timezone from phone number area code
function getTimezoneFromPhone(phoneNumber) {
  const areaCode = phoneNumber.replace(/\D/g, '').substring(1, 4);
  // Area code to timezone mapping (simplified)
  const timezoneMappings = {
    '212': 'America/New_York',    // NYC
    '213': 'America/Los_Angeles', // LA
    '312': 'America/Chicago',     // Chicago
    // Add more mappings as needed
  };
  return timezoneMappings[areaCode] || 'America/New_York'; // Default EST
}

const timezone = getTimezoneFromPhone(phone);
const localTime = new Date(now.toLocaleString("en-US", {timeZone: timezone}));
const hour = localTime.getHours();

// TCPA hours: 8 AM - 9 PM local time
const tcpaCompliant = hour >= 8 && hour <= 21;

return {
  ...input.all()[0].json,
  tcpa_compliant: tcpaCompliant,
  recipient_timezone: timezone,
  recipient_local_time: localTime.toISOString(),
  current_hour: hour
};
```

## Monthly SMS Limit Check

```javascript
// Node: Check Monthly SMS Limit
Type: n8n-nodes-base.airtable
Operation: Search
Base ID: appuBf0fTe8tp8ZaF
Table ID: tblCommunicationsXXXX
Options:
  Filter By Formula: AND(
    MONTH({sent_at}) = MONTH(TODAY()),
    YEAR({sent_at}) = YEAR(TODAY()),
    {message_type} = 'SMS'
  )
  Return All: true
```

```javascript
// Node: Calculate SMS Count
Type: n8n-nodes-base.code
const monthlyLimit = parseInt($env.SMS_MONTHLY_LIMIT) || 1000;
const currentMonthSMS = $json.length || 0;
const remainingLimit = monthlyLimit - currentMonthSMS;

return {
  ...input.all()[0].json,
  monthly_sms_limit: monthlyLimit,
  current_month_sms: currentMonthSMS,
  remaining_sms_limit: remainingLimit,
  monthly_limit_compliant: remainingLimit > 0
};
```

## 10DLC Registration Check

```javascript
// Node: 10DLC Status Check
Type: n8n-nodes-base.code
const tenDLCRegistered = $env.TEN_DLC_REGISTERED === 'true';

return {
  ...input.all()[0].json,
  ten_dlc_registered: tenDLCRegistered,
  ten_dlc_compliant: tenDLCRegistered
};
```

## Compliance Gate Logic

```javascript
// Node: Compliance Gate Decision
Type: n8n-nodes-base.code
const dndClean = $json.dnd_records?.length === 0;
const tcpaOK = $json.tcpa_compliant === true;
const monthlyOK = $json.monthly_limit_compliant === true;
const tenDLCOK = $json.ten_dlc_compliant === true;

const allCompliant = dndClean && tcpaOK && monthlyOK && tenDLCOK;

const blockReasons = [];
if (!dndClean) blockReasons.push('DND_LIST');
if (!tcpaOK) blockReasons.push('TCPA_HOURS');
if (!monthlyOK) blockReasons.push('MONTHLY_LIMIT');
if (!tenDLCOK) blockReasons.push('NO_10DLC');

return {
  ...input.all()[0].json,
  compliance_passed: allCompliant,
  compliance_status: allCompliant ? 'APPROVED' : 'BLOCKED',
  block_reasons: blockReasons,
  compliance_checked_at: new Date().toISOString()
};
```

## Compliance Router

```javascript
// Node: Route Based on Compliance
Type: n8n-nodes-base.switch
Mode: Rules
Rules:
  - When: {{ $json.compliance_passed === true }}
    Output: Send SMS
  - When: {{ $json.compliance_passed === false }}
    Output: Log Block
```

## Opt-out Handler

```javascript
// Node: Process Opt-out Request
Type: n8n-nodes-base.code
// Webhook for receiving STOP messages from Twilio
const message = $json.Body?.toUpperCase() || '';
const phone = $json.From || '';

const optOutKeywords = ['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'];
const isOptOut = optOutKeywords.some(keyword => message.includes(keyword));

if (isOptOut) {
  return {
    phone_number: phone,
    email: null, // Will be filled by lookup
    reason: 'SMS_OPT_OUT',
    request_source: 'twilio_webhook',
    added_at: new Date().toISOString(),
    action_required: 'ADD_TO_DND'
  };
}

return { action: 'IGNORE', message: 'Not an opt-out request' };
```

## DND List Addition

```javascript
// Node: Add to DND List
Type: n8n-nodes-base.airtable
Operation: Create
Base ID: appuBf0fTe8tp8ZaF
Table ID: tblDNDListXXXXXXXX
Fields:
  phone_number: {{ $json.phone_number }}
  email: {{ $json.email }}
  reason: {{ $json.reason }}
  added_at: {{ $json.added_at }}
  source: {{ $json.request_source }}
```

## Error Logging for Compliance

```javascript
// Node: Log Compliance Block
Type: n8n-nodes-base.airtable
Operation: Create
Base ID: appuBf0fTe8tp8ZaF
Table ID: tblErrorLogXXXXXXXX
Fields:
  error_type: 'COMPLIANCE_BLOCK'
  error_message: {{ $json.block_reasons.join(', ') }}
  person_id: {{ $json.person_id }}
  phone_number: {{ $json.phone_primary }}
  email: {{ $json.email }}
  compliance_details: {{ JSON.stringify($json) }}
  timestamp: {{ $json.compliance_checked_at }}
``` 