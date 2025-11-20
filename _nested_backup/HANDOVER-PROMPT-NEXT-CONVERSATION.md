# 🤝 HANDOVER PROMPT - UYSP Client Portal Development

**Previous Session**: October 19, 2025 - Project Kickoff & Foundation Setup  
**Status**: Foundation complete - Ready for Week 1 Development (WITHOUT Airtable/n8n integration)  
**Next Session Focus**: Build authentication UI and core Week 1 features  

---

## 📋 EXECUTIVE SUMMARY

The UYSP Client Portal project has completed Phase 0 (Foundation Setup). A production-ready Next.js 14 project exists with:
- ✅ TypeScript + Tailwind CSS configured
- ✅ PostgreSQL schema designed (6 tables via Drizzle ORM)
- ✅ NextAuth.js authentication configured
- ✅ All core dependencies installed
- ✅ Complete documentation created

**Critical Decision for Development**: We are proceeding **WITHOUT Airtable/n8n integration** in Week 1. All work will use local mock data for testing authentication, UI, and core features. Airtable sync will be added in Week 3.

---

## 🎯 WHAT HAS BEEN COMPLETED

### Phase 0: Project Foundation (Completed October 19)

**Project Structure**
- Next.js 14 project created at: `/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal/`
- Full TypeScript configuration
- Tailwind CSS with shadcn/ui components installed
- ESLint and PostCSS configured

**Database Architecture**
- Drizzle ORM fully configured with PostgreSQL
- 6 tables designed in `src/lib/db/schema.ts`:
  - `users` - User accounts with role-based access
  - `clients` - Coaching client companies
  - `leads` - Lead records (will sync from Airtable in Week 3)
  - `campaigns` - Outreach campaigns
  - `notes` - Notes on leads
  - `activity_log` - System activity tracking
- Drizzle config ready: `drizzle.config.ts`
- Database client initialized: `src/lib/db/index.ts`

**Authentication System**
- NextAuth.js v5 configured with Credentials provider (email/password)
- JWT strategy implemented (24-hour expiration)
- Password hashing with bcryptjs
- NextAuth config file created: `src/lib/auth/config.ts`
- Role-based access control designed (SUPER_ADMIN, ADMIN, CLIENT)

**Dependencies Installed**
```
Production:
- next-auth@latest
- drizzle-orm@latest
- pg@latest (PostgreSQL driver)
- zod@latest (validation)
- react-hook-form@latest (forms)
- @hookform/resolvers@latest
- bcryptjs@latest (password hashing)
- @tanstack/react-query@latest (state management)

DevDependencies:
- drizzle-kit@latest
- typescript
- tailwindcss
- eslint
```

**Package.json Scripts Ready**
```json
{
  "dev": "next dev --turbopack",
  "build": "next build --turbopack",
  "start": "next start",
  "lint": "eslint",
  "db:push": "drizzle-kit push:pg",
  "db:migrate": "drizzle-kit migrate",
  "db:generate": "drizzle-kit generate:pg",
  "db:studio": "drizzle-kit studio",
  "type-check": "tsc --noEmit"
}
```

**Documentation Created**
- `.env.example` (5 KB) - Environment template with ALL variables
- `ENV-SETUP-GUIDE.md` - How to get Airtable credentials
- `START-HERE.md` - Quick 3-step setup guide
- `WEEK-1-SETUP.md` - Week 1 development timeline
- `README.md` - Full project documentation

---

## 🔄 WHAT'S NEXT (Week 1 Development)

### Week 1 Focus: Foundation & Authentication (NO Airtable/n8n Yet)

**Week 1 Tasks (7 Days)**

**Days 1-2: Authentication Routes & Logic**
- [ ] Create NextAuth route handler: `src/app/api/auth/[...nextauth].ts`
- [ ] Implement user registration API: `src/app/api/auth/register`
- [ ] Write tests for auth endpoints
- [ ] Test login/logout flow locally

**Days 3-4: Authentication UI**
- [ ] Build login page: `src/app/(auth)/login/page.tsx`
- [ ] Build register page: `src/app/(auth)/register/page.tsx`
- [ ] Add form validation with React Hook Form + Zod
- [ ] Style with Tailwind + shadcn/ui components

**Days 5-6: App Layout & Navigation**
- [ ] Create root layout with navigation
- [ ] Build sidebar component for navigation
- [ ] Setup route groups: (auth), (client), (admin)
- [ ] Implement middleware for protected routes

**Day 7: Testing & Validation**
- [ ] Test complete auth flow
- [ ] Verify database operations work
- [ ] Code quality checks
- [ ] Documentation update

### What NOT to Build (Week 1)
- ❌ Airtable integration (skip until Week 3)
- ❌ n8n workflow control (skip until Week 3)
- ❌ Real lead data sync (use mock data only)
- ❌ Advanced analytics (Phase 2+)

---

## 📊 DEVELOPMENT METHODOLOGY

### TDD Protocol (VibeOS SOP§1.1)
**All code must follow Test-Driven Development:**

1. **Write Failing Test First** (RED)
   - Define desired behavior in a test
   - Test must fail with current code

2. **Write Minimum Code to Pass** (GREEN)
   - Implement only what's needed
   - Keep it simple

3. **Refactor While Tests Pass** (REFACTOR)
   - Improve code quality
   - All tests continue passing

### Code Organization Rules
- Source code → `src/`
- Tests → `tests/` (or `src/__tests__/`)
- Configuration → Root or `src/lib/`
- API routes → `src/app/api/`
- Components → `src/components/`

### Quality Gates (Required Before Commit)
✅ Linting passes: `npm run lint`  
✅ Type checking passes: `npm run type-check`  
✅ All tests pass: `npm test` (when implemented)  
✅ No console errors  

---

## 🛠️ USING CLAUDE CODE MCP SERVER

The Claude Code MCP server is available for code analysis and generation.

**Key Methods Available:**
- `explain_code()` - Understand existing code
- `review_code()` - Code review and feedback
- `fix_code()` - Fix bugs or issues
- `edit_code()` - Edit code based on instructions
- `test_code()` - Generate tests
- `simulate_command()` - Test command execution

**Usage Pattern for Week 1:**
1. When writing auth routes, use `test_code()` to generate test cases
2. When implementing components, use `review_code()` for best practices
3. When fixing bugs, use `fix_code()` to apply fixes
4. When unsure about code, use `explain_code()` to understand

---

## 📈 PROGRESS TRACKING

### Session Tracking Structure

**In each conversation, track:**

1. **Session Start Checklist**
   ```
   ✅ Project loads without errors
   ✅ Database connection working
   ✅ Environment variables set
   ✅ Previous session work verified
   ```

2. **Task Progress**
   - [ ] Task Name - Status (In Progress / Blocked / Complete)
   - [ ] All tasks linked to Week 1 timeline

3. **Code Quality Metrics**
   ```
   ⚡ Linting: ✓ Pass (0 errors)
   ⚡ Type Check: ✓ Pass
   ⚡ Tests: ✓ Pass (X/X tests)
   ⚡ Build: ✓ Success
   ```

4. **Session End Summary**
   ```
   Completed: X tasks
   Blocked: Y tasks (reasons)
   Next session: Z tasks to start
   Files modified: list of key files
   ```

### Using VibeOS TODO System

Use the `todo_write` tool to maintain a persistent task list:

```yaml
- id: week1-auth-routes
  content: "Create NextAuth route handler at src/app/api/auth/[...nextauth].ts"
  status: pending
  
- id: week1-auth-ui
  content: "Build login and register pages with React Hook Form"
  status: pending
```

Update status as you progress: pending → in_progress → completed

---

## 📝 KEY FILES & THEIR PURPOSE

**DO NOT MODIFY** (Foundation Files)
- `drizzle.config.ts` - Database configuration
- `src/lib/db/schema.ts` - Table schemas (read-only in Week 1)
- `src/lib/auth/config.ts` - NextAuth config (read-only in Week 1)
- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript configuration

**CREATE NEW** (Week 1 Development)
- `src/app/api/auth/[...nextauth].ts` - NextAuth route handler
- `src/app/api/auth/register.ts` - Registration endpoint
- `src/app/(auth)/login/page.tsx` - Login page
- `src/app/(auth)/register/page.tsx` - Register page
- `src/components/ui/...` - UI components from shadcn/ui
- `src/components/shared/...` - Navigation, header, etc
- `tests/...` - Test files
- `src/middleware.ts` - Route protection middleware

**REFERENCE** (Check when needed)
- `.env.example` - Available environment variables
- `ENV-SETUP-GUIDE.md` - How to get Airtable credentials
- `WEEK-1-SETUP.md` - Week 1 timeline and tasks
- `README.md` - Full project documentation
- `/docs/architecture/CLIENT-PORTAL-COMPLETE-SPECIFICATION.md` - Main PRD

---

## 🚀 STARTING THE NEXT CONVERSATION

### Step 1: Session Initialization

1. Verify project loads:
   ```bash
   cd /Users/latifhorst/cursor\ projects/UYSP\ Lead\ Qualification\ V1/uysp-client-portal
   npm run dev
   ```
   Should start at http://localhost:3000

2. Check environment is ready:
   ```bash
   npm run type-check    # TypeScript check
   npm run lint          # ESLint check
   ```

### Step 2: Load Context

1. Read this handover document (you are here)
2. Verify all documentation exists in project
3. Check package.json for all dependencies
4. Verify database schema in `src/lib/db/schema.ts`

### Step 3: Create TODO List

Create a persistent task list for Week 1:

```
WEEK 1 DEVELOPMENT - AUTHENTICATION & FOUNDATION
├─ Days 1-2: Auth Routes
│  ├─ Create NextAuth route handler
│  ├─ Create registration endpoint
│  └─ Test auth flow
├─ Days 3-4: Auth UI
│  ├─ Build login page
│  ├─ Build register page
│  └─ Add form validation
├─ Days 5-6: Layout & Navigation
│  ├─ Create root layout
│  ├─ Build navigation component
│  └─ Implement route groups
└─ Day 7: Testing & Validation
   ├─ Test complete auth flow
   ├─ Database operations
   └─ Code quality check
```

### Step 4: Begin Development

Start with **Day 1-2 Task**: Create NextAuth route handler

---

## 🔑 CRITICAL INFORMATION

### Database Status
- ✅ Schema designed (6 tables)
- ❌ **NOT YET DEPLOYED TO DATABASE** - Will deploy when PostgreSQL is set up
- Use `npm run db:push` to deploy schema (requires .env.local with DATABASE_URL)

### Authentication Status
- ✅ NextAuth.js configured
- ✅ Config file created at `src/lib/auth/config.ts`
- ❌ Route handler NOT YET CREATED - Must be created in Week 1

### Integration Status (Intentionally Delayed)
- ❌ Airtable integration - Skip until Week 3
- ❌ n8n workflow control - Skip until Week 3
- ✅ Mock data - Use local data for testing in Week 1

---

## 🎯 FIRST TASK FOR NEXT CONVERSATION

**Immediate Next Step**: Create NextAuth Route Handler

**Task**: Build `src/app/api/auth/[...nextauth].ts`

**What it does:**
- Handles login/logout endpoints
- Uses NextAuth configuration
- Creates JWT tokens
- Manages sessions

**File location**: 
```
src/app/api/auth/[...nextauth].ts
```

**Tests first (TDD)**: Write tests for auth endpoints before implementation

**Reference config**:
```
src/lib/auth/config.ts (already created)
```

---

## 📚 CONVERSATION TEMPLATE FOR NEXT SESSION

When starting the next conversation, use this prompt:

```
You are continuing UYSP Client Portal development (Week 1: Foundation & Authentication).

PROJECT STATUS:
- Location: /Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal/
- Framework: Next.js 14 + TypeScript + Tailwind CSS
- Database: PostgreSQL with Drizzle ORM (schema ready, not deployed yet)
- Auth: NextAuth.js configured (route handler needs to be created)
- Integration: NO Airtable/n8n in Week 1 (use mock data only)

WEEK 1 TASK: Build Authentication System (Days 1-7)

CURRENT FOCUS: Days 1-2 - Create NextAuth Route Handler

NEXT IMMEDIATE STEPS:
1. Verify project loads: npm run dev
2. Review: src/lib/auth/config.ts (NextAuth configuration)
3. Create: src/app/api/auth/[...nextauth].ts (route handler)
4. Write tests first (TDD), then implement

KEY RULES:
- Use VibeOS TDD protocol: Red → Green → Refactor
- Use Claude Code MCP server for code generation
- Track progress with todo_write tool
- All code must pass: lint, type-check, tests
- NO Airtable or n8n integration yet
- Use local mock data for testing

USE THESE TOOLS:
- mcp_claude-code-server_test_code() for TDD
- mcp_claude-code-server_edit_code() for implementation
- run_terminal_cmd for npm commands
- todo_write for progress tracking

REFERENCE:
- WEEK-1-SETUP.md: Development timeline
- src/lib/auth/config.ts: NextAuth configuration
- /docs/architecture/CLIENT-PORTAL-COMPLETE-SPECIFICATION.md: Full PRD
```

---

## ✅ HANDOVER COMPLETE

**What you (the next agent) need to know:**

1. ✅ Project foundation is complete and ready
2. ✅ Next task is clear: Build NextAuth route handler (Days 1-2)
3. ✅ Use TDD protocol with Claude Code MCP server
4. ✅ Track progress with todo_write tool
5. ✅ Skip Airtable/n8n integration (Week 3)
6. ✅ All quality gates must pass before committing

**Files to reference:**
- This handover document (you're reading it)
- `WEEK-1-SETUP.md` (development timeline)
- `src/lib/auth/config.ts` (NextAuth configuration)
- `src/lib/db/schema.ts` (database schema)

**Commands to remember:**
```bash
npm run dev            # Start development
npm run type-check    # TypeScript validation
npm run lint          # Code linting
npm run db:push       # Deploy schema to DB (later)
npm test              # Run tests (setup later)
```

---

**Ready to continue in the next conversation? 🚀**

Use the CONVERSATION TEMPLATE above to kick off the next session with full context.
