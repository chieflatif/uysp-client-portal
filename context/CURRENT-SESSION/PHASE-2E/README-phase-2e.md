# Phase 2E: Dropcontact Integration as Third Provider

*Adding Dropcontact to the enrichment waterfall*

## Architecture Position
Final Waterfall: **PDL → Dropcontact → Hunter (verifier)**
*Hunter is strictly deliverability verification; no person enrichment calls.*

## Integration Components
1. **Dropcontact Gate** (IF node checking DROPCONTACT_ENABLED)
2. **Dropcontact Circuit Breaker** (3 errors/hour protection)
3. **Dropcontact HTTP** (Batch submit + Poll)
4. **Dropcontact Response Processor** (field mapping + cost notes)
5. **Three-Vendor Merger** (precedence fixed: `pdl → dropcontact → hunter`)

## Critical Constraints (n8n Cloud)
- Use $vars not $env
- Spaces required: {{ $json.field }}
- Credentials via UI only
- Static data for persistence

## Cost Structure
- Dropcontact: Trial outcome pending; indicative pricing: ~1,500 searches ≈ $100 (user data). Finalize after 100‑lead test.

## Gotchas (Docs-Only)
- Prefer sync `POST https://api.dropcontact.com/v1/enrich/all` in docs; batch+poll allowed but must capture `requestId`
- Always capture/persist `requestId` when using `/batch`
- Never call Hunter Finder; Hunter is deliverability verifier only
