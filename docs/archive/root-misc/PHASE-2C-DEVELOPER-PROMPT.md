# UYSP PHASE 2C: HUNTER WATERFALL IMPLEMENTATION

## MANDATORY STARTUP SEQUENCE:
1. Read .cursorrules/00-CRITICAL-ALWAYS.md
2. Type: "I understand evidence requirements"
3. Run these tool checks:
   - mcp_n8n_list_workflows
   - Show active workflow Q2ReTnOliUTuuVpl status
   - Confirm PROJECT workspace H4VRaaZhd8VKQANf access

## SESSION CONTEXT LOADED:
- **Building**: Hunter.io Email Enrichment waterfall fallback
- **Pattern**: PDL-first with Hunter fallback on failures
- **Critical**: Zero impact on existing PDL success paths (95%+ maintained)

## CONTEXT PACKAGE REFERENCES:
Load complete context from these focused documents:
1. `context/CURRENT-SESSION/PHASE-2C/README.md` - What/why/requirements
2. `context/CURRENT-SESSION/PHASE-2C/pattern.md` - Implementation code
3. `context/CURRENT-SESSION/PHASE-2C/tests.md` - Validation requirements  
4. `context/CURRENT-SESSION/PHASE-2C/evidence.md` - Proof templates

## CRITICAL PLATFORM GOTCHAS:
- **Gotcha #20**: IF node boolean routing - Use `"operation": "true"` (memory:5371063)
- **Gotcha #21**: HTTP credentials - Use predefinedCredentialType, NEVER manual headers (memory:5457160)
- **Project Workspace**: H4VRaaZhd8VKQANf ONLY, never personal workspace (memory:3931908)

## STEP-BY-STEP IMPLEMENTATION:

### CHUNK 1: Feature Gate (≤5 operations)
1. Use `mcp_n8n_get_workflow("Q2ReTnOliUTuuVpl")` to load current state
2. Add IF node "Waterfall Enabled Check" after field normalization
3. Configure environment variable check: PERSON_WATERFALL_ENABLED
4. Test rollback capability: Set false, verify Hunter bypass
5. **STOP** - Wait for user 'GO' confirmation

### CHUNK 2: PDL Success Router (≤5 operations) 
1. Add IF node "PDL Person Success Check" after existing PDL enrichment
2. Configure boolean check: pdl_person_success with `"operation": "true"`
3. Route TRUE → ICP Scoring, FALSE → Hunter (to be added)
4. Test with known PDL success case - verify routing
5. **STOP** - Wait for user 'GO' confirmation

### CHUNK 3: Hunter API Integration (≤5 operations)
1. Configure Hunter API credentials (httpHeaderAuth, X-API-KEY)
2. Add HTTP Request node for https://api.hunter.io/v2/people/find
3. Connect to PDL failure path (FALSE output from PDL router)
4. Test API call with sample email, verify Hunter response
5. **STOP** - Wait for user 'GO' confirmation

### CHUNK 4: Data Processing (≤5 operations)
1. Add Code node "Hunter Response Normalization"
2. Implement field mapping: linkedin.handle → linkedin_url
3. Add Code node "Person Data Merger" with PDL precedence logic
4. Test data merger with mixed PDL/Hunter scenarios
5. **STOP** - Wait for user 'GO' confirmation

### CHUNK 5: Cost Tracking & Integration (≤5 operations)
1. Add Code node "Daily Cost Updater" for vendor-specific costs
2. Connect both PDL success and Hunter paths to merger
3. Route merged data to existing ICP Scoring
4. End-to-end test: PDL success, PDL failure→Hunter, both failures
5. **STOP** - Final validation with user

## TESTING REQUIREMENTS:
Use test payloads from `context/CURRENT-SESSION/PHASE-2C/tests.md`:
- PDL success scenario (no Hunter trigger)
- PDL failure scenario (Hunter fallback)
- Feature gate disabled (Hunter bypass)

## EVIDENCE COLLECTION:
After EACH chunk, show:
- MCP tool command executed
- Workflow version change (old → new)
- Node ID and configuration
- Test execution ID and results
- Cost tracking validation
- Any errors encountered

## SUCCESS CRITERIA:
- [ ] No PDL regression (95%+ success rate maintained)
- [ ] Hunter adds value (65%+ success on PDL failures)
- [ ] Cost tracking accurate ($0.03 PDL, $0.049 Hunter)
- [ ] Feature gate rollback working (instant disable)
- [ ] Processing time <20 seconds total

## CRITICAL IMPLEMENTATION NOTES:
1. Use "use context7" in prompts for current n8n documentation
2. Apply chunking with ≤5 operations and user confirmation waits
3. Use MCP tools for all workflow modifications, never manual JSON
4. Reference memory guidance for boolean routing and credentials
5. Test regression after every chunk to ensure no PDL impact

## BEGIN ONLY AFTER: 
Confirming tools work and loading complete context package.

**Ready for evidence-based, chunked implementation of Hunter waterfall enhancement!**
