# TDD Implementation Plan - Security & Performance Fixes

**Date**: October 23, 2025
**Priority**: CRITICAL → HIGH → MEDIUM
**Estimated Total Time**: 6-8 hours
**Methodology**: Test-Driven Development (Write tests → Implement → Verify)

---

## PHASE 1: CRITICAL SECURITY FIXES (2 hours)

### 1.1 Fix /api/leads Data Leak ⚠️ VERIFIED
**File**: `/src/app/api/leads/route.ts` line 19
**Issue**: Returns ALL leads from ALL clients without filtering
**Risk**: CLIENT_ADMIN A can see CLIENT_ADMIN B's confidential leads

**Test Cases**:
```typescript
// Test 1: SUPER_ADMIN sees all leads
// Test 2: CLIENT_ADMIN sees only their client's leads
// Test 3: CLIENT_USER sees only their client's leads
// Test 4: Unauthorized user gets 401
```

**Implementation**:
```typescript
import { eq } from 'drizzle-orm';
import { leads } from '@/lib/db/schema';

// Add client filtering
const allLeads = await db.query.leads.findMany({
  where: session.user.role === 'SUPER_ADMIN'
    ? undefined // SUPER_ADMIN sees all
    : eq(leads.clientId, session.user.clientId!),
  orderBy: (leads, { desc }) => [desc(leads.icpScore)],
});
```

**Verification**:
- Login as CLIENT_ADMIN A → should see only their leads
- Login as SUPER_ADMIN → should see all leads

---

### 1.2 Fix NEXTAUTH_SECRET Hardcoded Fallback
**File**: `/src/lib/auth/config.ts` line 132
**Issue**: Falls back to hardcoded secret in production

**Test Cases**:
```typescript
// Test 1: Production build fails if NEXTAUTH_SECRET not set
// Test 2: Development works with fallback
// Test 3: Session verification works with real secret
```

**Implementation**:
```typescript
// Add startup validation
if (process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET must be set in production');
}

jwt: {
  secret: process.env.NEXTAUTH_SECRET ||
    (process.env.NODE_ENV === 'development'
      ? 'dev-secret-key-uysp-client-portal-2025'
      : undefined),
}
```

---

### 1.3 Add Security Headers
**File**: `next.config.js`
**Issue**: Missing critical security headers

**Test Cases**:
```typescript
// Test 1: Response includes X-Frame-Options: DENY
// Test 2: Response includes X-Content-Type-Options: nosniff
// Test 3: Response includes Referrer-Policy
// Test 4: Response includes CSP headers
```

**Implementation**:
```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
      ],
    },
  ];
}
```

---

## PHASE 2: HIGH PRIORITY FIXES (2-3 hours)

### 2.1 Fix ADMIN Cross-Client Access in Analytics
**Files**: 4 analytics endpoints
**Issue**: CLIENT_ADMIN can request ANY client's data

**Test Cases**:
```typescript
// Test 1: CLIENT_ADMIN A requests their data → SUCCESS
// Test 2: CLIENT_ADMIN A requests CLIENT_ADMIN B's data → 403 FORBIDDEN
// Test 3: SUPER_ADMIN requests any client's data → SUCCESS
```

**Affected Files**:
- `/src/app/api/analytics/campaigns/route.ts`
- `/src/app/api/analytics/dashboard/route.ts`
- `/src/app/api/analytics/clicks/route.ts`
- `/src/app/api/analytics/sequences/[campaignName]/route.ts`

**Implementation Pattern**:
```typescript
// Replace permissive logic with strict client isolation
if (session.user.role === 'CLIENT_ADMIN' || session.user.role === 'CLIENT_USER') {
  // Can ONLY access their own client
  if (requestedClientId && requestedClientId !== session.user.clientId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  clientId = session.user.clientId;
} else if (session.user.role === 'SUPER_ADMIN') {
  // Can access any client
  clientId = requestedClientId || null;
}
```

---

### 2.2 Add HTTPS Enforcement Middleware
**File**: `/src/middleware.ts`
**Issue**: No HTTPS redirect in production

**Test Cases**:
```typescript
// Test 1: HTTP request in production → redirects to HTTPS
// Test 2: HTTPS request → continues normally
// Test 3: Development HTTP request → no redirect
```

**Implementation**:
```typescript
// Add to existing middleware
if (process.env.NODE_ENV === 'production') {
  const protocol = request.headers.get('x-forwarded-proto');
  if (protocol !== 'https') {
    const host = request.headers.get('host');
    return NextResponse.redirect(`https://${host}${request.nextUrl.pathname}${request.nextUrl.search}`);
  }
}
```

---

### 2.3 Add Rate Limiting to Auth Endpoints
**New File**: `/src/lib/rate-limit.ts`
**Issue**: No protection against brute force attacks

**Test Cases**:
```typescript
// Test 1: 5 login attempts → all succeed
// Test 2: 6th login attempt → 429 Too Many Requests
// Test 3: After 15 minutes → rate limit resets
```

**Implementation**:
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create rate limiter
export const authRateLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 attempts per 15 min
  analytics: true,
});

// Apply to auth endpoints
const identifier = request.ip || 'anonymous';
const { success } = await authRateLimiter.limit(identifier);
if (!success) {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
}
```

**Note**: Requires Upstash Redis (free tier available) or alternative rate limiting solution

---

### 2.4 Add Password Complexity Requirements
**File**: `/src/lib/utils/password.ts`
**Issue**: No password strength validation

**Test Cases**:
```typescript
// Test 1: "password" → fails (too weak)
// Test 2: "Password1!" → succeeds
// Test 3: "short1!" → fails (too short)
// Test 4: "PASSWORD1!" → fails (no lowercase)
```

**Implementation**:
```typescript
import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character');

// Apply to registration, password change, and user creation endpoints
```

---

## PHASE 3: PERFORMANCE OPTIMIZATIONS (2 hours)

### 3.1 Remove Framer Motion from Repetitive Elements
**Files**: Multiple component files
**Issue**: Heavy animations on every card/row causing slow renders

**Test Cases**:
```typescript
// Test 1: Page load time < 1 second (vs current 2-3 seconds)
// Test 2: No visual jank during interactions
// Test 3: Lighthouse performance score > 85
```

**Implementation Strategy**:
- **KEEP**: Page transitions, modals
- **REMOVE**: Table rows, cards, list items
- **REPLACE WITH**: CSS animations

```css
/* Add to globals.css */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fade-in 0.2s ease-out;
}
```

**Affected Components**:
- `/src/app/(client)/leads/page.tsx` - Lead table rows
- `/src/app/(client)/project-management/page.tsx` - Task cards
- `/src/app/(client)/dashboard/page.tsx` - Stat cards
- `/src/app/(client)/analytics/page.tsx` - Chart containers

---

### 3.2 Add Composite Database Indexes
**New File**: `/migrations/add-performance-indexes.sql`
**Issue**: Missing indexes for common query patterns

**Test Cases**:
```sql
-- Test 1: Query with (clientId, campaignName, status) uses index
EXPLAIN ANALYZE SELECT * FROM leads
WHERE client_id = 'xxx' AND campaign_name = 'Campaign A' AND processing_status = 'Qualified';

-- Test 2: Lead sorting uses index
EXPLAIN ANALYZE SELECT * FROM leads
WHERE client_id = 'xxx' ORDER BY icp_score DESC;

-- Test 3: Sequence queries use index
EXPLAIN ANALYZE SELECT * FROM leads
WHERE client_id = 'xxx' AND sms_sequence_position > 0
ORDER BY sms_last_sent_at DESC;
```

**Implementation**:
```sql
-- Analytics queries
CREATE INDEX IF NOT EXISTS idx_leads_analytics
ON leads(client_id, campaign_name, processing_status);

-- Lead sorting
CREATE INDEX IF NOT EXISTS idx_leads_client_icp
ON leads(client_id, icp_score DESC);

-- Sequence tracking
CREATE INDEX IF NOT EXISTS idx_leads_sequence
ON leads(client_id, sms_sequence_position, sms_last_sent_at DESC);

-- Project tasks by client and status
CREATE INDEX IF NOT EXISTS idx_tasks_client_status
ON client_project_tasks(client_id, status, priority);
```

---

### 3.3 Convert Sequential API Calls to Parallel
**Files**: Pages with multiple fetch calls
**Issue**: Serial fetches cause cumulative delays

**Test Cases**:
```typescript
// Test 1: Dashboard loads in < 500ms (vs current 2000ms)
// Test 2: Admin client detail page loads in < 600ms
// Test 3: Network waterfall shows parallel requests
```

**Affected Files**:
- `/src/app/(client)/admin/clients/[id]/page.tsx` lines 154-186
- `/src/app/(client)/dashboard/page.tsx` (if applicable)

**Implementation**:
```typescript
// BEFORE (serial - 2000ms):
const clientRes = await fetch(`/api/admin/clients/${clientId}`);
const usersRes = await fetch(`/api/admin/users?clientId=${clientId}`);
const campaignsRes = await fetch(`/api/admin/campaigns?clientId=${clientId}`);
const healthRes = await fetch(`/api/admin/clients/${clientId}/health`);

// AFTER (parallel - 500ms):
const [clientRes, usersRes, campaignsRes, healthRes] = await Promise.all([
  fetch(`/api/admin/clients/${clientId}`),
  fetch(`/api/admin/users?clientId=${clientId}`),
  fetch(`/api/admin/campaigns?clientId=${clientId}`),
  fetch(`/api/admin/clients/${clientId}/health`),
]);
```

---

### 3.4 Enable Next.js Response Compression
**File**: `next.config.js`
**Issue**: Responses not compressed

**Test Cases**:
```typescript
// Test 1: API response includes Content-Encoding: gzip
// Test 2: Response size reduced by 60-80%
// Test 3: No impact on response time
```

**Implementation**:
```javascript
module.exports = {
  compress: true, // Enable gzip compression
  // ... rest of config
};
```

---

## PHASE 4: AUDIT LOGGING & MONITORING (1 hour)

### 4.1 Implement Comprehensive Audit Logging
**New File**: `/src/lib/audit-logger.ts`
**Issue**: No audit trail for sensitive actions

**Test Cases**:
```typescript
// Test 1: User login creates activity log entry
// Test 2: Lead data access creates log entry
// Test 3: Data modification creates log entry with before/after
// Test 4: Failed auth attempts are logged
```

**Implementation**:
```typescript
import { db } from '@/lib/db';
import { activityLog } from '@/lib/db/schema';

export async function logActivity(params: {
  userId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: any;
  ipAddress?: string;
}) {
  await db.insert(activityLog).values({
    userId: params.userId,
    action: params.action,
    targetType: params.targetType || null,
    targetId: params.targetId || null,
    metadata: params.metadata || null,
    ipAddress: params.ipAddress || null,
  });
}

// Usage in auth:
await logActivity({
  userId: user.id,
  action: 'USER_LOGIN',
  ipAddress: request.ip,
});

// Usage in data access:
await logActivity({
  userId: session.user.id,
  action: 'LEAD_VIEW',
  targetType: 'lead',
  targetId: leadId,
});
```

---

## PHASE 5: TESTING & VERIFICATION (1 hour)

### 5.1 Security Testing
```bash
# Test 1: Client isolation
npm run test:security

# Manual test:
# 1. Login as CLIENT_ADMIN for Client A
# 2. Try to fetch /api/leads → Should see only Client A leads
# 3. Try to fetch /api/analytics/dashboard?clientId=CLIENT_B_ID → Should get 403

# Test 2: Rate limiting
# Run 10 login attempts rapidly → Should be rate limited

# Test 3: Password requirements
# Try to create user with weak password → Should fail validation
```

### 5.2 Performance Testing
```bash
# Test 1: Page load times
npm run lighthouse

# Test 2: Database query performance
npm run test:db-performance

# Test 3: API response times
npm run test:api-performance

# Expected results:
# - Page load: < 1 second
# - API responses: < 300ms
# - Database queries: < 100ms
```

### 5.3 Build & Deploy Verification
```bash
# Build production
npm run build

# Check bundle size (should be < 500KB after framer-motion removal)
# Verify all tests pass
npm run test

# Deploy to Render
git push origin main
```

---

## IMPLEMENTATION ORDER

### Day 1 - Critical Security (2-3 hours):
1. ✅ Fix /api/leads data leak
2. ✅ Fix NEXTAUTH_SECRET
3. ✅ Add security headers
4. ✅ Fix ADMIN cross-client access
5. ✅ Add HTTPS enforcement

### Day 1 - Quick Performance Wins (1-2 hours):
6. ✅ Remove framer-motion from tables
7. ✅ Add database indexes
8. ✅ Convert to Promise.all()
9. ✅ Enable compression

### Day 2 - Additional Security (1-2 hours):
10. ✅ Add rate limiting
11. ✅ Add password complexity
12. ✅ Implement audit logging

### Day 2 - Testing & Deployment (1 hour):
13. ✅ Run all tests
14. ✅ Performance verification
15. ✅ Deploy to production

---

## SUCCESS METRICS

### Security:
- ✅ Zero data leaks between clients
- ✅ All auth endpoints rate-limited
- ✅ Strong password enforcement
- ✅ Comprehensive audit trail
- ✅ Security headers on all responses

### Performance:
- ✅ Page load < 1 second (from 2-3 seconds)
- ✅ API response < 300ms (from 500ms)
- ✅ Database queries < 100ms
- ✅ Lighthouse score > 85 (from ~65)

### Scalability:
- ✅ Supports 10+ clients concurrently
- ✅ 25 database connection pool
- ✅ Efficient query patterns with indexes

---

## ROLLBACK PLAN

If issues arise during deployment:

1. **Render Dashboard** → Rollback to previous deployment
2. **Database migrations** → Run rollback script:
   ```sql
   DROP INDEX IF EXISTS idx_leads_analytics;
   DROP INDEX IF EXISTS idx_leads_client_icp;
   DROP INDEX IF EXISTS idx_leads_sequence;
   ```
3. **Git** → Revert commits:
   ```bash
   git revert HEAD
   git push origin main
   ```

---

## ADDITIONAL NOTES

### Dependencies to Add:
```json
{
  "@upstash/ratelimit": "^1.0.0",
  "@upstash/redis": "^1.25.0"
}
```

### Environment Variables Needed:
```env
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
UPSTASH_REDIS_REST_URL=<from-upstash-console>
UPSTASH_REDIS_REST_TOKEN=<from-upstash-console>
```

### Documentation to Update:
- README.md - Add security features
- DEPLOYMENT.md - Add rate limiting setup
- .env.example - Add new required variables

---

**End of TDD Implementation Plan**
