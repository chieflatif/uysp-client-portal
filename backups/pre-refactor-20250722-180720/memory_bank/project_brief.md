memory_bank/project_brief.md
# UYSP Project Brief

## Goals
- Automate lead processing from Kajabi to SMS outreach.
- Two-phase qualification: Company (B2B tech) then person (sales role).
- ICP scoring: 0-100 via Claude AI, domain fallback.
- SMS to qualified leads: Compliance-first (10DLC, DND, TCPA).
- Cost control: $50 daily limit, circuit breaker.
- Human review for data gaps/international.
- Metrics: Leads processed, SMS sent, meetings booked.

## Success Metrics
- 700 leads/week processed.
- 12% SMS send rate.
- Enrichment success >70%.
- Opt-out <2%.
- Costs under $50/day.
- Cache hit >70%.

## Quick Start
- Accounts: Apollo Pro, Twilio, SimpleTexting (10DLC), Claude, Airtable, n8n.
- TEST_MODE=true initially.
- Build per development-sequence.md.
- Test with tests/*.json.
- Monitor Daily_Metrics table.