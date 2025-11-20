# 🚀 START HERE - UYSP Client Portal Setup (3 Steps)

**Status**: Project ready - awaiting your Airtable credentials  
**Time to first run**: ~5 minutes  
**Location**: `/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal/`

---

## ⚡ Quick Setup (Copy & Paste These Commands)

### Step 1: Copy Environment Template

```bash
cd /Users/latifhorst/cursor\ projects/UYSP\ Lead\ Qualification\ V1/uysp-client-portal
cp .env.example .env.local
```

### Step 2: Fill in Your Credentials

**Open `.env.local` and update these 6 values:**

```
AIRTABLE_API_KEY=<your-personal-access-token>
AIRTABLE_BASE_ID=<your-base-id>
NEXTAUTH_SECRET=<generate-below>
JWT_SECRET=<generate-below>
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/uysp_portal
NEXTAUTH_URL=http://localhost:3000
```

**Generate the secrets:**
```bash
# Run these commands and copy the output into .env.local
openssl rand -base64 32  # For NEXTAUTH_SECRET
openssl rand -base64 32  # For JWT_SECRET
```

**Get Airtable credentials:**
1. Go to https://airtable.com/account/tokens
2. Click "Create new token"
3. Give it `data.records:read` and `data.records:write` permissions
4. Copy the token → paste into `AIRTABLE_API_KEY`
5. Get your Base ID from the URL (e.g., `https://airtable.com/app**XXXXXXXXXX**/...`)

### Step 3: Start Development

```bash
# From the uysp-client-portal directory:
npm run dev
```

**Then open**: http://localhost:3000

---

## 🗄️ Database Setup (Choose One)

### Option A: Local PostgreSQL (Recommended for Development)

```bash
# Install PostgreSQL (macOS)
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb uysp_portal

# Apply database schema
npm run db:push
```

### Option B: Skip Database Setup Now

If you don't have PostgreSQL set up yet, the dev server will still start (but APIs requiring database will fail).

You can set it up later when ready:
```bash
npm run db:push  # When PostgreSQL is ready
```

---

## ✅ What's Included

- ✅ **Next.js 14** with TypeScript
- ✅ **Tailwind CSS** with shadcn/ui
- ✅ **Drizzle ORM** with PostgreSQL driver
- ✅ **NextAuth.js** for authentication
- ✅ **Database Schema** - 6 tables ready to deploy
- ✅ **Authentication Config** - Email/password login
- ✅ **Environment Template** - All variables documented

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `.env.example` | Template for environment variables |
| `.env.local` | **YOUR CREDENTIALS (fill this in!)** |
| `drizzle.config.ts` | Database configuration |
| `src/lib/db/schema.ts` | Database schema (6 tables) |
| `src/lib/auth/config.ts` | NextAuth configuration |
| `ENV-SETUP-GUIDE.md` | Detailed credential setup |
| `WEEK-1-SETUP.md` | Complete Week 1 development plan |
| `README.md` | Full project documentation |

---

## 🎯 Next Steps After Running

Once `npm run dev` is running at http://localhost:3000:

1. **Week 1 Development**
   - Build authentication pages (login/register)
   - Setup app layout with navigation
   - Create API endpoints for users

2. **Reference Documents**
   - Main PRD: `/docs/architecture/CLIENT-PORTAL-COMPLETE-SPECIFICATION.md`
   - Admin Dashboard: See context folder
   - All files documented in project root

3. **Questions?**
   - Check `ENV-SETUP-GUIDE.md` for credential help
   - Check `WEEK-1-SETUP.md` for development plan
   - Check `README.md` for full reference

---

## 🆘 Troubleshooting

**"Database connection error"**
- Make sure PostgreSQL is running: `brew services list`
- Check DATABASE_URL in `.env.local`
- Try: `createdb uysp_portal`

**"Can't find .env.local"**
- Run: `cp .env.example .env.local`
- Verify file exists: `ls -la .env.local`

**"Port 3000 already in use"**
- Kill the process: `lsof -ti:3000 | xargs kill -9`
- Try again: `npm run dev`

---

## 📚 Documentation Map

```
/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/
├── uysp-client-portal/           ← YOU ARE HERE
│   ├── START-HERE.md             ← This file
│   ├── .env.example              ← Copy to .env.local
│   ├── ENV-SETUP-GUIDE.md        ← How to get credentials
│   ├── WEEK-1-SETUP.md           ← Development plan
│   ├── README.md                 ← Full docs
│   ├── drizzle.config.ts         ← DB config
│   └── src/lib/
│       ├── db/                   ← Database
│       ├── auth/                 ← Authentication
│       └── utils/                ← Utilities
│
├── docs/architecture/
│   └── CLIENT-PORTAL-COMPLETE-SPECIFICATION.md  ← Full PRD
│
└── context/CURRENT-SESSION/
    └── frontend-visualization/   ← Preview setup
```

---

## 🎉 You're Ready!

1. ✅ Project created
2. ✅ Dependencies installed
3. ✅ Database schema ready
4. ✅ Authentication configured

**Now**: Fill in `.env.local` and run `npm run dev`

**Questions?** Check the guides above or refer to `/docs/architecture/CLIENT-PORTAL-COMPLETE-SPECIFICATION.md`

---

**Happy coding!** 🚀
