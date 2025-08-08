# Phase 2C: Hunter Waterfall Implementation

## LEARNINGS CHECKPOINT ✅
- [ ] Boolean routing: Use `"operation": "true"` for IF nodes (memory:5371063)
- [ ] Credential pattern: Always predefinedCredentialType, never manual headers (memory:5457160)
- [ ] MCP tool sequence: Context7 → MCP N8N → Validation (memory:3931908)
- [ ] Project workspace: H4VRaaZhd8VKQANf ONLY, never personal (memory:3931908)
- [ ] Evidence blocks: Tool verification for all claims
- [ ] Chunking: ≤5 steps, user waits between chunks

## What You're Building
Hunter.io Email Enrichment as a **non-disruptive fallback** after PDL Person API failures. Maintains PDL as primary enrichment source ($0.03/lookup) while capturing LinkedIn profiles, job titles, and company data from Hunter ($0.049/lookup) when PDL provides insufficient data.

## Why This Matters
Current PDL Person API has high miss rates on valid corporate emails, routing too many qualified leads to human review queue. Hunter waterfall captures an additional 65%+ of PDL failures, reducing manual workload while maintaining cost control.

## Prerequisites
- [ ] Phase 2B operational (Q2ReTnOliUTuuVpl active)
- [ ] Branch: feature/pdl-first-hunter-fallback created
- [ ] Hunter API credentials configured (httpHeaderAuth)
- [ ] MCP N8N tools verified operational
- [ ] Documentation overhaul complete (zero Apollo contamination)

## Deliverables
1. **Feature Gate Node**: Environment toggle for waterfall enable/disable
2. **PDL Success Router**: Detect failures and route to Hunter fallback
3. **Hunter HTTP Request**: Email enrichment API integration
4. **Response Processor**: Normalize Hunter data to canonical format
5. **Data Merger**: Combine PDL/Hunter with precedence logic
6. **Cost Tracking**: Enhanced daily cost monitoring

## Critical Requirements
1. **PDL-First**: No changes to existing PDL logic or performance
2. **Feature-Gated**: PERSON_WATERFALL_ENABLED toggle for instant rollback
3. **Non-Breaking**: Zero impact on current Phase 2B success paths
4. **Cost-Controlled**: $50 daily budget with circuit breaker
5. **Additive Schema**: Reuse existing Airtable fields (linkedin_url, title_current, company_enriched)

## Success Metrics
- **No PDL Regression**: Maintain 95%+ success rate on existing PDL path
- **Hunter Value Add**: Achieve 65%+ success rate on PDL failures
- **Cost Efficiency**: Average cost increase <$0.05 per lead
- **Performance**: Total processing time <20 seconds (current: 12s)
- **Data Quality**: 100% field mapping accuracy, no corruption

## Implementation Strategy
### **6-Node Waterfall Sequence:**
1. **Feature Gate** (IF) → Environment toggle check
2. **PDL Success Router** (IF) → Detect PDL failures  
3. **Hunter Enrichment** (HTTP) → Fallback API call
4. **Response Processor** (Code) → Normalize Hunter data
5. **Data Merger** (Code) → Combine with PDL precedence
6. **Cost Tracker** (Code) → Update daily costs

### **Routing Logic:**
- Feature Gate: TRUE → PDL Person, FALSE → Bypass to ICP Scoring
- PDL Router: TRUE → ICP Scoring, FALSE → Hunter Enrichment
- Both paths merge at Data Merger before final ICP Scoring

## Platform Gotchas for Phase 2C
### Gotcha #20: IF Node Boolean Configuration  
**WILL HAPPEN**: When configuring PDL Success Router
**SYMPTOM**: PDL failures not routing to Hunter fallback
**SOLUTION**: Use `"operation": "true"` with proper index mapping
**REFERENCE**: memory:5371063 - Boolean routing behavior opposite to intuition

### Gotcha #21: HTTP Request Authentication
**WILL HAPPEN**: When setting up Hunter API credentials  
**SYMPTOM**: Manual headers fail in n8n Cloud
**SOLUTION**: Use predefinedCredentialType with httpHeaderAuth
**REFERENCE**: memory:5457160 - Credential persistence bugs with manual headers

## Critical Implementation Notes
1. Reference PHASE-2C-TECHNICAL-REQUIREMENTS.md for detailed specifications
2. Use "use context7" in prompts for current n8n documentation  
3. Implement chunking with user confirmation waits
4. Apply established platform gotcha prevention
5. Use MCP tools for all workflow modifications

## Rollback Safety
- **Immediate**: Set PERSON_WATERFALL_ENABLED=false
- **Validation**: Test sample lead confirms Hunter bypass
- **Monitoring**: PDL success path restored to baseline
- **Full Rollback**: Restore Q2ReTnOliUTuuVpl from backup

## Evidence Requirements
After each chunk, provide:
- MCP tool outputs with specific IDs
- Workflow version progression
- Test execution results
- Cost tracking validation
- Performance impact measurement

**Ready for chunked implementation with evidence-based development.**
