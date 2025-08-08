# PHASE 2C CONTEXT PACKAGE - PDL COMPANY QUALIFICATION
## **TOOL-VALIDATED DEVELOPER CONTEXT - READY FOR IMPLEMENTATION**

### 🎯 **PHASE 2C OBJECTIVE**
**Extend active Phase 2B workflow (Q2ReTnOliUTuuVpl) with PDL Company API integration for enhanced B2B tech qualification and complete 3-field phone normalization**

### 🚨 **CRITICAL CONTEXT - EVIDENCE-BASED**

**ACTIVE BASELINE**: Phase 2B workflow Q2ReTnOliUTuuVpl (15 nodes, 85% success rate, 12s avg runtime)  
**VALIDATED STATUS**: MCP tools confirmed operational, no errors, 3 warnings documented  
**CURRENT BRANCH**: development.phase.2c  
**NEXT IMPLEMENTATION**: Phase 2C - Company enrichment layer + enhanced ICP + phone strategy completion  

---

## 📋 **EXACT REQUIREMENTS FOR PHASE 2C - PDL COMPANY INTEGRATION**

### **Tool-Validated Node Implementation Specifications:**

#### **Node 1: Company Identifier Extraction (Code Node)**
- **Purpose**: Extract company name/website for PDL Company API calls
- **Insertion Point**: After Smart Field Mapper (Node 8) → Before PDL Person (Node 9)
- **Input Sources**: Multiple fallbacks - normalized.company, raw.company, lead.company
- **Output**: pdl_identifiers object with name (required), website (optional), validation flags
- **Validation**: `mcp_n8n_validate_node_operation()` → Zero errors required

#### **Node 2: PDL Company API (HTTP Request - Tool-Validated)**
- **Type**: HTTP Request (GET method - corrected from original POST)
- **Endpoint**: `https://api.peopledatalabs.com/v5/company/enrich`
- **Authentication**: httpHeaderAuth with X-Api-Key header (sendHeaders: true)
- **Parameters**: name (required), website (optional), min_likelihood=5
- **Resilience**: timeout=60000ms, retryOnFail=true, maxTries=3, waitBetweenTries=1000ms
- **Cost**: $0.01 per call (PDL Company API)

#### **Node 3: Company Data Processing & B2B Tech Classification (Code Node)**
- **Purpose**: Parse PDL response, classify B2B tech status, extract enrichment data
- **Classification Logic**: Industry keywords, tech stack analysis, tags evaluation
- **Output Fields**: is_b2b_tech, company_data object, processing metadata
- **Error Handling**: Graceful failures, null response handling, likelihood thresholds

#### **Node 4: B2B Tech Router (IF Node)**
- **Condition**: `{{$json.is_b2b_tech === true}}`
- **Configuration**: alwaysOutputData=true (critical setting)
- **True Path**: Continue to existing PDL Person API
- **False Path**: Route to merge node, skip Person enrichment

#### **Node 5: Enhanced ICP Scoring (Code Node Update)**
- **Purpose**: Extend existing ICP scoring with company intelligence
- **Company Boosts**: B2B tech (+15), company size ranges (+5-10), tech stack (+5-8), industry (+12)
- **Regression Safety**: Preserve existing scoring logic, additive boosts only
- **Output**: enhanced_score, original_score, company_boost breakdown

#### **Node 6: 3-Field Phone Normalization (Code Node)**
- **Purpose**: Verify and complete phone-number-lifecycle-strategy.md implementation (if missing)
- **Fields**: phone_original, phone_recent, phone_validated
- **Validation**: US E.164 format detection, international handling, SMS eligibility flags
- **Integration**: Before final Airtable update, all phone fields included

---

## 🔧 **TECHNICAL IMPLEMENTATION GUIDELINES**

### **1. MANDATORY MCP TOOL VALIDATION PROTOCOL**

**ZERO TOLERANCE**: Every implementation step MUST be tool-validated with evidence

**Required MCP Tool Sequence** (Execute in order for each chunk):
1. **Pre-Implementation**: `mcp_n8n_n8n_health_check()` → Confirm connectivity
2. **Node Creation**: `mcp_n8n_validate_node_operation()` → Zero errors allowed
3. **Connections**: `mcp_n8n_validate_workflow_connections()` → After each connection change
4. **Expressions**: `mcp_n8n_validate_workflow_expressions()` → All {{}} syntax verified
5. **Full Workflow**: `mcp_n8n_validate_workflow()` strict mode → Final validation
6. **Test Execution**: Capture execution IDs → Evidence of functionality

**Evidence Documentation Format**:
```
TOOL VALIDATION:
- Command: mcp_n8n_validate_node_operation({ nodeType: "...", config: {...} })
- Result: [PASS/FAIL with specific errors]
- Node ID: [specific_node_identifier] 
- Execution ID: [test_execution_reference]
- Performance: [runtime_vs_baseline]
```

**Anti-Hallucination Enforcement**:
- Any claim without MCP tool evidence is INVALID
- If tool validation fails, STOP implementation immediately
- No "it should work" assumptions - everything must be verified
- Document every discovery as evidence for future reference

### **2. PLATFORM GOTCHAS (CRITICAL)**

**AUTHORITATIVE SOURCE**: `docs/CURRENT/critical-platform-gotchas.md`

**VALIDATED GOTCHAS FOR PHASE 2C** (From Tool Analysis):
- **HTTP Request Method**: PDL Company API uses GET, not POST (corrected from original docs)
- **sendHeaders Required**: Must be true for X-Api-Key header (sendHeaders: false = auth failure)
- **Timeout Issues**: Current 30s timeout causes 15% failures → Increase to 60s minimum
- **Retry Logic Missing**: No retryOnFail in current workflow → Add maxTries=3, waitBetweenTries=1000ms
- **Expression Complexity**: Nested paths like `{{$json.pdl_identifiers.name}}` → Validate each level exists
- **IF Node alwaysOutputData**: Must be enabled or false path drops data completely
- **Rate Limits**: PDL free=100/min, premium=2/min → Add delays if scaling
- **Airtable API Limits**: 5 requests/second → Monitor and throttle for volume increases

**Workflow-Specific Gotchas** (From Q2ReTnOliUTuuVpl Analysis):
- **Phone Normalization Incomplete**: Only 2/3 fields implemented → phone_validated missing
- **ICP Scoring Extension**: Must preserve existing logic → Additive boosts only
- **Connection Insertion**: Between nodes 8-9 requires careful routing → Validate connections
- **Performance Impact**: 12s baseline → New nodes must keep <20s total runtime

### **3. IMPLEMENTATION SEQUENCE**

**STEP 1: Analysis & Planning**
- Map complete workflow structure with `mcp_n8n_n8n_get_workflow_structure`
- Identify insertion points after Smart Field Mapper
- Create detailed node-by-node implementation plan
- Document all dependencies and integration points

**STEP 2: PDL Company API Integration**
- Create HTTP Request node with proper authentication
- Configure request parameters and headers
- Implement error handling for API failures
- Test with sample company names

**STEP 3: Company Data Processing**
- Extract relevant fields from PDL response
- Normalize industry classifications
- Map company size to standardized ranges
- Identify tech stack indicators

**STEP 4: Qualification Logic**
- Implement B2B tech qualification criteria
- Configure IF node with proper routing
- Ensure "Always Output Data" is enabled
- Test both qualification paths

**STEP 5: Cost Tracking**
- Extend existing cost tracking system
- Add PDL Company API cost ($0.01/call)
- Integrate with daily budget monitoring
- Test cost accumulation logic

**STEP 6: Testing & Validation**
- Create comprehensive test suite
- Verify all paths with real data
- Document evidence with specific IDs
- Validate cost tracking accuracy

---

## 🔍 **REFERENCE ARCHITECTURE**

### **PDL Migration Roadmap - Phase 2C Implementation**

**FOUNDATION**: Phase 2B - PDL Person Enrichment and ICP Scoring V3.0
- **Workflow ID**: `Q2ReTnOliUTuuVpl` - "UYSP PHASE 2B - COMPLETE CLEAN REBUILD"
- **Current Status**: Person enrichment operational, ICP scoring functional
- **Integration Point**: Add Company API between field normalization and Person API

**PHASE 2C ARCHITECTURE**:
1. **Preserve Existing**: All Phase 2B functionality must remain intact
2. **Add Company API**: New nodes for company qualification
3. **Enhance Routing**: Only call Person API for qualified companies
4. **Update Costs**: Track combined Company + Person API usage

### **Integration Diagram**

```
WEBHOOK INPUT
    │
    ▼
FIELD NORMALIZATION (Smart Field Mapper v4.6)
    │
    ▼
[NEW] PDL COMPANY API ──────┐
    │                       │
    ▼                       │
[NEW] COMPANY QUALIFIED?    │
    │           │           │
    │ (YES)     │ (NO)      │
    ▼           └───────────┘
PDL PERSON API              │
    │                       │
    ▼                       │
ICP SCORING                 │
    │                       │
    ▼                       ▼
AIRTABLE RECORD CREATION
```

---

## 📊 **SUCCESS CRITERIA**

### **Functional Requirements**

1. **Company API Integration**: 95%+ success rate for API calls
2. **Data Extraction**: Accurate extraction of industry, size, tech indicators
3. **Qualification Logic**: Proper routing based on B2B tech criteria
4. **Cost Tracking**: Accurate monitoring of $0.01/call usage
5. **Performance**: No degradation of existing functionality

### **Testing Requirements**

1. **Test Cases**: Minimum 10 diverse company scenarios
2. **Evidence Collection**: API responses, qualification decisions, costs
3. **Path Verification**: Both qualified and non-qualified paths tested
4. **Integration Testing**: End-to-end workflow execution
5. **Documentation**: All test results with specific IDs and timestamps

---

## 🛠️ **TOOLS & RESOURCES**

### **Required Tools**

1. **Context7 Documentation**: For PDL API reference and examples
2. **n8n Workflow Tools**: For workflow structure analysis and updates
3. **Airtable MCP Tools**: For verifying record creation and updates
4. **PDL API Documentation**: For endpoint specifications and parameters

### **Reference Materials**

1. **PDL Migration Roadmap**: `docs/ARCHITECTURE/PDL-MIGRATION-ROADMAP.md` (AUTHORITATIVE)
2. **Platform Gotchas**: `docs/CURRENT/critical-platform-gotchas.md` (AUTHORITATIVE)
3. **ICP Scoring Methodology**: `docs/CURRENT/ICP-SCORING-V3-METHODOLOGY.md` (AUTHORITATIVE)  
4. **Smart Field Mapper**: `patterns/exported/smart-field-mapper-v4.6-grok.js` (WORKING CODE)
5. **Phase 2B Closeout**: `docs/CURRENT/PHASE-2B-CLOSEOUT-REPORT.md` (BASELINE)

---

## 🚨 **CRITICAL WARNINGS**

1. **NEVER update workflows via MCP** (causes credential corruption)
2. **ALWAYS verify node configuration** with tool evidence
3. **USE predefinedCredentialType** for all API authentication
4. **FOLLOW anti-hallucination protocol** for all implementation claims
5. **DOCUMENT all platform gotchas** discovered during implementation
6. **PRESERVE existing functionality** while adding new capabilities
7. **VERIFY all connections** after implementation
8. **TEST both success and failure paths** thoroughly

---

## 📝 **DEVELOPER AGENT INSTRUCTIONS**

1. **Begin with comprehensive workflow analysis** and detailed planning
2. **Document your implementation plan** with specific node configurations
3. **Follow the implementation sequence** step by step
4. **Verify each step** with tool evidence before proceeding
5. **Test thoroughly** with diverse company scenarios
6. **Document all test results** with specific IDs and timestamps
7. **Update platform gotchas** with any new discoveries
8. **Provide a complete implementation report** with evidence

**HONESTY CHECK REQUIREMENT**: End every implementation response with:
```
HONESTY CHECK: [percentage]% evidence-based. Assumptions: [list]
```

---

**DOCUMENT STATUS**: ✅ **CURRENT - PHASE 2C CONTEXT PACKAGE**  
**LAST UPDATED**: August 7, 2025  
**CREATED BY**: PM Agent  
**APPROVED BY**: User