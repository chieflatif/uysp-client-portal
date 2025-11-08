# Mini-CRM Activity Logging - Deployment Checklist

**Purpose:** Step-by-step deployment guide for Mini-CRM foundation (Week 1)  
**Branch:** `feature/mini-crm-activity-logging`  
**Timeline:** 2-3 hours for complete staging deployment + testing

---

## 🔐 PRE-DEPLOYMENT: ENVIRONMENT SETUP

### Generate INTERNAL_API_KEY

```bash
# Generate strong random key
openssl rand -hex 32

# Example output: ba7215cec0979a098f9360ee19be7cdac4e0d382d4d2a7a4f81699fde9ad0be9
```

- [ ] Copy generated key to secure location
- [ ] Add to `.env.local`: `INTERNAL_API_KEY=<your-key-here>`
- [ ] Verify NOT committed to git: `git status` (should NOT show .env.local)

---

## 📦 STAGING DEPLOYMENT

### Step 1: Verify Code Ready

```bash
cd "/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal"

# Verify on correct branch
git branch --show-current
# Expected: feature/mini-crm-activity-logging

# Verify all commits present
git log --oneline -10
# Should show: Mini-CRM commits + forensic fixes

# Verify no uncommitted changes
git status
# Expected: nothing to commit, working tree clean
```

- [ ] On `feature/mini-crm-activity-logging` branch
- [ ] All changes committed
- [ ] Working tree clean

### Step 2: Merge to Main (or Staging Branch)

```bash
# Fetch latest main
git fetch origin main

# Check for conflicts
git diff origin/main..HEAD

# Merge to main (or create PR)
git checkout main
git pull origin main
git merge feature/mini-crm-activity-logging

# Or create PR via GitHub UI
```

- [ ] Branch merged to main
- [ ] No merge conflicts
- [ ] CI/CD pipeline triggered (if configured)

### Step 3: Configure Environment Variables on Render

1. Go to: https://dashboard.render.com → uysp-portal-v2 → Environment
2. Click "Add Environment Variable"
3. Key: `INTERNAL_API_KEY`
4. Value: `<paste-your-generated-key>`
5. Click "Save Changes"

- [ ] `INTERNAL_API_KEY` added to Render environment
- [ ] Render redeploy triggered

### Step 4: Wait for Deployment

Monitor: https://dashboard.render.com → uysp-portal-v2 → Events

- [ ] Build succeeded
- [ ] Deploy succeeded
- [ ] Service is "Live"

### Step 5: Apply Migrations

**Automatic (if Render configured to run migrations):**
```bash
# Check Render deploy logs for:
# "Running: npm run db:migrate" or similar
```

**Manual (if needed):**
```bash
# SSH into Render or run locally against staging DB
DATABASE_URL="<staging-db-url>" npm run db:push
```

**Verify migrations applied:**
```sql
-- Connect to staging database
psql $DATABASE_URL

-- Check migration table
SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at DESC LIMIT 3;
-- Expected: Rows for 0004_add_lead_activity_log and 0005_add_last_activity_at_index

-- Check table exists
\dt lead_activity_log
-- Expected: Table "lead_activity_log" exists

-- Check indexes
\d lead_activity_log
-- Expected: Shows 6 indexes
```

- [ ] Migration 0004 applied successfully
- [ ] Migration 0005 applied successfully
- [ ] `lead_activity_log` table exists
- [ ] All 6 indexes created
- [ ] `leads.last_activity_at` column exists
- [ ] Index on `last_activity_at` exists

---

## 🧪 POST-DEPLOYMENT: TESTING

### Test 1: Health Check Endpoint (No Auth)

```bash
curl https://uysp-portal-v2.onrender.com/api/internal/activity-health

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2025-11-08T...",
#   "stats": {
#     "events_last_hour": 0,
#     "total_events": 0
#   },
#   "last_event": null
# }
```

- [ ] Health check returns 200 OK
- [ ] Response shows `status: "healthy"`
- [ ] `total_events: 0` (table is empty)

### Test 2: Seed Test Data

```bash
# SSH to Render or run locally against staging DB
DATABASE_URL="<staging-db-url>" npx tsx scripts/seed-activity-log-test-data.ts

# Expected output:
# 🌱 Starting test data seeding...
# ✅ [1/15] MESSAGE_SENT - Test SMS sent to John Doe
# ✅ [2/15] MESSAGE_DELIVERED - SMS delivered successfully
# ...
# 🎉 Seeding complete! Inserted 15/15 test events
```

- [ ] Seeder runs without errors
- [ ] All 15 events inserted successfully
- [ ] Summary shows correct category counts

### Test 3: Verify Data in Database

```sql
-- Check data inserted
SELECT COUNT(*) FROM lead_activity_log;
-- Expected: 15

-- Check recent events
SELECT 
  event_type, 
  event_category, 
  description, 
  created_at 
FROM lead_activity_log 
ORDER BY created_at DESC 
LIMIT 5;

-- Expected: Shows 5 most recent test events
```

- [ ] 15 records in `lead_activity_log`
- [ ] Events have correct structure
- [ ] Timestamps look correct

### Test 4: Internal Logging API (With API Key)

```bash
curl -X POST https://uysp-portal-v2.onrender.com/api/internal/log-activity \
  -H "x-api-key: ${INTERNAL_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "MESSAGE_SENT",
    "eventCategory": "SMS",
    "leadAirtableId": "recTEST001",
    "description": "Deployment test SMS",
    "messageContent": "This is a deployment verification message",
    "metadata": {"test": true, "deployment": "staging"},
    "source": "test:deployment-verification",
    "timestamp": "2025-11-08T10:00:00Z"
  }'

# Expected response:
# {
#   "success": true,
#   "activityId": "uuid-...",
#   "timestamp": "2025-11-08T10:00:00.000Z",
#   "leadId": null
# }
```

- [ ] Returns 200 OK
- [ ] Returns `success: true`
- [ ] Returns `activityId` (UUID)
- [ ] `leadId` is `null` (lead doesn't exist yet)

**Test without API key:**
```bash
curl -X POST https://uysp-portal-v2.onrender.com/api/internal/log-activity \
  -H "Content-Type: application/json" \
  -d '{"eventType": "MESSAGE_SENT", ...}'

# Expected: 401 Unauthorized
```

- [ ] Returns 401 without API key
- [ ] Error message: "Unauthorized"

### Test 5: Admin Browse API (With Auth)

```bash
# Login to portal first to get session cookie
# Then:

curl "https://uysp-portal-v2.onrender.com/api/admin/activity-logs?page=1&limit=10" \
  -H "Cookie: <session-cookie>"

# Expected response:
# {
#   "activities": [...array of 10 events...],
#   "pagination": {
#     "page": 1,
#     "limit": 10,
#     "totalCount": 16,
#     "totalPages": 2,
#     "hasMore": true
#   }
# }
```

- [ ] Returns 200 OK with admin session
- [ ] Returns 401 without session
- [ ] Returns 403 with non-admin session
- [ ] Returns paginated results
- [ ] `totalCount` matches database (15 seed + 1 deployment test = 16)

**Test search:**
```bash
curl "https://uysp-portal-v2.onrender.com/api/admin/activity-logs?search=deployment" \
  -H "Cookie: <session-cookie>"

# Expected: Filters to events matching "deployment" (1 result)
```

- [ ] Search returns filtered results
- [ ] Full-text search works

**Test filters:**
```bash
curl "https://uysp-portal-v2.onrender.com/api/admin/activity-logs?eventCategory=SMS" \
  -H "Cookie: <session-cookie>"

# Expected: Only SMS events (should be 7 from seed data + 1 deployment test = 8)
```

- [ ] Filter by eventCategory works
- [ ] Count matches expected

### Test 6: Health Check (After Logging)

```bash
curl https://uysp-portal-v2.onrender.com/api/internal/activity-health

# Expected:
# {
#   "status": "healthy",
#   "stats": {
#     "events_last_hour": 1,
#     "total_events": 16
#   },
#   "last_event": {
#     "event_type": "MESSAGE_SENT",
#     "description": "Deployment test SMS",
#     "age_seconds": <some-number>
#   }
# }
```

- [ ] `total_events: 16` (15 seed + 1 deployment test)
- [ ] `last_event` shows deployment test
- [ ] `age_seconds` is reasonable

---

## 📊 VERIFICATION QUERIES

### Database Health Check

```sql
-- Check all indexes exist
SELECT 
  tablename, 
  indexname 
FROM pg_indexes 
WHERE tablename = 'lead_activity_log';

-- Expected 6 indexes:
-- idx_activity_lead_time
-- idx_activity_lead_airtable
-- idx_activity_event_type
-- idx_activity_event_category
-- idx_activity_timestamp
-- idx_activity_search

-- Check foreign keys
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'lead_activity_log';

-- Expected 3 foreign keys:
-- lead_id → leads.id
-- client_id → clients.id
-- created_by → users.id

-- Check sample data quality
SELECT 
  event_category,
  COUNT(*) as count
FROM lead_activity_log
GROUP BY event_category
ORDER BY count DESC;

-- Expected distribution:
-- SMS: 7
-- CAMPAIGN: 2
-- BOOKING: 2
-- MANUAL: 3
-- SYSTEM: 2
```

- [ ] All 6 indexes exist
- [ ] All 3 foreign keys exist
- [ ] Event distribution matches seed data

---

## ✅ DEPLOYMENT COMPLETE WHEN:

- [x] Code merged to main
- [x] Migrations applied
- [x] Environment variables set
- [x] Test data seeded
- [x] All 4 endpoints tested successfully
- [x] Database verified healthy
- [ ] Tests written (or decision documented)
- [ ] Stakeholder approval obtained

---

## 🚀 READY FOR WEEK 2?

**YES - if:**
1. All checkboxes above are ticked
2. Tests written OR deferred with documented decision
3. Staging deployment successful
4. No errors in production logs for 24 hours

**Week 2 starts with:** Instrumenting UYSP-Kajabi-SMS-Scheduler workflow

---

**Last Updated:** November 7, 2025  
**Status:** Deployment guide ready  
**Reference:** [FORENSIC-AUDIT-WEEK-1-FOUNDATION.md](./FORENSIC-AUDIT-WEEK-1-FOUNDATION.md)

