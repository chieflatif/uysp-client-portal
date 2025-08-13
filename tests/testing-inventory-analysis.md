## Testing Inventory Analysis

### File Structure Found

```
[See tests directory tree captured via tooling; canonical structure under tests/ with quick/, comprehensive/, data/, results/, evidence/, archive-2025-01-27/]
```

### Categorization

| File/Directory | Purpose | Last Modified | Version | Dependencies | Current Status |
|---|---|---|---|---|---|
| tests/quick/index.js | Quick HTTP-only script | 2025-08-12 | v3.1 | node https | Active |
| tests/quick/smoke.js | Minimal smoke HTTP-only | 2025-08-12 | v1.0 | node https | Active |
| tests/comprehensive/test-runner-wrapper.js | Orchestration wrapper (no APIs) | 2025-08-12 | v3.1 | fs,path | Active |
| tests/comprehensive/full-suite.js | Placeholder comprehensive runner | 2025-08-12 | v0.1 | node | Placeholder |
| tests/data/phase-2D/* | Real payloads + cases | 2025-08-12 | v3 | none | Active |
| tests/data/shared/Test-matrix.json | Real lead buckets | 2025-08-12 | v1 | none | Active |
| tests/results/* | Evidence artifacts | various | n/a | none | Active |
| tests/archive-2025-01-27/* | Archived assets | 2025-01-27 | n/a | n/a | Archived |

### Key Findings
- Latest working suite: reality-based v3 (`tests/reality-based-tests-v3.json`)
- Scripts consolidated into `tests/{quick,comprehensive}`; old `tests/scripts` archived
- Real lead matrix present: `tests/data/shared/Test-matrix.json`
- Phase 2D payloads centralized
- Missing: smoke test (now added), phase-2D runner (now added), inventory report (this file)

