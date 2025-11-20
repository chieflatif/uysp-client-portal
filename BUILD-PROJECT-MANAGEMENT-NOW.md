# BUILD NOW: Project Management Dashboard

**Agent Mission**: Build the Project Management dashboard feature for UYSP platform  
**Timeline**: 1 week (6-10 days)  
**Priority**: P0 - Build immediately  
**Status**: Ready to execute

---

## 🎯 WHAT YOU'RE BUILDING

A **Project Management tab** in the UYSP platform that displays client-specific tasks, blockers, and project status from their Airtable base.

**Think:** Mini project dashboard built INTO the platform clients already use. No external tools, no context switching.

---

## 🏗️ ARCHITECTURE (Already Built - You're Extending It)

### Existing Infrastructure You'll Use

**1. Multi-Tenant Airtable Sync** (ALREADY WORKING)
- Location: `src/app/api/admin/sync/route.ts`
- Pattern: Reads from client's Airtable base → Writes to PostgreSQL
- Frequency: On-demand with streaming progress
- You'll extend this to sync 3 more tables

**2. Database Schema** (ALREADY EXISTS)
- PostgreSQL with Drizzle ORM
- Location: `src/lib/db/schema.ts`
- Pattern: Each table has `clientId` foreign key
- You'll add 3 new tables following this pattern

**3. Frontend Components** (ALREADY STYLED)
- Design system: `src/theme.ts` (Rebel HQ Oceanic theme)
- Components: Cards, tables, badges all pre-built
- You'll create new PM component using existing patterns

**4. Authentication & Roles** (ALREADY WORKING)
- NextAuth with SUPER_ADMIN, ADMIN, CLIENT roles
- ADMIN can only see their client's data
- You'll make PM tab visible to ADMIN only

---

## 📋 STEP-BY-STEP BUILD PLAN

### STEP 1: Add Database Tables (2 hours)

**File to create**: `src/lib/db/schema.ts` (add to existing file)

```typescript
// Add these 3 tables after existing tables

export const clientProjectTasks = pgTable(
  'client_project_tasks',
  {
    id: varchar('id', { length: 50 }).primaryKey(), // Airtable record ID
    clientId: uuid('client_id').notNull(),
    task: varchar('task', { length: 500 }).notNull(),
    status: varchar('status', { length: 50 }).notNull(), // Not Started, In Progress, Blocked, Complete
    priority: varchar('priority', { length: 50 }).notNull(), // Critical, High, Medium, Low
    owner: varchar('owner', { length: 100 }),
    dueDate: date('due_date'),
    notes: text('notes'),
    dependencies: text('dependencies'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    clientIdIdx: index('idx_pm_tasks_client').on(table.clientId),
    statusIdx: index('idx_pm_tasks_status').on(table.status),
  })
);

export const clientProjectBlockers = pgTable(
  'client_project_blockers',
  {
    id: varchar('id', { length: 50 }).primaryKey(),
    clientId: uuid('client_id').notNull(),
    blocker: varchar('blocker', { length: 500 }).notNull(),
    severity: varchar('severity', { length: 50 }).notNull(), // Critical, High, Medium
    actionToResolve: text('action_to_resolve'),
    status: varchar('status', { length: 50 }).notNull(), // Active, In Progress, Resolved
    createdAt: timestamp('created_at').notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at'),
  },
  (table) => ({
    clientIdIdx: index('idx_pm_blockers_client').on(table.clientId),
    statusIdx: index('idx_pm_blockers_status').on(table.status),
  })
);

export const clientProjectStatus = pgTable(
  'client_project_status',
  {
    id: varchar('id', { length: 50 }).primaryKey(),
    clientId: uuid('client_id').notNull(),
    metric: varchar('metric', { length: 200 }).notNull(),
    value: text('value').notNull(),
    category: varchar('category', { length: 50 }).notNull(), // Overview, Progress, Milestones
    displayOrder: integer('display_order'),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    clientIdIdx: index('idx_pm_status_client').on(table.clientId),
  })
);

export type ClientProjectTask = typeof clientProjectTasks.$inferSelect;
export type ClientProjectBlocker = typeof clientProjectBlockers.$inferSelect;
export type ClientProjectStatus = typeof clientProjectStatus.$inferSelect;
```

**Migration file to create**: `migrations/add-project-management-tables.sql`

```sql
-- Create project management tables

CREATE TABLE IF NOT EXISTS client_project_tasks (
  id VARCHAR(50) PRIMARY KEY,
  client_id UUID NOT NULL,
  task VARCHAR(500) NOT NULL,
  status VARCHAR(50) NOT NULL,
  priority VARCHAR(50) NOT NULL,
  owner VARCHAR(100),
  due_date DATE,
  notes TEXT,
  dependencies TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pm_tasks_client ON client_project_tasks(client_id);
CREATE INDEX idx_pm_tasks_status ON client_project_tasks(status);

CREATE TABLE IF NOT EXISTS client_project_blockers (
  id VARCHAR(50) PRIMARY KEY,
  client_id UUID NOT NULL,
  blocker VARCHAR(500) NOT NULL,
  severity VARCHAR(50) NOT NULL,
  action_to_resolve TEXT,
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMP
);

CREATE INDEX idx_pm_blockers_client ON client_project_blockers(client_id);
CREATE INDEX idx_pm_blockers_status ON client_project_blockers(status);

CREATE TABLE IF NOT EXISTS client_project_status (
  id VARCHAR(50) PRIMARY KEY,
  client_id UUID NOT NULL,
  metric VARCHAR(200) NOT NULL,
  value TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  display_order INTEGER,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pm_status_client ON client_project_status(client_id);
```

**Run migration:**
```bash
PGPASSWORD=PuLMS841kifvBNpl3mGcLBl1WjIs0ey2 psql \
  -h dpg-d3q9raodl3ps73bp1r50-a.virginia-postgres.render.com \
  -U uysp_client_portal_db_user \
  -d uysp_client_portal_db \
  -f migrations/add-project-management-tables.sql
```

---

### STEP 2: Extend Airtable Sync (3 hours)

**File to modify**: `src/lib/airtable/client.ts`

**Add PM table syncing methods:**

```typescript
// Add after existing methods

async getAllTasks(offset?: string) {
  const params = new URLSearchParams({ pageSize: '100' });
  if (offset) params.append('offset', offset);
  
  const response = await fetch(
    `${this.baseUrl}/${this.baseId}/Tasks?${params}`,
    { headers: { Authorization: `Bearer ${this.apiKey}` }}
  );
  
  const data = await response.json();
  return { records: data.records, nextOffset: data.offset };
}

async getAllBlockers(offset?: string) {
  const params = new URLSearchParams({ pageSize: '100' });
  if (offset) params.append('offset', offset);
  
  const response = await fetch(
    `${this.baseUrl}/${this.baseId}/Blockers?${params}`,
    { headers: { Authorization: `Bearer ${this.apiKey}` }}
  );
  
  const data = await response.json();
  return { records: data.records, nextOffset: data.offset };
}

async getAllProjectStatus(offset?: string) {
  const params = new URLSearchParams({ pageSize: '100' });
  if (offset) params.append('offset', offset);
  
  const response = await fetch(
    `${this.baseUrl}/${this.baseId}/Project Status?${params}`,
    { headers: { Authorization: `Bearer ${this.apiKey}` }}
  );
  
  const data = await response.json();
  return { records: data.records, nextOffset: data.offset };
}
```

**Modify sync endpoint**: `src/app/api/admin/sync/route.ts`

Add PM table syncing after leads sync:

```typescript
// After leads sync completes...

// Sync tasks
const tasks = await airtable.getAllTasks();
for (const record of tasks.records) {
  await db.insert(clientProjectTasks).values({
    id: record.id,
    clientId: clientId,
    task: record.fields['Task'],
    status: record.fields['Status'],
    priority: record.fields['Priority'],
    owner: record.fields['Owner'],
    dueDate: record.fields['Due Date'] ? new Date(record.fields['Due Date']) : null,
    notes: record.fields['Notes'],
    dependencies: record.fields['Dependencies'],
  }).onConflictDoUpdate({
    target: clientProjectTasks.id,
    set: { updatedAt: new Date() }
  });
}

// Sync blockers (same pattern)
// Sync project status (same pattern)
```

---

### STEP 3: Create API Endpoints (2 hours)

**File to create**: `src/app/api/clients/[id]/project/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { clientProjectTasks, clientProjectBlockers, clientProjectStatus } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ADMIN users can only see their own client's data
    if (session.user.role === 'ADMIN' && session.user.clientId !== params.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // SUPER_ADMIN can see any client
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all PM data for this client
    const tasks = await db.query.clientProjectTasks.findMany({
      where: eq(clientProjectTasks.clientId, params.id),
      orderBy: (tasks, { asc }) => [asc(tasks.dueDate)],
    });

    const blockers = await db.query.clientProjectBlockers.findMany({
      where: eq(clientProjectBlockers.clientId, params.id),
    });

    const status = await db.query.clientProjectStatus.findMany({
      where: eq(clientProjectStatus.clientId, params.id),
      orderBy: (status, { asc }) => [asc(status.displayOrder)],
    });

    return NextResponse.json({
      tasks,
      blockers: blockers.filter(b => b.status !== 'Resolved'),
      status,
    });

  } catch (error) {
    console.error('Error fetching project data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

### STEP 4: Create Frontend Component (3-5 days)

**File to create**: `src/app/(client)/project-management/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  CheckSquare, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  Loader2 
} from 'lucide-react';
import { theme } from '@/theme';

interface Task {
  id: string;
  task: string;
  status: string;
  priority: string;
  owner: string;
  dueDate: string | null;
  notes: string | null;
  dependencies: string | null;
}

interface Blocker {
  id: string;
  blocker: string;
  severity: string;
  actionToResolve: string;
  status: string;
}

interface ProjectStatus {
  id: string;
  metric: string;
  value: string;
  category: string;
}

export default function ProjectManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [blockers, setBlockers] = useState<Blocker[]>([]);
  const [projectStatus, setProjectStatus] = useState<ProjectStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    // Only ADMIN and SUPER_ADMIN can see this
    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
      router.push('/dashboard');
      return;
    }

    fetchProjectData();
  }, [status, session, router]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      
      // ADMIN users use their clientId, SUPER_ADMIN needs to select a client
      let clientId = session?.user?.clientId;
      
      // For SUPER_ADMIN, default to UYSP for now (or add client selector later)
      if (session?.user?.role === 'SUPER_ADMIN' && !clientId) {
        const clientsRes = await fetch('/api/admin/clients');
        if (clientsRes.ok) {
          const data = await clientsRes.json();
          const uysp = data.clients.find((c: any) => c.companyName === 'UYSP');
          if (uysp) clientId = uysp.id;
        }
      }

      if (!clientId) {
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/clients/${clientId}/project`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
        setBlockers(data.blockers || []);
        setProjectStatus(data.status || []);
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${theme.core.darkBg} flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className={theme.core.bodyText}>Loading project data...</p>
        </div>
      </div>
    );
  }

  // Get overview status
  const overview = projectStatus.find(s => s.category === 'Overview');
  const progress = projectStatus.find(s => s.metric === 'Progress %');

  // Group tasks by priority
  const criticalTasks = tasks.filter(t => t.priority === '🔴 Critical' && t.status !== 'Complete');
  const highTasks = tasks.filter(t => t.priority === '🟠 High' && t.status !== 'Complete');
  const completedTasks = tasks.filter(t => t.status === 'Complete');

  return (
    <div className={`min-h-screen ${theme.core.darkBg} p-8`}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className={`text-4xl font-bold ${theme.core.white}`}>
            <CheckSquare className="w-8 h-8 inline mr-3" />
            <span className={theme.accents.primary.class}>Project</span> Management
          </h1>
          <p className={theme.core.bodyText}>Real-time project status and task tracking</p>
        </div>

        {/* Project Overview */}
        {overview && (
          <div className={theme.components.card}>
            <h2 className={`text-xl font-bold ${theme.core.white} mb-4`}>
              Project <span className={theme.accents.tertiary.class}>Overview</span>
            </h2>
            <div className="space-y-4">
              <div>
                <p className={`text-sm ${theme.accents.tertiary.class} mb-2`}>Current Phase</p>
                <p className={`text-2xl font-bold ${theme.core.white}`}>{overview.value}</p>
              </div>
              {progress && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className={`text-sm ${theme.accents.tertiary.class}`}>Progress</p>
                    <p className={`text-sm ${theme.core.white} font-bold`}>{progress.value}</p>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-4">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: progress.value }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Active Blockers */}
        {blockers.length > 0 && (
          <div className="p-6 rounded-lg bg-red-900/20 border border-red-600/50">
            <h2 className={`text-xl font-bold text-red-400 mb-4 flex items-center gap-2`}>
              <AlertTriangle className="w-5 h-5" />
              Active Blockers
            </h2>
            <div className="space-y-3">
              {blockers.map((blocker) => (
                <div key={blocker.id} className="p-3 rounded bg-red-900/10 border border-red-700/30">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`font-bold ${theme.core.white}`}>{blocker.blocker}</p>
                      {blocker.actionToResolve && (
                        <p className={`text-sm ${theme.core.bodyText} mt-1`}>
                          → {blocker.actionToResolve}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      blocker.severity === '🔴 Critical' ? 'bg-red-600 text-white' :
                      blocker.severity === '🟠 High' ? 'bg-orange-600 text-white' :
                      'bg-yellow-600 text-white'
                    }`}>
                      {blocker.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Task Board */}
        <div className={theme.components.card}>
          <h2 className={`text-xl font-bold ${theme.core.white} mb-6`}>
            Task <span className={theme.accents.primary.class}>Board</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Critical Column */}
            <div>
              <h3 className="text-sm font-bold text-red-400 mb-3 uppercase">🔴 Critical</h3>
              <div className="space-y-2">
                {criticalTasks.map((task) => (
                  <div key={task.id} className="p-3 rounded-lg bg-red-900/10 border border-red-700/30">
                    <p className={`text-sm font-medium ${theme.core.white}`}>{task.task}</p>
                    {task.dueDate && (
                      <p className="text-xs text-red-400 mt-1">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                    )}
                    {task.owner && (
                      <p className="text-xs text-gray-400 mt-1">Owner: {task.owner}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* High Column */}
            <div>
              <h3 className="text-sm font-bold text-orange-400 mb-3 uppercase">🟠 High</h3>
              <div className="space-y-2">
                {highTasks.map((task) => (
                  <div key={task.id} className="p-3 rounded-lg bg-orange-900/10 border border-orange-700/30">
                    <p className={`text-sm font-medium ${theme.core.white}`}>{task.task}</p>
                    {task.dueDate && (
                      <p className="text-xs text-orange-400 mt-1">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Medium Column */}
            <div>
              <h3 className="text-sm font-bold text-yellow-400 mb-3 uppercase">🟡 Medium</h3>
              <div className="space-y-2">
                {tasks.filter(t => t.priority === '🟡 Medium' && t.status !== 'Complete').map((task) => (
                  <div key={task.id} className="p-3 rounded-lg bg-yellow-900/10 border border-yellow-700/30">
                    <p className={`text-sm font-medium ${theme.core.white}`}>{task.task}</p>
                    {task.dueDate && (
                      <p className="text-xs text-yellow-400 mt-1">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Complete Column */}
            <div>
              <h3 className="text-sm font-bold text-green-400 mb-3 uppercase">✅ Complete</h3>
              <div className="space-y-2">
                {completedTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="p-3 rounded-lg bg-green-900/10 border border-green-700/30 opacity-60">
                    <p className={`text-sm font-medium ${theme.core.white} line-through`}>{task.task}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Milestones */}
        {projectStatus.filter(s => s.category === 'Milestones').length > 0 && (
          <div className={theme.components.card}>
            <h2 className={`text-xl font-bold ${theme.core.white} mb-4 flex items-center gap-2`}>
              <Calendar className="w-5 h-5" />
              Upcoming <span className={theme.accents.primary.class}>Milestones</span>
            </h2>
            <div className="space-y-2">
              {projectStatus.filter(s => s.category === 'Milestones').map((milestone) => (
                <div key={milestone.id} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                  <p className={theme.core.bodyText}>{milestone.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### STEP 5: Add Navigation Tab (30 min)

**File to modify**: `src/components/navbar/Navbar.tsx` (or equivalent)

Add "Project Management" link:

```typescript
{session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN' && (
  <Link 
    href="/project-management"
    className={`flex items-center gap-2 ${isActive('/project-management') ? theme.accents.primary.class : theme.core.bodyText}`}
  >
    <CheckSquare className="w-4 h-4" />
    Project Management
  </Link>
)}
```

---

### STEP 6: Setup Airtable Tables for UYSP (30 min - MANUAL)

**In UYSP's Airtable base** (app4wIsBfpJTg7pWS or app1gPTBDG0DubPJc):

**Create 3 tables exactly as specified:**

1. **Tasks** table with fields: Task, Status, Priority, Owner, Due Date, Notes, Dependencies
2. **Blockers** table with fields: Blocker, Severity, Action to Resolve, Status
3. **Project Status** table with fields: Metric, Value, Category, Display Order

**Populate with initial data from the PRD** (10 tasks, 2 blockers, 9 status metrics already listed)

---

## ✅ ACCEPTANCE CRITERIA

**When you're done, this should work:**

1. **Login as UYSP ADMIN** → See "Project Management" tab in navigation
2. **Click tab** → See project dashboard with:
   - Project overview (phase, progress bar)
   - Active blockers (2 items with red alert styling)
   - Task board (Kanban with 4 columns: Critical, High, Medium, Complete)
   - Upcoming milestones
3. **Data is real** → Shows actual tasks from Airtable
4. **Updates automatically** → Sync every 5 min or on-demand
5. **Multi-tenant safe** → ADMIN sees only their client, SUPER_ADMIN can see all

---

## 🚀 BUILD ORDER

**Day 1:**
1. Run database migration (add 3 tables)
2. Extend Airtable sync (add PM table syncing)
3. Test sync with UYSP data

**Day 2:**
4. Create API endpoint (`/api/clients/[id]/project`)
5. Test API returns correct data

**Day 3-4:**
6. Build frontend component (layout, styling)
7. Connect to API
8. Add to navigation

**Day 5:**
9. Test end-to-end
10. Deploy to production
11. Tanveer UAT

**Total: 5 working days (1 week)**

---

## 📚 REFERENCE EXISTING CODE PATTERNS

**For database schema**: See `src/lib/db/schema.ts` (clients, leads, users tables)  
**For API endpoints**: See `src/app/api/admin/clients/[id]/health/route.ts`  
**For frontend pages**: See `src/app/(client)/admin/clients/[id]/page.tsx`  
**For Airtable sync**: See `src/app/api/admin/sync/route.ts`  
**For styling**: See `src/theme.ts` and any existing page

---

## 🎯 GO BUILD IT NOW

**You have:**
- ✅ Complete spec
- ✅ Working codebase to extend
- ✅ All patterns already exist
- ✅ Clear acceptance criteria
- ✅ 5-day timeline

**Just follow the steps above and you'll have a working Project Management dashboard by end of week.**

**Questions? Check existing code first. It's all there.**

**START WITH:** Database migration (Step 1), then sync extension (Step 2).

**BUILD IT!** 🚀







