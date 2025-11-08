# Mini-CRM: UI Implementation Guide

**Agent:** Claude Code (in Cursor IDE)  
**Timeline:** Week 3-4 - 12 hours  
**Can Start:** Immediately (parallel with n8n instrumentation)  
**PRD Reference:** Section 7

---

## 🎯 Mission

Build "Airtable-like" admin interface for browsing activity logs and lead timeline component for lead detail page.

**Goal:** Fast, scannable, information-dense UI for troubleshooting and lead history.

---

## 📋 What You're Building

### Component 1: Admin Activity Browser
**Page:** `/admin/activity-logs`  
**File:** `src/app/(dashboard)/admin/activity-logs/page.tsx`  
**Time:** 6 hours

### Component 2: Lead Timeline  
**Location:** Lead detail page - "Activity" tab  
**File:** `src/app/(dashboard)/leads/[id]/activity-tab.tsx`  
**Time:** 4 hours

### Component 3: Navigation Integration
**Files:** Admin sidebar, lead detail tabs  
**Time:** 2 hours

---

## 🔌 API Endpoints (ALREADY BUILT)

**These APIs are ready to use:**

### GET /api/admin/activity-logs
**Purpose:** Power admin browser  
**Query params:**
- `page`, `limit` (pagination)
- `search` (full-text across description + messages)
- `eventType`, `eventCategory` (filters)
- `leadId`, `dateFrom`, `dateTo` (filters)

**Response:**
```typescript
{
  activities: Array<{
    id: string;
    timestamp: Date;
    eventType: string;
    category: string;
    description: string;
    messageContent: string | null;
    metadata: object | null;
    source: string;
    executionId: string | null;
    lead: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    } | null;
    leadAirtableId: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
}
```

### GET /api/leads/[id]/activity
**Purpose:** Power lead timeline  
**Query params:**
- `page`, `limit` (pagination)

**Response:**
```typescript
{
  timeline: Array<{
    id: string;
    timestamp: Date;
    eventType: string;
    category: string;
    description: string;
    message: string | null;
    details: object | null;
    source: string;
    executionId: string | null;
  }>;
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
}
```

---

## 🎨 Design Requirements

**Reference Experience:** Airtable grid view + Notion database

**Must have:**
- ⚡ Scan 50 records in <1 second
- 🔍 Instant filtering (filter chips with counts)
- 📊 Sortable columns (click headers)
- 🔄 Auto-refresh every 30s (toggleable)
- 📥 Export to CSV
- 🎯 Information-dense (3-line rows)

**Performance targets:**
- Initial load: <500ms
- Search query: <200ms
- Filter change: <100ms
- Export 10K rows: <3s

---

## 📐 Component Structure

### Admin Activity Browser

```tsx
// src/app/(dashboard)/admin/activity-logs/page.tsx

<PageContainer>
  <Header>
    <Title>Activity Logs</Title>
    <Actions>
      <AutoRefreshToggle />
      <ExportCSVButton />
    </Actions>
  </Header>
  
  <SearchFilterBar>
    <SearchInput placeholder="Search across all events..." />
    <FilterChips>
      <Chip label="SMS" count={1234} />
      <Chip label="Bookings" count={89} />
      <Chip label="Campaigns" count={456} />
      <Chip label="Last 24h" count={2847} />
    </FilterChips>
    <AdvancedFilters>
      <EventTypeSelect />
      <DateRangePicker />
      <LeadSelect />
    </AdvancedFilters>
  </SearchFilterBar>
  
  <ActivityTable
    columns={['icon', 'when', 'lead', 'event', 'details']}
    virtualScroll={true}
    onRowClick={openModal}
  />
  
  <Pagination {...pagination} />
</PageContainer>
```

### Lead Timeline Component

```tsx
// src/app/(dashboard)/leads/[id]/activity-tab.tsx

<TimelineContainer>
  {groupedByDate.map(group => (
    <TimelineGroup key={group.date}>
      <DateDivider date={group.date} />
      {group.activities.map(activity => (
        <TimelineEvent
          icon={getEventIcon(activity.eventType)}
          color={getCategoryColor(activity.category)}
          timestamp={activity.timestamp}
        >
          <EventContent>
            <Description>{activity.description}</Description>
            {activity.message && <MessagePreview>{activity.message}</MessagePreview>}
            <MetadataPills metadata={activity.details} />
            <SourceTag source={activity.source} />
          </EventContent>
        </TimelineEvent>
      ))}
    </TimelineGroup>
  ))}
  <LoadMoreButton />
</TimelineContainer>
```

---

## 📦 Dependencies

**Use existing packages:**
- `@tanstack/react-query` (API calls, caching)
- `date-fns` (timestamp formatting)
- Existing UI component library
- Existing table/modal components

**No new dependencies needed.**

---

## 🗂️ File Organization

**Create these files:**
```
src/app/(dashboard)/admin/activity-logs/
├── page.tsx              (main page)
├── ActivityTable.tsx     (table component)
├── SearchFilterBar.tsx   (search/filters)
├── ActivityModal.tsx     (detail modal)
└── hooks/
    └── useActivityLogs.ts (React Query hook)

src/app/(dashboard)/leads/[id]/
├── activity-tab.tsx      (timeline tab)
└── components/
    ├── LeadTimeline.tsx
    ├── TimelineEvent.tsx
    └── EventIcon.tsx

src/lib/activity/
├── event-types.ts        (already exists)
└── ui-helpers.ts         (NEW - icon/color mappings)
```

---

## ✅ Success Criteria

**Admin browser ready when:**
- [ ] Page loads in <500ms
- [ ] Search works across all fields
- [ ] Filters work (event type, category, date)
- [ ] Pagination works
- [ ] Click row opens detail modal
- [ ] Export CSV works
- [ ] Auto-refresh works without flicker

**Lead timeline ready when:**
- [ ] Shows all events for lead
- [ ] Grouped by date (Today, Yesterday, etc.)
- [ ] Events styled by category (colors/icons)
- [ ] Conversation threading works (MESSAGE_SENT → INBOUND_REPLY)
- [ ] Load more pagination works
- [ ] Performance <500ms

---

## 🧪 Testing Requirements

**Create test files:**
```
__tests__/components/admin/activity-browser.test.tsx
__tests__/components/leads/timeline.test.tsx
```

**Test coverage:**
- Component renders without errors
- Search input filters results
- Filter chips work
- Pagination controls work
- Modal opens on row click
- Export generates CSV
- Auto-refresh polls API

---

## 🔗 Integration Points

**You'll consume these APIs (built by other agent):**
- POST /api/internal/log-activity (you don't call this—n8n does)
- GET /api/admin/activity-logs (you call this for admin browser)
- GET /api/leads/[id]/activity (you call this for timeline)
- GET /api/internal/activity-health (optional—for status badge)

**Data will be populated by:** Cursor agent instrumenting n8n workflows (parallel work)

**Test with:** Seed data script already exists (`scripts/seed-activity-log-test-data.ts`)

---

## 🎯 Implementation Order

### Day 1: Admin Browser Shell (2 hours)
- Create page route
- Add to admin navigation
- Basic table with mock data
- Verify routing works

### Day 2: Search & Filters (2 hours)
- Wire up API endpoint
- Add search input
- Add filter chips
- Test filtering works

### Day 3: Table Features (2 hours)
- Add sorting
- Add pagination
- Add detail modal
- Add export CSV

### Day 4: Lead Timeline (2 hours)
- Create timeline component
- Add to lead detail page
- Wire up API endpoint
- Test with real/seed data

### Day 5: Polish & Testing (2 hours)
- Auto-refresh
- Loading states
- Error states
- Empty states
- Mobile responsive
- Write component tests

---

## 📊 Design Reference

**Full UI specification:** PRD Section 7 (comprehensive wireframes and component specs)

**Key design elements:**
- Event icons: 💬 SMS, 📅 Booking, 📊 Campaign, 🔄 Status
- Color coding by category: Blue (SMS), Green (Booking), Purple (Campaign)
- 3-line rows: Timestamp + Lead + Event type + Details preview
- Expandable rows for full metadata

---

## 🚀 START NOW

**You can start immediately** because:
- ✅ APIs already exist and tested
- ✅ Database schema defined
- ✅ Test data seeder available
- ✅ Event types/icons/colors defined

**Parallel work:** While you build UI, Cursor agent instruments n8n workflows (no conflicts)

**Handoff:** When both done, integration testing verifies n8n events appear in your UI

---

**Questions?** Reference PRD Section 7 for complete UI specifications.

