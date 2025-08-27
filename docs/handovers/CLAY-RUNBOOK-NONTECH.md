# Clay Runbook (Non-Technical) — Bulk Normalize, Enrich, and Write Back to Airtable

**Document Version**: 2.0 (Reconstructed)
**Date**: 2025-08-26
**Status**: Authoritative Guide

---

## 1. Goal

This runbook provides a step-by-step, non-technical guide for the one-time bulk company enrichment process. The objective is to take a large list of leads, identify all the unique companies within that list, enrich only those unique companies with data from Apollo, and then write that enriched data back to all the original leads in Airtable.

This "deduplicate-then-enrich" process is the cornerstone of the system's cost-efficiency strategy.

## 2. Prerequisites

- **Your Lead List (CSV):** A CSV file containing your leads. It must have at least an `email` column.
- **Airtable Access:** You need access to the `UYSP Lead Qualification (Option C)` Airtable base (`app6cU9HecxLpgT0P`).
- **Clay Account:** You need access to the "UYSP — Refactor v2" workspace in Clay.

## 2.5 Clay UI Quick Map (for absolute beginners)

- **Workspace**: The top-level container. All your lists live inside a workspace.
- **List**: A table in Clay (think “sheet”). Create lists via the global "Add new" → "List" button.
- **Steps (Pipeline/Canvas)**: Inside a list, you add steps (Formula, Filter, Deduplicate, Join, Enrich, Send to Airtable). Use the "+ Add step" button in the pipeline/canvas.
- **Integrations**: Workspace-level. Not inside a list. Look for "Integrations" in the main navigation or workspace/settings menu. Connect Airtable here once; then steps can use that connection.
- **Save to List**: Some steps let you "Save output to a new list". That’s how you create a separate list from a pipeline result (e.g., unique companies).

Tip: If you created `Raw Leads` via the global "Add new" button, that is correct.

## 3. One-Time Setup in Clay (5-10 minutes)

If this is your first time running this process, you'll need to set up the necessary components in Clay.

1.  **Create Workspace (if needed):**
    - Click your workspace switcher (usually top-left) → "Create workspace" → Name: `UYSP — Refactor v2`.
2.  **Create Lists (totally separate lists in the same workspace):**
    - Global top bar: click **"Add new"** → **"List"** → Name it **`Raw Leads`**.
      - Columns: `email`, `first_name`, `last_name`, `phone`, `company`. You can auto-create by importing a CSV in Step 1.
    - Create another list (repeat Add new → List) named **`Companies to Enrich`**.
      - Columns: `company_domain` (set as unique/identifier if available), plus `company_name`, `industry`, `company_desc`.
      - This list is not “linked” automatically. You will populate it via a pipeline step from `Raw Leads` (see Step 3).
3.  **Connect Airtable (workspace-level, not inside a list):**
    - In the main navigation or workspace menu, click **"Integrations"** → choose **"Airtable"** → click **"Connect"** → paste your Personal Access Token (PAT) → Save.
    - If you don’t see Integrations in the sidebar, look for a gear/settings icon or your workspace dropdown; Integrations is a top-level workspace feature.

## 4. The Enrichment Process (Step-by-Step)

### Step 1: Load Your Lead List into Clay
- In your `Raw Leads` list, click "Import" and upload your lead CSV.
- Map the columns from your CSV to the columns in the `Raw Leads` list.
  - If the list didn't exist: during import, choose "Create new list" and name it `Raw Leads`.

### Step 2: Normalize Company Domain & Filter Personal Emails
1.  **Add a "Formula" Step:** In your `Raw Leads` list, add a new step and choose "Formula."
2.  **Create `company_domain`:** Create a new column named `company_domain`. Use a formula to extract the domain from the email. Examples:
    - `SPLIT(email, "@")[1].toLowerCase()` (Clay's array-style split)
    - or `LOWER(SPLIT(email, '@', 1))` (alternate syntax)
    - If `email` is missing or malformed, skip the row for company enrichment.
3.  **Filter Personal Emails:** Add a "Filter" step. Keep rows where `company_domain` is NOT in this list:
    - `gmail.com`, `yahoo.com`, `hotmail.com`, `outlook.com`, `icloud.com`, `aol.com`, `proton.me`, `protonmail.com`, `msn.com`, `live.com`, `me.com`, `mac.com`, `yandex.com`, `gmx.com`, `zoho.com`, `mail.com`, `fastmail.com`, `pm.me`

#### Option B (recommended): Single step using Clay’s built-in action
Use Clay’s action shown in your screenshot to both extract the domain and classify work vs personal.

1.  In `Raw Leads`, click **"+ Add step"**.
2.  In the step picker, search for and select:
    - **"Identify Email Type and Extract Company Domain from Email"** (provider: Clay; envelope icon)
3.  In the panel that opens:
    - Under **"Column Mapping" → "Setup inputs"**, set **Email or Domain** = your `email` column.
    - Under **"Run settings"**, keep **Auto‑update** ON.
    - Leave **"Only run if"** blank for now.
4.  Click **Run**. Confirm the step creates output columns including:
    - `Company Domain` (extracted)
    - A field indicating work vs personal (e.g., an "Email Type" or similar indicator; Clay labels this in the output section)
5.  Add a filter step to keep only work emails:
    - Click **"+ Add step"** → **Filter rows / Keep rows**
    - Condition: the work/personal output equals "work" (or, if the output is a boolean like `is_personal`, set it to `false`; if `is_work`, set it to `true`). Use the exact output column name shown by Clay.
6.  Proceed to Step 3 (Deduplicate) using the `Company Domain` output column from this action.

### Step 3: Create the Unique "Companies to Enrich" List
1.  Inside the `Raw Leads` list, click **"+ Add step"** → choose **"Deduplicate"** (or **"Find Unique Values"**).
2.  **Configure**: Set the key/column to `company_domain`.
3.  **Save output to a list**: In the step’s output options, choose **"Save to list"** → pick existing **`Companies to Enrich`** (or select "Create new" and name it).
   - Result: `Companies to Enrich` now contains one row per unique company domain.

### Step 4: Enrich the Unique Companies
1.  Open the **`Companies to Enrich`** list (it has the unique domains).
2.  Click **"+ Add step"** → choose **"Enrich Company from Domain"** (provider: **Apollo**).
3.  **Inputs**: Set Domain = `company_domain`.
4.  **Run** the step. New columns appear (e.g., `industry`, `company_desc`, optionally `employee_count`).

### Step 5: Join Enriched Data Back to All Leads
1.  Go back to **`Raw Leads`** → click **"+ Add step"** → choose **"Join"**.
2.  **Left side**: `Raw Leads` (current list). **Right side**: pick list **`Companies to Enrich`**.
3.  **Keys**: `Raw Leads.company_domain` = `Companies to Enrich.company_domain`.
4.  **Select columns to bring over**: `industry`, `company_desc` (and any others you need).

### Step 5.1: Person Enrichment (All Leads)
1.  **Add Enrichment Step:** In your `Raw Leads` list (after the company join), add an enrichment step using your people provider (Apollo People) with `email` as the input.
2.  **Select Outputs:** Choose `title` (job title), `linkedin_url` (optional), and `location` (country or city/state if available).
3.  **Result Columns:** Ensure new columns are added for these outputs, e.g., `title`, `linkedin_url`, `location_country` (or `location`).

### Step 6: Write Everything Back to Airtable
1.  **Add a "Send to Airtable" Step:** After the "Join" step, add a final step to send the data back to Airtable.
2.  **Configure the Writeback:**
    -   **Base:** `UYSP Lead Qualification (Option C)`
    -   **Table:** `Leads`
    -   **Match on Field:** `Email` (This is critical - it ensures you're updating the correct records).
    -   **Map Fields:**
        -   Map the `company_domain` column from Clay to the `Company Domain` field in Airtable.
        -   Map the `industry` column from Clay to the `Company Industry` field in Airtable.
        -   Map the `company_desc` column from Clay to the `Company Description` field in Airtable.
        -   Map the person `title` to the `Job Title` field in Airtable.
        -   Map the person `location_country` (or `location`) to the `Location Country` field in Airtable.
        -   If your base includes `linkedin_url`, map it from the person enrichment output.
        -   Set the `Enrichment Provider Used` field in Airtable to the static text "Apollo".
        -   Set the `Enrichment Timestamp` field in Airtable to the current time.
3.  **Run the Writeback:** Execute this final step. Clay will now update all the lead records in Airtable with the enriched company data.

### Step 6.1: Mirror Companies into Airtable `Companies` Table (Recommended)
1.  **Add a second "Send to Airtable" Step:** Use the unique companies dataset (the output of your deduplicate step or the enrichment step).
2.  **Configure the Upsert:**
    -   **Base:** `UYSP Lead Qualification (Option C)`
    -   **Table:** `Companies`
    -   **Match on Field:** `Domain` (primary field)
    -   **Map Fields:**
        -   `company_domain` → `Domain`
        -   `company_name` → `Company Name`
        -   `industry` → `Industry`
        -   `company_desc` → `Company Description`
        -   `employee_count` → `Employee Count` (if available)
        -   Provider (static or from step) → `Enrichment Provider`
        -   `now()` → `Last Enriched` and/or `Enrichment Timestamp`
3.  **Why this matters:** This creates a persistent cache keyed by `Domain` so future leads with the same domain can be joined instantly without a new org API call.

## 6. Validation Checklists

### Pre‑Flight (before running)
- **Airtable**: Base `UYSP Lead Qualification (Option C)` accessible; `Leads` and `Companies` tables exist with fields:
  - Leads: `Email` (match key), `Company Domain`, `Company Industry`, `Company Description`, `Job Title`, `Location Country`, `Enrichment Provider Used`, `Enrichment Timestamp`
  - Companies: `Domain` (match key), `Company Name`, `Industry`, `Company Description`, `Employee Count`, `Enrichment Provider`, `Last Enriched` or `Enrichment Timestamp`
- **Clay**: Lists created (`Raw Leads`, `Companies to Enrich`), formula step for `company_domain` added, personal-domain filter configured with the list above.
- **Safety**: Spot-check 10 records—verify `company_domain` values look correct and personal emails are filtered out.

### Post‑Run (after writeback)
- **Leads updated**: Pick 5 random leads—verify `Company Domain`, `Company Industry`, `Company Description`, person `Job Title` and `Location Country` populated, `Enrichment Provider Used` and `Enrichment Timestamp` set.
- **Companies upserted**: Row count roughly equals the number of unique domains; spot-check 3 domains with multiple leads to confirm the join populated all.
- **No duplicates**: Airtable `Leads` shows updates only (no unintended new records).
- **Retry behavior**: Re-run on the same batch—confirm no duplicate enrich calls for existing domains; only new domains are enriched.

## 5. Troubleshooting
- **No Updates in Airtable:** Double-check that the `Email` in your Clay list exactly matches the `Email` in your Airtable records.
- **Apollo Enrichment Fails:** Ensure your company domains are clean and valid. Some domains may not be found by Apollo; this is expected.
- **Rate Limits:** If you are processing a very large list (10k+), Clay may process it in smaller batches automatically. This is normal.

