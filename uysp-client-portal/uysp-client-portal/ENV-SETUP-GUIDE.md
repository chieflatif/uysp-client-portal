# 🔐 UYSP Client Portal - Environment Variable Setup Guide

This guide explains how to fill in your `.env.local` file with actual credentials.

## Quick Start

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in the values below with your actual credentials

3. **NEVER commit `.env.local` to git** (it's already in `.gitignore`)

---

## 🔑 Getting Your Credentials

### 1. Airtable Personal Access Token (PAT)

**Where to get it:**
1. Go to https://airtable.com/account/tokens
2. Click "Create new token" 
3. Name it: `UYSP Client Portal`
4. Give it these scopes:
   - `data.records:read`
   - `data.records:write`
   - `schema.bases:read`
5. Click "Create token"
6. Copy the token value

**In `.env.local`:**
```
AIRTABLE_API_KEY=pat_XXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 2. Airtable Base ID

**Where to get it:**
1. Open your Airtable base in browser
2. Look at the URL: `https://airtable.com/app**XXXXXXXXXX**/...`
3. Copy everything after `/app` - that's your Base ID

**In `.env.local`:**
```
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
```

### 3. NextAuth Secrets

**Generate random secrets:**
```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate JWT_SECRET
openssl rand -base64 32
```

**In `.env.local`:**
```
NEXTAUTH_SECRET=<paste-first-random-string>
JWT_SECRET=<paste-second-random-string>
```

### 4. Database Configuration

#### Option A: Local Development (PostgreSQL)

1. Install PostgreSQL:
   ```bash
   # macOS with Homebrew
   brew install postgresql@15
   brew services start postgresql@15
   ```

2. Create database:
   ```bash
   createdb uysp_portal
   ```

3. In `.env.local`:
   ```
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/uysp_portal
   ```

#### Option B: Render.com PostgreSQL (Recommended for Production)

1. Log in to https://render.com
2. Create new PostgreSQL database:
   - Name: `uysp-portal-db`
   - PostgreSQL version: 15
3. Copy the "Internal Database URL"
4. In `.env.local` (development):
   ```
   DATABASE_URL=postgresql://localhost:5432/uysp_portal
   ```
5. In production deployment, use the Render internal URL

### 5. n8n Integration (Phase 2+)

**For now, leave as placeholder:**
```
N8N_API_URL=https://n8n.yourdomain.com/api/v1
N8N_API_KEY=your_n8n_api_key_here
```

---

## 📝 Minimal Setup for Week 1-2 Development

To get started immediately with just the essentials:

```bash
# Copy template
cp .env.example .env.local

# Edit .env.local with these values:
# 1. NEXTAUTH_SECRET - generate with: openssl rand -base64 32
# 2. JWT_SECRET - generate with: openssl rand -base64 32
# 3. AIRTABLE_API_KEY - your personal access token
# 4. AIRTABLE_BASE_ID - your base ID
# 5. DATABASE_URL - keep as localhost (local PostgreSQL)

# That's it! Everything else can stay as default.
```

---

## ✅ Verification Checklist

Before starting `npm run dev`:

- [ ] `.env.local` file exists (not committed)
- [ ] `NEXTAUTH_SECRET` is a 32-char random string
- [ ] `JWT_SECRET` is a 32-char random string
- [ ] `AIRTABLE_API_KEY` starts with `pat_`
- [ ] `AIRTABLE_BASE_ID` starts with `app`
- [ ] `DATABASE_URL` points to your PostgreSQL
- [ ] All other values filled or have sensible defaults

---

## 🚀 Starting Development

Once `.env.local` is configured:

```bash
cd uysp-client-portal

# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Start development server
npm run dev

# Open in browser
open http://localhost:3000
```

---

## 🔒 Security Notes

- **NEVER** commit `.env.local` to git
- **NEVER** share your Airtable PAT with anyone
- **NEVER** put real secrets in `.env.example`
- Use strong, randomly generated secrets for `NEXTAUTH_SECRET` and `JWT_SECRET`
- Rotate credentials if they're ever exposed

---

## 📞 Troubleshooting

**"Can't connect to database"**
- Check PostgreSQL is running: `brew services list`
- Verify DATABASE_URL is correct
- Try creating database: `createdb uysp_portal`

**"Airtable API key invalid"**
- Check token starts with `pat_`
- Verify it hasn't expired
- Regenerate if needed at https://airtable.com/account/tokens

**"NextAuth error"**
- Ensure NEXTAUTH_SECRET is set and not empty
- Check NEXTAUTH_URL matches your running server (http://localhost:3000)

---

**Questions?** Check the main PRD at `/docs/architecture/CLIENT-PORTAL-COMPLETE-SPECIFICATION.md`
