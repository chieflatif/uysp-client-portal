# UI Remediation & Cleanup Plan (Staging)

**TO:** Claude Code Agent
**FROM:** VibeOS (Project Coordinator)
**DATE:** 2025-11-09
**CONFIDENCE:** 95%
**STATUS:** Action Required

---

### 1. Project Orientation & CRITICAL Branching Protocol

Welcome. You are assigned to the **UYSP Lead Qualification Portal**. Your entire focus will be on the front-end repository.

-   **Project Directory:** `/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal`
-   **Staging Environment:** [https://uysp-portal-staging.onrender.com](https://uysp-portal-staging.onrender.com)

**CRITICAL: Your First Action - Branching**
The `main` branch reflects the code currently on our `staging` server. It contains new features but also several UI bugs. **You must not commit any changes directly to `main`.**

1.  **Sync with `main`:**
    ```bash
    git checkout main
    git pull origin main
    ```
2.  **Create Your Work Branch:**
    ```bash
    git checkout -b feature/ui-remediation-fixes
    ```
All work for this plan must be done exclusively on the `feature/ui-remediation-fixes` branch. This is non-negotiable and protects the integrity of `main`.

### 2. Your Mission: Post-Deployment UI Cleanup

We recently deployed a major new feature, **Bulk Lead Import**, to the staging environment. While the backend n8n workflow (`A8L1TbEsqHY6d4dH`) is now stable and functional, extensive QA testing has revealed several critical UI bugs and usability issues.

Your mission is to resolve all issues listed in this document to bring the staging UI to a production-ready state.

### 3. Critical Task List

#### TASK 1: Fix Campaign Visibility & Empty State Bug
-   **Problem:** The Campaign Management page shows "No campaigns found" even when statistics cards correctly show 18 total campaigns. New campaigns created via bulk import (e.g., n8n execution `29655`) are not appearing in the list.
-   **Suspected Cause:** The API call to `/api/admin/campaigns` might be scoped incorrectly (e.g., only fetching `status: 'Active'`), or the frontend `CampaignList.tsx` component is failing to render the received data array. There might also be a client-side caching issue with React Query.
-   **Required Fix:**
    1.  Trace the data flow from the `/api/admin/campaigns` endpoint to the `CampaignList.tsx` component.
    2.  Ensure the API returns all campaigns by default, regardless of status.
    3.  Verify the component correctly receives and maps the campaign data array.
    4.  Implement a mechanism to automatically re-fetch campaign data after a bulk import is successfully completed.

#### TASK 2: Overhaul Campaign Filters & Implement Search
-   **Problem:** The current filter chips (`Standard`, `Custom`) are obsolete and do not match the creation buttons (`New Lead Form Campaign`, `New Nurture Campaign`). There is also no search functionality.
-   **Suspected Cause:** The UI and data model are out of sync.
-   **Required Fix:**
    1.  **Update Filter Chips:** Replace the "Type" filter chips with: `Lead Form`, `Webinar`, `Nurture`. Ensure these values map directly to the `type` field in the `campaigns` database table.
    2.  **Implement Search:** Add a search input field above the campaigns table. This should be the same component used on the `/admin/leads` page. The search must query the backend API (e.g., `/api/admin/campaigns?query=...`) and perform a server-side search across `campaignName`, `formId`, and `leadSource` fields.

#### TASK 3: Fix Limited-Scope Lead Search
-   **Problem:** On the `/admin/leads` page, the search bar only filters the currently visible page of leads, not the entire dataset. A search for "Tenenbaum" fails even though the lead exists in the database.
-   **Suspected Cause:** The search is being performed client-side on a paginated data set.
-   **Required Fix:**
    1.  Modify the lead search component to trigger a new API call with the search term as a query parameter (e.g., `/api/admin/leads?query=Tenenbaum`).
    2.  Update the backend API at `/api/admin/leads` to handle the `query` parameter and perform a server-side, full-text search.
    3.  Wire this functionality into the existing React Query hook for fetching leads.

#### TASK 4: Remediate Cluttered Top Navigation
-   **Problem:** The top-level navigation bar is cluttered. A previous request to simplify this was not fully implemented.
-   **Suspected Cause:** The `Navigation.tsx` component contains legacy or poorly organized links.
-   **Required Fix:**
    1.  Review the existing navigation structure in `src/components/Navigation.tsx`.
    2.  Simplify the links to the following primary items: `Dashboard`, `Leads`, `Campaigns`, `Analytics`, `User Activity`, `Sync`.
    3.  Group any secondary or administrative links (like Project Management, Users) into a settings dropdown or a less prominent location. Ensure the UI is clean and intuitive.

#### TASK 5: Improve "Import Leads" Button Placement
-   **Problem:** The "Import Leads" button is positioned too close to the lead search bar, causing visual confusion.
-   **Suspected Cause:** Poor layout styling.
-   **Required Fix:**
    1.  Relocate the "Import Leads" button. The ideal position is to the right of the main page title/metric cards, aligned with the primary action buttons on the campaigns page.
    2.  Ensure there is adequate spacing and a clear visual distinction between the search input and the import button.

### 4. Development Protocol
-   **Atomic Commits:** Create a separate, clean commit for each of the five tasks listed above. Use clear commit messages (e.g., `fix(campaigns): overhaul filters and implement server-side search`).
-   **Proof of Work:** For each fix, provide a screenshot or GIF demonstrating the corrected functionality in the staging environment.
-   **Code Quality:** Adhere to all existing linting rules and project conventions. Ensure all new code is strongly typed.

### 5. NON-NEGOTIABLE Development Methodology

Before writing any code, you must adhere to the following phased protocol. This is the core of our development practice and ensures quality, stability, and maintainability.

**Phase 1: Strategic Investigation (Code is Read-Only)**
You do not have permission to edit code until you have completed this phase for each task.
1.  **Map the System:** Before changing anything, use `grep` and `read_file` to trace the entire data flow for the feature you are fixing. Identify all components, API endpoints, hooks, and state management involved.
2.  **Isolate the Root Cause:** Based on your investigation, state the precise root cause of the bug. For Task 1 (Campaign Visibility), you must identify exactly why the campaign list is empty.
3.  **Propose a Solution:** Briefly outline your proposed code changes.

**Phase 2: Test-Driven Development (TDD)**
This is a mandatory practice for all code changes.
1.  **Write a Failing Test First:** For each bug, you must first write a test that specifically replicates the bug and fails. For the lead search bug (Task 3), write a test that searches for "Tenenbaum" and asserts that the test fails.
2.  **Implement the Fix:** Write the minimal amount of code required to make the failing test pass.
3.  **Refactor:** Clean up your code while ensuring all tests continue to pass.

**Phase 3: Forensic Audit**
Upon completion of all tasks in this sprint, your work will be subjected to a rigorous forensic audit to ensure all protocols were followed and the code is production-grade.

Execute this plan. Begin with **Phase 1: Strategic Investigation** for Task 1.

HONESTY CHECK: 100% evidence-based. Assumptions: The new agent has access to the codebase and staging environment. Confidence: 95%.
