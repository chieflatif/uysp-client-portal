# Phase 2D Technical Requirements

## Chunked Implementation Plan (≤5 ops per chunk)

### Chunk 1: Replace ICP Response Processor
- Update node `8166bd91-62cc-460b-883e-f5c64e943ab1` with exact code (V3.2 base caps 15/40/30)
- Validate scoring variance ≤ ±5 on repeats

### Chunk 2: Add Anomaly Detection
- Insert Code node immediately after ICP Response Processor
- Use exact anomaly code; flag review fields

### Chunk 3: Add Junk Detection Filter
- Insert Code node immediately after Double Failure Router TRUE path
- Auto-route to archive when criteria met

### Chunk 4: Add Salvage Pre-Score Calculator
- Insert Code node after Junk Filter
- Route to salvage_scoring or human_review per score/flag

### Chunk 5: Test & Evidence
- Use `tests.md` payloads
- Export workflow JSON
- Collect Airtable record IDs, execution IDs

### Chunk 6: Person Location Integration (post-enrichment)
- Insert Code node: Person Geo Inference (provisional; cap confidence ≤0.5; no gating)
- Insert Code node: Apply Person Location (post-enrichment scoring + gating)
- Persist fields: `person_location_country`, `location_confidence`, `affordability_tier`, `location_points_applied`, `location_source`, `location_from_linkedin`
- Routing: Tier D with conf ≥0.7 and score ≥70 → `human_review_needed = true`; no auto-SMS/calls

## n8n Cloud Constraints (MANDATORY)
- Use `$vars` not `$env`
- Expression spacing: `{{ $json.field }}`
- Credentials via UI only (predefinedCredentialType)
- Reference: `docs/CURRENT/critical-platform-gotchas.md`

## Evidence Requirements
- Double-fail <25%
- Salvage route shows pre_score ≥20 when enabled
- Scoring variance ≤±5
- Archived junk shows `archived_reason=insufficient_signal`
- Location evidence: Airtable records show person location fields; Tier D gating applied per rules
