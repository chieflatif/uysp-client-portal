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
