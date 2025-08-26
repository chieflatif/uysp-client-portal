# Ingress Normalization Standard (n8n Light Layer)

Status: Authoritative • Scope: Realtime + Backlog ingress only • Owner: n8n

Purpose
- Ensure any inbound spreadsheet/webhook can be safely ingested into Airtable `Leads` without schema drift, typos, or formatting issues.
- Keep heavy normalization/enrichment/scoring in Clay; ingress is light, deterministic, and idempotent.

Canonical outputs to Airtable (Leads)
- Email, Phone, First Name, Last Name, Company, Title, Company Domain, Source, Processing Status

Allowed transforms (light only)
- Email: trim, lowercase, remove trailing punctuation (.,;:)
- Phone: strip non‑digits; output E.164 when possible
  - US: 10 digits → +1XXXXXXXXXX; 11 digits starting with 1 → +1XXXXXXXXXX
  - If already +<country>, keep and strip non‑digits after the sign
- Names: prefer explicit first/last; else split a single Name into first + remainder
- Company Domain: prefer email domain; else slug(company) + .com (safe fallback)
- Idempotent upsert by Email; preserve originals via Validation/Error fields when needed

Header synonyms (accepted)
- Email: email, email address, e-mail
- Phone: phone, phone number, mobile, cell
- First Name: first_name, firstname, first name, first, fname, Name (split)
- Last Name: last_name, lastname, last name, last, lname, surname, Name (split)
- Company: company, company name, employer, org, organization
- Title: title, job title, role, position

Realtime ingress (Webhook → Normalize → Airtable Upsert)
- Apply the same sanitizers and derivations as Backlog.
- Set Source = "Webhook", Processing Status = "Queued".

Backlog ingress (Manual → Fetch CSV → Parse CSV → Normalize → Upsert)
- Parse accepts header synonyms above.
- Emit sanitized fields and apply the same derivations.
- Set Source = "Backlog", Processing Status = "Queued".

Out-of-scope (handled by Clay)
- Semantic domain correction beyond simple slug+.com
- Identity resolution, dedupe/merge beyond Email
- Enrichment, scoring, eligibility decisions

SMS flow sourcing requirements
- After Airtable Get, reference `$json.fields['Phone']` (final normalized value) for downstream SMS send.
- Persist results (status/campaign/cost) back to Airtable.

References
- See `IMPLEMENTATION-ROADMAP.md` Track 1 (SYS-00) for rollout tasks.
- See `DEVELOPMENT-PLAN-STEP-BY-STEP.md` checklist updates.
- See `SIMPLETEXTING-INTEGRATION.md` for SMS node field sourcing and writeback.


