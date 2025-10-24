# 🚀 Copy/Paste Migration Commands for Render Shell

## Step 1: Run Migration in Render Shell

**Copy this entire command block and paste into Render Shell:**

```bash
psql $DATABASE_URL << 'EOF'
-- Create airtable_sync_queue table
CREATE TABLE IF NOT EXISTS "airtable_sync_queue" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "client_id" uuid NOT NULL,
    "table_name" varchar(100) NOT NULL,
    "record_id" varchar(100) NOT NULL,
    "operation" varchar(20) NOT NULL,
    "payload" jsonb NOT NULL,
    "status" varchar(50) DEFAULT 'pending' NOT NULL,
    "attempts" integer DEFAULT 0 NOT NULL,
    "max_attempts" integer DEFAULT 5 NOT NULL,
    "last_error" text,
    "last_attempt_at" timestamp,
    "next_retry_at" timestamp,
    "completed_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'airtable_sync_queue_client_id_clients_id_fk'
    ) THEN
        ALTER TABLE "airtable_sync_queue"
        ADD CONSTRAINT "airtable_sync_queue_client_id_clients_id_fk"
        FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id")
        ON DELETE cascade;
    END IF;
END $$;

-- Create indexes (only if not exists)
CREATE INDEX IF NOT EXISTS "idx_sync_queue_status"
ON "airtable_sync_queue" ("status","next_retry_at");

CREATE INDEX IF NOT EXISTS "idx_sync_queue_client"
ON "airtable_sync_queue" ("client_id","status");

CREATE INDEX IF NOT EXISTS "idx_sync_queue_created"
ON "airtable_sync_queue" ("created_at");

-- Verify
SELECT 'Migration Complete! ✅' as status;
\dt airtable_sync_queue
EOF
```

---

## Step 2: Verify Migration Succeeded

**You should see this output:**
```
       status
---------------------
 Migration Complete! ✅

                    List of relations
 Schema |         Name            | Type  |      Owner
--------+-------------------------+-------+------------------
 public | airtable_sync_queue     | table | uysp_portal_user
```

**If you see that** → ✅ Migration successful!

---

## Alternative: Run in Database Shell (If Render Shell doesn't work)

1. Go to Render Dashboard → **Databases** → Your PostgreSQL database
2. Click **"Shell"** (or "Connect" → "External Connection")
3. Paste the SQL between the `EOF` markers (lines 7-49 above)
4. Press Enter

---

## Verify Migration from Browser

After migration, test this URL (logged in as SUPER_ADMIN):
```
https://uysp-portal-v2.onrender.com/api/admin/sync-queue
```

**Expected response:**
```json
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

If you see that JSON → ✅ Everything is working perfectly!

---

## Troubleshooting

### Error: "permission denied"
**Solution:** Use the database shell instead of web service shell
- Render Dashboard → Databases → Your DB → Shell

### Error: "relation already exists"
**Solution:** Migration already applied! You're good, skip to Step 2 in main checklist.

### Error: "database not found"
**Solution:**
```bash
# Check DATABASE_URL is set:
echo $DATABASE_URL

# If empty, you're in the wrong shell. Use Database Shell instead.
```

---

## Quick Commands Reference

```bash
# Check if table exists
psql $DATABASE_URL -c "\dt airtable_sync_queue"

# Count rows in queue
psql $DATABASE_URL -c "SELECT COUNT(*) FROM airtable_sync_queue;"

# View queue stats by status
psql $DATABASE_URL -c "SELECT status, COUNT(*) FROM airtable_sync_queue GROUP BY status;"
```
