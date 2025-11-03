# UYSP Frontend Development - Complete Project Kickoff

**Date**: October 19, 2025  
**Project**: UYSP Client Portal & Admin Dashboard  
**Status**: ✅ ALL DOCUMENTATION COMPLETE - READY FOR DEVELOPMENT  

---

## 📋 DOCUMENTATION CHECKLIST - EVERYTHING YOU NEED IS HERE

### ✅ Primary Product Requirements Document (PRD)

- **File**: `docs/architecture/CLIENT-PORTAL-COMPLETE-SPECIFICATION.md` (2,040 lines)
- **Coverage**: Complete specification including:
  - Executive summary and core value proposition
  - System architecture (frontend + backend + integrations)
  - Detailed user interface mockups for all major screens
  - User roles and permissions (Super Admin, Admin, Client)
  - Complete database schema (6 tables with SQL)
  - Authentication & security requirements
  - Phase 1 MVP scope (Weeks 1-3)
  - Phase 2 & 3 roadmap for future features
  - Technical stack recommendations
  - Project structure and file organization
  - Deployment guide (Render.com)

### ✅ Command Center Dashboard Specification

- **File**: `context/CURRENT-SESSION/twilio-migration/FRONTEND-DASHBOARD-SPECIFICATION.md` (758 lines)
- **Coverage**:
  - System overview and core purpose
  - Command Center layout and controls
  - Live activity feed interface
  - Human review queue design
  - Campaign manager interface
  - Notification center configuration
  - Performance analytics dashboard
  - Design principles (simplicity, visual hierarchy, transparency)
  - Additional smart features (AI-powered alerts, templates library, lead scoring)
  - Technical implementation options
  - Phased rollout plan (5 phases)
  - Recommended approach and next steps

### ✅ Visualization & Development Environment Documentation

- **File**: `context/CURRENT-SESSION/frontend-visualization/EXECUTIVE-SUMMARY-FOR-USER.md`
  - How the frontend will be previewed during development
  - Real-time feedback workflow explanation
  - Live reload technology explanation
  
- **File**: `context/CURRENT-SESSION/frontend-visualization/QUICK-START-PREVIEW-SETUP.md`
  - 5-minute setup guide for Next.js dev environment
  - Browser preview instructions
  - Mobile testing setup
  - Troubleshooting guide

- **File**: `context/CURRENT-SESSION/frontend-visualization/FRONTEND-VISUALIZATION-SOLUTIONS.md`
  - Multiple technical solutions evaluated
  - Recommended approach for real-time preview

### ✅ Technology Stack & Implementation Details

**From CLIENT-PORTAL-COMPLETE-SPECIFICATION.md section: "TECHNICAL STACK SPECIFICATIONS"**

**Frontend Stack:**
- Framework: Next.js 14+ (React)
- Styling: Tailwind CSS + shadcn/ui
- State Management: React Context + React Query
- Real-time: Server-Sent Events (SSE)
- Forms: React Hook Form + Zod
- Analytics/Charts: Recharts (FREE) + Tremor (FREE)
- Tables: TanStack Table (FREE)
- PDF Export: jsPDF or react-pdf (FREE)
- CSV Processing: PapaParse (FREE)

**Backend Stack:**
- Runtime: Node.js 20+ with TypeScript
- Framework: Next.js API Routes (serverless)
- Database: PostgreSQL 15+
- ORM: Drizzle ORM
- Authentication: NextAuth.js
- Hosting: Render.com

**Integrations:**
- Airtable: MCP tools (already available)
- n8n: REST API calls
- Twilio: Read-only status checks

---

## ✅ WHAT YOU'RE BUILDING - PHASE 1 MVP SCOPE

### Week 1: Foundation (Days 1-7)
- [ ] Project setup with Next.js 14
- [ ] TypeScript configuration
- [ ] Tailwind CSS + shadcn/ui setup
- [ ] Database schema design (PostgreSQL)
- [ ] Drizzle ORM migrations
- [ ] Authentication system (NextAuth.js)
- [ ] JWT token handling
- [ ] Basic UI layout framework
- [ ] Navigation structure

### Week 2: Core Features (Days 8-14)
- [ ] **Client Portal - Lead List View**
  - View all leads for logged-in client
  - Filter by status (New, Replied, Claimed, Booked)
  - Sort by ICP score
  - Search by name/company
  - Pagination
  
- [ ] **Client Portal - Lead Detail View**
  - Full lead profile display
  - ICP score breakdown (visual bars)
  - Lead overview with contact info
  - Campaign status indicator
  - Claim/unclaim functionality
  - Quick action buttons
  
- [ ] **Client Portal - Notes System**
  - Add new notes with type categorization
  - View previous notes
  - System-generated notes (read-only)
  - Private note toggle
  - Edit/delete user notes

### Week 3: Integration & Polish (Days 15-21)
- [ ] **Airtable Sync Implementation**
  - One-way sync: Airtable → PostgreSQL
  - Scheduled sync (every 5 minutes via n8n)
  - Manual sync button for admins
  - Sync status indicator
  
- [ ] **Basic Admin Dashboard**
  - View all clients (list view)
  - View all leads across clients
  - Simple metrics display
  - Client status indicators
  
- [ ] **Testing & Deployment**
  - Unit tests for core features
  - Integration tests with Airtable
  - Bug fixes and polish
  - Render.com deployment setup
  - Environment variable configuration
  - Documentation & handoff

### NOT Included in MVP (Phase 2+)
- Campaign management UI (use n8n directly)
- Review queue (use Slack notifications)
- Real-time updates/SSE (Phase 2)
- Advanced analytics dashboard
- Notification preferences UI
- A/B testing interface
- Two-factor authentication
- Mobile-specific optimization

---

## 🎯 MVP USER STORIES & ACCEPTANCE CRITERIA

### As a Client (Coaching Customer)

**Story 1: View My Leads**
- I can log in with my email and password
- I see a list of all leads assigned to my account
- I can filter leads by status (New, Replied, Claimed, Booked)
- I can sort by ICP score (highest to lowest)
- I can search by lead name or company
- Leads are paginated (50 per page)
- Each lead card shows: Name, Title, Company, ICP Score, Status

**Story 2: View Lead Details**
- I can click on any lead to see full profile
- I see: Contact info, company info, ICP score breakdown
- I see the campaign status (what campaign they're in, when next message is scheduled)
- I see conversation history with the lead (read-only)
- I see all notes on the lead (mine and system-generated)

**Story 3: Claim a Lead**
- I can click "Claim This Lead" button on lead detail page
- System pauses the campaign for this lead
- Status changes to "Claimed" (with my name shown)
- Automation stops sending to this lead
- I become the "owner" of follow-up

**Story 4: Add Notes**
- I can add notes to a lead with a type (Call, Email, Text, Meeting, General, Issue, Success)
- I can mark notes as "private" (only visible to me)
- I can edit or delete my own notes
- System-generated notes appear but can't be edited

### As an Admin (Ian)

**Story 5: View All Clients**
- I can see a list of all my coaching clients
- Each client shows: Company name, contact email, number of portal users
- I see stats: Total leads, claimed leads, booked leads, conversion rate
- I can click to view all leads for a specific client
- I can see when each client last logged in

**Story 6: View All Leads**
- I can see all leads across all clients
- I can filter by client, status, ICP score range
- I can see which client owns each lead
- I can see who claimed each lead (if anyone)

**Story 7: System Admin Controls**
- I can manually trigger Airtable sync
- I see sync status (when last synced, how many records)
- I can switch between Production/Test/Staging modes
- I can see system health status (database connected, APIs responding)

---

## 🏗️ PROJECT STRUCTURE

```
uysp-client-portal/
├── README.md
├── package.json
├── tsconfig.json
├── next.config.js
├── .env.example
├── .env.local (NOT in git)
│
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (client)/
│   │   │   ├── layout.tsx
│   │   │   ├── leads/page.tsx
│   │   │   └── leads/[id]/page.tsx
│   │   ├── (admin)/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── clients/page.tsx
│   │   │   └── leads/page.tsx
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── leads/
│   │   │   ├── clients/
│   │   │   ├── sync/
│   │   │   └── health-check/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── ui/ (shadcn/ui components)
│   │   ├── client/ (lead list, detail, etc)
│   │   ├── admin/ (dashboard, client list)
│   │   └── shared/ (header, sidebar, etc)
│   │
│   ├── lib/
│   │   ├── db/ (schema, client, migrations)
│   │   ├── airtable/ (sync, client)
│   │   ├── auth/ (jwt, middleware, rbac)
│   │   ├── n8n/ (workflow control)
│   │   └── utils.ts
│   │
│   ├── hooks/ (custom React hooks)
│   ├── types/ (TypeScript types)
│   └── styles/ (globals.css, etc)
│
├── public/ (images, fonts, etc)
├── scripts/ (setup, seed, sync scripts)
└── tests/ (unit, integration tests)
```

---

## 🔗 INTEGRATION REQUIREMENTS

### Airtable Integration (MCP Available)
- Read leads table
- Read clients table
- Write lead status updates
- Write notes
- Handle real-time webhooks

### n8n Integration (REST API)
- Trigger workflows
- Get workflow execution status
- Pause/resume campaigns
- Get execution history

### Authentication
- NextAuth.js with email/password
- JWT tokens (24h expiration)
- Role-based access control (SUPER_ADMIN, ADMIN, CLIENT)
- Session management

### Database
- PostgreSQL (Render or Supabase)
- Drizzle ORM for migrations
- Connection pooling for performance

---

## 🚀 DEPLOYMENT CHECKLIST

Before deployment to Render:
- [ ] All environment variables configured
- [ ] Database migrations run
- [ ] Airtable credentials working
- [ ] n8n API key verified
- [ ] NextAuth secret generated
- [ ] SSL certificate ready
- [ ] Health check endpoint verified
- [ ] Error logging configured
- [ ] Basic monitoring setup

---

## 📊 SUCCESS METRICS FOR MVP

**Functional Metrics:**
- ✅ All Phase 1 user stories implemented
- ✅ Zero critical bugs
- ✅ All API integrations working
- ✅ Database syncing correctly

**Performance Metrics:**
- Lead list loads in <500ms
- Lead detail page loads in <300ms
- Search returns results in <200ms
- Sync completes in <30 seconds

**User Metrics:**
- Login success rate: 100%
- Page load time: <2 seconds
- No 404 errors on navigation
- Responsive on desktop, tablet, mobile

---

## 🎯 AGENT KICKOFF INSTRUCTIONS

You are about to begin development of the **UYSP Client Portal - Phase 1 MVP**.

### Your Mission:
Build a web application that allows coaching clients to view, manage, and claim leads. Build an admin dashboard for Ian to manage all clients and leads.

### What You Have:
1. **Complete PRD** with all specifications, mockups, and requirements
2. **Technical stack** fully defined (Next.js, Tailwind, Drizzle, etc.)
3. **Project structure** documented and ready
4. **Database schema** with all tables defined
5. **Integration requirements** for Airtable, n8n, and authentication
6. **User stories** with clear acceptance criteria
7. **Development timeline** (21 days / 3 weeks)
8. **Deployment guide** for Render.com

### Start Here:
1. Create a new Next.js 14 project with TypeScript
2. Set up Tailwind CSS and shadcn/ui
3. Create database schema and Drizzle ORM migrations
4. Implement authentication (NextAuth.js)
5. Build UI components for Week 1 foundation
6. Follow the development timeline week by week

### Key Constraints:
- Do NOT use any AI-assisted generation tools that might conflict with MCP
- All authentication must use NextAuth.js (not custom JWT)
- All data sync must use existing Airtable MCP tools
- Database queries must use Drizzle ORM (type-safe)
- All API routes must validate JWT tokens
- Client data must be filtered by client_id (security)

### Communication:
- Update the user with progress at end of each week
- Show visual previews via http://localhost:3000
- Ask clarifying questions if any requirement is ambiguous
- Flag any blockers immediately

### Definition of Done:
All Phase 1 MVP features working locally, tested, and ready for deployment to Render.com.

---

## 📝 FILE LOCATIONS FOR REFERENCE

**Core Documentation:**
- `/docs/architecture/CLIENT-PORTAL-COMPLETE-SPECIFICATION.md` (Main PRD - 2,040 lines)
- `/context/CURRENT-SESSION/twilio-migration/FRONTEND-DASHBOARD-SPECIFICATION.md` (Admin Dashboard - 758 lines)
- `/context/CURRENT-SESSION/frontend-visualization/EXECUTIVE-SUMMARY-FOR-USER.md` (Dev workflow)
- `/context/CURRENT-SESSION/frontend-visualization/QUICK-START-PREVIEW-SETUP.md` (Setup guide)

**Reference Docs:**
- `/docs/kajabi-integration/` (Integration examples)
- `/docs/sops/` (System operation procedures)
- `/data/schemas/` (Data structure examples)

---

## ✅ CONFIRMATION: ALL REQUIRED DOCUMENTATION IS PRESENT

| Item | Status | Location |
|------|--------|----------|
| Product Requirements Document | ✅ Complete | `docs/architecture/CLIENT-PORTAL-COMPLETE-SPECIFICATION.md` |
| Admin Dashboard Specification | ✅ Complete | `context/CURRENT-SESSION/twilio-migration/FRONTEND-DASHBOARD-SPECIFICATION.md` |
| Database Schema | ✅ Complete | Within main PRD (lines 920-1057) |
| User Roles & Permissions | ✅ Complete | Within main PRD (lines 88-114) |
| Authentication & Security | ✅ Complete | Within main PRD (lines 826-919) |
| Technical Stack | ✅ Complete | Within main PRD (lines 1122-1279) |
| Project Structure | ✅ Complete | Within main PRD (lines 1282-1414) |
| Phase 1 MVP Scope | ✅ Complete | Within main PRD (lines 1418-1490) |
| Deployment Guide | ✅ Complete | Within main PRD (lines 1847-1924) |
| Development Timeline | ✅ Complete | Within main PRD (lines 1472-1488) |
| Development Environment Setup | ✅ Complete | `context/CURRENT-SESSION/frontend-visualization/` |
| Phase 2 & 3 Roadmap | ✅ Complete | Within main PRD (lines 1492-1757) |

---

**STATUS: READY FOR DEVELOPMENT** ✅

All documentation is complete, comprehensive, and ready to hand off to a development team. The specification is detailed enough to execute without ambiguity while remaining flexible for creative implementation decisions.

---

# 🤖 AI AGENT KICKOFF PROMPT - COPY & USE THIS

**Use this prompt when handing off the project to another AI agent/developer in your workspace.**

---

```
# UYSP Frontend Development - Complete AI Agent Kickoff Prompt

You are being assigned to build the UYSP Client Portal & Admin Dashboard - Phase 1 MVP for a lead generation and coaching client management system.

## PROJECT OVERVIEW

**Project Name**: UYSP Lead Qualification V1  
**Component**: Web-based Client Portal + Admin Dashboard  
**Timeline**: 3 weeks (21 days)  
**Status**: Complete PRD, ready for development  
**Environment**: Cursor IDE (Next.js development)  

## YOUR MISSION

Build a beautiful, functional web application that:

1. **For Coaching Clients**: Provides a portal to view enriched leads, claim high-value leads, add notes, and track their status
2. **For Admin (Ian)**: Provides a dashboard to manage all clients, view all leads across all clients, and control system settings

The application should be production-ready, secure, and optimized for performance. All integrations with Airtable, n8n, and authentication must work flawlessly.

## PHASE 1 MVP SCOPE (WHAT TO BUILD)

### Week 1: Foundation (Days 1-7)
- Next.js 14 project with TypeScript
- PostgreSQL database with Drizzle ORM
- Tailwind CSS + shadcn/ui setup
- NextAuth.js authentication system
- Basic UI layout and navigation
- JWT token handling

### Week 2: Core Features (Days 8-14)
- **Client Portal - Lead List View**: Filter, sort, search, paginate leads
- **Client Portal - Lead Detail View**: Full profile with ICP scoring, conversation history, claim functionality
- **Client Portal - Notes System**: Add, view, edit, delete notes with categorization

### Week 3: Integration & Polish (Days 15-21)
- Airtable sync implementation (one-way: Airtable → PostgreSQL)
- Basic Admin Dashboard (view clients, view all leads, basic metrics)
- Testing, bug fixes, and Render.com deployment preparation

## COMPLETE PRD & SPECIFICATIONS

All requirements are documented in these files:

**Main PRD** (2,040 lines - READ THIS FIRST):
`/docs/architecture/CLIENT-PORTAL-COMPLETE-SPECIFICATION.md`

**Admin Dashboard Spec** (758 lines):
`/context/CURRENT-SESSION/twilio-migration/FRONTEND-DASHBOARD-SPECIFICATION.md`

**Development Environment Setup** (in `/context/CURRENT-SESSION/frontend-visualization/`):
- EXECUTIVE-SUMMARY-FOR-USER.md
- QUICK-START-PREVIEW-SETUP.md
- FRONTEND-VISUALIZATION-SOLUTIONS.md

## KEY REQUIREMENTS

### Database
- PostgreSQL 15+
- 6 core tables: users, clients, leads, campaigns, notes, activity_log
- Drizzle ORM for type-safe migrations
- Connection pooling

### Authentication
- NextAuth.js (email/password)
- JWT tokens (24-hour expiration)
- Role-based access control: SUPER_ADMIN, ADMIN, CLIENT
- Session management with httpOnly cookies

### Frontend Stack
- Next.js 14+ (React)
- Tailwind CSS + shadcn/ui components
- React Context + React Query for state management
- React Hook Form + Zod for forms
- Recharts/Tremor for charts (Phase 2)

### Backend Stack
- Node.js 20+ with TypeScript
- Next.js API Routes (serverless functions)
- NextAuth.js middleware
- Drizzle ORM with PostgreSQL

### Integrations
- **Airtable**: Read/write via MCP tools (user will provide credentials)
- **n8n**: REST API for workflow control
- **Twilio**: Read-only status checks (later phases)

### Security Requirements
- All passwords hashed with bcrypt
- JWT tokens in httpOnly cookies
- CSRF protection via NextAuth
- SQL injection prevention via Drizzle ORM
- Client data isolation by client_id
- Rate limiting on auth endpoints

### Performance Targets
- Lead list page: <500ms load time
- Lead detail page: <300ms load time
- Search: <200ms response
- API responses: <1 second (95th percentile)

## USER STORIES - WHAT CLIENTS NEED

### Story 1: Login
"As a user, I want to log in with my email and password so I can access my leads."

### Story 2: View Leads List
"As a client, I want to see all my assigned leads, sorted by ICP score, with the ability to filter by status and search by name/company."

**Acceptance Criteria**:
- Lead cards show: Name, Title, Company, ICP Score (with fire emoji indicators), Status
- Filter by status: New, Replied, Engaged, Claimed, Booked, Stopped
- Sort by ICP score (highest to lowest)
- Search by first name, last name, or company name
- Pagination (50 leads per page)
- Responsive on desktop and tablet

### Story 3: View Lead Details
"As a client, I want to see the full profile of a lead including why they scored high and the conversation history."

**Acceptance Criteria**:
- Show full contact info (name, email, phone, LinkedIn)
- Show company info (name, size, industry, revenue)
- Display ICP score breakdown with visual bars
- Show current campaign and next scheduled message
- Display conversation history (SMS/email thread)
- Show all notes on the lead

### Story 4: Claim a Lead
"As a client, I want to claim a high-value lead so I can personally reach out instead of using automation."

**Acceptance Criteria**:
- Claim button pauses the campaign for that lead
- Lead status changes to "Claimed"
- Client name shown as owner
- System stops sending automated messages
- Client can unclaim the lead to resume automation

### Story 5: Add Notes
"As a client, I want to add notes to a lead to track my interactions and progress."

**Acceptance Criteria**:
- Add note with type: Call, Email, Text, Meeting, General, Issue, Success
- Toggle privacy (only visible to me)
- Edit/delete own notes
- System notes are read-only
- All notes show timestamp and creator

### Story 6: Admin View Clients
"As admin, I want to see all my coaching clients in one place with their stats."

**Acceptance Criteria**:
- List all clients with company name, contact email, number of users
- Show stats: total leads, claimed, booked, conversion rate
- Show last login timestamp
- Click to view detailed client

### Story 7: Admin View All Leads
"As admin, I want to see all leads across all clients to monitor the system."

**Acceptance Criteria**:
- See all leads with filters (by client, status, score range)
- Show which client owns each lead
- Show who claimed each lead
- Basic search by lead name

## PROJECT STRUCTURE

```
uysp-client-portal/
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx
│   │   ├── (auth)/register/page.tsx
│   │   ├── (client)/
│   │   │   ├── leads/page.tsx
│   │   │   └── leads/[id]/page.tsx
│   │   ├── (admin)/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── clients/page.tsx
│   │   │   └── leads/page.tsx
│   │   └── api/
│   ├── components/ui/ (shadcn/ui)
│   ├── components/client/
│   ├── components/admin/
│   ├── components/shared/
│   ├── lib/db/
│   ├── lib/airtable/
│   ├── lib/auth/
│   ├── lib/n8n/
│   ├── hooks/
│   └── types/
├── public/
├── scripts/
└── tests/
```

## ENVIRONMENT VARIABLES NEEDED

```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
JWT_SECRET=...

AIRTABLE_API_KEY=...
AIRTABLE_BASE_ID=...
AIRTABLE_LEADS_TABLE=Leads
AIRTABLE_CLIENTS_TABLE=Clients

N8N_API_URL=...
N8N_API_KEY=...

NODE_ENV=development
```

## CONSTRAINTS & RULES

1. **Do NOT modify business logic** without explicit permission
2. **Do NOT use AI code generation tools** that conflict with MCP
3. **Always use NextAuth.js** for authentication (not custom JWT)
4. **All data sync** must use existing Airtable MCP tools
5. **Use Drizzle ORM** for all database queries (type-safe)
6. **Validate JWT on every API route** that requires authentication
7. **Filter all lead queries by client_id** (security requirement)
8. **Test before committing** - ensure all API integrations work

## HOW TO START

1. Create new Next.js 14 project with TypeScript
   ```bash
   npx create-next-app@latest uysp-client-portal --typescript --tailwind
   ```

2. Install core dependencies
   ```bash
   npm install next-auth drizzle-orm pg zod react-hook-form react-query
   ```

3. Set up Tailwind + shadcn/ui
   ```bash
   npx shadcn-ui@latest init
   ```

4. Create database schema and migrations

5. Implement NextAuth.js authentication

6. Build Week 1 foundation components

7. Follow the development timeline week by week

## DELIVERABLES

**End of Week 1**:
- Working login/logout system
- Database fully set up
- Basic UI framework with navigation
- All layout components

**End of Week 2**:
- Lead list view (client portal) - fully functional
- Lead detail view - fully functional
- Notes system - fully functional

**End of Week 3**:
- Airtable sync working (every 5 minutes)
- Admin dashboard basic features
- All tests passing
- Deployed to Render.com
- Documentation complete

## SUCCESS CRITERIA

- ✅ All user stories working and tested
- ✅ All API integrations (Airtable, n8n) functional
- ✅ Zero critical bugs
- ✅ Performance targets met
- ✅ Mobile responsive design
- ✅ Secure authentication and authorization
- ✅ Database migrations work correctly
- ✅ Deployed and accessible on Render.com

## COMMUNICATION PROTOCOL

- Update with progress at end of each week
- Show visual previews via http://localhost:3000
- Report any blockers immediately
- Ask clarifying questions for ambiguous requirements
- Commit frequently (daily if possible)
- Keep documentation updated as you build

## WHAT SUCCESS LOOKS LIKE

When you're done, the user should be able to:
1. Log in as a client and see their leads
2. Click on any lead to see full details
3. Claim high-value leads and add notes
4. Log in as admin and see all clients and leads
5. Manually trigger Airtable sync
6. Access the portal from a deployed URL on Render.com

---

**Ready to start? Begin with reading the main PRD at:**
`/docs/architecture/CLIENT-PORTAL-COMPLETE-SPECIFICATION.md`

**Good luck! 🚀**
```

---

## ✅ SUMMARY: YOU NOW HAVE EVERYTHING

You now have a **complete, production-ready project specification** that includes:

1. ✅ **Full Product Requirements Document** (2,040 lines)
2. ✅ **Admin Dashboard Specification** (758 lines)
3. ✅ **Technology Stack** (fully defined)
4. ✅ **Database Schema** (6 tables with SQL)
5. ✅ **User Stories** (with acceptance criteria)
6. ✅ **Project Structure** (all files and folders documented)
7. ✅ **Development Timeline** (3 weeks broken down day-by-day)
8. ✅ **Deployment Guide** (Render.com step-by-step)
9. ✅ **Integration Requirements** (Airtable, n8n, NextAuth)
10. ✅ **Kickoff Prompt** (for another AI agent)

**Everything needed to build this project is documented and ready to hand off.**

---

## 📝 COMPLETE FILE LOCATIONS & ABSOLUTE PATHS

**Use these exact paths to access all documentation. Copy the full path into your editor.**

### PRIMARY DOCUMENTATION

**Main Product Requirements Document (PRD)** - 2,040 lines
```
/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/docs/architecture/CLIENT-PORTAL-COMPLETE-SPECIFICATION.md
```
- Contains: Executive summary, system architecture, UI mockups, database schema, auth/security, Phase 1-3 roadmap, tech stack, project structure, deployment guide
- **Start here first** - read the entire document

**Admin Dashboard & Command Center Specification** - 758 lines
```
/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/context/CURRENT-SESSION/twilio-migration/FRONTEND-DASHBOARD-SPECIFICATION.md
```
- Contains: Admin dashboard layout, command center, review queue, campaign manager, notifications, analytics, implementation options

---

### DEVELOPMENT ENVIRONMENT SETUP

**Executive Summary - How Frontend Development Works**
```
/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/context/CURRENT-SESSION/frontend-visualization/EXECUTIVE-SUMMARY-FOR-USER.md
```
- Explains real-time preview workflow during development
- How live reload works with Next.js Fast Refresh
- What user will see during development

**Quick Start - 5 Minute Setup Guide**
```
/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/context/CURRENT-SESSION/frontend-visualization/QUICK-START-PREVIEW-SETUP.md
```
- Step-by-step setup instructions for Next.js dev server
- Browser preview instructions
- Mobile testing setup
- Troubleshooting

**Frontend Visualization Solutions**
```
/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/context/CURRENT-SESSION/frontend-visualization/FRONTEND-VISUALIZATION-SOLUTIONS.md
```
- Multiple technical solutions for previewing the build
- Recommended approach explained

**Visualization Workflow Diagram**
```
/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/context/CURRENT-SESSION/frontend-visualization/VISUALIZATION-WORKFLOW-DIAGRAM.md
```
- Visual diagrams of development workflow

---

### PROJECT CONTEXT & REFERENCE

**This Kickoff Document** (what you're reading)
```
/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/context/CURRENT-SESSION/FRONTEND-DEVELOPMENT-KICKOFF.md
```
- Complete checklist of what's included
- MVP scope and timeline
- User stories with acceptance criteria
- Project structure
- Integration requirements
- Constraints and rules
- AI Agent Kickoff Prompt

---

### SUPPORTING DOCUMENTATION

**Integration Examples & Reference**
```
/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/docs/kajabi-integration/
```
- Various integration examples
- Configuration patterns
- Implementation references

**System Operations Procedures (SOPs)**
```
/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/docs/sops/
```
- System operation guidelines
- Workflow procedures

**Data Schemas & Structure Examples**
```
/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/data/schemas/
```
- JSON schema examples
- Data structure references

---

### EXISTING PROJECT FILES FOR REFERENCE

**Kajabi Integration Setup**
```
/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/docs/kajabi-integration/START-HERE.md
/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/docs/kajabi-integration/MANUAL-CONFIGURATION-GUIDE.md
```

**Test Payloads & Examples**
```
/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/docs/kajabi-integration/TEST-PAYLOADS.md
```

**Existing Workflows** (for reference on system integration patterns)
```
/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/workflows/
```
- Contains existing n8n workflow examples
- Can reference for integration patterns

---

### WHERE TO CREATE YOUR PROJECT

**Create new Next.js project in this location:**
```
/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal/
```

**Project will have this structure:**
```
/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal/
├── src/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── hooks/
│   └── types/
├── public/
├── scripts/
├── tests/
├── package.json
├── tsconfig.json
├── next.config.js
└── .env.example
```

---

### ENVIRONMENT VARIABLES TEMPLATE

**Create this file in your project:**
```
/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal/.env.example
```

**Contents:**
```
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/uysp_portal

# Authentication
NEXTAUTH_SECRET=your-random-secret-key
NEXTAUTH_URL=http://localhost:3000
JWT_SECRET=your-jwt-secret

# Airtable Integration
AIRTABLE_API_KEY=keyXXXXXXXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
AIRTABLE_LEADS_TABLE=Leads
AIRTABLE_CLIENTS_TABLE=Clients

# n8n Integration
N8N_API_URL=https://n8n.uysp.com/api/v1
N8N_API_KEY=your-n8n-api-key

# Application
NODE_ENV=development
LOG_LEVEL=info
```

---

### KEY COMMANDS TO RUN

```bash
# From project root, install dependencies:
npm install

# Start development server:
npm run dev

# Access at:
http://localhost:3000

# Run tests:
npm run test

# Build for production:
npm run build

# Start production build:
npm run start
```

---

### HOW TO REFERENCE DOCUMENTATION

When you need to reference specific sections, use these locations:

| What You Need | File | Line Numbers |
|---|---|---|
| Executive Summary | CLIENT-PORTAL-COMPLETE-SPECIFICATION.md | 1-35 |
| System Architecture | CLIENT-PORTAL-COMPLETE-SPECIFICATION.md | 38-84 |
| User Roles & Permissions | CLIENT-PORTAL-COMPLETE-SPECIFICATION.md | 88-114 |
| Client Portal Spec | CLIENT-PORTAL-COMPLETE-SPECIFICATION.md | 118-570 |
| Admin Dashboard Spec | CLIENT-PORTAL-COMPLETE-SPECIFICATION.md | 576-822 |
| Authentication & Security | CLIENT-PORTAL-COMPLETE-SPECIFICATION.md | 826-919 |
| Database Schema | CLIENT-PORTAL-COMPLETE-SPECIFICATION.md | 920-1057 |
| Data Sync Strategy | CLIENT-PORTAL-COMPLETE-SPECIFICATION.md | 1061-1120 |
| Technical Stack | CLIENT-PORTAL-COMPLETE-SPECIFICATION.md | 1122-1279 |
| Project Structure | CLIENT-PORTAL-COMPLETE-SPECIFICATION.md | 1282-1414 |
| Phase 1 MVP Scope | CLIENT-PORTAL-COMPLETE-SPECIFICATION.md | 1418-1490 |
| Phase 2 & 3 Roadmap | CLIENT-PORTAL-COMPLETE-SPECIFICATION.md | 1492-1757 |
| Success Metrics | CLIENT-PORTAL-COMPLETE-SPECIFICATION.md | 1760-1800 |
| Configuration Guide | CLIENT-PORTAL-COMPLETE-SPECIFICATION.md | 1806-1843 |
| Deployment Guide | CLIENT-PORTAL-COMPLETE-SPECIFICATION.md | 1847-1924 |

---

### QUICK REFERENCE - WHAT TO READ FIRST

**Day 1 - Read these in order:**
1. `/docs/architecture/CLIENT-PORTAL-COMPLETE-SPECIFICATION.md` (entire file)
2. `/context/CURRENT-SESSION/twilio-migration/FRONTEND-DASHBOARD-SPECIFICATION.md` (entire file)
3. `/context/CURRENT-SESSION/FRONTEND-DEVELOPMENT-KICKOFF.md` (this file, entire document)

**Day 2 - Setup & Foundation:**
1. `/context/CURRENT-SESSION/frontend-visualization/EXECUTIVE-SUMMARY-FOR-USER.md`
2. `/context/CURRENT-SESSION/frontend-visualization/QUICK-START-PREVIEW-SETUP.md`
3. Create your Next.js project at `/uysp-client-portal/`

**Day 3+ - Development:**
- Reference the specific sections from the main PRD as needed
- Use this kickoff document for day-to-day development guidance
- Check user stories and acceptance criteria in this document

---

**All file paths are ready. Copy and paste them directly into your file explorer or terminal.**
