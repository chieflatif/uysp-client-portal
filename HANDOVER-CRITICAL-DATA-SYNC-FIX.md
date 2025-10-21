# CRITICAL HANDOVER: UYSP DATA SYNC ISSUE

**Date**: 2025-10-21  
**Status**: BLOCKER - Prevents all analytics from working  
**Severity**: CRITICAL

---

## THE PROBLEM (EXACT)

1. **UYSP has 11,046 leads in their Airtable base** (app4wIsBfpJTg7pWS)
2. **All their campaign data exists in Airtable**:
   - 2 SMS campaigns (e.g., "AI Webinar", etc.)
   - Every lead has: messages sent, campaign ID, variant (A/B test), stage, whether they booked, etc.
3. **The sync was broken** - hardcoded to REBEL HQ client ID (7a3ff4d5-aee5-46da-95d0-9f5e306bc649)
4. **Result**: UYSP data wasn't being synced to PostgreSQL database
5. **Analytics show ZERO** because the database is empty for UYSP

---

## WHAT WAS FIXED

✅ **Sync endpoint NOW accepts `clientId` parameter** (`/api/admin/sync`)
- No longer hardcoded to Rebel HQ
- Now looks up client's Airtable base ID from database
- Syncs data to the CORRECT client record

---

## WHAT STILL NEEDS TO HAPPEN (NEXT DEVELOPER)

### Step 1: Identify UYSP's Client ID in Database
```
SELECT id, companyName, airtableBaseId FROM clients WHERE companyName LIKE '%UYSP%';
```
- Get the actual UYSP client ID from PostgreSQL
- Verify their airtableBaseId is: `app4wIsBfpJTg7pWS`

### Step 2: Run the Sync
```bash
curl -X POST http://localhost:3006/api/admin/sync \
  -H "Content-Type: application/json" \
  -d '{"clientId": "<UYSP_CLIENT_ID>"}'
```

**This will:**
- Connect to UYSP's Airtable base (app4wIsBfpJTg7pWS)
- Pull all 11,046 leads
- Import all campaign data (SMS Campaign ID, variants, messages sent, stages, bookings)
- Populate PostgreSQL leads table with correct client assignment
- Analytics will then show actual data

### Step 3: Delete Rebel HQ Test Clients
- Delete all "Rebel HQ" client records (they're junk test data)
- Keep only UYSP as the real client
- Rebel HQ should only exist as SUPER_ADMIN role designation

### Step 4: Verify Analytics Work
- Click into UYSP client detail page
- Should see:
  - Database health showing 11,046 leads
  - 2 campaigns listed with actual stats
  - Campaign breakdown (total/active/paused/claimed/unclaimed)
  - Time period filtering works (All Time, Last 7 Days, Last 30 Days)
- Drill-down into each campaign shows correct metrics

---

## FILES MODIFIED

1. **`/src/app/api/admin/sync/route.ts`** - FIXED
   - Now accepts `clientId` in request body
   - Uses client's configured Airtable base ID
   - No longer hardcoded

2. **`/src/app/(client)/admin/clients/[id]/page.tsx`** - ADDED
   - Client detail page with:
     - Database health section (5 metrics: total/active/paused/claimed/unclaimed)
     - Recent activity log
     - Campaigns analytics table
     - Time period filtering (All Time, 7d, 30d)
     - Users management
     - Deactivate Client button (NOW WORKS - uses getServerSession)
     - Pause Campaigns button

3. **`/src/app/api/admin/clients/[id]/health/route.ts`** - ADDED
   - Fetch per-client database health
   - Shows sync status and recent activity

4. **`/src/app/api/admin/clients/[id]/campaigns/route.ts`** - ADDED
   - Fetch campaigns with analytics for a client
   - Supports time period filtering

5. **`/src/app/api/admin/clients/[id]/deactivate/route.ts`** - FIXED
   - Changed from `auth()` to `getServerSession` for consistency
   - Now works properly

---

## WHAT THE USER NEEDS

> "I need to see UYSP's actual data. They have 2 campaigns with messages sent, stages, variants, everything in Airtable. Once the data syncs to the database, I can drill down from the super admin dashboard to see each client, then see their campaigns, then see campaign-specific analytics. The database health should show sync status and recent activity."

**Current State**: Data exists in Airtable but isn't in PostgreSQL  
**Target State**: Data synced to PostgreSQL, analytics working, drill-down functional

---

## TECHNICAL DETAILS

**UYSP Airtable Base ID**: app4wIsBfpJTg7pWS  
**Airtable Leads Table Fields Being Synced**:
- SMS Campaign ID (mapped to `campaignName`)
- SMS Variant (A/B test)
- SMS Sent Count
- Processing Status
- Booked (yes/no)
- All lead contact info (name, email, phone, company, etc.)

**Database Schema**: PostgreSQL `leads` table with clientId foreign key
**Sync Logic**: Airtable record → Database lead record with correct clientId assignment

---

## TESTING CHECKLIST FOR NEXT DEVELOPER

- [ ] Query database: confirm UYSP client exists with airtableBaseId = app4wIsBfpJTg7pWS
- [ ] Call POST /api/admin/sync with UYSP's clientId
- [ ] Verify response shows: totalFetched=11046, totalInserted=X, totalUpdated=Y
- [ ] Check PostgreSQL: `SELECT COUNT(*) FROM leads WHERE clientId = '<UYSP_ID>'` should be ~11046
- [ ] Check campaigns: `SELECT DISTINCT campaignName FROM leads WHERE clientId = '<UYSP_ID>'` should show 2 campaigns
- [ ] Login to super admin dashboard
- [ ] Navigate to UYSP client detail page
- [ ] Verify campaigns table shows 2 campaigns with actual statistics
- [ ] Test time period filtering (All Time, 7d, 30d)
- [ ] Verify Database Health section shows:
  - Total leads: 11046
  - Active/Paused/Claimed/Unclaimed breakdown
  - Last sync timestamp
  - Recent activity log

---

## DONE (DO NOT REDO)

✅ Admin API endpoints built (create/deactivate client, pause campaigns, etc.)  
✅ Client detail page UI created  
✅ Database health visualization  
✅ Campaigns analytics table with time period filtering  
✅ Deactivate button fixed  
✅ Sync endpoint made dynamic (no longer hardcoded)

---

## CRITICAL ISSUE SUMMARY

**Before**: Sync hardcoded to Rebel HQ → UYSP data never synced → Analytics empty  
**After Fix**: Sync accepts clientId parameter → Can sync any client's data → Analytics will work

**One command needed**: `POST /api/admin/sync with UYSP's clientId`  
**Result**: 11,046 UYSP leads populate in database + 2 campaigns show with real metrics

