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
  "prompt": "You are an expert ICP scoring system for Untap Your Sales Potential (UYSP), a B2B sales coaching platform. Score prospects 0-100 using this methodology:\n\n**COMPANY FACTORS (25% max):**\n- B2B SaaS/Tech: 15 points (salesforce.com, hubspot.com, etc. +15 tech boost)\n- Known Brand: +10 points (Fortune 500 recognition)\n- Generic domains: -10 points (gmail.com, yahoo.com, etc.)\n- B2C/Unknown: 2 points max\n\n**ROLE FACTORS (40% max):**\n- Account Executive (any level): 20 points (60%+ of successful customers)\n- Enterprise/Senior AE: +5 bonus (25 total)\n- 3+ years experience: +10 points (proven sweet spot)\n- Recent role change (<90 days): +10 points\n- SDR/BDR: 3 points (99% can't afford)\n- Non-sales: 0 points\n\n**ENGAGEMENT FACTORS (35% max):**\n- 'Yes' to coaching interest: +10 points (critical signal)\n- Multiple touchpoints (3+): 15 points (shows indoctrination)\n- Webinar attendance: 8-10 points\n- Course purchaser: 10 points (proven buyer)\n- Sales-focused motivations: +5 points\n\n**ROUTING LOGIC:**\n- 90-100: Ultra (immediate human call)\n- 75-89: High (same-day outreach)\n- 70-74: Qualified (SMS campaign)\n- <70: Archive\n\n**OUTPUT REQUIRED:** Return JSON with {score: number, tier: string, reason: string, outreach_potential: boolean (true if >=70), human_review_needed: boolean, domain_boost_applied: number}\n\nAnalyze this prospect data and return the JSON scoring result:",
  "parameters": {
    "max_tokens": 1000,
    "temperature": 0.1
  },
  "authentication": {
    "api_key": "${ANTHROPIC_API_KEY}",
    "base_url": "https://api.anthropic.com"
  },
  "timeout": 30000,
  "retry_config": {
    "max_retries": 1,
    "retry_on_status": [502, 503, 504],
    "backoff_factor": 2
  }
}
```

**Environment Variables Required**:
```bash
ANTHROPIC_API_KEY=sk-ant-xxx  # Anthropic API key for Claude AI
CLAUDE_MAX_COST_PER_DAY=10   # Daily cost limit in USD
CLAUDE_TIMEOUT_MS=30000      # API timeout in milliseconds
```

**Expected Output Structure**:
```json
{
  "score": 85,
  "tier": "High",
  "reason": "Tech domain boost +15; Account Executive +20; 3+ years experience +10; Multiple touchpoints +15; Coaching interest +10",
  "outreach_potential": true,
  "human_review_needed": false,
  "domain_boost_applied": 15
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
  "username": "UYSP Lead Bot",
  "security": {
    "verify_ssl": true,
    "user_agent": "UYSP-LeadBot/1.0",
    "timeout": 10000
  },
  "rate_limiting": {
    "max_messages_per_second": 1,
    "burst_limit": 5
  }
}
```

**Environment Variables Required**:
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx  # Slack webhook URL
SLACK_CHANNEL=#sales-alerts                             # Target Slack channel
SLACK_MAX_ALERTS_PER_HOUR=50                           # Rate limiting
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

**SMS Response Database Schema**:
```json
{
  "sms_responses_table": "tblSMSResponses123456",
  "fields": {
    "lead_id": {
      "type": "link",
      "linked_table": "tblPeople",
      "description": "Link to original lead record"
    },
    "response_message": {
      "type": "multilineText",
      "description": "Full SMS response content"
    },
    "response_category": {
      "type": "singleSelect",
      "options": ["interested", "not_interested", "questions"]
    },
    "received_at": {
      "type": "dateTime",
      "description": "When response was received"
    },
    "phone_number": {
      "type": "phoneNumber",
      "description": "Phone number that sent response"
    },
    "forwarded_to_slack": {
      "type": "checkbox",
      "description": "Whether response was forwarded to Davidson"
    }
  }
}
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
2. **International**: Non-US phone numbers (country code ≠ +1)
3. **Unclear Titles**: Job titles containing "specialist", "coordinator", "associate" without clear AE indicators
4. **Data Quality**: Missing key fields (email, name) or suspicious patterns (10+ numbers in name)
5. **Score Conflicts**: Claude AI score differs from domain fallback by >30 points
6. **High Engagement + Low Role**: 30+ engagement points but <10 role points
7. **New Company Domains**: Companies not in domain scoring database

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