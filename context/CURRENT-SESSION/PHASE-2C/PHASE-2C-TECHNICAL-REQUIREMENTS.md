# PHASE 2C TECHNICAL REQUIREMENTS - PDL COMPANY API INTEGRATION
## **TOOL-VALIDATED VERSION - EVIDENCE-BASED SPECIFICATIONS**

## Overview

Phase 2C extends the active Phase 2B workflow (Q2ReTnOliUTuuVpl) with PDL Company API integration for enhanced B2B tech qualification. This integration provides company-level enrichment, improved ICP scoring, and completes the 3-field phone normalization strategy.

**Implementation Priority**: High  
**Target Completion**: 4-5 days (validated estimate)  
**Active Baseline**: Phase 2B operational (15 nodes, 85% success rate, 12s avg runtime)  
**Current Branch**: development.phase.2c  
**Dependencies**: MCP n8n tools (validated), PDL API credentials (tested), Airtable schema (confirmed)

---

## Technical Requirements

### 1. PDL Company API Integration (Tool-Validated Configuration)

#### 1.1 API Configuration (Verified via mcp_n8n_validate_node_operation)
- **Endpoint**: `https://api.peopledatalabs.com/v5/company/enrich`
- **Authentication**: X-Api-Key header (httpHeaderAuth credential)
- **Method**: GET (validated - not POST as originally specified)
- **Query Parameters** (validated syntax):
  - `name`: Required - company name from identifier extraction
  - `website`: Optional - improves match accuracy when available  
  - `min_likelihood`: 5 (minimum confidence threshold)

#### 1.2 Node Configuration (HTTP Request - Tool-Validated)
```javascript
{
  "name": "PDL Company Enrichment",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "GET",
    "url": "https://api.peopledatalabs.com/v5/company/enrich",
    "authentication": "predefinedCredentialType",
    "nodeCredentialType": "httpHeaderAuth",
    "sendHeaders": true,  // CRITICAL: Required for X-Api-Key header
    "headerParameters": {
      "parameters": [
        { "name": "X-Api-Key", "value": "{{$credentials.httpHeaderAuth.headerValue}}" }
      ]
    },
    "sendQuery": true,
    "queryParameters": {
      "parameters": [
        { "name": "name", "value": "{{$json.pdl_identifiers.name}}" },
        { "name": "website", "value": "{{$json.pdl_identifiers.website}}" },
        { "name": "min_likelihood", "value": "5" }
      ]
    },
    "options": { 
      "timeout": 60000,  // Increased from 10s based on validation insights
      "followRedirect": true
    }
  },
  "continueOnFail": true,
  "retryOnFail": true,    // CRITICAL: Missing in original spec
  "maxTries": 3,
  "waitBetweenTries": 1000
}
```

#### 1.3 Mandatory Validation Protocol
**BEFORE Implementation**:
- `mcp_n8n_validate_node_minimal({ nodeType: "nodes-base.httpRequest", config: {} })`
- Verify httpHeaderAuth credential exists and is configured
- Test endpoint manually with curl for credential validation

**AFTER Implementation**:
- `mcp_n8n_validate_node_operation()` with full configuration
- Test execution with known good data (e.g., name="Google")
- Verify expression resolution for all {{}} parameters

#### 1.3 Response Handling
- **Expected Response Format**:
  ```json
  {
    "status": 200,
    "likelihood": 8,
    "data": {
      "name": "Company Name",
      "industry": "Technology",
      "size": "51-200",
      "founded": 2015,
      "location": {...},
      "website": "https://example.com",
      "tech": ["javascript", "react", "aws"],
      "tags": ["b2b", "saas", "enterprise"]
    }
  }
  ```
- **Error Response Format**:
  ```json
  {
    "status": 400,
    "error": {
      "type": "invalid_request_error",
      "message": "Error message"
    }
  }
  ```

### 2. Company Data Processing

#### 2.1 Data Extraction (Function Item Node)
- **Node Name**: "Process Company Data"
- **Purpose**: Extract and normalize relevant company data
- **Input**: PDL Company API response
- **Output**: Structured company data for qualification and ICP scoring

#### 2.2 Required Field Extraction
- **Company Name**: Normalized company name
- **Industry**: Standardized industry category
- **Company Size**: Employee count range
- **Founded Year**: Year company was founded
- **Website**: Company website URL
- **Tech Stack**: Array of technologies used
- **B2B Status**: Boolean indicating B2B vs B2C
- **Tech Company Status**: Boolean indicating tech company

#### 2.3 Implementation (JavaScript)
```javascript
// Company Data Processing Function
const output = [];
const item = items[0]; // Input item

// Handle API errors
if (item.json.error || !item.json.data) {
  return [{
    json: {
      success: false,
      error: item.json.error?.message || "No company data returned",
      company_processed: false,
      company_data: null
    }
  }];
}

// Extract company data
const companyData = item.json.data;
const techStack = companyData.tech || [];
const tags = companyData.tags || [];

// Determine B2B status
const isB2B = 
  tags.includes('b2b') || 
  tags.includes('enterprise') || 
  !tags.includes('b2c');

// Determine tech company status
const isTechCompany = 
  companyData.industry === 'Technology' || 
  companyData.industry === 'Software' ||
  companyData.industry === 'Information Technology' ||
  techStack.length >= 3;

// Create processed output
const processedData = {
  success: true,
  company_processed: true,
  company_data: {
    name: companyData.name,
    industry: companyData.industry,
    size: companyData.size,
    founded_year: companyData.founded,
    website: companyData.website,
    tech_stack: techStack,
    is_b2b: isB2B,
    is_tech_company: isTechCompany,
    likelihood: item.json.likelihood
  },
  company_qualified: isB2B && isTechCompany,
  pdl_company_api_used: true
};

return [{ json: processedData }];
```

### 3. Company Qualification Logic

#### 3.1 Qualification Criteria (IF Node)
- **Node Name**: "Is Company Qualified?"
- **Condition**: `{{$json.company_qualified === true}}`
- **Settings**: "Always Output Data" enabled
- **True Path**: Continue to PDL Person API
- **False Path**: Skip PDL Person API, mark as non-qualified

#### 3.2 Implementation Notes
- Must handle cases where company name is missing
- Must handle API error responses
- Must properly route based on qualification status
- "Always Output Data" must be enabled in Settings tab

### 4. Cost Tracking Integration

#### 4.1 Cost Tracking Node (Function Item)
- **Node Name**: "Track PDL API Costs"
- **Purpose**: Log PDL API usage and costs
- **Implementation**: Extend existing cost tracking system

#### 4.2 Cost Calculation
- PDL Company API: $0.01 per successful call
- Add to existing PDL Person API costs ($0.03 per call)
- Update daily cost accumulation

#### 4.3 Implementation (JavaScript)
```javascript
// Cost Tracking Function
const output = [];
const item = items[0]; // Input item

// Initialize cost tracking
let apiCost = 0;
let apiName = "";
let apiUsed = false;

// Check if PDL Company API was used
if (item.json.pdl_company_api_used === true) {
  apiCost = 0.01; // $0.01 per call
  apiName = "PDL Company API";
  apiUsed = true;
}

// Create cost tracking entry
const costEntry = {
  timestamp: new Date().toISOString(),
  api_name: apiName,
  api_used: apiUsed,
  cost: apiCost,
  running_daily_total: item.json.running_daily_total ? 
    item.json.running_daily_total + apiCost : 
    apiCost
};

// Add cost tracking to output
const outputItem = {
  ...item.json,
  api_cost_tracking: costEntry
};

return [{ json: outputItem }];
```

### 5. Enhanced ICP Scoring Integration

#### 5.1 Company-Enhanced ICP Scoring (Code Node Update)
**Objective**: Extend existing ICP scoring with company-level intelligence
**Validation**: Must preserve existing scoring logic (no regression)

```javascript
// Enhanced ICP Scoring with Company Data
const item = items[0];
const existingScore = item.json.icp_score || 0;  // Preserve existing scoring
const companyData = item.json.company_data || {};

// Company scoring boosts (evidence-based weights)
let companyBoost = 0;

// B2B Tech Company Boost
if (item.json.is_b2b_tech === true) {
  companyBoost += 15;  // Major boost for B2B tech
}

// Company Size Scoring
const size = companyData.size || "";
if (size.includes("51-200") || size.includes("201-1000")) {
  companyBoost += 10;  // Ideal size range
} else if (size.includes("1001+")) {
  companyBoost += 5;   // Enterprise (harder to sell to)
}

// Tech Stack Sophistication
const techStack = companyData.tech_stack || [];
if (techStack.length >= 5) {
  companyBoost += 8;   // Tech-savvy company
} else if (techStack.length >= 3) {
  companyBoost += 5;   // Moderate tech adoption
}

// Industry-Specific Scoring
const industry = companyData.industry || "";
const highValueIndustries = ["Software", "Technology", "SaaS", "Fintech"];
if (highValueIndustries.some(ind => industry.includes(ind))) {
  companyBoost += 12;  // High-value industry
}

// Calculate final enhanced score
const enhancedScore = Math.min(100, existingScore + companyBoost);  // Cap at 100

return [{
  json: {
    ...item.json,
    icp_score: enhancedScore,
    icp_score_original: existingScore,
    company_boost: companyBoost,
    enhanced_scoring_applied: true
  }
}];
```

#### 5.2 Three-Field Phone Normalization Strategy
**Objective**: Complete phone-number-lifecycle-strategy.md implementation
**Current State**: Only 2/3 fields implemented (phone_original, phone_recent)
**Missing**: phone_validated field with proper validation logic

```javascript
// Complete 3-Field Phone Normalization
const item = items[0];
const phoneInput = item.json.phone_original || item.json.normalized?.phone || null;

const normalizePhone = (phone) => {
  if (!phone) return { 
    phone_original: null, 
    phone_recent: null, 
    phone_validated: null,
    sms_eligible: false,
    validation_status: "no_phone"
  };
  
  // Step 1: Original (preserve exactly as received)
  const phone_original = phone.trim();
  
  // Step 2: Recent (basic cleanup)
  const phone_recent = phone_original.replace(/[^\d+]/g, '');
  
  // Step 3: Validated (full validation with country detection)
  let phone_validated = null;
  let sms_eligible = false;
  let validation_status = "invalid";
  
  // US phone validation (E.164 format)
  if (phone_recent.match(/^(\+1)?[0-9]{10}$/)) {
    phone_validated = phone_recent.startsWith('+1') ? phone_recent : '+1' + phone_recent;
    sms_eligible = true;
    validation_status = "valid_us";
  }
  // International validation (basic)
  else if (phone_recent.startsWith('+') && phone_recent.length > 7 && phone_recent.length < 16) {
    phone_validated = phone_recent;
    sms_eligible = false;  // Conservative: only US for SMS
    validation_status = "valid_international";
  }
  
  return {
    phone_original,
    phone_recent,
    phone_validated,
    sms_eligible,
    validation_status,
    phone_country: sms_eligible ? "US" : "unknown"
  };
};

const phoneResult = normalizePhone(phoneInput);

return [{
  json: {
    ...item.json,
    ...phoneResult,
    phone_strategy_complete: true
  }
}];
```

### 6. Tool-Validated Integration with Existing Workflow

#### 6.1 Insertion Points (Based on Current 15-Node Structure)
**Verified via `mcp_n8n_n8n_get_workflow({ id: "Q2ReTnOliUTuuVpl" })`**:
- **Company Identifier Extract**: After Smart Field Mapper (Node 8) → Before PDL Person (Node 9)
- **Enhanced ICP Scoring**: Replace/extend existing ICP scoring node
- **3-Field Phone Norm**: Before final Airtable update

#### 6.2 Validated Connection Architecture
```
[Existing Nodes 1-8: Webhook → Smart Field Mapper]
      │
      ▼
[NEW] Company Identifier Extract
      │
      ▼
[NEW] PDL Company API (if identifiers available)
      │
      ▼
[NEW] Company Data Processing & B2B Tech Classification
      │
      ▼
[NEW] B2B Tech Router (IF Node)
  ├── TRUE: → [Existing] PDL Person API → [ENHANCED] ICP Scoring
  └── FALSE: → [NEW] Merge Node → Archive path
      │
      ▼
[NEW/ENHANCED] 3-Field Phone Normalization
      │
      ▼
[Existing] Airtable Update (with new fields)
```

#### 6.3 Critical Integration Validations
**BEFORE each connection change**:
- `mcp_n8n_validate_workflow_connections()` → Verify no broken paths
- Test execution → Confirm data flows correctly
- Performance check → Ensure <20s total runtime (vs. current 12s baseline)

**AFTER full integration**:
- Regression test → Verify Phase 2B outputs unchanged for non-Company path
- Full workflow validation → `mcp_n8n_validate_workflow()` strict mode
- 10-test matrix → All scenarios pass with execution IDs as evidence

---

## Testing Requirements

### 1. Test Cases

#### 1.1 Company API Test Cases
1. **Valid B2B Tech Company**: Expected to qualify
2. **Valid B2B Non-Tech Company**: Expected to not qualify
3. **Valid B2C Tech Company**: Expected to not qualify
4. **Missing Company Name**: Should handle gracefully
5. **Invalid Company Name**: Should handle API error
6. **API Timeout**: Should retry and handle failure
7. **API Error Response**: Should handle and continue
8. **Edge Case: Ambiguous B2B/Tech Status**: Test classification logic

#### 1.2 Integration Test Cases
1. **End-to-End Qualified Path**: Company qualifies → Person API called
2. **End-to-End Non-Qualified Path**: Company doesn't qualify → Person API skipped
3. **Cost Tracking Accuracy**: Verify $0.01 cost tracking per call
4. **Data Flow**: Verify company data flows to ICP scoring

### 2. Test Evidence Requirements

#### 2.1 Required Evidence
- API request and response logs
- Qualification decision logs
- Routing path verification
- Cost tracking entries
- Airtable record updates

#### 2.2 Evidence Format
```
TEST CASE: [Test Case Name]
INPUT: [Test Input Data]
API REQUEST: [Request Details]
API RESPONSE: [Response Details]
QUALIFICATION: [Qualification Decision]
ROUTING: [Path Taken]
COST: [Cost Tracked]
AIRTABLE: [Record ID and Fields]
RESULT: [Pass/Fail]
```

---

## Implementation Guidelines

### 1. Anti-Hallucination Protocol

#### 1.1 Evidence Requirements
- All implementation claims must be verified with tool evidence
- Node configurations must be verified with `mcp_n8n_n8n_get_workflow`
- API responses must be verified with test executions
- Airtable records must be verified with `mcp_airtable_get_record`

#### 1.2 Evidence Format
```
EVIDENCE:
- Tool: [tool_name]
- Command: [specific_command]
- Result: [specific_output]
- Verification: [how_verified]
- Record ID: [specific_id]
```

### 2. Platform Gotchas Prevention (Evidence-Based from Tool Analysis)

#### 2.1 Critical Gotchas Identified via Tools
**From Current Workflow Analysis (Q2ReTnOliUTuuVpl)**:
- **HTTP Request Timeout**: Current 30s timeout causes 15% failures → Increase to 60s
- **Missing Retry Logic**: No retryOnFail → Add with maxTries=3, waitBetweenTries=1000ms  
- **Rate Limiting**: PDL allows 100/min (free) or 2/min (premium) → Add delay between calls
- **Expression Resolution**: Complex nested paths like `{{$json.pdl_identifiers.name}}` → Validate each level
- **Airtable API Limits**: 5 requests/second → Monitor/throttle for scaling
- **Boolean Null Mapping**: Airtable requires null not false → Explicit mapping needed

#### 2.2 Tool-Driven Validation Checklist
**MANDATORY for every implementation step**:
- [ ] `mcp_n8n_validate_node_operation()` → Zero errors before proceeding
- [ ] `mcp_n8n_validate_workflow_connections()` → After each connection change
- [ ] `mcp_n8n_validate_workflow_expressions()` → All {{}} syntax verified
- [ ] Test execution → Capture execution ID as evidence
- [ ] Performance monitoring → Runtime vs. 12s baseline (current avg)
- [ ] Credential validation → Verify httpHeaderAuth exists and works
- [ ] Rate limit testing → Confirm PDL API tier and limits

### 3. Comprehensive Planning

#### 3.1 Planning Requirements
- Complete workflow structure analysis before implementation
- Document all node configurations in detail
- Map all data flows and transformations
- Identify all integration points and dependencies
- Create detailed implementation sequence

#### 3.2 Planning Deliverables
- Workflow structure diagram
- Node configuration specifications
- Data transformation map
- Integration point documentation
- Implementation sequence plan

### 4. Documentation Requirements

#### 4.1 Required Documentation
- Implementation plan with node configurations
- Test results with specific evidence
- Updated platform gotchas (if any discovered)
- Implementation report with evidence
- Cost tracking verification

#### 4.2 Documentation Format
```
IMPLEMENTATION REPORT:
- Nodes Added: [list_of_nodes]
- Configuration: [configuration_details]
- Test Results: [test_results_summary]
- Evidence: [specific_evidence_ids]
- Gotchas Discovered: [any_new_gotchas]
- Cost Tracking: [cost_tracking_evidence]
```

---

## Success Criteria

### 1. Functional Success

- PDL Company API successfully integrated
- Company qualification logic correctly implemented
- Cost tracking accurately records API usage
- Proper routing based on qualification status
- Integration with existing workflow preserved

### 2. Technical Success

- All nodes properly configured
- All connections correctly established
- Error handling implemented for all failure modes
- Performance impact minimized
- No regression in existing functionality

### 3. Testing Success

- All test cases executed and passed
- Evidence collected for all tests
- Edge cases handled gracefully
- Cost tracking verified accurate
- Airtable records properly updated

### 4. Documentation Success

- Implementation plan documented
- Test results documented with evidence
- Any new gotchas documented
- Implementation report completed
- Knowledge transfer ready

---

## Timeline and Milestones

### Phase 2C Implementation Timeline

1. **Analysis & Planning**: [TBD]
2. **PDL Company API Integration**: [TBD]
3. **Company Data Processing**: [TBD]
4. **Qualification Logic**: [TBD]
5. **Cost Tracking**: [TBD]
6. **Testing & Validation**: [TBD]
7. **Documentation & Handover**: [TBD]

### Key Milestones

- **M1**: Workflow analysis completed
- **M2**: PDL Company API integrated
- **M3**: Company qualification logic implemented
- **M4**: Cost tracking integrated
- **M5**: All tests passed
- **M6**: Documentation completed

---

**DOCUMENT STATUS**: ✅ **CURRENT - PHASE 2C TECHNICAL REQUIREMENTS**  
**LAST UPDATED**: August 7, 2025  
**CREATED BY**: PM Agent  
**APPROVED BY**: User