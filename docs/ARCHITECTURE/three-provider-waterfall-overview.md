# Three-Provider Waterfall Overview (Pointer Doc)

This is a concise overview to aid quick navigation for development agents. It does NOT replace existing authoritative architecture. Use it as a map; follow the linked sources for full details.

## Enrichment Waterfall
- Primary: PDL Person
- Second: Dropcontact (Phase 2E)
- Final: Hunter.io (verifier only)
- Finalized order: `pdl → dropcontact → hunter`
- Merge precedence: `pdl → dropcontact → hunter`; if all fail → Human Review

## Phase 2D: Pre-Dropcontact Enhancements
- V3 scoring caps: 25/40/35
- Junk Detection Filter → auto-archive
- Salvage Pre-Score Calculator → rescue candidates
- Anomaly Detection → human review flags

## Phase 2E: Dropcontact Integration
- Gate via `$vars.DROPCONTACT_ENABLED`
- Circuit breaker (≥3 errors/hour)
- HTTP (batch submit + poll):
  - Batch submit: `POST https://api.dropcontact.io/batch`
  - Poll: `GET https://api.dropcontact.io/batch/{requestId}`
  - Sync reference (not recommended for prod): `POST https://api.dropcontact.com/v1/enrich/all` ([Dropcontact docs](https://developer.dropcontact.com/?_ga=2.125462922.162724618.1755093775-1216453417.1755093774#introduction))
- Minimum inputs: `email` (preferred), optionally `first_name`, `last_name`, `website/domain`
- Expected fields: `linkedin`, `company`, `job/title`, `email[]`, `company_linkedin`, `website`
- Credentials: `Dropcontact API` via HTTP Header `X-Access-Token`
- Final placement pending 100‑lead test

## n8n Cloud Constraints (Quick)
- Use `$vars` (not `$env`)
- Expression spacing: `{{ $json.field }}`
- Credentials via UI only (predefinedCredentialType)
- Persistence: Static data/Variables

## Authoritative Sources (read-first)
- `docs/ARCHITECTURE/complete-enrichment-architecture-summary.md`
- `docs/ARCHITECTURE/PHASE-2C-HUNTER-WATERFALL-FINAL-PLAN.md`
- `docs/CURRENT/dropcontact-enrichment-guide.md`

Scope: overview only. For any conflict, the authoritative docs above govern.
