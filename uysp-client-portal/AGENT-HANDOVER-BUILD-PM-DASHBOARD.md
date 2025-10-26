# Agent Handover: Build Project Management Dashboard

**Task**: Build a Project Management tab for the UYSP platform  
**Timeline**: 5 days  
**Codebase**: `/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal`

---

## What to Build

A **Project Management** dashboard tab that shows:
- Project overview (phase, progress bar)
- Task board (Kanban: Critical, High, Medium, Complete)
- Active blockers (red alerts)
- Upcoming milestones

**Visible to**: ADMIN users only (not CLIENT role)

---

## How It Works

**Data flows from Airtable → PostgreSQL → Frontend:**

1. Each client has 3 tables in their Airtable base: Tasks, Blockers, Project Status
2. Existing sync engine pulls data into PostgreSQL
3. Frontend displays it (read-only for Phase 1)

**You're extending existing sync - all patterns already exist in the codebase.**

---

## What to Code

### 1. Database Tables

Add to `src/lib/db/schema.ts`:

```typescript
export const clientProjectTasks = pgTable('client_project_tasks', {
  id: varchar('id', { length: 50 }).primaryKey(),
  clientId: uuid('client_id').notNull(),
  task: varchar('task', { length: 500 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  priority: varchar('priority', { length: 50 }).notNull(),
  owner: varchar('owner', { length: 100 }),
  dueDate: date('due_date'),
  notes: text('notes'),
  dependencies: text('dependencies'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const clientProjectBlockers = pgTable('client_project_blockers', {
  id: varchar('id', { length: 50 }).primaryKey(),
  clientId: uuid('client_id').notNull(),
  blocker: varchar('blocker', { length: 500 }).notNull(),
  severity: varchar('severity', { length: 50 }).notNull(),
  actionToResolve: text('action_to_resolve'),
  status: varchar('status', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at'),
});

export const clientProjectStatus = pgTable('client_project_status', {
  id: varchar('id', { length: 50 }).primaryKey(),
  clientId: uuid('client_id').notNull(),
  metric: varchar('metric', { length: 200 }).notNull(),
  value: text('value').notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  displayOrder: integer('display_order'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
```

### 2. API Endpoint

Create `src/app/api/clients/[id]/project/route.ts`:

Fetches tasks, blockers, status for a client. Filter by `clientId`. Enforce ADMIN can only see their client.

### 3. Frontend Page

Create `src/app/(client)/project-management/page.tsx`:

- Kanban board (4 columns: Critical, High, Medium, Complete)
- Blockers alert section (red)
- Progress bar with percentage
- Milestones list

Use `src/theme.ts` for styling (Rebel HQ Oceanic: pink/indigo/cyan accents, dark background).

### 4. Extend Sync

Modify `src/app/api/admin/sync/route.ts`:

After syncing leads, also sync Tasks, Blockers, Project Status from Airtable.

---

## Reference Existing Code

**For sync pattern**: See `src/app/api/admin/sync/route.ts` (how leads sync works)  
**For API endpoint**: See `src/app/api/admin/clients/[id]/health/route.ts` (client-specific data)  
**For frontend page**: See `src/app/(client)/admin/clients/[id]/page.tsx` (layout, styling)  
**For auth check**: See any page in `src/app/(client)/` (role-based access)

---

## Acceptance Criteria

**When done:**
1. ADMIN user logs in → sees "Project Management" tab
2. Clicks tab → sees Kanban board with tasks from Airtable
3. Blockers show in red alert section
4. Progress bar displays project completion %
5. Data updates when sync runs
6. ADMIN only sees their client's data (not other clients)

---

## Build It

**Timeline**: 5 days

**Start with**:
1. Run migration (add 3 tables)
2. Extend sync (add PM table syncing)
3. Create API endpoint
4. Build frontend component
5. Add to navigation
6. Test and deploy

**All patterns exist in codebase. Follow them. Build it.** 🚀

