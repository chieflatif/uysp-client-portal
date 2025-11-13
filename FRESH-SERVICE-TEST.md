# Fresh Service Deployment Test

## Hypothesis
The deployment failures on `uysp-portal-staging` are due to **persistent build cache artifacts** on Render's infrastructure, specifically the cached chunk file `.next/server/chunks/5611.js` that contains an invalid Html import from a previous build.

## Test Method
Create a **completely new Render service** with:
- **Zero build history**
- **No cached artifacts**
- **Identical configuration** to the failing service
- **Same branch**: `feature/data-integrity-restoration`
- **Same commit**: `ec13a03` (with all TypeScript fixes and cache-clearing mechanisms)

## Services Comparison

### Original Staging Service (FAILING)
- **Name**: uysp-portal-staging
- **Service ID**: srv-d477ecjipnbc73clq6f0
- **URL**: https://uysp-portal-staging.onrender.com
- **Created**: 2025-11-07
- **Status**: Build failing with Html import error
- **Cache Profile**: no-cache (but artifacts persist)

### New Fresh Test Service (TESTING)
- **Name**: uysp-portal-test-fresh
- **Service ID**: srv-d4b3099r0fns73elfphg
- **URL**: https://uysp-portal-test-fresh.onrender.com
- **Created**: 2025-11-13 (just now)
- **Status**: Building...
- **Deploy ID**: dep-d4b309pr0fns73elfpt0
- **Dashboard**: https://dashboard.render.com/web/srv-d4b3099r0fns73elfphg

### Configuration (Identical)
```json
{
  "repo": "https://github.com/chieflatif/uysp-client-portal",
  "branch": "feature/data-integrity-restoration",
  "runtime": "node",
  "buildCommand": "npm install && npm run build",
  "startCommand": "npm run start",
  "plan": "starter",
  "region": "virginia",
  "autoDeploy": "yes",
  "cache": { "profile": "no-cache" }
}
```

## Expected Outcomes

### If Build SUCCEEDS ✅
**Confirms**: The issue is 100% Render's persistent cache on the old service
**Action**:
1. Use the fresh service going forward
2. Migrate environment variables from old service
3. Update DNS/deployment references
4. Delete or suspend old service

### If Build FAILS ❌
**Indicates**: There's a genuine code issue we haven't identified
**Action**:
1. Review the exact error message
2. Compare with local build success
3. Investigate Next.js 15 deployment-specific issues
4. Check for environment-specific code paths

## Monitoring
Check deployment status at:
- Dashboard: https://dashboard.render.com/web/srv-d4b3099r0fns73elfphg
- Live URL (once deployed): https://uysp-portal-test-fresh.onrender.com

## Current Status
🔄 **Build in progress** - Created at 2025-11-13T19:23:21Z

---

**Test Started**: 2025-11-13 19:23 UTC
**Commit**: ec13a03 - "Document cache clearing attempts and provide manual intervention instructions"