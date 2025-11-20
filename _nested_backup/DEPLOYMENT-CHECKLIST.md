# Deployment Checklist

## 🚨 MANDATORY PROCESS - DO NOT SKIP

This checklist **must** be followed for every deployment to prevent broken features in production.

---

## Before You Start

### Required Setup (One Time)

```bash
# 1. Export your LOCAL database URL (for pre-deploy tests)
export DATABASE_URL="postgresql://..."

# 2. Export your PRODUCTION database URL (for post-deploy verification)
export PRODUCTION_DATABASE_URL="postgresql://production-db-url"
export PRODUCTION_URL="https://uysp-portal-v2.onrender.com"
```

Add these to your `~/.bashrc` or `~/.zshrc` so they persist.

---

## Deployment Workflow

### Phase 1: Development ✅

1. **Write code** for the feature
2. **Write tests** (if applicable)
3. **Test locally** - start dev server and manually test
4. **Commit changes** with descriptive commit message

---

### Phase 2: Pre-Deployment Validation ⚠️ **CRITICAL**

**Run this BEFORE `git push`:**

```bash
./scripts/pre-deploy-test.sh
```

This script checks:
- ✅ Database tables exist and have correct schema
- ✅ TypeScript compiles without errors
- ✅ Build succeeds
- ✅ Migrations are ready
- ✅ API routes use correct schema/imports
- ✅ No obvious mistakes (old code patterns, etc.)

**If ANY check fails:**
- ❌ DO NOT DEPLOY
- Fix the issues
- Run script again until all checks pass

**If ALL checks pass:**
- ✅ Safe to deploy
- Proceed to Phase 3

---

### Phase 3: Deploy 🚀

```bash
git push origin main
```

- GitHub triggers Render auto-deploy
- Wait 3-5 minutes for deployment to complete
- Watch Render dashboard: https://dashboard.render.com

**Look for:**
- ✅ "Build succeeded"
- ✅ "Deploy live"
- ❌ Any errors in logs (if yes, DO NOT proceed to Phase 4)

---

### Phase 4: Post-Deployment Verification ⚠️ **CRITICAL**

**Run this AFTER deployment completes:**

```bash
# Use production database URL
export DATABASE_URL="$PRODUCTION_DATABASE_URL"
./scripts/post-deploy-verify.sh
```

This script checks:
- ✅ Production database tables exist
- ✅ Production site is accessible
- ✅ API endpoints respond correctly
- ✅ Recent activity data is flowing (if applicable)

**If ANY check fails:**
- 🔥 **PRODUCTION IS BROKEN**
- Review Render logs immediately
- Check database connections
- May need to rollback or hotfix

**If ALL checks pass:**
- ✅ Production is healthy
- Proceed to Phase 5

---

### Phase 5: User Acceptance Testing

**Manual testing steps:**

1. **Test as regular user:**
   - Log in to production
   - Navigate to all major pages
   - Test the feature you just deployed
   - Check browser console for errors (F12)

2. **Test as admin/super admin (if applicable):**
   - Log in with admin account
   - Test admin-specific features
   - Verify data appears correctly

3. **Verify database (if applicable):**
   ```bash
   # Check data is being created
   psql $PRODUCTION_DATABASE_URL -c "SELECT COUNT(*) FROM [table];"
   ```

**If issues found:**
- Document exact steps to reproduce
- Check Render logs
- May need hotfix

**If everything works:**
- ✅ **DEPLOYMENT COMPLETE**
- Mark feature as done in project tracker

---

## Quick Reference

### Apply New Migrations

```bash
# Apply all pending migrations
./scripts/apply-migrations.sh

# Apply specific migration
./scripts/apply-migrations.sh migration-file-name.sql
```

### Check Production Database

```bash
# Connect to production database
psql $PRODUCTION_DATABASE_URL

# List tables
\dt

# Check specific table
\d table_name

# Query data
SELECT * FROM table_name LIMIT 10;
```

### Check Production Logs

```bash
# Via Render Dashboard
https://dashboard.render.com/web/[service-id]/logs

# Or use Render CLI (if installed)
render logs
```

---

## Common Issues & Solutions

### Issue: Pre-deploy script fails on TypeScript errors

**Solution:**
```bash
npm run type-check
# Fix all type errors
# Run pre-deploy script again
```

### Issue: Pre-deploy script fails on build

**Solution:**
```bash
npm run build
# Review build errors
# Fix issues
# Run pre-deploy script again
```

### Issue: Post-deploy script shows missing tables

**Solution:**
```bash
# Apply migrations to production
export DATABASE_URL="$PRODUCTION_DATABASE_URL"
./scripts/apply-migrations.sh
```

### Issue: Post-deploy script shows site is down

**Solution:**
- Check Render dashboard for deployment status
- Wait longer (deployments can take 5+ minutes)
- Check Render logs for startup errors

### Issue: Feature works locally but not in production

**Solution:**
1. Check Render logs for errors
2. Verify environment variables are set in Render
3. Check if migrations were applied
4. Verify database connection string is correct

---

## What To Do If Production Breaks

### Emergency Response

1. **Check Render logs immediately**
   ```
   https://dashboard.render.com/web/[service-id]/logs
   ```

2. **Identify the error:**
   - Database connection error?
   - Missing table?
   - API endpoint error?
   - Build failure?

3. **Quick fix options:**

   **Option A: Rollback**
   - Render dashboard → Deployments → Redeploy previous version

   **Option B: Hotfix**
   - Fix the issue locally
   - Run pre-deploy script
   - Push fix immediately
   - Wait for deployment
   - Run post-deploy script

4. **Verify fix worked:**
   ```bash
   ./scripts/post-deploy-verify.sh
   ```

---

## Rules of Engagement

### ❌ NEVER:
- Deploy without running pre-deploy script
- Skip post-deploy verification
- Assume "it works locally" = "it works in production"
- Deploy on Friday afternoon (Murphy's Law)
- Deploy without having rollback plan

### ✅ ALWAYS:
- Run pre-deploy script and ensure ALL checks pass
- Wait for deployment to complete before testing
- Run post-deploy verification script
- Test manually as end user
- Check production logs after deployment
- Document any issues encountered
- Keep local and production database URLs separate

---

## Script Locations

- **Pre-deploy validation:** `./scripts/pre-deploy-test.sh`
- **Post-deploy verification:** `./scripts/post-deploy-verify.sh`
- **Apply migrations:** `./scripts/apply-migrations.sh`

---

## Environment Variables Needed

```bash
# Local/Dev Database
export DATABASE_URL="postgresql://localhost/uysp_dev"

# Production Database
export PRODUCTION_DATABASE_URL="postgresql://prod-host/uysp_prod"

# Production Site URL
export PRODUCTION_URL="https://uysp-portal-v2.onrender.com"
```

---

## Support

If scripts fail or you're unsure about something:
1. Read the error messages carefully
2. Check this document for solutions
3. Review Render logs
4. Ask AI assistant for help (provide exact error messages)

**Remember:** Taking 5 minutes to run these scripts can save hours of debugging broken production deployments!
