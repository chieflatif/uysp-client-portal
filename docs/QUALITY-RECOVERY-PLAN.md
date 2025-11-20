# UYSP Client Portal – Zero-Debt Recovery Plan

_Last updated: 2025-11-19_

This document tracks the exact steps required to eradicate the current quality debt in `uysp-client-portal`. Every agent must update this file as progress is made.

---

## 1. Safety & Scope

- **Repository:** `/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal`
- **Do not touch** the workspace root (backend automations) unless explicitly instructed.
- **Databases:**
  - Render PostgreSQL (prod + staging) – **never** touched during tests.
  - Docker harness (`docker-compose.test.yml`) – disposable Postgres used by integration suites.
- **Backups:** tag current state (`git tag audit-2025-11-19`) before major refactors.

## 2. Mandatory Quality Gates

| Gate | Command | Notes |
| --- | --- | --- |
| Lint | `npm run lint` | Uses ESLint; fails on warnings. |
| Unit/Script tests | `npm run test` | No Docker needed. |
| Integration tests | `./scripts/dev/test-db-up.sh && ./scripts/dev/test-db-reset.sh && npm run test:integration && ./scripts/dev/test-db-down.sh` | Requires Docker Desktop running. |
| Build | `npm run build` | Ensure `.env.test` seeds dummy OpenAI keys to avoid CRITICAL build warnings. |

Run all four gates after each major change; logs must be stored in `artifacts/`.

## 3. Workstream Breakdown

### 3.1 Activity Timeline Fix (Issue #2)
1. Verify `lead_activity_log` data for affected leads (e.g., Chris Sullivan) via SQL (needs `DATABASE_URL`).
2. Patch:
   - `src/app/api/admin/activity-logs/route.ts` – allow CLIENT_USER role, enforce client scoping.
   - `src/app/api/admin/activity-logs/counts/route.ts` – mirror access control.
   - `src/components/activity/LeadTimeline.tsx` – wrap fetch function in `useCallback`, update dependencies, sanitize metadata typing.
3. Add targeted tests (mock fetch) to guarantee timeline renders SMS events.
4. Deploy branch `feature/data-integrity-restoration` to staging; capture screenshots of Chris Sullivan showing SMS timeline.

### 3.2 Integration Fixtures & Schema Alignment
1. Extend `tests/helpers/factories.ts` to cover clients, campaigns, users, leads (UUID-safe, required fields filled).
2. Replace all manual inserts in tests (activity API, de-enrollment, campaigns, reconciler, auth, delta) with the shared factories.
3. Ensure Drizzle migrations live exclusively in `src/lib/db/migrations/` and match production schema. Add `0040_schema_parity.sql` catch-up (already created).

### 3.3 Reconciler & Delta Sync Reliability
1. Expand Airtable mock to implement `getRecord`, `updateRecord`, and configurable responses.
2. Update expectations in `__tests__/integration/reconciler-engine.test.ts` to match actual return payloads (`clientId` from DB, errors returned in `stage2.errors`).
3. Close DB pools/mocks at test teardown to eliminate open-handle warnings.

### 3.4 Lint Debt Burn-Down
1. Prioritize files touched in recent fixes (`LeadTimeline`, admin dashboards, API routes).
2. Replace `any` with typed DTOs/interfaces under `src/types/`.
3. Remove unused vars, fix Hook dependency arrays, delete `@ts-nocheck`.
4. Introduce `npm run lint:ci` (ESLint CLI) once warnings are cleared.

### 3.5 CI & Observability
1. Add GitHub Action (or Render equivalent) running lint → test → integration → build on every PR.
2. Fail fast on any warning/error; attach `artifacts/*.log` to build output.
3. Maintain metrics (warning count, failing suites) in this document’s appendix.

## 4. Status Tracking

| Workstream | Owner | Status | Notes |
| --- | --- | --- | --- |
| Activity timeline fix | VibeOS | 🟢 Complete | Verified locally and with regression tests; ready for staging. |
| Integration fixtures | VibeOS | 🟢 Complete | Shared factories (`tests/helpers/factories.ts`) adopted; deterministic tests. |
| Reconciler/delta reliability | VibeOS | 🟡 Stable | Linting clean; basic integration tests passing. Deep verification via full suite pending. |
| Lint debt | VibeOS | 🟢 Complete | Repo is lint-clean; types tightened. |
| Auth/Security Tests | VibeOS | 🟢 Complete | Converted skipped tests to active integration tests with mocked auth. |
| CI automation | _Unassigned_ | 🔴 Not Started | No blocking pipeline today. |

Update this table as ownership and progress change.

## 5. Appendices

- **Artifacts directory:** `artifacts/` stores lint/test/build logs for audits.
- **Docker harness:** `scripts/dev/test-db-up.sh`, `test-db-reset.sh`, `test-db-down.sh`, `run-integration-tests.sh`.
- **Env templates:** `.env.test` seeded with local DB + dummy OpenAI keys.

---

_This document must be kept current. All agents should treat it as the operational contract for restoring code quality._ 

