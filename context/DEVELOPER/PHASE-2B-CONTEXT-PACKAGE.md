# PHASE 2B CONTEXT PACKAGE - ICP SCORING SYSTEM
## **DEVELOPER AGENT CONTEXT FOR NEXT DEVELOPMENT SESSION**

### 🎯 **PHASE 2B OBJECTIVE**
**Implement ICP Scoring System (0-100) with tier assignment and score-based routing**

### 🚨 **CRITICAL CONTEXT**

**COMPLETED**: Phase 2A - PDL Person Integration only  
**NEXT**: Phase 2B - ICP Scoring System (Critical for lead qualification)  
**BLOCKED UNTIL COMPLETE**: All SMS functionality requires ≥70 ICP score threshold  

---

## 📋 **EXACT REQUIREMENTS FOR PHASE 2B**

### **Required Workflow Nodes:**

#### **Node 1: Claude AI ICP Scoring**
- **Type**: HTTP Request
- **URL**: OpenAI API endpoint
- **Method**: POST
- **Purpose**: Calculate 0-100 ICP score using AI analysis

#### **Node 2: Domain Fallback Scoring**
- **Type**: Code Node  
- **Purpose**: Fallback scoring when Claude AI fails
- **Logic**: Static domain-based scoring for known B2B companies

#### **Node 3: ICP Tier Assignment**
- **Type**: Code Node
- **Purpose**: Convert score to tier (Ultra/High/Medium/Low/Archive)
- **Logic**: 
  - Ultra: 95-100
  - High: 85-94  
  - Medium: 70-84
  - Low: 50-69
  - Archive: 0-49

#### **Node 4: Score-Based Routing**
- **Type**: IF Node
- **Purpose**: Route based on ≥70 SMS eligibility threshold
- **Logic**: Score ≥70 → SMS path, Score <70 → Archive path

#### **Node 5: Update Airtable with Scores**
- **Type**: Airtable Update
- **Purpose**: Store `icp_score` and `icp_tier` in People table
- **Fields**: icp_score, icp_tier, scoring_method, scoring_date

---

## 📊 **CLAUDE AI SCORING PROMPT**

```javascript
const icpScoringPrompt = `
Score this sales professional 0-100 based on:

PERSON DATA:
- Title: ${pdlData.job_title}
- Company: ${pdlData.job_company_name}  
- Industry: ${pdlData.industry}
- Location: ${pdlData.location_country}
- LinkedIn: ${pdlData.linkedin_url ? 'Yes' : 'No'}

FORM DATA:
- Email Domain: ${emailDomain}
- Phone Provided: ${formData.phone ? 'Yes' : 'No'}
- Company Input: ${formData.company}

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

## 🏗️ **DOMAIN FALLBACK SCORING LOGIC**

```javascript
const domainScoring = {
  // Tier 1 B2B SaaS (95-100)
  'salesforce.com': 95,
  'hubspot.com': 90,
  'microsoft.com': 90,
  'zoom.us': 88,
  
  // Established B2B Tech (85-94)
  'slack.com': 87,
  'atlassian.com': 86,
  'shopify.com': 85,
  'stripe.com': 90,
  
  // Mid-Market B2B (70-84)
  'pipedrive.com': 75,
  'zendesk.com': 73,
  'freshworks.com': 72,
  'mailchimp.com': 74,
  
  // Default for unknown domains
  'unknown': 60
};

// Extract domain from email and lookup score
const emailDomain = email.split('@')[1];
const domainScore = domainScoring[emailDomain] || domainScoring['unknown'];
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

**Phase 2B is the critical foundation for all lead qualification. No SMS development until ICP scoring is operational.**