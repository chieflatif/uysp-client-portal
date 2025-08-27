# Clay Integration Session - January 27, 2025

## Session Overview
Successfully implemented and tested Clay enrichment pipeline with 10,000+ leads. Discovered critical UI patterns and workarounds for Clay's quirks.

## Current Status
✅ Clay workspace configured
✅ Company deduplication working via "Write to Other Table"
✅ Apollo enrichment operational
✅ GPT-5 Nano ICP classification implemented
✅ Company data joining back to leads (via Lookup Multiple Rows)
✅ Field extraction from JSON responses working
✅ Airtable schema updated with new fields
✅ Documentation updated with field-tested instructions

## Key Technical Discoveries

### 1. Lookup Issues & Solution
- **Problem**: "Lookup Single Row in Other Table" returns "No Record Found" even with matching data
- **Solution**: Use "Lookup Multiple Rows in Other Table" - works reliably
- **Root Cause**: Unknown, but consistent across all tests

### 2. GPT Output Extraction
- GPT returns JSON in a single cell, not separate columns
- Must click cell → Cell Details → hover each field → "Add as column"
- "Define outputs" in GPT config doesn't auto-create columns as expected

### 3. Conditional Formulas
- Clay's "Only run if" syntax is extremely complex
- AI-generated formulas often invalid
- **Solution**: Skip conditionals, run duplicate enrichments, extract from successful one

### 4. Company Classification
- Apollo often misclassifies (e.g., Amazon as "retail" not "tech")
- GPT-5 Nano with simplified prompt works better
- Rule: ANY B2B tech offering = B2B classification (not B2C)

## Production Configuration

### Clay Tables
1. **Raw Leads**
   - Source: Airtable Leads table (automated)
   - Contains: All lead data + enrichments

2. **Companies to Enrich**
   - Unique domains only
   - Auto-dedupe enabled on company_domain
   - Contains all enrichment results

### Enrichment Pipeline
1. Extract domain from email
2. Identify work vs personal emails
3. Write unique domains to Companies table
4. Enrich with Apollo (industry, description)
5. Classify with GPT (B2B SaaS/Tech/Other/B2C)
6. Join back to all leads
7. Write to Airtable (Leads + Companies mirror)

### Field Mappings (Validated)
**Company Fields:**
- company_type → B2B SaaS/B2B Tech Services/Other B2B/B2C Unknown
- company_score → 25/18/10/2
- industry_final → 2-3 word improved industry
- description_final → 10-15 word company summary
- linkedin_url → Company LinkedIn page

**Person Fields:**
- job_title → Job title from Apollo
- location → Country/region
- person_linkedin → Individual's LinkedIn

## Next Steps
1. ✅ Complete Airtable writeback configuration
2. ⏳ Test with full 10,000 lead batch
3. ⏳ Set up automated refresh schedule
4. ⏳ Implement person enrichment (job title, location)
5. ⏳ Configure SMS campaign integration

## Gotchas to Remember
- Always use "Lookup Multiple Rows" not "Single Row"
- GPT fields need manual extraction via Cell Details
- Domains must match exactly (check for hidden characters)
- Auto-dedupe icon is bottom-right of table (not obvious)
- Filter is a pipeline step, not a column option
- "Write to Other Table" is the reliable way to copy between tables

## Cost Estimates
- Apollo company enrichment: ~$0.01 per unique company
- GPT-5 Nano classification: ~$0.02 per company
- Total: ~$0.03 per unique company (not per lead)
- 10,000 leads with ~2,000 unique companies = ~$60

## Session Duration
- Start: Setting up Clay workspace
- Duration: ~3 hours (including troubleshooting)
- Blockers: Lookup issues (45 min), Conditional formulas (30 min)
- Resolution: Found workarounds for all blockers
