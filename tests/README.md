# UYSP Testing Suite (Consolidated)

## What to use now
- npm scripts:
  - `npm run test:quick` → runs `tests/quick/index.js` (HTTP-only)
  - `npm run test:smoke` → runs `tests/quick/smoke.js` (minimal)
  - `npm run test:phase2d` → runs PDL-first payloads in `tests/data/phase-2D/`
  - `npm run test:comprehensive` → runs all JSON payloads via `tests/comprehensive/full-suite.js`
  - `npm run test:wrapper` → runs `tests/comprehensive/test-runner-wrapper.js quick`

## Deterministic lead selection (no randomness)

Always refresh and select from the canonical email-only matrix:

```bash
# 1) Regenerate canonical buckets from latest triage
node scripts/generate-canonical-triage-matrix.js

# 2) Select leads deterministically (updates offset to avoid reuse)
node scripts/select-test-emails.js --bucket pdl_success --count 5

# 3) Run tests (smoke/quick read selected-emails.json automatically)
npm run test:smoke
npm run test:quick

# Optional: override via CLI
npm run test:smoke -- --bucket double_fail --offset 5
npm run test:quick -- --bucket hunter_fallback --offset 10
```

## Webhook endpoint
- Production: `https://rebelhq.app.n8n.cloud/webhook/kajabi-leads-complete-clean`

## Structure
```
tests/
  quick/                 # Fast HTTP-only scripts
  comprehensive/         # Orchestrators (no API tools)
  data/
    phase-2C/            # Hunter-first scenarios
    phase-2D/            # PDL-first scenarios
    phase-2E/            # Apollo-first scenarios
    shared/              # Common and edge-case payloads
  results/               # Saved outputs
  evidence/              # Historical evidence
```

## Deprecated (do not use)
- run-manual-tests.js, test-runner.sh, quick-test-validation.js, comprehensive-test-runner.js, verification-queries.js
- tests/payloads/* → replaced by `tests/data/*`

See `tests/HOW-TO-TEST.md` and `tests/AI-TESTER-ROLE.md` for orchestration and validation steps.
