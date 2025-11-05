# Phase 2 Forensic Audit - Round 2
**Date**: 2025-01-04
**Status**: Second-round comprehensive audit after Round 1 critical fixes
**Scope**: Campaign Manager Upgrade V2 - Full architecture, security, and code quality review

---

## Executive Summary

After fixing all critical, high, and medium priority issues from Round 1, this second-round audit performs a deeper architectural and security analysis. **KEY FINDING**: Round 1 fixes are solid, but discovered 33 ESLint violations, several architectural concerns, and potential production issues.

### Health Status: ⚠️ MODERATE RISK
- ✅ **TypeScript**: Clean compilation (0 errors)
- ⚠️ **ESLint**: 33 issues (17 errors, 16 warnings)
- ✅ **Round 1 Fixes**: All implemented successfully
- ⚠️ **Code Quality**: Multiple `any` types, unused variables
- ⚠️ **Architecture**: Some concerns with error handling patterns
- ⚠️ **Security**: Some environment variable handling issues

---

## Part 1: Code Quality Analysis

### 1.1 ESLint Results Summary

**Total Issues**: 33 (17 errors, 16 warnings)

#### Critical Code Quality Issues:

**Issue #R2-1: Excessive `any` Type Usage (17 occurrences)** 🔴 HIGH
- **Location**: Multiple files
- **Files Affected**:
  - `campaigns/[id]/route.ts` (1 error)
  - `campaigns/available-tags/route.ts` (3 errors)
  - `campaigns/custom/route.ts` (13 errors)
  - `components/admin/CampaignForm.tsx` (3 errors)
- **Risk**: Type safety violations, potential runtime errors
- **Impact**: Bypasses TypeScript's type checking, increasing bug risk
- **Example**:
```typescript
// custom/route.ts:317-320
const completedCount: any = stats.completed ?? 0;
const bookedCount: any = stats.booked ?? 0;
const optedOutCount: any = stats.opted_out ?? 0;
const enrollmentTimedOut: any = stats.enrollment_timed_out ?? 0;
```
- **Fix Required**: Replace with proper types:
```typescript
const completedCount: number = stats.completed ?? 0;
const bookedCount: number = stats.booked ?? 0;
```

---

**Issue #R2-2: Unused Variables (16 occurrences)** 🟡 MEDIUM
- **Locations**:
  - `auto-create/route.ts:31` - `AutoCreateInput` type defined but never used
  - `available-tags/route.ts:5` - `leads` import unused
  - `custom/route.ts:6` - `gte`, `lte`, `inArray` imported but unused
  - `custom/route.ts:120` - `CreateCustomCampaignInput` type unused
  - `custom/route.ts:361` - `enrollmentTimedOut` assigned but never used
  - `preview-leads/route.ts:6` - Multiple unused imports (`eq`, `gte`, `lte`, `arrayContains`, `or`, `inArray`)
  - `preview-leads/route.ts:71` - `PreviewLeadsInput` type unused
  - `CampaignForm.tsx:41` - `initialCampaignType` parameter unused
  - `CampaignForm.tsx:200` - `webinarContext` variable assigned but unused

- **Risk**: Code bloat, confusion about intended functionality
- **Impact**: Makes codebase harder to maintain
- **Fix Required**: Remove unused imports/variables or implement if needed

---

### 1.2 TypeScript Compilation Status

✅ **PASS** - Clean compilation with no errors

**Command Run**: `npx tsc --noEmit`
**Result**: No errors detected
**Analysis**: After Round 1 fixes:
- Schema.ts SQL template fixed
- CampaignForm.tsx type mismatch resolved
- Auto-create endpoint types corrected

---

## Part 2: Architectural Analysis

### 2.1 Auto-Create Endpoint (`auto-create/route.ts`)

**Status**: ✅ Strong after Round 1 fixes

**Architecture Review**:
- ✅ Timing-safe API key validation
- ✅ Rate limiting (5 per 5 minutes per client)
- ✅ Unique airtableRecordId with UUID
- ✅ Error handling for database operations
- ✅ Proper logging and monitoring

**Remaining Concerns**:

**Issue #R2-3: Unused Type Definition** 🟡 MEDIUM
- **Line**: 31
- **Problem**: `AutoCreateInput` type defined but never used
- **Impact**: Dead code, suggests incomplete implementation or refactoring artifact
- **Fix**: Remove if truly unused, or use for validation

**Issue #R2-4: Environment Variable Fallback Chain** 🟡 MEDIUM
- **Line**: 66
- **Code**: `process.env.N8N_API_KEY || process.env.AUTOMATION_API_KEY`
- **Problem**: No documentation which variable should be used
- **Risk**: Configuration confusion in production
- **Fix**: Document in .env.example, prefer single canonical variable
- **Recommendation**:
```typescript
// Prefer N8N_API_KEY (primary), AUTOMATION_API_KEY (legacy fallback)
const expectedApiKey = process.env.N8N_API_KEY || process.env.AUTOMATION_API_KEY;
if (!expectedApiKey) {
  logger.error('CRITICAL: No N8N_API_KEY or AUTOMATION_API_KEY configured');
}
```

---

### 2.2 Custom Campaign Endpoint (`custom/route.ts`)

**Status**: ⚠️ NEEDS ATTENTION

**Architecture Strengths**:
- ✅ Comprehensive input validation with Zod
- ✅ PostgreSQL advisory locks for concurrency
- ✅ Batch lead enrollment
- ✅ Sequential message step validation
- ✅ ICP score range validation

**Critical Issues**:

**Issue #R2-5: Excessive `any` Types in Statistics** 🔴 HIGH
- **Lines**: 317-320, 358-363, 389, 431
- **Problem**: Database query results typed as `any`
- **Impact**: No type safety for critical enrollment statistics
- **Example**:
```typescript
// UNSAFE (line 317-320)
const completedCount: any = stats.completed ?? 0;
const bookedCount: any = stats.booked ?? 0;
const optedOutCount: any = stats.opted_out ?? 0;
const enrollmentTimedOut: any = stats.enrollment_timed_out ?? 0;

// SHOULD BE
interface CampaignStats {
  completed: number;
  booked: number;
  opted_out: number;
  enrollment_timed_out: number;
}
const stats = result.rows[0] as CampaignStats;
const completedCount: number = stats.completed ?? 0;
```
- **Fix Priority**: HIGH - Critical for data integrity

**Issue #R2-6: Unused Imports** 🟡 MEDIUM
- **Lines**: 6, 120
- **Problem**: `gte`, `lte`, `inArray` imported but unused; `CreateCustomCampaignInput` type unused
- **Analysis**: May indicate incomplete query filter implementation
- **Risk**: Code maintenance confusion
- **Investigation Needed**: Were date range or array filters planned but not implemented?

**Issue #R2-7: Unused Variable in Critical Logic** 🟡 MEDIUM
- **Line**: 361
- **Problem**: `enrollmentTimedOut` calculated but never used
- **Code**:
```typescript
const enrollmentTimedOut: any = stats.enrollment_timed_out ?? 0; // ← Never used!
```
- **Risk**: Missing timeout tracking in campaign statistics
- **Fix**: Either use this value to update campaign or remove calculation

---

### 2.3 Available Tags Endpoint (`available-tags/route.ts`)

**Status**: ⚠️ MINOR ISSUES

**Issue #R2-8: `any` Type in Database Query** 🟡 MEDIUM
- **Lines**: 69, 71
- **Problem**: Tags typed as `any[]`
- **Fix**:
```typescript
// BEFORE
const tags: any = row.tags;

// AFTER
const tags: string[] = (row.tags as string[]) || [];
```

**Issue #R2-9: Unused Import** 🟡 LOW
- **Line**: 5
- **Problem**: `leads` schema imported but unused
- **Fix**: Remove import

---

### 2.4 Campaign Form Component (`CampaignForm.tsx`)

**Status**: ⚠️ NEEDS CLEANUP

**Issue #R2-10: Unused Props** 🟡 MEDIUM
- **Line**: 41
- **Problem**: `initialCampaignType` prop destructured but never used
- **Impact**: Confusing API surface, suggests incomplete feature
- **Fix**: Remove from props or implement intended functionality

**Issue #R2-11: Unused Context Variable** 🟡 LOW
- **Line**: 200
- **Problem**: `webinarContext` assigned but never used
- **Fix**: Remove or use for conditional rendering

**Issue #R2-12: `any` Types in Event Handlers** 🟡 MEDIUM
- **Lines**: 270, 318, 326
- **Problem**: Event handler parameters typed as `any`
- **Fix**:
```typescript
// BEFORE
const handleChange = (e: any) => { ... }

// AFTER
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { ... }
```

---

### 2.5 Campaign [id] Route (`[id]/route.ts`)

**Status**: ✅ MOSTLY CLEAN

**Issue #R2-13: Single `any` Type** 🟡 LOW
- **Line**: 180
- **Problem**: Error parameter typed as `any`
- **Fix**:
```typescript
// BEFORE
} catch (error: any) {

// AFTER
} catch (error) {
  // TypeScript 4.0+ automatically types as unknown
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
}
```

---

## Part 3: De-enrollment V2 Script Analysis

**File**: `scripts/de-enroll-completed-leads-v2.ts`

**Status**: ✅ PRODUCTION READY (Excellent Architecture)

### Strengths:
- ✅ Comprehensive error handling
- ✅ Batch processing (configurable batch size)
- ✅ Checkpoint/resume capability (architecture in place)
- ✅ Row-level locking via database function
- ✅ Multi-client isolation
- ✅ Monitoring and alerting system
- ✅ Transaction safety
- ✅ Performance metrics logging
- ✅ Graceful timeout handling
- ✅ Health check system

### Architecture Review:

**Transaction Safety**: ✅ EXCELLENT
```typescript
// Line 261-330: Full ACID transaction for batch updates
const processed = await db.transaction(async (trx) => {
  // Update leads
  // Log actions
  // Update campaign stats
  return processedCount;
});
```

**Concurrency Safety**: ✅ EXCELLENT
- Uses database function `get_leads_for_de_enrollment()` with row locking
- Prevents race conditions between multiple cron job instances
- Database-level locks (not application-level)

**Performance**: ✅ WELL-OPTIMIZED
- Batch size: 100 leads (configurable)
- Max runtime: 4 minutes (leaving 1 min buffer for 5 min cron)
- Small delays between batches (100ms) to prevent DB overload
- Efficient composite indexes for queries

**Monitoring**: ✅ EXCELLENT
- De-enrollment run tracking table
- Individual lead processing logs
- Health check views
- Alert webhook integration
- Metric logging

### Minor Issues:

**Issue #R2-14: Resume Functionality Not Implemented** 🟡 LOW
- **Line**: 539, 560
- **Problem**: `--resume-run=xxx` flag documented but not implemented
- **Impact**: Manual recovery from failures requires starting from scratch
- **Status**: Architecture supports it (checkpointData field exists)
- **Priority**: LOW - Can implement when needed

**Issue #R2-15: No .env.example Documentation** 🟡 MEDIUM
- **Problem**: Script uses environment variables but no documentation exists
- **Variables Used**:
  - `DE_ENROLLMENT_BATCH_SIZE` (default: 100)
  - `DE_ENROLLMENT_MAX_RUNTIME` (default: 240000)
  - `DE_ENROLLMENT_ALERT_WEBHOOK`
  - `LOG_LEVEL` (default: 'info')
- **Fix**: Create `.env.example` with Phase 2 variables

---

## Part 4: Database Architecture Analysis

### 4.1 Migration Status

**Total Migrations**: 20+ SQL files in `migrations/`

**Phase 2 Migrations** (verified to exist):
- ✅ `0019_add_campaign_completion_tracking.sql`
- ✅ `0020_unify_campaign_model.sql` - Adds v2 fields to campaigns
- ✅ `0021_add_de_enrollment_monitoring.sql` - Adds monitoring tables and functions

### 4.2 Schema Consistency Check

**Status**: ⚠️ PARTIAL - Need to verify migrations applied

**Issue #R2-16: Migration Application Status Unknown** 🟡 MEDIUM
- **Problem**: Unclear if migrations 0019-0021 have been applied to production DB
- **Risk**: Schema.ts may be ahead of actual database
- **Critical Tables to Verify**:
  - `de_enrollment_runs` (from 0021)
  - `de_enrollment_lead_log` (from 0021)
  - `de_enrollment_health` view (from 0021)
  - Campaigns table v2 fields (from 0020)
- **Verification Needed**:
```sql
-- Check if monitoring tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('de_enrollment_runs', 'de_enrollment_lead_log');

-- Check if v2 fields exist on campaigns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'campaigns'
AND column_name IN ('is_active', 'active_leads_count', 'completed_leads_count');

-- Check if database function exists
SELECT routine_name FROM information_schema.routines
WHERE routine_name = 'get_leads_for_de_enrollment';
```

---

### 4.3 Index Analysis

**Status**: ✅ WELL-INDEXED (from migration 0021)

**Performance Indexes Added**:
- ✅ `idx_leads_de_enrollment_check` - Composite index for main query
- ✅ `idx_leads_campaign_link` - For campaign-based lookups
- ✅ `idx_campaigns_client_active` - For active campaign queries
- ✅ `idx_de_enrollment_runs_client_status` - For monitoring
- ✅ `idx_de_enrollment_runs_errors` - Partial index for failed runs

**Analysis**: Index strategy is sound for expected query patterns.

---

## Part 5: Security Analysis

### 5.1 Authentication & Authorization

**Status**: ✅ CONSISTENT

**Pattern Review** (from `[id]/route.ts`):
```typescript
// ✅ Good: Consistent auth check
const session = await getServerSession(authOptions);
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// ✅ Good: Role-based access control
if (!['SUPER_ADMIN', 'ADMIN', 'CLIENT_ADMIN', 'CLIENT', 'CLIENT_USER'].includes(session.user.role)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// ✅ Good: Client isolation check
if (session.user.role !== 'SUPER_ADMIN' && campaign.clientId !== session.user.clientId) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

**All Campaign Routes**: ✅ Implement this pattern consistently

---

### 5.2 Environment Variable Security

**Status**: ⚠️ NEEDS IMPROVEMENT

**Issue #R2-17: No .env.example File** 🟡 MEDIUM
- **Problem**: No documentation of required environment variables
- **Risk**: Deployment errors, security misconfigurations
- **Required Variables** (found in code):
  - `N8N_API_KEY` or `AUTOMATION_API_KEY` - Auto-create endpoint auth
  - `AZURE_OPENAI_KEY_FALLBACK` - Primary AI key
  - `AZURE_OPENAI_KEY` - Fallback AI key
  - `DE_ENROLLMENT_BATCH_SIZE` - Batch size for de-enrollment
  - `DE_ENROLLMENT_MAX_RUNTIME` - Max runtime in ms
  - `DE_ENROLLMENT_ALERT_WEBHOOK` - Alert webhook URL
  - `LOG_LEVEL` - Logging level
  - `RENDER_GIT_COMMIT` - Build ID tracking
  - `NODE_ENV` - Environment name

**Issue #R2-18: Unclear Environment Variable Precedence** 🟡 MEDIUM
- **Location**: `generate-message/route.ts:19-20`
- **Code**:
```typescript
const PRIMARY_KEY = process.env.AZURE_OPENAI_KEY_FALLBACK;
const FALLBACK_KEY = process.env.AZURE_OPENAI_KEY;
```
- **Problem**: Variable names are inverted (PRIMARY = FALLBACK?)
- **Confusion**: Which key should be configured first?
- **Fix**: Clarify naming or add comments

---

### 5.3 SQL Injection Risk

**Status**: ✅ SAFE

**Analysis**: All queries use parameterized SQL or Drizzle ORM
- ✅ Auto-create: Uses Drizzle `.insert().values()`
- ✅ Custom campaigns: Uses parameterized `sql` template
- ✅ De-enrollment: Uses parameterized `sql` template
- ✅ No raw string concatenation found

---

### 5.4 Rate Limiting

**Status**: ✅ IMPLEMENTED (Round 1)

**Auto-create endpoint**: ✅ 5 requests per 5 minutes per client
**Other endpoints**: ⚠️ No explicit rate limiting (rely on Next.js defaults)

**Issue #R2-19: No Rate Limiting on Other Campaign Endpoints** 🟡 MEDIUM
- **Problem**: Only auto-create has explicit rate limiting
- **Risk**: Custom campaign creation could be abused
- **Recommendation**: Add rate limiting to `/custom` endpoint
- **Priority**: MEDIUM - Can be addressed post-launch if needed

---

## Part 6: Error Handling Patterns

### 6.1 Global Error Handling

**Status**: ⚠️ INCONSISTENT

**Issue #R2-20: Inconsistent Error Response Format** 🟡 MEDIUM
- **Problem**: Error responses not standardized across routes
- **Examples**:
```typescript
// auto-create/route.ts
return NextResponse.json({ error: 'Unauthorized - Invalid API key' }, { status: 401 });

// [id]/route.ts
return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

// custom/route.ts (some places)
return NextResponse.json(
  { error: 'Failed to enroll leads', details: error.message },
  { status: 500 }
);
```
- **Recommendation**: Standardize error response shape:
```typescript
interface ErrorResponse {
  error: string;
  message?: string;
  details?: any;
  code?: string;
}
```

---

### 6.2 Logging Consistency

**Status**: ⚠️ MIXED

**Observation**:
- ✅ De-enrollment script: Excellent structured logging
- ⚠️ API routes: Basic `console.error()` and `console.log()`
- ⚠️ No centralized logger utility for API routes

**Issue #R2-21: No Centralized Logging for API Routes** 🟡 MEDIUM
- **Problem**: API routes use raw console.log/error
- **Impact**: Difficult to search/filter logs in production
- **Recommendation**: Create `@/lib/logger` utility like de-enrollment script
- **Priority**: MEDIUM - Important for production debugging

---

## Part 7: Testing Coverage

### 7.1 Test Files Found

**Status**: ⚠️ MINIMAL

**Files**:
- `tests/campaign-de-enrollment.test.ts` - Unit tests for de-enrollment

**Issue #R2-22: No Tests for API Routes** 🔴 HIGH
- **Problem**: Zero test coverage for:
  - Auto-create endpoint
  - Custom campaign endpoint
  - Campaign CRUD routes
  - Available tags endpoint
  - Generate message endpoint
- **Risk**: Cannot verify fixes, high regression risk
- **Impact**: CRITICAL for production deployment
- **Recommendation**: Add integration tests before production launch

**Critical Test Scenarios**:
1. Auto-create: Rate limiting, duplicate detection, error handling
2. Custom campaigns: Lead filtering, enrollment, transaction rollback
3. De-enrollment: Batch processing, concurrent runs, timeout handling
4. Authentication: Role-based access, client isolation

---

## Part 8: Production Readiness Checklist

### 8.1 Deployment Prerequisites

**Status**: ⚠️ NEEDS COMPLETION

✅ **Round 1 Critical Fixes**: All implemented
⚠️ **Code Quality**: ESLint issues need resolution
⚠️ **Testing**: No API route tests
⚠️ **Documentation**: No .env.example
⚠️ **Monitoring**: De-enrollment monitoring exists, API monitoring needs improvement
⚠️ **Error Handling**: Inconsistent patterns

---

### 8.2 Migration Application Plan

**CRITICAL PREREQUISITE**: Verify migrations applied to production DB

**Verification Steps**:
```bash
# 1. Check monitoring tables exist
psql $DATABASE_URL -c "SELECT * FROM de_enrollment_runs LIMIT 1;"

# 2. Check v2 campaign fields exist
psql $DATABASE_URL -c "SELECT is_active, active_leads_count FROM campaigns LIMIT 1;"

# 3. Check database function exists
psql $DATABASE_URL -c "SELECT get_leads_for_de_enrollment('00000000-0000-0000-0000-000000000000'::uuid, 1);"

# 4. List all applied migrations (if using migration tracking table)
psql $DATABASE_URL -c "SELECT * FROM schema_migrations ORDER BY version;"
```

**If Migrations NOT Applied**:
```bash
# Apply in order:
psql $DATABASE_URL < migrations/0019_add_campaign_completion_tracking.sql
psql $DATABASE_URL < migrations/0020_unify_campaign_model.sql
psql $DATABASE_URL < migrations/0021_add_de_enrollment_monitoring.sql
```

---

## Part 9: Priority Issue Summary

### 🔴 CRITICAL (Must Fix Before Production)

1. **#R2-22: No API Route Tests** - Zero test coverage for critical endpoints
2. **#R2-5: `any` Types in Custom Campaign Stats** - Data integrity risk

### 🟡 HIGH (Should Fix Before Production)

3. **#R2-1: Excessive `any` Type Usage** - 17 occurrences, type safety violations
4. **#R2-16: Migration Status Verification** - Must verify DB state before deployment
5. **#R2-17: No .env.example** - Deployment configuration risk

### 🟡 MEDIUM (Fix Soon After Production)

6. **#R2-2: Unused Variables** - 16 occurrences, code bloat
7. **#R2-4: Environment Variable Fallback Docs** - Configuration confusion
8. **#R2-7: Unused enrollmentTimedOut** - Missing timeout tracking?
9. **#R2-20: Inconsistent Error Responses** - User experience issue
10. **#R2-21: No Centralized API Logging** - Production debugging difficulty

### 🟢 LOW (Nice to Have)

11. **#R2-6, R2-8, R2-9, R2-10, R2-11, R2-12, R2-13**: Various cleanup issues
12. **#R2-14: Resume Functionality** - Can implement when needed
13. **#R2-19: Rate Limiting on Other Endpoints** - Can add if abuse detected

---

## Part 10: Recommendations

### Immediate Actions (Before Production Deploy):

1. **Fix All `any` Types** - Replace with proper TypeScript types
2. **Write Integration Tests** - At minimum: auto-create, custom campaign, de-enrollment
3. **Verify Database Migrations** - Confirm 0019-0021 applied to production
4. **Create .env.example** - Document all required environment variables
5. **Fix Unused enrollmentTimedOut** - Either use or remove this statistic

### Short-Term Improvements (Within 1 Week of Production):

6. **Standardize Error Responses** - Create consistent error shape
7. **Add Centralized Logger** - Implement structured logging for API routes
8. **Clean Up Unused Variables** - Remove all 16 unused imports/variables
9. **Add API Monitoring** - Track request rates, error rates, latency
10. **Document Environment Variable Precedence** - Clarify PRIMARY vs FALLBACK keys

### Long-Term Enhancements (Within 1 Month):

11. **Implement Resume Functionality** - Complete checkpoint/resume for de-enrollment
12. **Add Rate Limiting to All Endpoints** - Protect against abuse
13. **Add Health Check Alerts** - Automated alerts for stuck leads, failed runs
14. **Performance Testing** - Load test with 100k+ leads
15. **Add Observability** - Integrate with DataDog, Sentry, or similar

---

## Conclusion

**Overall Assessment**: ⚠️ **GOOD FOUNDATION, NEEDS POLISH**

**Strengths**:
- ✅ Round 1 critical fixes all successful
- ✅ De-enrollment V2 script is production-grade
- ✅ Security patterns (auth, SQL injection prevention) are solid
- ✅ Database architecture is well-designed
- ✅ Core functionality is sound

**Weaknesses**:
- ❌ No test coverage for API routes (CRITICAL)
- ⚠️ Type safety compromised by excessive `any` usage
- ⚠️ Code quality issues (unused variables, missing docs)
- ⚠️ Inconsistent error handling and logging patterns

**Recommendation**: **Fix critical issues (#R2-22, #R2-5) and verify migrations (#R2-16) before production deployment. Other issues can be addressed in follow-up releases.**

**Confidence Level**: 🟡 **MODERATE** - Architecture is solid, but lack of tests and type safety issues introduce risk. With critical fixes applied, system should be production-ready.

---

## Appendix A: ESLint Full Output

```
/uysp-client-portal/src/app/api/admin/campaigns/[id]/route.ts
  180:23  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

/uysp-client-portal/src/app/api/admin/campaigns/auto-create/route.ts
  31:6  warning  'AutoCreateInput' is defined but never used  @typescript-eslint/no-unused-vars

/uysp-client-portal/src/app/api/admin/campaigns/available-tags/route.ts
   5:29  warning  'leads' is defined but never used         @typescript-eslint/no-unused-vars
  69:13  error    Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  71:42  error    Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

/uysp-client-portal/src/app/api/admin/campaigns/custom/route.ts
    6:19  warning  'gte' is defined but never used                          @typescript-eslint/no-unused-vars
    6:24  warning  'lte' is defined but never used                          @typescript-eslint/no-unused-vars
    6:34  warning  'inArray' is defined but never used                      @typescript-eslint/no-unused-vars
  120:6   warning  'CreateCustomCampaignInput' is defined but never used    @typescript-eslint/no-unused-vars
  317:22  error    Unexpected any. Specify a different type                 @typescript-eslint/no-explicit-any
  318:22  error    Unexpected any. Specify a different type                 @typescript-eslint/no-explicit-any
  319:22  error    Unexpected any. Specify a different type                 @typescript-eslint/no-explicit-any
  320:22  error    Unexpected any. Specify a different type                 @typescript-eslint/no-explicit-any
  358:42  error    Unexpected any. Specify a different type                 @typescript-eslint/no-explicit-any
  359:43  error    Unexpected any. Specify a different type                 @typescript-eslint/no-explicit-any
  360:35  error    Unexpected any. Specify a different type                 @typescript-eslint/no-explicit-any
  361:11  warning  'enrollmentTimedOut' is assigned a value but never used  @typescript-eslint/no-unused-vars
  361:43  error    Unexpected any. Specify a different type                 @typescript-eslint/no-explicit-any
  363:28  error    Unexpected any. Specify a different type                 @typescript-eslint/no-explicit-any
  389:19  error    Unexpected any. Specify a different type                 @typescript-eslint/no-explicit-any
  431:7   error    Unexpected any. Specify a different type                 @typescript-eslint/no-explicit-any

/uysp-client-portal/src/app/api/admin/campaigns/preview-leads/route.ts
   6:15  warning  'eq' is defined but never used                 @typescript-eslint/no-unused-vars
   6:19  warning  'gte' is defined but never used                @typescript-eslint/no-unused-vars
   6:24  warning  'lte' is defined but never used                @typescript-eslint/no-unused-vars
   6:29  warning  'arrayContains' is defined but never used      @typescript-eslint/no-unused-vars
   6:44  warning  'or' is defined but never used                 @typescript-eslint/no-unused-vars
   6:53  warning  'inArray' is defined but never used            @typescript-eslint/no-unused-vars
  71:6   warning  'PreviewLeadsInput' is defined but never used  @typescript-eslint/no-unused-vars

/uysp-client-portal/src/components/admin/CampaignForm.tsx
   41:3   warning  'initialCampaignType' is assigned a value but never used  @typescript-eslint/no-unused-vars
  200:13  warning  'webinarContext' is assigned a value but never used       @typescript-eslint/no-unused-vars
  270:21  error    Unexpected any. Specify a different type                  @typescript-eslint/no-explicit-any
  318:21  error    Unexpected any. Specify a different type                  @typescript-eslint/no-explicit-any
  326:55  error    Unexpected any. Specify a different type                  @typescript-eslint/no-explicit-any

✖ 33 problems (17 errors, 16 warnings)
```

---

## Appendix B: Files Analyzed

### API Routes:
- `src/app/api/admin/campaigns/auto-create/route.ts` ✅
- `src/app/api/admin/campaigns/custom/route.ts` ⚠️
- `src/app/api/admin/campaigns/[id]/route.ts` ✅
- `src/app/api/admin/campaigns/available-tags/route.ts` ⚠️
- `src/app/api/admin/campaigns/preview-leads/route.ts` ⚠️
- `src/app/api/admin/campaigns/generate-message/route.ts` (not linted)
- `src/app/api/admin/campaigns/health/route.ts` (not linted)
- `src/app/api/admin/campaigns/pause/route.ts` (not linted)
- `src/app/api/admin/campaigns/route.ts` (not linted)

### Components:
- `src/components/admin/CampaignForm.tsx` ⚠️
- `src/components/admin/CampaignList.tsx` (not analyzed in detail)

### Scripts:
- `scripts/de-enroll-completed-leads-v2.ts` ✅

### Database:
- `src/lib/db/schema.ts` ✅
- `migrations/0019_add_campaign_completion_tracking.sql` ✅
- `migrations/0020_unify_campaign_model.sql` ✅
- `migrations/0021_add_de_enrollment_monitoring.sql` ✅

---

**End of Round 2 Forensic Audit**
