# Phase 2E Technical Requirements

## Chunked Implementation Plan (≤5 ops per chunk)

### Chunk 1: Gate + Circuit Breaker
- Add Dropcontact Waterfall Gate (IF) driven by `$vars.DROPCONTACT_ENABLED`
- Insert Circuit Breaker Code node before HTTP

### Chunk 2: Dropcontact HTTP
- Batch submit: `POST https://api.dropcontact.io/batch`
- Poll: `GET https://api.dropcontact.io/batch/{requestId}`
- Sync reference (not recommended for prod): `POST https://api.dropcontact.com/v1/enrich/all`
- Authentication: predefinedCredentialType → HTTP Header Auth → select `Dropcontact API` (header `X-Access-Token`)
- Minimum inputs: email (preferred), optionally first_name, last_name, website/domain
- Options: timeout 10000, retryOnFail ON, maxTries 3, waitBetweenTries 5000, continue on error

### Chunk 3: Response Processor
- Handle 429/401/403, compute costs per Dropcontact credit model; capture and persist `requestId`; parse output fields: linkedin, company, job/title, emails[], company_linkedin, website

### Chunk 4: Person Merger + Airtable Mapping
- Update merger precedence to include `dropcontact` with two placement options documented
- Apply standardized Airtable mapping to all person nodes

### Chunk 5: Tests & Evidence
- Execute with 3 payloads (normal, junk, API error)
- Export workflow JSON, capture execution IDs, costs, and vendor flags

## n8n Cloud Constraints (MANDATORY)
- Use `$vars` not `$env`
- Expression spacing: `{{ $json.field }}`
- Credentials via UI only (predefinedCredentialType)
- Reference: `docs/CURRENT/critical-platform-gotchas.md`
 - Cross-link: `docs/CURRENT/dropcontact-company-change-detection.md`
 - Docs: [Dropcontact API docs](https://developer.dropcontact.com/?_ga=2.125462922.162724618.1755093775-1216453417.1755093774#introduction)
