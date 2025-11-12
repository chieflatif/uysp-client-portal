# MANDATORY DEVELOPMENT WORKFLOW: The Bi-Directional Reconciliation Engine

**DOCUMENT STATUS: AUTHORITATIVE & FINAL**
**VERSION: 1.0**
**DATE: 2025-11-12**

---

## 1. Executive Mandate & Objective

**Primary Objective:** To fix the core data synchronization architecture of the UYSP Client Portal.

The current system suffers from a critical, foundational flaw: data between our PostgreSQL database and our Airtable source of truth is not reliably synchronized. This has resulted in a cascade of UI bugs, data integrity failures, and a complete loss of trust in the data presented to the user.

Your mission is to build the **Bi-Directional Reconciliation Engine**. This is a non-negotiable architectural upgrade that will replace the current fragmented and broken system with a unified, reliable, and self-healing data foundation.

**This is not a UI fix. This is a deep, back-end architectural overhaul. Do not proceed to UI fixes until this foundation is built, tested, and verified.**

---

## 2. Forensic Evidence & Architectural Justification

Your work must be informed by the extensive forensic audits that have been conducted. These audits provide the evidence and justification for this architectural pivot.

### Forensic Finding #1: The "Manual Sync" is a Destructive Reset

The button labeled "Manual Sync" in the UI triggers a brute-force "Great Sync" script (`full-airtable-sync-ENHANCED.ts`). This is a one-way, wipe-and-replace operation intended for disaster recovery, not routine updates. It is inefficient, slow, and the wrong tool for the job.

### Forensic Finding #2: n8n Workflows Have a Critical Gap

The n8n SMS schedulers **only update the parent `campaigns` table** in PostgreSQL. They **do not** update the individual `leads` table with critical status changes (`sms_sent_count`, `processing_status`, etc.). This is the primary reason the portal's data is perpetually stale.

### Forensic Finding #3: Bi-Directional Sync is Fragmented and Incomplete

-   **"Remove from Campaign"**: Correctly updates Airtable, but **fails** to update the local PostgreSQL record.
-   **"Claim Lead"**: Correctly updates PostgreSQL, but **fails** to update Airtable.
-   **"Notes" & Other Metadata**: Are trapped in PostgreSQL and never sync back to Airtable.

**Conclusion:** The current architecture is not viable. The evidence mandates the creation of a centralized, bi-directional reconciliation engine.

---

## 3. The New Architecture: Detailed Blueprint

You will build the system according to the following non-negotiable architectural blueprint.

### Guiding Principles
1.  **Airtable is SSOT:** In any data conflict, Airtable wins.
2.  **The Reconciler is the Guarantor:** It is the ultimate authority on data consistency.
3.  **Synchronization is Asynchronous:** All sync operations must happen in the background.
4.  **Operations are Idempotent:** Scripts must be safely re-runnable.

### System Components
-   **The Reconciler (`scripts/reconcile-recent-changes.ts`):** A new script that runs in two stages every 15 minutes to sync data in both directions.
-   **The Scheduler (Render Cron Job):** A cron job that triggers the Reconciler.
-   **API Endpoint Modifications:** Surgical changes to existing APIs to support the new sync model.
-   **Manual Sync Button:** Re-wired to safely trigger the new, lightweight Reconciler.

---

## 4. Phased Implementation Plan

You are to execute the following plan in sequence. Do not deviate.

### Phase 1: Foundation - Build the Reconciler Script

1.  **Add `updatedAt` to Schema:**
    -   Add `updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()` to the `leads` table in `src/lib/db/schema.ts`.
    -   Generate and apply the corresponding database migration.
2.  **Create the Reconciler Script (`scripts/reconcile-recent-changes.ts`):**
    -   This script will contain the core logic.
3.  **Implement Stage 1 (Airtable ► PostgreSQL):**
    -   Query Airtable for `Leads` with a `lastModifiedTime` in the last 20 minutes.
    -   Perform an "upsert" operation into the PostgreSQL `leads` table based on the `airtableRecordId`.
4.  **Implement Stage 2 (PostgreSQL ► Airtable):**
    -   Query PostgreSQL for `Leads` with an `updatedAt` timestamp in the last 20 minutes.
    -   Batch update the corresponding records in Airtable, syncing fields like `claimedBy`, `claimedAt`, and `notes`.
    -   **Critical:** Use intelligent timestamp comparison to prevent infinite sync loops.

### Phase 2: API & UI Integration

1.  **Modify API Endpoints:**
    -   Update the API routes for "Remove from Campaign", "Claim Lead", and "Unclaim Lead".
    -   Ensure that in addition to their current logic, they **update the `updatedAt` timestamp** on the relevant PostgreSQL `leads` record.
2.  **Implement "Notes" Sync:**
    -   Create a new API endpoint for adding notes.
    -   This endpoint must write to the `leadActivityLog`, append to a `notes` field on the `leads` table, and touch the `updatedAt` timestamp.
3.  **Re-wire the Manual Sync Button:**
    -   Create a new API endpoint (`/api/admin/sync/delta`) that triggers an on-demand run of the `reconcile-recent-changes.ts` script.
    -   Update the UI to call this new endpoint.

### Phase 3: Deployment & Activation

1.  **Code Deployment:** Deploy all changes from Phases 1 & 2.
2.  **Final "Great Sync":** Manually execute the `full-airtable-sync-ENHANCED.ts` script **one last time** to establish a clean baseline.
3.  **Activate Cron Job:** Configure a Render Cron Job to execute `npm run tsx scripts/reconcile-recent-changes.ts` every 15 minutes.

