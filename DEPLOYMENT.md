# UYSP Portal - Deployment Guide

## 🚀 Quick Deployment (Steps You Must Do)

### Step 1: Run Database Migration (5 minutes)

The easiest way is to SSH into Render and run the migration there:

**Option A: Using Render Shell (Recommended)**
```bash
# 1. Go to Render Dashboard → uysp-portal-v2 → Shell tab
# 2. Run these commands in the Render shell:

npm run db:migrate

# You should see:
# ✅ Applying migrations...
# ✅ Migration 0003_easy_micromacro.sql complete!
```

**Option B: Using Local Script with Production Database**
```bash
# 1. Get DATABASE_URL from Render dashboard
# 2. In your local terminal:

cd /Users/latifhorst/cursor\ projects/UYSP\ Lead\ Qualification\ V1/uysp-client-portal

export DATABASE_URL='postgresql://uysp_client_portal_db_user:PuLMS841kifvBNpl3mGcLBl1WjIs0ey2@dpg-d3q9raodl3ps73bp1r50-a.virginia-postgres.render.com:5432/uysp_client_portal_db?sslmode=require'

./scripts/run-migration.sh
```

**Option C: Manual SQL (If other options fail)**
```bash
# 1. Go to Render Dashboard → Database → Query tab
# 2. Copy/paste the SQL from: src/lib/db/migrations/0003_easy_micromacro.sql
# 3. Click "Run Query"
```

---

### Step 2: Set CRON_SECRET Environment Variable (2 minutes)

**Where:** Render Dashboard → uysp-portal-v2 → Environment

**Add this variable:**
```
CRON_SECRET = <generate-a-secure-random-string>
```

**How to generate secure secret:**
```bash
# Option 1: Using openssl (Mac/Linux)
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Just use this pre-generated one:
CRON_SECRET=sk_live_uysp_cron_2025_a8f3b9c1e5d7f2a4b6c8d0e2f4a6b8c0
```

**Important:**
- Click "Save Changes"
- Wait for automatic redeploy (2-3 minutes)

---

### Step 3: Set Up Cron Job (3 minutes)

**Where:** Render Dashboard → Cron Jobs → New Cron Job

**Settings:**
```
Name: process-sync-queue
Command: curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://uysp-portal-v2.onrender.com/api/cron/process-sync-queue
Schedule: */5 * * * * (Every 5 minutes)
```

**Or use the render.yaml:**
```bash
# 1. Commit and push the render.yaml file (already done)
# 2. Go to Render Dashboard → uysp-portal-v2
# 3. Settings → "Use render.yaml for Configuration"
# 4. Click "Apply" - Render will auto-create the cron job
```

---

## ✅ Verification Steps

### 1. Check Migration Applied
```bash
# SSH into Render Shell and run:
psql $DATABASE_URL -c "\dt airtable_sync_queue"

# Should show:
#              List of relations
#  Schema |        Name          | Type  | Owner
# --------+----------------------+-------+-------
#  public | airtable_sync_queue  | table | user
```

### 2. Check CRON_SECRET Set
```bash
# In Render Shell:
echo $CRON_SECRET

# Should output your secret (not empty)
```

### 3. Test Sync Queue Endpoint
```bash
# From your browser (logged in as SUPER_ADMIN):
https://uysp-portal-v2.onrender.com/api/admin/sync-queue

# Should return JSON like:
{
  "stats": {
    "total": 0,
    "pending": 0,
    "processing": 0,
    "completed": 0,
    "failed": 0
  },
  "items": []
}
```

### 4. Manually Trigger Cron Job (Test)
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://uysp-portal-v2.onrender.com/api/cron/process-sync-queue

# Should return:
{
  "success": true,
  "processed": 0,
  "succeeded": 0,
  "failed": 0,
  "maxAttemptsReached": 0,
  "cleanedUp": 0
}
```

---

## 🔍 How to Monitor

### Check Sync Queue Health
**URL:** https://uysp-portal-v2.onrender.com/api/admin/sync-queue

**What to look for:**
- `pending`: Items waiting to be retried
- `failed`: Items that hit max retry attempts (needs investigation)
- `completed`: Successfully synced items (auto-deleted after 7 days)

### Check Render Logs
**Where:** Render Dashboard → uysp-portal-v2 → Logs

**Look for these messages:**
```
✅ [Sync Queue] Job complete: {"processed": 3, "succeeded": 2, "failed": 1}
⚠️ [Sync Queue] Retry scheduled in 10min: Tasks abc123
❌ [Sync Queue] Max attempts reached: Tasks xyz789
```

### Clear Old Items (Manual Cleanup)
```bash
# Clear all completed items
curl -X DELETE \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  "https://uysp-portal-v2.onrender.com/api/admin/sync-queue?status=completed"

# Clear all failed items (after fixing root cause)
curl -X DELETE \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  "https://uysp-portal-v2.onrender.com/api/admin/sync-queue?status=failed"
```

---

## 🐛 Troubleshooting

### "Migration failed: relation already exists"
**Solution:** Migration already applied, you're good! Skip step 1.

### "Unauthorized" when calling cron endpoint
**Solution:**
1. Check CRON_SECRET is set in Render
2. Make sure you're using the correct secret in Authorization header
3. Verify format: `Authorization: Bearer YOUR_SECRET` (with "Bearer" prefix)

### Cron job not running
**Solution:**
1. Check Render Dashboard → Cron Jobs → process-sync-queue → Logs
2. Verify schedule is `*/5 * * * *`
3. Check that CRON_SECRET matches between web service and cron job

### Tasks not being retried
**Solution:**
1. Check Render logs for Airtable errors
2. Verify sync queue has pending items: GET /api/admin/sync-queue
3. Manually trigger cron: `curl -X POST ...` (see verification steps)
4. Check AIRTABLE_API_KEY is still valid

---

## 📊 Architecture Overview

```
User Updates Task
      ↓
PostgreSQL (immediate) ✅
      ↓
Airtable API (background)
      ↓
   SUCCESS? ──── YES ──→ Done ✅
      ↓
     NO
      ↓
Add to Retry Queue 📋
      ↓
Wait 5 minutes ⏱️
      ↓
Cron Job Processes Queue
      ↓
Retry with Exponential Backoff
(5min → 10min → 20min → 40min → 80min)
      ↓
   SUCCESS? ──── YES ──→ Mark Complete ✅
      ↓
     NO
      ↓
Max Attempts (5)? ──── YES ──→ Mark Failed ❌
      ↓                           (Admin Investigation)
     NO
      ↓
Schedule Next Retry ⏱️
```

---

## 🎯 What This Fixes

### Before:
- Task updates → Airtable fails silently → Data never synced ❌
- No visibility into sync failures ❌
- Manual investigation required ❌

### After:
- Task updates → Airtable fails → Auto-retry 5 times ✅
- Admin can view all failed syncs ✅
- Self-healing with exponential backoff ✅
- Auto-cleanup of old items ✅

---

## 📞 Support

If you encounter issues:
1. Check Render logs first
2. Verify all environment variables are set
3. Test the endpoints manually with curl
4. Check database for pending items in sync queue

**Database Query to Check Queue:**
```sql
SELECT
  status,
  COUNT(*) as count,
  MAX(created_at) as last_created
FROM airtable_sync_queue
GROUP BY status;
```
