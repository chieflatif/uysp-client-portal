# Phase 2B Technical Requirements - ICP Scoring Implementation

## Overview

Phase 2B implements the ICP Scoring V3.0 methodology with human-first workflow, Slack integration, and EST-only business hours for simplified Phase 1 deployment.

---

## Core Technical Components

### 1. Claude AI ICP Scoring Node

**Purpose**: Primary scoring engine using ICP V3.0 algorithm  
**Input**: Normalized lead data from Smart Field Mapper  
**Output**: Structured scoring object with detailed breakdown  

**Required Configuration**:
```json
{
  "model": "claude-3-5-sonnet-20241022",
  "prompt": "ICP_SCORING_V3_PROMPT",
  "parameters": {
    "max_tokens": 1000,
    "temperature": 0.1
  }
}
```

**Expected Output Structure**:
```json
{
  "total_score": 85,
  "tier": "High Priority",
  "breakdown": {
    "company_score": 23,
    "role_score": 35,
    "engagement_score": 27
  },
  "reasoning": "AE at B2B SaaS with multiple touchpoints...",
  "confidence": 0.92
}
```

### 2. Domain Fallback Scoring Node

**Purpose**: Backup scoring when Claude AI fails  
**Trigger**: Claude AI timeout, error, or low confidence (<0.7)  
**Method**: Engagement-weighted domain scoring algorithm  

**Scoring Logic**:
- Base domain score: 40 points
- Engagement multiplier: 1.5x for multiple touchpoints
- Role bonus: +20 for AE titles, +10 for sales roles
- Recent activity bonus: +15 for <30 days

### 3. Score-Based Routing Logic

**Router Configuration**:
```json
{
  "conditions": {
    "ultra_high": "={{$json.total_score >= 90}}",
    "high_priority": "={{$json.total_score >= 75 && $json.total_score < 90}}",
    "qualified": "={{$json.total_score >= 70 && $json.total_score < 75}}",
    "archive": "={{$json.total_score < 70}}"
  }
}
```

**Routing Paths**:
- **90-100**: Davidson immediate call + Slack alert
- **75-89**: Davidson A-list + automated SMS sequence  
- **70-74**: SMS campaign only + B-list report
- **<70**: Archive (no contact)

---

## Slack Integration Requirements

### Real-Time Alert System

**Webhook Configuration**:
```json
{
  "webhook_url": "https://hooks.slack.com/services/[TEAM]/[CHANNEL]/[TOKEN]",
  "channel": "#sales-alerts",
  "username": "UYSP Lead Bot"
}
```

**Alert Triggers**:
1. **Immediate (90+ scores)**: Rich attachment with call priority
2. **A-list (75-89)**: Standard alert with lead details
3. **"Yes" to coaching**: Instant high-priority alert regardless of score
4. **Human Review Queue**: Anomaly alerts with review reasons

**Rich Attachment Format**:
```json
{
  "attachments": [{
    "color": "#FF0000",
    "title": "🚨 ULTRA HIGH PRIORITY LEAD (Score: 95)",
    "fields": [
      {"title": "Name", "value": "John Smith", "short": true},
      {"title": "Company", "value": "Salesforce", "short": true},
      {"title": "Title", "value": "Enterprise AE", "short": true},
      {"title": "Email", "value": "john@salesforce.com", "short": true}
    ],
    "actions": [
      {"type": "button", "text": "Call Now", "url": "tel:+1234567890"},
      {"type": "button", "text": "View Record", "url": "https://airtable.com/..."}
    ]
  }]
}
```

### Action Buttons Integration

**Required Buttons**:
- **Call Now**: Direct tel: link for immediate dialing
- **View Record**: Direct Airtable record link
- **Mark Called**: Update record status via webhook
- **Add to Calendar**: Create calendar event with lead details

---

## SMS Response Handling System

### One-Way SMS Configuration

**Provider**: Twilio (existing integration)  
**From Number**: Existing UYSP business number  
**Message Type**: One-way only (no conversation threads)  

**Response Processing**:
1. **Capture all responses** via webhook
2. **Categorize responses**:
   - Interested: "yes", "call me", "interested"
   - Not interested: "no", "stop", "remove"
   - Questions: Everything else
3. **Forward to Davidson**: All responses via Slack alert
4. **Update lead status**: Response category in Airtable

**Response Categorization Logic**:
```javascript
const responseCategories = {
  interested: ["yes", "call", "interested", "sure", "ok"],
  not_interested: ["no", "stop", "remove", "unsubscribe"],
  questions: [] // Everything else
};
```

### Response Alert Format

**Slack Alert for SMS Responses**:
```json
{
  "text": "📱 SMS RESPONSE RECEIVED",
  "attachments": [{
    "color": "#00FF00",
    "fields": [
      {"title": "Lead", "value": "John Smith (Score: 85)", "short": true},
      {"title": "Response", "value": "Yes, call me tomorrow", "short": false},
      {"title": "Category", "value": "Interested", "short": true},
      {"title": "Original Message", "value": "Template A sent 2 hours ago", "short": true}
    ]
  }]
}
```

---

## Business Hours Logic (EST Only)

### Timezone Requirements

**Phase 1 Simplification**: EST timezone only  
**Business Hours**: Monday-Friday, 9am-5pm EST  
**No Weekend Processing**: Saturday/Sunday = queue for Monday  

**Implementation**:
```javascript
const isBusinessHours = () => {
  const now = new Date();
  const estTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  const day = estTime.getDay(); // 0 = Sunday
  const hour = estTime.getHours();
  
  return day >= 1 && day <= 5 && hour >= 9 && hour < 17;
};
```

**Actions During Business Hours**:
- Immediate SMS sending
- Real-time Slack alerts
- Davidson call availability

**Actions Outside Business Hours**:
- Queue SMS for next business day 9am EST
- Delayed Slack alerts (non-urgent)
- Hold high-priority calls until business hours

---

## Human Review Queue Integration

### Routing Conditions

**Automatic Human Review Triggers**:
1. **Anomalies**: High engagement score (>25) but non-sales title
2. **International**: Non-US phone numbers
3. **Unclear Titles**: Job titles requiring manual AE verification
4. **Data Quality**: Missing key fields or suspicious data patterns

**Review Queue Fields**:
```json
{
  "review_reason": "High engagement but unclear title",
  "automated_score": 45,
  "suggested_action": "Manual title verification needed",
  "priority": "Medium",
  "assigned_to": "Davidson",
  "review_status": "Pending"
}
```

### Review Workflow

**Slack Review Alert**:
```json
{
  "text": "👤 HUMAN REVIEW REQUIRED",
  "attachments": [{
    "color": "#FFAA00",
    "title": "Lead Review: Jane Doe",
    "fields": [
      {"title": "Reason", "value": "High engagement but unclear title", "short": false},
      {"title": "Title", "value": "Customer Success Specialist", "short": true},
      {"title": "Engagement", "value": "Multiple webinars + course purchase", "short": true}
    ],
    "actions": [
      {"type": "button", "text": "Approve & Score", "value": "approve"},
      {"type": "button", "text": "Reject", "value": "reject"},
      {"type": "button", "text": "Need More Info", "value": "investigate"}
    ]
  }]
}
```

---

## Error Handling & Monitoring

### Claude AI Failure Handling

**Timeout Handling**: 30-second timeout → Domain fallback  
**Error Logging**: All Claude AI failures logged to monitoring  
**Retry Logic**: Single retry on 5xx errors, no retry on 4xx  

### Slack Integration Monitoring

**Health Checks**: Hourly ping to Slack webhook  
**Failure Alerts**: Email notification if Slack down >15 minutes  
**Rate Limiting**: Respect Slack API limits (1 message/second)  

### SMS Delivery Monitoring

**Delivery Confirmation**: Track all SMS delivery status  
**Failed Delivery Alert**: Slack notification for delivery failures  
**Cost Monitoring**: Daily SMS cost alerts if >$50/day  

---

## Performance Requirements

### Response Times

- **ICP Scoring**: <10 seconds end-to-end
- **Slack Alerts**: <5 seconds from trigger
- **SMS Delivery**: <2 minutes during business hours
- **Review Queue**: <1 second for route determination

### Volume Capacity

- **Peak Load**: 100 leads/hour processing capacity
- **Daily Volume**: 500-1000 leads/day target
- **Slack Alerts**: Up to 50 alerts/hour without rate limiting
- **SMS Volume**: 200 messages/day initial capacity

---

## Implementation Priority

### Phase 2B Immediate (Week 1)
1. Claude AI ICP Scoring node
2. Score-based routing logic
3. Basic Slack alerts (text only)
4. EST business hours logic

### Phase 2B Enhancement (Week 2)
1. Rich Slack attachments with action buttons
2. SMS response handling and categorization
3. Human Review Queue automation
4. Domain fallback scoring system

### Phase 2B Polish (Week 3)
1. Advanced error handling and monitoring
2. Performance optimization
3. Comprehensive testing with real data
4. Documentation and handover preparation

---

**Document Status**: ✅ **COMPLETE - TECHNICAL SPECIFICATIONS**  
**Last Updated**: 2025-01-27  
**Implementation Ready**: Phase 2B development can begin immediately  
**Dependencies**: ICP-SCORING-V3-METHODOLOGY.md, Phase 2A PDL Person integration