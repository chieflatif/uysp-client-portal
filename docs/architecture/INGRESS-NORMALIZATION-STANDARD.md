# Ingress Normalization Standard (n8n Light Layer)

Status: Authoritative • Scope: Realtime + Backlog ingress only • Owner: n8n

## ✅ 2025-09-24: Phone Normalization Issue RESOLVED
- **Problem**: Parse CSV node couldn't map "Phone Number (phone_number)" from mass import sheets
- **Resolution**: Updated live workflow `A8L1TbEsqHY6d4dH` with robust header mapping and fallbacks
- **Current State**: All mass import headers now map correctly; phone-only gate working per standard

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


## HRQ Prefilter (Phone-Only Gate)

Purpose
- Archive only when there is no valid phone; email type (personal vs company) is ignored.

Placement
- In the Bulk Import workflow: after CSV Parse → Normalize, before any Clay-facing steps.

n8n Code node (classify + prepare fields)
```javascript
function sanitizeEmail(v){ if(!v) return ''; const s=String(v).trim().toLowerCase(); return s.replace(/\s+/g,'').replace(/[.,;:]+$/,''); }
function normalizePhone(v){ if(!v) return ''; let s=String(v).trim(); if (s.startsWith('+')) s='+'+s.slice(1).replace(/[^0-9]/g,''); else s=s.replace(/[^0-9]/g,''); if (s.startsWith('+')) return s; if (s.length===11 && s.startsWith('1')) return '+1'+s.slice(1); if (s.length===10) return '+1'+s; return s; }

const email = sanitizeEmail($json.email);
const phone = normalizePhone($json.phone);
const domain = email.includes('@') ? email.split('@')[1] : '';
const digits = String(phone||'').replace(/\D/g,'').replace(/^1/,'');
const invalidPhone = digits.length !== 10 || /^(.)\1+$/.test(digits) || digits === '0000000000';

return {
  ...$json,
  email,
  company_domain: domain,
  processing_status: invalidPhone ? 'Complete' : 'Queued',
  hrq_status: invalidPhone ? 'Archive' : 'None',
  hrq_reason: invalidPhone ? 'No valid phone' : ''
};
```

Airtable Upsert (single node)
- Match on Email
- Map: `company_domain`, `processing_status`, `hrq_status`, `hrq_reason`, and other normalized fields

Clay intake view (required)
- Filter: `Processing Status = Queued`

Optional midstream catcher
- Scheduled n8n workflow that re-checks domain list (or Clay `IsLikelyPersonalEmail`) and updates HRQ fields, moving records out of the queue.


