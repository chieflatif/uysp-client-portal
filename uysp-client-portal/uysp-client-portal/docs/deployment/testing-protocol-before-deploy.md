# Pre-Deployment Testing Protocol

**Status**: MANDATORY
**Scope**: All deployments, no exceptions.

---

## 1. The Mandate: Zero Broken Builds in Production

The catastrophic failure of the UYSP Client Portal deployment was caused by one primary process violation: **pushing code that was not validated locally.** More than two hours were wasted debugging build failures in a remote environment, a process that would have taken seconds locally.

This protocol is non-negotiable and must be followed to prevent a recurrence. **The guiding principle is: If it doesn't build and run locally, it doesn't get pushed.**

## 2. The "Golden Command": `npm run build`

Before any `git push` to a branch that will be deployed, every developer (human or AI) **MUST** run the production build command and verify it completes without errors.

```bash
# Example for a Next.js project
npm run build
```

A successful output looks like this:

```
✓  Collecting page data...
✓  Generating static pages (0/15)
✓  Finalizing page routes...
✓  Generating static pages (15/15)
✓  Creating build manifest...
✓  Compiled successfully
```

Any output that includes `Error`, `Failed to compile`, or a non-zero exit code is a **HARD STOP**. Do not proceed.

## 3. The Pre-Flight Checklist

This checklist must be mentally or physically completed before every `git push` to a deployable branch. It is codified in the `deployment-checklist.md` template.

| Status | Step                                                               | Command               | Expected Outcome                  |
| :----: | :----------------------------------------------------------------- | :-------------------- | :-------------------------------- |
|  `☐`   | **Run Linters**                                                    | `npm run lint`        | Exits with 0 errors.              |
|  `☐`   | **Run Tests**                                                      | `npm run test`        | 100% pass rate.                   |
|  `☐`   | **Run Production Build**                                           | `npm run build`       | "Compiled successfully."          |
|  `☐`   | **Run Local Production Server**                                    | `npm run start`       | Server starts without crashing.   |
|  `☐`   | **Perform Manual Smoke Test**                                      | (Open browser)        | Core pages load, no console errors. |

## 4. Why This Protocol Was Violated

The agent in the failed deployment scenario made several critical errors in judgment:

1.  **It assumed the remote environment was the same as local**: It pushed code that worked in a `next dev` environment, failing to account for the stricter requirements of a `next build` production environment.
2.  **It used the remote CI/CD pipeline as a debugger**: Instead of using the rapid feedback loop of local builds (seconds), it used Render's build pipeline (10+ minutes), resulting in a massive waste of time.
3.  **It reacted to symptoms, not causes**: When a build failed, it guessed at a fix (e.g., "move `tailwindcss` to `dependencies`") and pushed again, rather than running the build locally to get an immediate, clear error message.

## 5. Corrective Action for VibeOS

-   **Automation**: The VibeOS `git-workflow.sh` script (or equivalent git hooks) **must** be updated to include an automated `npm run build` check before allowing a `git push` to the `main` or `develop` branches.
-   **Enforcement**: Any agent acting as VibeOS must state its adherence to this protocol before initiating a deployment. If a build fails locally, the agent must announce the failure and the fix before attempting another build.

**This protocol is the primary firewall against deployment disasters. It is not a suggestion.**
