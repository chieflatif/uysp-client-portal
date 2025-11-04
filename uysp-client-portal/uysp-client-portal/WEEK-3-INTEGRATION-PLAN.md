# 🔗 Week 3 Integration Plan - n8n & Airtable

## Your Question Answered: How This Integration Works

You asked: **"I don't want to break my operational system - how will this integration work without breaking my existing n8n workflows and Airtable?"**

**The answer: We won't break anything. Here's exactly how it works:**

---

## 🎯 Architecture Overview

```
Your Current Setup (Stays 100% Intact)
├── Airtable Base (UYSP Lead Qualification)
│   └── Existing tables & data (UNTOUCHED)
├── n8n Workflows (All running)
│   ├── UYSP-Calendly-Booked_FIXED
│   ├── UYSP-Click-Proxy
│   ├── UYSP-Retrospective-Kajabi-Tagger
│   ├── UYSP-SMS-Scheduler
│   ├── UYSP-ST-Delivery
│   └── ... all others (UNTOUCHED)
└── SimpleTexting / Calendly / Other tools (UNTOUCHED)

NEW - Client Portal Layer (Reads ONLY)
├── PostgreSQL Database (separate from Airtable)
│   ├── Syncs data FROM Airtable (one-way)
│   ├── Stores user accounts & sessions
│   └── Caches lead data for fast UI
├── Client Portal API
│   ├── Reads from PostgreSQL
│   ├── Authenticates users
│   └── Manages UI interactions
└── Next.js Web Interface
    ├── Login / Registration
    ├── View leads from your Airtable
    ├── Add local notes (not synced back)
    └── Claim leads (local state only)
```

---

## ✅ What STAYS the Same

### Your n8n Workflows
- **NO CHANGES** to existing workflows
- All workflows continue running as-is
- No API calls to n8n from the portal (yet)
- Your SMS scheduler, Calendly sync, etc. all keep working

### Your Airtable
- **NO CHANGES** to your live Airtable base
- Data flows: Airtable → PostgreSQL (READ ONLY)
- Portal reads from PostgreSQL cache
- No writes back to Airtable (for now)
- All your existing automations stay intact

### Your Other Tools
- SimpleTexting: **No changes**
- Calendly: **No changes**
- Kajabi: **No changes**
- Any webhooks: **No changes**

---

## 🔄 How Data Flows (READ-ONLY Sync)

### Step 1: Initial Setup (One Time)
```
1. You give me access to your Airtable base
2. We configure API credentials in .env.local
3. We build a sync job that reads your Airtable schema
4. Portal maps Airtable fields to PostgreSQL tables
```

### Step 2: Ongoing Sync (Scheduled)
```
Every 5 minutes:
1. Portal queries your Airtable leads table
2. Compares against PostgreSQL cache
3. Updates/inserts new records to PostgreSQL
4. Marks deletions (but keeps history)
5. Logs all sync operations

Result: PostgreSQL always has latest copy of your Airtable data
```

### Step 3: User Interaction (Local Only)
```
Client clicks "Claim Lead" in portal:
1. Local PostgreSQL record updated (user_id set)
2. Portal UI refreshes
3. Airtable stays UNCHANGED
4. No sync back to Airtable (yet)

This is safe because:
- Claim status only affects portal UI
- Doesn't interfere with n8n workflows
- Can be manually undone
- Doesn't break your existing operations
```

---

## 🛡️ Safety Guarantees

### What I WILL Do
✅ Read from your Airtable (query only)  
✅ Cache data in our PostgreSQL (safe copy)  
✅ Track sync status and logs  
✅ Create alerts if sync fails  
✅ Keep your Airtable in sync with portal  

### What I WON'T Do
❌ Modify your Airtable records  
❌ Delete anything from Airtable  
❌ Break your n8n workflows  
❌ Change your API keys/credentials  
❌ Stop your existing automations  

### If Something Goes Wrong
- **Sync fails?** → n8n workflows keep running
- **Portal crashes?** → Your Airtable keeps working
- **Network issue?** → Manual sync button available
- **Data mismatch?** → Can restore from backups

---

## 📊 Data Mapping (Airtable → PostgreSQL)

Your Airtable has:
```
Leads Table:
- First Name
- Last Name
- Email
- Phone
- Company
- Title
- ICP Score
- Status (New, Replied, Claimed, etc.)
- Created Date
- Last Message Date
```

Maps to PostgreSQL:
```
leads table:
- firstName (from Airtable first_name)
- lastName (from Airtable last_name)
- email
- phone
- company
- title
- icpScore (integer, normalized)
- status (enum or varchar)
- createdAt
- lastMessageAt
```

**Key point**: Airtable field names might differ. We'll create a mapping config so:
- If Airtable changes schema → we update mapping (Airtable untouched)
- If n8n adds new fields → we add to mapping
- All purely additive, no destructive changes

---

## 🚀 Week 3 Implementation (Step by Step)

### Phase 1: Access & Discovery (30 minutes)
```
What I need from you:
1. Airtable Personal Access Token (PAT)
   - Go to: https://airtable.com/account/tokens
   - Scopes: data.records:read, schema.bases:read
   - This is READ-ONLY by default

2. Your Airtable Base ID
   - Found in any base URL: https://airtable.com/app[BASE_ID]/...

3. Your n8n Instance URL (if using n8n Cloud)
   - Example: https://n8n.yourcompany.com
   - Or: Cloud instance URL

4. n8n API Key (optional for Phase 1)
   - Only needed if we trigger workflows from portal
   - Can add later in Phase 2
```

### Phase 2: Build Sync Service (1-2 hours)
```
We create:
1. src/lib/airtable/client.ts
   - Airtable API wrapper
   - Read-only queries
   - Error handling

2. src/lib/sync/airtable-to-postgres.ts
   - Runs every 5 minutes (cron job)
   - Fetches latest leads from Airtable
   - Updates PostgreSQL cache
   - Logs all changes

3. src/app/api/sync/airtable.ts
   - Endpoint for manual sync trigger
   - Admin dashboard button
   - Sync status reporting

Result: Portal always has current lead data
```

### Phase 3: Display Leads (2-3 hours)
```
We create:
1. src/app/(client)/leads/page.tsx
   - Lists all leads from PostgreSQL
   - Filter by status, ICP score, etc.
   - Pagination (50 per page)

2. src/app/(client)/leads/[id]/page.tsx
   - Lead detail view
   - Full profile
   - Claim/unclaim button (local)

3. Components:
   - LeadCard component
   - LeadDetailView component
   - FilterBar component
   - StatusBadge component

Result: Users can see and interact with leads
```

### Phase 4: Notes & Activity (1-2 hours)
```
We create:
1. Notes system (local to portal)
   - Users add notes to leads
   - Notes stored in PostgreSQL
   - NOT synced back to Airtable (yet)

2. Activity logging
   - Track who claimed what
   - When users viewed leads
   - Note timestamps

3. Admin dashboard
   - View all activity across all clients
   - Sync status
   - System health

Result: Full lead management interface
```

### Phase 5: Optional - n8n Trigger (1-2 hours, Week 4+)
```
If you want portal to trigger workflows:
1. Create n8n webhook in workflow
2. Portal calls webhook when lead claimed
3. n8n workflow runs (e.g., send SMS)
4. Portal receives response

This requires:
- n8n API key (you provide)
- Workflow webhook URL (from your n8n)
- Custom integration code

This is OPTIONAL - Phase 1-4 works without it
```

---

## 🔐 Credentials & Secrets

### What You Provide
```
In .env.local:
AIRTABLE_API_KEY=pat_xxxxx...       (READ-ONLY token)
AIRTABLE_BASE_ID=appxxxxx...        (Your base)
AIRTABLE_LEADS_TABLE_ID=tblxxxxx... (Leads table)
N8N_API_URL=https://...             (Optional, Phase 2+)
N8N_API_KEY=xxxxx...                (Optional, Phase 2+)
```

### Security
- ✅ Credentials never committed to git
- ✅ Airtable token is READ-ONLY by default
- ✅ Can be rotated anytime
- ✅ If compromised, only leaks lead data (not modifiable)
- ✅ Logs sanitized (no credentials in logs)

---

## 🧪 Testing Strategy

### Before We Go Live
1. **Read Test**: Can we read from Airtable? ✓
2. **Mapping Test**: Do field mappings work? ✓
3. **Sync Test**: Does PostgreSQL get updated? ✓
4. **Conflict Test**: What if Airtable has 10k records? ✓
5. **Error Test**: If API fails, does it gracefully degrade? ✓
6. **Rollback Test**: Can we disable sync without breaking anything? ✓

### After We Go Live
- Sync runs every 5 minutes
- Admin can trigger manual sync
- Activity logs show all operations
- Alerts if sync fails 3 times in a row

---

## ✅ Safety Checklist

- [ ] Airtable API token is READ-ONLY
- [ ] No write permissions to Airtable
- [ ] Sync is one-way only (Airtable → PostgreSQL)
- [ ] n8n workflows run independently
- [ ] Portal doesn't call n8n (Phase 1)
- [ ] Credentials in .env.local (not committed)
- [ ] Backups of PostgreSQL created daily
- [ ] Sync logs retained for 30 days
- [ ] Can rollback to previous sync state
- [ ] Admin dashboard shows sync status

---

## 🎯 Summary: What Actually Happens

### Your Workflow (Today)
```
User fills form → Airtable webhook → n8n workflow → SMS sent
                  (stays exactly the same)
```

### With Client Portal
```
User fills form → Airtable webhook → n8n workflow → SMS sent
                  (stays exactly the same)
                  
             ↓ (every 5 min, READ ONLY)
             
          Airtable → PostgreSQL ← Client Portal (UI/UX only)
                                ← User sees & claims lead
                                ← Notes stored locally
```

**Result**: Your system stays 100% operational. Portal adds a UI layer on top without touching your existing workflows.

---

## 🚀 Next Steps

To proceed with Week 3:

1. **Give me access**: Airtable PAT + Base ID
2. **Confirm**: You're OK with READ-ONLY sync approach
3. **Review**: The data mapping I create
4. **Approve**: The sync schedule (every 5 minutes)
5. **Deploy**: Portal to test environment first

This way, we:
✅ Don't break anything  
✅ Keep your ops running  
✅ Add beautiful client portal UI  
✅ Maintain data consistency  
✅ Can iterate safely  

**Want to proceed?** Give me your Airtable PAT and I'll get started! 🎯
