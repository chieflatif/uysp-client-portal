[HISTORICAL]
Last Updated: 2025-08-08
Superseded by: .cursorrules/DEVELOPER/DEVELOPER-MASTER-GUIDE.md

# DEVELOPER MASTER CONTEXT - COMPLETE REFERENCE
## **SINGLE SOURCE FOR ALL DEVELOPER CONTEXT NEEDS**

### 🎯 **CURRENT PROJECT STATE** (CRITICAL)

**✅ COMPLETED**: PDL Person Integration (Phase 2A)  
**❌ MISSING**: ICP Scoring System (Phase 2B) - **IMMEDIATE NEXT PRIORITY**  
**🚫 BLOCKED**: All SMS functionality until ≥70 ICP score threshold operational  

---

## 📊 **ACCURATE COMPLETION STATUS**

### **✅ OPERATIONAL COMPONENTS:**
1. **Smart Field Mapper v4.6** - Field normalization with boolean null fix
2. **Duplicate Detection** - Email-based with increment counters  
3. **PDL Person Enrichment** - HTTP Request with proper authentication
4. **PDL Person Processor** - Data extraction with $0.03 cost tracking
5. **PDL Person Routing** - Success/failure paths with Human Review Queue
6. **Airtable Integration** - Create/Update with 67 fields in People table

### **❌ MISSING CRITICAL COMPONENTS:**
1. **ICP Scoring System** - Claude AI + domain fallback + 0-100 calculation
2. **Company Qualification** - PDL Company API + B2B tech verification
3. **Lead Routing Logic** - Score-based routing (≥70 SMS threshold)
4. **Cost Tracking & Limits** - Daily budget enforcement
5. **Phone Strategy** - 3-field validation + international handling

---

## 🏗️ **CURRENT WORKFLOW STRUCTURE**

**Workflow ID**: `wpg9K9s8wlfofv1u` - "UYSP WORKING PRE COMPLIANCE - TESTING ACTIVE"

### **Existing Node Flow:**
```
Kajabi Webhook → Validate API Key → Smart Field Mapper → Check Unknown Fields
                                                              ↓
                                  Log Unknown Fields → Airtable Search → Duplicate Handler
                                                                              ↓
                                              Route by Duplicate → [Update|Create] Airtable
                                                                              ↓
         PDL Person Enrichment → PDL Person Processor → PDL Person Routing
                   ↓                                           ↓
         Human Review Queue ← --------------------------------┘
```

### **Integration Point for Phase 2B:**
- **Insert After**: PDL Person Routing node (`new-pdl-routing`)
- **Connect Before**: Check Unknown Fields (existing flow continuation)
- **Add Nodes**: Claude AI Scoring → Domain Fallback → Tier Assignment → Score Routing

---

## 🎯 **PHASE 2B: ICP SCORING REQUIREMENTS**

### **Required Workflow Nodes:**

#### **Node 1: Claude AI ICP Scoring**
```javascript
{
  "name": "Claude AI ICP Scoring",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "https://api.openai.com/v1/chat/completions",
    "authentication": "predefinedCredentialType",
    "nodeCredentialType": "openAiApi"
  }
}
```

#### **Node 2: Domain Fallback Scoring**
```javascript
{
  "name": "Domain Fallback Scoring", 
  "type": "n8n-nodes-base.code",
  "parameters": {
    "jsCode": "// Domain-based scoring logic for API failures"
  }
}
```

#### **Node 3: ICP Tier Assignment**
```javascript
{
  "name": "ICP Tier Assignment",
  "type": "n8n-nodes-base.code", 
  "parameters": {
    "jsCode": "// Convert 0-100 score to Ultra/High/Medium/Low/Archive tiers"
  }
}
```

#### **Node 4: Score-Based Routing**
```javascript
{
  "name": "Score-Based Routing",
  "type": "n8n-nodes-base.if",
  "parameters": {
    "conditions": {
      "conditions": [{
        "leftValue": "={{$json.icp_score}}",
        "rightValue": "70",
        "operator": {"type": "number", "operation": "gte"}
      }]
    }
  }
}
```

---

## 📊 **CLAUDE AI SCORING PROMPT**

```javascript
const icpScoringPrompt = `
Score this sales professional 0-100 based on:

PERSON DATA:
- Title: ${pdlData.pdl_job_title || 'Unknown'}
- Company: ${pdlData.pdl_company_name || 'Unknown'}  
- Industry: ${pdlData.pdl_industry || 'Unknown'}
- Location: ${pdlData.pdl_country || 'Unknown'}
- LinkedIn: ${pdlData.pdl_linkedin_url ? 'Yes' : 'No'}
- Sales Role: ${pdlData.pdl_is_sales_role ? 'Yes' : 'No'}

FORM DATA:
- Email Domain: ${emailDomain}
- Phone Provided: ${formData.phone ? 'Yes' : 'No'}
- Company Input: ${formData.company || 'Unknown'}

SCORING GUIDELINES:
95-100: Enterprise AE at Tier 1 B2B SaaS (Salesforce, HubSpot, Microsoft)
85-94: Strategic/Enterprise AE at established B2B tech companies  
70-84: Mid-Market AE, Senior SDR, or Sales Manager at B2B companies
50-69: SMB AE, Junior SDR, or unclear sales roles
30-49: Very junior roles, non-sales with revenue responsibility
0-29: Non-sales roles, irrelevant companies

Return only the numeric score (0-100).
`;
```

---

## 🏗️ **DOMAIN FALLBACK LOGIC**

```javascript
const domainScoring = {
  // Tier 1 B2B SaaS (95-100)
  'salesforce.com': 95, 'hubspot.com': 90, 'microsoft.com': 90,
  'zoom.us': 88, 'stripe.com': 90,
  
  // Established B2B Tech (85-94)  
  'slack.com': 87, 'atlassian.com': 86, 'shopify.com': 85,
  'zendesk.com': 87, 'mailchimp.com': 85,
  
  // Mid-Market B2B (70-84)
  'pipedrive.com': 75, 'freshworks.com': 72, 'intercom.com': 78,
  'asana.com': 76, 'notion.so': 74,
  
  // Default for unknown domains  
  'unknown': 60
};

// Implementation
const emailDomain = email.split('@')[1]?.toLowerCase();
const domainScore = domainScoring[emailDomain] || domainScoring['unknown'];
```

---

## 📍 **AIRTABLE INTEGRATION REQUIREMENTS**

### **New Fields to Update:**
- `icp_score` (Number 0-100)
- `icp_tier` (Select: Ultra/High/Medium/Low/Archive)  
- `scoring_method` (Select: claude_ai/domain_fallback)
- `score_breakdown` (Long Text: JSON with component scores)
- `scoring_date` (DateTime: ISO timestamp)

### **Update Node Configuration:**
```javascript
// Add to existing Airtable Create/Update nodes
"icp_score": "={{$json.normalized.icp_score}}",
"icp_tier": "={{$json.normalized.icp_tier}}", 
"scoring_method": "={{$json.normalized.scoring_method}}",
"scoring_date": "={{DateTime.now().toISO()}}"
```

---

## 🛠️ **MCP IMPLEMENTATION PATTERNS**

### **Use Established Phase 2A Patterns:**
```javascript
// Node addition pattern
mcp_n8n_n8n_update_partial_workflow({
  id: "wpg9K9s8wlfofv1u",
  operations: [{
    type: "addNode",
    node: {
      id: "claude-ai-scoring",
      name: "Claude AI ICP Scoring", 
      type: "n8n-nodes-base.httpRequest",
      parameters: { /* scoring config */ },
      position: [300, 380]
    }
  }]
})

// Connection pattern  
mcp_n8n_n8n_update_partial_workflow({
  id: "wpg9K9s8wlfofv1u", 
  operations: [{
    type: "addConnection",
    source: "PDL Person Routing",
    target: "Claude AI ICP Scoring",
    sourceOutput: "main",
    outputIndex: 1  // TRUE path from PDL routing
  }]
})
```

---

## 📊 **TESTING PROTOCOL FOR PHASE 2B**

### **Test Data Sources:**
- **Existing PDL Records**: Use data from Execution 1303
- **Known Domains**: Test salesforce.com, hubspot.com, unknown.com
- **Score Ranges**: Verify all tiers (0-29, 30-49, 50-69, 70-84, 85-94, 95-100)

### **Success Criteria:**
1. ✅ Claude AI scoring operational with real person data
2. ✅ Domain fallback working for API failures
3. ✅ All 5 ICP tiers assigned correctly  
4. ✅ Score ≥70 routing to SMS eligibility path
5. ✅ Score <70 routing to archive/review
6. ✅ Airtable fields updated with scores and tiers

### **Testing Sequence:**
1. **Test Claude AI** with PDL Person data from existing records
2. **Test Domain Fallback** by blocking Claude API temporarily  
3. **Test Tier Assignment** across full score range
4. **Test Score Routing** with ≥70 and <70 scores
5. **Test Airtable Integration** with score field updates
6. **End-to-End Test** with new webhook → PDL → scoring → storage

---

## 🔧 **DEVELOPMENT ENVIRONMENT**

### **Required Credentials:**
- **OpenAI API**: For Claude AI scoring calls
- **PDL API**: Already configured and working
- **Airtable API**: Already configured and working

### **Workflow Context:**
- **Current Branch**: `feature/session-2-pdl-person`
- **Next Branch**: `feature/phase-2b-icp-scoring`
- **Workflow**: Currently active and operational for PDL Person flow

### **Integration Points:**
- **After**: `new-pdl-routing` (PDL Person Routing node)
- **Before**: `3d9c00ef-2b2f-4433-aea9-e8cbc27ee9e5` (Check Unknown Fields)
- **Connect**: Both TRUE path (scoring) and FALSE path (Human Review Queue)

---

## 🚨 **CRITICAL REMINDERS**

1. **NO SMS DEVELOPMENT** until ICP scoring operational with ≥70 threshold
2. **Use Context7** for all n8n documentation accuracy ("use context7" in prompts)  
3. **Follow MCP patterns** from Phase 2A for consistency
4. **Test systematically** with anti-whack-a-mole protocol
5. **Update documentation** immediately upon completion

**Phase 2B is the critical foundation for all lead qualification logic.**