# Dropcontact – Company Change Detection (Future Automation Notes)

Purpose
- Track when a contact changes company; treat as a high buying‑propensity signal and ICP score input.

Provider capability
- Dropcontact can monitor company changes for known contacts and notify when email/company info changes.
- Output signals to capture: linkedin (if present), new company domain/name, validated email, timestamps.

Airtable schema additions (proposed)
- `company_change_detected` (checkbox)
- `company_change_date` (date)
- `previous_company` (text)
- `previous_company_domain` (text)
- `new_company` (text)
- `new_company_domain` (text)
- `change_source` (single select: dropcontact)

ICP scoring impact (Phase 2D+)
- On company change: +X points to Engagement (configurable), force re‑enrichment path, flag for human review.

Automation hooks (Phase 2E/3)
- Ingest Dropcontact change notifications → upsert Airtable fields above.
- Trigger Slack alert: “Company change detected” with contact, old→new company, LinkedIn URL.
- Re‑run enrichment (PDL → Dropcontact → Snov) and re‑score ICP.
- Optional: create task in CRM for rapid outreach.

Implementation sketch
- Endpoint: poll/ingest provider notifications daily (or webhook if available).
- Idempotency: dedupe by `(email, new_company_domain, company_change_date)`.
- Audit: write event into `Events` table with raw payload and processing status.

Testing notes
- Seed 5 known contacts; simulate provider payload; verify fields, Slack, re‑score, and routing.

Status
- Documented and approved as future automation requirement. Link referenced by Phase 2D context package.
