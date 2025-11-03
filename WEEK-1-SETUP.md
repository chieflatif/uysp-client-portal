# 🏗️ UYSP Client Portal - Week 1 Foundation Setup

**Status**: ✅ Complete  
**Date**: October 19, 2025  
**Timeline**: Ready for Next Steps

---

## ✅ What's Been Completed

### Project Initialization
- ✅ Next.js 14 project created with TypeScript
- ✅ Tailwind CSS configured
- ✅ ESLint setup complete
- ✅ shadcn/ui installed and ready

### Dependencies Installed
- ✅ NextAuth.js (v5) - Authentication
- ✅ Drizzle ORM - Database ORM
- ✅ PostgreSQL driver - Database client
- ✅ Zod - Schema validation
- ✅ React Hook Form - Form handling
- ✅ TanStack Query - State management
- ✅ bcryptjs - Password hashing

### Configuration Files
- ✅ `.env.example` - Environment template with all required variables
- ✅ `drizzle.config.ts` - Database configuration
- ✅ `src/lib/db/schema.ts` - Complete database schema (6 tables)
- ✅ `src/lib/db/index.ts` - Drizzle client initialization
- ✅ `src/lib/auth/config.ts` - NextAuth configuration

### Documentation
- ✅ `README.md` - Project overview
- ✅ `ENV-SETUP-GUIDE.md` - Environment variable setup guide
- ✅ `WEEK-1-SETUP.md` - This file

---

## 📋 Next Steps (IMMEDIATE)

### Step 1: Create `.env.local`

```bash
cd uysp-client-portal
cp .env.example .env.local
```

### Step 2: Fill in Airtable Credentials

Open `.env.local` and update:

```
AIRTABLE_API_KEY=<your-personal-access-token>
AIRTABLE_BASE_ID=<your-base-id>
NEXTAUTH_SECRET=<run: openssl rand -base64 32>
JWT_SECRET=<run: openssl rand -base64 32>
```

See `ENV-SETUP-GUIDE.md` for detailed instructions.

### Step 3: Setup PostgreSQL Database

#### Option A: Local PostgreSQL (Recommended for Development)

```bash
# Install PostgreSQL (macOS)
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb uysp_portal

# Update .env.local
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/uysp_portal
```

#### Option B: Render.com PostgreSQL (For Production Later)

Create a PostgreSQL database on Render.com:
- https://render.com/databases
- Copy the connection string when ready
- Store for production deployment

### Step 4: Run Database Setup

```bash
# Install dependencies
npm install

# Push schema to database (creates all tables)
npm run db:push

# Verify in Drizzle Studio (optional)
npm run db:studio
```

### Step 5: Start Development Server

```bash
npm run dev
```

Access at: **http://localhost:3000**

---

## 🗂️ Project Structure Ready

```
src/
├── app/                    # App directory (pages)
│   ├── (auth)/            # Login/Register
│   ├── (client)/          # Client portal
│   ├── (admin)/           # Admin dashboard
│   └── api/               # API endpoints
├── components/            # React components
│   ├── ui/                # shadcn/ui
│   ├── client/
│   ├── admin/
│   └── shared/
└── lib/
    ├── db/                # Database (✅ READY)
    │   ├── schema.ts      # 6 tables defined
    │   └── migrations/    # Auto-generated
    ├── auth/              # Authentication (✅ READY)
    │   └── config.ts      # NextAuth config
    └── utils.ts
```

---

## 📊 Database Schema (Ready to Deploy)

### Tables Defined:
1. **users** - User accounts and authentication
2. **clients** - Coaching client companies
3. **leads** - Lead records (synced from Airtable)
4. **campaigns** - Outreach campaigns
5. **notes** - Notes on leads
6. **activity_log** - System activity tracking

All tables include:
- ✅ Proper foreign keys
- ✅ Indexes for performance
- ✅ Timestamps (created_at, updated_at)
- ✅ Type-safe TypeScript exports

---

## 🚀 Ready to Begin Week 1 Development

### Week 1 Tasks (Days 1-7)

Now that setup is complete, the next phase is:

1. **Create NextAuth Route Handler** (Day 1-2)
   - Set up `/api/auth/[...nextauth].ts`
   - Test login flow
   - Implement registration

2. **Build Authentication UI** (Day 2-3)
   - Login page with Tailwind + shadcn/ui
   - Register page
   - Navigation with logout

3. **Setup App Layout** (Day 3-4)
   - Root layout with Tailwind
   - Navigation bar
   - Sidebar for admin
   - Basic routing

4. **Create API Endpoints** (Day 4-6)
   - User endpoints (create, update, get)
   - Auth middleware
   - JWT verification

5. **Setup Middleware** (Day 6-7)
   - NextAuth middleware for protected routes
   - Role-based access control (RBAC)
   - Client data filtering

---

## 🔧 Available Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)

# Database Management
npm run db:push         # Push schema to database
npm run db:migrate      # Run migrations
npm run db:generate     # Generate migrations from changes
npm run db:studio       # Visual database explorer

# Code Quality
npm run lint            # Run ESLint
npm run type-check      # TypeScript type checking
npm test                # Run tests (when configured)

# Production
npm run build           # Build for production
npm start               # Start production server
```

---

## 📝 Environment Variables Checklist

Before running `npm run dev`:

- [ ] `.env.local` created (copied from `.env.example`)
- [ ] `NEXTAUTH_SECRET` - 32-char random string
- [ ] `JWT_SECRET` - 32-char random string
- [ ] `AIRTABLE_API_KEY` - Your personal access token
- [ ] `AIRTABLE_BASE_ID` - Your base ID
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `NEXTAUTH_URL` - Set to `http://localhost:3000`

---

## 🔐 Security Notes

✅ **Passwords**: Will be hashed with bcryptjs before storage  
✅ **Sessions**: JWT tokens, 24-hour expiration  
✅ **CSRF**: Protected by NextAuth.js  
✅ **Database**: All queries use Drizzle ORM (prevents SQL injection)  
✅ **Authorization**: Role-based access control will filter data by client_id  

---

## 🎯 Success Criteria for Week 1

✅ Project setup complete and running  
✅ Database configured and accessible  
✅ Environment variables filled  
✅ `npm run dev` starts without errors  
✅ NextAuth route handlers created  
✅ Basic authentication pages rendered  
✅ User creation/login working in testing  
✅ Role-based routing implemented  

---

## 🚨 Troubleshooting

**Port 3000 already in use:**
```bash
lsof -ti:3000 | xargs kill -9
npm run dev
```

**Database connection error:**
- Verify PostgreSQL is running: `brew services list`
- Check DATABASE_URL in `.env.local`
- Try: `psql -d uysp_portal`

**NextAuth not working:**
- Check NEXTAUTH_SECRET is set
- Verify NEXTAUTH_URL matches running server

**Drizzle schema error:**
- Run: `npm run db:generate` to create migrations
- Run: `npm run db:push` to apply to database

---

## 📚 Reference Documents

- **Main PRD**: `/docs/architecture/CLIENT-PORTAL-COMPLETE-SPECIFICATION.md`
- **Admin Dashboard**: `/context/CURRENT-SESSION/twilio-migration/FRONTEND-DASHBOARD-SPECIFICATION.md`
- **This Project**: `README.md`
- **Environment Setup**: `ENV-SETUP-GUIDE.md`

---

## ✨ You're Ready!

The foundation is in place. Fill in your environment variables and you're ready to start building Week 1 features.

**Next action**: Fill in `.env.local` and run `npm run dev` 🚀
