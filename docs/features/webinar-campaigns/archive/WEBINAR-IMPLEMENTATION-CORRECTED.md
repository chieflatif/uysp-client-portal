# Webinar Nurture System - Implementation Plan (CORRECTED)

**Date**: 2025-11-02  
**Status**: ✅ CORRECTED - Ready for AI Agent Execution  
**Audience**: AI Agents (Machine-Readable)  
**Format**: Step-by-step execution instructions

---

## EXECUTION PARAMETERS

- **Base ID**: `app4wIsBfpJTg7pWS`
- **Timezone**: America/New_York (Eastern Time - ALL times)
- **Business Hours**: 8 AM - 8 PM ET
- **Scheduler Frequency**: Every 10 minutes during business hours
- **Cron Expression**: `*/10 13-24 * * *` (8 AM - 8 PM ET in UTC)

---

## PHASE 1: AIRTABLE SCHEMA SETUP

### TASK 1.1: Create Campaigns Table

**Execute**:
```
CREATE TABLE: Campaigns
Base: app4wIsBfpJTg7pWS

FIELDS:
1. Campaign Name (singleLineText, required)
   Purpose: Display name (e.g., "AI BDR Masterclass - Nov 11")

2. Form ID (singleLineText, required, UNIQUE)
   Purpose: Lookup key from Kajabi webhook
   Example: "form_ai_bdr_nov11"
   CRITICAL: This links lead → campaign → webinar workflow

3. Campaign Type (singleSelect, required)
   Options: ["webinar", "standard"]
   Purpose: Route to correct workflow

4. Webinar Datetime (dateTime, required if type=webinar)
   Timezone: America/New_York
   Format: YYYY-MM-DD HH:MM:SS
   Purpose: When webinar starts

5. Zoom Link (url)
   Purpose: Meeting URL for reminders

6. Resource Link (url)
   Purpose: Asset for value message (step 2)

7. Resource Name (singleLineText)
   Purpose: Display name for asset
   Example: "AI BDR Prep Guide"

8. Message 1 Body (multilineText)
   Purpose: Acknowledgment template (optional override)
   Default: Use generic template if empty

9. Message 2 Body (multilineText)
   Purpose: Value builder template (optional override)
   Default: Use generic template if empty

10. Message 3 Body (multilineText)
    Purpose: 24hr reminder template (optional override)
    Default: Use generic template if empty

11. Message 4 Body (multilineText)
    Purpose: 1hr reminder template (optional override)
    Default: Use generic template if empty

12. Active (checkbox, default: true)
    Purpose: Enable/disable campaign

13. Created At (createdTime)
    Purpose: Audit trail

14. Created By (singleLineText)
    Purpose: Track who created (UI user or manual)

15. Total Leads (count, linked to Leads table)
    Purpose: Reporting - how many leads per campaign

16. Messages Sent (number, precision: 0)
    Purpose: Reporting - total messages sent for campaign
    Updated by: Workflow on each send

17. Webinar Attendance Count (number, precision: 0)
    Purpose: Reporting - how many attended
    Updated by: Post-webinar workflow (future)
```

**Validation**:
- Form ID must be unique (enforce in Airtable)
- Webinar Datetime required if Campaign Type = "webinar"
- Active defaults to TRUE

---

### TASK 1.2: Update Leads Table

**Execute**:
```
TABLE: Leads (tblYUvhGADerbD8EO)

ADD FIELDS:

1. Form ID (singleLineText)
   ID: (auto-assigned by Airtable)
   Purpose: Capture from webhook, lookup key to Campaigns
   
2. Webinar Datetime (dateTime)
   ID: (auto-assigned by Airtable)
   Timezone: America/New_York
   Purpose: Copied from campaign for performance (avoid lookup)

3. Linked Campaign (linkedRecord)
   Links to: Campaigns table
   Purpose: Reporting - group leads by campaign
   Link by: Form ID (match on ingestion)

UPDATE EXISTING FIELD:

4. Lead Source (fldEMGOURoyzU2ah0)
   Action: ADD OPTION
   New Option: "Kajabi-Webinar"
   Purpose: Trigger webinar workflow
```

**DO NOT CREATE** (already exist, reuse):
- SMS Sequence Position (fldIm565bl2kNw48c) ✓ EXISTS
- SMS Last Sent At (fldjHyUk48hUwUq6O) ✓ EXISTS
- Campaign (CORRECTED) (fldlVv7rkTHFsPw8u) ✓ EXISTS

**Validation**:
- Test adding "Kajabi-Webinar" to Lead Source dropdown
- Verify Linked Campaign creates link to Campaigns table
- Confirm datetime timezone = America/New_York

---

### TASK 1.3: Update SMS_Templates Table (Optional)

**Execute**:
```
TABLE: SMS_Templates (tblsSX9dYMnexdAa7)

ADD GENERIC WEBINAR TEMPLATES (if not using per-campaign templates):

1. Campaign: "webinar_generic"
   Variant: (leave empty, no A/B testing)
   Step: 1
   Body: "Hi {{first_name}}! You're confirmed for {{webinar_name}} on {{webinar_date}} at {{webinar_time}} ET 🎯 Check your email for the Zoom link. See you there!"
   Delay Days: 0
   Active: TRUE

2. Campaign: "webinar_generic"
   Variant: (leave empty)
   Step: 2
   Body: "{{first_name}}, ahead of {{webinar_name}}, here's your {{resource_name}}: {{resource_link}}. Other {{title}}s are finding this super valuable. Can't wait for {{webinar_day}}! 📚"
   Delay Days: (variable, calculated)
   Active: TRUE

3. Campaign: "webinar_generic"
   Variant: (leave empty)
   Step: 3
   Body: "Tomorrow's the big day, {{first_name}}! {{webinar_name}} starts at {{webinar_time}} ET. Set a reminder and we'll see you there ⏰"
   Delay Days: (variable, calculated)
   Active: TRUE

4. Campaign: "webinar_generic"
   Variant: (leave empty)
   Step: 4
   Body: "Starting in 1 hour, {{first_name}}! {{webinar_name}} at {{webinar_time}} ET. Join here: {{zoom_link}} 🚀"
   Delay Days: (variable, calculated)
   Active: TRUE
```

**Decision Point**: Store templates in SMS_Templates OR in Campaigns table Message fields?
- **Option A**: Generic templates in SMS_Templates (simpler, less per-campaign data)
- **Option B**: Per-campaign templates in Campaigns table (more flexible, easier to customize)
- **Recommendation**: Use Option A, allow Option B overrides if Message Body fields populated

---

## PHASE 2: INGESTION WORKFLOW UPDATE

### TASK 2.1: Update Kajabi Ingestion Workflow

**Workflow**: (Current Kajabi ingestion workflow name)

**ADD NODE: Campaign Lookup**

**Execute**:
```javascript
// Node: Campaign Lookup
// Type: Code Node
// Position: After webhook received, before lead creation

INPUT: Webhook payload from Kajabi

const formId = $json.form?.id || $json.form_id; // Adapt to actual payload structure
const leadData = {
  email: $json.email,
  first_name: $json.first_name,
  last_name: $json.last_name,
  phone: $json.phone,
  company: $json.company,
  form_id: formId
};

// Lookup campaign in Campaigns table
// (Next node will be Airtable query)

return {
  json: {
    leadData: leadData,
    formId: formId
  }
};
```

**ADD NODE: Query Campaigns Table**

**Execute**:
```
Node: Airtable Query
Table: Campaigns (get table ID from Phase 1)
Filter Formula: {Form ID} = '{{$json.formId}}'
Max Records: 1

OUTPUT: Campaign record or empty
```

**ADD NODE: Campaign Validation & Routing**

**Execute**:
```javascript
// Node: Campaign Validation
// Type: Code Node

INPUT: Campaign query result + lead data

const campaign = $input.all()[1].json.records?.[0]; // Campaign from query
const leadData = $input.all()[0].json.leadData;
const formId = $input.all()[0].json.formId;

// CASE 1: Campaign not found
if (!campaign) {
  return {
    json: {
      ...leadData,
      lead_source: "Manual",
      processing_status: "HRQ Review",
      hrq_reason: `Unknown form ID: ${formId}`,
      error: true,
      error_type: "unknown_form_id"
    }
  };
}

// CASE 2: Campaign inactive
if (!campaign.fields.Active) {
  return {
    json: {
      ...leadData,
      lead_source: "Manual",
      processing_status: "HRQ Review",
      hrq_reason: `Campaign inactive: ${campaign.fields['Campaign Name']}`,
      error: true,
      error_type: "campaign_inactive"
    }
  };
}

// CASE 3: Webinar campaign
if (campaign.fields['Campaign Type'] === 'webinar') {
  // Validate webinar datetime
  if (!campaign.fields['Webinar Datetime']) {
    return {
      json: {
        ...leadData,
        lead_source: "Manual",
        processing_status: "Failed",
        error: true,
        error_type: "missing_webinar_datetime",
        slack_alert: `Campaign ${campaign.fields['Campaign Name']} missing Webinar Datetime`
      }
    };
  }
  
  // Check if webinar already passed
  const webinarTime = new Date(campaign.fields['Webinar Datetime']);
  const now = new Date();
  
  if (webinarTime < now) {
    return {
      json: {
        ...leadData,
        lead_source: "Manual",
        processing_status: "Complete",
        hrq_reason: `Webinar already passed: ${campaign.fields['Campaign Name']}`,
        error: true,
        error_type: "webinar_past"
      }
    };
  }
  
  // SUCCESS: Webinar lead
  return {
    json: {
      ...leadData,
      form_id: formId,
      webinar_datetime: campaign.fields['Webinar Datetime'],
      campaign_corrected: campaign.fields['Campaign Name'],
      lead_source: "Kajabi-Webinar",
      processing_status: "Active",
      sms_sequence_position: 0,
      linked_campaign_id: [campaign.id], // Link to campaign record
      error: false
    }
  };
}

// CASE 4: Standard campaign
return {
  json: {
    ...leadData,
    form_id: formId,
    campaign_corrected: campaign.fields['Campaign Name'],
    lead_source: "Kajabi-Webhook",
    processing_status: "Queued",
    linked_campaign_id: [campaign.id],
    error: false
  }
};
```

**ADD NODE: Error Handler (IF Node)**

**Execute**:
```
IF: {{$json.error}} = true

TRUE → Branch to error handling:
  - Send Slack alert if slack_alert field exists
  - Log to error table (if exists)
  - Create lead with error status

FALSE → Continue to normal lead creation
```

**ADD NODE: Slack Alert (Error Cases)**

**Execute**:
```
Node: HTTP Request
Method: POST
URL: (Slack webhook URL from existing workflows)

Body:
{
  "text": "🚨 Webinar Campaign Error",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Error Type:* {{$json.error_type}}\n*Form ID:* {{$json.form_id}}\n*Lead:* {{$json.email}}\n*Reason:* {{$json.hrq_reason || $json.slack_alert}}"
      }
    }
  ]
}
```

**ADD NODE: Create Lead in Airtable**

**Execute**:
```
Node: Airtable Create
Table: Leads (tblYUvhGADerbD8EO)

Fields (map from $json):
- Email → {Email}
- Phone → {Phone}
- First Name → {First Name}
- Last Name → {Last Name}
- Company → {Company}
- Form ID → {Form ID}
- Webinar Datetime → {Webinar Datetime} (if exists)
- Campaign (CORRECTED) → {Campaign (CORRECTED)}
- Lead Source → {Lead Source}
- Processing Status → {Processing Status}
- SMS Sequence Position → {SMS Sequence Position}
- Linked Campaign → {Linked Campaign} (record link)
- HRQ Reason → {HRQ Reason} (if error)
```

**Validation**:
- Test with known form_id
- Test with unknown form_id (should route to HRQ)
- Test with inactive campaign (should route to HRQ)
- Test with past webinar (should mark complete)
- Verify Slack alerts fire on errors

---

## PHASE 3: WEBINAR SCHEDULER WORKFLOW

### TASK 3.1: Create New Workflow

**Execute**:
```
CREATE WORKFLOW: UYSP-Webinar-Nurture-Scheduler
Platform: n8n Cloud
Status: Inactive (until testing complete)

TRIGGER: Schedule
Type: Cron
Expression: */10 13-24 * * *
Timezone: America/New_York
Description: Every 10 minutes, 8 AM - 8 PM ET
```

---

### TASK 3.2: Node Architecture

**NODE 1: Schedule Trigger**
```
Type: Schedule Trigger
Cron: */10 13-24 * * *
Timezone: America/New_York
```

**NODE 2: List Due Webinar Leads**
```
Type: Airtable - List Records
Base: app4wIsBfpJTg7pWS
Table: Leads (tblYUvhGADerbD8EO)

Filter Formula:
AND(
  {Lead Source} = "Kajabi-Webinar",
  {Processing Status} = "Active",
  {Phone Valid} = TRUE,
  NOT({SMS Stop}),
  NOT({Booked}),
  {Webinar Datetime} > NOW(),
  LEN({Phone}) > 0,
  OR(
    {SMS Sequence Position} = 0,
    AND(
      {SMS Sequence Position} > 0,
      {SMS Sequence Position} < 4,
      DATETIME_DIFF(NOW(), {SMS Last Sent At}, 'hours') >= 1
    )
  )
)

Max Records: 100
```

**NODE 3: Loop Over Leads**
```
Type: Split In Batches
Batch Size: 1
Purpose: Process leads one at a time
```

**NODE 4: Calculate Next Message**
```
Type: Code Node
Language: JavaScript

INPUT: Single lead from loop

const lead = $json.fields;
const now = new Date();
const webinarTime = new Date(lead['Webinar Datetime']);
const currentPosition = lead['SMS Sequence Position'] || 0;
const lastSentAt = lead['SMS Last Sent At'] ? new Date(lead['SMS Last Sent At']) : null;

// Duplicate prevention (1 hour minimum between messages)
if (lastSentAt) {
  const hoursSinceLastSent = (now - lastSentAt) / (1000 * 60 * 60);
  if (hoursSinceLastSent < 1) {
    return {
      json: {
        skip: true,
        reason: 'Duplicate prevention - sent < 1hr ago',
        lead_id: $json.id
      }
    };
  }
}

// Calculate hours until webinar
const hoursUntil = (webinarTime - now) / (1000 * 60 * 60);

// Calculate message times (fixed, work backwards from webinar)
const msg4Time = new Date(webinarTime.getTime() - (1 * 60 * 60 * 1000)); // 1hr before
const msg3Time = new Date(webinarTime.getTime() - (24 * 60 * 60 * 1000)); // 24hr before

// Time windows (±5 minutes tolerance)
const tolerance = 5 * 60 * 1000; // 5 minutes in milliseconds

// DECISION LOGIC
let nextStep = null;
let messageType = null;

if (currentPosition === 0) {
  // Message 1: Acknowledgment (immediate, within 10 min of registration)
  nextStep = 1;
  messageType = 'acknowledgment';
  
} else if (currentPosition === 1) {
  // Message 2: Value builder
  // Send based on hours until webinar:
  // - If >= 72 hours: Send 24 hours after msg 1
  // - If 36-72 hours: Send ~40% into available window
  // - If 24-36 hours: Send 12 hours after msg 1
  // - If < 24 hours: Skip
  
  if (hoursUntil >= 24) {
    // Check if 12-24 hours have passed since last send
    const hoursSinceLastSent = (now - lastSentAt) / (1000 * 60 * 60);
    if (hoursSinceLastSent >= 12) {
      nextStep = 2;
      messageType = 'value_builder';
    }
  }
  
} else if (currentPosition === 2) {
  // Message 3: 24hr reminder (if time window available)
  const timeDiff = Math.abs(now - msg3Time);
  
  if (hoursUntil >= 23 && hoursUntil <= 25 && timeDiff <= tolerance) {
    nextStep = 3;
    messageType = '24hr_reminder';
  }
  
} else if (currentPosition === 3 || (currentPosition === 2 && hoursUntil < 23)) {
  // Message 4: 1hr reminder
  const timeDiff = Math.abs(now - msg4Time);
  
  if (hoursUntil >= 0.9 && hoursUntil <= 1.1 && timeDiff <= tolerance) {
    nextStep = 4;
    messageType = '1hr_reminder';
  }
}

// If no message due, skip
if (!nextStep) {
  return {
    json: {
      skip: true,
      reason: `No message due. Position: ${currentPosition}, Hours until: ${hoursUntil.toFixed(1)}`,
      lead_id: $json.id
    }
  };
}

// Return message details
return {
  json: {
    skip: false,
    lead_id: $json.id,
    lead_data: lead,
    next_step: nextStep,
    message_type: messageType,
    hours_until_webinar: hoursUntil,
    webinar_time: webinarTime.toISOString()
  }
};
```

**NODE 5: Filter (Skip = False)**
```
Type: IF Node
Condition: {{$json.skip}} = false

TRUE → Continue to message preparation
FALSE → End (skip this lead)
```

**NODE 6: Lookup Campaign**
```
Type: Airtable - Get Record
Table: Campaigns
Filter: Find record where Form ID = {{$json.lead_data['Form ID']}}

Purpose: Get template text, zoom link, resource link
```

**NODE 7: Prepare Message**
```
Type: Code Node

INPUT: Lead data + Campaign data + Next step

const lead = $input.all()[0].json.lead_data;
const campaign = $input.all()[1].json.fields;
const nextStep = $input.all()[0].json.next_step;
const messageType = $input.all()[0].json.message_type;

// Get template body
let templateBody;

// Check if campaign has custom template
const campaignTemplateField = `Message ${nextStep} Body`;
if (campaign[campaignTemplateField]) {
  templateBody = campaign[campaignTemplateField];
} else {
  // Use generic template (would need to query SMS_Templates table)
  // For now, inline defaults:
  const templates = {
    1: "Hi {{first_name}}! You're confirmed for {{webinar_name}} on {{webinar_date}} at {{webinar_time}} ET 🎯 Check your email for the Zoom link. See you there!",
    2: "{{first_name}}, ahead of {{webinar_name}}, here's your {{resource_name}}: {{resource_link}}. Other {{title}}s are finding this super valuable. Can't wait for {{webinar_day}}! 📚",
    3: "Tomorrow's the big day, {{first_name}}! {{webinar_name}} starts at {{webinar_time}} ET. Set a reminder and we'll see you there ⏰",
    4: "Starting in 1 hour, {{first_name}}! {{webinar_name}} at {{webinar_time}} ET. Join here: {{zoom_link}} 🚀"
  };
  templateBody = templates[nextStep];
}

// Helper functions
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });
}

function formatTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York' });
}

function formatDay(dateStr) {
  const date = new Date(dateStr);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

// Personalize template
let message = templateBody
  .replace(/\{\{first_name\}\}/g, lead['First Name'] || 'there')
  .replace(/\{\{last_name\}\}/g, lead['Last Name'] || '')
  .replace(/\{\{company\}\}/g, lead['Company'] || 'your company')
  .replace(/\{\{title\}\}/g, lead['Job Title'] || 'your role')
  .replace(/\{\{webinar_name\}\}/g, campaign['Campaign Name'] || 'our webinar')
  .replace(/\{\{webinar_date\}\}/g, formatDate(campaign['Webinar Datetime']))
  .replace(/\{\{webinar_time\}\}/g, formatTime(campaign['Webinar Datetime']))
  .replace(/\{\{webinar_day\}\}/g, formatDay(campaign['Webinar Datetime']))
  .replace(/\{\{resource_name\}\}/g, campaign['Resource Name'] || 'this resource')
  .replace(/\{\{resource_link\}\}/g, campaign['Resource Link'] || '')
  .replace(/\{\{zoom_link\}\}/g, campaign['Zoom Link'] || '');

// Return prepared message
return {
  json: {
    lead_id: lead['Record ID'] || $input.all()[0].json.lead_id,
    phone: lead['Phone'],
    message_text: message,
    next_step: nextStep,
    message_type: messageType,
    campaign_name: campaign['Campaign Name'],
    lead_email: lead['Email'],
    lead_first_name: lead['First Name'],
    lead_last_name: lead['Last Name']
  }
};
```

**NODE 8: Send SMS (SimpleTexting)**
```
Type: HTTP Request
Method: POST
URL: https://api-app2.simpletexting.com/v2/api/messages

Headers:
Authorization: Bearer {{$credentials.simpletexting.apiKey}}
Content-Type: application/json

Body:
{
  "accountId": "{{$credentials.simpletexting.accountId}}",
  "message": "{{$json.message_text}}",
  "to": ["{{$json.phone}}"]
}

Error Handling: Continue on fail (log errors)
```

**NODE 9: Update Lead**
```
Type: Airtable - Update Record
Table: Leads (tblYUvhGADerbD8EO)
Record ID: {{$json.lead_id}}

Fields:
- SMS Sequence Position: {{$json.next_step}}
- SMS Last Sent At: {{$now}}
- SMS Status: "Sent"
- Processing Status: {{$json.next_step >= 4 ? "Complete" : "Active"}}
```

**NODE 10: Log to SMS_Audit**
```
Type: Airtable - Create Record
Table: SMS_Audit (tbl5TOGNGdWXTjhzP)

Fields:
- Event: "message_sent"
- Phone: {{$json.phone}}
- Status: "sent"
- Text: {{$json.message_text}}
- Campaign ID: {{$json.campaign_name}}
- Email: {{$json.lead_email}}
- First Name: {{$json.lead_first_name}}
- Last Name: {{$json.lead_last_name}}
- Sent At: {{$now}}
- Lead Record ID: {{$json.lead_id}}
```

**NODE 11: Update Campaign Metrics**
```
Type: Airtable - Update Record
Table: Campaigns
Filter: Find record by Campaign Name = {{$json.campaign_name}}

Fields:
- Messages Sent: INCREMENT by 1
  (Use formula: {{currentValue}} + 1)
```

**NODE 12: Slack Notification (Success)**
```
Type: HTTP Request
Method: POST
URL: (Slack webhook)

Body:
{
  "text": "📤 Webinar Message Sent",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Campaign:* {{$json.campaign_name}}\n*Lead:* {{$json.lead_first_name}} ({{$json.lead_email}})\n*Step:* {{$json.next_step}} - {{$json.message_type}}\n*Phone:* {{$json.phone}}"
      }
    }
  ]
}
```

**NODE 13: Error Handler (On SMS Fail)**
```
Type: Error Trigger (catches errors from Send SMS node)

Action: Send Slack alert with error details
```

---

## PHASE 4: UI INTEGRATION

### TASK 4.1: Campaign Creation API Endpoint

**Execute**:
```typescript
// API Route: /api/campaigns/create
// Method: POST

interface CreateCampaignRequest {
  campaign_name: string;
  form_id: string; // Kajabi form identifier
  campaign_type: "webinar" | "standard";
  webinar_datetime?: string; // ISO format, required if type=webinar
  zoom_link?: string;
  resource_link?: string;
  resource_name?: string;
  created_by?: string; // UI user
}

async function createCampaign(req: CreateCampaignRequest) {
  // Validate
  if (!req.campaign_name || !req.form_id || !req.campaign_type) {
    throw new Error("Missing required fields");
  }
  
  if (req.campaign_type === "webinar") {
    if (!req.webinar_datetime) {
      throw new Error("Webinar datetime required for webinar campaigns");
    }
    
    // Validate datetime is in future
    const webinarTime = new Date(req.webinar_datetime);
    if (webinarTime < new Date()) {
      throw new Error("Webinar datetime must be in future");
    }
  }
  
  // Create record in Airtable
  const record = await airtable.create('Campaigns', {
    "Campaign Name": req.campaign_name,
    "Form ID": req.form_id,
    "Campaign Type": req.campaign_type,
    "Webinar Datetime": req.webinar_datetime,
    "Zoom Link": req.zoom_link,
    "Resource Link": req.resource_link,
    "Resource Name": req.resource_name,
    "Active": true,
    "Created By": req.created_by || "UI",
    "Messages Sent": 0,
    "Webinar Attendance Count": 0
  });
  
  return {
    success: true,
    campaign_id: record.id,
    form_id: req.form_id
  };
}
```

**UI Form Fields**:
```typescript
<CampaignForm>
  <Input name="campaign_name" label="Campaign Name" required />
  <Input name="form_id" label="Kajabi Form ID" required />
  <Select name="campaign_type" options={["webinar", "standard"]} required />
  
  {campaign_type === "webinar" && (
    <>
      <DateTimePicker name="webinar_datetime" timezone="America/New_York" required />
      <Input name="zoom_link" label="Zoom Link" type="url" />
      <Input name="resource_link" label="Resource Link" type="url" />
      <Input name="resource_name" label="Resource Name" />
    </>
  )}
  
  <Button type="submit">Create Campaign</Button>
</CampaignForm>
```

---

### TASK 4.2: Campaign Reporting Dashboard

**Execute**:
```typescript
// API Route: /api/campaigns/stats
// Method: GET

async function getCampaignStats() {
  // Query Campaigns table
  const campaigns = await airtable.select('Campaigns', {
    fields: ['Campaign Name', 'Form ID', 'Campaign Type', 'Webinar Datetime', 
             'Total Leads', 'Messages Sent', 'Webinar Attendance Count', 'Active']
  });
  
  // Calculate metrics per campaign
  const stats = campaigns.map(campaign => ({
    campaign_name: campaign.fields['Campaign Name'],
    form_id: campaign.fields['Form ID'],
    type: campaign.fields['Campaign Type'],
    webinar_date: campaign.fields['Webinar Datetime'],
    total_leads: campaign.fields['Total Leads'] || 0,
    messages_sent: campaign.fields['Messages Sent'] || 0,
    attendance: campaign.fields['Webinar Attendance Count'] || 0,
    attendance_rate: campaign.fields['Total Leads'] > 0 
      ? (campaign.fields['Webinar Attendance Count'] / campaign.fields['Total Leads'] * 100).toFixed(1)
      : 0,
    active: campaign.fields['Active'],
    status: getStatus(campaign)
  }));
  
  return stats;
}

function getStatus(campaign) {
  if (!campaign.fields.Active) return 'Inactive';
  if (campaign.fields['Campaign Type'] !== 'webinar') return 'Active';
  
  const webinarTime = new Date(campaign.fields['Webinar Datetime']);
  const now = new Date();
  
  if (webinarTime < now) return 'Completed';
  if (webinarTime < new Date(now.getTime() + 24 * 60 * 60 * 1000)) return 'Starting Soon';
  return 'Active';
}
```

**UI Dashboard Components**:
```typescript
<CampaignDashboard>
  <CampaignList>
    {campaigns.map(campaign => (
      <CampaignCard key={campaign.form_id}>
        <Title>{campaign.campaign_name}</Title>
        <Type>{campaign.type}</Type>
        <Stats>
          <Stat label="Leads" value={campaign.total_leads} />
          <Stat label="Messages" value={campaign.messages_sent} />
          {campaign.type === "webinar" && (
            <>
              <Stat label="Attendance" value={campaign.attendance} />
              <Stat label="Rate" value={`${campaign.attendance_rate}%`} />
            </>
          )}
        </Stats>
        <Status status={campaign.status} />
        <Actions>
          <Button onClick={() => viewDetails(campaign.form_id)}>Details</Button>
          <Button onClick={() => toggleActive(campaign.form_id)}>
            {campaign.active ? "Deactivate" : "Activate"}
          </Button>
        </Actions>
      </CampaignCard>
    ))}
  </CampaignList>
</CampaignDashboard>
```

---

## PHASE 5: TESTING

### TASK 5.1: Test Campaign Creation

**Execute**:
```
TEST CASE 1: Create webinar campaign via UI
Input:
  campaign_name: "Test Webinar - Nov 15"
  form_id: "form_test_nov15"
  campaign_type: "webinar"
  webinar_datetime: "2025-11-15 14:00:00" (ET)
  zoom_link: "https://zoom.us/test123"
  resource_link: "https://example.com/guide.pdf"
  resource_name: "Test Guide"

Expected:
  - Record created in Campaigns table
  - Form ID is unique
  - Active = TRUE
  - Messages Sent = 0

Validation:
  - Query Campaigns table, verify record exists
  - Check all fields populated correctly
```

**Execute**:
```
TEST CASE 2: Create campaign with duplicate Form ID
Input:
  form_id: "form_test_nov15" (same as above)

Expected:
  - Error: "Form ID already exists"
  - No record created

Validation:
  - Verify error message
  - Verify record count unchanged
```

---

### TASK 5.2: Test Lead Ingestion

**Execute**:
```
TEST CASE 3: Ingest lead with valid form_id
Input (webhook payload):
  {
    "email": "test@example.com",
    "first_name": "John",
    "last_name": "Test",
    "phone": "+15551234567",
    "company": "Test Corp",
    "form_id": "form_test_nov15"
  }

Expected:
  - Lead created in Leads table
  - Form ID: "form_test_nov15"
  - Webinar Datetime: "2025-11-15 14:00:00"
  - Lead Source: "Kajabi-Webinar"
  - Processing Status: "Active"
  - SMS Sequence Position: 0
  - Linked Campaign: Link to campaign record

Validation:
  - Query Leads table by email
  - Verify all fields populated
  - Verify Linked Campaign is populated
  - Check campaign Total Leads count increased
```

**Execute**:
```
TEST CASE 4: Ingest lead with unknown form_id
Input (webhook payload):
  {
    "email": "test2@example.com",
    "form_id": "form_unknown"
  }

Expected:
  - Lead created in Leads table
  - Lead Source: "Manual"
  - Processing Status: "HRQ Review"
  - HRQ Reason: "Unknown form ID: form_unknown"
  - Slack alert sent

Validation:
  - Verify lead in HRQ status
  - Verify Slack alert received
  - Verify no Linked Campaign
```

**Execute**:
```
TEST CASE 5: Ingest lead for past webinar
Input:
  Create campaign with webinar_datetime in past
  Ingest lead with that form_id

Expected:
  - Lead created with Processing Status: "Complete"
  - HRQ Reason: "Webinar already passed"
  - Slack alert sent

Validation:
  - Verify status = Complete
  - Verify not in active queue
```

---

### TASK 5.3: Test Webinar Scheduler

**Execute**:
```
TEST CASE 6: Send Message 1 (Acknowledgment)
Setup:
  - Lead with SMS Sequence Position = 0
  - Webinar datetime = 7 days from now
  - Processing Status = Active

Action:
  - Run workflow (or wait for cron)

Expected:
  - SMS sent to lead phone
  - SMS Sequence Position updated to 1
  - SMS Last Sent At = current time
  - SMS_Audit record created
  - Campaign Messages Sent +1
  - Slack notification sent

Validation:
  - Check lead record updated
  - Check SMS_Audit log
  - Check campaign metrics
  - Verify SMS received (test phone)
```

**Execute**:
```
TEST CASE 7: Message timing (24hr reminder)
Setup:
  - Lead with Position = 2
  - Webinar datetime = tomorrow at 2 PM
  - Current time = today at 2 PM (exactly 24 hours before)

Action:
  - Run workflow

Expected:
  - Message 3 (24hr reminder) sent
  - Position updated to 3

Validation:
  - Check message sent within 5-minute window
  - Verify correct template used
```

**Execute**:
```
TEST CASE 8: Duplicate prevention
Setup:
  - Lead just received message 30 minutes ago
  - Position = 1

Action:
  - Run workflow

Expected:
  - Lead skipped (duplicate prevention)
  - No message sent
  - No position update

Validation:
  - Verify no SMS sent
  - Position unchanged
```

**Execute**:
```
TEST CASE 9: Skip message when window passed
Setup:
  - Lead with Position = 1
  - Webinar datetime = 20 hours from now (missed 24hr window)

Action:
  - Run workflow

Expected:
  - Message 2 (value) sent if > 12 hours since last message
  - Message 3 (24hr reminder) will be skipped
  - Next message will be Message 4 (1hr reminder)

Validation:
  - Verify Message 2 sent
  - Verify position = 2
  - Monitor for correct skip of Message 3
```

**Execute**:
```
TEST CASE 10: Complete sequence
Setup:
  - Lead with Position = 3
  - Webinar datetime = 1 hour from now

Action:
  - Run workflow

Expected:
  - Message 4 (1hr reminder) sent
  - Position updated to 4
  - Processing Status = "Complete"
  - Lead removed from active queue

Validation:
  - Verify final message sent
  - Verify status = Complete
  - Verify lead not in next workflow run
```

---

## PHASE 6: ERROR HANDLING & MONITORING

### TASK 6.1: Integrate with Existing Error Handling

**Execute**:
```
REVIEW EXISTING ERROR WORKFLOWS:
- Check if error logging table exists (Error_Log, Retry_Queue, etc.)
- Identify existing Slack alert channels
- Review existing error handling patterns

INTEGRATE WEBINAR ERRORS:
- Log all ingestion errors to existing error table
- Use same Slack channels for alerts
- Follow existing retry patterns for failed SMS sends
- Add webinar-specific error types to existing schema
```

**Error Types to Add**:
```
1. unknown_form_id - Form ID not found in Campaigns table
2. campaign_inactive - Campaign exists but marked inactive
3. missing_webinar_datetime - Webinar campaign missing datetime
4. webinar_past - Webinar datetime is in the past
5. sms_send_failed - SimpleTexting API error
6. campaign_lookup_failed - Error querying Campaigns table
7. duplicate_form_id - Attempt to create campaign with existing Form ID
```

---

### TASK 6.2: Monitoring Dashboard (AI-Readable Metrics)

**Execute**:
```
METRICS TO TRACK (store in Campaigns table or separate Metrics table):

Per Campaign:
- total_leads (count)
- messages_sent (count)
- messages_failed (count)
- avg_messages_per_lead (calculated)
- webinar_attendance_count (manual update post-webinar)
- attendance_rate (calculated)

System-Wide:
- active_campaigns (count)
- total_webinar_leads (count)
- messages_in_queue (leads with position < 4 and webinar not passed)
- error_rate (failed / total * 100)

Timing Metrics:
- avg_time_to_first_message (minutes from ingestion to msg 1)
- message_timing_accuracy (% sent within ±5 min of target)
```

**Slack Alert Types**:
```
1. Daily Summary (8 AM ET):
   - Campaigns running today
   - Webinars happening today
   - Messages scheduled to send today
   - Error count last 24 hours

2. Error Alerts (immediate):
   - Unknown form ID
   - Campaign configuration errors
   - SMS send failures
   - Workflow execution failures

3. Campaign Alerts (immediate):
   - New campaign created
   - Campaign activated/deactivated
   - Webinar starting in 1 hour
   - Webinar completed (summary)
```

---

## VALIDATION CHECKLIST

### Schema Validation
- [ ] Campaigns table created with all fields
- [ ] Form ID field is unique (Airtable setting)
- [ ] Leads table updated with 2 new fields
- [ ] Lead Source has "Kajabi-Webinar" option
- [ ] All field IDs documented

### Ingestion Validation
- [ ] Form ID lookup working
- [ ] Campaign validation logic implemented
- [ ] Error routing to HRQ working
- [ ] Slack alerts firing correctly
- [ ] Linked Campaign populating

### Workflow Validation
- [ ] Scheduler running on correct cron
- [ ] Timezone = America/New_York confirmed
- [ ] Duplicate prevention working (1 hour)
- [ ] Message timing calculation accurate
- [ ] SMS sending successfully
- [ ] Lead updates working
- [ ] SMS_Audit logging working
- [ ] Campaign metrics updating

### UI Validation
- [ ] Campaign creation form working
- [ ] Form ID validation working
- [ ] Past datetime validation working
- [ ] Dashboard showing correct stats
- [ ] Campaign activation/deactivation working

### Testing Validation
- [ ] All 10 test cases passed
- [ ] Timing accuracy >95%
- [ ] No interference with standard leads
- [ ] Error handling working
- [ ] Reporting accurate

---

## ROLLBACK PLAN

If critical issues found:

```
STEP 1: Deactivate workflow
- Set UYSP-Webinar-Nurture-Scheduler to INACTIVE

STEP 2: Stop ingestion routing
- Update ingestion workflow to route all to "Manual" temporarily

STEP 3: Mark active leads
- Set all Kajabi-Webinar leads to Processing Status = "Paused"

STEP 4: Identify issue
- Check Slack alerts
- Review workflow execution logs
- Query error leads in Airtable

STEP 5: Fix issue
- Correct code/config
- Test in isolation

STEP 6: Resume
- Reactivate workflow
- Restore ingestion routing
- Set paused leads back to Active
```

---

## DEPLOYMENT CHECKLIST

- [ ] All Phase 1-3 tasks completed
- [ ] Test Mode successful (10/10 test cases passed)
- [ ] Error handling integrated
- [ ] Monitoring dashboard operational
- [ ] Slack alerts configured
- [ ] UI campaign creation tested
- [ ] Reporting validated
- [ ] Rollback plan documented
- [ ] Stakeholder approval received
- [ ] Production credentials configured

---

## SUCCESS CRITERIA

### Week 1
- ✅ Schema in place
- ✅ Test campaign created
- ✅ Test lead ingested correctly
- ✅ First message sent successfully

### Week 4
- ✅ 95%+ message timing accuracy (±5 min)
- ✅ 90%+ sequence completion rate
- ✅ <2% SMS send failure rate
- ✅ Zero interference with standard leads
- ✅ All error types handled correctly

### Week 12
- ✅ Campaign-level reporting accurate
- ✅ Webinar attendance tracking working
- ✅ ROI analysis data available
- ✅ System running autonomously

---

**STATUS**: Ready for AI Agent Execution  
**FORMAT**: Step-by-step, machine-readable  
**TIMEZONE**: America/New_York (Eastern Time - ALL operations)  
**ERROR HANDLING**: Integrated with existing system  
**REPORTING**: Campaign-level tracking enabled

---

*This document is designed for AI agent consumption and execution. All steps are explicit, unambiguous, and executable.*

