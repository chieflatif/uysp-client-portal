[HISTORICAL]
Last Updated: 2025-08-08

# PHASE 2B CONTEXT PACKAGE - ICP SCORING V3.0 SYSTEM
## **DEVELOPER AGENT CONTEXT FOR NEXT DEVELOPMENT SESSION**

### 🎯 **PHASE 2B OBJECTIVE**
**Implement ICP Scoring V3.0 System (0-100) with human-first workflow, Slack integration, and EST-only business hours**

### 🚨 **CRITICAL CONTEXT**

**COMPLETED**: Phase 2A - PDL Person Integration only  
**NEXT**: Phase 2B - ICP Scoring System (Critical for lead qualification)  
**BLOCKED UNTIL COMPLETE**: All SMS functionality requires ≥70 ICP score threshold  

---

## 📋 **EXACT REQUIREMENTS FOR PHASE 2B - ICP V3.0**

### **Core Workflow Nodes (V3.0 Implementation):**

#### **Node 1: Claude AI ICP Scoring V3.0**
- **Type**: HTTP Request (OpenAI API)
- **Purpose**: Calculate 0-100 ICP score using V3.0 methodology
- **Weights**: Engagement (35%), Role (40%), Company (25%)
- **Input**: Normalized lead data + PDL Person data
- **Output**: Structured score with breakdown and reasoning

#### **Node 2: Domain Fallback Scoring**
- **Type**: Code Node  
- **Purpose**: Engagement-weighted fallback when Claude AI fails
- **Logic**: Base domain score + engagement multipliers + role bonuses

#### **Node 3: Score-Based Routing (V3.0 Tiers)**
- **Type**: IF Node
- **Purpose**: Route based on V3.0 score ranges
- **Logic**: 
  - Ultra High (90-100): Davidson calls immediately
  - High Priority (75-89): Davidson A-list + automated SMS
  - Qualified (70-74): SMS campaign only  
  - Archive (<70): No contact

#### **Node 4: Slack Integration System**
- **Type**: HTTP Request (Slack Webhook)
- **Purpose**: Real-time alerts to Davidson for 75+ scores
- **Features**: Rich attachments, action buttons, immediate call alerts

#### **Node 5: SMS Response Handler**
- **Type**: Code Node
- **Purpose**: Process one-way SMS responses and categorize
- **Categories**: Interested, Not Interested, Questions

#### **Node 6: Human Review Queue**
- **Type**: Code Node + Airtable Update
- **Purpose**: Route anomalies and unclear titles for manual review
- **Triggers**: High engagement + wrong title, international leads

#### **Node 7: Business Hours Logic (EST Only)**
- **Type**: Code Node
- **Purpose**: EST timezone enforcement (9am-5pm, Mon-Fri)
- **Actions**: Queue outside hours, immediate during business hours

#### **Node 8: Update Airtable with V3.0 Data**
- **Type**: Airtable Update
- **Purpose**: Store complete V3.0 scoring data
- **Fields**: icp_score, icp_tier, score_breakdown, engagement_score, role_score, company_score, slack_alert_sent, sms_status

---

## 📊 **CLAUDE AI SCORING PROMPT (V3.0 METHODOLOGY)**

```javascript
const icpScoringPromptV3 = `
You are scoring sales professionals for UYSP membership qualification using the V3.0 methodology.

PERSON DATA:
- Title: ${pdlData.job_title}
- Company: ${pdlData.job_company_name}  
- Industry: ${pdlData.industry}
- LinkedIn: ${pdlData.linkedin_url ? 'Yes' : 'No'}
- Recent Role Change: ${recentRoleChange ? 'Yes (<90 days)' : 'No'}

ENGAGEMENT DATA:
- Touchpoints: ${engagementData.touchpoints || 0}
- Recent Activity: ${engagementData.recent_activity || 'None'}
- UYSP History: ${engagementData.uysp_history || 'None'}
- Said Yes to Coaching: ${engagementData.coaching_interest || 'Unknown'}

COMPANY DATA:
- Company Type: ${companyData.type || 'Unknown'}
- Email Domain: ${emailDomain}

SCORING WEIGHTS (V3.0):
- ENGAGEMENT (35 points max): Multiple touchpoints = critical, "Yes" to coaching = +10 bonus
- ROLE (40 points max): Account Executive (any level) = 20 points, AE-first approach
- COMPANY (25 points max): B2B tech = 15 points, company size irrelevant per client feedback

KEY PRINCIPLES:
- AE at startup scores same as AE at Salesforce if engagement equal
- Multiple touchpoints show "indoctrination" - key buying signal  
- Company size nearly irrelevant - startups need coaching too
- "Yes" to coaching = immediate high priority regardless of other factors

TIER TARGETS:
90-100: Ultra High (Davidson calls immediately)
75-89: High Priority (A-list for calling)  
70-74: Qualified (SMS only)
<70: Archive (no contact)

Return JSON: {"total_score": 85, "company_score": 23, "role_score": 35, "engagement_score": 27, "reasoning": "AE at B2B SaaS with multiple touchpoints"}
`;
```

---

## 🏗️ **DOMAIN FALLBACK SCORING LOGIC (V3.0 ENGAGEMENT-WEIGHTED)**

```javascript
const domainFallbackV3 = (leadData) => {
  // Base company score (max 25 points per V3.0)
  const companyScore = getCompanyScore(leadData.emailDomain, leadData.companyType);
  
  // Role score (max 40 points per V3.0)  
  const roleScore = getRoleScore(leadData.title, leadData.department);
  
  // Engagement score (max 35 points per V3.0)
  const engagementScore = getEngagementScore(leadData.touchpoints, leadData.uyspHistory);
  
  return {
    total_score: companyScore + roleScore + engagementScore,
    company_score: companyScore,
    role_score: roleScore, 
    engagement_score: engagementScore,
    scoring_method: 'domain_fallback_v3'
  };
};

const getCompanyScore = (domain, type) => {
  const companyScores = {
    // B2B SaaS/Tech (0-15 points)
    'salesforce.com': 15, 'hubspot.com': 15, 'microsoft.com': 15,
    'zoom.us': 15, 'slack.com': 15, 'atlassian.com': 15,
    
    // B2B Tech Services (0-5 points)  
    'accenture.com': 5, 'deloitte.com': 5,
    
    // Unknown B2B (8 points default)
    'unknown_b2b': 8
  };
  
  return companyScores[domain] || companyScores['unknown_b2b'];
};

const getRoleScore = (title, department) => {
  // AE-first approach per V3.0
  if (title.includes('Account Executive')) return 20;
  if (title.includes('Enterprise') && title.includes('AE')) return 25; // +5 bonus
  if (title.includes('Account Director') || title.includes('Account Manager')) return 18;
  if (title.includes('Sales Manager') || title.includes('Team Lead')) return 10;
  if (title.includes('VP') || title.includes('Director')) return 8;
  if (title.includes('SDR') || title.includes('BDR')) return 3;
  
  // Department bonus
  if (department === 'Sales' || department === 'Revenue') return Math.min(roleScore + 10, 40);
  
  return 0; // Non-sales auto-exclude
};

const getEngagementScore = (touchpoints, uyspHistory) => {
  let score = 0;
  
  // Touchpoints (critical per V3.0)
  if (touchpoints >= 3) score += 15; // Multiple touchpoints = indoctrination
  else if (touchpoints === 2) score += 8;
  else if (touchpoints === 1) score += 3;
  
  // UYSP History bonuses
  if (uyspHistory.includes('course_purchaser')) score += 10;
  if (uyspHistory.includes('webinar_attendee')) score += 8;
  if (uyspHistory.includes('bronze_member')) score += 8;
  
  return Math.min(score, 35); // Cap at 35 points
};
```

---

## 📍 **INTEGRATION POINTS**

### **Input Data Sources:**
1. **PDL Person Data**: From `PDL Person Processor` node
   - job_title, job_company_name, industry, linkedin_url
2. **Form Submission Data**: From `Smart Field Mapper` node  
   - email, phone, company, title
3. **Processing Context**: Current workflow execution data

### **Output Data Requirements:**
1. **icp_score**: Numeric 0-100 score
2. **icp_tier**: Text tier (Ultra/High/Medium/Low/Archive)  
3. **scoring_method**: 'claude_ai' or 'domain_fallback'
4. **score_breakdown**: JSON with component scores
5. **scoring_date**: ISO timestamp of scoring

### **Workflow Integration:**
- **Insert After**: PDL Person Routing node (current end of PDL flow)
- **Connect To**: Existing Airtable Create/Update nodes
- **Add New Path**: Score-based routing for future SMS eligibility

---

## 🛠️ **IMPLEMENTATION STRATEGY**

### **Phase 2B Development Sequence:**
1. **Add Claude AI HTTP Request node** after PDL Person Routing
2. **Add Domain Fallback Code node** for API failure handling  
3. **Add ICP Tier Assignment Code node** for score → tier conversion
4. **Add Score-Based Routing IF node** for ≥70 threshold
5. **Update Airtable nodes** to include scoring fields
6. **Test with real PDL data** from Phase 2A

### **Testing Protocol:**
- **Use existing PDL Person data** from Execution 1303
- **Test Claude AI scoring** with real person profiles
- **Test domain fallback** with known/unknown domains
- **Verify tier assignment** for different score ranges
- **Confirm Airtable updates** with scoring fields

---

## 📊 **SUCCESS CRITERIA FOR PHASE 2B**

### **Functional Requirements:**
✅ Claude AI scoring operational (0-100 calculation)  
✅ Domain fallback scoring working for API failures  
✅ ICP tier assignment functional (Ultra/High/Medium/Low/Archive)  
✅ Score-based routing implemented (≥70 threshold)  
✅ Airtable integration updated with scoring fields  

### **Testing Requirements:**
✅ End-to-end test: PDL Person → ICP Scoring → Tier → Airtable  
✅ API failure test: Claude fails → Domain fallback → Success  
✅ Score range test: Verify all tiers (0-29, 30-49, 50-69, 70-84, 85-94, 95-100)  
✅ Real data test: Use existing PDL records for scoring validation  

### **Integration Requirements:**
✅ No disruption to existing PDL Person flow  
✅ Maintains connection to Human Review Queue  
✅ Preserves all existing field normalization logic  
✅ Ready for Phase 2C (Company Qualification) integration  

---

## 🔧 **MCP TOOLS & PATTERNS**

### **Use Established Patterns from Phase 2A:**
- **mcp_n8n_n8n_update_partial_workflow**: Add new nodes to existing workflow
- **mcp_n8n_validate_workflow**: Verify structure after changes  
- **Context7 integration**: Use "use context7" for n8n documentation accuracy
- **Testing Agent protocols**: Systematic validation with evidence collection

### **Workflow ID**: wpg9K9s8wlfofv1u (UYSP WORKING PRE COMPLIANCE - TESTING ACTIVE)

### **Critical Integration Points:**
- **After**: PDL Person Routing node (new-pdl-routing)
- **Before**: Check Unknown Fields node (existing routing)
- **Connect**: Both TRUE and FALSE paths from PDL routing to scoring

---

## 🔔 **SLACK INTEGRATION REQUIREMENTS**

### **Slack Webhook Configuration:**
```javascript
const slackConfig = {
  webhook_url: "https://hooks.slack.com/services/[TEAM]/[CHANNEL]/[TOKEN]",
  channel: "#sales-alerts",
  username: "UYSP Lead Bot"
};
```

### **Alert Triggers (V3.0):**
- **90+ scores**: Ultra High alert with immediate call priority
- **75-89 scores**: High Priority A-list alert  
- **"Yes" to coaching**: Instant alert regardless of score
- **Human Review**: Anomaly alerts for manual review

### **Rich Attachment Format:**
```javascript
const slackAlert = {
  "color": score >= 90 ? "#FF0000" : "#FFAA00",
  "title": `🚨 ${score >= 90 ? 'ULTRA HIGH' : 'HIGH'} PRIORITY LEAD (Score: ${score})`,
  "fields": [
    {"title": "Name", "value": leadData.name, "short": true},
    {"title": "Title", "value": leadData.title, "short": true},
    {"title": "Company", "value": leadData.company, "short": true},
    {"title": "Score Breakdown", "value": `E:${engagementScore} R:${roleScore} C:${companyScore}`, "short": true}
  ],
  "actions": [
    {"type": "button", "text": "Call Now", "url": `tel:${leadData.phone}`},
    {"type": "button", "text": "View Record", "url": airtableRecordUrl}
  ]
};
```

---

## 📱 **SMS RESPONSE HANDLING REQUIREMENTS**

### **One-Way SMS Configuration:**
- **Provider**: Twilio (existing)
- **Type**: One-way only (no conversation threads)
- **Business Hours**: EST only (9am-5pm, Mon-Fri)

### **Response Processing Logic:**
```javascript
const categorizeResponse = (message) => {
  const interested = ["yes", "call", "interested", "sure", "ok"];
  const notInterested = ["no", "stop", "remove", "unsubscribe"];
  
  const lowerMessage = message.toLowerCase();
  
  if (interested.some(word => lowerMessage.includes(word))) return "interested";
  if (notInterested.some(word => lowerMessage.includes(word))) return "not_interested";
  return "questions"; // Everything else
};
```

### **Response Slack Alert:**
```javascript
const smsResponseAlert = {
  "color": "#00FF00",
  "title": "📱 SMS RESPONSE RECEIVED",
  "fields": [
    {"title": "Lead", "value": `${leadData.name} (Score: ${leadData.icp_score})`, "short": true},
    {"title": "Response", "value": responseMessage, "short": false},
    {"title": "Category", "value": responseCategory, "short": true}
  ]
};
```

---

## ⏰ **BUSINESS HOURS LOGIC (EST ONLY)**

### **EST Timezone Enforcement:**
```javascript
const isBusinessHours = () => {
  const now = new Date();
  const estTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  const day = estTime.getDay(); // 0 = Sunday
  const hour = estTime.getHours();
  
  return day >= 1 && day <= 5 && hour >= 9 && hour < 17;
};
```

### **Actions by Time:**
- **Business Hours**: Immediate SMS + real-time Slack alerts
- **Outside Hours**: Queue SMS for 9am EST + delayed alerts

---

## 🎯 **CRITICAL SUCCESS CRITERIA**

### **V3.0 Functional Requirements:**
✅ Claude AI scoring with V3.0 weights (E:35%, R:40%, C:25%)  
✅ Score-based routing (90+, 75-89, 70-74, <70)  
✅ Slack integration with rich attachments and action buttons  
✅ SMS response handling with categorization  
✅ Business hours logic (EST only)  
✅ Human Review Queue for anomalies  

### **Integration Requirements:**  
✅ References ICP-SCORING-V3-METHODOLOGY.md  
✅ References PHASE-2B-TECHNICAL-REQUIREMENTS.md  
✅ No disruption to Phase 2A PDL Person flow  
✅ Ready for Phase 2C Company Qualification integration  

**Phase 2B V3.0 is the critical foundation for human-first lead qualification with real-time Davidson alerts.**