# Phase 2E Pattern Notes

- Gate + Circuit-breaker first to protect costs
- Use `$vars` not `$env`
- Predefined credentials only (no manual headers)
- Merge precedence (finalized): pdl → dropcontact → hunter (verifier)
- Credentials: Dropcontact API via HTTP Header `X-Access-Token`
- Known gotchas: Prefer sync `/v1/enrich/all` in docs; batch+poll acceptable but always capture `requestId`; never call Hunter Finder
