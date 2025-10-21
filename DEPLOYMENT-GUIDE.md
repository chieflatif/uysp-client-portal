# UYSP Client Portal - Production Deployment Guide

**Date**: 2025-10-20  
**Security**: ✅ Production-Ready  
**Multi-Tenant**: ✅ Supported  
**Current State**: Ready to deploy

---

## 🚀 Quick Start Deployment (30 Minutes)

### Prerequisites:
- [x] PostgreSQL database (running locally or Render)
- [x] Airtable account with base ID
- [x] Render or Vercel account for deployment

---

## Step 1: Prepare Secrets (5 minutes)

### Generate NEXTAUTH_SECRET:
```bash
# On your machine:
openssl rand -base64 32

# Copy the output - you'll need it for .env
```

### Collect Required Environment Variables:
```bash
# You need these values:
DATABASE_URL=postgresql://user:pass@host:5432/dbname
AIRTABLE_API_KEY=pat_xxxxxxxxxxxxx
AIRTABLE_BASE_ID=app4wIsBfpJTg7pWS
NEXTAUTH_SECRET=<generated-secret-from-above>
NEXTAUTH_URL=http://localhost:3000  # Change to production URL after deploy
NODE_ENV=production
```

---

## Step 2: Setup Database (10 minutes)

### 2a. Create Client Record:
```bash
# Run setup script to create Rebel HQ client:
npx tsx scripts/setup-first-client.ts

# Output should show:
# ✅ Client created successfully!
# Company: Rebel HQ
# Email: rebel@rebelhq.ai
```

### 2b. Create Your Admin User:
```bash
# Run user creation script:
npx tsx scripts/create-client-user.ts

# Follow prompts:
# - Select client: 1 (Rebel HQ)
# - Email: rebel@rebelhq.ai (or your email)
# - Password: <strong-password>
# - First name: Your name
# - Last name: Your name
# - Role: ADMIN
```

### 2c. Test Login Locally:
```bash
# Start portal:
npm run dev

# Open browser: http://localhost:3000/login
# Login with your credentials
# Verify you see dashboard and leads
```

---

## Step 3: Deploy to Render (15 minutes)

### 3a. Create Web Service on Render:
```bash
1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Configure:
   - Name: uysp-client-portal
   - Environment: Node
   - Build Command: npm install && npm run build
   - Start Command: npm run start
   - Plan: Free or Starter ($7/mo)
```

### 3b. Add Environment Variables:
```bash
# In Render dashboard, add these secrets:

DATABASE_URL = <your-postgres-connection-string>
AIRTABLE_API_KEY = <your-airtable-api-key>
AIRTABLE_BASE_ID = app4wIsBfpJTg7pWS
NEXTAUTH_SECRET = <generated-secret>
NEXTAUTH_URL = https://your-app.onrender.com
NODE_ENV = production
ALLOW_PUBLIC_REGISTRATION = false  # Disable public registration
```

### 3c. Deploy:
```bash
# Render will automatically deploy
# Wait for build to complete (~5-10 minutes)
# Check logs for any errors
```

---

## Step 4: Post-Deployment Testing (5 minutes)

### Test Checklist:
```bash
# 1. Test login
https://your-app.onrender.com/login
✓ Login with your credentials
✓ See dashboard

# 2. Test leads list
✓ Click "Leads"
✓ See 11,046 leads (or your count)
✓ Search works
✓ Sort works
✓ LinkedIn links work

# 3. Test lead detail
✓ Click a lead
✓ See full details
✓ Claim/unclaim works
✓ Notes work

# 4. Test analytics
✓ Click "Analytics"
✓ See campaigns
✓ Click campaign → drill-down
✓ Search within campaign works

# 5. Test security
✓ Logout
✓ Try accessing /dashboard without login → redirected
✓ Try registering with @gmail.com → Rejected (not authorized domain)
✓ Only @rebelhq.ai emails can register
```

---

## 🔒 Security Configuration

### Multi-Tenant Isolation:
**How it works:**
- Every user has a `clientId` (assigned on registration)
- Every lead has a `clientId`
- API routes filter leads by `session.user.clientId`
- Users can only see/modify leads from their client
- ADMIN role bypasses filters (sees all)

### Registration Security:
**Current Setup:**
- Public registration **disabled by default in production**
- Set `ALLOW_PUBLIC_REGISTRATION=true` to enable
- When enabled, email domain must match a client
- Automatically assigns correct `clientId`

**For your deployment:**
```bash
# Keep registration disabled (recommended):
ALLOW_PUBLIC_REGISTRATION=false

# You'll create users via script:
npx tsx scripts/create-client-user.ts
```

---

## 🏢 Adding Future Clients

### When You Get Client #2:

**Step 1: Create Client Record**
```bash
# Option A: Use SQL
INSERT INTO clients (company_name, email, airtable_base_id, is_active)
VALUES ('Client B', 'contact@clientb.com', 'appNewBaseIDHere', true);

# Option B: Create script (I can add this if needed)
```

**Step 2: Sync Their Leads**
```bash
# You'll need to:
1. Get their Airtable base ID
2. Modify sync to handle multiple bases, OR
3. Run separate sync for each client's base
4. Ensure each lead gets correct clientId
```

**Step 3: Create Their Users**
```bash
npx tsx scripts/create-client-user.ts
# Select the new client
# Create their team members
```

**Step 4: Verify Isolation**
```bash
# Test:
1. Login as Client A user → sees only Client A leads
2. Login as Client B user → sees only Client B leads
3. Verify Client A cannot access Client B lead via API
```

---

## 📊 Database Schema (Current State)

### Clients Table:
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  airtable_base_id VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Users Table:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'CLIENT',  -- SUPER_ADMIN, ADMIN, CLIENT
  client_id UUID REFERENCES clients(id),  -- Links user to client
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Leads Table (includes client_id):
```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY,
  client_id UUID NOT NULL,  -- Every lead belongs to a client
  airtable_record_id VARCHAR(255) NOT NULL,
  -- ... all other fields
);
```

---

## 🎯 Environment Variables Reference

### Development (.env.local):
```bash
DATABASE_URL=postgresql://uysp_user:uysp_dev_password@localhost:5432/uysp_portal
AIRTABLE_API_KEY=pat_xxxxxxxxxxxxx
AIRTABLE_BASE_ID=app4wIsBfpJTg7pWS
NEXTAUTH_SECRET=<generated-secret>
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
ALLOW_PUBLIC_REGISTRATION=true  # Allow in dev for testing
```

### Production (Render/Vercel):
```bash
DATABASE_URL=<render-postgres-url>
AIRTABLE_API_KEY=<your-api-key>
AIRTABLE_BASE_ID=app4wIsBfpJTg7pWS
NEXTAUTH_SECRET=<strong-generated-secret>
NEXTAUTH_URL=https://your-app.onrender.com
NODE_ENV=production
ALLOW_PUBLIC_REGISTRATION=false  # Disabled in production
```

---

## 🔧 Maintenance Scripts

### Create New User:
```bash
npx tsx scripts/create-client-user.ts
```

### Setup First Client:
```bash
npx tsx scripts/setup-first-client.ts
```

### Sync Leads from Airtable:
```bash
npx tsx scripts/quick-resync.ts
```

### Verify Data:
```bash
npx tsx scripts/verify-sync-data.ts
```

---

## 🚨 Troubleshooting

### "Registration disabled" error:
```bash
# If you want to allow registration in production:
ALLOW_PUBLIC_REGISTRATION=true

# But users must have email domain matching a client
# Example: If client.email = "rebel@rebelhq.ai"
# Then user can register with any @rebelhq.ai email
```

### "Email domain not authorized":
```bash
# User's email domain doesn't match any client
# Solution:
1. Create client record with matching email domain, OR
2. Use create-client-user.ts script to manually add user
```

### Can't login after deployment:
```bash
# Check:
1. NEXTAUTH_SECRET set in production env?
2. DATABASE_URL correct?
3. User exists in database?
4. User is_active = true?
```

### User sees no leads:
```bash
# Check:
1. User has clientId assigned?
2. Leads have matching clientId?
3. Run sync: npx tsx scripts/quick-resync.ts
```

---

## ✅ Pre-Deployment Checklist

### Security:
- [ ] NEXTAUTH_SECRET generated (strong, 32+ chars)
- [ ] Production secrets NOT in code (only in env vars)
- [ ] .env.local in .gitignore
- [ ] ALLOW_PUBLIC_REGISTRATION=false in production
- [ ] First admin user created

### Database:
- [ ] PostgreSQL database created (Render or external)
- [ ] Schema migrated (tables created)
- [ ] Client record exists
- [ ] Admin user created and tested
- [ ] Leads synced from Airtable

### Testing:
- [ ] Login works locally
- [ ] Dashboard shows correct data
- [ ] Leads filtered by clientId
- [ ] Search/sort working
- [ ] Analytics working
- [ ] All pages use dark theme

### Deployment:
- [ ] Code pushed to GitHub
- [ ] Render/Vercel service created
- [ ] All environment variables set
- [ ] Build successful
- [ ] Production URL working
- [ ] HTTPS enforced (automatic on Render/Vercel)

---

## 📖 What You Get

**For Today (1 Client)**:
- Secure portal for Rebel HQ
- 11,046 leads accessible
- Search, sort, analytics
- LinkedIn integration
- Campaign tracking
- Activity logging

**For Future (Multiple Clients)**:
- Same portal, multiple clients
- Complete data isolation
- Each client sees only their leads
- You (as SUPER_ADMIN) see all
- Easy to add new clients

---

## 🎁 Quick Commands Reference

```bash
# Generate secret
openssl rand -base64 32

# Setup first client
npx tsx scripts/setup-first-client.ts

# Create user
npx tsx scripts/create-client-user.ts

# Sync leads
npx tsx scripts/quick-resync.ts

# Test locally
npm run dev

# Build for production
npm run build

# Start production
npm run start
```

---

**Ready to deploy!**

**Estimated time**: 30 minutes from start to live portal  
**Security level**: Production-ready  
**Multi-tenant**: Supported out of the box

**Next action**: Generate your NEXTAUTH_SECRET and let's deploy!



