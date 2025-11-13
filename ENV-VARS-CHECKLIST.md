# Environment Variables Checklist for Fresh Service

## Issue Diagnosed
Login fails with `[next-auth][error][NO_SECRET]` because `NEXTAUTH_SECRET` environment variable is missing.

## Required Environment Variables

Add these to **uysp-portal-test-fresh** service in Render dashboard:

### Critical (Must Have)

1. **NEXTAUTH_SECRET**
   - Purpose: JWT signing and session encryption
   - How to generate: `openssl rand -base64 32`
   - Or copy from old service
   - Status: ❌ MISSING (causing login failure)

2. **NEXTAUTH_URL**
   - Value: `https://uysp-portal-test-fresh.onrender.com`
   - Purpose: Callback URLs for NextAuth
   - ⚠️ Must match the new service URL exactly

3. **DATABASE_URL**
   - Value: `postgresql://uysp_client_portal_db_user:PuLMS841kifvBNpl3mGcLBl1WjIs0ey2@dpg-d3q9raodl3ps73bp1r50-a.virginia-postgres.render.com/uysp_client_portal_db`
   - Purpose: PostgreSQL database connection
   - Note: Same as old service (shared database)

4. **NODE_ENV**
   - Value: `production`
   - Purpose: Runtime environment flag

### Additional (Copy from Old Service)

5. **AIRTABLE_API_KEY**
   - Purpose: Airtable integration

6. **AIRTABLE_BASE_ID**
   - Purpose: Airtable base connection

7. **ALLOW_PUBLIC_REGISTRATION** (optional)
   - Purpose: Feature flag for public registration

8. **CRON_SECRET** (if applicable)
   - Purpose: Secure cron job endpoints

## Steps to Add Variables

1. Go to https://dashboard.render.com/web/srv-d4b3099r0fns73elfphg
2. Click **Environment** in left sidebar
3. Add each variable:
   - Click "Add Environment Variable"
   - Enter Key and Value
   - Click "Save Changes"
4. Service will automatically redeploy after adding variables

## After Adding Variables

1. Wait for automatic redeploy (takes ~2 minutes)
2. Test login at: https://uysp-portal-test-fresh.onrender.com/login
3. Should be able to log in successfully with your admin credentials

## Verification

Once variables are added, check logs:
```bash
# Should see successful auth instead of NO_SECRET error
# Look for: [Auth] DB query took Xms
# Instead of: [next-auth][error][NO_SECRET]
```

---

**Current Status**: Waiting for environment variables to be added
**Service**: uysp-portal-test-fresh (srv-d4b3099r0fns73elfphg)
**URL**: https://uysp-portal-test-fresh.onrender.com