# IMPLEMENTATION AGENT PROMPT
## Portal UI - Lead Activity Visibility Implementation

**Date:** 2025-11-11  
**Priority:** HIGH  
**Estimated Time:** 4-6 hours  
**Branch:** `feature/portal-lead-activity-ui`

---

## 🚨 PRIME DIRECTIVE: READ FIRST 🚨

**BEFORE YOU DO ANYTHING, YOU MUST READ AND CONFIRM THE MANDATORY DEVELOPMENT WORKFLOW.**

**File:** `MANDATORY-DEVELOPMENT-WORKFLOW.md`

This document is the **PRIME DIRECTIVE** for this project. It outlines the non-negotiable 6-phase process you must follow for all development tasks:

`INVESTIGATE → PLAN → TDD → AUDIT → FIX → REPORT`

**FAILURE TO FOLLOW THIS PROTOCOL WILL RESULT IN IMMEDIATE TERMINATION.**

### Your First Action

1.  Read the entire `MANDATORY-DEVELOPMENT-WORKFLOW.md` document.
2.  Confirm you have read and understood it in your first response.

---

## 🚨 CRITICAL: DIRECTORY PROTOCOL 🚨

### YOU MUST WORK IN THE CLIENT PORTAL DIRECTORY

**MANDATORY DIRECTORY:**
```
/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal
```

### ⚠️ DIRECTORY STRUCTURE WARNING

This workspace has **TWO SEPARATE REPOSITORIES**:

```
/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/
├── [ROOT REPO - BACKEND ONLY]
│   ├── n8n workflows
│   ├── Airtable integrations
│   └── Backend automations
│
└── uysp-client-portal/  ← YOU WORK HERE
    ├── src/
    ├── package.json
    ├── .git/
    └── [ENTIRE FRONTEND CODEBASE]
```

### NON-NEGOTIABLE RULES

1. **ALWAYS `cd` to client portal FIRST:**
   ```bash
   cd "/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal"
   ```

2. **VERIFY with `pwd` in EVERY command:**
   ```bash
   pwd
   # MUST output: /Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal
   ```

3. **ALL commands MUST run in `uysp-client-portal`:**
   - ✅ `git` commands
   - ✅ `npm` commands
   - ✅ File edits
   - ✅ Type checks

4. **NEVER work in root directory:**
   - ❌ `/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/` (root - WRONG)
   - ✅ `/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal/` (correct)

### VERIFICATION PROTOCOL

**Before EVERY command, run:**
```bash
cd "/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal" && pwd
```

**Expected output:**
```
/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal
```

**If output is different → STOP IMMEDIATELY and fix directory.**

---

## 📋 YOUR MISSION

Implement SMS activity columns and clickable leads in the Client Portal UI.

**What You're Building:**
1. Campaign detail page: Make leads clickable + add SMS columns
2. Leads dashboard: Add SMS activity columns with filters

**What You're NOT Building:**
- ❌ Backend changes (APIs already work)
- ❌ Database changes (schema already complete)
- ❌ n8n workflows (different repo)

---

## 📖 REFERENCE DOCUMENTS

**PRIMARY:** `FINAL-IMPLEMENTATION-PLAN.md` (1,234 lines)
- Complete step-by-step instructions
- Exact code for every change
- SQL verification queries
- Testing procedures

**SECONDARY:** `PORTAL-UI-FORENSIC-ANALYSIS.md` (582 lines)
- Background context
- Gap analysis
- Evidence verification

**READ BOTH DOCUMENTS BEFORE STARTING.**

---

## 🔀 GIT WORKFLOW

### Step 1: Navigate to Client Portal

```bash
cd "/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal"
pwd
# VERIFY: /Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal
```

---

### Step 2: Verify Current Branch

```bash
git branch --show-current
git status
```

**Expected:** Should be on `main` or a previous feature branch.

---

### Step 3: Pull Latest Changes

```bash
git fetch origin
git checkout main
git pull origin main
```

**Verify:**
```bash
git log -1 --oneline
# Shows latest commit on main
```

---

### Step 4: Create Feature Branch

```bash
git checkout -b feature/portal-lead-activity-ui
git branch --show-current
# MUST output: feature/portal-lead-activity-ui
```

**Verification:**
```bash
git status
# Should show: On branch feature/portal-lead-activity-ui
# Should show: nothing to commit, working tree clean
```

---

### Step 5: Verify You're in Client Portal Git Repo

```bash
git remote -v
# MUST show: origin  https://github.com/chieflatif/uysp-client-portal.git
```

**If it shows a different repo → YOU'RE IN THE WRONG DIRECTORY → STOP IMMEDIATELY**

---

## 🛠️ IMPLEMENTATION TASKS

### TASK 1: Campaign Detail Page (1.5-2 hours)

**File:** `src/app/(client)/admin/campaigns/[id]/page.tsx`

**Changes Required:**
1. Update `Lead` interface (lines 33-50)
   - Add: `smsSentCount`, `processingStatus`, `enrolledMessageCount`, `completedAt`
2. Make table rows clickable (line 369)
   - Add: `onClick={() => router.push(\`/leads/${lead.id}\`)}`
   - Add: `cursor-pointer` class
3. Fix "Sequence" column (line 392-394)
   - Change display to: "X of Y" format
4. Add "SMS Sent" column (after line 362)
   - New header + new cell
5. Add "Status" column (after SMS Sent)
   - Color-coded badges

**ALL EXACT CODE PROVIDED IN:** `FINAL-IMPLEMENTATION-PLAN.md` (Part 2, Task 1)

---

### TASK 2: Leads Dashboard (2-3 hours)

**File:** `src/app/(client)/leads/page.tsx`

**Changes Required:**
1. Update `Lead` interface (lines 11-31)
   - Add: `smsSentCount`, `processingStatus`, `smsSequencePosition`, `enrolledMessageCount`, `completedAt`
2. Add 3 table columns
   - "SMS Sent" (sortable)
   - "Status" (color-coded badges)
   - "Sequence" ("X of Y" format)
3. Add filter buttons (optional but recommended)
   - Complete, In Sequence, Never Messaged
4. Add sort functionality (optional but recommended)
   - Sort by SMS sent count

**ALL EXACT CODE PROVIDED IN:** `FINAL-IMPLEMENTATION-PLAN.md` (Part 2, Task 2)

---

### TASK 3: Type Check (15-30 minutes)

```bash
cd "/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal"
pwd  # VERIFY DIRECTORY
npm run type-check
```

**Expected:** `✓ Type check passed`

**If errors occur:** Fix them before proceeding.

---

### TASK 4: Visual Testing (30-45 minutes)

**Start dev server:**
```bash
cd "/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal"
pwd  # VERIFY DIRECTORY
npm run dev
```

**Test locally:** `http://localhost:3000`

**Test checklist in:** `FINAL-IMPLEMENTATION-PLAN.md` (Part 2, Task 4)

---

## 💾 COMMIT PROTOCOL

### After Completing All Tasks

**Verify you're in client portal:**
```bash
cd "/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal"
pwd
git status
```

---

### Stage Changes

```bash
git add src/app/(client)/leads/page.tsx
git add src/app/(client)/admin/campaigns/[id]/page.tsx
git status
# Should show: Changes to be committed (2 files)
```

---

### Commit

```bash
git commit -m "feat: add SMS activity columns to portal UI

WHAT:
- Add SMS activity visibility to campaign detail page and leads dashboard
- Make campaign detail leads clickable (navigate to /leads/{id})
- Add color-coded status badges for processing status

WHY:
- User needs to see which leads have been messaged
- User needs to drill down into leads from campaigns
- User needs to see lead progression through sequences

CHANGES:
Campaign Detail Page (src/app/(client)/admin/campaigns/[id]/page.tsx):
- Update Lead interface with SMS fields
- Make table rows clickable with onClick handler
- Fix 'Sequence' column to show 'X of Y' format
- Add 'SMS Sent' column displaying smsSentCount
- Add 'Status' column with color-coded badges

Leads Dashboard (src/app/(client)/leads/page.tsx):
- Update Lead interface with SMS fields
- Add 'SMS Sent', 'Status', 'Sequence' columns
- Add filter by processing status (Complete, In Sequence, Never Messaged)
- Add sort by SMS sent count

TESTING:
- TypeScript compilation passes
- Visual testing completed in dev environment
- Verified data matches database queries (154 leads with messages)
- Verified clickable navigation to lead detail page
- Verified activity timeline displays on lead detail

EVIDENCE:
- Database query confirmed 1,165 active leads
- 154 leads with messages (smsSentCount > 0)
- 119 completed, 148 in sequence
- APIs already return all required fields
- No backend changes required"
```

---

### Verify Commit

```bash
git log -1
# Should show your commit message
```

---

### Push Feature Branch

```bash
git push origin feature/portal-lead-activity-ui
```

**Expected output:**
```
remote: Create a pull request for 'feature/portal-lead-activity-ui' on GitHub
To https://github.com/chieflatif/uysp-client-portal.git
 * [new branch]      feature/portal-lead-activity-ui -> feature/portal-lead-activity-ui
```

---

## 🚀 DEPLOYMENT TO STAGING

### Step 1: Verify Push Succeeded

```bash
git branch -r | grep feature/portal-lead-activity-ui
# Should show: origin/feature/portal-lead-activity-ui
```

---

### Step 2: Deploy via Render Dashboard

**MANUAL DEPLOY (Recommended):**

1. Go to: https://dashboard.render.com
2. Log in with credentials
3. Select service: **`uysp-portal-staging`**
4. Click: **"Manual Deploy"** button
5. Branch selector: Select **`feature/portal-lead-activity-ui`**
6. Click: **"Deploy"** button
7. Wait for deployment (~5-10 minutes)
8. Monitor logs for errors

**Deployment URL:** `https://uysp-portal-staging.onrender.com`

---

### Step 3: Smoke Test on Staging

**Critical Path Test:**

1. **Login to Staging**
   - URL: `https://uysp-portal-staging.onrender.com`
   - Credentials: `rebel@rebelhq.ai` / `RElH0rst89!`

2. **Test Campaign Detail Page**
   - Navigate to: Campaigns → Select any campaign
   - ✅ Verify 3 new columns visible: SMS Sent, Status, Sequence
   - ✅ Verify "Sequence" shows "X of Y" format
   - ✅ Click a lead row
   - ✅ Verify navigation to `/leads/{id}` works
   - ✅ Verify lead detail page loads
   - ✅ Verify activity timeline displays

3. **Test Leads Dashboard**
   - Navigate to: Leads
   - ✅ Verify 3 new columns visible: SMS Sent, Status, Sequence
   - ✅ Verify status badges are color-coded
   - ✅ Test filter by status (if implemented)
   - ✅ Test sort by SMS sent (if implemented)
   - ✅ Verify data looks correct

4. **Data Verification**
   - ✅ Check a few leads manually
   - ✅ Compare displayed counts with database (see queries in plan)

**If ANY test fails → REPORT IMMEDIATELY → DO NOT PROCEED**

---

## ⚠️ ERROR HANDLING

### If Deployment Fails

**Check Render Logs:**
1. Go to Render Dashboard → uysp-portal-staging
2. Click "Logs" tab
3. Look for error messages
4. Common issues:
   - TypeScript compilation errors
   - Missing imports
   - Syntax errors

**If Build Errors:**
```bash
cd "/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal"
npm run type-check
npm run build
```

Fix errors, commit, push, and re-deploy.

---

### If Tests Fail on Staging

**Rollback Immediately:**
1. Go to Render Dashboard → uysp-portal-staging
2. Click "Rollback" → Select previous deployment
3. Confirm rollback

**Fix Issues Locally:**
```bash
cd "/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal"
# Make fixes
git add .
git commit -m "fix: resolve staging issues"
git push origin feature/portal-lead-activity-ui
```

**Re-deploy to Staging**

---

## 🎯 SUCCESS CRITERIA

### Must Pass Before Proceeding

- ✅ TypeScript compilation passes (`npm run type-check`)
- ✅ Local dev server runs without errors
- ✅ Campaign detail page loads without errors
- ✅ Leads dashboard loads without errors
- ✅ Leads are clickable in campaign detail
- ✅ Navigation to lead detail works
- ✅ New columns display data correctly
- ✅ Status badges are color-coded
- ✅ Sequence shows "X of Y" format
- ✅ No console errors in browser
- ✅ Staging deployment succeeds
- ✅ Smoke tests pass on staging

---

## 📊 EVIDENCE REQUIREMENTS

### After Completing Implementation

**Provide:**

1. **Git Verification:**
   ```bash
   git log -1 --oneline
   git branch --show-current
   git remote -v
   ```

2. **Deployment Confirmation:**
   - Screenshot of Render deploy log (success)
   - Staging URL: https://uysp-portal-staging.onrender.com

3. **Visual Proof:**
   - Screenshot of campaign detail page (with new columns)
   - Screenshot of leads dashboard (with new columns)
   - Screenshot of lead detail page (after clicking from campaign)

4. **Data Verification:**
   - Run SQL query and show results match UI
   - Confirm 154 leads show message counts
   - Confirm status badges match database

---

## 🚨 FAILURE CONDITIONS

### STOP IMMEDIATELY IF:

1. ❌ You're in the wrong directory
   - Verify with `pwd` shows: `.../uysp-client-portal`
2. ❌ TypeScript errors after changes
   - Fix before committing
3. ❌ Console errors in browser
   - Debug and fix
4. ❌ Deployment fails
   - Check logs, fix errors, re-deploy
5. ❌ Tests fail on staging
   - Rollback and fix locally

**DO NOT PROCEED TO PRODUCTION WITHOUT:**
- ✅ All tests passing on staging
- ✅ User approval
- ✅ Clean deployment logs
- ✅ No errors in browser console

---

## 📞 COMMUNICATION PROTOCOL

### Report Back After Each Major Step

**Format:**
```
STEP COMPLETED: [Task Name]
DIRECTORY: [pwd output]
BRANCH: [git branch output]
STATUS: ✅ Success / ⚠️ Warning / ❌ Failure
EVIDENCE: [screenshot/log/command output]
NEXT STEP: [what you're doing next]
```

**Example:**
```
STEP COMPLETED: Task 1 - Campaign Detail Page
DIRECTORY: /Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal
BRANCH: feature/portal-lead-activity-ui
STATUS: ✅ Success
EVIDENCE: 
- Updated Lead interface (5 fields added)
- Made rows clickable (onClick handler added)
- Added 2 new columns (SMS Sent, Status)
- Type check passes
NEXT STEP: Task 2 - Leads Dashboard
```

---

## 🎓 FINAL REMINDERS

### Before You Start

1. ✅ Read `FINAL-IMPLEMENTATION-PLAN.md` completely
2. ✅ Read this prompt completely
3. ✅ Navigate to client portal directory
4. ✅ Verify with `pwd`
5. ✅ Create feature branch
6. ✅ Verify branch with `git branch --show-current`

### During Implementation

1. ✅ Follow exact code from implementation plan
2. ✅ Verify directory before EVERY command
3. ✅ Test locally before committing
4. ✅ Run type check before committing
5. ✅ Use detailed commit message provided

### After Implementation

1. ✅ Push feature branch
2. ✅ Deploy to staging (manual deploy)
3. ✅ Run smoke tests
4. ✅ Report results with evidence
5. ✅ Wait for approval before production

---

## 🔒 PRODUCTION DEPLOYMENT (AFTER APPROVAL ONLY)

**DO NOT MERGE TO MAIN WITHOUT EXPLICIT USER APPROVAL**

### When Approved:

```bash
cd "/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal"
pwd  # VERIFY
git checkout main
git pull origin main
git merge feature/portal-lead-activity-ui
git push origin main
```

**This will auto-deploy to production:** `https://uysp-portal-v2.onrender.com`

**Only proceed when user explicitly says: "Deploy to production" or "Merge to main"**

---

## 📄 REFERENCE FILES

**In Client Portal Directory:**
- `FINAL-IMPLEMENTATION-PLAN.md` - Primary instructions (1,234 lines)
- `PORTAL-UI-FORENSIC-ANALYSIS.md` - Background analysis (582 lines)
- `IMPLEMENTATION-AGENT-PROMPT.md` - This file

**Files You'll Edit:**
- `src/app/(client)/admin/campaigns/[id]/page.tsx` (Campaign detail)
- `src/app/(client)/leads/page.tsx` (Leads dashboard)

**Total Files to Edit:** 2  
**Total Lines to Add:** ~150 lines  
**Total Lines to Modify:** ~20 lines

---

## ✅ READY TO START?

### Confirmation Checklist

Before typing ANY command, confirm:

- [ ] I have read `FINAL-IMPLEMENTATION-PLAN.md` completely
- [ ] I have read this prompt completely
- [ ] I understand the two-repo structure
- [ ] I will ALWAYS work in `uysp-client-portal` directory
- [ ] I will verify `pwd` before EVERY command
- [ ] I will create feature branch `feature/portal-lead-activity-ui`
- [ ] I will commit with the provided message
- [ ] I will deploy to staging only (not production)
- [ ] I will wait for approval before merging to main

**If you confirm all items above, proceed with implementation.**

**First Command:**
```bash
cd "/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal" && pwd && git status
```

**Expected Output:**
```
/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal
On branch main
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean
```

**If output matches → BEGIN IMPLEMENTATION**  
**If output differs → STOP and report issue**

---

## END OF IMPLEMENTATION AGENT PROMPT

**Estimated Total Time:** 4-6 hours  
**Complexity:** Low-Medium (UI only)  
**Risk:** Low (no backend changes)  
**Priority:** HIGH

**Good luck! Follow the plan, verify your directory, and communicate progress.**

