# PHASE 2C TECHNICAL REQUIREMENTS - PDL COMPANY API INTEGRATION

## Overview

Phase 2C focuses on implementing the PDL Company API integration to enhance the lead qualification process with company-level data. This integration will provide more accurate B2B tech company identification and improve the ICP scoring system with company-specific attributes.

**Implementation Priority**: High  
**Target Completion**: [TBD]  
**Dependencies**: Completed Phase 2B (PDL Person Enrichment and ICP Scoring)

---

## Technical Requirements

### 1. PDL Company API Integration

#### 1.1 API Configuration
- **Endpoint**: `https://api.peopledatalabs.com/v5/company/enrich`
- **Authentication**: API Key (stored in environment variable)
- **Method**: POST
- **Parameters**:
  - `min_likelihood`: 5 (minimum confidence score)
  - `include_sections`: "company" (data sections to include)
- **Request Body**:
  ```json
  {
    "name": "{{$json.normalized.company}}"
  }
  ```

#### 1.2 Node Configuration (HTTP Request)
- **Node Name**: "PDL Company API"
- **Authentication**: predefinedCredentialType
- **nodeCredentialType**: "httpHeaderAuth"
- **sendHeaders**: false
- **Error Handling**: Continue on fail with error output
- **Timeout**: 10000ms (10 seconds)
- **Retry On Fail**: 2 attempts, 2000ms delay

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

### 5. Integration with Existing Workflow

#### 5.1 Insertion Point
- After Smart Field Mapper node
- Before PDL Person API node

#### 5.2 Connection Configuration
- **Input**: Smart Field Mapper output
- **Output 1**: PDL Person API (for qualified companies)
- **Output 2**: Skip PDL Person API (for non-qualified companies)

#### 5.3 Workflow Structure Update
```
Smart Field Mapper
      │
      ▼
PDL Company API
      │
      ▼
Process Company Data
      │
      ▼
Is Company Qualified? ───(No)──► Skip PDL Person
      │                           │
      │ (Yes)                     │
      ▼                           │
PDL Person API                    │
      │                           │
      ▼                           │
Process Person Data               │
      │                           │
      ▼                           │
      └────────────────────────────┘
              │
              ▼
        ICP Scoring
              │
              ▼
     Airtable Update
```

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

### 2. Platform Gotchas Prevention

#### 2.1 Critical Gotchas to Avoid
- **IF Node Configuration**: Verify parameters are not empty
- **Credential Persistence**: Use predefinedCredentialType
- **Expression Spacing**: Use proper spacing in expressions
- **Boolean Handling**: Map false to null for Airtable
- **Workflow Connections**: Verify with workflow structure tool

#### 2.2 Implementation Checklist
- [ ] Used `mcp_n8n_n8n_get_workflow` to verify node parameters
- [ ] Used predefinedCredentialType for API authentication
- [ ] Properly spaced all expressions `{{ $json.field }}`
- [ ] Mapped boolean false to null for Airtable
- [ ] Verified all connections with workflow structure tool
- [ ] Enabled "Always Output Data" for IF nodes

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