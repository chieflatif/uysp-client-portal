# 🚀 UYSP Client Portal - Phase 1 MVP

A beautiful web application for coaching clients to view enriched leads, claim high-value opportunities, add notes, and track their status. Includes an admin dashboard for managing all clients and leads.

**Status**: Week 1 Foundation - In Development  
**Timeline**: 3 weeks (21 days)  
**Technology**: Next.js 14, TypeScript, Tailwind CSS, PostgreSQL, Drizzle ORM, NextAuth.js

---

## 📋 Quick Start

### Prerequisites
- Node.js 20+ and npm
- PostgreSQL 15+ (local or Render.com)
- Airtable account with API access token

### 1. Setup Environment Variables

```bash
cp .env.example .env.local
```

Fill in your actual credentials. See `ENV-SETUP-GUIDE.md` for detailed instructions.

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Database

```bash
# Create database (if using local PostgreSQL)
createdb uysp_portal

# Run migrations
npm run db:push
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure

```
src/
├── app/                          # Next.js app directory
│   ├── (auth)/                   # Authentication pages (group)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (client)/                 # Client portal (group)
│   │   ├── layout.tsx
│   │   ├── leads/page.tsx
│   │   └── leads/[id]/page.tsx
│   ├── (admin)/                  # Admin dashboard (group)
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── clients/page.tsx
│   │   └── leads/page.tsx
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── leads/                # Lead CRUD endpoints
│   │   ├── clients/              # Client endpoints
│   │   ├── sync/                 # Airtable sync endpoint
│   │   └── health-check/
│   ├── layout.tsx
│   └── page.tsx                  # Home/redirect
│
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── client/                   # Client portal components
│   ├── admin/                    # Admin dashboard components
│   └── shared/                   # Shared components (header, sidebar, etc)
│
├── lib/
│   ├── db/                       # Database
│   │   ├── index.ts              # Drizzle client
│   │   ├── schema.ts             # Table schemas
│   │   └── migrations/           # Auto-generated migrations
│   ├── airtable/                 # Airtable integration
│   ├── auth/                     # Authentication logic
│   ├── n8n/                      # n8n workflow integration
│   └── utils.ts
│
├── hooks/                        # Custom React hooks
├── types/                        # TypeScript type definitions
└── styles/                       # Global styles
```

---

## 🔐 Environment Variables

Required for development:

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Random secret for NextAuth
- `NEXTAUTH_URL` - Base URL (http://localhost:3000 for dev)
- `AIRTABLE_API_KEY` - Your Airtable personal access token
- `AIRTABLE_BASE_ID` - Your Airtable base ID
- `JWT_SECRET` - Random secret for JWT tokens

See `ENV-SETUP-GUIDE.md` for detailed instructions on obtaining each credential.

---

## 🛠 Available Scripts

```bash
# Development
npm run dev              # Start development server (http://localhost:3000)

# Database
npm run db:push         # Push schema changes to database
npm run db:migrate      # Run pending migrations
npm run db:generate     # Generate migrations from schema changes
npm run db:studio       # Open Drizzle Studio (visual database explorer)

# Building
npm run build           # Build for production
npm start               # Start production server

# Code Quality
npm run lint            # Run ESLint
npm run type-check      # Type check with TypeScript
npm test                # Run test suite (when configured)
```

---

## 📅 Development Timeline

### Week 1: Foundation (Days 1-7)
- [x] Next.js 14 project setup
- [x] TypeScript configuration
- [x] Tailwind CSS + shadcn/ui setup
- [x] Database schema design with Drizzle ORM
- [ ] NextAuth.js authentication system
- [ ] JWT token handling
- [ ] Basic UI layout framework
- [ ] Navigation structure

### Week 2: Core Features (Days 8-14)
- [ ] Client Portal - Lead List View (filter, sort, search, paginate)
- [ ] Client Portal - Lead Detail View (full profile, ICP scoring, claim functionality)
- [ ] Client Portal - Notes System (add, view, edit, delete with categorization)

### Week 3: Integration & Polish (Days 15-21)
- [ ] Airtable Sync Implementation (one-way sync every 5 minutes)
- [ ] Basic Admin Dashboard (view clients, leads, metrics)
- [ ] Testing & Deployment (Render.com)

---

## 🔗 Key Features

### Client Portal
- ✅ User login/logout
- ✅ View all leads assigned to account
- ✅ Filter by status (New, Replied, Claimed, Booked, etc.)
- ✅ Sort by ICP score
- ✅ Search by name/company
- ✅ Paginated results (50 per page)
- ✅ Click lead to see full profile
- ✅ Claim/unclaim leads
- ✅ Add notes with categorization
- ✅ View conversation history

### Admin Dashboard
- ✅ View all coaching clients
- ✅ View all leads across all clients
- ✅ Filter and search leads
- ✅ Manual Airtable sync trigger
- ✅ System health status
- ✅ Basic metrics dashboard

---

## 🔄 Integration Points

### Airtable
- Syncs leads and clients from Airtable
- One-way sync: Airtable → PostgreSQL
- Scheduled sync every 5 minutes
- Manual sync button in admin panel

### n8n
- Pause/resume campaigns
- Trigger workflows
- Get execution status

### Authentication
- Email/password login
- NextAuth.js with JWT tokens
- Role-based access control (SUPER_ADMIN, ADMIN, CLIENT)

---

## 📊 Database

The application uses PostgreSQL with Drizzle ORM for type-safe queries.

**Tables:**
- `users` - User accounts and authentication
- `clients` - Coaching client companies
- `leads` - Lead records synced from Airtable
- `campaigns` - Outreach campaigns
- `notes` - Notes on leads
- `activity_log` - System activity tracking

**Migrations**: Run automatically with `npm run db:push`

---

## 🚀 Deployment

### Render.com

1. Connect your GitHub repository to Render
2. Create new Web Service
3. Configure environment variables
4. Render will auto-deploy on git push

Required environment variables for production:
- `DATABASE_URL` (from Render PostgreSQL)
- `NEXTAUTH_SECRET` (generate: `openssl rand -base64 32`)
- `NEXTAUTH_URL` (your Render domain, e.g., https://uysp-portal.onrender.com)
- Airtable and n8n credentials

---

## 📚 Documentation

- **PRD**: `/docs/architecture/CLIENT-PORTAL-COMPLETE-SPECIFICATION.md`
- **Admin Dashboard**: `/context/CURRENT-SESSION/twilio-migration/FRONTEND-DASHBOARD-SPECIFICATION.md`
- **Environment Setup**: `./ENV-SETUP-GUIDE.md`
- **Architecture**: See project root documentation

---

## 🤝 Contributing

This project follows Test-Driven Development (TDD):

1. Write failing test first
2. Write minimum code to pass test
3. Refactor while keeping tests passing

All features must have test coverage before committing.

---

## 📝 License

Proprietary - UYSP Lead Qualification V1

---

**Ready to start?** Run `npm run dev` and open http://localhost:3000 🎉
