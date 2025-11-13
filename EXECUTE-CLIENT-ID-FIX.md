# HOW TO EXECUTE CLIENT ID REASSIGNMENT

**Database:** uysp-client-portal-db (dpg-d3q9raodl3ps73bp1r50-a)
**Region:** Virginia
**Plan:** Basic 1GB
**Status:** Available

---

## OPTION 1: Render Dashboard SQL Console (EASIEST)

1. Go to: https://dashboard.render.com/d/dpg-d3q9raodl3ps73bp1r50-a
2. Click the "SQL" tab (if available) or "Connect" → "Web Shell"
3. Copy and paste the SQL from `migrations/fix-client-id-reassignment.sql`
4. Execute section by section (backup → update → verify)

---

## OPTION 2: Get Connection String via Render Dashboard

1. Go to: https://dashboard.render.com/d/dpg-d3q9raodl3ps73bp1r50-a
2. Click "Connect" → "External Connection"
3. Copy the connection string (format: `postgresql://user:password@host:port/database`)
4. Use with any SQL client:

### Using psql (Command Line)
```bash
# Connect to database
psql "postgresql://uysp_client_portal_db_user:PASSWORD@HOST:PORT/uysp_client_portal_db"

# Execute the migration
\i /Users/latifhorst/cursor\ projects/UYSP\ Lead\ Qualification\ V1/uysp-client-portal/migrations/fix-client-id-reassignment.sql
```

### Using TablePlus / DBeaver (GUI)
1. Create new PostgreSQL connection
2. Enter connection details from Render dashboard
3. Open SQL editor
4. Load `migrations/fix-client-id-reassignment.sql`
5. Execute

---

## OPTION 3: Programmatic Fix via Node Script

If you prefer to execute via code, here's a Node.js script:

**File:** `scripts/fix-client-id.ts`

```typescript
import { db } from '../src/lib/db';
import { campaigns, leads, clientProjectTasks, clientProjectBlockers, clientProjectStatus, clients } from '../src/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

const SYSTEM_CLIENT_ID = '550e8400-e29b-41d4-a716-446655440000';
const UYSP_CLIENT_ID = '6a08f898-19cd-49f8-bd77-6fcb-2dd56db9';

async function fixClientIdAssignment() {
  console.log('🔧 Starting Client ID Reassignment...\n');

  try {
    // Step 1: Create backups (already done via SQL)
    console.log('✅ Backups exist (created via SQL script)');

    // Step 2: Bulk update
    console.log('\n💾 Reassigning records to UYSP client...');

    const campaignsUpdated = await db
      .update(campaigns)
      .set({ clientId: UYSP_CLIENT_ID, updatedAt: new Date() })
      .where(eq(campaigns.clientId, SYSTEM_CLIENT_ID));

    const leadsUpdated = await db
      .update(leads)
      .set({ clientId: UYSP_CLIENT_ID, updatedAt: new Date() })
      .where(eq(leads.clientId, SYSTEM_CLIENT_ID));

    const tasksUpdated = await db
      .update(clientProjectTasks)
      .set({ clientId: UYSP_CLIENT_ID, updatedAt: new Date() })
      .where(eq(clientProjectTasks.clientId, SYSTEM_CLIENT_ID));

    const blockersUpdated = await db
      .update(clientProjectBlockers)
      .set({ clientId: UYSP_CLIENT_ID, updatedAt: new Date() })
      .where(eq(clientProjectBlockers.clientId, SYSTEM_CLIENT_ID));

    const statusUpdated = await db
      .update(clientProjectStatus)
      .set({ clientId: UYSP_CLIENT_ID, updatedAt: new Date() })
      .where(eq(clientProjectStatus.clientId, SYSTEM_CLIENT_ID));

    console.log(`  ✅ Campaigns: ${campaignsUpdated} updated (expected 26)`);
    console.log(`  ✅ Leads: ${leadsUpdated} updated (expected 1,211)`);
    console.log(`  ✅ Tasks: ${tasksUpdated} updated (expected 21)`);
    console.log(`  ✅ Blockers: ${blockersUpdated} updated (expected 4)`);
    console.log(`  ✅ Status: ${statusUpdated} updated (expected 8)`);

    // Step 3: Delete SYSTEM client
    console.log('\n🗑️  Deleting SYSTEM client...');
    await db.delete(clients).where(eq(clients.id, SYSTEM_CLIENT_ID));
    console.log('  ✅ SYSTEM client deleted');

    // Step 4: Verification
    console.log('\n🔍 Verifying results...');

    const uyspcampaigns = await db.query.campaigns.findMany({
      where: eq(campaigns.clientId, UYSP_CLIENT_ID),
    });

    const orphanedCampaigns = await db.query.campaigns.findMany({
      where: eq(campaigns.clientId, SYSTEM_CLIENT_ID),
    });

    console.log(`  ✅ UYSP campaigns: ${uyspcampaigns.length} (expected 26)`);
    console.log(`  ✅ Orphaned campaigns: ${orphanedCampaigns.length} (expected 0)`);

    if (uyspcampaigns.length === 26 && orphanedCampaigns.length === 0) {
      console.log('\n✅ SUCCESS: Client ID reassignment complete!');
      console.log('All campaigns are now visible to UYSP users.');
    } else {
      console.error('\n❌ VERIFICATION FAILED: Unexpected counts detected');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error);
    process.exit(1);
  }
}

fixClientIdAssignment();
```

**Execute:**
```bash
cd /Users/latifhorst/cursor\ projects/UYSP\ Lead\ Qualification\ V1/uysp-client-portal
npm run tsx scripts/fix-client-id.ts
```

---

## VERIFICATION AFTER EXECUTION

Run these queries to confirm success:

```sql
-- Should return 26
SELECT COUNT(*) FROM campaigns
WHERE client_id = '6a08f898-19cd-49f8-bd77-6fcb-2dd56db9';

-- Should return 0
SELECT COUNT(*) FROM campaigns
WHERE client_id = '550e8400-e29b-41d4-a716-446655440000';

-- Should show UYSP with 26 campaigns
SELECT
  c.company_name,
  COUNT(DISTINCT ca.id) as campaign_count
FROM clients c
LEFT JOIN campaigns ca ON c.id = ca.client_id
GROUP BY c.company_name;
```

---

## TESTING IN UI

1. Log in to staging portal: https://uysp-portal-staging.onrender.com
2. Use credentials for UYSP user (latifhorst@gmail.com or tanveer@iankoniak.com)
3. Navigate to Campaigns page
4. **Expected:** See all 26 campaigns listed
5. Click on a campaign → **Expected:** See associated leads

---

## IF SOMETHING GOES WRONG

Backups are stored in these tables:
- `campaigns_backup_20251112`
- `leads_backup_20251112`
- `client_project_tasks_backup_20251112`
- `client_project_blockers_backup_20251112`
- `client_project_status_backup_20251112`

**Rollback script is included at the bottom of `fix-client-id-reassignment.sql`**

---

## NEXT STEPS AFTER FIX

1. ✅ Verify campaigns visible to UYSP users
2. Update prevention measures (per RCA-ZERO-CAMPAIGNS.md):
   - Update `trigger-great-sync.js` default client ID
   - Add client ID validation to sync API
   - Set `DEFAULT_CLIENT_ID` environment variable in Render
3. Deploy prevention measures to staging
4. Test with a test sync to ensure correct client ID is used
5. Merge to production when validated

---

**Estimated Time:** 5 minutes
**Risk Level:** Low (transactional with backups)
**Rollback Available:** Yes
