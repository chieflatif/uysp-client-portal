# SOP: UYSP Backlog Ingestion Workflow

## 1. Executive Summary
- **Workflow Name**: `UYSP Backlog Ingestion`
- **ID**: `qMXmmw4NUCh1qu8r`
- **Purpose**: To provide a robust and intelligent method for bulk-importing leads from a CSV file (hosted on a public URL like a Google Sheet). This workflow is the primary entry point for large lead lists. It handles initial data cleaning, normalization, and the first critical layer of HRQ (Human Review Queue) routing to filter out invalid or low-quality leads before they incur any enrichment costs.
- **Trigger**: This is a **manually triggered** workflow. It does not run on a schedule.

---

## 2. System Map

```mermaid
graph TD
    A[Public CSV URL<br/>(e.g., Google Sheet)] --> B[Fetch CSV]
    B --> C[Parse CSV]
    C --> D[Normalize & Route]
    D --> E[Airtable Upsert Leads]
    E --> F[Airtable Leads Table]
```

---

## 3. Detailed Breakdown & Business Logic

### **Node: Fetch CSV**
- **Action**: Performs an HTTP GET request to a specified URL to download the raw CSV data.
- **Business Logic**: The URL must be a direct link to a CSV file. For Google Sheets, this requires converting the standard share link into a direct export link.

### **Node: Parse CSV**
- **Action**: Takes the raw text data from the previous step and intelligently parses it into structured JSON objects, one for each lead.
- **Business Logic**: This node is designed to be flexible. It normalizes common header variations (e.g., "email", "Email Address", "e-mail" all become "email") and correctly splits full names into first and last names if necessary.

### **Node: Normalize**
- **Action**: This is the core intelligence of the ingestion process. It applies a series of business rules to each individual lead.
- **Business Logic**:
    1.  **Email & Phone Sanitization**: Cleans and standardizes email addresses (lowercase, trimmed whitespace) and phone numbers (converts to E.164 format, e.g., +15551234567).
    2.  **Personal/Invalid Email → Archive**:
        - If the domain is personal (gmail.com, yahoo.com, etc.) → set `HRQ Status` = "Archive", `Processing Status` = "Complete".
        - If the email format is invalid → set `HRQ Status` = "Archive", `Processing Status` = "Complete".
    3.  **Invalid Phone → Archive**:
        - If the normalized 10-digit phone fails validation (wrong length or repeated digits like 1111111111) → set `HRQ Status` = "Archive", `Processing Status` = "Complete".
    4.  **Default for Valid Leads → Clay**:
        - For all other valid leads, set `HRQ Status` = "None" and `Processing Status` = "Queued" so Clay can pick them up from the Clay Queue.

### **Node: Airtable Upsert Leads**
- **Action**: Takes the normalized and routed lead data and upserts it into the Airtable `Leads` table.
- **Business Logic**:
    - **"Upsert"** means it will update a record if one with the same email address already exists, or it will create a new one if it doesn't. This is critical for preventing duplicates.
    - It maps the normalized data to the correct fields in Airtable and sets default values for scoring and tracking fields to zero.

---

## 4. Maintenance & Troubleshooting
- **If Import Fails**:
    1.  The most common failure point is the `Fetch CSV` node. Double-check that the Google Sheet URL is correct and that its sharing permissions are set to "Anyone with the link can view". Test the URL in an incognito browser tab to confirm.
    2.  Check the `Parse CSV` node. If the CSV has unusual column headers that the normalizer doesn't recognize, it may fail to map the data correctly.
- **If Leads are Incorrectly Routed**: The logic for this is entirely within the `Normalize` node. Review the `personalDomains` list, the email/phone validators, or the default state rules in that node's code.

