[AUTHORITATIVE]
Last Updated: 2025-08-08

# Test Requirements: Phase 2C Hunter Waterfall

## Test Payloads

### PDL Success Scenarios (No Hunter Trigger)
```json
{
  "email": "john.doe@techcorp.com",
  "first_name": "John",
  "last_name": "Doe",
  "pdl_person_success": true,
  "linkedin_url": "https://linkedin.com/in/johndoe",
  "title_current": "VP Engineering",
  "company_enriched": "TechCorp Inc"
}
```

### PDL Failure Scenarios (Hunter Trigger)
```json
{
  "email": "sarah.smith@startup.io", 
  "first_name": "Sarah",
  "last_name": "Smith",
  "pdl_person_success": false,
  "enrichment_failed": true
}
```

### Feature Gate Disabled
```json
{
  "email": "test@example.com",
  "PERSON_WATERFALL_ENABLED": "false"
}
```

## Verification Steps

### Chunk 1: Feature Gate Testing
1. **Set Environment**: PERSON_WATERFALL_ENABLED=false
2. **Send Test Payload**: Any email address
3. **Verify Bypass**: Hunter nodes should be skipped entirely
4. **Evidence Required**: Execution path shows direct route to ICP Scoring

### Chunk 2: PDL Success Path (Regression Test)
1. **Use Known PDL Success Email**: From previous Phase 2B tests  
2. **Verify PDL Enrichment**: Confirm pdl_person_success=true
3. **Verify Hunter Skip**: Hunter nodes should not execute
4. **Evidence Required**: PDL data preserved, no Hunter cost incurred

### Chunk 3: Hunter Fallback Path
1. **Use Known PDL Failure Email**: From previous Phase 2B tests
2. **Verify PDL Failure**: Confirm pdl_person_success=false
3. **Verify Hunter Trigger**: Hunter API call should execute
4. **Evidence Required**: Hunter response data, cost tracking updated

### Chunk 4: Data Precedence Testing
1. **Test Mixed Data**: Lead with some PDL and some Hunter fields
2. **Verify Precedence**: PDL data should take priority
3. **Verify Merger**: All fields properly combined
4. **Evidence Required**: Final person object shows correct precedence

### Chunk 5: Cost Tracking Validation
1. **Monitor Daily Costs**: Before and after test execution
2. **Verify PDL Costs**: $0.03 logged for PDL successes
3. **Verify Hunter Costs**: $0.049 logged for Hunter calls
4. **Evidence Required**: Daily_Costs table entries with correct vendor attribution

## Expected Results

### Feature Gate Disabled
- **Route**: Direct bypass to ICP Scoring
- **Hunter Calls**: 0
- **Cost Impact**: $0

### PDL Success (95% of cases)
- **Route**: PDL → ICP Scoring (unchanged)
- **Hunter Calls**: 0  
- **Processing Time**: <15 seconds (no change)
- **Cost**: $0.03 (PDL only)

### PDL Failure → Hunter Success (65% of remaining 5%)
- **Route**: PDL failure → Hunter → ICP Scoring
- **Hunter Calls**: 1
- **Processing Time**: <20 seconds 
- **Cost**: $0.049 (Hunter only)
- **Fields Captured**: linkedin_url OR title_current OR company_enriched

### Both PDL & Hunter Failure (35% of remaining 5%)
- **Route**: PDL failure → Hunter failure → Human Review
- **Hunter Calls**: 1
- **Cost**: $0.049 (Hunter attempt)
- **Final Status**: enrichment_failed=true, routing_decision='human_review'

## Success Criteria Validation

### No Regression Requirements
- [ ] **PDL Success Rate**: Maintain 95%+ on known good emails
- [ ] **PDL Processing Time**: <15 seconds average maintained
- [ ] **PDL Data Quality**: No field corruption or mapping errors
- [ ] **ICP Scoring**: Unchanged inputs and outputs

### Hunter Value Addition
- [ ] **Hunter Success Rate**: >70% on PDL failures  
- [ ] **LinkedIn Capture**: URLs properly formatted with https://
- [ ] **Job Title Capture**: Non-null title_current on Hunter successes
- [ ] **Company Capture**: Non-null company_enriched on Hunter successes

### Cost & Performance
- [ ] **Cost Accuracy**: Exact vendor attribution in Daily_Costs
- [ ] **Budget Compliance**: No unexpected overages
- [ ] **Performance Impact**: Total time <20 seconds
- [ ] **Feature Gate**: Instant disable capability verified

## Error Scenarios

### Hunter API Failures
- **Test**: Invalid API key or network timeout
- **Expected**: Graceful failure, route to human review  
- **Evidence**: Error logged, no infinite retries

### Malformed Hunter Responses
- **Test**: Incomplete or invalid JSON from Hunter
- **Expected**: Default to null values, continue processing
- **Evidence**: No workflow crashes, person object valid

### Environment Variable Missing
- **Test**: PERSON_WATERFALL_ENABLED undefined
- **Expected**: Default to disabled state (bypass Hunter)
- **Evidence**: Feature gate routes to PDL only

**All tests must include execution IDs and specific evidence collection.**

# Validated 9-Lead Test Set for Routing

## 1. PDL Success (PDL Finds, Skips Others)
1. **Kinero Tan** (kitan@adobe.com, 3604314662)
   ```bash
   curl -X POST "https://rebelhq.app.n8n.cloud/webhook/kajabi-leads-complete-clean" -H "Content-Type: application/json" -d '{"email": "kitan@adobe.com", "first_name": "Kinero", "last_name": "Tan", "phone": "3604314662"}'
   ```
   - Expected: PDL enriches → People table.

2. **Dara Boland** (dboland@hubspot.com, 877683656)
   ```bash
   curl -X POST "https://rebelhq.app.n8n.cloud/webhook/kajabi-leads-complete-clean" -H "Content-Type: application/json" -d '{"email": "dboland@hubspot.com", "first_name": "Dara", "last_name": "Boland", "phone": "877683656"}'
   ```
   - Expected: PDL enriches → People table.

3. **Jake Turpin** (jacturpi@amazon.com, 4255779762)
   ```bash
   curl -X POST "https://rebelhq.app.n8n.cloud/webhook/kajabi-leads-complete-clean" -H "Content-Type: application/json" -d '{"email": "jacturpi@amazon.com", "first_name": "Jake", "last_name": "Turpin", "phone": "4255779762"}'
   ```
   - Expected: PDL enriches → People table.

## 2. Hunter Waterfall (PDL Misses, Hunter Finds)
1. **John Sichau** (jsichau@adobe.com, 61427562747)
   ```bash
   curl -X POST "https://rebelhq.app.n8n.cloud/webhook/kajabi-leads-complete-clean" -H "Content-Type: application/json" -d '{"email": "jsichau@adobe.com", "first_name": "John", "last_name": "Sichau", "phone": "61427562747"}'
   ```
   - Expected: PDL fail → Hunter enriches → People table.

2. **Gavin Arredondo** (arregavi@amazon.com, 4844087795)
   ```bash
   curl -X POST "https://rebelhq.app.n8n.cloud/webhook/kajabi-leads-complete-clean" -H "Content-Type: application/json" -d '{"email": "arregavi@amazon.com", "first_name": "Gavin", "last_name": "Arredondo", "phone": "4844087795"}'
   ```
   - Expected: PDL fail → Hunter enriches → People table.

3. **Shane Dempsey** (sdempsey@hubspot.com, 35315187622)
   ```bash
   curl -X POST "https://rebelhq.app.n8n.cloud/webhook/kajabi-leads-complete-clean" -H "Content-Type: application/json" -d '{"email": "sdempsey@hubspot.com", "first_name": "Shane", "last_name": "Dempsey", "phone": "35315187622"}'
   ```
   - Expected: PDL fail → Hunter enriches → People table.

## 3. Human Review (Double Failure - PDL/Hunter Miss, Apollo Would Find)
1. **Cory Downham** (cdown24@gmail.com, -)
   ```bash
   curl -X POST "https://rebelhq.app.n8n.cloud/webhook/kajabi-leads-complete-clean" -H "Content-Type: application/json" -d '{"email": "cdown24@gmail.com", "first_name": "Cory", "last_name": "Downham"}'
   ```
   - Expected: Double fail → Human Review. (Apollo: Manager / Consulting)

2. **Marty** (martyestrada4646@yahoo.com, 8478331751)
   ```bash
   curl -X POST "https://rebelhq.app.n8n.cloud/webhook/kajabi-leads-complete-clean" -H "Content-Type: application/json" -d '{"email": "martyestrada4646@yahoo.com", "first_name": "Marty", "last_name": "", "phone": "8478331751"}'
   ```
   - Expected: Double fail → Human Review. (Apollo: Sales Rep / Retail)

3. **Jonathan Tomevi** (jtomevi@microsoft.com, 9083282649)
   ```bash
   curl -X POST "https://rebelhq.app.n8n.cloud/webhook/kajabi-leads-complete-clean" -H "Content-Type: application/json" -d '{"email": "jtomevi@microsoft.com", "first_name": "Jonathan", "last_name": "Tomevi", "phone": "9083282649"}'
   ```
   - Expected: Double fail → Human Review. (Apollo: Engineer / Microsoft)

## Notes
- Mix of personal/corporate, with/without phones for enrichment testing.
- Apollo notes show potential for future fallback (not current).
- Use for workflow tests: Trigger and verify paths.
