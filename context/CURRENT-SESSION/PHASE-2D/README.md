# Phase 2D: Enrichment Waterfall Enhancements

Pre-third-provider (Dropcontact) optimizations to improve quality and cost before adding Dropcontact as a third provider. This context package defines exactly what to implement, how to implement it (with code), and how to prove it works.

## Objectives
- Reduce double-fail junk routed to HR
- Stabilize ICP scoring variance with section caps
- Identify salvageable double-fails before HR
- Flag inconsistent or risky patterns for review

## Deliverables (Chunked Strategy)
1. ICP Response Processor replacement (V3.2 base caps 15/40/30)
2. Anomaly Detection code node (after ICP)
3. Junk Detection Filter (after Double-Fail TRUE)
4. Salvage Pre-Score Calculator (after Junk Filter)
5. Person Location Application (post-enrichment; gating + fields persistence)
6. Tests + evidence package

## References
- Technical Requirements: `TECHNICAL-REQUIREMENTS.md`
- Code Specs: `CONTEXT-PACKAGE.md` (includes exact code blocks)
- Tests: `tests.md`
- Evidence: `evidence.md`
- Status: `PHASE-2D-SESSION-STATUS.md`
- Plan Source: `docs/uysp-apollo-development-plan.md` (structure authoritative; provider swapped to Dropcontact)
