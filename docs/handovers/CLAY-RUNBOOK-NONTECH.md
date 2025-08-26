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

## 3. One-Time Setup in Clay (5-10 minutes)

If this is your first time running this process, you'll need to set up the necessary components in Clay.

1.  **Create Workspace:** If it doesn't exist, create a new workspace named `UYSP — Refactor v2`.
2.  **Create Lists (Tables):**
    -   Go to the "Data" tab and create a new list named **`Raw Leads`**. It should have columns for `email`, `first_name`, `last_name`, `phone`, and `company`.
    -   Create another list named **`Companies to Enrich`**. It needs a column for `company_domain` (this should be the "unique" field). Add columns for `company_name`, `industry`, and `company_desc`.
3.  **Connect Airtable:**
    -   Go to "Integrations," select "Airtable," and connect your account using your Personal Access Token (PAT).

## 4. The Enrichment Process (Step-by-Step)

### Step 1: Load Your Lead List into Clay
- In your `Raw Leads` list, click "Import" and upload your lead CSV.
- Map the columns from your CSV to the columns in the `Raw Leads` list.

### Step 2: Normalize Company Domain & Filter Personal Emails
1.  **Add a "Formula" Step:** In your `Raw Leads` list, add a new step and choose "Formula."
2.  **Create `company_domain`:** Create a new column named `company_domain`. Use a formula to extract the domain from the email (e.g., `LOWER(SPLIT(email, '@', 1))`).
3.  **Filter Personal Emails:** Add a "Filter" step. Set it to **keep** rows where the `company_domain` is **not** in a list of personal domains (e.g., `gmail.com`, `yahoo.com`, `hotmail.com`, etc.).

### Step 3: Create the Unique "Companies to Enrich" List
1.  **Add a "Deduplicate" Step:** After the filter, add a "Deduplicate" (or "Find Unique Values") step.
2.  **Select Column:** Choose the `company_domain` column to find the unique values.
3.  **Save to List:** Save the output of this step to your **`Companies to Enrich`** list. This list now contains a clean, unique list of every company domain that needs to be enriched.

### Step 4: Enrich the Unique Companies
1.  **Open the `Companies to Enrich` List.**
2.  **Add Enrichment Step:** Add a new step and select **"Enrich Company from Domain"** using **Apollo**.
3.  **Map Inputs:** Map the `company_domain` column from your list to the "Domain" input of the Apollo enrichment.
4.  **Run the Enrichment:** Run this step. Apollo will now look up each unique company and return data like their industry and description. The results will be added as new columns to your `Companies to Enrich` list.

### Step 5: Join Enriched Data Back to All Leads
1.  **Return to your `Raw Leads` List.**
2.  **Add a "Join" Step:** Add a new step and choose "Join."
3.  **Configure the Join:**
    -   **Join `Raw Leads`...**
    -   **with `Companies to Enrich`...**
    -   **where `Raw Leads`.`company_domain` equals `Companies to Enrich`.`company_domain`**.
4.  **Select Columns to Add:** Choose to bring over the `industry` and `company_desc` columns from the `Companies to Enrich` list.

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
        -   Set the `Enrichment Provider Used` field in Airtable to the static text "Apollo".
        -   Set the `Enrichment Timestamp` field in Airtable to the current time.
3.  **Run the Writeback:** Execute this final step. Clay will now update all the lead records in Airtable with the enriched company data.

## 5. Troubleshooting
- **No Updates in Airtable:** Double-check that the `Email` in your Clay list exactly matches the `Email` in your Airtable records.
- **Apollo Enrichment Fails:** Ensure your company domains are clean and valid. Some domains may not be found by Apollo; this is expected.
- **Rate Limits:** If you are processing a very large list (10k+), Clay may process it in smaller batches automatically. This is normal.

