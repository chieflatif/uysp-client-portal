# SECURITY AUDIT - QUICK REFERENCE CARD
**Date:** 2025-11-07 | **Status:** 🔴 NOT PRODUCTION READY

---

## 🚨 CRITICAL FIXES NEEDED (DEPLOY BLOCKERS)

### 1. Password Setup Endpoint - AUTHENTICATION BYPASS

**File:** `src/app/api/auth/setup-password/route.ts`

**Problem:** Anyone can set password for any account (just needs email)

**Quick Fix (Temporary - Disable Feature):**
```typescript
export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'Temporarily disabled' }, { status: 503 });
}
```

**Proper Fix (Requires token system):**
```typescript
const { token, password } = await request.json(); // Not email!
const user = await validatePasswordSetupToken(token);
if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
```

---

### 2. Rate Limiter - COMPLETELY INEFFECTIVE

**File:** `src/lib/utils/rate-limit.ts`

**Problem:** In-memory Map doesn't work in serverless (each instance = fresh limit)

**Quick Fix:**
```bash
npm install @upstash/redis
```

**Code:**
```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

export async function rateLimit(identifier: string, action: string, max: number, window: number) {
  const key = `ratelimit:${action}:${identifier}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, window);

  const ttl = await redis.ttl(key);
  return {
    success: count <= max,
    remaining: Math.max(0, max - count),
    resetAt: Date.now() + (ttl * 1000),
  };
}
```

---

### 3. Token System - NOT IMPLEMENTED

**File:** Create `src/lib/auth/password-setup-tokens.ts`

**Copy this complete implementation:**
```typescript
import crypto from 'crypto';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export async function generatePasswordSetupToken(userId: string, expiryHours = 24): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + expiryHours);

  await db.update(users).set({
    passwordSetupToken: tokenHash,
    passwordSetupTokenExpiry: expiryDate,
  }).where(eq(users.id, userId));

  return token; // Send this in email
}

export async function validatePasswordSetupToken(token: string) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const user = await db.query.users.findFirst({
    where: (users) => and(
      eq(users.passwordSetupToken, tokenHash),
      gt(users.passwordSetupTokenExpiry, new Date())
    ),
  });

  return user || null;
}

export async function invalidatePasswordSetupToken(userId: string): Promise<void> {
  await db.update(users).set({
    passwordSetupToken: null,
    passwordSetupTokenExpiry: null,
  }).where(eq(users.id, userId));
}
```

---

## ⚠️ HIGH PRIORITY FIXES

### 4. SQL Injection - Add Domain Validation

**File:** `src/app/api/auth/register/route.ts` (Line 60)

**Add before sanitization:**
```typescript
const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;
if (!domainRegex.test(emailDomain)) {
  return NextResponse.json({ error: 'Invalid email domain format' }, { status: 400 });
}
const sanitizedDomain = emailDomain.replace(/[%_\\]/g, '\\$&');
```

---

### 5. Foreign Keys - Prevent Data Loss

**File:** `migrations/0034_add_foreign_key_constraints.sql`

**Change CASCADE to RESTRICT:**
```sql
-- Change line 26 from ON DELETE CASCADE to:
ALTER TABLE campaigns
  ADD CONSTRAINT fk_campaigns_client_id
  FOREIGN KEY (client_id)
  REFERENCES clients(id)
  ON DELETE RESTRICT;  -- Prevents accidental deletion
```

---

### 6. Session Invalidation - Password Changes

**File:** `src/app/api/auth/change-password/route.ts`

**Add after password update (line 99):**
```typescript
// TODO: Implement session invalidation
// await invalidateAllUserSessions(session.user.id);
// For now, user must manually re-login after password change
```

---

## 🧪 QUICK SECURITY TEST SUITE

```typescript
// Run these tests before deploying

describe('Security Regression Tests', () => {
  it('blocks password setup without token', async () => {
    const res = await POST('/api/auth/setup-password', {
      email: 'user@test.com',
      password: 'Test123!',
    });
    expect(res.status).toBe(401); // or 503 if disabled
  });

  it('enforces rate limiting', async () => {
    for (let i = 0; i < 6; i++) {
      await POST('/api/auth/change-password', { /* ... */ });
    }
    const res = await POST('/api/auth/change-password', { /* ... */ });
    expect(res.status).toBe(429);
  });

  it('rejects XSS in email domain', async () => {
    const res = await POST('/api/auth/register', {
      email: 'user@<script>alert(1)</script>.com',
      password: 'Test123!',
      firstName: 'Test',
      lastName: 'User',
    });
    expect(res.status).toBe(400);
  });
});
```

---

## 📋 DEPLOYMENT CHECKLIST

**Before Next Deploy:**

- [ ] ✅ Password setup endpoint disabled OR token validation implemented
- [ ] ✅ Redis rate limiting deployed and tested
- [ ] ✅ Token generation system created and tested
- [ ] ✅ Domain validation added to registration
- [ ] ✅ Security tests passing
- [ ] ✅ Environment variables configured:
  - `UPSTASH_REDIS_URL`
  - `UPSTASH_REDIS_TOKEN`

**Before Production Launch:**

- [ ] ✅ All blockers resolved
- [ ] ✅ Foreign key behaviors reviewed
- [ ] ✅ Session invalidation implemented
- [ ] ✅ Password min length updated to 12
- [ ] ✅ Information leakage in errors fixed
- [ ] ✅ Penetration testing completed

---

## 🔗 ENVIRONMENT SETUP

**Redis (Upstash - Free Tier):**
1. Sign up: https://upstash.com
2. Create Redis database
3. Copy REST URL and token
4. Add to `.env`:
```bash
UPSTASH_REDIS_URL=https://your-region.upstash.io
UPSTASH_REDIS_TOKEN=your-token-here
```

---

## 📊 SEVERITY LEVELS

| Level | Description | Action |
|-------|-------------|--------|
| 🔴 CRITICAL | Account takeover, data loss | Fix before ANY deploy |
| ⚠️ HIGH | Security bypass, compliance | Fix before production |
| 🟡 MEDIUM | Best practices, hardening | Fix in sprint 2-3 |
| ℹ️ LOW | Minor improvements | Fix when possible |

---

## 🎯 CURRENT STATUS

**Files with CRITICAL issues:**
- `src/app/api/auth/setup-password/route.ts` - 🔴 AUTHENTICATION BYPASS
- `src/lib/utils/rate-limit.ts` - 🔴 INEFFECTIVE IN PRODUCTION
- `src/lib/auth/password-setup-tokens.ts` - 🔴 MISSING (NOT IMPLEMENTED)

**Files with HIGH issues:**
- `src/app/api/auth/register/route.ts` - ⚠️ INCOMPLETE SQL INJECTION FIX
- `migrations/0034_add_foreign_key_constraints.sql` - ⚠️ DATA LOSS RISK
- `src/app/api/auth/change-password/route.ts` - ⚠️ NO SESSION INVALIDATION

**Files that are GOOD:**
- `src/lib/activity/logger.ts` - ✅ EXCELLENT (transaction safety)
- `migrations/0032_add_password_setup_tokens.sql` - ✅ CORRECT
- `migrations/0033_add_composite_indexes.sql` - ✅ EXCELLENT

---

## 💬 QUICK ANSWERS

**Q: Can we deploy today?**
A: 🔴 NO - Critical authentication bypass must be fixed first

**Q: What's the fastest path to production?**
A: 1) Disable setup-password endpoint (5 min)
    2) Deploy Redis rate limiter (2 hours)
    3) Implement token system (4 hours)
    4) Run security tests (1 hour)
    = ~1 business day

**Q: Is the SQL injection fix working?**
A: ⚠️ MOSTLY - Works for wildcards but needs domain validation

**Q: Are transactions safe?**
A: ✅ YES - Activity logger is perfectly implemented

**Q: Can rate limiting be bypassed?**
A: 🔴 YES - Current in-memory implementation ineffective in serverless

---

**For full details, see:** `SECURITY-AUDIT-SPRINT-PRIORITIES.md`
