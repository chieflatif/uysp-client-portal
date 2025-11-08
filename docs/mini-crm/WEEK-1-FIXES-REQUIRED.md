# Week 1 Fixes Required Before Deployment

**Date:** November 7, 2025  
**Status:** 3 MANDATORY FIXES + 1 HIGHLY RECOMMENDED  
**Time:** 5-7 hours total  
**Branch:** `feature/mini-crm-activity-logging`

---

## 🚨 MANDATORY FIXES (MUST DO)

### FIX #1: Remove Duplicate Documentation ✅ DONE

**Issue:** Mini-CRM docs exist in BOTH `docs/` and `docs/mini-crm/`

**Status:** ✅ **FIXED** - Duplicates removed from client portal `docs/`

**Evidence:**
```bash
ls docs/mini-crm/
# Shows: All Mini-CRM docs properly organized
```

**Commit:** Added to feature branch

---

### FIX #2: Migration Numbering ✅ VERIFIED CORRECT

**Issue:** Needed verification that 0004-0005 don't conflict with production

**Status:** ✅ **VERIFIED CORRECT**

**Evidence:**
```
Existing: 0000, 0001, 0002, 0003
New: 0004 (lead_activity_log), 0005 (last_activity_at index)
```

**Migration sequence is correct.** No action needed.

---

### FIX #3: Write API Tests (MANDATORY per TDD Protocol)

**Issue:** Zero automated tests for 4 API endpoints (violates TDD principle)

**Required:** Write tests for all endpoints before Week 2

**Estimated Time:** 4-6 hours

**Files to Create:**
```
tests/api/internal/log-activity.test.ts
tests/api/admin/activity-logs.test.ts  
tests/api/leads/activity.test.ts
tests/lib/activity/logger.test.ts
```

**Minimum Test Coverage:**

#### POST /api/internal/log-activity
- ✅ Returns 401 without API key
- ✅ Returns 401 with invalid API key
- ✅ Returns 400 with missing required fields
- ✅ Returns 400 with invalid eventType
- ✅ Returns 400 with invalid eventCategory
- ✅ Returns 200 and logs activity with valid data
- ✅ Looks up lead by Airtable ID
- ✅ Handles lead not found gracefully
- ✅ Updates leads.lastActivityAt

#### GET /api/admin/activity-logs
- ✅ Returns 401 without session
- ✅ Returns 403 for non-admin users
- ✅ Returns paginated results
- ✅ Full-text search works
- ✅ Filters by eventType
- ✅ Filters by eventCategory
- ✅ Filters by dateFrom/dateTo
- ✅ Joins with leads table

#### GET /api/leads/[id]/activity
- ✅ Returns 401 without session
- ✅ Returns 404 for non-existent lead
- ✅ Returns 403 when accessing other client's lead
- ✅ Returns timeline for own lead
- ✅ SUPER_ADMIN can access any lead
- ✅ Pagination works

#### lib/activity/logger.ts
- ✅ Validates required params
- ✅ Looks up lead by Airtable ID
- ✅ Inserts activity successfully
- ✅ Updates lastActivityAt
- ✅ Returns success result
- ✅ Never throws errors
- ✅ Helper functions work correctly

**Test Framework:** Use existing (likely Jest or Vitest)

**Why MANDATORY:**
The forensic security fixes prevented:
- SQL injection vulnerability
- Multi-tenant data leak
- Authentication bypass

**Without tests:** These vulnerabilities could come back in future changes.

---

## 📋 HIGHLY RECOMMENDED (SHOULD DO)

### RECOMMEND-001: Environment Variable Deployment Checklist

**Issue:** `INTERNAL_API_KEY` is documented but not in a pre-deployment checklist

**Fix:** Create `docs/mini-crm/DEPLOYMENT-CHECKLIST.md`:

```markdown
# Mini-CRM Deployment Checklist

## Pre-Deployment (Staging)

- [ ] Generate INTERNAL_API_KEY: `openssl rand -hex 32`
- [ ] Add to .env.local: `INTERNAL_API_KEY=<key>`
- [ ] Verify API key is NOT in git
- [ ] Apply migrations: `npm run db:push`
- [ ] Run test seeder: `npx tsx scripts/seed-activity-log-test-data.ts`
- [ ] Test POST /api/internal/log-activity
- [ ] Test GET /api/admin/activity-logs
- [ ] Test GET /api/leads/[id]/activity
- [ ] Test GET /api/internal/activity-health
- [ ] Verify database has 15 test records

## Production Deployment

- [ ] Add INTERNAL_API_KEY to Render environment variables
- [ ] Apply migrations: Deploy via Render (auto-runs migrations)
- [ ] Monitor logs for errors
- [ ] Test health check endpoint
- [ ] Verify activity logging in production
```

**Time:** 15 minutes

---

## 🎯 PRIORITIZED FIX TIMELINE

### Today (Before EOD):

**Time: 10 minutes**
1. ✅ Remove duplicate docs (DONE)
2. ✅ Verify migration numbering (DONE)
3. Create deployment checklist (15 min)
4. Commit all fixes

### Tomorrow (Before Week 2):

**Time: 4-6 hours**
5. Write API tests
6. Run test suite
7. Fix any failing tests
8. Commit tests to feature branch

### Before Staging Deployment:

9. Generate INTERNAL_API_KEY
10. Add to .env.local
11. Run full test suite
12. Apply migrations to staging
13. Test endpoints on staging

---

## ✅ WHEN YOU'RE DONE

**Week 1 is COMPLETE when:**

- [x] All code committed
- [x] Duplicate docs removed
- [x] Migration numbering verified
- [ ] API tests written and passing
- [ ] Deployment checklist created
- [ ] Staging tested successfully

**Then you're CLEARED for Week 2: n8n instrumentation.**

---

**Created by:** Strategic Planning Agent  
**Reference:** [FORENSIC-AUDIT-WEEK-1-FOUNDATION.md](./FORENSIC-AUDIT-WEEK-1-FOUNDATION.md)  
**Status:** Ready for execution agent review

