# Testing Consolidation Migration Guide

This guide maps old locations to the new consolidated structure.

## What moved to archive
- `tests/reality-based-tests-v2.json` → `tests/archive-2025-01-27/deprecated/`
- `tests/scripts/*.sh` → `tests/archive-2025-01-27/redundant-scripts/`
- `tests/tests/` (empty scaffolding) → `tests/archive-2025-01-27/empty-scaffolding/`

## New structure
```
/tests/
  quick/
  comprehensive/
  data/
    phase-2C/
    phase-2D/
    phase-2E/
    shared/
      edge-cases/
```

## Data consolidation
- `tests/payloads/PDL*.json` → `tests/data/phase-2D/`
- Phase 2D cases from `context/.../PHASE-2D/tests/test-payloads-2d.json` → `tests/data/phase-2D/test-payloads-2d.json`
- `tests/high-value-lead.json` → `tests/data/shared/`
- `tests/international-lead.json`, `tests/unclear-lead.json` → `tests/data/shared/edge-cases/`
- `tests/payloads/BC001-*.json`, `FV001-*.json`, `FV002-*.json` → consolidated under `tests/data/shared/`

## Commands
- Quick tests: `npm run test:quick`
- Comprehensive: `npm run test:comprehensive`
- Smoke: `npm run test:smoke`
- Phase 2D: `npm run test:phase2d`

## Notes
- Original `tests/payloads/` kept for now (will be deprecated in Phase 3).
- Root `scripts/` remains the canonical shell scripts location.
