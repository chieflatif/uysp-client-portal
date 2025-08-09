[HISTORICAL]
Last Updated: 2025-08-08

# PHASE 2B - IMMEDIATE NEXT STEPS
## **CRYSTAL CLEAR DEVELOPMENT ROADMAP FOR ICP SCORING SYSTEM**

### 🎯 **IMMEDIATE PRIORITY: ICP SCORING SYSTEM**

**WHY CRITICAL**: No lead qualification possible without ICP scoring. SMS eligibility requires ≥70 score threshold. Current workflow creates leads but cannot qualify them for campaigns.

---

## 📋 **EXACT DEVELOPMENT SEQUENCE**

### **STEP 1: PREPARE DEVELOPMENT ENVIRONMENT**
```bash
# Ensure on correct branch
git status
# Should be on: feature/session-2-pdl-person

# Create Phase 2B branch
git checkout -b feature/phase-2b-icp-scoring
git push -u origin feature/phase-2b-icp-scoring
```

### **STEP 2: LOAD DEVELOPER CONTEXT**
1. **Read**: `context/DEVELOPER/DEVELOPER-MASTER-CONTEXT.md` (complete reference)
2. **Read**: `context/DEVELOPER/PHASE-2B-CONTEXT-PACKAGE.md` (specific requirements)
3. **Reference**: `docs/sessions/session-4-icp-scoring-qualification.md` (detailed specifications)

### **STEP 3: VERIFY CURRENT WORKFLOW STATE**
```javascript
// Use this MCP call to confirm current structure
mcp_n8n_n8n_get_workflow({ id: "wpg9K9s8wlfofv1u" })

// Expected: PDL Person Routing node exists and operational
// Integration point: After "new-pdl-routing" node
```

### **STEP 4: IMPLEMENT ICP SCORING NODES (IN ORDER)**

#### **4A: Add Claude AI Scoring Node**
```javascript
mcp_n8n_n8n_update_partial_workflow({
  id: "wpg9K9s8wlfofv1u",
  operations: [{
    type: "addNode",
    node: {
      id: "claude-ai-icp-scoring",
      name: "Claude AI ICP Scoring",
      type: "n8n-nodes-base.httpRequest",
      position: [260, 300],
      parameters: {
        method: "POST",
        url: "https://api.openai.com/v1/chat/completions",
        authentication: "predefinedCredentialType",
        nodeCredentialType: "openAiApi",
        sendBody: true,
        bodyParameters: {
          parameters: [
            { name: "model", value: "gpt-4" },
            { name: "messages", value: "={{[{role: 'user', content: $json.scoring_prompt}]}}" },
            { name: "temperature", value: "0.1" },
            { name: "max_tokens", value: "10" }
          ]
        }
      }
    }
  }]
})
```

#### **4B: Add Domain Fallback Node**
```javascript
mcp_n8n_n8n_update_partial_workflow({
  id: "wpg9K9s8wlfofv1u", 
  operations: [{
    type: "addNode",
    node: {
      id: "domain-fallback-scoring",
      name: "Domain Fallback Scoring",
      type: "n8n-nodes-base.code",
      position: [420, 300],
      parameters: {
        jsCode: `// Domain Fallback Scoring Logic - See DEVELOPER-MASTER-CONTEXT.md`
      }
    }
  }]
})
```

#### **4C: Add ICP Tier Assignment Node**
```javascript
mcp_n8n_n8n_update_partial_workflow({
  id: "wpg9K9s8wlfofv1u",
  operations: [{
    type: "addNode", 
    node: {
      id: "icp-tier-assignment",
      name: "ICP Tier Assignment",
      type: "n8n-nodes-base.code",
      position: [580, 300],
      parameters: {
        jsCode: `// ICP Tier Assignment: 95-100=Ultra, 85-94=High, 70-84=Medium, 50-69=Low, 0-49=Archive`
      }
    }
  }]
})
```

#### **4D: Add Score-Based Routing Node**
```javascript
mcp_n8n_n8n_update_partial_workflow({
  id: "wpg9K9s8wlfofv1u",
  operations: [{
    type: "addNode",
    node: {
      id: "score-based-routing", 
      name: "Score-Based Routing",
      type: "n8n-nodes-base.if",
      position: [740, 300],
      parameters: {
        conditions: {
          conditions: [{
            leftValue: "={{$json.icp_score}}",
            rightValue: "70",
            operator: {"type": "number", "operation": "gte"}
          }]
        }
      }
    }
  }]
})
```

### **STEP 5: CONNECT NODES TO WORKFLOW**
```javascript
// Connect PDL Person Routing TRUE path to Claude AI Scoring
mcp_n8n_n8n_update_partial_workflow({
  id: "wpg9K9s8wlfofv1u",
  operations: [{
    type: "addConnection",
    source: "PDL Person Routing",
    target: "Claude AI ICP Scoring", 
    sourceOutput: "main",
    outputIndex: 1  // TRUE path from PDL success
  }]
})

// Chain the scoring nodes together
// Claude AI → Domain Fallback → Tier Assignment → Score Routing → Check Unknown Fields
```

### **STEP 6: UPDATE AIRTABLE INTEGRATION**
```javascript
// Update existing Airtable Create/Update nodes to include ICP scoring fields
mcp_n8n_n8n_update_partial_workflow({
  id: "wpg9K9s8wlfofv1u",
  operations: [{
    type: "updateNode",
    nodeId: "d90fc896-6f59-4dc6-beb0-72cf31b4291d", // Airtable Create node
    changes: {
      "parameters.columns.value.icp_score": "={{$json.normalized.icp_score}}",
      "parameters.columns.value.icp_tier": "={{$json.normalized.icp_tier}}",
      "parameters.columns.value.scoring_method": "={{$json.normalized.scoring_method}}",
      "parameters.columns.value.scoring_date": "={{DateTime.now().toISO()}}"
    }
  }]
})
```

### **STEP 7: TESTING PROTOCOL**
1. **Test Claude AI Scoring** with existing PDL Person data
2. **Test Domain Fallback** by simulating API failure
3. **Test All Tier Assignments** (Ultra/High/Medium/Low/Archive)
4. **Test Score Routing** with ≥70 and <70 scores
5. **Test End-to-End** with webhook → PDL → scoring → Airtable

### **STEP 8: VALIDATION & DOCUMENTATION**
1. **Execute Testing Agent protocol** for systematic validation
2. **Update memory_bank/progress.md** with Phase 2B completion
3. **Update docs/testing-registry-master.md** with test results
4. **Commit and backup** with descriptive message

---

## 🧩 **IMPLEMENTATION DETAILS**

### **Claude AI Scoring Prompt (Complete)**
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
- Email Domain: ${email.split('@')[1]}
- Phone Provided: ${phone ? 'Yes' : 'No'}
- Company Input: ${company || 'Unknown'}

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

### **Domain Fallback Scoring (Complete)**
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
  
  // Default fallback
  'unknown': 60
};

const emailDomain = email.split('@')[1]?.toLowerCase();
const domainScore = domainScoring[emailDomain] || domainScoring['unknown'];
```

### **ICP Tier Assignment (Complete)**
```javascript
function assignIcpTier(score) {
  if (score >= 95) return 'Ultra';
  if (score >= 85) return 'High'; 
  if (score >= 70) return 'Medium';
  if (score >= 50) return 'Low';
  return 'Archive';
}
```

---

## ✅ **SUCCESS CRITERIA FOR PHASE 2B**

### **Functional Requirements:**
- [ ] Claude AI scoring operational (0-100 calculation)
- [ ] Domain fallback working for API failures  
- [ ] ICP tier assignment functional (Ultra/High/Medium/Low/Archive)
- [ ] Score-based routing implemented (≥70 threshold)
- [ ] Airtable integration updated with scoring fields

### **Testing Requirements:**
- [ ] End-to-end test: PDL Person → ICP Scoring → Tier → Airtable
- [ ] API failure test: Claude fails → Domain fallback → Success
- [ ] Score range test: All tiers (0-29, 30-49, 50-69, 70-84, 85-94, 95-100)
- [ ] Real data test: Use existing PDL records for scoring validation

### **Integration Requirements:**
- [ ] No disruption to existing PDL Person flow
- [ ] Maintains connection to Human Review Queue
- [ ] Preserves all existing field normalization logic  
- [ ] Ready for Phase 2C (Company Qualification) integration

**CRITICAL**: Phase 2B completion unlocks lead qualification. Phase 2C and 2D can proceed in parallel after this foundation is operational.