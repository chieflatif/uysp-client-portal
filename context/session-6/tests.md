# Test Requirements: Session 6

## Full System Edge Cases

1. **High ICP B2B** (should get SMS)
2. **Medium ICP B2B** (should get SMS)
3. **Low ICP B2B** (should archive)
4. **Non-B2B** (should archive at Phase 1)
5. **No Company Data** (human review)
6. **International Phone** (human review)
7. **DND Number** (compliance block)
8. **After Hours** (time window block)
9. **Duplicate** (should update)
10. **Missing Email** (should error gracefully)
11. **New Kajabi Variations** (field mapping test)
12. **Boolean 'checked'/'y'** (conversion test)
13. **Invalid Phone** (validation fail)
14. **Cost Limit Exceeded** (circuit breaker)
15. **Claude API Fail** (fallback scoring)

## Verification Protocol

**For each**: Send payload, wait, query Airtable  
**Check**: Record exists? Fields mapped? Routing correct?  
**Measure**: Processing time <5 min  
**Log**: Any unknowns to Field_Mapping_Log

## Success Criteria
- 100% execution success (no errors)
- 98%+ field mapping rate
- Zero duplicates created
- All compliance blocks work
- Evidence: Record IDs, execution IDs for all 