# Deployment Checklist Template

This checklist is a mandatory Standard Operating Procedure (SOP) for all application deployments. Its purpose is to prevent catastrophic deployment failures by enforcing a systematic, verifiable, and local-first validation process. **No step may be skipped.**

---

## Phase 1: Pre-Flight Checks (Local Environment)

This phase ensures that the code is production-ready *before* it ever leaves your local machine. This is the most critical phase for preventing wasted time.

| Status | Step                                                               | Verification                                                                                               |
| :----: | :----------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------- |
|  `☐`   | **Pull Latest Code**                                               | `git pull origin main` (or relevant branch) completes without merge conflicts.                             |
|  `☐`   | **Install Dependencies**                                           | `npm install` (or `yarn`, `pnpm install`) runs successfully.                                               |
|  `☐`   | **Check Environment Variables**                                    | A `.env.local` or similar file exists with all required production keys (even with dummy values).          |
|  `☐`   | **Run Linters**                                                    | `npm run lint` passes with **0 errors**.                                                                   |
|  `☐`   | **Run Unit & Integration Tests**                                   | `npm run test` passes with **100%** of tests succeeding.                                                   |
|  `☐`   | **Run Production Build**                                           | `npm run build` completes successfully. **This is the single most important step.**                        |
|  `☐`   | **Start Local Production Server**                                  | `npm run start` successfully starts the server on the specified port (e.g., 3000).                        |
|  `☐`   | **Perform Local Smoke Test**                                       | Open `http://localhost:3000` in a browser. Click through 3-5 core features. Check for console errors.      |
|  `☐`   | **Commit Final Code**                                              | `git commit -m "feat: Prepare for deployment vX.Y.Z"` creates a clean commit with all changes.             |

**DO NOT PROCEED TO PHASE 2 UNLESS ALL BOXES ARE CHECKED.**

---

## Phase 2: Deployment Execution

This phase covers the process of getting the validated code running on the production infrastructure.

| Status | Step                                                                 | Verification                                                                                                                             |
| :----: | :------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------- |
|  `☐`   | **Push Code to Deployment Branch**                                   | `git push origin main` completes successfully.                                                                                           |
|  `☐`   | **Trigger Deployment**                                               | Deployment is automatically triggered by CI/CD (e.g., GitHub Actions) or manually initiated in the provider's dashboard (e.g., Render). |
|  `☐`   | **Monitor Build Logs**                                               | Observe build logs in the CI/CD interface. The build should pass, mirroring the successful local build.                                  |
|  `☐`   | **Confirm "Live" Status**                                            | The deployment platform reports the new version as "live" or "healthy".                                                                  |
|  `☐`   | **Run Database Migrations**                                          | The automated post-deployment step (e.g., bootstrap endpoint call in GitHub Actions) runs and completes successfully.                      |
|  `☐`   | **Run Data Seeding/Syncing**                                         | If applicable, the automated data seeding or synchronization script (e.g., Airtable sync) runs and reports 0 errors.                     |

---

## Phase 3: Post-Deployment Verification (Production Environment)

This final phase confirms that the live application is fully functional and serving traffic correctly.

| Status | Step                                                               | Verification                                                                                               |
| :----: | :----------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------- |
|  `☐`   | **Health Check**                                                   | Access the application's primary URL and any `/api/health` endpoints. They should return `200 OK`.           |
|  `☐`   | **Core Feature Smoke Test**                                        | Log in with a test user. Navigate through the same 3-5 core features tested locally.                       |
|  `☐`   | **Check for Console Errors**                                       | Open the browser's developer tools. The console should be free of critical JavaScript errors.              |
|  `☐`   | **Verify Data Integrity**                                          | Check that the dashboard or relevant pages show the data that was just migrated/seeded.                    |
|  `☐`   | **Monitor Application Logs**                                       | Observe the application logs in the production environment for 5-10 minutes. Look for any new or unusual errors. |

---

## Rollback Plan

If a critical failure is discovered during **Phase 3** that was not caught in **Phase 1**:
1.  **Immediately** trigger a redeploy of the previous stable commit/Docker image.
2.  Update the status page or notify users of service degradation.
3.  Create a new ticket to perform a post-mortem analysis of why the failure was not caught in local testing.
4.  **Do not** attempt to "hot-fix" the issue in production. Roll back first, then debug in a development environment.
