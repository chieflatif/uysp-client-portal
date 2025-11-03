# HANDOVER: Project Management Dashboard - INCOMPLETE BUILD

**Date**: October 23, 2025  
**Status**: ⚠️ PARTIAL - Needs Completion  
**Agent**: Handing over to Claude Sonnet for completion  
**Priority**: HIGH - Client needs this working ASAP  
**Estimated completion time**: 4-6 hours

---

## 🚨 EXECUTIVE SUMMARY (TL;DR)

**What Works:**
- ✅ Database: 3 tables created and migrated
- ✅ Airtable: 21 tasks, 4 blockers, 8 status metrics
- ✅ Sync: Data successfully synced to PostgreSQL
- ✅ Backend foundation: Solid and complete

**What's Broken:**
- ❌ Duplicate navigation bars (2 showing)
- ❌ API fetch failing ("No Project Data Yet")
- ❌ Wrong UI (card view instead of table)
- ❌ No drill-down to task details
- ❌ No edit/save functionality

**Quick Fixes:**
1. Remove lines 32-38 from `/src/app/(client)/layout.tsx`
2. Debug why `/api/clients/[id]/project` returns error
3. Replace PM page with table view (copy from Leads)
4. Build task detail page (copy from Leads)
5. Add write API endpoints

**Pattern to Follow:**
- 📄 `/src/app/(client)/leads/page.tsx` = Template for PM table
- 📄 `/src/app/(client)/leads/[id]/page.tsx` = Template for task detail

---

## WHAT THE USER ACTUALLY WANTS

**Crystal clear requirement**: Build a Project Management dashboard **EXACTLY LIKE THE LEADS TABLE** but for tasks.

### Reference Implementation
Look at these files - they are the GOLD STANDARD:
- `/src/app/(client)/leads/page.tsx` - Table view with search/filter/sort
- `/src/app/(client)/leads/[id]/page.tsx` - Detail page with edit capability
- `/src/components/notes/NotesList.tsx` - Notes/comments system

### User's Exact Requirements:
1. ✅ **Navigation**: "Project Management" link in top nav for ADMIN users ONLY
2. ✅ **Table View**: Like leads - searchable, filterable, sortable, clickable rows
3. ❌ **Drill Down**: Click task → Detail page (like `/leads/[id]`)
4. ❌ **Full CRUD**: Edit all fields, assign users, add notes
5. ❌ **Write to Airtable**: All changes must sync back to Airtable (source of truth)
6. ✅ **Blockers**: Show prominently (red alerts)
7. ✅ **Progress**: Show completion percentage

---

## CURRENT STATE: WHAT'S BROKEN

### Issue #1: Duplicate Navigation Bar
**Problem**: Two navigation bars showing (see screenshot)
**What I did**: Created `/src/components/Navigation.tsx` AND modified `/src/components/navbar/Navbar.tsx`
**Fix needed**: 
- Remove the duplicate entirely
- Keep ONLY `/src/components/navbar/Navbar.tsx`
- Ensure it has PM link for admins
- Keep original style: Cyan R circle, "Rebel Admin", turquoise logout button, settings icon

### Issue #2: No Project Data Showing
**Problem**: PM page says "No Project Data Yet" even though data IS synced
**What I did**: 
- ✅ Created 3 DB tables (migration successful)
- ✅ Synced 21 tasks + 4 blockers + 8 status metrics to PostgreSQL (verified via script)
- ✅ Created `/src/app/api/clients/[id]/project/route.ts` endpoint
- ❌ Frontend can't fetch the data (fetch failing)

**Debug needed**:
- Check API endpoint authorization (might be blocking ADMIN users)
- Check if `session.user.clientId` is correct
- Test API endpoint directly: `GET /api/clients/6a08f898-19cd-49f8-bd77-6fcb2dd56db9/project`

### Issue #3: Wrong UI Built
**What I built**: Card-based Kanban view (read-only)
**What user wants**: Table view with clickable rows (full CRUD)
**Files to replace**:
- `/src/app/(client)/project-management/page.tsx` - Needs to be table view
- `/src/components/ProjectManagementEmbed.tsx` - DELETE (not needed)

---

## WHAT'S ACTUALLY DONE

### Database ✅ COMPLETE
- ✅ Schema added to `/src/lib/db/schema.ts` (3 tables)
- ✅ Migration created: `/src/lib/db/migrations/0002_clammy_vermin.sql`
- ✅ Migration run successfully on production database
- ✅ Tables exist: `client_project_tasks`, `client_project_blockers`, `client_project_status`

### Airtable ✅ COMPLETE
- ✅ Created 3 tables in main UYSP base (`app4wIsBfpJTg7pWS`):
  - `Tasks` (21 records)
  - `Blockers` (4 records)
  - `Project_Status` (8 records)
- ✅ Extended `/src/lib/airtable/client.ts` with PM methods:
  - `getAllProjectTasks()`
  - `getAllProjectBlockers()`
  - `getAllProjectStatus()`
  - `streamAllProjectTasks()`
  - `streamAllProjectBlockers()`
  - `streamAllProjectStatus()`
  - `mapToDatabaseTask()`
  - `mapToDatabaseBlocker()`
  - `mapToDatabaseProjectStatus()`

### Sync ✅ WORKING
- ✅ Extended `/src/app/api/admin/sync/route.ts` to sync PM data
- ✅ Test sync script works: `/scripts/test-pm-sync.ts`
- ✅ Verified: 21 tasks, 4 blockers, 8 status metrics in PostgreSQL

### API ⚠️ PARTIAL
- ✅ Created `/src/app/api/clients/[id]/project/route.ts` (GET endpoint)
- ❌ Missing write endpoints:
  - `PATCH /api/project/tasks/[id]` - Update task
  - `POST /api/project/tasks/[id]/assign` - Assign user
  - `POST /api/project/tasks/[id]/notes` - Add note
  - `PATCH /api/project/blockers/[id]` - Update blocker

### Frontend ❌ WRONG IMPLEMENTATION
- ❌ `/src/app/(client)/project-management/page.tsx` - Built as cards (should be table)
- ❌ `/src/app/(client)/project-management/tasks/[id]/page.tsx` - Created but not working
- ❌ `/src/components/ProjectManagementEmbed.tsx` - Not needed (delete this)
- ⚠️ `/src/components/navbar/Navbar.tsx` - PM link added but duplicate nav showing

---

## WHAT NEEDS TO BE DONE

### Step 1: Fix Navigation (30 min)
1. **Remove duplicate nav bar** (currently showing 2 bars)
2. **Verify original Navbar shows**:
   - Rebel HQ logo
   - Dashboard, Leads, Analytics, **Project Management** (for admins), Admin
   - Right side: Cyan R circle, "Rebel Admin", Settings icon, Turquoise "Logout" button
3. **Brand update**: Change "Rebel HQ" → "Pipeline Rebel" in logo (user mentioned this)

### Step 2: Fix Data Fetching (1 hour)
1. **Debug why API endpoint not returning data**
   - Test: `GET /api/clients/6a08f898-19cd-49f8-bd77-6fcb2dd56db9/project`
   - Check authorization logic (ADMIN users might be blocked)
   - Check `session.user.clientId` is being used correctly
2. **Fix frontend to fetch data correctly**
3. **Verify 21 tasks show in table**

### Step 3: Rebuild PM Page as Table View (2 hours)
**Copy `/src/app/(client)/leads/page.tsx` as template**

Must have:
- ✅ Table with columns: Task, Priority, Status, Owner, Due Date
- ✅ Search bar (search by task name, owner, notes)
- ✅ Filter buttons (All, Critical, High, Medium, Blocked, Complete)
- ✅ Sortable headers (click to sort)
- ✅ Click row → Navigate to `/project-management/tasks/[id]`
- ✅ Stats footer (Total, Critical, Blocked, Complete)
- ✅ Blockers alert section at top (red banner if blockers exist)

### Step 4: Build Task Detail Page (2 hours)
**Copy `/src/app/(client)/leads/[id]/page.tsx` as template**

Must have:
- ✅ Header: Task name + badges (priority, status)
- ✅ Edit form with all fields:
  - Task name (text input)
  - Status (dropdown: Not Started, In Progress, Blocked, Complete)
  - Priority (dropdown: 🔴 Critical, 🟠 High, 🟡 Medium, Low)
  - Owner (text input or dropdown of users)
  - Due Date (date picker)
  - Notes (textarea)
  - Dependencies (text input)
- ✅ "Save Changes" button → Updates Airtable
- ✅ Notes/comments section (like leads)

### Step 5: Create Write API Endpoints (2 hours)
**Pattern**: Look at `/src/app/api/leads/[id]/claim/route.ts` for reference

Create these endpoints:

**1. `PATCH /api/project/tasks/[id]/route.ts`**
```typescript
// Update task fields
// Write to Airtable first
// Then update PostgreSQL
// Return updated task
```

**2. `POST /api/project/tasks/[id]/notes/route.ts`**
```typescript
// Add note/comment to task
// Write to Airtable Notes field
// Log activity
```

**3. `PATCH /api/project/blockers/[id]/route.ts`**
```typescript
// Update blocker status
// Write to Airtable
```

### Step 6: Wire Up Airtable Writes (1 hour)
**Pattern**: Look at `/src/lib/airtable/client.ts` → `updateRecord()` method

Add methods:
- `updateTask(taskId, fields)` → Updates Airtable Tasks table
- `updateBlocker(blockerId, fields)` → Updates Airtable Blockers table
- `addTaskNote(taskId, note, userName)` → Appends to Notes field

---

## DATA VERIFICATION

### Airtable (Source of Truth)
**Base ID**: `app4wIsBfpJTg7pWS` (Main UYSP base)

**Tables created:**
- `Tasks` (tbl8TcgVYjwR2X6fR) - 21 records ✅
- `Blockers` (tblIyPAGiSFmdrrdB) - 4 records ✅
- `Project_Status` (tblvV4Hj3bHS6NMji) - 8 records ✅

**Field mappings:**
```
Tasks:
- Task (text) → task
- Status (select: Not Started, In Progress, Blocked, Complete) → status
- Priority (select: 🔴 Critical, 🟠 High, 🟡 Medium, Low) → priority
- Owner (text) → owner
- Notes (long text) → notes

Blockers:
- Blocker (text) → blocker
- Severity (select: 🔴 Critical, 🟠 High, 🟡 Medium) → severity
- Status (select: Active, In Progress, Waiting on Client, Resolved) → status
- Cause (long text) → cause
- Action to Resolve (long text) → actionToResolve
- Owner (text) → owner

Project_Status:
- Metric (text) → metric
- Value (long text) → value
- Category (select: Phase, Milestone, Metric, General) → category
- Display Order (number) → displayOrder
```

### PostgreSQL (Synced Copy)
**Database**: Production Render PostgreSQL

**Sync verified**: Ran `/scripts/test-pm-sync.ts` successfully
- 21 tasks synced
- 4 blockers synced
- 8 status records synced

**Client ID**: `6a08f898-19cd-49f8-bd77-6fcb2dd56db9` (UYSP)

---

## FILES CREATED/MODIFIED

### Created (Some need deletion/replacement):
- ✅ `/src/lib/db/migrations/0002_clammy_vermin.sql` - KEEP
- ✅ `/scripts/test-pm-sync.ts` - KEEP (useful for testing)
- ✅ `/scripts/run-pm-migration.ts` - KEEP (already run)
- ❌ `/src/components/Navigation.tsx` - DELETE (duplicate)
- ❌ `/src/components/ProjectManagementEmbed.tsx` - DELETE (wrong approach)
- ⚠️ `/src/app/(client)/project-management/page.tsx` - REPLACE (wrong UI)
- ⚠️ `/src/app/(client)/project-management/tasks/[id]/page.tsx` - FIX (incomplete)
- ✅ `/src/app/api/clients/[id]/project/route.ts` - KEEP (but debug auth)
- ✅ `PM-DASHBOARD-PRD.md` - KEEP (good reference)
- ✅ `PROJECT-MANAGEMENT-BUILD-COMPLETE.md` - KEEP (deployment guide)

### Modified:
- ✅ `/src/lib/db/schema.ts` - Added PM tables (GOOD)
- ✅ `/src/lib/airtable/client.ts` - Added PM methods (GOOD)
- ✅ `/src/app/api/admin/sync/route.ts` - Extended sync (GOOD)
- ⚠️ `/src/components/navbar/Navbar.tsx` - Added PM link (but settings reverted - FIX)
- ⚠️ `/src/app/(client)/layout.tsx` - Changed to use Navbar (causing duplicate - FIX)
- ❌ `/src/app/(client)/admin/clients/[id]/page.tsx` - Added PM tab (wrong approach - REMOVE)
- ⚠️ `/src/app/(client)/dashboard/page.tsx` - Added PM card (keep or remove - user's choice)

---

## ISSUES TO FIX IMMEDIATELY

### Issue #1: Duplicate Navigation ⚠️ **EXACT FIX**
**Symptom**: Two identical navigation bars showing
**Root cause**: Navbar renders in BOTH places:
- `/src/app/layout.tsx` line 20: `<Navbar />` (ORIGINAL - already there)
- `/src/app/(client)/layout.tsx` line 34: `<Navbar />` (I ADDED THIS - causing duplicate)

**EXACT FIX**:
1. Open `/src/app/(client)/layout.tsx`
2. Remove lines 34-38 (the `<Navbar />` and wrapper div)
3. Change `return` to just: `return <>{children}</>;`
4. Save - duplicate should disappear

**Before:**
```typescript
return (
  <>
    <Navbar />
    {children}
  </>
);
```

**After:**
```typescript
return <>{children}</>;
```

### Issue #2: No Project Data Showing
**Symptom**: PM page shows "Error: Failed to fetch project data"
**Root cause**: API endpoint might be failing authorization or data fetch

**Debug steps**:
1. Check browser console for actual error
2. Check Network tab for `/api/clients/[id]/project` request status
3. Check if `session.user.clientId` exists for ADMIN users
4. Test API directly:
   ```bash
   curl http://localhost:3000/api/clients/6a08f898-19cd-49f8-bd77-6fcb2dd56db9/project
   ```

**Verify data exists**:
```bash
# Run this to confirm PostgreSQL has data:
cd "/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal"
npx tsx scripts/test-pm-sync.ts
```

### Issue #3: Settings Button - User's Specific Request
**What user said**: "I like the new way you've put settings there, but I like the original logout and turquoise R"

**What this means**:
- ✅ KEEP: Settings icon I added
- ✅ KEEP: Cyan R circle (not name initial)
- ✅ KEEP: "Rebel Admin" text (not user's actual name)
- ✅ KEEP: Logout button with cyan/turquoise border
- ❌ DON'T: Show user's actual first/last name
- ❌ DON'T: Use their name initial in circle

**Current state in `/src/components/navbar/Navbar.tsx`:**
```typescript
// Lines 67-97 - This is CORRECT:
<div className="w-10 h-10 rounded-full bg-cyan-400 flex items-center justify-center">
  <span className="text-gray-900 font-bold text-lg">R</span>
</div>
<div className="flex flex-col">
  <p className="text-sm font-medium text-white">Rebel Admin</p>
  <p className="text-xs text-gray-300">{session.user?.email}</p>
</div>
<Link href="/settings">
  <Settings className="w-5 h-5" />
</Link>
<button onClick={() => signOut()}>
  <LogOut className="w-4 h-4" />
  Logout
</button>
```

**This is actually GOOD** - keep it as is!

### Issue #4: Wrong UI (Cards vs Table)
**What I built**: Kanban card view (pretty but wrong)
**What user wants**: Table view like Leads page
**Fix**: Completely rebuild `/src/app/(client)/project-management/page.tsx` using `/src/app/(client)/leads/page.tsx` as template

---

## WHAT ACTUALLY WORKS

### Backend (Solid Foundation)
- ✅ Database schema correct
- ✅ Migration run successfully
- ✅ Airtable client methods work
- ✅ Sync works (verified with test script)
- ✅ Data is in both Airtable AND PostgreSQL

### What Doesn't Work
- ❌ Navigation (duplicate showing)
- ❌ Frontend can't fetch data
- ❌ Wrong UI (cards instead of table)
- ❌ No drill-down capability
- ❌ No edit functionality
- ❌ No write-back to Airtable

---

## VISUAL: CURRENT STATE VS DESIRED STATE

### Current (Broken):
```
[Navbar - Rebel HQ]                    ← Original
[Navbar - UYSP Portal]                 ← Duplicate (I added)
                                       
[PM Page]
  ❌ Cards view (Kanban columns)
  ❌ "No Project Data Yet" error
  ❌ Can't click anything
  ❌ Can't edit
```

### Desired (Like Leads):
```
[Navbar - Rebel HQ]                    ← Single navbar
  Dashboard | Leads | Analytics | Project Management | Admin
                                       [R] Rebel Admin [Settings] [Logout]
                                       
[PM Page]
  🔍 Search: [____________]
  [All] [Critical] [High] [Medium] [Blocked] [Complete]
  
  ┌────────────────────────────────────────────────────────────┐
  │ Task                  │ Priority │ Status    │ Owner  │ Due│
  ├────────────────────────────────────────────────────────────┤
  │ Email Ian about...    │ 🔴 Crit │ Not Start │ Latif  │ — │ ← Click to drill down
  │ Build Kajabi...       │ 🟠 High │ Blocked   │ Latif  │ — │
  │ Create Project Board  │ 🔴 Crit │ Progress  │ Latif  │ — │
  └────────────────────────────────────────────────────────────┘
  
  Click task → 
  
  [Task Detail Page]
    ✏️ Edit all fields
    💾 Save to Airtable
    💬 Add notes/comments
```

---

## CODE SAMPLES FOR NEXT AGENT

### Sample: Tasks Table (From Leads Pattern)
```typescript
// /src/app/(client)/project-management/page.tsx

interface Task {
  id: string;
  task: string;
  status: string;
  priority: string;
  owner?: string;
  dueDate?: string;
  notes?: string;
}

// Fetch tasks from API
const response = await fetch(`/api/clients/${session.user.clientId}/project`);
const data = await response.json();
const allTasks = [
  ...data.taskBoard.critical,
  ...data.taskBoard.high,
  ...data.taskBoard.medium,
  ...data.taskBoard.complete,
];

// Render table (COPY FROM LEADS PAGE)
<table>
  <thead>
    <tr>
      <th onClick={() => handleSort('task')}>Task</th>
      <th onClick={() => handleSort('priority')}>Priority</th>
      <th onClick={() => handleSort('status')}>Status</th>
      <th onClick={() => handleSort('owner')}>Owner</th>
      <th onClick={() => handleSort('dueDate')}>Due Date</th>
    </tr>
  </thead>
  <tbody>
    {processedTasks.map(task => (
      <tr onClick={() => router.push(`/project-management/tasks/${task.id}`)}>
        <td>{task.task}</td>
        <td><Badge>{task.priority}</Badge></td>
        <td><Badge>{task.status}</Badge></td>
        <td>{task.owner || '—'}</td>
        <td>{task.dueDate || '—'}</td>
      </tr>
    ))}
  </tbody>
</table>
```

### Sample: Update Task API Endpoint
```typescript
// /src/app/api/project/tasks/[id]/route.ts

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { task, status, priority, owner, dueDate, notes, dependencies } = body;

  // 1. Get client's Airtable base ID
  const client = await db.query.clients.findFirst({
    where: eq(clients.id, session.user.clientId),
  });

  // 2. Update Airtable FIRST (source of truth)
  const airtable = getAirtableClient(client.airtableBaseId);
  await airtable.updateRecord('Tasks', params.id, {
    'Task': task,
    'Status': status,
    'Priority': priority,
    'Owner': owner,
    'Notes': notes,
    'Dependencies': dependencies,
    // ... etc
  });

  // 3. Then update PostgreSQL
  await db.update(clientProjectTasks)
    .set({ task, status, priority, owner, notes, updatedAt: new Date() })
    .where(eq(clientProjectTasks.id, params.id));

  // 4. Return updated task
  return NextResponse.json({ success: true, task: updatedTask });
}
```

---

## STEP-BY-STEP FIX PLAN

### Phase 1: Fix Immediate Issues (1 hour)
1. **Remove duplicate navigation**
   - Find where Navbar is rendering twice
   - Keep only one instance
   - Verify single nav bar shows

2. **Fix settings button**
   - Add settings icon to navbar
   - Keep original logout button styling (cyan border)
   - Keep cyan R circle + "Rebel Admin" text

3. **Debug data fetching**
   - Find why API endpoint returns error
   - Check authorization logic
   - Fix frontend fetch call
   - Verify data loads

### Phase 2: Rebuild Frontend Properly (3 hours)
1. **Rebuild `/src/app/(client)/project-management/page.tsx`**
   - Copy `/src/app/(client)/leads/page.tsx` structure
   - Replace Lead interface with Task interface
   - Update columns: Task, Priority, Status, Owner, Due Date
   - Add blockers alert section at top
   - Add progress stats cards
   - Test: Search, filter, sort all work

2. **Build `/src/app/(client)/project-management/tasks/[id]/page.tsx`**
   - Copy `/src/app/(client)/leads/[id]/page.tsx` structure
   - Replace lead fields with task fields
   - Add edit form for all task fields
   - Add save button (but no API yet - Phase 3)

### Phase 3: Add Write Functionality (2 hours)
1. **Create write API endpoints**
   - `PATCH /api/project/tasks/[id]/route.ts`
   - Use Airtable client to update Airtable first
   - Then update PostgreSQL
   - Return updated task

2. **Wire up frontend**
   - Connect save button to API
   - Show success/error messages
   - Refresh data after save

3. **Add notes system** (if time permits)
   - Reuse `/src/components/notes/NotesList.tsx` pattern
   - Adapt for tasks instead of leads

---

## TESTING CHECKLIST

**Before saying "done":**
- [ ] Only ONE navigation bar shows
- [ ] PM link visible for ADMIN users (not CLIENT)
- [ ] Settings icon shows in nav
- [ ] Logout button has cyan border
- [ ] PM page shows table with 21 tasks
- [ ] Search works
- [ ] Filter works (All, Critical, High, etc.)
- [ ] Sort works (click headers)
- [ ] Click task row → Detail page opens
- [ ] Edit task fields → Saves to Airtable
- [ ] Blockers show in red alert
- [ ] Progress percentage shows correctly

---

## IMPORTANT CONTEXT

### User's Workflow
- **As SUPER_ADMIN**: Click Admin → Select UYSP Client → See PM tab within client view
- **As ADMIN**: Click Project Management in top nav → See tasks directly (their client only)

### Design System
- **Theme file**: `/src/theme.ts`
- **Colors**: Pink (#be185d), Indigo (#4f46e5), Cyan (#22d3ee)
- **Pattern**: Use `theme.components.card`, `theme.accents.primary.class`, etc.

### Airtable Write Pattern
Look at `/src/lib/airtable/client.ts`:
- `updateRecord(tableName, recordId, fields)` - Already exists
- Use this to write task updates back to Airtable

### Session Data
```typescript
session.user.role // 'SUPER_ADMIN' | 'ADMIN' | 'CLIENT'
session.user.clientId // UUID of their client
```

---

## QUICK COMMANDS

### Test Sync
```bash
cd "/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal"
npx tsx scripts/test-pm-sync.ts
```

### Check if Data Exists
Query PostgreSQL directly or use Drizzle Studio:
```bash
npm run db:studio
```

### Dev Server
Already running at: `http://localhost:3000`

---

## USER FEEDBACK (Direct Quotes)

> "OK, come on. We can do better than this someday the sinking some is not or you've just made that shit up that you've put in there as terms of milestones there's no interact activity."

> "I wanna make that really fucking crystal clear. I also wanna have a few login is an admin user project management should show on the top level navigation, you better go straight to it without having to drill down into anything else"

> "go look at the code for the way we show leads and the way that you can drill down into a lead and take actions. OK that's why I'm expecting here."

> "This is way simpler than leads."

**Translation**: User wants EXACTLY the Leads table pattern but for tasks. No fancy Kanban, no cards, just a table with drill-down.

---

## AGENT NOTES

### What Went Wrong
1. **Didn't follow TDD** - Built UI before verifying data flow
2. **Didn't use existing patterns** - Tried to create new UI instead of copying Leads
3. **Created duplicates** - Added navigation instead of modifying existing
4. **Got stuck debugging** - Ran curl instead of checking obvious issues
5. **Ignored specific feedback** - User said "like Leads table" but I built cards

### What Went Right
1. Database schema is correct
2. Airtable integration works
3. Sync functionality works
4. Data is properly migrated
5. Foundation is solid - just UI is wrong

---

## DEBUGGING CHECKLIST

Before building anything new, verify these:

### 1. Check PostgreSQL Has Data
```bash
cd "/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal"
npx tsx scripts/test-pm-sync.ts
```
**Expected output**: "Tasks: 21/21 synced", "Blockers: 4/4 synced"

### 2. Test API Endpoint
Open browser DevTools → Console tab, run:
```javascript
fetch('/api/clients/6a08f898-19cd-49f8-bd77-6fcb2dd56db9/project')
  .then(r => r.json())
  .then(console.log)
```
**Expected**: JSON with taskBoard, blockers, overview  
**If error**: Check response status code and error message

### 3. Check Session Data
In browser console:
```javascript
// Check if user has clientId
fetch('/api/auth/session').then(r => r.json()).then(console.log)
```
**Expected**: `user.clientId: "6a08f898-19cd-49f8-bd77-6fcb2dd56db9"`

### 4. Verify Airtable Table Names
The sync expects EXACTLY these names (case-sensitive):
- ✅ `Tasks` (NOT "Task" or "Project Tasks")
- ✅ `Blockers` (NOT "Blocker")
- ✅ `Project_Status` (NOT "ProjectStatus" or "Project Status")

Verified correct in base `app4wIsBfpJTg7pWS` ✅

---

## COMMON PITFALLS TO AVOID

1. **Don't create new patterns** - Copy Leads page exactly
2. **Don't skip TDD** - Write tests first (if applicable)
3. **Don't build fancy UI** - User wants simple table like Leads
4. **Don't forget Airtable** - All updates must write back
5. **Don't assume auth works** - Test API endpoints first
6. **Don't remove Settings icon** - User specifically asked to keep it
7. **Don't change logout styling** - Keep cyan border

---

## NEXT AGENT: START HERE

### Priority Order (DO IN THIS EXACT SEQUENCE):

**FIRST (5 min):**
1. Fix duplicate navbar - Edit `/src/app/(client)/layout.tsx` line 32-38
2. Refresh browser - Verify single navbar
3. Verify "Project Management" link shows for admin

**SECOND (30 min):**
1. Debug API endpoint - Test in browser console
2. Fix any auth/data issues
3. Verify API returns 21 tasks

**THIRD (2 hours):**
1. Completely REPLACE `/src/app/(client)/project-management/page.tsx`
2. Copy `/src/app/(client)/leads/page.tsx` as template
3. Change Lead → Task, update columns
4. Test search/filter/sort works

**FOURTH (2 hours):**
1. Build `/src/app/(client)/project-management/tasks/[id]/page.tsx`
2. Copy `/src/app/(client)/leads/[id]/page.tsx` as template
3. Add edit form, save button

**FIFTH (2 hours):**
1. Create `PATCH /api/project/tasks/[id]/route.ts`
2. Wire up save functionality
3. Test updates write to Airtable

**Total estimated time**: 4-6 hours

---

## FILES THAT DEFINITELY WORK (DON'T TOUCH)

These are verified working:
- ✅ `/src/lib/db/schema.ts` - PM tables added correctly
- ✅ `/src/lib/db/migrations/0002_clammy_vermin.sql` - Migration successful
- ✅ `/src/lib/airtable/client.ts` - All PM methods work
- ✅ `/src/app/api/admin/sync/route.ts` - Sync works perfectly
- ✅ `/scripts/test-pm-sync.ts` - Verified sync works

**DO NOT MODIFY THESE** - They are the solid foundation.

---

## FILES THAT NEED FIXING

### Must Delete:
- `/src/components/ProjectManagementEmbed.tsx` - Wrong approach, not needed
- `/src/components/Navigation.tsx` - Duplicate (if exists)

### Must Fix:
- `/src/app/(client)/layout.tsx` - Remove navbar duplicate (lines 32-38)
- `/src/app/(client)/project-management/page.tsx` - REPLACE entirely with table view
- `/src/app/(client)/project-management/tasks/[id]/page.tsx` - Complete the build
- `/src/app/(client)/admin/clients/[id]/page.tsx` - Remove PM tab (lines 467-490, 1146-1163)

### Optional Cleanup:
- `/src/app/(client)/dashboard/page.tsx` - PM card added (keep or remove - user's choice)

---

## FILES TO REVIEW

**Must read**:
- `/src/app/(client)/leads/page.tsx` - THE TEMPLATE
- `/src/app/(client)/leads/[id]/page.tsx` - THE TEMPLATE
- `/src/lib/airtable/client.ts` - Airtable integration patterns
- `/src/components/navbar/Navbar.tsx` - Current nav (has duplicate issue)

**Can delete**:
- `/src/components/ProjectManagementEmbed.tsx`
- `/src/components/Navigation.tsx` (if it exists)

**Must fix**:
- `/src/app/(client)/project-management/page.tsx` - Wrong UI
- `/src/app/(client)/project-management/tasks/[id]/page.tsx` - Incomplete
- `/src/components/navbar/Navbar.tsx` - Duplicate issue

---

## CREDENTIALS & ACCESS

**Airtable**:
- API Key: `<AIRTABLE_API_KEY>` (stored in environment variables)
- Main Base: `app4wIsBfpJTg7pWS`
- Source Base (PM data): `app1gPTBDG0DubPJc` (data already copied, can ignore)

**Database**:
- DATABASE_URL in `.env.local`
- Client ID: `6a08f898-19cd-49f8-bd77-6fcb2dd56db9` (UYSP)

**Test User**:
- SUPER_ADMIN: `rebel@rebelhq.ai` / `RElH0rst89!`

---

## FINAL NOTES

**The foundation is actually solid** - database works, sync works, data exists. The issue is:
1. Navigation is duplicated
2. API fetch is failing (probably simple auth issue)
3. UI is wrong (cards instead of table)

**This is recoverable in 4-6 hours** by following the Leads pattern exactly.

**User is frustrated** (rightfully so) - fix the navigation and data fetch first to show progress, then rebuild UI properly.

---

**Good luck! The hardest part (DB + Airtable + sync) is actually done. Just needs proper UI.**

---

## LIKELY ERROR MESSAGES YOU'LL SEE

### Error 1: "Failed to fetch project data"
**Cause**: API endpoint authorization failing OR data not in PostgreSQL  
**Fix**: 
1. Check browser Network tab - what's the actual error?
2. Is it 401 (auth)? Check session.user.clientId exists
3. Is it 404? Check data exists in PostgreSQL
4. Is it 500? Check server logs for actual error

### Error 2: Navbar duplicate
**Cause**: Rendering in both root layout AND client layout  
**Fix**: Remove from `/src/app/(client)/layout.tsx` (I added it there)

### Error 3: "Table Tasks not found" in sync
**Cause**: Airtable table names don't match
**Fix**: Already fixed - tables are named correctly

---

## FINAL VERIFICATION BEFORE HANDOFF

✅ **Database**:
- Tables exist in PostgreSQL ✓
- Migration file exists ✓
- Schema updated ✓

✅ **Airtable**:
- 3 tables created in base `app4wIsBfpJTg7pWS` ✓
- 21 tasks present ✓
- 4 blockers present ✓
- 8 status metrics present ✓

✅ **Sync**:
- Sync code added to `/src/app/api/admin/sync/route.ts` ✓
- Test script confirms sync works ✓
- Data in PostgreSQL ✓

❌ **Frontend**:
- Navigation: Duplicate (needs 1 line fix)
- PM Page: Wrong UI (needs rebuild)
- Detail Page: Incomplete (needs completion)
- API: Not fetching (needs debug)

---

## CONVERSATION CONTEXT

**User's main frustration points:**
1. I didn't follow TDD (built UI before testing)
2. I didn't copy the Leads pattern (built cards instead)
3. I created duplicates (navigation bar)
4. I ignored specific UI feedback (settings button)
5. I got stuck on basic debugging (curl command)

**User's clear direction:**
> "go look at the code for the way we show leads and the way that you can drill down into a lead and take actions. OK that's why I'm expecting here."

**Translation**: EXACTLY copy the Leads implementation. No creativity, no new patterns, just copy-paste and adapt for tasks.

---

## HANDOVER CHECKLIST FOR NEXT AGENT

Before starting:
- [ ] Read this entire document
- [ ] Review `/src/app/(client)/leads/page.tsx` (the template)
- [ ] Review `/src/app/(client)/leads/[id]/page.tsx` (the template)
- [ ] Verify local dev server is running (already is)
- [ ] Verify you can log in as SUPER_ADMIN

First 30 minutes:
- [ ] Fix duplicate navbar (simple edit)
- [ ] Debug API endpoint (browser console test)
- [ ] Show user you've fixed the obvious issues

Next 4-6 hours:
- [ ] Rebuild PM table view (copy Leads)
- [ ] Build task detail page (copy Leads)
- [ ] Add write API endpoints
- [ ] Test full workflow (search → click → edit → save → verify in Airtable)

---

**This is VERY recoverable. The backend is solid. Just needs proper frontend following existing patterns.**

---

## AIRTABLE TABLE IDS (For MCP Operations)

**Base**: `app4wIsBfpJTg7pWS` (Main UYSP base)

**Table IDs** (use these for MCP operations):
- **Tasks**: `tbl8TcgVYjwR2X6fR` (21 records)
- **Blockers**: `tblIyPAGiSFmdrrdB` (4 records)  
- **Project_Status**: `tblvV4Hj3bHS6NMji` (8 records)

**Sample tasks in Airtable** (for testing):
- `recLDzYltrOxj1OxP`: Email Ian about Kajabi API upgrade (Critical)
- `recf3pB49RTc87AO2`: Create Project Management Board (Critical, In Progress)
- `recgUJtI85gZL9v88`: Build Kajabi Integration Workflow (High, Blocked)

**To verify Airtable data**, use MCP:
```typescript
mcp_airtable_list_records({
  baseId: 'app4wIsBfpJTg7pWS',
  tableId: 'tbl8TcgVYjwR2X6fR',
  maxRecords: 5
})
```

---

## WHAT TO TELL THE USER WHEN DONE

**When you've fixed everything, show user:**

✅ **Navigation Fixed**
- Single navbar showing
- Project Management link visible for admins
- Settings icon present
- Logout button with cyan border

✅ **PM Dashboard Working**
- Table view with 21 tasks
- Search/filter/sort working
- Click task → Detail page opens
- Blockers showing in red alert
- Progress percentage accurate

✅ **Full CRUD Working**
- Edit task fields
- Save updates to Airtable
- Changes persist after refresh
- Notes/comments working

**Test with user**:
1. Login as SUPER_ADMIN
2. Click "Project Management" in top nav
3. See table with 21 tasks
4. Search for "Kajabi"
5. Filter by "Critical"
6. Click a task
7. Edit status → Save
8. Verify change in Airtable

---

## EMERGENCY ROLLBACK

If something breaks catastrophically:

1. **Revert frontend changes**:
   ```bash
   git checkout HEAD -- src/app/(client)/project-management/
   git checkout HEAD -- src/components/navbar/Navbar.tsx
   git checkout HEAD -- src/app/(client)/layout.tsx
   ```

2. **Keep backend changes** (they're good):
   - Database schema
   - Migration
   - Airtable client
   - Sync endpoint

3. **Start fresh** following Leads pattern

---

**Handover complete. All information provided. Next agent has everything needed to finish this in 4-6 hours.**

