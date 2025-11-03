# UYSP Testing Guide (Unified)

## Quick commands
```bash
npm run test:smoke         # minimal
npm run test:quick         # 2-5 min HTTP-only
npm run test:phase2d       # iterate PDL-first payloads
npm run test:comprehensive # run all data sets
npm run test:wrapper       # quick + post-run validation steps printed
```

## Deterministic lead selection (email-only)
```bash
# Refresh canonical matrix from latest triage outputs
node scripts/generate-canonical-triage-matrix.js

# Select N emails from a specific bucket (stateful offset; no reuse)
node scripts/select-test-emails.js --bucket pdl_success --count 5

# Run tests (auto-reads selected-emails.json)
npm run test:smoke
npm run test:quick

# Override bucket/offset on the fly
npm run test:smoke -- --bucket double_fail --offset 5
npm run test:quick -- --bucket hunter_fallback --offset 10
```

## Webhook
- `https://rebelhq.app.n8n.cloud/webhook/kajabi-leads-complete-clean`

## Data sets
- `tests/data/phase-2C/*` Hunter-first
- `tests/data/phase-2D/*` PDL-first
- `tests/data/phase-2E/*` Apollo-first
- `tests/data/shared/*` common and edge-cases

## Evidence and validation
- Scripts are HTTP-only. Use API tools after scripts run per `tests/HOW-TO-TEST.md`.

## Deprecated
- Interactive Node runner, bash runner, legacy payloads folder, and legacy quick validators are archived. Use npm scripts above.
