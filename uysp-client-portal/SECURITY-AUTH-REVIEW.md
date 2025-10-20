# Security & Authentication Review - Production Deployment

**Date**: 2025-10-20  
**Purpose**: Pre-deployment security audit and multi-tenant authentication strategy  
**Current State**: Development mode with open registration  
**Target State**: Production-ready with secure multi-tenant access

---

## 🚨 Current Security Issues (CRITICAL)

### Issue #1: Open Registration
**Problem**: Anyone can register with any email  
**Risk**: Unauthorized access to client data  
**Current Code**:
```typescript
// src/app/api/auth/register/route.ts
// Creates user with role='CLIENT' for ANY email
const newUser = await db.insert(users).values({
  email,  // No validation against clients table
  role: 'CLIENT',  // Automatic CLIENT access
});
```

### Issue #2: No Client Association Validation
**Problem**: Registration doesn't verify user belongs to a client  
**Risk**: Users could see other clients' leads  
**Current Code**:
```typescript
// No check if email domain matches client.email
// No clientId assignment during registration
```

### Issue #3: Weak Session Security
**Problem**: JWT secret is weak dev key  
**Risk**: Session hijacking in production  
**Current Code**:
```typescript
jwt: {
  secret: process.env.NEXTAUTH_SECRET || 'dev-secret-key-uysp-client-portal-2025-change-in-production',
}
```

### Issue #4: No Rate Limiting
**Problem**: No protection against brute force attacks  
**Risk**: Password guessing, DoS attacks  
**Status**: No rate limiting implemented

### Issue #5: Unprotected API Routes
**Problem**: Some API routes may not check clientId properly  
**Risk**: Cross-client data leakage  
**Status**: Needs audit

---

## 🎯 Multi-Tenant Architecture Strategy

### Current Database Schema (Review):
```sql
-- Clients table
clients (
  id UUID PRIMARY KEY,
  company_name VARCHAR,
  email VARCHAR,  -- Client contact email
  airtable_base_id VARCHAR
)

-- Users table
users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE,
  client_id UUID,  -- Links to clients table
  role VARCHAR  -- SUPER_ADMIN, ADMIN, CLIENT
)

-- Leads table
leads (
  id UUID PRIMARY KEY,
  client_id UUID,  -- Every lead belongs to a client
  airtable_record_id VARCHAR
)
```

### Multi-Tenant Access Pattern:
1. **User registers** → Must match email domain of existing client
2. **User assigned** → clientId from clients table
3. **User queries leads** → Filtered by session.user.clientId
4. **Admin users** → Can see all clients (role = 'ADMIN')

---

## ✅ Recommended Security Implementation

### Option 1: Closed Registration (RECOMMENDED FOR NOW)
**Strategy**: Disable public registration, manually create users

**Implementation**:
```typescript
// 1. Disable /register page (redirect to login)
// 2. Keep registration API for admin use only
// 3. Create admin script to add users
// 4. Manually assign clientId when creating users
```

**Pros**:
- ✅ Complete control over who gets access
- ✅ No risk of unauthorized registration
- ✅ Simple to implement
- ✅ Works for your current single client

**Cons**:
- ❌ Manual user creation (but you only have 1 client now)

### Option 2: Client-Verified Registration (FUTURE)
**Strategy**: Allow registration only if email matches client record

**Implementation**:
```typescript
// 1. Check if email domain matches client.email domain
// 2. Automatically assign clientId based on email match
// 3. Require admin approval before activation
// 4. Send email verification
```

**Pros**:
- ✅ Self-service for clients
- ✅ Scales to multiple clients
- ✅ Verifiable access

**Cons**:
- ❌ More complex
- ❌ Requires email verification system
- ❌ Not needed for single client today

---

## 🔒 Recommended Immediate Actions

### Priority 1: Secure JWT Secret (5 min)
```bash
# Generate strong secret
openssl rand -base64 32

# Add to .env.local (NEVER commit)
NEXTAUTH_SECRET=<generated-secret>

# Add to production environment variables
```

### Priority 2: Disable Public Registration (10 min)
```typescript
// src/app/(auth)/register/page.tsx
// Add redirect to login for now
useEffect(() => {
  if (process.env.NODE_ENV === 'production') {
    router.push('/login');
  }
}, []);
```

### Priority 3: Create Admin User Script (15 min)
```typescript
// scripts/create-user.ts
// CLI tool to manually create users with clientId
async function createUser(email, password, clientId, role) {
  // Hash password
  // Insert user with clientId
  // Validate clientId exists
}
```

### Priority 4: Audit API Route Authorization (30 min)
**Check every API route has**:
```typescript
// 1. Authentication check
const session = await auth();
if (!session?.user?.id) return 401;

// 2. Client isolation (unless ADMIN)
if (session.user.clientId !== lead.clientId && session.user.role !== 'ADMIN') {
  return 403; // Forbidden
}
```

### Priority 5: Add Rate Limiting (20 min)
```typescript
// Use next-rate-limit or similar
// Protect /api/auth/* endpoints
// Max 5 login attempts per minute
```

---

## 🏗️ Multi-Tenant Implementation Plan

### Phase 1: Secure for First Client (TODAY - 1 hour)
1. ✅ Generate strong NEXTAUTH_SECRET
2. ✅ Disable public registration route
3. ✅ Create admin script to add users
4. ✅ Audit all API routes for clientId checks
5. ✅ Test: User from Client A cannot see Client B leads

### Phase 2: Enable Client-Verified Registration (FUTURE - 2 hours)
1. ⏳ Email domain verification
2. ⏳ Automatic clientId assignment
3. ⏳ Admin approval workflow
4. ⏳ Email verification system

### Phase 3: Advanced Security (FUTURE - 3 hours)
1. ⏳ Rate limiting on all auth endpoints
2. ⏳ IP-based access controls
3. ⏳ Session timeout warnings
4. ⏳ Audit log for all sensitive actions
5. ⏳ Two-factor authentication (optional)

---

## 📋 Security Audit Checklist

### Authentication & Authorization
- [ ] Strong JWT secret in production
- [ ] Password hashing with bcrypt (salt rounds ≥ 10)
- [ ] Session expiry set appropriately (24 hours)
- [ ] Registration restricted (only approved clients)
- [ ] clientId validation on all API routes
- [ ] Role-based access control (ADMIN vs CLIENT)

### Data Isolation (Multi-Tenant)
- [ ] All lead queries filtered by clientId
- [ ] Cross-client access blocked (except ADMIN)
- [ ] Airtable baseId per client isolated
- [ ] Activity logs scoped to client
- [ ] Notes scoped to client

### API Security
- [ ] All routes require authentication
- [ ] CSRF protection enabled
- [ ] Rate limiting on auth endpoints
- [ ] Input validation on all endpoints
- [ ] XSS prevention (sanitize notes)
- [ ] SQL injection prevention (using Drizzle ORM ✅)

### Environment & Secrets
- [ ] .env.local never committed (✅ in .gitignore)
- [ ] Production secrets in Render/Vercel env vars
- [ ] DATABASE_URL not exposed to frontend
- [ ] AIRTABLE_API_KEY not exposed to frontend
- [ ] NEXTAUTH_SECRET strong and unique

### HTTPS & Network
- [ ] Force HTTPS in production
- [ ] Secure headers (HSTS, CSP, etc.)
- [ ] CORS properly configured
- [ ] No sensitive data in URLs

---

## 🎯 Recommended Implementation (For Today)

### Step 1: Generate Secrets (5 min)
```bash
# Generate strong NEXTAUTH_SECRET
openssl rand -base64 32

# Add to .env.local
echo "NEXTAUTH_SECRET=<generated-secret>" >> .env.local

# Add to production deployment (Render/Vercel)
```

### Step 2: Disable Public Registration (10 min)
```typescript
// Option A: Redirect register page to login
// Option B: Hide registration link from UI
// Option C: Add environment check (allow in dev, block in prod)
```

### Step 3: Create User Management Script (20 min)
```typescript
// scripts/create-client-user.ts
// Usage: npm run create-user email@client.com password ClientName
//
// 1. Find or create client by company name
// 2. Create user with email + clientId
// 3. Set role (CLIENT or ADMIN)
// 4. Hash password
// 5. Return credentials
```

### Step 4: Audit & Fix API Routes (30 min)
**Review these routes for clientId checks**:
- /api/leads (filter by clientId ✅)
- /api/leads/[id] (check clientId ✅)
- /api/leads/[id]/claim (check clientId ❓)
- /api/leads/[id]/notes (check clientId ✅)
- /api/analytics/* (filter by clientId ✅)

### Step 5: Test Multi-Tenant Isolation (15 min)
```bash
# Test scenario:
1. Create Client A with user A
2. Create Client B with user B
3. Login as user A → should only see Client A leads
4. Login as user B → should only see Client B leads
5. Login as ADMIN → should see all leads
```

---

## 🔐 Production Deployment Checklist

### Before Deploying:
- [ ] NEXTAUTH_SECRET generated and set in production env
- [ ] DATABASE_URL set in production env (not in code)
- [ ] AIRTABLE_API_KEY set in production env
- [ ] Registration disabled or secured
- [ ] Admin user created with strong password
- [ ] Client record exists in database
- [ ] Test login works with production database
- [ ] All API routes validate clientId
- [ ] HTTPS enforced (handled by Render/Vercel)

### After Deploying:
- [ ] Test login from public URL
- [ ] Verify client data isolation
- [ ] Check activity logs working
- [ ] Monitor for auth errors
- [ ] Test logout/session expiry

---

## 📖 Your Specific Scenario

### Today (1 Client):
**Your Client**: Rebel HQ  
**Users**: You + maybe team members  
**Access**: All see same Airtable base (11,046 leads)

**Recommended Approach**:
1. ✅ Disable public registration
2. ✅ Manually create users via script
3. ✅ All users get same clientId (Rebel HQ)
4. ✅ Deploy with strong secrets

### Future (Multiple Clients):
**Scenario**: Client A, Client B, Client C  
**Each Client Has**:
- Separate Airtable base
- Separate users
- Isolated lead data
- Independent campaigns

**Required**:
1. ⏳ Client-verified registration (email domain matching)
2. ⏳ Per-client Airtable base configuration
3. ⏳ Strict data isolation enforcement
4. ⏳ Admin panel to manage clients

---

## 🚀 Recommended Action Plan (Next 90 Minutes)

### Task 1: Security Hardening (45 min)
1. Generate NEXTAUTH_SECRET
2. Update registration to verify against clients table
3. Create user management script
4. Audit all API routes
5. Document security model

### Task 2: Test Multi-Tenant (30 min)
1. Create test client records
2. Create test users for each client
3. Verify data isolation
4. Test cross-client access blocked
5. Test ADMIN can see all

### Task 3: Deployment Prep (15 min)
1. Document environment variables needed
2. Create deployment checklist
3. Document first user creation process
4. Security review sign-off

---

**Ready to implement? I'll:**
1. ✅ Secure registration (client verification)
2. ✅ Create user management script
3. ✅ Audit all API routes
4. ✅ Add rate limiting
5. ✅ Document production deployment process

**Proceed with security implementation?**

