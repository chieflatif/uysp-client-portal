# Mini-CRM Activity Logging - Deployment Checklist

**Status:** ✅ READY FOR STAGING DEPLOYMENT
**Date:** November 7, 2025
**Phase:** Week 1 Complete - Ready for Week 2

---

## Pre-Deployment Verification

### ✅ Code Quality Checks

- [x] All CRITICAL fixes applied (1/1)
- [x] All HIGH priority fixes applied (5/5)
- [x] MEDIUM priority enhancements applied (5/8)
- [x] Integration tests written (4 test files, 1484 lines)
- [x] All commits on feature branch
- [x] No merge conflicts with main

### ✅ Documentation Complete

- [x] PRD in correct location: [docs/PRD-MINI-CRM-ACTIVITY-LOGGING.md](PRD-MINI-CRM-ACTIVITY-LOGGING.md)
- [x] Forensic audit fixes documented: [docs/implementation/forensic-audit-fixes-complete.md](forensic-audit-fixes-complete.md)
- [x] Timezone conventions documented: [docs/implementation/timezone-handling-convention.md](timezone-handling-convention.md)
- [x] Week 1 completion report: [docs/implementation/mini-crm-week-1-complete.md](mini-crm-week-1-complete.md)

---

## Environment Setup

### 1. Generate INTERNAL_API_KEY

```bash
# Generate secure 256-bit key
openssl rand -hex 32

# Example output (DO NOT USE THIS - generate your own):
# 0df966e35dd00a3c702243baef744fce3cc2483e8e8a3c41d12d7417730de3e8
```

**CRITICAL:** Generate a NEW key for each environment (staging, production)

### 2. Set Environment Variables

**Required Variables:**

```bash
# Staging Environment (.env.staging)
INTERNAL_API_KEY="<your-generated-key-from-step-1>"
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="https://staging.example.com"
```

**Render Dashboard Steps:**
1. Go to https://dashboard.render.com
2. Select your service
3. Navigate to "Environment" tab
4. Add `INTERNAL_API_KEY` variable
5. Click "Save Changes"
6. Service will automatically redeploy

**Local Development (.env.local):**

```bash
# For testing API endpoints locally
INTERNAL_API_KEY="local-dev-key-for-testing-only"
DATABASE_URL="postgresql://localhost:5432/uysp_dev"
```

---

## Database Migration

### 1. Verify Current Schema

```bash
cd uysp-client-portal

# Check current migrations
ls -la src/lib/db/migrations/

# Should see:
# 0004_add_lead_activity_log.sql (main schema + indexes)
# 0005_add_last_activity_at_index.sql (performance fix)
```

### 2. Apply Migrations to Staging

**Option A: Using Drizzle Kit (Recommended)**

```bash
# Set staging database URL
export DATABASE_URL="postgresql://staging-db-url"

# Push schema changes
npx drizzle-kit push:pg

# Verify migrations applied
psql $DATABASE_URL -c "\d lead_activity_log"
psql $DATABASE_URL -c "\d+ leads" | grep last_activity_at
```

**Option B: Manual SQL (If Drizzle fails)**

```bash
# Connect to staging database
psql $DATABASE_URL

# Run migrations manually
\i src/lib/db/migrations/0004_add_lead_activity_log.sql
\i src/lib/db/migrations/0005_add_last_activity_at_index.sql

# Verify tables
\dt
\d lead_activity_log
```

### 3. Verify Schema

```sql
-- Check lead_activity_log table exists
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_name = 'lead_activity_log';

-- Check indexes exist
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'lead_activity_log';

-- Should see 6 indexes:
-- 1. idx_activity_lead_time (lead_id, timestamp)
-- 2. idx_activity_lead_airtable (lead_airtable_id)
-- 3. idx_activity_event_type (event_type)
-- 4. idx_activity_event_category (event_category)
-- 5. idx_activity_timestamp (timestamp)
-- 6. idx_activity_search (GIN full-text search)

-- Check last_activity_at column exists on leads
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'leads' AND column_name = 'last_activity_at';

-- Check last_activity_at index exists
SELECT indexname FROM pg_indexes
WHERE tablename = 'leads' AND indexname = 'idx_leads_last_activity_at';
```

---

## Deployment Steps

### 1. Deploy to Staging

```bash
cd uysp-client-portal

# Ensure on feature branch
git checkout feature/mini-crm-activity-logging

# Push to trigger deployment
git push origin feature/mini-crm-activity-logging

# Render will automatically deploy
# Monitor at: https://dashboard.render.com
```

### 2. Wait for Deployment

- Build time: ~5-10 minutes
- Watch logs in Render dashboard
- Look for: "Server started successfully"

### 3. Verify Deployment

**A. Health Check (First thing to verify)**

```bash
# Should return {"status":"healthy",...}
curl https://staging.example.com/api/internal/activity-health

# Expected response:
{
  "status": "healthy",
  "totalEvents": 0,  # Will be 0 until activities logged
  "lastEvent": null  # Will be null initially
}
```

If health check fails:
- Check database connection
- Check migrations ran successfully
- Check application logs in Render

**B. API Key Validation**

```bash
# Should fail with 401 (no key provided)
curl -X POST https://staging.example.com/api/internal/log-activity \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected: {"error":"Unauthorized"}

# Should fail with 401 (invalid key)
curl -X POST https://staging.example.com/api/internal/log-activity \
  -H "Content-Type: application/json" \
  -H "x-api-key: invalid-key" \
  -d '{}'

# Expected: {"error":"Unauthorized"}
```

**C. Database Connectivity**

```sql
-- Connect to staging database
psql $STAGING_DATABASE_URL

-- Verify tables exist
SELECT COUNT(*) FROM lead_activity_log;
-- Should return 0 (no activities yet)

SELECT COUNT(*) FROM leads;
-- Should return count of existing leads
```

---

## Seed Test Data (Optional but Recommended)

### 1. Run Test Data Seeder

```bash
cd uysp-client-portal

# Set staging database URL
export DATABASE_URL="postgresql://staging-db-url"

# Run seeder script
npx tsx scripts/seed-activity-log-test-data.ts

# Expected output:
# ✅ Created 15 test activities across 6 categories
# Test data ready for verification
```

### 2. Verify Test Data

```bash
# Health check should now show events
curl https://staging.example.com/api/internal/activity-health

# Expected:
{
  "status": "healthy",
  "totalEvents": 15,  # Test activities
  "lastEvent": {
    "id": "...",
    "eventType": "...",
    "timestamp": "..."
  }
}
```

```sql
-- Query test data directly
psql $STAGING_DATABASE_URL

SELECT event_type, event_category, COUNT(*)
FROM lead_activity_log
GROUP BY event_type, event_category
ORDER BY event_category, event_type;

-- Should see 15 events across 6 categories
```

---

## Integration Testing on Staging

### 1. Test Internal Logging API

```bash
# Use the INTERNAL_API_KEY from environment
export API_KEY="<your-staging-internal-api-key>"
export STAGING_URL="https://staging.example.com"

# Test valid event logging
curl -X POST $STAGING_URL/api/internal/log-activity \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "eventType": "MESSAGE_SENT",
    "eventCategory": "SMS",
    "leadAirtableId": "recTestStaging",
    "description": "Test SMS from staging deployment",
    "messageContent": "This is a test message",
    "source": "staging:deployment-test"
  }'

# Expected: {"success":true,"activityId":"...","timestamp":"..."}
```

### 2. Test Event Type Validation (MEDIUM-005 Fix)

```bash
# Test invalid event type
curl -X POST $STAGING_URL/api/internal/log-activity \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "eventType": "INVALID_TYPE",
    "eventCategory": "SMS",
    "leadAirtableId": "recTest",
    "description": "Test",
    "source": "test"
  }'

# Expected: 400 Bad Request
# {"error":"Invalid eventType","provided":"INVALID_TYPE","validTypes":[...]}
```

### 3. Test SQL Injection Prevention (HIGH-004 Fix)

```bash
# Test malicious date filter (should be safely rejected)
curl "$STAGING_URL/api/admin/activity-logs?dateFrom=2025-11-01'%20OR%20'1'='1"

# Expected: 401 (unauthenticated) or 400 (invalid date)
# Should NOT return 500 (SQL injection prevented)
```

### 4. Test Client Isolation (HIGH-002 Fix)

**This requires authenticated sessions - manual test via UI:**

1. Log in as User A (Client A)
2. Try to access Client B's lead timeline: `/api/leads/<client-b-lead-id>/activity`
3. Expected: 403 Forbidden

### 5. Test Pagination (MEDIUM-004 Fix)

```bash
# Test pagination on lead timeline
curl "$STAGING_URL/api/leads/<valid-lead-id>/activity?page=1&limit=10" \
  -H "Cookie: <session-cookie>"

# Expected:
{
  "timeline": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalCount": ...,
    "totalPages": ...,
    "hasMore": ...
  }
}
```

---

## Monitoring Setup

### 1. Add Health Check to Monitoring System

**UptimeRobot / Pingdom / Similar:**

- URL: `https://staging.example.com/api/internal/activity-health`
- Method: GET
- Expected status: 200
- Expected response: Contains `"status":"healthy"`
- Check interval: 5 minutes
- Alert if: Status ≠ 200 or timeout > 10 seconds

### 2. Log Monitoring

**Check Render logs for:**

```bash
# Good signs:
[LOG-ACTIVITY] Activity logged: ...
[LEAD-ACTIVITY] Fetching timeline for lead: ...
[ADMIN-ACTIVITY-LOGS] Query params: ...

# Bad signs:
[LOG-ACTIVITY] CRITICAL: INTERNAL_API_KEY environment variable is not set!
[LOG-ACTIVITY] Unauthorized: Invalid or missing API key
[LEAD-ACTIVITY] Forbidden: User attempted to access lead from different client
```

### 3. Database Query Performance

```sql
-- Monitor activity log growth
SELECT
  DATE(timestamp) as date,
  event_category,
  COUNT(*) as event_count
FROM lead_activity_log
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY DATE(timestamp), event_category
ORDER BY date DESC, event_category;

-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename = 'lead_activity_log'
ORDER BY idx_scan DESC;
```

---

## Rollback Plan

### If Deployment Fails

**Option 1: Revert to Previous Deploy (Render)**

1. Go to Render Dashboard
2. Click on your service
3. Navigate to "Events" tab
4. Find last successful deployment
5. Click "Rollback to this version"

**Option 2: Revert Git Branch**

```bash
# Switch back to main branch
git checkout main

# Force push to trigger redeploy
git push origin main --force

# Render will deploy main branch
```

### If Database Migration Fails

**DO NOT manually drop tables.** Instead:

```sql
-- Verify what failed
SELECT * FROM information_schema.tables WHERE table_name = 'lead_activity_log';

-- If table exists but has issues, check logs
SELECT * FROM pg_stat_activity WHERE query LIKE '%lead_activity_log%';

-- If needed, contact DBA or escalate
```

---

## Week 2 Readiness Checklist

### ✅ Before Starting Week 2 n8n Instrumentation

- [ ] Staging deployment successful
- [ ] Health check returns healthy
- [ ] Test data seeded and visible
- [ ] All 4 API endpoints verified working
- [ ] INTERNAL_API_KEY configured in Render
- [ ] Monitoring added to UptimeRobot/similar
- [ ] Team has access to staging environment
- [ ] Documentation reviewed and approved

### 📝 Handoff to Week 2

**Ready for:**
1. Instrumenting Kajabi SMS Scheduler workflow
2. Instrumenting Calendly booking workflow
3. Instrumenting SMS reply handler workflow
4. Instrumenting delivery status workflow

**Each workflow will:**
- Call `POST /api/internal/log-activity` with appropriate event types
- Include retry logic (3 attempts)
- Fall back to Retry_Queue (Airtable) on failure
- Include n8n execution ID for traceability

---

## Troubleshooting Guide

### Issue: Health Check Returns 500

**Causes:**
- Database connection failed
- Migrations not applied
- Environment variables missing

**Fix:**
```bash
# Check database connection
psql $DATABASE_URL -c "SELECT 1"

# Check environment variables
curl https://staging.example.com/api/internal/activity-health

# Check Render logs
# Look for database connection errors
```

### Issue: API Key Always Rejected

**Causes:**
- INTERNAL_API_KEY not set in Render
- Key has trailing spaces/newlines
- Service didn't restart after env var added

**Fix:**
1. Check environment variable in Render dashboard
2. Ensure no extra characters in key
3. Trigger manual redeploy in Render

### Issue: Activities Not Appearing

**Causes:**
- Wrong event type/category (validation rejection)
- Lead not yet synced to PostgreSQL
- Database write permissions issue

**Fix:**
```sql
-- Check for recent activities
SELECT * FROM lead_activity_log
ORDER BY created_at DESC
LIMIT 10;

-- Check for validation errors in logs
# Render logs will show: [LOG-ACTIVITY] Invalid eventType...
```

### Issue: Tests Fail Locally

**Causes:**
- Database not running
- `.env.local` missing
- INTERNAL_API_KEY not set
- Node modules need reinstall

**Fix:**
```bash
# Check database
psql $DATABASE_URL -c "SELECT 1"

# Check env file
cat .env.local | grep INTERNAL_API_KEY

# Reinstall dependencies
npm install

# Run migrations
npx drizzle-kit push:pg

# Try tests again
npm run test:integration
```

---

## Post-Deployment Verification (24 Hours)

### Day 1 Checks

- [ ] Health check still returning healthy
- [ ] No 500 errors in logs
- [ ] Database queries performing well (check indexes)
- [ ] No security alerts (unauthorized access attempts)

### Week 1 Checks

- [ ] Activity log growing as expected
- [ ] No memory leaks (check Render metrics)
- [ ] Database size acceptable (<1GB for 10k activities)
- [ ] All event types being used

---

## Success Criteria

### ✅ Deployment is Successful When:

1. Health check returns `{"status":"healthy"}`
2. Can log test activity via API
3. Can query activities from database
4. All security fixes verified (client isolation, SQL injection prevention)
5. Performance acceptable (queries < 100ms)
6. No errors in logs for 24 hours
7. Monitoring alerts configured
8. Team trained on new system

---

## Support & Escalation

**For Issues:**
1. Check this document first
2. Check Render logs
3. Check database connectivity
4. Review forensic audit fixes: [forensic-audit-fixes-complete.md](forensic-audit-fixes-complete.md)
5. If still stuck, escalate with:
   - Error message
   - Render logs (last 100 lines)
   - Database query results
   - Environment variable verification

**Emergency Rollback:**
Contact Render support or DBA immediately if:
- Database corruption suspected
- Security breach detected
- Complete service failure (>15 minutes down)

---

**Status:** ✅ READY FOR STAGING DEPLOYMENT
**Next Step:** Execute "Deployment Steps" section above
**Estimated Time:** 30-60 minutes for full deployment and verification

---

**Last Updated:** November 7, 2025
**Version:** 1.0
**Approved By:** User (Latif)

