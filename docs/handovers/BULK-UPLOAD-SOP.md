# Bulk Upload SOP — Google Sheets → n8n → Airtable → Clay

Status: Authoritative • Audience: Non-technical operators • Last updated: 2025-08-27

Workflow used: n8n “UYSP Backlog Ingestion” (id `qMXmmw4NUCh1qu8r`)

---

## Prerequisites
- Google Sheet with headers: Email, First Name, Last Name, Phone, Company, Title (any casing OK)
- Airtable base: UYSP Lead Qualification (Option C)
- Clay workspace configured per runbook and sourcing Airtable view “Clay Queue”

---

## 10 Steps
1) Prepare your Google Sheet
   - Put your leads on a single tab. Make sure the first row is headers.
   - Sharing: File → Share → General access = Anyone with the link (Viewer).

2) Build the CSV export URL
   - From the sheet URL, capture:
     - SPREADSHEET_ID: between `/d/` and `/edit`
     - gid: the number after `gid=` for your tab
   - CSV URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/export?format=csv&gid=GID`

3) Open n8n workflow
   - Name: UYSP Backlog Ingestion (id `qMXmmw4NUCh1qu8r`).

4) Set the Fetch CSV URL
   - Node: “Fetch CSV” (HTTP Request)
   - URL: paste the CSV export URL from step 2 (NOT the edit URL).

5) Ensure Parse CSV accepts body or data
   - Node: “Parse CSV” (Code)
   - First line must allow both properties:
     ```javascript
     const text = String($input.first().json?.data ?? $input.first().json?.body ?? '').replace(/\r\n/g, '\n').trim();
     if (!text) return [];
     ```

6) Activate Manual Trigger and run
   - Click “Execute workflow” (this runs Manual Trigger → Fetch CSV → Parse CSV → Normalize → Airtable Upsert).

7) Verify Normalize output
   - Fields should include: Email, Phone, First Name, Last Name, Company, Title, Company Domain, HRQ Status, HRQ Reason, Source = Backlog, Processing Status = Queued (or Complete only when there is no valid phone).
   - Note: Email type (personal vs company) is ignored for routing. Only leads with no valid phone are archived at ingestion.

8) Verify Airtable Upsert mappings
   - Match on: Email
   - Mapped: Phone, First Name, Last Name, Company Domain, Processing Status, Source, HRQ Status, HRQ Reason.

9) Airtable view for Clay intake (Cache‑First)
   - Create/confirm view “Clay Queue” on `Leads` with filter: `Processing Status = Queued` (email type ignored).
   - Optional helper views (HRQ monitoring):
     - "HRQ — Manual Process": `HRQ Status = "Manual Process" AND Booked is unchecked`
     - "HRQ — Enrichment Failed (No Person Data)": `Enrichment Timestamp is not empty AND Job Title is empty AND Linkedin URL - Person is empty AND HRQ Status != "Archive"`

10) Run in Clay and validate (Cache‑First)
   - Clay source: Airtable view “Clay Queue”.
   - Prefer Airtable `Companies` cache: ensure `Leads.Company` is linked by Domain. For domains already present in `Companies`, skip company re‑enrichment and only perform person enrichment (if enabled). For new domains, dedupe to `Companies to Enrich`, enrich once, then mirror back to Airtable `Companies` and join to `Leads`.
   - Validate: `Companies` receives new domains; `Leads` gets company fields via link or Clay join; person fields/phone normalization updated; `Enrichment Timestamp` set.

---

## Troubleshooting
- Parse CSV outputs zero items
  - Likely using Google “edit” URL instead of `/export?format=csv&gid=...`.
  - Or response came in `$json.body` not `$json.data` → apply code in step 5.

- Wrong tab exported
  - Update `gid` to match the target tab.

- Airtable errors (`UNKNOWN_FIELD_NAME`, `INVALID_VALUE_FOR_COLUMN`)
  - Re-open the node and remap fields (after any schema changes). Delete old mappings and add fresh.

- Clay writeback rate limits
  - Use “Run rows that haven’t run or have errors” repeatedly with short pauses.

---

## References
- Runbook: `docs/handovers/CLAY-RUNBOOK-NONTECH.md`
- Ingress Standard: `docs/architecture/INGRESS-NORMALIZATION-STANDARD.md`
- Batching Plan: `docs/architecture/CLAY-BATCHING-AUTOMATION-PLAN.md`


