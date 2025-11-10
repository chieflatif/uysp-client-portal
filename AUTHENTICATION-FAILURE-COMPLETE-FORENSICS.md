# AUTHENTICATION FAILURE - COMPLETE FORENSIC INVESTIGATION
**Date:** 2025-11-10
**Status:** 🔴 CRITICAL - Root Cause Identified, Migration Ready
**Incident Duration:** 7 days (2025-11-03 to 2025-11-10)

---

## EXECUTIVE SUMMARY

**The authentication failure had TWO distinct root causes, not one:**

### Root Cause #1: Drizzle ORM Query Bug (FIXED ✅)
- **Commit:** abec146a (2025-11-03)
- **Issue:** Mixing relational API with raw SQL caused duplicate table alias
- **Error:** `FROM "users" "users"` (duplicate)
- **Fix:** Switched to core query builder (commit 9069a97)
- **Status:** ✅ DEPLOYED AND LIVE

### Root Cause #2: Missing Database Columns (DISCOVERED ✅, NOT YET FIXED ⚠️)
- **Commit:** 7739da1b (2025-11-07) - deleted migration 0032 as "duplicate"
- **Issue:** Migration 0032 and 0015 implement DIFFERENT architectures (not duplicates)
- **Error:** `ERROR: column "password_setup_token" does not exist (SQLSTATE 42703)`
- **Impact:** Query syntax now correct, but columns missing from production database
- **Fix:** Created migration 0035 to re-add missing columns
- **Status:** ⚠️ MIGRATION READY, NEEDS DEPLOYMENT

---

## TIMELINE OF EVENTS

### 2025-11-03: Bug Introduced
**Commit:** abec146a
**Change:** Added case-insensitive email lookup
**Code (BROKEN):**
```typescript
const user = await db.query.users.findFirst({
  where: sql`LOWER(${users.email}) = LOWER(${email})`,
});
```
**Error Generated:** `FROM "users" "users"` (duplicate table alias)

---

### 2025-11-07: Schema Corruption
**Commit:** 7739da1b
**Change:** Deleted migration 0032 as "duplicate of 0015"
**Impact:** Production database never got `password_setup_token` columns

**CRITICAL MISUNDERSTANDING:**
- **Migration 0015:** Creates SEPARATE `password_setup_tokens` **TABLE**
- **Migration 0032:** Adds columns to `users` **TABLE**
- **These are NOT duplicates** - they implement different architectures!
- **Code expects:** Columns on users table (migration 0032 approach)
- **Production has:** Separate table (migration 0015 only)

---

### 2025-11-10 17:51:15 UTC: Initial Fix Attempt
**Commit:** 9069a97
**Fix:** Changed from relational API to core query builder
**Code (FIXED):**
```typescript
const result = await db
  .select()
  .from(users)
  .where(sql`LOWER(${users.email}) = LOWER(${email})`)
  .limit(1);

const user = result[0] || null;
```
**Deployment:** ✅ SUCCESSFUL
**Result:** ❌ Authentication still broken (different error now)

---

### 2025-11-10 18:04:33 UTC: Deployment Verified
**Health Endpoint:** ✅ Responding
**Commit SHA:** 9069a97 (correct fix deployed)
**User Feedback:** "I'm still getting the same login error as well"

---

### 2025-11-10 ~18:15 UTC: Database Query Investigation
**Action:** Queried production database directly via Render MCP tool
**Discovery:** 🔍 **ACTUAL PostgreSQL ERROR REVEALED**

**User's Error Message (from UI logs):**
```
Failed query: select ... from "users" where LOWER("users"."email") = LOWER($1) limit $2
params: rebel@rebelhq.ai,1
```

**Actual Database Error (from direct query):**
```
ERROR: column "password_setup_token" does not exist (SQLSTATE 42703)
```

**Key Insight:** The generic "Failed query" wrapper was hiding the real PostgreSQL error!

---

### 2025-11-10 ~18:20 UTC: Schema Audit
**Investigation:** Queried production database schema

**Expected Columns (from code):**
```typescript
// src/lib/db/schema.ts lines 32-33
passwordSetupToken: varchar('password_setup_token', { length: 255 }),
passwordSetupTokenExpiry: timestamp('password_setup_token_expiry', { withTimezone: true }),
```

**Actual Columns (production database):**
```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'users';

-- RESULT:
id, email, password_hash, first_name, last_name, role, client_id,
is_active, last_login_at, created_at, updated_at, must_change_password
```

**Missing:**
- ❌ `password_setup_token`
- ❌ `password_setup_token_expiry`

---

### 2025-11-10 ~18:25 UTC: Migration History Investigation
**Action:** Retrieved deleted migration 0032 from git history

**Migration 0032 (deleted as "duplicate"):**
```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_setup_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS password_setup_token_expiry TIMESTAMP WITH TIME ZONE;
```

**Migration 0015 (kept as "original"):**
```sql
CREATE TABLE IF NOT EXISTS password_setup_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  -- ... more columns
);
```

**THEY ARE NOT DUPLICATES!**
- Migration 0015: Separate **TABLE** for token management
- Migration 0032: **COLUMNS** on users table for inline tokens
- Code uses: Columns approach (migration 0032)
- Production has: Table approach (migration 0015)

---

## FORENSIC ANALYSIS

### Phase 1: Code-Level Investigation (COMPLETE ✅)

**Tool Used:** `git blame`, `git log`
**Result:** Identified commit abec146a introduced Drizzle query bug
**Fix:** Commit 9069a97 switched to core query builder
**Deployment:** ✅ SUCCESSFUL

---

### Phase 2: Schema Integrity Audit (INITIALLY INCOMPLETE ❌, NOW COMPLETE ✅)

**Original Audit (2025-11-10 17:00):**
- ✅ Verified schema.ts contains passwordSetupToken fields
- ✅ Confirmed deleted migrations were "duplicates"
- ❌ **FAILED TO VERIFY PRODUCTION DATABASE SCHEMA**

**Forensic Re-Audit (2025-11-10 18:20):**
- ✅ Queried production database directly
- ✅ Discovered missing columns
- ✅ Retrieved deleted migration 0032 from git
- ✅ Identified architectural mismatch

---

### Phase 3: Root Cause Analysis (COMPLETE ✅)

**Question:** Why did the Phase 3 audit miss this?

**Answer:** The original forensic protocol verified:
1. ✅ Code schema definitions (schema.ts) - CORRECT
2. ✅ Migration file contents (migrations/*.sql) - CORRECT
3. ❌ **Actual production database schema** - SKIPPED

**Protocol Gap:** No verification step for "what's actually deployed in production"

**Lesson Learned:** Always query the production database to verify schema matches code expectations

---

## THE COMPLETE ERROR CHAIN

### Error Flow (Before Both Fixes):
```
1. User submits login form
2. NextAuth calls authorize() function
3. Code queries: db.query.users.findFirst({ where: sql`...` })
4. Drizzle generates: SELECT * FROM "users" "users" WHERE ...
                                         ^^^^^^^^ DUPLICATE
5. PostgreSQL rejects query: "syntax error near 'users'"
6. Generic wrapper: "Failed query: select ..."
7. User sees: "Authentication failed"
```

### Error Flow (After Fix #1, Before Fix #2):
```
1. User submits login form
2. NextAuth calls authorize() function
3. Code queries: db.select().from(users).where(sql`...`)
4. Drizzle generates: SELECT id, email, ..., password_setup_token, ... FROM "users"
                                              ^^^^^^^^^^^^^^^^^^^^^ Missing column
5. PostgreSQL rejects query: "column 'password_setup_token' does not exist"
6. Generic wrapper: "Failed query: select ..."
7. User sees: "Authentication failed" (same message, different root cause!)
```

### Error Flow (After Both Fixes):
```
1. User submits login form
2. NextAuth calls authorize() function
3. Code queries: db.select().from(users).where(sql`...`)
4. Drizzle generates: SELECT id, email, ..., password_setup_token, ... FROM "users"
5. PostgreSQL returns: User record with all columns
6. bcrypt.compare() verifies password
7. User authenticated successfully ✅
```

---

## RESOLUTION

### Fix #1: Drizzle Query Bug (DEPLOYED ✅)
**File:** `src/lib/auth/config.ts`
**Commit:** 9069a97
**Status:** ✅ LIVE IN PRODUCTION

```typescript
// BEFORE (BROKEN):
const user = await db.query.users.findFirst({
  where: sql`LOWER(${users.email}) = LOWER(${email})`,
});

// AFTER (FIXED):
const result = await db
  .select()
  .from(users)
  .where(sql`LOWER(${users.email}) = LOWER(${email})`)
  .limit(1);

const user = result[0] || null;
```

---

### Fix #2: Missing Database Columns (READY FOR DEPLOYMENT ⚠️)
**File:** `migrations/0035_fix_missing_password_setup_token_columns.sql`
**Status:** ⚠️ CREATED, NOT YET APPLIED TO PRODUCTION

**Migration SQL:**
```sql
-- Add missing columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_setup_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS password_setup_token_expiry TIMESTAMP WITH TIME ZONE;

-- Add index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_users_setup_token
  ON users(password_setup_token)
  WHERE password_setup_token IS NOT NULL;
```

**Deployment Script:** `apply-migration-0035.sh`

---

## DEPLOYMENT INSTRUCTIONS

### Step 1: Get Database Connection String
```bash
# From Render Dashboard:
# https://dashboard.render.com/postgres/dpg-d3q9raodl3ps73bp1r50-a
# Copy "Internal Database URL" or "External Database URL"

export DATABASE_URL='postgresql://uysp_client_portal_db_user:...'
```

### Step 2: Apply Migration
```bash
cd /Users/latifhorst/cursor\ projects/UYSP\ Lead\ Qualification\ V1/uysp-client-portal
./apply-migration-0035.sh
```

### Step 3: Verify Columns Added
```bash
psql "$DATABASE_URL" -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name LIKE '%password_setup%';"
```

**Expected Output:**
```
        column_name         |          data_type
----------------------------+----------------------------
 password_setup_token       | character varying
 password_setup_token_expiry| timestamp with time zone
```

### Step 4: Test Authentication
1. Navigate to https://uysp-portal-v2.onrender.com/login
2. Enter credentials: `rebel@rebelhq.ai` / [password]
3. Verify successful login ✅

---

## VERIFICATION CHECKLIST

### Pre-Deployment
- [x] Migration 0035 created
- [x] Migration script created (apply-migration-0035.sh)
- [x] Forensic report documented
- [ ] Migration reviewed by human
- [ ] DATABASE_URL obtained from Render

### Deployment
- [ ] Migration applied to production database
- [ ] Columns verified in production schema
- [ ] Index created successfully

### Post-Deployment
- [ ] Authentication tested with real credentials
- [ ] Production logs checked for errors
- [ ] Health endpoint verified
- [ ] No new errors in last 15 minutes

---

## LESSONS LEARNED

### Technical Lessons

1. **Generic Error Wrappers Hide Root Causes**
   - "Failed query" wrapper prevented immediate diagnosis
   - Should log actual PostgreSQL errors for debugging
   - Consider structured error logging with error codes

2. **Schema Audits Must Include Production Database**
   - Verifying code schema definitions is insufficient
   - Must query actual production database to confirm alignment
   - Add schema verification to deployment pipeline

3. **Migration "Duplicates" Must Be Carefully Analyzed**
   - Migration 0015 and 0032 looked similar but implemented different architectures
   - Always check: TABLE vs COLUMN, separate vs inline, normalized vs denormalized
   - When in doubt, keep both migrations and let database handle duplicates

4. **Drizzle ORM API Separation**
   - Relational API and Core Query Builder don't mix
   - Use operators (eq, like) with relational API
   - Use sql templates ONLY with core query builder

### Process Lessons

1. **Forensic Protocols Need Database Verification Step**
   - Phase 1: Code audit ✅
   - Phase 2: Migration audit ✅
   - **Phase 3 (MISSING): Production database verification**

2. **Direct Database Queries Accelerate Debugging**
   - User asked: "Why can't you do this via the CLI?"
   - Direct query immediately revealed actual error
   - Generic log messages delayed diagnosis by hours

3. **Multi-Root-Cause Failures Are Difficult**
   - Fixed first bug (Drizzle query)
   - User reported "same error" (different root cause)
   - Must verify fix COMPLETELY resolves issue before declaring success

---

## PREVENTION MEASURES

### Immediate (This Deployment)
- [x] Create migration 0035 with missing columns
- [x] Create deployment script with verification
- [x] Document complete forensic analysis
- [ ] Apply migration to production
- [ ] Verify authentication works

### Short-Term (Next Sprint)
1. **Add Schema Verification to CI/CD**
   - Compare schema.ts with production database schema
   - Fail deployment if mismatch detected
   - Run after every migration

2. **Improve Error Logging**
   - Log actual PostgreSQL errors (not generic wrappers)
   - Add error codes and SQLSTATE to logs
   - Include query and parameters in error messages

3. **Migration Review Process**
   - Require human review before deleting migrations
   - Document WHY migration is duplicate
   - Verify production database before marking as duplicate

### Long-Term (Q1 2025)
1. **Automated Schema Drift Detection**
   - Daily comparison: schema.ts vs production database
   - Alert on drift > 0 columns/tables
   - Auto-generate corrective migrations

2. **Migration Test Environment**
   - Staging database with production schema
   - Test migrations before production deployment
   - Automate rollback procedures

3. **Forensic Protocol Enhancement**
   - Add "Phase 3: Production Database Verification"
   - Require direct database queries before "COMPLETE" status
   - Document all assumptions and verifications

---

## POST-INCIDENT REVIEW QUESTIONS

### What Went Well?
1. ✅ Git forensics quickly identified first root cause (commit abec146a)
2. ✅ Direct database query revealed actual error immediately
3. ✅ Migration 0035 created with full documentation
4. ✅ Comprehensive forensic report documented entire incident

### What Went Wrong?
1. ❌ Initial forensic audit didn't verify production database schema
2. ❌ Migration 0032 deleted without verifying production impact
3. ❌ Generic error wrapper ("Failed query") hid real PostgreSQL error
4. ❌ First "MISSION ACCOMPLISHED" report premature (bug not fully fixed)

### What Should Change?
1. 🔄 Add production database verification to forensic protocol
2. 🔄 Improve error logging to show actual PostgreSQL errors
3. 🔄 Require human approval before deleting migrations
4. 🔄 Test authentication in production immediately after deployment

---

## CONCLUSION

**Current Status:** 🔴 **CRITICAL - MIGRATION READY FOR DEPLOYMENT**

**Summary:**
- ✅ Root Cause #1 (Drizzle query bug): FIXED and DEPLOYED
- ⚠️ Root Cause #2 (missing columns): IDENTIFIED, migration ready
- 🔴 Authentication: STILL BROKEN until migration 0035 deployed
- 📋 Migration: Ready in `migrations/0035_fix_missing_password_setup_token_columns.sql`
- 🚀 Deployment: Run `./apply-migration-0035.sh` with DATABASE_URL

**Impact:**
- Outage Duration: 7 days (2025-11-03 to present)
- Users Affected: All users (100% authentication failure)
- Business Impact: Complete portal inaccessibility
- Data Loss: None (read-only queries, no writes affected)

**Next Steps:**
1. **IMMEDIATE**: Apply migration 0035 to production database
2. **IMMEDIATE**: Verify authentication works after migration
3. **24 HOURS**: Monitor error logs for any new issues
4. **1 WEEK**: Implement schema drift detection
5. **2 WEEKS**: Team retrospective on incident

---

**Incident ID:** AUTH-FAILURE-2025-11-10
**Severity:** CRITICAL (7-day outage)
**Status:** Root causes identified, fix ready for deployment
**Report By:** Claude Code (Forensic Execution Protocol)
**Date:** 2025-11-10
**Production URL:** https://uysp-portal-v2.onrender.com
**Database:** dpg-d3q9raodl3ps73bp1r50-a (virginia, basic_1gb)

---

## FILES CREATED THIS INCIDENT

1. `__tests__/integration/auth-login.test.ts` - Regression test for Drizzle bug
2. `FORENSIC-AUDIT-AUTH-FAILURE.md` - Initial forensic report (incomplete)
3. `AUTH-FIX-DEPLOYMENT-SUCCESS.md` - Premature success report (first fix only)
4. `migrations/0035_fix_missing_password_setup_token_columns.sql` - Production fix
5. `apply-migration-0035.sh` - Deployment script with verification
6. `AUTHENTICATION-FAILURE-COMPLETE-FORENSICS.md` - This complete forensic report

---

**END OF FORENSIC REPORT**
