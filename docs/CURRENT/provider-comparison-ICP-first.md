# Enrichment Providers – ICP-First Comparison (Title + Company focus)

Purpose
- Phase 1 goal: sniff test for ICP using only job title and company name (plus LinkedIn URL if available).
- Phase 2 goal (only after ICP pass): deeper enrichment (phones, history, engagement).

Providers in scope
- PDL Person (primary)
- Dropcontact (second; company + LinkedIn recovery)
- Hunter (verifier; not used for title/company)
- Optional later: Snov.io (fallback)

What “good enough” means for Phase 1
- Company present and consistent with email/domain.
- Job title present.
- LinkedIn URL is a strong bonus (for later history scrape), but not required for Phase 1 pass.

Evidence to date (UYSP runs)
- Dropcontact 100‑lead batch (requestId bllzllmprbwpuws):
  - Overall (n=100): linkedin 71%, title 23%, company 95%, domain‑consistent 82%.
  - Double‑fail subset (n=14): linkedin 50%, title 7%, company 85.7%.
  - File: `tests/results/dropcontact-quality-latest.json`.
- PDL Person: operational as primary; Phase 1 title/company rates TBD (collect in next probe).
- Hunter: deliverability verifier only; no title/company enrichment.

Preliminary conclusions (Phase 1 suitability)
- PDL: Primary; expected strong title/company on corporate domains.
- Dropcontact: Strong at company and LinkedIn recovery; moderate title yield. Suitable as Phase‑1 fallback for company validation and LinkedIn capture.
- Hunter: keep as verifier; not a Phase‑1 enrichment source.

Finalized waterfall
- **PDL → Dropcontact → Hunter (verifier)**

Next evidence to collect (minimal)
- PDL 100‑lead probe: measure title/company presence and domain consistency.
- Comparative table: PDL vs Dropcontact on the same 100 leads (title, company, LinkedIn) with cost per useful field.

Cost note (user input)
- Dropcontact indicative pricing: ~1,500 searches ≈ $100 (≈$66 per 1,000). Update after plan confirmation.

Status
- Living document; do not widen scope until PDL probe complete.
