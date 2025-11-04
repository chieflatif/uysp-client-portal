# Production Deployment Checklist

**Date Created**: 2025-11-03
**Purpose**: Step-by-step verification guide for deploying UYSP Client Portal to production

---

## Pre-Deployment: Environment Variables

```bash
npm run validate:env:prod
```

Expected: "Environment validation PASSED"

## Pre-Deployment: Database Migrations

Verify migrations 0010, 0012, 0013 applied

## Pre-Deployment: Code Quality

```bash
npm run type-check && npm run lint && npm run test:all && npm run build
```

## Deployment: Apply Migrations First

Then deploy application code to Vercel

## Post-Deployment: Smoke Tests

1. Login works
2. Campaign preview matches enrollment (BUG #15)
3. AI generation works with timeouts/segments (BUG #17, #20)
4. Duplicate campaign names rejected (BUG #18)

## Post-Deployment: Cron Jobs

Configure Vercel cron for scheduled campaign activation

---

See full details in SESSION-COMPLETE-BUG-FIXES-AI-TESTING-2025-11-03.md
