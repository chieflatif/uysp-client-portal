# Security & Scalability Audit

**Date**: Oct 23, 2025  
**App**: UYSP Client Portal  
**Severity Levels**: 🔴 Critical | 🟠 High | 🟡 Medium

---

## 🔴 CRITICAL ISSUES (Fix Immediately)

### Issue #1: Data Leak in `/api/leads` Endpoint
**File**: `/src/app/api/leads/route.ts` line 19  
**Problem**: Returns ALL leads from ALL clients without filtering

```typescript
// CURRENT (VULNERABLE):
const allLeads = await db.query.leads.findMany({
  orderBy: (leads, { desc }) => [desc(leads.icpScore)],
});
```

**Impact**: Client A can see Client B's confidential leads

**Fix**:
```typescript
const allLeads = await db.query.leads.findMany({
  where: session.user.clientId 
    ? eq(leads.clientId, session.user.clientId)
    : undefined, // SUPER_ADMIN sees all
  orderBy: (leads, { desc }) => [desc(leads.icpScore)],
});
```

### Issue #2: JWT Secret Hardcoded
**File**: `/src/lib/auth/config.ts` line 132  
**Problem**: Default secret in code

```typescript
secret: process.env.NEXTAUTH_SECRET || 'dev-secret-key-uysp-client-portal-2025-change-in-production',
```

**Impact**: If NEXTAUTH_SECRET not set, sessions use known secret

**Fix**: Fail if not set in production
```typescript
secret: process.env.NEXTAUTH_SECRET!,
// Add check in startup script
```

---

## 🟠 HIGH RISK ISSUES

### Issue #3: No Rate Limiting
**Problem**: No protection against brute force login attacks  
**Impact**: Attacker can try unlimited passwords

**Fix**: Add rate limiting middleware
- Use `next-rate-limit` or similar
- Limit: 5 login attempts per IP per 15 minutes
- Implement account lockout after 10 failed attempts

### Issue #4: ADMIN Role Too Permissive
**File**: Multiple endpoints  
**Problem**: ADMIN can see data across clients in some endpoints

Example: `/api/analytics/campaigns/route.ts` lines 45-46
```typescript
} else if (session.user.role === 'ADMIN' && requestedClientId) {
  clientId = requestedClientId; // ADMIN can request ANY client!
}
```

**Impact**: ADMIN meant to see only their client, but can access others

**Fix**: Enforce strict client isolation for ADMIN
```typescript
} else if (session.user.role === 'ADMIN') {
  // ADMIN can ONLY see their own client
  if (requestedClientId && requestedClientId !== session.user.clientId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  clientId = session.user.clientId;
}
```

### Issue #5: No HTTPS Enforcement
**Problem**: App doesn't force HTTPS redirect  
**Impact**: Data could be transmitted insecurely

**Fix**: Add middleware or Render config
```typescript
// middleware.ts
if (request.headers.get('x-forwarded-proto') !== 'https') {
  return NextResponse.redirect(`https://${request.headers.get('host')}${request.nextUrl.pathname}`);
}
```

---

## 🟡 MEDIUM ISSUES

### Issue #6: Session Expiry Too Long
**File**: `/src/lib/auth/config.ts` line 129  
**Current**: 24 hours

**Recommendation**: 
- Regular users: 8 hours
- SUPER_ADMIN: 2 hours (more sensitive)
- Add "remember me" option for convenience

### Issue #7: No Audit Logging for Sensitive Actions
**Missing**: Comprehensive audit trail

**What to log**:
- User login/logout
- Lead data access
- Airtable writes
- Client data modifications
- Admin actions (sync, pause campaigns, etc.)

**Fix**: Enhance `activityLog` table usage

### Issue #8: Airtable API Key in Environment
**Current**: Single API key for all operations  
**Risk**: If compromised, attacker has full Airtable access

**Better approach**:
- Use Airtable OAuth (per-user permissions)
- Or: Separate keys for read vs write
- Or: Key rotation policy

---

## SCALABILITY ASSESSMENT

### Can Support 10+ Clients? ✅ YES (with notes)

**Current Architecture**:
- PostgreSQL database (Render) ✅
- Multi-tenant by `clientId` ✅
- Separate Airtable base per client ✅

**Limits**:
- **Database**: Render PostgreSQL handles millions of rows ✅
- **Airtable**: 5 req/sec per base (already have batching) ✅
- **Next.js**: Serverless functions scale automatically ✅

**Bottlenecks**:
1. **Sync performance**: Currently ~2 min for 11K leads
   - Solution: Already using batch upserts (good)
   - For 10 clients: ~20 min total sync time (acceptable)

2. **Database connections**: PostgreSQL has connection pool limits
   - Render default: 25 connections
   - 10 clients with active users: Might need upgrade
   - Solution: Connection pooling already in Drizzle ✅

3. **Airtable rate limits**: 5 req/sec per base
   - Already handled with try/catch and delays ✅

**Verdict**: Can easily handle 10 clients. Could scale to 50+ with minor optimizations.

---

## USER AUTHENTICATION REVIEW

### Current System: ✅ Production-Grade

**Strengths**:
- ✅ bcrypt password hashing
- ✅ JWT sessions
- ✅ Role-based access (SUPER_ADMIN, ADMIN, CLIENT)
- ✅ Inactive user blocking
- ✅ Password change forcing
- ✅ Input validation (Zod)

**Weaknesses**:
- ❌ No rate limiting
- ❌ No password requirements (min length, complexity)
- ❌ No 2FA option
- ❌ No session invalidation on password change
- ❌ No "forgot password" flow

---

## DATA ISOLATION REVIEW

### Client Segregation: ⚠️ PARTIAL

**What Works**:
- ✅ Each client has `clientId` in database
- ✅ Separate Airtable base per client
- ✅ Most endpoints filter by `clientId`

**What's Broken**:
- ❌ `/api/leads` - NO filtering (data leak)
- ⚠️ Some analytics endpoints allow ADMIN cross-client access
- ⚠️ No database row-level security (relies on app logic)

**Fix**: Add middleware to enforce client isolation
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // For all /api routes except auth:
  // - Get session
  // - Extract clientId from request (URL params, body, etc.)
  // - Verify session.user.clientId matches OR user is SUPER_ADMIN
  // - Reject if mismatch
}
```

---

## RENDER SECURITY FEATURES

### What Render Provides:
- ✅ SSL/TLS encryption
- ✅ DDoS protection
- ✅ Automated security patches
- ✅ Database encryption at rest
- ✅ Private networking between services
- ✅ Environment variable encryption

### What You Need to Enable:
- ⚠️ Web Application Firewall (WAF) - Check if available
- ⚠️ IP whitelisting for admin endpoints
- ⚠️ Database connection encryption (should be default)

### Recommended Render Config:
1. **Enable auto-deploy** from main branch ✅ (probably already on)
2. **Set up health checks** (Render pings your app)
3. **Enable logging** to catch security issues
4. **Set resource limits** (prevent DOS via resource exhaustion)

---

## WHAT WE MIGHT HAVE MISSED

### 1. Input Validation
**Check**: Are all user inputs sanitized?
- ❌ Task names, notes, etc. not validated
- ❌ No XSS protection on user-generated content
- ❌ SQL injection risk (Drizzle ORM protects, but verify)

**Fix**: Add input validation on all write endpoints

### 2. File Uploads
**Check**: Any file upload endpoints?
- ✅ None found (good - avoids that attack vector)

### 3. API Endpoint Enumeration
**Problem**: Attacker can guess endpoint URLs
**Current**: No obfuscation (standard REST)
**Risk**: Medium (endpoints discoverable)

**Mitigation**: Add proper auth to all endpoints (some missing)

### 4. Error Messages Leak Info
**Example**: "User not found" vs "Invalid password"
**Risk**: Helps attacker enumerate valid emails

**Fix**: Generic error: "Invalid credentials"

### 5. No Request Logging
**Missing**: Track who accessed what data when
**Impact**: Can't detect breaches or investigate incidents

**Fix**: Log all sensitive data access to `activityLog`

---

## SOLUTIONS & IMPROVEMENTS

### Priority 1: Fix Data Leak (30 min)
1. Fix `/api/leads/route.ts` to filter by clientId
2. Audit ALL endpoints for client filtering
3. Add middleware to enforce isolation
4. Test: Login as Client A, try to access Client B's data

### Priority 2: Add Security Headers (15 min)
```typescript
// next.config.js
headers: async () => [
  {
    source: '/:path*',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
    ],
  },
],
```

### Priority 3: Add Rate Limiting (1 hour)
- Install: `npm install express-rate-limit`
- Apply to auth endpoints
- Apply to write endpoints

### Priority 4: Password Requirements (30 min)
```typescript
password: z.string()
  .min(12, 'Min 12 characters')
  .regex(/[A-Z]/, 'Need uppercase')
  .regex(/[0-9]/, 'Need number')
  .regex(/[!@#$%^&*]/, 'Need special char')
```

### Priority 5: Audit Logging (1 hour)
Log to `activityLog` table:
- All data access (who viewed which lead)
- All data modifications (who changed what)
- All auth events (login/logout/failed attempts)

---

## RECOMMENDED ACTION PLAN

### Immediate (Today - 2 hours):
1. Fix `/api/leads` data leak
2. Add NEXTAUTH_SECRET check
3. Add security headers
4. Test client isolation

### This Week (4 hours):
1. Add rate limiting
2. Implement password requirements
3. Add comprehensive audit logging
4. Review all endpoints for auth

### Next Week (Optional):
1. Add 2FA
2. Implement "forgot password"
3. Add IP whitelisting for admin
4. Set up monitoring/alerts

---

## RENDER-SPECIFIC RECOMMENDATIONS

### Check These Settings:
1. **Environment Variables**: NEXTAUTH_SECRET is set ✅ (verify)
2. **Database SSL**: Enabled ✅ (default)
3. **Health Checks**: Configure at `/api/health`
4. **Auto-scaling**: Enable if traffic spikes expected
5. **Backups**: Automated daily backups ✅ (verify enabled)

### Optional Upgrades:
- **Pro plan**: Better DDoS protection
- **Private services**: Database not publicly accessible
- **Log drains**: Send logs to monitoring service

---

## VERDICT

**Security**: ⚠️ 6/10 - Has critical data leak, needs immediate fixes  
**Scalability**: ✅ 8/10 - Can handle 10+ clients easily  
**Production Readiness**: ⚠️ 7/10 - Works but needs security hardening

**Good news**: All issues are fixable in 4-6 hours total.

---

## TEST SCENARIOS

### Security Tests:
1. Login as Client A user → Try to access `/api/leads` → Should only see Client A leads
2. Login as ADMIN → Try clientId param for different client → Should be blocked
3. Try SQL injection in search fields
4. Try XSS in note fields
5. Attempt brute force login (should be rate limited)

### Scalability Tests:
1. Import 50K leads for one client → Measure sync time
2. Run sync for 3 clients simultaneously → Check performance
3. 10 concurrent users accessing dashboard → Check response times

---

**Bottom line**: Backend is solid and scalable. Security needs 4-6 hours of fixes, mainly around client data isolation and rate limiting.

