# PM Dashboard - Quick Fix Guide

**⏱️ 5-Minute Quick Wins**

## Fix #1: Remove Duplicate Navbar (2 min)

Edit `/src/app/(client)/layout.tsx`:

**Change line 32-38 FROM:**
```typescript
return (
  <>
    <Navbar />
    {children}
  </>
);
```

**TO:**
```typescript
return <>{children}</>;
```

**Result**: Duplicate navbar disappears ✅

---

## Fix #2: Debug API Endpoint (3 min)

Open browser console, run:
```javascript
fetch('/api/clients/6a08f898-19cd-49f8-bd77-6fcb2dd56db9/project')
  .then(r => r.json())
  .then(d => console.log('API Response:', d))
  .catch(e => console.error('API Error:', e))
```

**If you see data**: Frontend fetch is broken  
**If 401/403**: Auth issue - check session.user.clientId  
**If 404**: Verify PostgreSQL has data (run `npx tsx scripts/test-pm-sync.ts`)

---

## Fix #3: Rebuild PM Page (Copy-Paste)

**Step 1**: Copy entire file
```bash
cp src/app/(client)/leads/page.tsx src/app/(client)/project-management/page.tsx
```

**Step 2**: Replace these:
- `Lead` → `Task`
- `leads` → `tasks`
- `icpScore` → `priority`
- `/leads` → `/project-management`

**Step 3**: Update columns in table:
- Lead Info → Task
- Company → Priority  
- ICP Score → Status
- LinkedIn → Owner
- Status → Due Date

---

## The 3 Files You Need

1. **Template**: `/src/app/(client)/leads/page.tsx`
2. **Template**: `/src/app/(client)/leads/[id]/page.tsx`
3. **Target**: `/src/app/(client)/project-management/page.tsx`

**Copy 1 → 3, adapt for tasks. Done.**

---

## Test Checklist

- [ ] One navbar (not two)
- [ ] PM link shows
- [ ] Table with 21 tasks shows
- [ ] Can search
- [ ] Can filter
- [ ] Can sort
- [ ] Can click task
- [ ] Detail page opens

**Total time**: ~4 hours if following Leads pattern exactly.

