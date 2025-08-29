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

Google Sheets CSV export (required for HTTP fetch)
- Build URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/export?format=csv&gid=GID` (from the sheet/tab URL)
- Ensure sharing: Anyone with the link → Viewer.
- HTTP node may return content in `$json.data` or `$json.body`; parsers must accept both.

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

Parser fallback note
- When parsing CSV in a Code node, prefer: `const text = String($input.first().json?.data ?? $input.first().json?.body ?? '').trim(); if (!text) return [];`


## HRQ Prefilter (Single-Path, No IF Nodes)

Purpose
- Route personal emails to HRQ before Clay; avoid fragile IF nodes by computing all values in one Code step and doing a single Airtable upsert.

Placement
- In the Bulk Import workflow: after CSV Parse → Normalize, before any Clay-facing steps.

n8n Code node (classify + prepare fields)
```javascript
const personalDomains = [
  'gmail.com','yahoo.com','hotmail.com','outlook.com','icloud.com','aol.com',
  'proton.me','protonmail.com','msn.com','live.com','me.com','mac.com',
  'yandex.com','gmx.com','zoho.com','mail.com','fastmail.com','pm.me'
];

const email = String($json.email || '').toLowerCase().trim();
const domain = email.includes('@') ? email.split('@')[1] : '';
const isPersonal = personalDomains.some(pd => domain === pd || domain.endsWith('.' + pd));

return {
  ...$json,
  email,
  company_domain: domain,
  hrq_status: isPersonal ? 'Archive' : 'None',
  hrq_reason: isPersonal ? 'Personal email' : '',
  processing_status: isPersonal ? 'Complete' : 'Queued',
  skip_enrichment: isPersonal
};

// HRQ Actions (Human Reviewer Options):
// 1. "Archive" - Dead end, no further action
// 2. "Manual Outreach" - Human-driven outreach (not SMS)
// 3. "Approved" - Override criteria, send directly to SMS campaign  
// 4. "Enrich" - Trigger Clay waterfall enrichment process
```

Airtable Upsert (single node)
- Match on Email
- Map: `company_domain`, `processing_status`, `hrq_status`, `hrq_reason`, and other normalized fields

Clay intake view (required)
- Filter: `Processing Status = Queued AND HRQ Status != "Archive"`

Optional midstream catcher
- Scheduled n8n workflow that re-checks domain list (or Clay `IsLikelyPersonalEmail`) and updates HRQ fields, moving records out of the queue.


