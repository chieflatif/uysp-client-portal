# Session 6: Reality-Based Testing & Validation

## What You're Building
A comprehensive testing suite that verifies the ENTIRE system end-to-end, focusing on actual Airtable records created, not just HTTP responses or console logs. This includes all 10+ payload variations, duplicate scenarios, compliance blocks, and qualification routing.

## Why This Matters
Previous "testing theater" (checking 200 OK but no records) caused 90% of failures. This ensures the system works in reality, with evidence like record IDs.

## Prerequisites
- Sessions 0-5 complete and integrated
- Pattern 06 loaded (reality-based protocol)
- All test payloads prepared (15+ consolidated)
- Field_Mapping_Log ready for unknowns

## Deliverables
- Automated test script for full system
- Verification queries for Airtable records
- Evidence report with IDs and rates
- Unknown field analysis
- Final system backup

## Critical Requirements
- MUST use external triggers (curl/TestSprite)
- MUST wait 5s+ for processing
- MUST verify Airtable records by ID
- MUST check 98%+ field capture rate
- MUST test ALL edge cases (duplicates, international, errors)

## Success Metrics
- 100% workflow execution success
- Zero duplicate records
- 98%+ field mapping rate
- All compliance/routing works
- Full evidence collected 