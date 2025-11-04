# 🚀 Run Migration on Production - Quick Guide

**Date**: 2025-11-03  
**Migration**: 0009_add_webinar_campaigns  
**Risk**: LOW (backward compatible, all IF NOT EXISTS)

---

## Step 1: Add SSL to DATABASE_URL

**Edit**: `uysp-client-portal/.env.local`

**Find the line**:
```bash
DATABASE_URL="postgresql://..."
```

**Add `?sslmode=require` at the end**:
```bash
DATABASE_URL="postgresql://user:pass@host:5432/dbname?sslmode=require"
```

**Save the file.**

---

## Step 2: Run Migration

```bash
cd uysp-client-portal
npx drizzle-kit push
```

**Expected Output**:
```
✓ Pulling schema from database...
✓ Applying changes...
✓ Changes applied successfully
```

---

## Step 3: Verify Migration

You should see something like:
```
[✓] Added column "campaign_type" to "campaigns"
[✓] Added column "form_id" to "campaigns"
[✓] Added column "webinar_datetime" to "campaigns"
... (14 total column additions)
[✓] Created index "idx_campaigns_form_id"
[✓] Created constraint "campaigns_airtable_record_id_unique"
```

---

## Step 4: Test Sync

After migration succeeds:

### Via Admin Portal (Easiest)
1. Run dev server: `npm run dev`
2. Open: http://localhost:3000/admin
3. Click "Sync" button
4. Check response includes: `campaigns: { synced: 1, errors: 0 }`

### Via API (Alternative)
```bash
curl -X POST http://localhost:3000/api/admin/sync \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"clientId": "YOUR_CLIENT_ID"}'
```

---

## ✅ Success Indicators

Migration succeeded if:
- ✅ No errors during `drizzle-kit push`
- ✅ Sync returns `campaigns: { synced: 1, errors: 0 }`
- ✅ Test campaign appears in PostgreSQL

---

## 🚨 If Something Goes Wrong

**Migration is safe** - all changes use `IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS`.

**Worst case**: Columns already exist → No-op (safe)

**Rollback** (if needed):
```sql
-- Remove webinar columns (probably won't need this)
ALTER TABLE campaigns DROP COLUMN campaign_type CASCADE;
ALTER TABLE leads DROP COLUMN lead_source CASCADE;
-- ... etc
```

---

**Ready?** Just add `?sslmode=require` to your DATABASE_URL and run `npx drizzle-kit push`!

