# Migration Guide: Phase 2C → 2D → 2E

## Phase 2C Completion Checklist
- [ ] Bug Fix #1: Duplicate Handler (node a8ab252a-395a-418a-8e3a-c543d9d13a7c)
- [ ] Bug Fix #2: Airtable Upsert mapping (node e270b8de-2c11-4cf9-a439-2110dd0d1f80)
- [ ] Bug Fix #3: Data Integrity Validator
- [ ] All tests passing
- [ ] Workflow backup created

## Phase 2D Implementation Order
1. V3 Scoring fixes (must be first)
2. Junk Detection Filter
3. Salvage Calculator
4. Anomaly Detection
5. Full test suite validation

## Phase 2E Prerequisites
- [ ] Dropcontact API key obtained
- [ ] Dropcontact credential created in n8n UI (HTTP Header `X-Access-Token`)
- [ ] Variables set: DROPCONTACT_ENABLED, DROPCONTACT_ERROR_COUNT, DROPCONTACT_LAST_RESET
- [ ] Cost tracking schema updated (add `dropcontact_person_cost`)
