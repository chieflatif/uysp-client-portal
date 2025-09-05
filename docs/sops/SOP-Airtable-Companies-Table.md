# SOP: Airtable Table - Companies

## 1. Executive Summary

- **Purpose**: The `Companies` table serves as the central repository for all organizational data. It prevents duplicate company entries by using the company domain as a unique key. This table is enriched by Clay.com and provides a scoring component that contributes to the final ICP (Ideal Customer Profile) Score calculated in the `Leads` table.
- **Scope**: This SOP covers the structure, fields, and primary function of the `Companies` table.
- **Owner**: System Architect

## 2. How it Works

The `Companies` table is primarily populated and updated through two main processes:

1.  **Clay.com Enrichment**: When new leads are ingested, the `UYSP Backlog Ingestion` workflow normalizes the data. Clay.com then pulls leads from the `[Leads] Clay Queue` view, extracts the company domain, and searches the `Companies` table for an existing entry.
    - If a matching domain exists, Clay links the new lead to the existing company record.
    - If no match is found, Clay enriches the company data (name, industry, description, etc.) and creates a new record in the `Companies` table before linking the lead.
2.  **Lead Association**: The `Leads` field is a lookup field that shows all associated leads from the `Leads` table, providing a quick reference to all contacts at a given company.

The `Company Score Component` is a critical output from Clay, representing how well the company itself fits our ICP based on factors like industry and size. This score is then used in the `Leads` table to calculate the overall lead `ICP Score`.

## 3. Field Dictionary

| Field Name              | Type           | Description                                                                                                                              |
| ----------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Domain**              | `singleLineText` | **Primary Key.** The unique company domain (e.g., `google.com`). Used for deduplication.                                                 |
| **Company Name**        | `singleLineText` | The official name of the company.                                                                                                        |
| **Industry**            | `singleSelect` | The primary industry of the company, as determined by the enrichment provider.                                                           |
| **Company Type**        | `singleSelect` | A classification of the company's business model (e.g., `B2B SaaS`, `B2B Tech Services`).                                                  |
| **Company Description** | `multilineText` | A brief description of the company's business.                                                                                          |
| **Company Score Component** | `number`       | A score (0-100) assigned by Clay.com based on how well the company profile matches our ICP criteria.                                   |
| **Last Enriched**       | `date`         | The timestamp of the last successful enrichment for this company record.                                                                 |
| **Enrichment Provider** | `singleSelect` | The data provider used for the latest enrichment (e.g., `Apollo`, `Clearbit`).                                                           |
| **Enrichment Cost**     | `currency`     | The cost associated with enriching the company data.                                                                                     |
| **Leads**               | `link`         | A linked record field showing all leads associated with this company from the `Leads` table.                                             |

## 4. Maintenance & Troubleshooting

- **Duplicate Companies**: If duplicate companies appear, it is almost always due to a variation in the `Domain` field (e.g., `acme.com` vs. `acme.io`). To fix, merge the records in Airtable and ensure all associated leads are linked to the correct primary company record.
- **Missing Company Score**: If the `Company Score Component` is missing, it indicates a failure in the Clay.com enrichment process. Check the run history in Clay for the corresponding lead to identify the error. The lead may need to be manually re-run through the Clay table.

## 5. Related SOPs & System Documents

- **SOPs**:
    - `SOP-Integration-Clay.md`
    - `SOP-Airtable-Leads-Table.md`
- **Architecture**:
    - `docs/architecture/AIRTABLE-SCHEMA.md`
