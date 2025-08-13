# Snov.io – Configuration (ICP-first)

Auth
- OAuth2 Client Credentials
  - Token endpoint: POST https://api.snov.io/v1/oauth/access_token
  - Form fields: grant_type=client_credentials, client_id, client_secret
  - Header on calls: Authorization: Bearer <access_token>

Enrichment (person by email)
- Endpoint (candidate): POST https://api.snov.io/v1/get-profile-by-email
- Body: { "email": "user@company.com" }
- Response fields of interest: job/position/title, company/currentCompany/experience[0].company, linkedin/linkedinUrl
- Rate limits: 60 req/min (per docs)

Project variables
- `SNOV_CLIENT_ID`, `SNOV_CLIENT_SECRET`
- Optional: `SNOV_ENRICH_PATH` (default /v1/get-profile-by-email)

Testing
- Script: `scripts/snov_probe.js` runs on the same 100-email set used for Dropcontact
- Output: `tests/results/snov-100-latest.json` with `summary {title_rate, company_rate, linkedin_rate}` and per-email results
- Call log: `tests/results/snov-call-log.ndjson`

Notes
- Keep Snov as optional fallback after PDL/Dropcontact until quality and cost proven on our data.
