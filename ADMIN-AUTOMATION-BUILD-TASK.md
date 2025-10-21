# Admin Automation Build Task - UYSP Client Portal

**Date**: 2025-10-21  
**Agent Type**: VibeOS Development OS  
**Priority**: HIGH - Eliminate manual Render shell operations  
**Status**: Ready to build

---

## 🎯 YOUR MISSION

Build 6 critical admin API endpoints to eliminate all manual database/Render shell operations. The user should be able to manage everything from the SUPER_ADMIN dashboard.

**⚠️ VIBEOS PROTOCOL REMINDER:**
- Check your memories and `.mdc` rules before starting [[memory:10101260]]
- Follow tool-first principle - use MCP tools before guessing [[memory:10101280]]
- Test locally BEFORE deploying [[memory:10101275]]
- Write tests first (TDD protocol) [[memory:10101278]]

---

## ✅ CURRENT STATE (What's Working)

### Deployment Status
- ✅ **App URL**: https://uysp-portal-v2.onrender.com
- ✅ **GitHub Repo**: https://github.com/chieflatif/uysp-client-portal
- ✅ **Database**: PostgreSQL on Render (11,046 leads synced)
- ✅ **Authentication**: Working (NextAuth.js with JWT)
- ✅ **Render Service ID**: `srv-d3r7o1u3jp1c73943qp0`
- ✅ **Database ID**: `dpg-d3q9raodl3ps73bp1r50-a`

### User Credentials
**SUPER_ADMIN:**
- Email: `rebel@rebelhq.ai`
- Password: `RElH0rst89!`
- Client ID: `7a3ff4d5-aee5-46da-95d0-9f5e306bc649` (Rebel HQ)

### Database Connection
```
postgresql://uysp_client_portal_db_user:PuLMS841kifvBNpl3mGcLBl1WjIs0ey2@dpg-d3q9raodl3ps73bp1r50-a.virginia-postgres.render.com:5432/uysp_client_portal_db?sslmode=require
```

### Features Working
- ✅ Login/logout
- ✅ Dashboard with lead stats
- ✅ Leads list (11,046 leads)
- ✅ Lead details page
- ✅ Admin panel (clients, users, stats)
- ✅ Rebel HQ Oceanic theme (dark with pink/cyan/indigo accents)
- ✅ Multi-tenant isolation (clientId filtering)

### Recently Built
- ✅ `/api/admin/sync` - Sync Airtable leads (deployed, untested)
- ✅ SUPER_ADMIN authorization fixes for lead access
- ✅ Notes error handling improvement

### Known Issues
- ⚠️ Analytics shows zero data (needs campaign data from Airtable - sync should fix this)
- ⚠️ Notes returns empty array (working as designed until Airtable sync runs)
- ⚠️ No client selector for SUPER_ADMIN (sees all leads mixed together)

---

## 🎯 YOUR TASK: Build 6 Admin Endpoints

### **Endpoint 1: Database Health Check**
**Path:** `/api/admin/db-health`  
**Method:** GET  
**Auth:** SUPER_ADMIN only  
**Returns:**
```json
{
  "ok": true,
  "tables": {
    "clients": { "count": 2, "last_updated": "2025-10-21T00:15:00Z" },
    "users": { "count": 1, "last_updated": "2025-10-21T00:15:00Z" },
    "leads": { "count": 11046, "last_updated": "2025-10-21T01:30:00Z" },
    "notes": { "count": 0, "last_updated": null },
    "activity_log": { "count": 15, "last_updated": "2025-10-21T00:20:00Z" }
  },
  "connection": "healthy",
  "last_sync": "2025-10-21T01:30:00Z"
}
```

### **Endpoint 2: Create Client**
**Path:** `/api/admin/clients` (POST)  
**Auth:** SUPER_ADMIN only  
**Request Body:**
```json
{
  "companyName": "UYSP",
  "email": "davidson@iankoniak.com",
  "airtableBaseId": "app4wIsBfpJTg7pWS"
}
```
**Returns:**
```json
{
  "success": true,
  "client": {
    "id": "uuid",
    "companyName": "UYSP",
    "email": "davidson@iankoniak.com"
  }
}
```

### **Endpoint 3: Create User**
**Path:** `/api/admin/users` (POST)  
**Auth:** SUPER_ADMIN only  
**Request Body:**
```json
{
  "email": "davidson@iankoniak.com",
  "password": "AIBDRportal25",
  "firstName": "Davidson",
  "lastName": "Ian",
  "role": "CLIENT",
  "clientId": "uuid-from-client-creation"
}
```
**Returns:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "davidson@iankoniak.com",
    "role": "CLIENT"
  }
}
```

### **Endpoint 4: Deactivate User**
**Path:** `/api/admin/users/[id]/deactivate` (PATCH)  
**Auth:** SUPER_ADMIN only  
**Request Body:**
```json
{
  "reason": "User left company"
}
```
**Action:** Sets `is_active = false`, logs to activity_log  
**Returns:** Success confirmation

### **Endpoint 5: Deactivate Client**
**Path:** `/api/admin/clients/[id]/deactivate` (PATCH)  
**Auth:** SUPER_ADMIN only  
**Request Body:**
```json
{
  "reason": "Contract ended"
}
```
**Action:** Sets `is_active = false` for client AND all their users, logs to activity_log  
**Returns:** Success confirmation with count of affected users

### **Endpoint 6: Campaign Management**
**Path:** `/api/admin/campaigns/pause` (POST)  
**Auth:** SUPER_ADMIN or ADMIN  
**Request Body:**
```json
{
  "clientId": "uuid",
  "reason": "Client requested pause"
}
```
**Action:** Updates all leads for client: `processing_status = 'Paused'`  
**Returns:** Count of leads affected

---

## 📋 IMPLEMENTATION REQUIREMENTS

### Testing Protocol (NON-NEGOTIABLE)
**For EACH endpoint:**
1. ✅ Write test FIRST (TDD - see tests/api/ for examples)
2. ✅ Implement endpoint
3. ✅ Run `npm run build` locally - MUST succeed
4. ✅ Test locally via `npm run dev` at http://localhost:3000
5. ✅ Only then git push to deploy

**Do NOT push without local testing - this caused the 3-hour deployment disaster.**

### Code Quality
- ✅ All endpoints must check SUPER_ADMIN role
- ✅ Return proper error codes (401, 403, 404, 500)
- ✅ Log all admin actions to activity_log table
- ✅ Use existing database client (`@/lib/db`)
- ✅ Follow existing code patterns in `/src/app/api/admin/`

### Security
- ✅ SUPER_ADMIN role required for destructive operations
- ✅ ADMIN role can only affect their own client
- ✅ Log who performed action and when
- ✅ Validate all input data
- ✅ Use bcrypt for password hashing (10 rounds)

---

## 🔧 DEVELOPMENT SETUP

### Local Environment Setup
**`.env.local` file already exists with:**
```bash
DATABASE_URL=postgresql://uysp_client_portal_db_user:PuLMS841kifvBNpl3mGcLBl1WjIs0ey2@dpg-d3q9raodl3ps73bp1r50-a.virginia-postgres.render.com:5432/uysp_client_portal_db?sslmode=require
NEXTAUTH_SECRET=Nd+v/ZC4u5Ga8FLjIPXtLmW/d90BM2fxiHiE8yx1ibU=
NEXTAUTH_URL=http://localhost:3000
AIRTABLE_BASE_ID=app4wIsBfpJTg7pWS
NODE_ENV=development
ALLOW_PUBLIC_REGISTRATION=false
```

### Start Development
```bash
cd "/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal"
npm run dev
```

Visit: http://localhost:3000  
Login: rebel@rebelhq.ai / RElH0rst89!

### Test Endpoints
Use browser or curl to test each endpoint as you build it.

---

## 📚 CODE EXAMPLES

### Example: SUPER_ADMIN Auth Pattern
```typescript
import { auth } from '@/lib/auth';

const session = await auth();
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

if (session.user.role !== 'SUPER_ADMIN') {
  return NextResponse.json(
    { error: 'Forbidden - SUPER_ADMIN access required' },
    { status: 403 }
  );
}
```

### Example: Database Insert Pattern
```typescript
import { db } from '@/lib/db';
import { clients } from '@/lib/db/schema';

const [newClient] = await db.insert(clients).values({
  companyName: 'UYSP',
  email: 'davidson@iankoniak.com',
  airtableBaseId: 'app4wIsBfpJTg7pWS',
  isActive: true,
}).returning();
```

### Example: Password Hashing
```typescript
import bcrypt from 'bcryptjs';

const passwordHash = await bcrypt.hash('AIBDRportal25', 10);
```

### Example: Activity Logging
```typescript
import { activityLog } from '@/lib/db/schema';

await db.insert(activityLog).values({
  userId: session.user.id,
  clientId: clientId,
  action: 'CLIENT_CREATED',
  details: `Created client: ${companyName}`,
  ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
});
```

---

## 🚨 CRITICAL GOTCHAS (From Deployment Disaster)

### **Gotcha 1: Always Test Builds Locally**
```bash
# BEFORE git push, ALWAYS run:
rm -rf .next
npm run build
# Only push if: ✓ Compiled successfully
```

**Why:** Render takes 10+ mins per build. Testing locally saves hours.

### **Gotcha 2: Tailwind CSS v4 Configuration**
- Uses `@tailwindcss/postcss` plugin
- Requires Tailwind in `dependencies` not `devDependencies`
- Uses `@import "tailwindcss"` syntax in globals.css

**Don't change unless necessary - it's working now.**

### **Gotcha 3: Path Alias Issues**
- `@/` alias configured in `tsconfig.json` and `next.config.js`
- Required `baseUrl: "."` in tsconfig
- Required webpack alias in next.config

**Don't modify - it works now.**

### **Gotcha 4: Database Migrations**
- Drizzle does NOT auto-create tables
- Migration SQL files exist in `src/lib/db/migrations/`
- Must be run manually via psql or API endpoint

**This is why we're building the `/api/admin/migrate` endpoint.**

### **Gotcha 5: TypeScript in Production**
- `typescript` and `@types/node` must be in `dependencies` (not devDependencies)
- Render needs them for type checking during build

**Already fixed - don't change.**

---

## 📊 DATABASE SCHEMA REFERENCE

### Clients Table
```sql
- id (uuid, PK)
- company_name (varchar)
- email (varchar, unique)
- phone (varchar)
- airtable_base_id (varchar)
- is_active (boolean)
- last_sync_at (timestamp)
- created_at, updated_at (timestamp)
```

### Users Table
```sql
- id (uuid, PK)
- email (varchar, unique)
- password_hash (text)
- first_name, last_name (varchar)
- role (varchar) - 'SUPER_ADMIN', 'ADMIN', or 'CLIENT'
- client_id (uuid, FK to clients)
- is_active (boolean)
- last_login_at (timestamp)
- created_at, updated_at (timestamp)
```

### Leads Table
```sql
- id (uuid, PK)
- client_id (uuid, FK)
- airtable_record_id (varchar, unique)
- first_name, last_name, email, phone, company, title (varchar)
- icp_score (integer)
- status (varchar) - 'New', 'Contacted', 'Replied', etc.
- campaign_name (varchar) - From Airtable 'SMS Campaign ID'
- campaign_variant (varchar) - A or B
- sms_sequence_position, sms_sent_count (integer)
- clicked_link, booked, sms_stop (boolean)
- Plus 20+ other campaign/analytics fields
- created_at, updated_at (timestamp)
```

---

## 🔑 ROLE PERMISSIONS

### SUPER_ADMIN
- ✅ Can see ALL clients and ALL leads
- ✅ Can create/deactivate clients
- ✅ Can create/deactivate users for any client
- ✅ Can run system operations (sync, migrations, health checks)
- ✅ Can impersonate other users
- ❌ Should have client selector (not yet implemented)

### ADMIN
- ✅ Can see all leads for their assigned client
- ✅ Can manage users within their client
- ✅ Can pause/resume campaigns for their client
- ❌ Cannot see other clients' data
- ❌ Cannot create new clients

### CLIENT
- ✅ Can see leads assigned to them or unclaimed leads for their client
- ✅ Can claim/unclaim leads
- ✅ Can add notes and update status
- ❌ Cannot see other clients
- ❌ Cannot see other users' claimed leads
- ❌ Cannot manage users

---

## 📝 ENDPOINTS TO BUILD

### 1. Database Health Check
**File:** `src/app/api/admin/db-health/route.ts`  
**Method:** GET  
**Auth:** SUPER_ADMIN  
**Purpose:** View table counts, last updated times, connection status  
**Priority:** HIGH - Needed to verify data integrity

### 2. Create Client
**File:** `src/app/api/admin/clients/route.ts` (add POST handler)  
**Method:** POST  
**Auth:** SUPER_ADMIN  
**Purpose:** Create new client without SQL  
**Priority:** CRITICAL - Needed to onboard UYSP test client

**Request body:**
- companyName (required)
- email (required, unique)
- phone (optional)
- airtableBaseId (required)

### 3. Create User
**File:** `src/app/api/admin/users/route.ts` (add POST handler)  
**Method:** POST  
**Auth:** SUPER_ADMIN or ADMIN (ADMIN can only create for their client)  
**Purpose:** Create users without SQL  
**Priority:** CRITICAL - Needed to create davidson@iankoniak.com test user

**Request body:**
- email (required, unique)
- password (required, will be hashed)
- firstName, lastName (required)
- role (required: 'SUPER_ADMIN', 'ADMIN', or 'CLIENT')
- clientId (required)

### 4. Deactivate User
**File:** `src/app/api/admin/users/[id]/deactivate/route.ts`  
**Method:** PATCH  
**Auth:** SUPER_ADMIN or ADMIN (ADMIN can only deactivate their client's users)  
**Purpose:** Soft delete users  
**Priority:** MEDIUM

**Action:**
- Set `is_active = false`
- Log to activity_log
- Don't delete data

### 5. Deactivate Client
**File:** `src/app/api/admin/clients/[id]/deactivate/route.ts`  
**Method:** PATCH  
**Auth:** SUPER_ADMIN only  
**Purpose:** Soft delete client and all their users  
**Priority:** MEDIUM

**Action:**
- Set client `is_active = false`
- Set all client's users `is_active = false`
- Log to activity_log
- Return count of affected users

### 6. Pause Campaigns
**File:** `src/app/api/admin/campaigns/pause/route.ts`  
**Method:** POST  
**Auth:** SUPER_ADMIN or ADMIN  
**Purpose:** Pause all active campaigns for a client  
**Priority:** MEDIUM

**Request body:**
- clientId (required)
- reason (optional)

**Action:**
- Update all leads for client: `processing_status = 'Paused'`
- Log to activity_log
- Return count affected

---

## ✅ ACCEPTANCE CRITERIA

**Each endpoint must:**
1. ✅ Have tests written FIRST (TDD)
2. ✅ Build successfully locally (`npm run build`)
3. ✅ Work when tested at http://localhost:3000
4. ✅ Return proper JSON responses
5. ✅ Log admin actions to activity_log
6. ✅ Handle errors gracefully
7. ✅ Deploy successfully to Render

**Overall success:**
- ✅ User can create UYSP client via API
- ✅ User can create davidson@iankoniak.com test user via API
- ✅ User can deactivate clients/users via API
- ✅ User can pause campaigns via API
- ✅ User can view database health via API
- ✅ **Zero manual Render shell operations required**

---

## 🚀 DEPLOYMENT PROCESS

### Step 1: Build and Test Locally
```bash
cd "/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal"

# For each endpoint:
npm run build          # Must succeed
npm run dev            # Test at localhost:3000
# Verify endpoint works in browser/Postman
```

### Step 2: Deploy to Production
```bash
git add src/app/api/admin
git commit -m "feat: add admin automation endpoints"
git push origin main
```

### Step 3: Verify Deployment
```bash
# Use Render MCP to check status:
mcp_render_list_deploys(serviceId: "srv-d3r7o1u3jp1c73943qp0")

# When status = "live", test endpoints at:
# https://uysp-portal-v2.onrender.com/api/admin/*
```

---

## 📖 REFERENCE FILES

### Key Files to Reference
- `src/app/api/admin/stats/route.ts` - Example SUPER_ADMIN endpoint
- `src/app/api/admin/sync/route.ts` - Example with Drizzle queries
- `src/app/api/leads/[id]/route.ts` - Authorization pattern
- `src/lib/db/schema.ts` - Database schema definitions
- `tests/api/admin/clients.test.ts` - Test examples

### Database Schema Location
`src/lib/db/schema.ts` - Full Drizzle schema definitions

### Migration Files
`src/lib/db/migrations/0000_outgoing_absorbing_man.sql` - Initial schema  
`src/lib/db/migrations/0001_familiar_rage.sql` - SMS audit tables

---

## 💡 SPECIFIC USE CASE TO TEST

**After building endpoints, create UYSP test client:**

1. **Call** `/api/admin/clients` (POST) with:
   ```json
   {
     "companyName": "UYSP",
     "email": "davidson@iankoniak.com",
     "airtableBaseId": "app4wIsBfpJTg7pWS"
   }
   ```
   **Returns:** Client ID

2. **Call** `/api/admin/users` (POST) with:
   ```json
   {
     "email": "davidson@iankoniak.com",
     "password": "AIBDRportal25",
     "firstName": "Davidson",
     "lastName": "Ian",
     "role": "CLIENT",
     "clientId": "<id-from-step-1>"
   }
   ```

3. **Test** login with davidson@iankoniak.com / AIBDRportal25
4. **Verify** CLIENT user can only see their client's leads

---

## 🎁 BONUS: Add UI Buttons

**Optional but highly recommended:**

In the admin dashboard (`src/app/(client)/admin/page.tsx`), add buttons for:
- "Sync Airtable Data" → calls `/api/admin/sync`
- "Create New Client" → modal form → calls `/api/admin/clients`
- "Create New User" → modal form → calls `/api/admin/users`
- "View Database Health" → shows response from `/api/admin/db-health`

**This makes it truly one-click instead of visiting URLs.**

---

## 🔗 USEFUL LINKS

- **Render Service**: https://dashboard.render.com/web/srv-d3r7o1u3jp1c73943qp0
- **Render Database**: https://dashboard.render.com/d/dpg-d3q9raodl3ps73bp1r50-a
- **GitHub Repo**: https://github.com/chieflatif/uysp-client-portal
- **Production App**: https://uysp-portal-v2.onrender.com
- **Local Dev**: http://localhost:3000

---

## ⚠️ WHAT NOT TO DO

❌ **Don't push without testing locally** - Wasted 2.5 hours last time  
❌ **Don't change Tailwind config** - It's working now  
❌ **Don't modify path aliases** - They're configured correctly  
❌ **Don't move dependencies** between devDeps and deps - It's correct now  
❌ **Don't assume Drizzle auto-creates tables** - It doesn't  
❌ **Don't give up and ask user to run SQL** - Build automation instead  

---

## 📞 IF YOU GET STUCK

**If build fails:**
1. Check error message carefully
2. Test locally first
3. Use `mcp_render_list_logs` to see production errors
4. Don't loop on same approach - try different method after 2 failures

**If deployment hangs:**
1. Use `mcp_render_list_deploys` to check status
2. Use `mcp_render_list_logs` to see what's happening
3. Production deploys take ~2 minutes - be patient

---

## 🎯 SUCCESS CRITERIA

**You've succeeded when:**
1. ✅ All 6 endpoints built and tested
2. ✅ User can create UYSP client via API (not SQL)
3. ✅ User can create davidson@iankoniak.com via API (not SQL)
4. ✅ User can pause campaigns via API (not SQL)
5. ✅ User can view database health via API (not SQL)
6. ✅ User can deactivate users/clients via API (not SQL)
7. ✅ **Zero Render shell operations needed for normal admin tasks**

---

**BEGIN YOUR WORK. Build systematically, test thoroughly, deploy confidently.**

**First action: Check VibeOS memories and rules, then start with Endpoint #2 (Create Client) since that's immediately needed for the UYSP test user.**

