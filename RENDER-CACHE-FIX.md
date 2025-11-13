# 🚨 RENDER CACHE FIX INSTRUCTIONS

## If Deployment Still Failing

The build cache on Render is extremely persistent. We've implemented multiple layers of cache clearing, but if the deployment is still failing with the Html import error, follow these steps:

### IMMEDIATE FIX - Option A: Manual Dashboard Override
1. Go to Render Dashboard → uysp-client-portal → Settings → Build & Deploy
2. Change Build Command to:
   ```bash
   cd /opt/render/project/src && rm -rf .next && rm -rf /opt/render/project/.next && rm -rf /opt/render/.next && npm run build
   ```
3. Trigger manual deploy

### IMMEDIATE FIX - Option B: Environment Variable
1. Go to Render Dashboard → Environment
2. Add new environment variable:
   ```
   NEXT_PRIVATE_SKIP_CACHE=true
   FORCE_COLOR=0
   CI=true
   ```
3. Trigger manual deploy

### NUCLEAR OPTION: Fresh Service
1. Create NEW Render service (don't clone existing)
2. Connect same GitHub repo
3. Set build command: `npm run build`
4. Add all environment variables from old service
5. Deploy
6. Once working, update DNS/delete old service

### Support Ticket Template
```
Subject: Persistent Build Cache Issue - Manual Clear Needed

Service: uysp-client-portal
Issue: Build cache contains corrupted chunk file that persists despite:
- Cache profile set to 'no-cache'
- Multiple cache-clearing commands in build script
- prebuild hooks attempting to clear cache

Specific file causing issue:
/opt/render/project/.next/server/chunks/5611.js

This file contains an invalid Html import from a previous build and is not being cleared despite all attempts. Please manually clear the build cache for this service.

Build succeeds locally but fails on Render with:
"Error: <Html> should not be imported outside of pages/_document"

Thank you for your assistance.
```

## What We've Already Tried
✅ Removed all error pages that were causing the issue
✅ Added aggressive cache clearing to build script
✅ Added prebuild Node.js script to clear caches
✅ Modified next.config.js to detect RENDER env and clear cache
✅ Set cache profile to 'no-cache' in Render settings
✅ Added .env.production with cache-busting variables
✅ Changed Node.js version
✅ All TypeScript errors fixed for Next.js 15

## The Problem
- Render's build environment has cached `.next/server/chunks/5611.js`
- This chunk contains invalid Html import from previous build
- Cache persists across deployments despite all clearing attempts
- Build works perfectly locally

## Success Indicators
When the cache is finally cleared, you should see:
1. Build completes without Html import error
2. Static pages /404 and /500 generate successfully
3. Deployment succeeds
4. Portal loads with all data visible

---

Remember: The code is FIXED. This is purely a cache issue on Render's infrastructure.