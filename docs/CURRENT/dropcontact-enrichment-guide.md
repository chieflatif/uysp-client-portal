# Dropcontact Enrichment Guide (Waterfall Integration)

Source: Dropcontact developer docs — see Authentication and Enrich endpoint (batch + poll) [link](https://developer.dropcontact.com/?_ga=2.125462922.162724618.1755093775-1216453417.1755093774#introduction)

## Role in UYSP
- Finalized 2nd provider in enrichment waterfall.
- Waterfall order: **PDL → Dropcontact → Hunter (verifier)**

## Credentials
- Name: `Dropcontact API`
- Type: HTTP Header Auth (predefinedCredentialType)
- Header: `X-Access-Token: <apiKey>`

## Endpoints (Batch + Poll recommended)
- Batch submit: `POST https://api.dropcontact.io/batch`
- Poll: `GET https://api.dropcontact.io/batch/{requestId}`
- Sync reference (not recommended for production): `POST https://api.dropcontact.com/v1/enrich/all`

## Minimum Inputs
- email (preferred)
- Optional: first_name, last_name, website/domain

## Expected Output Fields
- linkedin (or linkedin_url)
- company (company_name)
- job/title (job)
- email[] (array of { email, qualification })
- company_linkedin
- website/domain

## n8n Node Specs (placeholders)
- Gate (IF): `$vars.DROPCONTACT_ENABLED === 'true'`
- Circuit Breaker (Code): 3 errors/hour → skip vendor; use `$vars.DROPCONTACT_ERROR_COUNT`
- HTTP Submit: POST /batch; body includes mapped input fields; capture `requestId`
- HTTP Poll: GET /batch/{requestId}; parse `data[]`
- Response Processor: map fields to canonical: `linkedin_url`, `title_current`, `company_enriched`, `email[]`, `website`; persist `dropcontact_requestId`, `dropcontact_status_code`
 - UI Settings: Enable "Always Output Data" in HTTP nodes

## Known Gotchas
- Use sync `/v1/enrich/all` for simple flows in docs; batch+poll is acceptable if you always capture `requestId`.
- Always capture and persist `requestId` from batch submit.
- Prefer polling; consider `forceResults=true` if needed.
- Respect rate limits (429), handle 401/403 with circuit breaker.
- Never call Hunter Finder; Hunter is deliverability verification only.

## Cost Notes
- Trial outcome pending.
- Indicative pricing: ~1,500 searches ≈ $100 (user data). Finalize after 100‑lead test.

## Evidence References
- tests/results/dropcontact-probe-latest.json (16/LinkedIn 7)
- tests/results/dropcontact-batch-latest.json (34/LinkedIn 21)
- Future: docs/CURRENT/dropcontact-company-change-detection.md (cross-link)

## Links
- Dropcontact Docs: https://developer.dropcontact.com/?_ga=2.125462922.162724618.1755093775-1216453417.1755093774#introduction
