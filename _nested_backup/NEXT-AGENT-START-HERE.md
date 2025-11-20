# 🤖 FOR THE NEXT AI AGENT - START HERE

**You are taking over UYSP Client Portal development on a fresh conversation.**

Read this document first. It will tell you everything you need to know.

---

## 📖 READ THESE DOCUMENTS IN THIS ORDER

### 1. QUICK OVERVIEW (2 minutes)
📄 **File**: `QUICK-REFERENCE.md`
- Quick commands
- Key files
- Week 1 timeline at a glance

### 2. FULL HANDOVER CONTEXT (10 minutes)
📄 **File**: `HANDOVER-PROMPT-NEXT-CONVERSATION.md` ⭐ **MOST IMPORTANT**
- What's been completed (Phase 0)
- What's next (Week 1 tasks)
- Development methodology (TDD + Claude Code MCP)
- Progress tracking setup
- Conversation template to use

### 3. QUICK SETUP (2 minutes if needed)
📄 **File**: `START-HERE.md`
- 3-step setup to verify project loads
- Environment variables
- Database setup

### 4. FULL PROJECT REFERENCE (for questions)
📄 **File**: `README.md`
- Complete project documentation
- Project structure
- All available commands
- Deployment information

---

## 📁 KEY PROJECT FILES (In Project Directory)

**Location**: `/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal/`

### Database & Auth (Read Only - Already Set Up)
- `src/lib/db/schema.ts` - 6 database tables designed
- `src/lib/auth/config.ts` - NextAuth configuration ready
- `drizzle.config.ts` - Database configuration
- `.env.example` - Environment variables template

### This Week's Development (Create These)
- `src/app/api/auth/[...nextauth].ts` - NextAuth route handler (FIRST TASK)
- `src/app/(auth)/login/page.tsx` - Login page
- `src/app/(auth)/register/page.tsx` - Register page
- `tests/` - Test files (TDD first)

---

## 🎯 YOUR IMMEDIATE TASK

**You are starting Week 1 development (authentication & foundation).**

### First Task (Days 1-2):
Create NextAuth route handler at:
```
src/app/api/auth/[...nextauth].ts
```

**Do this:**
1. Write failing tests FIRST (TDD)
2. Then implement the code
3. Use Claude Code MCP: `test_code()` and `edit_code()`
4. Track progress with `todo_write()`

### Week 1 Timeline:
- **Days 1-2**: Auth routes
- **Days 3-4**: Login/register UI
- **Days 5-6**: App layout & navigation
- **Day 7**: Testing & validation

---

## 🛠️ TOOLS YOU'LL USE

### Claude Code MCP Server
- `test_code()` - Generate tests (for TDD)
- `edit_code()` - Edit code based on instructions
- `review_code()` - Code review and feedback
- `explain_code()` - Understand existing code
- `fix_code()` - Fix bugs

### VibeOS Tools
- `todo_write()` - Track tasks
- `run_terminal_cmd()` - Run npm commands
- `grep()` - Search code
- `codebase_search()` - Semantic search

---

## 📝 METHODOLOGY

**You MUST follow TDD (Test-Driven Development):**

1. **RED** - Write failing test first
2. **GREEN** - Write minimum code to pass test
3. **REFACTOR** - Improve code while tests pass

This is non-negotiable. Use VibeOS SOP§1.1.

---

## ✅ QUALITY GATES (Before Committing)

```bash
npm run lint              # Must pass
npm run type-check        # Must pass
npm test                  # All tests must pass
npm run dev               # Must start without errors
```

---

## 🚀 HOW TO START THIS CONVERSATION

**When you start the next conversation, copy and paste this prompt:**

```
You are continuing UYSP Client Portal development (Week 1: Authentication & Foundation).

PROJECT STATUS:
- Location: /Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal/
- Framework: Next.js 14 + TypeScript + Tailwind CSS
- Database: PostgreSQL with Drizzle ORM (schema ready)
- Auth: NextAuth.js configured (route handler needs to be created)
- NO Airtable/n8n integration in Week 1 (use mock data only)

WEEK 1 TASK: Build Authentication System (Days 1-7)

CURRENT FOCUS: Days 1-2 - Create NextAuth Route Handler
  Location: src/app/api/auth/[...nextauth].ts
  Use TDD: Write tests first, then implement

NEXT IMMEDIATE STEPS:
1. Verify project loads: npm run dev
2. Review: src/lib/auth/config.ts (NextAuth configuration already set up)
3. Create: src/app/api/auth/[...nextauth].ts (route handler)
4. Write tests first (TDD), then implement

KEY RULES:
- Use VibeOS TDD protocol: Red → Green → Refactor
- Use Claude Code MCP server for code generation
- Track progress with todo_write tool
- All code must pass: lint, type-check, tests
- NO Airtable or n8n integration yet
- Use local mock data for testing

REFERENCE DOCUMENTS:
- QUICK-REFERENCE.md: Commands & files
- HANDOVER-PROMPT-NEXT-CONVERSATION.md: Full context
- START-HERE.md: Setup verification
- README.md: Full project docs
```

---

## 📊 PROJECT STATUS AT HANDOFF

✅ **COMPLETED (Phase 0)**
- Next.js 14 project created
- TypeScript + Tailwind CSS configured
- Database schema designed (6 tables)
- NextAuth.js configured
- All dependencies installed
- Documentation complete

⏳ **TODO (Week 1)**
- Create NextAuth route handler
- Build login/register pages
- Create app layout & navigation
- Write and test everything (TDD)

❌ **SKIP FOR NOW (Week 3)**
- Airtable integration
- n8n integration
- Real lead sync

---

## 📚 FULL DOCUMENTATION LIST

All files are in: `/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal/`

| Document | Lines | Purpose |
|----------|-------|---------|
| `QUICK-REFERENCE.md` | 170 | Quick lookup (read first) |
| `HANDOVER-PROMPT-NEXT-CONVERSATION.md` | 439 | Full context (main handover) |
| `START-HERE.md` | 186 | Quick setup verification |
| `README.md` | 268 | Full project reference |
| `WEEK-1-SETUP.md` | 282 | Week 1 timeline & tasks |
| `ENV-SETUP-GUIDE.md` | 195 | Environment variable setup |

**MAIN PRD** (in parent project):
- `/docs/architecture/CLIENT-PORTAL-COMPLETE-SPECIFICATION.md` (2,040 lines)

**ADMIN DASHBOARD SPEC** (in parent project):
- `/context/CURRENT-SESSION/twilio-migration/FRONTEND-DASHBOARD-SPECIFICATION.md` (758 lines)

---

## 🔑 KEY COMMANDS

```bash
# Start development
npm run dev                    # localhost:3000

# Code quality
npm run lint                   # Linting
npm run type-check             # TypeScript
npm test                       # Tests

# Database (when needed)
npm run db:push               # Deploy schema
npm run db:studio             # Visual database explorer

# Build
npm run build                 # Build for production
npm start                     # Start production
```

---

## ⚡ TL;DR - IF YOU'RE IN A HURRY

1. Read: `QUICK-REFERENCE.md` (2 min)
2. Read: `HANDOVER-PROMPT-NEXT-CONVERSATION.md` (10 min)
3. Run: `npm run dev` (verify it loads)
4. Start: Create `src/app/api/auth/[...nextauth].ts`
5. Follow: TDD - tests first, then code
6. Track: Use `todo_write()` for progress

---

## 🚨 IMPORTANT REMINDERS

✅ **Week 1 is ONLY authentication**
- Build login/register/auth routes
- Don't touch Airtable/n8n (that's Week 3)

✅ **TDD is mandatory**
- Write failing tests FIRST
- Then implement code
- Use VibeOS SOP§1.1

✅ **Use Claude Code MCP**
- `test_code()` for TDD
- `edit_code()` for implementation
- `review_code()` for quality

✅ **Track progress**
- Use `todo_write()` for tasks
- Update status as you work
- Track code quality metrics

---

**You've got this! 🚀**

Questions? Check the HANDOVER-PROMPT-NEXT-CONVERSATION.md file.

Start with `npm run dev` to verify the project loads, then begin Week 1 development.
