# SOP: Integration - Clay.com

## 1. Executive Summary

- **Purpose**: Clay.com is the primary data enrichment and company deduplication engine for the UYSP lead qualification system. It takes raw lead data (first name, last name, email) and transforms it into a fully enriched profile, providing the essential components needed for ICP scoring in Airtable.
- **Scope**: This SOP covers the end-to-end process of how a lead is processed by Clay, what data it provides, and how to monitor its performance.
- **Owner**: System Architect

## 2. System Map

```mermaid
graph TD
    A[Airtable: Leads Table<br/>(View: Clay Queue)] --> B(Clay.com: Monitored Table);
    B --> C{1. Find or Enrich Company};
    C --> D(Airtable: Companies Table);
    B --> E{2. Enrich Person};
    E --> F{3. Assemble Scoring Components};
    F --> G(Airtable: Leads Table);
```

## 3. The Clay Enrichment Waterfall (Step-by-Step)

The entire process is designed as a "waterfall" — a series of sequential enrichment steps. A lead must pass through each step. This process is semi-automated; Clay ingests new leads automatically but typically requires a user to click **"Run all"** within the Clay table to process the queue.

### **Step 1: Ingestion from Airtable**

- **What's Happening**: Clay is configured to constantly monitor the `[Leads] Clay Queue` view in the Airtable `Leads` table. Any lead appearing in this view is automatically pulled into the Clay "⚡️ Enrich your data from Airtable" table.
- **Key Fields**: Clay initially only pulls the `First Name`, `Last Name`, and `Email`.

### **Step 2: Company Deduplication & Enrichment**

- **What's Happening**: This is the first and most critical enrichment step. Clay uses the lead's email domain to identify the company.
- **Logic**:
    1.  Clay takes the domain (e.g., from `john.doe@acme.com`, it gets `acme.com`).
    2.  It then runs a "Find Record" action against our Airtable `Companies` table, searching for a record with a matching `Domain`.
    3.  **If a match is found**: Clay links the incoming lead to the existing company record. No new company data is needed.
    4.  **If no match is found**: Clay triggers a "waterfall" of company enrichment providers (e.g., Apollo, Clearbit) to find the company's official name, description, industry, etc. It then **creates a new record** in our `Companies` table and links the lead to it.
- **Outcome**: Every lead is guaranteed to be associated with a single, deduplicated company record.

### **Step 3: Person Enrichment**

- **What's Happening**: Once the company is identified, Clay focuses on enriching the individual lead.
- **Logic**: It uses the person's name and company to find their LinkedIn profile, verified job title, and location (country). This is also a waterfall, trying multiple data sources if the first one fails.

### **Step 4: Data Assembly & Scoring Components**

- **What's Happening**: This is where Clay prepares the data for our ICP score. **Crucially, Clay does not calculate the final score.** It provides the *raw ingredients* for the score.
- **Logic**:
    - **Role Score**: Clay uses a GPT-4 integration to analyze the lead's `Job Title` and classify their seniority (e.g., "Decision Maker", "Influencer", "Practitioner"). This classification is written to a field.
    - **Company Score**: Clay uses another GPT-4 integration to analyze the `Company Description` and `Industry` to classify the company type (e.g., "B2B SaaS").
    - **Location**: The `Location Country` is passed through directly.
- **Outcome**: Clay assembles the three key components of our ICP score: Role, Company Type, and Location.

### **Step 5: Write Back to Airtable**

- **What's Happening**: Once all enrichment and assembly steps are complete, Clay writes the data back to the original lead record and the associated company record in Airtable.
- **Key Fields Written**:
    - **To `Leads` Table**: `Job Title`, `Linkedin URL - Person`, `Location Country`, `Role Score Component`, `Company Score Component`.
    - **To `Companies` Table** (if new): `Company Name`, `Industry`, `Company Description`, etc.

## 4. Maintenance & Troubleshooting

- **Symptom**: Leads are in the `Clay Queue` in Airtable but not showing up in Clay.
    - **Likely Cause**: The link between the Airtable view and the Clay table is broken or paused.
    - **Solution**: In Clay, click the source settings for the table and refresh the connection to Airtable. Ensure it's pointing to the correct Base, Table, and View.
- **Symptom**: Enrichment is failing for many leads.
    - **Likely Cause**: One of the enrichment provider integrations (e.g., Apollo) may have an issue with its API key, or you may have run out of credits.
    - **Solution**: Open the Clay table and look at the `Run History`. Find a failed run and click on it. Clay will show you exactly which column (which enrichment step) failed and provide an error message. This is the most effective way to diagnose issues.
- **Symptom**: The ICP Score in Airtable is not updating even though Clay has run.
    - **Likely Cause**: This is an issue in **Airtable**, not Clay. Clay's job is only to provide the components. If the components are present on the lead record but the score is wrong, the `ICP Score` formula field in the Airtable `Leads` table needs to be checked.

## 5. Related SOPs & System Documents

- **SOPs**: `SOP-Airtable-Leads-Table.md`, `SOP-Airtable-Companies-Table.md`
- **Architecture**: `docs/architecture/AIRTABLE-SCHEMA.md`
