[AUTHORITATIVE]
Last Updated: 2025-08-08

# HUNTER.IO WATERFALL INTEGRATION - COMPREHENSIVE DEVELOPMENT PLAN
## PDL-First Person Enrichment with Hunter Fallback Strategy

**Document Purpose**: Complete technical blueprint for integrating Hunter.io as a fallback enrichment provider after PDL Person API failures. This document serves as a comprehensive handoff for systematic implementation by an AI development agent.

**Status**: Ready for Implementation  
**Branch Strategy**: `feature/pdl-first-hunter-fallback`  
**Project Workspace**: H4VRaaZhd8VKQANf (PROJECT ONLY - Never personal workspace)  
**Base Workflow**: Q2ReTnOliUTuuVpl - "UYSP PHASE 2B - COMPLETE CLEAN REBUILD"  

---

## 🎯 **EXECUTIVE SUMMARY**

### **Business Problem**
Current PDL Person API has high miss rates on valid corporate emails, routing too many qualified leads to human review queue. This reduces automation efficiency and increases manual workload.

### **Solution Architecture**
Implement Hunter.io Email Enrichment as a **non-disruptive fallback** after PDL failures, maintaining PDL as primary enrichment source while capturing LinkedIn profiles, job titles, and company data from Hunter when PDL provides insufficient data.

### **Key Design Principles**
1. **PDL-First**: No changes to existing PDL logic or workflow
2. **Feature-Gated**: Toggle on/off without code changes
3. **Non-Breaking**: Zero impact on current Phase 2B success paths
4. **Cost-Controlled**: Pay-per-hit tracking with daily limits
5. **Additive Schema**: Reuse existing Airtable fields where possible

---

## 📋 **TECHNICAL RESEARCH VALIDATION**

### **Pricing Confirmation (Evidence-Based)**
- **PDL Person API**: $0.03/successful lookup (pay-per-hit)
- **Hunter.io Email Enrichment**: $0.049/credit (Starter plan: $49/month, 1,000 credits)
- **Cost Impact**: +$0.049 only on PDL misses (estimated 30% = +$0.015 average per lead)
- **Daily Budget**: Existing $50 limit accommodates ~1,000 Hunter calls

### **API Endpoint Specifications**
**Hunter Email Enrichment**: `GET https://api.hunter.io/v2/people/find`
- **Authentication**: `X-API-KEY` header (predefined credential pattern)
- **Rate Limits**: 15 requests/second, 500 requests/minute
- **Input**: `email` (required)
- **Response Time**: ~2-3 seconds average
- **Success Rate**: 85%+ on corporate emails (research-validated)

### **Field Mapping Compatibility**
| **Canonical Field** | **PDL Source** | **Hunter Source** | **Precedence** |
|-------------------|---------------|------------------|----------------|
| `linkedin_url` | `linkedin_url` or `profiles.linkedin_url` | `linkedin.handle` → full URL | PDL > Hunter |
| `title_current` | `job_title` | `employment.title` | PDL > Hunter |
| `company_enriched` | `employment.name` | `employment.name` | PDL > Hunter |
| `first_name` | `name.first` | `name.givenName` | Smart Mapper v4.6 |
| `last_name` | `name.last` | `name.familyName` | Smart Mapper v4.6 |

---

## 🏗️ **DETAILED IMPLEMENTATION SPECIFICATIONS**

### **Development Environment Setup**

#### **Branch Creation**
```bash
# Current working branch (verify first)
git status
git branch --show-current

# Create feature branch from current state
git checkout -b feature/pdl-first-hunter-fallback
git push -u origin feature/pdl-first-hunter-fallback
```

#### **n8n Workflow Duplication**
1. **Duplicate Workflow**: Clone Q2ReTnOliUTuuVpl → "UYSP PHASE 2B - HUNTER WATERFALL DEV"
2. **Environment Variables**: Add to PROJECT workspace H4VRaaZhd8VKQANf
   ```javascript
   PERSON_WATERFALL_ENABLED=true     // Feature toggle
   HUNTER_API_KEY=your_key_here      // Hunter credential
   HUNTER_COST_PER_LOOKUP=0.049      // Configurable cost tracking
   ```

#### **Credential Configuration**
- **Type**: `httpHeaderAuth` 
- **Name**: "Hunter API Key"
- **Header Name**: `X-API-KEY`
- **Header Value**: `={{$credentials.hunter_api_key}}`
- **Pattern**: Use predefinedCredentialType (never manual headers)

### **Node-by-Node Implementation**

#### **1. Feature Gate Node (IF - "Waterfall Enabled Check")**
**Position**: After field normalization, before PDL Person Enrichment
**Type**: IF Node
**Configuration**:
```javascript
{
  "parameters": {
    "conditions": {
      "conditions": [{
        "leftValue": "={{$vars.PERSON_WATERFALL_ENABLED}}",
        "rightValue": "true",
        "operator": {
          "type": "string",
          "operation": "equals"
        }
      }]
    }
  },
  "alwaysOutputData": true
}
```
**Routing**:
- **TRUE (index 0)**: Continue to existing PDL Person flow
- **FALSE (index 1)**: Direct bypass to current success path

#### **2. PDL Person Success Router (IF - "PDL Person Success Check")**
**Position**: After existing PDL Person Enrichment
**Type**: IF Node  
**Configuration**:
```javascript
{
  "parameters": {
    "conditions": {
      "conditions": [{
        "leftValue": "={{$json.pdl_person_success}}",
        "rightValue": true,
        "operator": {
          "type": "boolean",
          "operation": "equals"
        }
      }]
    }
  },
  "alwaysOutputData": true
}
```
**Routing**:
- **TRUE (index 0)**: Existing ICP Scoring path (no changes)
- **FALSE (index 1)**: Hunter Enrichment fallback

#### **3. Hunter Email Enrichment Node (HTTP Request)**
**Position**: Connected to PDL failure path (FALSE output, index 1)
**Type**: HTTP Request
**Configuration**:
```javascript
{
  "parameters": {
    "method": "GET",
    "url": "https://api.hunter.io/v2/people/find",
    "authentication": "predefinedCredentialType",
    "nodeCredentialType": "httpHeaderAuth",
    "sendHeaders": false,
    "qs": {
      "email": "={{$json.email}}",
      "api_key": "={{$credentials.hunter_api_key}}"
    },
    "options": {
      "timeout": 30000,
      "retry": {
        "enabled": true,
        "maxTries": 3
      }
    }
  }
}
```

#### **4. Hunter Response Processor (Code Node)**
**Position**: After Hunter HTTP Request
**Type**: Code Node
**Purpose**: Normalize Hunter response to canonical person object
**Implementation**:
```javascript
// Hunter Response Normalization
const hunterData = $input.first().json;

// Extract Hunter fields
const hunterPerson = hunterData.data || {};

// Normalize to canonical format
const canonicalPerson = {
  // Core identity (preserve from input)
  email: $json.email,
  first_name: $json.first_name || hunterPerson.name?.givenName || null,
  last_name: $json.last_name || hunterPerson.name?.familyName || null,
  
  // Hunter enrichment data
  linkedin_url: hunterPerson.linkedin?.handle ? 
    `https://www.linkedin.com/in/${hunterPerson.linkedin.handle}` : null,
  title_current: hunterPerson.employment?.title || null,
  company_enriched: hunterPerson.employment?.name || null,
  
  // Enrichment metadata
  enrichment_vendor: 'hunter',
  enrichment_attempted: true,
  enrichment_failed: false,
  last_enriched: new Date().toISOString(),
  enrichment_confidence: null, // Hunter doesn't provide numeric confidence
  
  // Cost tracking
  hunter_cost: parseFloat(process.env.HUNTER_COST_PER_LOOKUP || 0.049),
  total_processing_cost: ($json.total_processing_cost || 0) + 
    parseFloat(process.env.HUNTER_COST_PER_LOOKUP || 0.049),
  
  // Success flags
  hunter_person_success: !!(hunterPerson.linkedin?.handle || 
    hunterPerson.employment?.title || hunterPerson.employment?.name),
  
  // Preserve all existing data
  ...$json
};

return canonicalPerson;
```

#### **5. Person Data Merger (Code Node)**
**Position**: Merge point for PDL success and Hunter fallback paths
**Type**: Code Node  
**Purpose**: Combine data from both paths with PDL precedence
**Implementation**:
```javascript
// Person Data Merger - PDL Precedence Logic
const inputData = $input.first().json;

// Determine enrichment source and merge strategy
const hasPDLData = inputData.pdl_person_success === true;
const hasHunterData = inputData.hunter_person_success === true;

let mergedPerson = { ...inputData };

if (hasPDLData) {
  // PDL success - preserve PDL data, mark vendor
  mergedPerson.enrichment_vendor = 'pdl';
  mergedPerson.enrichment_method_primary = 'pdl';
  
} else if (hasHunterData) {
  // Hunter fallback success
  mergedPerson.enrichment_vendor = 'hunter';
  mergedPerson.enrichment_method_primary = 'hunter';
  mergedPerson.enrichment_failed = false;
  
} else {
  // Both failed - route to human review
  mergedPerson.enrichment_failed = true;
  mergedPerson.routing_decision = 'human_review';
  mergedPerson.routing_reason = 'person_enrichment_failed_both_providers';
}

// Ensure LinkedIn URL format consistency
if (mergedPerson.linkedin_url && !mergedPerson.linkedin_url.startsWith('http')) {
  mergedPerson.linkedin_url = `https://www.linkedin.com/in/${mergedPerson.linkedin_url}`;
}

return mergedPerson;
```

#### **6. Enrichment Cache Logger (HTTP Request - Airtable)**
**Position**: After Person Data Merger
**Type**: HTTP Request (Airtable)
**Purpose**: Log enrichment attempt to cache table
**Configuration**:
```javascript
{
  "parameters": {
    "method": "POST",
    "url": "https://api.airtable.com/v0/{{$vars.AIRTABLE_BASE_ID}}/Enrichment_Cache",
    "authentication": "predefinedCredentialType",
    "nodeCredentialType": "airtableTokenApi",
    "sendHeaders": false,
    "sendBody": true,
    "bodyParameters": {
      "fields": {
        "email": "={{$json.email}}",
        "source": "={{$json.enrichment_vendor}}",
        "response_data": "={{JSON.stringify($json)}}",
        "cached_date": "={{new Date().toISOString()}}",
        "cache_expiry": "={{new Date(Date.now() + 30*24*60*60*1000).toISOString()}}",
        "cost": "={{$json.enrichment_vendor === 'hunter' ? $json.hunter_cost : 0}}",
        "success": "={{!$json.enrichment_failed}}",
        "error_message": "={{$json.enrichment_failed ? 'Both PDL and Hunter failed' : null}}"
      }
    }
  }
}
```

#### **7. Daily Cost Updater (Code Node)**
**Position**: After cache logging
**Type**: Code Node
**Purpose**: Update daily cost tracking
**Implementation**:
```javascript
// Daily Cost Update Logic
const personData = $input.first().json;
const today = new Date().toISOString().split('T')[0];

// Calculate cost increment
const pdlCost = personData.enrichment_vendor === 'pdl' ? 0.03 : 0;
const hunterCost = personData.enrichment_vendor === 'hunter' ? 
  parseFloat(process.env.HUNTER_COST_PER_LOOKUP || 0.049) : 0;

// Prepare cost update for Daily_Costs table
const costUpdate = {
  date: today,
  pdl_person_costs: pdlCost,
  hunter_costs: hunterCost,
  enrichment_costs: pdlCost + hunterCost,
  total_costs: (pdlCost + hunterCost), // Will be aggregated in Airtable
  person_email: personData.email,
  enrichment_vendor: personData.enrichment_vendor,
  timestamp: new Date().toISOString()
};

return {
  ...personData,
  cost_update: costUpdate
};
```

### **Airtable Schema Updates (Additive Only)**

#### **People Table Additions (Optional Fields)**
```javascript
// New fields to add (all optional - existing workflow continues if null)
const additionalFields = {
  enrichment_vendor: {
    type: 'singleSelect',
    options: ['pdl', 'hunter'],
    description: 'Primary enrichment provider used for this record'
  },
  enrichment_confidence: {
    type: 'number',
    format: 'integer',
    description: 'Confidence score 0-100 from enrichment provider'
  },
  hunter_cost: {
    type: 'currency',
    symbol: '$',
    precision: 3,
    description: 'Cost incurred for Hunter.io enrichment'
  },
  enrichment_method_primary: {
    type: 'singleSelect', 
    options: ['pdl', 'hunter', 'both'],
    description: 'Track which method provided the final data'
  }
};
```

#### **Daily_Costs Table Additions**
```javascript
const dailyCostFields = {
  pdl_person_costs: {
    type: 'currency',
    symbol: '$',
    precision: 3,
    description: 'Daily total PDL Person API costs'
  },
  hunter_costs: {
    type: 'currency', 
    symbol: '$',
    precision: 3,
    description: 'Daily total Hunter.io enrichment costs'
  }
};
```

#### **Field Mapping Preservation**
**CRITICAL**: Reuse existing fields to avoid schema churn:
- `linkedin_url` ← Both PDL and Hunter (normalized to full URL)
- `title_current` ← Both PDL and Hunter 
- `company_enriched` ← Both PDL and Hunter
- `enrichment_attempted` ← Set true for both
- `enrichment_failed` ← Set true only if both fail
- `last_enriched` ← Update timestamp for both
- `total_processing_cost` ← Increment with provider costs

---

## 🧪 **COMPREHENSIVE TESTING STRATEGY**

### **Testing Environment**
- **Workflow**: Development clone of Q2ReTnOliUTuuVpl
- **Test Mode**: `TEST_MODE=true` (existing environment variable)
- **Sample Size**: 100 leads (50 recent PDL failures + 50 PDL successes)
- **Duration**: 48-hour canary period

### **Test Categories & Validation Criteria**

#### **1. Regression Testing (PDL Success Path)**
**Sample**: 50 leads that previously succeeded with PDL
**Validation**:
- [ ] PDL enrichment still succeeds (95%+ success rate maintained)
- [ ] Hunter fallback never triggers for PDL successes
- [ ] ICP scoring inputs unchanged (linkedin_url, title_current, company_enriched)
- [ ] Processing time remains <15 seconds average
- [ ] No schema errors or field mapping issues

#### **2. Fallback Effectiveness (PDL Failure Path)**
**Sample**: 50 leads that previously failed PDL enrichment
**Validation**:
- [ ] Hunter API call triggers only after PDL failure
- [ ] Hunter success rate >70% on corporate emails
- [ ] LinkedIn URLs properly formatted (https://linkedin.com/in/...)
- [ ] Job titles captured and normalized
- [ ] Company names extracted and mapped to company_enriched
- [ ] Failed cases route to human review with proper reason codes

#### **3. Cost Tracking Accuracy**
**Validation**:
- [ ] PDL costs logged only for PDL attempts
- [ ] Hunter costs logged only for Hunter attempts  
- [ ] Daily_Costs table updates correctly
- [ ] Enrichment_Cache entries created with proper source attribution
- [ ] total_processing_cost increments match provider usage
- [ ] Daily limit enforcement working (circuit breaker at $50)

#### **4. Data Quality & Normalization**
**Validation**:
- [ ] No duplicate LinkedIn URLs (PDL vs Hunter precedence working)
- [ ] Title standardization consistent across providers
- [ ] Company name normalization handles case variations
- [ ] Email preservation (no corruption in waterfall process)
- [ ] Phone number fields unchanged (3-field strategy intact)

#### **5. Edge Cases & Error Handling**
**Test Scenarios**:
- [ ] Invalid emails (malformed, bounced)
- [ ] Network timeouts (Hunter API unavailable)
- [ ] Rate limiting scenarios (429 responses)
- [ ] Malformed Hunter responses (invalid JSON)
- [ ] Missing required fields in Hunter response
- [ ] Daily cost limit exceeded during operation

### **Success Criteria (Quantitative)**
- **No Regression**: PDL success path maintains 95%+ success rate
- **Fallback Value**: Hunter captures data for 65%+ of PDL failures
- **Performance**: Total processing time <20 seconds (current 12s + 8s buffer)
- **Cost Accuracy**: 100% cost tracking accuracy (±$0.01)
- **Data Quality**: <5% field mapping errors or data corruption
- **Uptime**: 99%+ API availability during test period

---

## 🔧 **DEVELOPMENT SESSION CONTEXT MANAGEMENT**

### **Session Kickoff Protocol**

#### **Pre-Development Checklist**
1. **Workspace Verification**: Confirm PROJECT workspace H4VRaaZhd8VKQANf access
2. **Branch Status**: Verify `feature/pdl-first-hunter-fallback` branch creation
3. **Baseline Backup**: Export current Q2ReTnOliUTuuVpl workflow JSON
4. **Environment Variables**: Validate all required vars in PROJECT workspace
5. **Credential Setup**: Test Hunter API key with sample call
6. **Tool Validation**: Confirm MCP n8n tools operational

#### **Context Loading Sequence**
```bash
# 1. Load current architecture state
docs/ARCHITECTURE/PHASE-2-REMAINING-ROADMAP.md
docs/ARCHITECTURE/complete-enrichment-architecture-summary.md  
docs/ARCHITECTURE/hunter-waterfall-development-plan.md

# 2. Load platform gotchas and patterns
docs/CURRENT/critical-platform-gotchas.md (focus: GOTCHA #20 IF node config)
.cursorrules/DEVELOPER/DEVELOPER-MASTER-GUIDE.md

# 3. Load workflow context  
mcp_n8n_get_workflow(id: "Q2ReTnOliUTuuVpl") # Current baseline
```

#### **Development Agent Briefing**
**Role**: Senior n8n Developer with Hunter.io integration expertise
**Objective**: Implement PDL-first Hunter fallback without breaking Phase 2B
**Constraints**: PROJECT workspace only, feature-gated, additive schema changes
**Success Definition**: Waterfall working, tests passing, no PDL regression

### **Session Management Guidelines**

#### **Progress Tracking**
- **Use todo_write tool** for task management throughout session
- **Update after each node**: Confirm working before proceeding to next
- **Test incrementally**: Validate each component before integration
- **Document decisions**: Log any deviations from plan with reasoning

#### **Quality Gates**
1. **Node Configuration**: Each node validated with mcp_n8n tools before proceeding
2. **Credential Security**: Never use manual headers, always predefinedCredentialType
3. **Boolean Logic**: IF nodes use proper operation/index mapping (memory:5371063)
4. **Error Handling**: Graceful degradation on API failures
5. **Cost Controls**: Daily limit checks before expensive operations

#### **Rollback Triggers**
- **PDL Regression**: Any decline in existing success metrics
- **Schema Corruption**: Airtable field errors or data loss
- **Performance Degradation**: >25% increase in processing time
- **Cost Overrun**: Unexpected cost spikes or billing errors
- **API Failures**: >10% Hunter API error rate sustained

### **Session Handoff Protocol**

#### **End-of-Session Documentation**
1. **Progress Summary**: Completed nodes, remaining work, blockers
2. **Test Results**: Pass/fail status for each validation category  
3. **Configuration Export**: Updated workflow JSON and environment vars
4. **Cost Analysis**: Actual spend vs. projections
5. **Next Session Prep**: Priority order and context requirements

#### **Continuation Requirements**
- **Workflow State**: Development workflow ID and current node count
- **Branch Status**: Git commit hash and uncommitted changes
- **Test Data**: Sample lead emails and expected outcomes
- **Issue Log**: Any bugs, API quirks, or platform gotchas discovered

---

## 🚨 **RISK MITIGATION & ROLLBACK PROCEDURES**

### **Pre-Implementation Safety Measures**

#### **Workflow Backup Strategy**
```bash
# Before any changes
1. Export Q2ReTnOliUTuuVpl to local JSON file with timestamp
2. Commit current documentation state to git
3. Create workflow snapshot in n8n (duplicate with "BACKUP" prefix)
4. Note current execution ID for baseline comparison
```

#### **Feature Flag Architecture**
```javascript
// Environment-based toggle (zero-code rollback)
if (process.env.PERSON_WATERFALL_ENABLED !== 'true') {
  // Skip all Hunter logic, direct to existing PDL→ICP flow
  return existingPDLFlow(leadData);
}
```

### **Rollback Procedures**

#### **Immediate Rollback (Hot Fix)**
1. **Set Environment Variable**: `PERSON_WATERFALL_ENABLED=false`
2. **Verify Bypass**: Test with sample lead to confirm Hunter nodes skipped
3. **Monitor Metrics**: Confirm PDL success path restored to baseline
4. **Cost Check**: Ensure no Hunter charges post-rollback

#### **Full Rollback (Code Reversion)**
1. **Workflow Restore**: Import pre-implementation Q2ReTnOliUTuuVpl JSON
2. **Environment Cleanup**: Remove Hunter-specific variables
3. **Credential Removal**: Delete Hunter API credential from n8n  
4. **Branch Cleanup**: Archive feature branch, restore main
5. **Documentation Revert**: Git reset to pre-implementation state

#### **Partial Rollback (Debug Mode)**
1. **Isolate Hunter Path**: Set flag to log but not execute Hunter calls
2. **Preserve PDL Flow**: Ensure zero impact on existing enrichment
3. **Debug Logging**: Capture full request/response data for analysis
4. **Gradual Re-enable**: Phase in Hunter with 10%, 25%, 50%, 100% of failures

### **Monitoring & Alerting**

#### **Real-Time Metrics**
- **PDL Success Rate**: Alert if drops below 85% (current: 90%+)
- **Hunter API Errors**: Alert if >5% error rate over 1-hour window
- **Processing Time**: Alert if median >20 seconds (current: 12s)
- **Daily Costs**: Alert at $40 (80% of $50 limit)
- **Human Review Queue**: Alert if >50 leads/day increase

#### **Data Quality Monitors**
- **LinkedIn URL Format**: Validate https:// prefix on Hunter results
- **Title Extraction**: Confirm non-null title_current on Hunter successes
- **Company Mapping**: Verify company_enriched populated from Hunter
- **Schema Integrity**: Check for null values in critical fields

---

## 📊 **SUCCESS METRICS & VALIDATION FRAMEWORK**

### **Quantitative Success Criteria**

#### **Primary Metrics (Must Achieve)**
- **No PDL Regression**: 95%+ success rate maintained on PDL path
- **Hunter Value Add**: 65%+ success rate on PDL failures (baseline: 0%)
- **Cost Efficiency**: <$0.05 average cost increase per lead
- **Performance Stability**: <20 second average processing time
- **Data Quality**: 100% field mapping accuracy (no corruption)

#### **Secondary Metrics (Target Improvements)**
- **Human Review Reduction**: 25% decrease in daily human queue volume
- **ICP Scoring Data**: 90%+ of leads have LinkedIn URL OR job title post-waterfall
- **Lead-to-SMS Conversion**: 15% improvement in qualified leads reaching SMS
- **Overall Enrichment Success**: 90%+ combined PDL+Hunter success rate

### **Qualitative Validation**

#### **Business Impact Assessment**
- **Sales Team Feedback**: Reduced manual research time for leads
- **Data Quality Perception**: Improved confidence in lead intelligence
- **Cost-Benefit Analysis**: ROI positive within 30 days of deployment
- **Operational Efficiency**: Measurable reduction in human intervention needs

#### **Technical Debt Evaluation**
- **Code Maintainability**: Clean, well-documented implementation
- **Platform Stability**: No new recurring bugs or gotchas introduced
- **Scalability**: Architecture supports additional providers in future
- **Monitoring Coverage**: Comprehensive visibility into waterfall performance

### **Go/No-Go Decision Framework**

#### **Go-Live Criteria (All Must Be True)**
1. ✅ **Regression Testing**: 100% pass rate on PDL success scenarios
2. ✅ **Fallback Testing**: >65% Hunter success rate on PDL failures  
3. ✅ **Cost Validation**: Accurate tracking, no surprise charges
4. ✅ **Performance Benchmarks**: <20s processing, >99% uptime
5. ✅ **Data Quality**: Zero critical field mapping errors
6. ✅ **Rollback Validated**: Emergency procedures tested and functional

#### **Hold Criteria (Any Triggers 48-Hour Delay)**
- **PDL Success Rate Drop**: Below 90% for >4 hours
- **Hunter API Issues**: >10% error rate sustained
- **Cost Anomalies**: Unexpected charges or tracking failures
- **Schema Problems**: Any Airtable field corruption detected
- **Performance Degradation**: >30 second processing times

#### **No-Go Criteria (Abort Implementation)**
- **Critical Bug**: Data loss or lead corruption
- **Security Issue**: API credential exposure or unauthorized access
- **Cost Overrun**: >200% of projected Hunter spending
- **Platform Instability**: n8n workflow crashes or hangs
- **Business Disruption**: Sales team workflow interruption

---

## 📝 **FINAL IMPLEMENTATION CHECKLIST**

### **Pre-Development**
- [ ] Branch created: `feature/pdl-first-hunter-fallback`
- [ ] Baseline workflow exported and committed to git
- [ ] Hunter API credentials tested and configured
- [ ] Environment variables set in PROJECT workspace H4VRaaZhd8VKQANf
- [ ] MCP n8n tools verified operational
- [ ] Development agent context loaded and briefed

### **Core Implementation**
- [ ] Feature gate IF node implemented and tested
- [ ] PDL success router IF node configured (operation: "true", index mapping)
- [ ] Hunter HTTP Request node with predefined credentials
- [ ] Hunter response normalization code node
- [ ] Person data merger with PDL precedence logic
- [ ] Enrichment cache logging to Airtable
- [ ] Daily cost tracking updates

### **Schema & Data**
- [ ] Airtable schema additions (enrichment_vendor, hunter_cost fields)
- [ ] Field mapping preservation (linkedin_url, title_current, company_enriched)
- [ ] Data precedence logic (PDL > Hunter)
- [ ] Cost tracking accuracy (per-lead and daily aggregation)

### **Testing & Validation**
- [ ] 100-lead canary test completed
- [ ] Regression testing: PDL success path verified
- [ ] Fallback testing: Hunter success rate measured
- [ ] Cost tracking validation: Accurate billing confirmed
- [ ] Performance testing: <20 second processing time
- [ ] Edge case testing: Error handling and timeouts

### **Safety & Rollback**
- [ ] Feature flag rollback tested (PERSON_WATERFALL_ENABLED=false)
- [ ] Workflow backup validated (can restore to pre-implementation state)
- [ ] Monitoring alerts configured (success rates, costs, performance)
- [ ] Emergency procedures documented and tested
- [ ] Rollback triggers defined and stakeholder-approved

### **Documentation & Handoff**
- [ ] Implementation log with all configuration details
- [ ] Test results documented with pass/fail criteria
- [ ] Cost analysis with actual vs. projected spending
- [ ] Known issues and future enhancements identified
- [ ] Next session context prepared for maintenance/optimization

---

**Document Version**: 1.0  
**Created**: 2025-01-27  
**Status**: Ready for Implementation  
**Estimated Development Time**: 6-8 hours (single focused session)  
**Risk Level**: Low (feature-gated, non-breaking, extensive rollback options)  

**CRITICAL SUCCESS FACTOR**: Maintain existing PDL functionality while adding Hunter value. Any regression in PDL performance triggers immediate rollback procedures.
