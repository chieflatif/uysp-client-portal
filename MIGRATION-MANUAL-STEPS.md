# 🎯 Run Migration Manually on Render (Easiest Path)

**Why Manual**: Drizzle-kit has SSL issues, but running SQL directly always works  
**Time**: 2 minutes  
**Risk**: LOW (all commands use IF NOT EXISTS)

---

## Step 1: Open Render Database Shell

1. Go to: https://dashboard.render.com
2. Find your PostgreSQL database: `uysp_client_portal_db`
3. Click on it
4. Click **"Connect"** → **"External Connection"** OR find the **"Shell"** tab

---

## Step 2: Copy the Migration SQL

**File**: `uysp-client-portal/migrations/0009_add_webinar_campaigns.sql`

I'll create a clean version for you to copy/paste.

---

## Step 3: Paste and Run

Just paste the entire SQL file into Render's SQL shell and execute.

**Expected Output**:
```
ALTER TABLE
CREATE INDEX
COMMENT
... (should see ~20+ success messages)
NOTICE: Migration 0009 completed successfully
```

---

## Step 4: Verify

Run this quick check in the same SQL shell:
```sql
-- Verify campaigns table has new columns
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'campaigns' 
AND column_name IN ('campaign_type', 'form_id', 'webinar_datetime');
```

**Expected**: Should return 3 rows (the 3 column names)

---

## ✅ After Migration

Once successful, come back and we'll test the sync from Next.js!

---

**Ready?** Open Render's database shell and I'll give you the SQL to paste!

