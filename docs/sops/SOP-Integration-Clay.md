# SOP: Integration – Clay.com (Authoritative v2)

## 1) What this does (plain English)
- Enrich the person first (primary provider), then backfill with Dropcontact if anything is missing.
- Create “Consolidated” fields so we never overwrite good data.
- Write the consolidated domain to the companies table to trigger company enrichment.
- Add a tiny lookup (“Company Ready”) so company lookups only run after enrichment finishes.
- Write back one field to Airtable: `Enrichment Outcome` = Success / No Match.

## 2) Source
- Table: your Clay table (Raw Leads – v2 (Authoritative)).
- Leftmost column is the Airtable source pulling: First Name, Last Name, Email, Phone, Processing Status, HRQ Status, etc.

## 3) Left-to-right flow (exact UI labels)

### A. Normalize + validate phone
- Keep your existing phone normalization and validation columns at the start.

### B. Person enrichment (primary)
- Click + Add column → Add Enrichment → select your primary Person enrichment.
- Inputs: Email, First Name, Last Name (Company if available).
- Keep outputs you use: Job Title, LinkedIn URL – Person, Location Country, Organization (Company), Primary Domain.

### C. Person enrichment (Dropcontact backfill)
- + Add column → Add Enrichment → Dropcontact (Person).
- Run settings → Only run if → any of these are empty:
  - Job Title OR LinkedIn URL – Person OR Company OR Primary Domain OR Country
- Keep outputs that fill gaps only.

### D. Person enrichment (final pass) – optional
- A third enrichment using whatever fields you now have (title / company / domain / country) to improve matches.

### E. Consolidated fields (prefer primary, else Dropcontact)
- + Add column → Formula.
- Create 5 formula columns:
  - Consolidated Job Title
  - Consolidated Company
  - Consolidated Domain
  - Consolidated LinkedIn URL – Person
  - Consolidated Country
- Rule for each: use your primary provider’s value; if empty, use Dropcontact’s. Insert field tokens via the picker (do not type names).

### F. Write company domain to companies table
- + Add column → Add Enrichment → Airtable → Create/Update (your companies table, e.g., “companies to enrich”).
- Map the domain field using `Consolidated Domain`.
- Run settings → Only run if → `Consolidated Domain` is not empty (insert as token chip).
- Enable de-duplication if available.

## 4) Company enrichment and safe lookup back

### G. Company Ready (tiny lookup to prevent early runs)
- + Add column → Lookup Multiple Rows in Other Table.
- Table to Search: your companies table (e.g., companies to enrich).
- Target Column: the domain field used for matching (e.g., company_domain / primary_domain).
- Filter Operator: Equals.
- Row Value: insert `Consolidated Domain` (use the token chip; do not type).
- Limit: On → 1.
- Fields to return: `company_type` (only).
- Column name: Company Ready.
- Run settings: Auto-update On.

### H. Main company lookup (returns all company fields)
- Open your existing “Lookup Multiple Rows in Other Table” that pulls company fields (e.g., Company Type, Company Description, Company LinkedIn, Industry, Company Score).
- Click the gear icon (Run settings) → turn on “Only run if”.
- Condition: `Company Ready` is not empty.
- Auto-update: On → Save.
- Optional: “Run on all rows” once to hydrate rows whose companies already finished enriching.

## 5) Outcome + Airtable write-back

### I. Outcome (Success / No Match)
- + Add column → Formula.
- Use your working rule that depends on company results (insert tokens via picker):
  - If Company Type OR Company Score is missing → `No Match`, else `Success`.

### J. Airtable write-back (single field)
- + Add column → Add Enrichment → Airtable → Update record (or Create/Update if you upsert).
- Merge key: Record ID (preferred) or Email.
- Fields to update: `Enrichment Outcome` = {{Outcome}} (insert as a token chip; do not type braces).

## 6) Airtable expectations
- `Enrichment Outcome` is a Single select with options exactly: `Success`, `No Match` (and `Error` only if you use it).
- Your “Clay Queue” view in Airtable should filter by `Enrichment Outcome is empty` (not by an enrichment timestamp).
- If you want a timestamp, use a `Last modified time` field watching `Enrichment Outcome`, or a simple automation when it changes.

## 7) Troubleshooting (quick checks)
- Lookup returns nothing:
  - Click “Refresh fields”, re-select “Table to Search” and “Target Column”, and make sure “Row Value” is the Consolidated Domain token chip (not typed text). Keep `Limit: 1`, `Auto-update: On`.
- Companies table has blank rows and blank enrichments:
  - Ensure the Create/Update column has Run settings → Only run if `Consolidated Domain` is not empty.
  - One-time cleanup in Airtable: create a view filtering domain is empty → select all → delete.
- Airtable shows `{{Success}}` as an option:
  - You typed `{{Outcome}}` instead of inserting the token chip. Clear it and re-insert the token. Rename any literal options to `Success` / `No Match`.
- Dropcontact runs for everyone:
  - Open its column → Run settings → “Only run if” missing fields (title / LinkedIn / company / domain / country).

## 8) Done-when checklist
- Person enrichment runs first; Dropcontact only fills blanks.
- Consolidated Job Title / Company / Domain / LinkedIn / Country exist.
- Consolidated Domain is written to companies table (Only run if not empty).
- `Company Ready` returns `company_type`.
- Main company lookup has “Only run if `Company Ready` is not empty”.
- Outcome writes back to Airtable via a token (no literal braces).
- Airtable views/automations key off `Enrichment Outcome` (not an enrichment timestamp).
