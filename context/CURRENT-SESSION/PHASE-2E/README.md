# Phase 2E: Dropcontact Integration (Third Provider)

Add Dropcontact as second provider using gate + circuit breaker, HTTP batch submit + poll, response processor, and updated merger. Waterfall finalized: **PDL → Dropcontact → Hunter (verifier)**.

## Deliverables (Chunked Strategy)
1. Dropcontact Gate (IF) and Circuit Breaker (Code)
2. Dropcontact HTTP (batch submit + poll) with retry/backoff
3. Dropcontact Response Processor (cost and field mapping)
4. Three-Vendor Merger (include Dropcontact)
5. Airtable mapping standardization
6. Tests + evidence package

## References
- Technical Requirements: `TECHNICAL-REQUIREMENTS.md`
- Code Specs: `CONTEXT-PACKAGE.md`
- Tests: `tests.md`
- Evidence: `evidence.md`
- Status: `PHASE-2E-SESSION-STATUS.md`
- Plan Source: `docs/uysp-apollo-development-plan.md` (structure only; provider swapped to Dropcontact; waterfall finalized)
