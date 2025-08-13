# Phase 2D Tests

## Payloads
- Use `context/phase-2d/tests/test-payloads-2d.json`

## Steps
1. Execute workflow in test mode (webhook)
2. Send `2D-JUNK-1` → expect archive route with `junk_score=100`
3. Send `2D-SALVAGE-1` → expect `salvage_pre_score>=20` and route `salvage_scoring`
4. Run repeat scoring on same payload 5x → variance ≤±5
5. Export workflow JSON; record execution IDs and Airtable record IDs
6. Location test pack (unknown → post-enrichment):
   - Tier A: expect +15×conf and outreach yes
   - Tier B: expect +10×conf and outreach yes
   - Tier C: expect +4×conf and outreach yes (SMS priority)
   - Tier D (conf≥0.7 & score≥70): expect human_review_needed=true; no auto-SMS/calls
   - Missing person location: neutral (0); no gating
