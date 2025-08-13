# UYSP Development Sequence

## Phase 2C: PDL/Hunter + Bug Fixes (CURRENT)
- Duplicate Handler data flow fix (node a8ab252a-395a-418a-8e3a-c543d9d13a7c)
- Airtable Upsert `duplicate_count` mapping (node e270b8de-2c11-4cf9-a439-2110dd0d1f80)
- Data Integrity Validator (new node)

## Phase 2D: Enrichment Enhancements (NEW)
- V3 scoring with section caps (25/40/35)
- Junk Detection Filter
- Salvage Pre-Score Calculator
- Anomaly Detection

## Phase 2E: Dropcontact Integration (FINALIZED)
- Dropcontact gate + circuit breaker
- Dropcontact HTTP (batch submit + poll) + response processor
- Three-vendor Person Data Merger (include Dropcontact)
- Airtable field standardization
  - Final precedence: PDL → Dropcontact → Hunter (verifier)

## Subsequent Phases
- Push all later phases one index forward accordingly.
