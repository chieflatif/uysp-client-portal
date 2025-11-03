# Project Management Dashboard - PRD

**Goal**: Build a full interactive PM system like the Leads table with drill-down capability and two-way Airtable sync.

---

## User Stories

### As an ADMIN user:
- ✅ I see "Project Management" in top navigation (same level as Dashboard, Leads, Analytics)
- ✅ I click it → I see MY client's tasks in a table view
- ✅ I can search, filter, and sort tasks
- ✅ I click a task row → Opens task detail page
- ✅ I can edit task fields (status, priority, owner, notes)
- ✅ I can assign tasks to team members
- ✅ I can add comments/notes
- ✅ All changes write back to Airtable
- ✅ I see blockers prominently
- ✅ I see project progress metrics

### As a SUPER_ADMIN:
- ✅ I see "Project Management" in top navigation
- ✅ I see a client selector dropdown
- ✅ I select a client → See their PM data
- ✅ All other functionality same as ADMIN

---

## Pages & Routes

### 1. `/project-management` - Main PM Page
**Layout**: Table view (like `/leads`)

**Components:**
- Search bar (search tasks by name, owner, notes)
- Filter buttons (All, Critical, High, Medium, Blocked, Complete)
- Sort headers (Task, Priority, Status, Owner, Due Date)
- Task table with all columns visible
- Pagination (if >50 tasks)
- Stats cards at top (Active Tasks, Blockers, Progress %)
- Click any row → Navigate to `/project-management/tasks/[id]`

### 2. `/project-management/tasks/[id]` - Task Detail Page
**Layout**: Detail view (like `/leads/[id]`)

**Sections:**
- **Header**: Task name + status badge + priority badge
- **Actions**: Edit Task, Assign to User, Mark Complete, Delete
- **Details Card**: All task fields (editable)
- **Notes/Comments**: Activity log like leads
- **Back button**: Return to task list

### 3. `/project-management/blockers` - Blockers Page (Optional)
**Layout**: List of active blockers with actions

---

## Data Flow

```
Airtable (Tasks, Blockers, Project_Status)
  ↕ Two-way sync
PostgreSQL (client_project_tasks, blockers, status)
  ↕ API endpoints
Frontend (React tables + detail pages)
```

**Key principle**: Airtable = source of truth. All updates write back.

---

## API Endpoints Needed

### Read
- ✅ `GET /api/clients/[id]/project` - Fetch all PM data (DONE)

### Write (NEW)
- `PATCH /api/project/tasks/[id]` - Update task fields → Airtable
- `POST /api/project/tasks/[id]/assign` - Assign task to user → Airtable
- `POST /api/project/tasks/[id]/notes` - Add note/comment → Airtable
- `PATCH /api/project/blockers/[id]` - Update blocker → Airtable
- `POST /api/project/blockers/[id]/resolve` - Mark blocker resolved → Airtable

---

## UI Components

### TasksTable Component
```tsx
- Search input
- Filter tabs
- Sortable table headers
- Task rows (clickable)
- Pagination
- Stats summary
```

### TaskDetailPage
```tsx
- Task header (name, priority, status)
- Edit form (all fields)
- Assign dropdown (list of users)
- Notes section
- Activity log
```

### BlockersAlert Component
```tsx
- Red alert banner if blockers exist
- Click to view blocker details
- Mark as resolved action
```

---

## Navigation Changes

### For ADMIN users:
```
Top Nav:
- Dashboard
- Leads
- Analytics
- Project Management ← NEW (top level)
- Settings
```

### For SUPER_ADMIN:
```
Top Nav:
- Dashboard
- Admin (client management)
- Project Management ← NEW (with client selector)
- Settings
```

---

## Implementation Plan (TDD)

### Phase 1: Navigation & List View (2 hours)
1. ✅ Add PM to top navigation (admin only)
2. ✅ Create `/project-management/page.tsx` (table view)
3. ✅ Search, filter, sort functionality
4. ✅ Click row → Navigate to detail

### Phase 2: Task Detail & Edit (2 hours)
1. ✅ Create `/project-management/tasks/[id]/page.tsx`
2. ✅ Fetch task data from API
3. ✅ Edit form with all fields
4. ✅ Create `PATCH /api/project/tasks/[id]` endpoint
5. ✅ Write changes back to Airtable

### Phase 3: Assignment & Notes (1 hour)
1. ✅ User assignment dropdown
2. ✅ Notes/comments section
3. ✅ Activity tracking

### Phase 4: Blockers (1 hour)
1. ✅ Blockers alert section
2. ✅ Blocker detail modal
3. ✅ Resolve blocker action

---

## Acceptance Criteria

**Must have:**
- ✅ PM link in top nav for ADMIN users
- ✅ Table view of all tasks (searchable, filterable, sortable)
- ✅ Click task → Detail page with full edit capability
- ✅ Assign tasks to users
- ✅ Update status, priority, owner, notes
- ✅ All changes write to Airtable
- ✅ Blockers prominently displayed
- ✅ Progress metrics visible

**Nice to have (Phase 2):**
- Drag-and-drop Kanban view toggle
- Real-time updates (websockets)
- Email notifications
- Task dependencies visualization

---

**Let's build this properly!**

