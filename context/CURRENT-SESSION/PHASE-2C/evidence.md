[AUTHORITATIVE]
Last Updated: 2025-08-08

# Evidence Requirements: Phase 2C Hunter Waterfall

## After Each Chunk Completion

Provide evidence in this format:

```
CHUNK: [Number] - [Component Name]
STATUS: Complete
EVIDENCE:
- MCP Tool Used: [specific tool name]
- Workflow ID: Q2ReTnOliUTuuVpl
- Version Change: [old version] → [new version]
- Node Added/Modified: [node name and ID]
- Test Execution ID: [execution ID from test]
- Success Rate: [%] ([success count]/[total count])
- Cost Tracked: $[amount] ([vendor attribution])
- Processing Time: [seconds]
- Platform Gotchas Applied: [gotcha numbers addressed]

VALIDATION:
- [ ] MCP operation succeeded (success: true)
- [ ] Test payload processed correctly
- [ ] Airtable record updated/created: [record ID]
- [ ] No regression in existing PDL path
- [ ] Feature gate rollback tested

HONESTY CHECK: [%]% evidence-based
ASSUMPTIONS: [list any unverified aspects]
```

## Component-Specific Evidence

### Chunk 1: Feature Gate Implementation
```
COMPONENT: Waterfall Enabled Check (IF Node)
STATUS: Complete
EVIDENCE:
- Node ID: [generated node ID]
- Environment Variable: PERSON_WATERFALL_ENABLED tested
- Rollback Test: Disabled state bypasses Hunter completely
- Routing Verified: TRUE → PDL Person, FALSE → ICP Scoring
- MCP Response: [tool output showing node creation]
```

### Chunk 2: PDL Success Router  
```
COMPONENT: PDL Person Success Check (IF Node)
STATUS: Complete
EVIDENCE:
- Node ID: [generated node ID]
- Boolean Logic: "operation": "true" applied (memory:5371063)
- Routing Verified: TRUE → ICP Scoring, FALSE → Hunter
- Test Case: Known PDL success routed correctly
- Test Case: Known PDL failure routed to Hunter
```

### Chunk 3: Hunter HTTP Request
```
COMPONENT: Hunter Email Enrichment (HTTP Request)
STATUS: Complete
EVIDENCE:
- Node ID: [generated node ID]
- Credential Pattern: predefinedCredentialType applied (memory:5457160)
- API Test: Successful call to https://api.hunter.io/v2/people/find
- Response Format: Valid JSON with expected structure
- Error Handling: 3 retry attempts configured
```

### Chunk 4: Hunter Response Processor
```
COMPONENT: Hunter Response Normalization (Code Node)
STATUS: Complete
EVIDENCE:
- Node ID: [generated node ID]
- Field Mapping: linkedin.handle → linkedin_url verified
- Field Mapping: employment.title → title_current verified
- Field Mapping: employment.name → company_enriched verified
- Cost Attribution: hunter_cost=0.049 calculated correctly
```

### Chunk 5: Person Data Merger
```
COMPONENT: Person Data Merger (Code Node)
STATUS: Complete
EVIDENCE:
- Node ID: [generated node ID]
- PDL Precedence: PDL data takes priority over Hunter
- Vendor Attribution: enrichment_vendor set correctly
- Failure Handling: Both failures route to human_review
- LinkedIn URL: Format consistency enforced (https://)
```

### Chunk 6: Cost Tracking Enhancement
```
COMPONENT: Daily Cost Updater (Code Node)
STATUS: Complete
EVIDENCE:
- Node ID: [generated node ID]
- PDL Cost Tracking: $0.03 logged for pdl vendor
- Hunter Cost Tracking: $0.049 logged for hunter vendor
- Daily Aggregation: Daily_Costs table updated
- Budget Monitor: Circuit breaker logic implemented
```

## Final Integration Evidence

### Complete Waterfall Test
```
INTEGRATION TEST: End-to-End Hunter Waterfall
STATUS: Complete
EVIDENCE:
- Test Scenario 1: PDL success (baseline preserved)
  - Execution ID: [ID]
  - Processing Time: [seconds] 
  - Hunter Calls: 0
  - Cost: $0.03
  
- Test Scenario 2: PDL failure → Hunter success
  - Execution ID: [ID]
  - Processing Time: [seconds]
  - Hunter Calls: 1
  - Cost: $0.049
  - Fields Captured: [linkedin_url/title_current/company_enriched]
  
- Test Scenario 3: Both failures → Human review
  - Execution ID: [ID]
  - Routing: human_review confirmed
  - Cost: $0.049 (Hunter attempt)

REGRESSION VERIFICATION:
- [ ] PDL success rate maintained (95%+)
- [ ] No existing workflow errors introduced
- [ ] ICP Scoring inputs unchanged
- [ ] Performance within acceptable range (<20s)
```

## Export Requirements

### Final Deliverable
```
EXPORT PACKAGE: Phase 2C Hunter Waterfall Complete
- Workflow JSON: [file location]
- Environment Variables: [documented]
- Credential Setup: [configuration details]
- Test Results: [evidence package location]
- Rollback Procedure: [validated]
- Next Session Prep: [context for Phase 2D]
```

## Anti-Hallucination Enforcement

**MANDATORY for all evidence blocks:**
- Tool names and exact outputs required
- Execution IDs and record IDs required  
- No success claims without MCP verification
- Confidence scoring required [0-100%]
- Assumption documentation mandatory

**Example verification:**
```
mcp_n8n_get_workflow("Q2ReTnOliUTuuVpl") → [specific response]
mcp_n8n_n8n_update_partial_workflow({operations: [...]}) → success: true
mcp_airtable_get_record("appuBf0fTe8tp8ZaF", "tblXXXXXX", "recXXXXXX") → [record data]
```

**No evidence = No completion claim accepted.**
