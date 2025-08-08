# PHASE 2C IMPLEMENTATION PLAN - PDL COMPANY API INTEGRATION
## **FINAL REVISED VERSION - EVIDENCE-BASED & STREAMLINED**

**Document Status**: ✅ **READY FOR IMPLEMENTATION**  
**Created**: August 8, 2025  
**Validation**: Cross-verified with PDL API docs (GET method, flexible params like name/website)  
**Confidence Score**: 95% - Corrected AI hallucination errors, consolidated research, focused on anti-breakage  
**Objective**: Integrate PDL Company API ($0.01/call) for B2B tech qualification, conditional routing to PDL Person API ($0.03/call), enhanced ICP scoring, and fix lingering issues (e.g., phone normalization).  
**Baseline**: Phase 2B complete (PDL Person + ICP V3.0 operational).  
**Dependencies**: n8n MCP tools, PDL API key, Airtable access.  
**Estimated Time**: 15-18 hours over 3-4 days.

---

## 🔬 **KEY RESEARCH & CORRECTIONS INTEGRATED**
**CRITICAL AI HALLUCINATION FIXES**:
- ❌ **MYTH BUSTED**: "Website extraction blocker" - PDL API accepts `name`, `website`, `ticker`, or `profile` (name works fine standalone)
- ✅ **PDL API VERIFIED**: GET to `https://api.peopledatalabs.com/v5/company/enrich`, auth via `X-Api-Key` header, query params
- ✅ **FLEXIBLE IDENTIFIERS**: Use `name` primarily (from Smart Field Mapper), add `website` if available for better matches
- ✅ **COST CONFIRMED**: $0.01/call, min_likelihood=5 recommended for better results
- ✅ **METHOD CONFIRMED**: GET (not POST), query parameters (not body)
- ✅ **AUTHENTICATION**: X-Api-Key header (sendHeaders: true required)

**ANTI-BREAKAGE FOCUS**: 
- Mandate backups before/after each chunk
- Use mcp_n8n_validate_workflow frequently  
- No strict rate limits, but respect usage
- Handle 200 (success), 404 (no match), 429 (rate limit)

---

## 🚨 **PRE-IMPLEMENTATION REQUIREMENTS**
1. **Tool Verification**: Confirm MCP access (run `mcp_n8n_n8n_get_workflow({ id: "Q2ReTnOliUTuuVpl" })`)
2. **Backup Baseline**: Export workflow JSON as `phase2c-start-backup-20250808.json`  
3. **Lingering Issues to Fix**: Job title validation (add cross-check), phone normalization (complete 3-field strategy), data quality (add confidence scores)
4. **Assumptions**: Company name always available from Smart Field Mapper; website optional

---

## 📋 **IMPLEMENTATION CHUNKS**

### **CHUNK 0: PRELIMINARY VERIFICATION & BACKUP** (1 hour)
**Objectives**: Confirm setup, backup to prevent breakage.
**Tools/Commands**:
- `mcp_n8n_n8n_get_workflow({ id: "Q2ReTnOliUTuuVpl" })` – Get structure.
- `mcp_n8n_validate_workflow({ id: "Q2ReTnOliUTuuVpl" })` – Check integrity.
**Steps**:
1. Verify PDL API key (test simple GET curl outside n8n).
2. Backup workflow.
3. Map insertion: After Smart Field Mapper, before PDL Person.
**Evidence**:
- Workflow JSON saved.
- Validation report (no errors).
**Contingency**: If MCP fails, use n8n UI export.

### **CHUNK 1: IDENTIFIER EXTRACTION NODE** (1.5 hours)
**Objectives**: Prepare identifiers (name required, website optional) for PDL Company call.
**Node Config** (Function Node):
```javascript
// Extract identifiers
const item = items[0];
const companyName = item.json.normalized.company || null;
const companyWebsite = item.json.normalized.website || item.json.domain || null; // Multi-source

return [{
  json: {
    ...item.json,
    pdl_identifiers: {
      name: companyName,
      website: companyWebsite
    },
    identifiers_ready: !!companyName // Fallback if no name
  }
}];
```
**Steps**:
1. Add Function node after Smart Field Mapper.
2. Test logic with code execution tool if needed (simulate inputs).
**Evidence**:
- Node ID.
- Test output (e.g., {name: "Google", website: "google.com"}).
**Contingency**: If no name, log error and skip to archive.

### **CHUNK 2: PDL COMPANY API NODE CREATION** (2 hours)
**Objectives**: Add HTTP Request node with correct config.
**Node Config**:
```javascript
{
  "name": "PDL Company API",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "GET",
    "url": "https://api.peopledatalabs.com/v5/company/enrich",
    "authentication": "predefinedCredentialType",
    "nodeCredentialType": "httpHeaderAuth",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [{ "name": "X-Api-Key", "value": "{{$credentials.httpHeaderAuth.headerValue}}" }]
    },
    "sendQuery": true,
    "queryParameters": {
      "parameters": [
        { "name": "name", "value": "{{$json.pdl_identifiers.name}}" },
        { "name": "website", "value": "{{$json.pdl_identifiers.website}}" }, // Optional but improves match
        { "name": "min_likelihood", "value": "5" }
      ]
    },
    "options": { "timeout": 10000 }
  },
  "continueOnFail": true,
  "retryOnFail": true,
  "maxTries": 2
}
```
**Steps**:
1. Create node, connect to Chunk 1 output.
2. Test with known company (e.g., name="Google").
**Evidence**:
- Successful API call (200 status).
- Response sample saved.
**Contingency**: If auth fails, recreate credential.

### **CHUNK 3: COMPANY DATA PROCESSING & QUALIFICATION** (2 hours)
**Objectives**: Parse response, classify B2B/tech.
**Node Config** (Code Node):
```javascript
// Process PDL Company response and classify B2B/tech
const item = items[0];
const processCompanyData = (pdlResponse) => {
  if (!pdlResponse.success || !pdlResponse.data) {
    return { 
      is_b2b_tech: false, 
      pdl_company_status: "failed",
      company_data: null 
    };
  }
  
  const company = pdlResponse.data;
  const techIndustries = ["computer software", "saas", "software", "technology", "internet"];
  
  // B2B Tech Classification
  const isTech = techIndustries.some(i => 
    company.industry?.toLowerCase().includes(i)
  ) || (company.tags || []).some(t => 
    techIndustries.some(i => t.toLowerCase().includes(i))
  ) || (company.tech_stack || []).length > 0;
  
  return { 
    is_b2b_tech: isTech, 
    company_data: {
      name: company.name,
      industry: company.industry,
      size: company.size,
      founded: company.founded,
      website: company.website,
      tech_stack: company.tech_stack || [],
      tags: company.tags || []
    },
    pdl_company_status: "success" 
  };
};

// Add cost tracking
const trackApiUsage = (apiType, cost) => {
  return { api_used: apiType, cost: cost };
};

const result = processCompanyData(item.json);
const costTracking = trackApiUsage("pdl_company", 0.01);

return [{
  json: {
    ...item.json,
    ...result,
    ...costTracking
  }
}];
```
**Steps**:
1. Add Code node after API.
2. Implement classification logic.
**Evidence**:
- Tests: Tech company (true), non-tech (false).
- Cost tracking validation.

### **CHUNK 4: ROUTING & COST TRACKING EXTENSION** (1.5 hours)
**Objectives**: Conditional IF to PDL Person, update costs.
**IF Node Config**:
```javascript
{
  "name": "Is B2B Tech?",
  "type": "n8n-nodes-base.if",
  "parameters": {
    "conditions": {
      "conditions": [{
        "leftValue": "{{$json.is_b2b_tech}}",
        "rightValue": true,
        "operator": {
          "type": "boolean",
          "operation": "equal"
        }
      }]
    }
  },
  "options": {
    "alwaysOutputData": true
  }
}
```
**Cost Extension** (Code Node - extend existing cost tracker):
```javascript
// Update existing cost tracking with company API usage
const item = items[0];
const existingCosts = item.json.api_costs || [];
const newCost = { api: "pdl_company", cost: 0.01, timestamp: new Date().toISOString() };

return [{
  json: {
    ...item.json,
    api_costs: [...existingCosts, newCost],
    total_api_cost: (item.json.total_api_cost || 0) + 0.01
  }
}];
```
**Steps**:
1. Add IF: True → PDL Person, False → Archive/Merge.
2. Update cost tracker logic.
**Evidence**:
- Routing tests (B2B tech goes to Person API).
- Cost accumulation logs.

### **CHUNK 5: ENHANCED ICP SCORING & PHONE NORMALIZATION** (2 hours)
**Objectives**: Update scoring with company data, fix phone issue.
**Scoring Update** (Code Node - modify existing ICP scoring):
```javascript
// Add company boost to existing ICP scoring
const item = items[0];
const baseScore = item.json.icp_score || 0;
const companyBoost = item.json.is_b2b_tech ? 15 : 0; // +15 for B2B tech companies

return [{
  json: {
    ...item.json,
    icp_score: baseScore + companyBoost,
    company_boost_applied: companyBoost,
    enhanced_scoring: true
  }
}];
```
**Phone Normalization** (Code Node - new node):
```javascript
// Complete phone normalization implementation
const item = items[0];
const normalizePhone = (phone) => {
  if (!phone) return { normalized: null, sms_eligible: false, country: null };
  
  // Clean phone number
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // US phone detection
  if (cleaned.match(/^(\+1)?[0-9]{10}$/)) {
    const normalized = cleaned.startsWith('+1') ? cleaned : '+1' + cleaned;
    return { 
      normalized: normalized, 
      sms_eligible: true, 
      country: 'US',
      format: 'e164' 
    };
  }
  
  // International (basic validation)
  if (cleaned.startsWith('+') && cleaned.length > 7) {
    return { 
      normalized: cleaned, 
      sms_eligible: false, 
      country: 'international',
      format: 'e164' 
    };
  }
  
  return { normalized: null, sms_eligible: false, country: null };
};

const phoneResult = normalizePhone(item.json.normalized.phone);

return [{
  json: {
    ...item.json,
    phone_normalized: phoneResult.normalized,
    sms_eligible: phoneResult.sms_eligible,
    phone_country: phoneResult.country,
    phone_format: phoneResult.format
  }
}];
```
**Steps**:
1. Insert company scoring boost after ICP scoring.
2. Add phone normalization before Airtable.
**Evidence**:
- Score examples with company boost.
- Phone tests (US: +1, intl: skip SMS).

### **CHUNK 6: FULL INTEGRATION & TESTING** (3 hours)
**Objectives**: Connect all nodes, validate no breakage.
**Connection Map**:
```
Smart Field Mapper → Identifier Extract → PDL Company API → Process Data → IF B2B Tech? 
  True → PDL Person → Process Person → ICP Scoring → Phone Norm → Airtable
  False → Merge → Archive Path → Airtable
```
**Test Matrix**:

| ID | Input (Company) | Expected | Evidence Required |
|----|-----------------|----------|-------------------|
| TC1 | Google (tech) | B2B true, full flow, score boost | Execution ID, both APIs called |
| TC2 | Walmart (non-tech) | B2B false, skip Person, $0.01 only | ID, routing to archive |
| TC3 | Invalid name | Error handled, fallback | Log, continueOnFail |
| TC4 | Name + Website | High match, success | Response likelihood >5 |
| TC5 | Phone US | Normalized +1, SMS eligible | Airtable record |
| TC6 | Phone Intl | Normalized, not eligible | Record |
| TC7 | Job Title Mismatch | Add confidence flag | Scoring adjustment |
| TC8 | API Timeout | Retry works | Log |
| TC9 | Budget Over | Circuit breaker | Tracking |
| TC10 | Regression (Phase 2B) | Person/Scoring unchanged | Compare outputs |

**Steps**:
1. Connect all nodes using n8n MCP tools.
2. Run test matrix, collect execution IDs.
3. Validate workflow with `mcp_n8n_validate_workflow`.
**Evidence**:
- 10/10 tests passed.
- No regressions (diff pre/post backups).
- Performance within <10s/lead.

### **CHUNK 7: DOCUMENTATION, CLEANUP & HANDOVER** (2 hours)
**Objectives**: Finalize docs, archive remnants.
**Deliverables**:
- Implementation Report: Nodes added, tests passed, evidence links.
- Update Lingering Issues: Mark phone/job title RESOLVED.
- Archive Phase 2B remnants (move to `docs/ARCHIVE/`).
- Phase 2D Prep: Notes for bulk/SMS.
**Steps**:
1. Create implementation report markdown.
2. Backup final workflow as `phase2c-complete-backup-20250808.json`.
3. Update project documentation.
**Evidence**:
- Implementation report file.
- Updated roadmap with Phase 2D scope.

---

## 📊 **SUCCESS METRICS**
- **Functional**: 95%+ API success rate, conditional routing works, costs tracked accurately
- **Performance**: <10s/lead processing time, zero errors in test matrix
- **Quality**: Phone normalized 100%, ICP scoring enhanced with company data
- **Anti-Breakage**: Backups at each chunk, zero regressions from Phase 2B

## 🚨 **RISK MITIGATION**
- **Workflow Breaks**: Backup before/after chunks; rollback via JSON import
- **API Issues**: Test credentials first; fallback to name-only if website missing
- **Forgetting Context**: Use this single plan doc as source of truth
- **Tool Failure**: Manual n8n UI if MCP tools unavailable
- **Cost Overrun**: Monitor API usage, implement circuit breakers if needed

## 🎯 **FINAL VALIDATION CHECKLIST**
- [ ] MCP tools operational
- [ ] Workflow backup created
- [ ] PDL API credentials tested
- [ ] Integration points mapped
- [ ] Test data prepared
- [ ] Rollback strategy confirmed

**This plan eliminates AI hallucination loops, focuses on anti-breakage, and provides clear execution path. Start with Chunk 0, backup everything, and rollback immediately if anything breaks.**