# 🤖 NEXT AGENT - START HERE

You are taking over **UYSP Client Portal** development on a fresh conversation.

---

## ⚡ Quick Status

✅ **Week 1 Complete**: Full authentication system built and tested  
⏳ **Week 2 Ready**: Database integration and live testing  
📍 **Location**: `/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal/`

---

## 📚 Read These (In Order)

1. **Quick Overview** (2 min)  
   → `docs/README.md`

2. **Development Progress** (2 min)  
   → `docs/progress/PROGRESS.md`

3. **Week 2 Handoff** (5 min)  
   → `docs/handoffs/week-2.md`

4. **Full Context** (10 min)  
   → `docs/session-reports/2025-10-19-week1-completion.md`

---

## 🎯 Your Task

**Week 2: Database Integration & Live Testing**

### Immediate Next Steps
1. Set up PostgreSQL database
2. Run `npm run db:push` to deploy schema
3. Replace mock auth with real database queries
4. Test registration and login workflows

### Key Files to Modify
- `src/lib/auth/config.ts` - Replace mock users with DB queries
- `src/app/api/users/register.ts` - Real user creation in DB

---

## 🧠 Claude Code MCP Server Usage

**Use in RED-GREEN-REFACTOR TDD Cycle:**

**RED Phase** → `mcp_claude-code-server_test_code()`
- Generate failing tests first
- Define expected behavior

**GREEN Phase** → `mcp_claude-code-server_edit_code()`
- Implement code to pass tests
- Minimal implementation

**REFACTOR Phase** → `mcp_claude-code-server_review_code()`
- Improve code quality
- Keep tests green

**DEBUG** → `mcp_claude-code-server_fix_code()`
- Fix bugs when tests fail

**Always validate after:** `npm run validate`

---

## 🛠️ Essential Commands

```bash
npm run dev              # Start dev server
npm run validate         # Type-check + lint + tests
npm test                 # Run tests
npm run db:push         # Deploy schema to DB
npm run db:studio       # Visual database explorer
```

---

## 📁 Key Documentation

**Quick Reference** (keep at root):
- `README.md`
- `WEEK-1-SETUP.md`
- `ENV-SETUP-GUIDE.md`

**Organized Docs** (in `/docs/`):
- `session-reports/` - Development logs
- `quality/` - Validation reports
- `handoffs/` - Next session context
- `progress/PROGRESS.md` - Timeline tracker

---

## ✅ What's Ready

- ✅ Authentication UI (login/register pages)
- ✅ NextAuth configured
- ✅ Protected routes middleware
- ✅ 13 tests (all passing)
- ✅ 0 linting errors
- ✅ 0 TypeScript errors
- ✅ Database schema designed (6 tables)

---

## ⚠️ Not Ready Yet

- ❌ PostgreSQL database (set up this week)
- ❌ Live login/register (test after DB setup)
- ❌ Airtable integration (Week 3)
- ❌ n8n automation (Week 3)

---

## 🚀 Start Development

```bash
cd "/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal"
npm run dev
# http://localhost:3000
```

---

## 📖 Development Rules

- ✅ Use VibeOS TDD protocol (SOP§1.1)
- ✅ Use Claude Code MCP in RED-GREEN-REFACTOR cycle
- ✅ Run `npm run validate` before committing
- ✅ All tests must pass
- ✅ 0 TypeScript errors required
- ✅ 0 ESLint errors required
- ✅ Read `/docs/handoffs/week-2.md` first

---

**Status**: Week 1 ✅ Complete → Week 2 Ready to Start 🚀

Good luck! You've got comprehensive documentation and a solid foundation to build on.
