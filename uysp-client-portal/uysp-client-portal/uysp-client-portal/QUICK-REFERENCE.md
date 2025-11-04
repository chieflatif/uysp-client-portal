# 📋 QUICK REFERENCE - UYSP Client Portal

## 🚀 Quick Start Commands

```bash
# Navigate to project
cd /Users/latifhorst/cursor\ projects/UYSP\ Lead\ Qualification\ V1/uysp-client-portal

# Start development
npm run dev                    # Opens http://localhost:3000

# Code quality
npm run lint                   # Check linting
npm run type-check             # Check TypeScript types

# Database (when setup)
npm run db:push               # Deploy schema to database
npm run db:studio             # Visual database explorer
npm run db:generate           # Generate migrations

# Build
npm run build                 # Build for production
npm start                     # Start production server
```

---

## 📍 Key Files (Week 1)

| File | Purpose | Status |
|------|---------|--------|
| `src/lib/auth/config.ts` | NextAuth configuration | ✅ Ready |
| `src/lib/db/schema.ts` | Database schema (6 tables) | ✅ Ready |
| `src/lib/db/index.ts` | Drizzle client | ✅ Ready |
| `drizzle.config.ts` | Database config | ✅ Ready |
| **Week 1 - Create:** | | |
| `src/app/api/auth/[...nextauth].ts` | NextAuth route handler | ⏳ TODO |
| `src/app/(auth)/login/page.tsx` | Login page | ⏳ TODO |
| `src/app/(auth)/register/page.tsx` | Register page | ⏳ TODO |
| `src/middleware.ts` | Route protection | ⏳ TODO |

---

## 🎯 Week 1 Timeline

| Days | Task | Status |
|------|------|--------|
| 1-2 | Create NextAuth route handler | ⏳ TODO |
| 3-4 | Build login/register UI | ⏳ TODO |
| 5-6 | App layout & navigation | ⏳ TODO |
| 7 | Testing & validation | ⏳ TODO |

---

## 🔑 Environment Variables

**Required in `.env.local`:**
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/uysp_portal
NEXTAUTH_SECRET=<generate: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
JWT_SECRET=<generate: openssl rand -base64 32>
AIRTABLE_API_KEY=<your-token>
AIRTABLE_BASE_ID=<your-base-id>
```

---

## 📊 Database Schema

```
users (6 columns)
├── id: UUID
├── email: VARCHAR (unique)
├── passwordHash: TEXT
├── role: VARCHAR (SUPER_ADMIN, ADMIN, CLIENT)
└── clientId: UUID (foreign key)

clients (6 columns)
├── id: UUID
├── companyName: VARCHAR
├── email: VARCHAR
├── airtableBaseId: VARCHAR
└── timestamps

leads (14 columns)
├── id: UUID
├── clientId: UUID
├── email: VARCHAR
├── icpScore: INTEGER
├── status: VARCHAR
├── claimedBy: UUID
└── timestamps

campaigns, notes, activity_log
└── Similar structure
```

---

## 🛠️ Development Tools

**Claude Code MCP Server Methods:**
- `test_code()` - Generate tests (use for TDD)
- `edit_code()` - Edit code
- `review_code()` - Code review
- `explain_code()` - Understand code
- `fix_code()` - Fix bugs

**VibeOS Tools:**
- `todo_write()` - Track tasks
- `run_terminal_cmd()` - Run commands
- `codebase_search()` - Search code
- `grep()` - Find text

---

## ✅ Quality Gates (Before Committing)

```bash
✓ npm run lint              # No linting errors
✓ npm run type-check        # TypeScript passes
✓ npm test                  # All tests pass
✓ npm run dev               # Starts without errors
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| `HANDOVER-PROMPT-NEXT-CONVERSATION.md` | Full handover guide |
| `WEEK-1-SETUP.md` | Week 1 development plan |
| `README.md` | Full project docs |
| `ENV-SETUP-GUIDE.md` | Environment setup |
| `START-HERE.md` | Quick setup |

---

## 🚫 What NOT to Do (Week 1)

- ❌ Don't integrate Airtable (Week 3 task)
- ❌ Don't integrate n8n (Week 3 task)
- ❌ Don't build lead management UI (Week 2 task)
- ❌ Don't build admin dashboard (Week 3 task)
- ✅ DO focus on: Authentication & Foundation

---

## 💡 TDD Process (Required)

1. **RED**: Write failing test
2. **GREEN**: Write minimum code to pass
3. **REFACTOR**: Improve while tests pass

---

## 📞 When Stuck

1. Check `WEEK-1-SETUP.md` for timeline
2. Review `src/lib/auth/config.ts` for NextAuth config
3. Check PRD at `/docs/architecture/CLIENT-PORTAL-COMPLETE-SPECIFICATION.md`
4. Use Claude Code MCP: `explain_code()` for existing code

---

**Next Task**: Create `src/app/api/auth/[...nextauth].ts` (Days 1-2)

Use TDD: Write tests first, then implement! 🚀
