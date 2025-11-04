# PRD: Custom Tag-Based SMS Campaigns

**Version**: 1.0  
**Date**: 2025-11-03  
**Status**: 📝 DRAFT - For Agent Implementation  
**Type**: Product Requirements (Business & User Focused)

---

## 🚨 WORKSPACE STRUCTURE - READ FIRST

### Repository & Location

**Git Repository**: `chieflatif/uysp-client-portal`

**Workspace Root**: `/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/`

**Client Portal Location**: `uysp-client-portal/` (subfolder within workspace)

### File Organization Rules

**ALL development files must go in the portal subfolder**:
```
/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/
  └─ uysp-client-portal/              ← WORK HERE
      ├─ src/
      │   ├─ app/
      │   │   ├─ (client)/admin/campaigns/  ← New campaign management page
      │   │   └─ api/admin/campaigns/       ← New API routes
      │   ├─ components/admin/              ← New campaign components
      │   └─ lib/
      ├─ docs/
      │   └─ features/
      │       └─ custom-campaigns/          ← All PRD/tech docs go here
      └─ tests/
```

**Documentation Location**:
- **This PRD**: Move to `uysp-client-portal/docs/features/custom-campaigns/PRD.md`
- **Technical specs**: `uysp-client-portal/docs/features/custom-campaigns/TECHNICAL-SPEC.md`
- **Implementation notes**: `uysp-client-portal/docs/features/custom-campaigns/IMPLEMENTATION-LOG.md`

**DO NOT**:
- ❌ Create files in workspace root (except this PRD for handoff)
- ❌ Mix portal code with n8n workflow files
- ❌ Put docs in `/docs` (workspace root) - use portal's `/docs`

### Repository Context

**Portal Repo**: https://github.com/chieflatif/uysp-client-portal  
**Technology**: Next.js 14, TypeScript, Drizzle ORM, PostgreSQL, Airtable  
**Integration**: n8n workflows (separate repo/system) read from Airtable  

**Source of Truth**: Airtable  
**Read Cache**: PostgreSQL (synced every 5 min)  
**Write Pattern**: PostgreSQL → Sync Queue → Airtable

---

## PROBLEM STATEMENT

**Current State**:
- Leads are assigned to campaigns automatically based on which Kajabi form they submit
- The `Campaign (CORRECTED)` field tracks their entry campaign
- No way to create custom nurture sequences for specific lead segments

**User Need**:
As an admin, I want to select a group of existing leads (by their Kajabi tags) and enroll them in a custom SMS nurture sequence, so I can re-engage specific segments with targeted messaging.

**Business Value**:
- Re-engage cold leads with targeted content
- Test different messaging for specific audience segments
- Launch targeted promotions without requiring new Kajabi forms
- Leverage enrichment data (tags, engagement history) for better targeting

---

## USER STORIES

### Story 1: Create Custom Campaign
**As an** admin  
**I want to** select leads by Kajabi tags and create a multi-message SMS sequence  
**So that** I can re-engage specific segments with targeted messaging

**Acceptance Criteria**:
- [ ] I can select multiple Kajabi tags (multi-select)
- [ ] System shows me how many leads match my tag selection
- [ ] I can preview the matching leads before creating campaign
- [ ] I can give the campaign a name
- [ ] I can set a start date/time for the campaign
- [ ] I can create up to 3 messages with custom timing (delay in days)
- [ ] I can use placeholders in messages ({{first_name}}, {{company}}, etc.)
- [ ] I can activate the campaign immediately or save as draft

### Story 2: Message Creation (Hybrid Approach)
**As an** admin creating campaign messages  
**I want to** easily add personalization placeholders OR use AI to generate messages  
**So that** I don't have to manually type placeholder syntax and can create professional messages quickly

**Acceptance Criteria**:
- [ ] **Manual Mode**: I can click buttons to insert placeholders ({{first_name}}, {{company}}, {{resource_link}})
- [ ] Placeholders insert at my cursor position in the text area
- [ ] Character count shows SMS length (160 chars = 1 SMS)
- [ ] **AI Mode**: I can describe what I want the message to say
- [ ] AI generates message with appropriate placeholders already inserted
- [ ] I can edit AI-generated messages before saving
- [ ] AI suggests which placeholders to use based on available data

### Story 3: Campaign Management
**As an** admin  
**I want to** view, edit, and manage my custom campaigns  
**So that** I can track performance and make adjustments

**Acceptance Criteria**:
- [ ] I can see a list of all custom campaigns I've created
- [ ] I can filter by status (Active/Inactive/Draft/Paused)
- [ ] I can see how many leads are in each campaign
- [ ] I can see how many messages have been sent
- [ ] I can activate/deactivate/pause campaigns
- [ ] I can edit campaign messages (if no messages sent yet)
- [ ] I can duplicate a campaign to create variations

### Story 4: Campaign Analytics & Performance
**As an** admin  
**I want to** see performance metrics for my custom campaigns  
**So that** I can measure ROI and optimize messaging

**Acceptance Criteria**:
- [ ] I can see per-campaign stats: Messages sent, Responses received, Links clicked, Booked calls
- [ ] Custom campaigns appear in existing analytics dashboard
- [ ] I can compare performance across campaigns
- [ ] I can export campaign results (CSV)
- [ ] I can see which leads responded vs didn't respond

---

## KEY FEATURES

### 1. Lead Selection & Conflict Management

**Tag-based filtering**:
- Multi-select from available Kajabi tags
- Live preview: Shows count and list of matching leads

**Auto-Exclusions** (always excluded):
- SMS Stop = true
- Booked = true
- Current Coaching Client = true
- Phone Invalid

**Campaign Conflict Handling** ✅ RECOMMENDED APPROACH:

**Rule**: One active campaign per lead at a time

**When user selects leads**:
1. System checks: Is lead in another active campaign?
2. **If YES → Show warning**:
   ```
   ⚠️ 23 of 127 selected leads are in active campaigns:
   - 15 leads in "Q4 Webinar Nurture" (ending Nov 10)
   - 8 leads in "Fundamentals Follow-up" (ending Nov 8)
   
   Options:
   ○ Skip these leads (enroll 104 leads only)
   ○ Override and move to this campaign (pause old campaigns)
   ○ Wait and schedule for Nov 11 (after campaigns end)
   ```
3. **User chooses**: Skip, override, or delay
4. **If override**: Old campaign paused, `SMS Campaign ID` updated to new campaign

**Benefits**:
- Prevents over-messaging (compliance)
- Clear user control
- Audit trail (activity log records campaign switches)

### 2. Campaign Configuration
- **Campaign Name**: Required, unique per client
- **Start Date/Time**: When to begin sending (future date)
- **Number of Messages**: 1-3 messages
- **Message Delays**: 
  - Message 1: Immediate (on start date)
  - Message 2: N days after Message 1
  - Message 3: N days after Message 2

### 3. Message Builder (Hybrid) ⭐ CORE FEATURE

**Built AI-First, Manual Always Available**

**UI Layout**:
```
┌─ Message 1 ─────────────────────────────────────────────┐
│ [ 🤖 Generate with AI ] [ 📝 Write Manually ]          │
│                                                          │
│ AI Mode:                                                 │
│ ┌──────────────────────────────────────────────────────┐│
│ │ Campaign goal: [Follow up on Q4 webinar]            ││
│ │ Attach resource: [Q4 Planning Guide.pdf ▼]          ││
│ │ Tone: [ Professional ▼ ]  [Generate →]              ││
│ └──────────────────────────────────────────────────────┘│
│                                                          │
│ Generated Message (editable):                            │
│ ┌──────────────────────────────────────────────────────┐│
│ │ Hey {{first_name}}, thanks for joining our Q4       ││
│ │ planning webinar! Here's the guide we promised:     ││
│ │ {{resource_link}}                                   ││
│ │                                                      ││
│ │ Questions? Just reply to this text. -Latif          ││
│ └──────────────────────────────────────────────────────┘│
│ [👤] [🏢] [📎] ← Insert placeholders manually           │
│ [♻️ Regenerate] [✓ Accept]                             │
│                                                          │
│ 158/160 chars (1 SMS)                                    │
└──────────────────────────────────────────────────────────┘
```

**Manual Creation**:
- Text area with insert buttons (always available)
- Click [👤 First Name] → inserts `{{first_name}}` at cursor
- Available placeholders:
  - `{{first_name}}` - Personalize greeting
  - `{{last_name}}` - Full name if needed
  - `{{company}}` - Company name (if available)
  - `{{resource_link}}` - Link to resource (if attached)
  - `{{resource_name}}` - Resource name
- Character counter (SMS length tracking)
- Live preview with sample lead data

**AI-Assisted Creation** ✅ BUILT FROM DAY 1:
- User provides:
  - Campaign goal/description (1-2 sentences)
  - Resources to attach (optional)
  - Tone preference (Professional, Casual, Urgent)
- AI generates message with:
  - Appropriate placeholders automatically inserted
  - Proper SMS length (under 160 chars per message)
  - Clear call-to-action
  - Compliance-friendly language
- User can:
  - Edit generated message inline
  - Regenerate with different tone/goal
  - Switch to manual mode anytime
  - Mix AI + manual across messages (e.g., AI for Msg 1, manual for Msg 2)

**Resource Attachment**:
- Upload file (PDF, image) → System hosts + generates short link
- OR paste URL → System validates + shortens
- Placeholder `{{resource_link}}` auto-inserted by AI or via button

### 4. Campaign Activation
- **Draft mode**: Save without activating
- **Active mode**: Scheduler picks up leads and sends messages
- **Validation**: Cannot activate if:
  - Messages are empty
  - No leads match tag selection
  - Start date is in the past

---

## DATA ARCHITECTURE QUESTIONS (For Implementation Agent)

### Question 1: Campaign Storage
**Current**: Campaigns table exists for form-based campaigns (Webinar/Standard)

**Options**:
- **A**: Extend Campaigns table with `campaignType = "Custom"`
- **B**: Create separate CustomCampaigns table
- **C**: Use Campaigns table + add fields for tag filtering

**Recommendation Needed**: Research existing architecture and decide

---

### Question 2: Message Storage
**Current**: SMS_Templates table exists with Step and Template Type fields

**Options**:
- **A**: Add Campaign reference to SMS_Templates
- **B**: Store messages directly in Campaigns table (JSON field)
- **C**: Create new CampaignMessages table

**Recommendation Needed**: Research existing patterns and decide

---

### Question 3: Lead Assignment
**Current**: `SMS Campaign ID` field exists in Leads table

**Question**: 
- How do we assign selected leads to the custom campaign?
- Update `SMS Campaign ID` field when campaign is activated?
- Batch update via Airtable sync queue?

**Recommendation Needed**: Research sync patterns and propose approach

---

### Question 4: Scheduler Integration
**Current**: Existing SMS scheduler uses:
- `SMS Sequence Position` (0, 1, 2, 3...)
- `SMS Last Sent At` (timing logic)
- `SMS Campaign ID` (filters which leads)

**Question**:
- Can existing scheduler handle custom campaigns without modification?
- Or does it need updates to support tag-based campaigns?

**Recommendation Needed**: Review scheduler logic and confirm

---

## PLACEHOLDER SYSTEM

### Available Placeholders
| Placeholder | Source Field | Always Available? |
|------------|--------------|-------------------|
| `{{first_name}}` | First Name | ✅ Yes (required) |
| `{{last_name}}` | Last Name | ✅ Yes |
| `{{company}}` | Company | ⚠️ No (enrichment) |
| `{{resource_link}}` | Campaign.resourceLink | ⚠️ No (if attached) |
| `{{resource_name}}` | Campaign.resourceName | ⚠️ No (if attached) |

### Future Placeholders (Not Week 4)
- `{{job_title}}` - Title field
- `{{coaching_tier}}` - If former client
- `{{icp_score}}` - For segmentation
- Custom fields from enrichment

---

## USER FLOW

### Create Campaign Flow
1. Navigate to `/admin/campaigns`
2. Click "Create Custom Campaign"
3. **Step 1: Select Leads**
   - Choose Kajabi tags (multi-select)
   - See preview: "127 leads match your selection"
   - Click "Next"
4. **Step 2: Campaign Settings**
   - Enter campaign name
   - Select start date/time
   - Choose number of messages (1-3)
   - Click "Next"
5. **Step 3: Create Messages**
   - For each message:
     - **Option A**: Type manually + click placeholder buttons
     - **Option B**: Describe to AI → Review/edit → Accept
   - Set delay days for messages 2 & 3
   - Click "Next"
6. **Step 4: Review & Activate**
   - See summary: tags, lead count, messages, timing
   - Choose: Save as Draft OR Activate Now
   - Click "Create Campaign"
7. **Result**:
   - Campaign created in PostgreSQL
   - Queued to sync to Airtable
   - If activated: Leads assigned to campaign (SMS Campaign ID updated)
   - Scheduler picks up leads on next run

---

## NON-FUNCTIONAL REQUIREMENTS

### Performance
- Lead preview should load in <2 seconds
- Tag selection should be searchable (100+ tags)
- Campaign creation should complete in <5 seconds
- Airtable sync should complete within 5 minutes

### Usability
- Mobile-responsive (campaign creation on desktop only)
- Keyboard shortcuts for placeholder insertion (e.g., Ctrl+1 = first_name)
- Auto-save draft every 30 seconds
- Clear visual feedback (loading states, success/error messages)

### Security
- CLIENT_ADMIN: Can only create campaigns for their own client
- SUPER_ADMIN: Can create campaigns for any client
- Cannot activate campaign without valid phone numbers
- Cannot send to leads with SMS Stop = true

### Reliability
- Validate all placeholders before activation
- Prevent duplicate campaign names (within client)
- Retry failed Airtable syncs automatically
- Rollback if campaign creation fails mid-process

---

## SUCCESS METRICS

**User Success**:
- Admin can create a 3-message campaign in <10 minutes
- 90%+ of placeholders render correctly in sent messages
- Zero duplicate campaigns created accidentally
- AI generates acceptable messages 80%+ of the time (minimal editing needed)

**Business Success**:
- Re-engagement campaigns achieve 15%+ response rate
- 50%+ of campaigns use AI message generation
- Campaign creation time reduced by 70% vs manual Airtable entry
- Campaign analytics integrated seamlessly (visible in dashboard within 5 min)

**System Success**:
- Zero over-messaging (conflict management prevents duplicate sends)
- 100% SMS compliance (auto-append opt-out, AI vetted prompts)
- Campaign sync to Airtable within 5 minutes (99% success rate)

---

## IN SCOPE (Week 4 - Must Have)

✅ **Core Features**:
- Tag-based lead selection with live preview
- Campaign conflict detection & resolution (skip/override/delay options)
- Hybrid message builder (AI generation + manual editing)
- Resource attachment (upload or URL)
- 3 fixed messages with configurable delays
- Campaign activation/pause/deactivate
- Integration with existing analytics dashboard
- Airtable sync via queue

✅ **AI Features** (Built Day 1):
- AI message generation based on campaign goal
- Placeholder auto-insertion by AI
- User can edit AI output inline
- Regenerate option per message

---

## OUT OF SCOPE (Future Enhancements)

- ❌ A/B testing different message variations
- ❌ Advanced scheduling (specific times per message - just dates)
- ❌ Conditional logic (if/then branching based on responses)
- ❌ Campaign templates/presets (can add in v1.1)
- ❌ Message performance prediction (AI suggests best send times)
- ❌ Multi-message bulk editing
- ❌ Advanced placeholder logic (e.g., if/else in templates)

---

## TECHNICAL RESEARCH NEEDED (For Implementation Agent)

Before starting implementation, research and document:

1. **Existing Campaign Architecture**:
   - How are webinar campaigns stored?
   - How does SMS_Templates table work with campaigns?
   - Can we extend Campaigns table with `campaignType = "Custom"`?

2. **Scheduler Logic**:
   - Review existing SMS scheduler workflow
   - Confirm it can handle custom campaigns
   - Propose filter modification to support `SMS Campaign ID` assignment

3. **Tag Data Source**:
   - Where are Kajabi tags stored? (Leads table `kajabi_tags` field - likely comma-separated)
   - How to extract unique tag list for dropdown?
   - Deduplicate and sort tags for UI

4. **Placeholder Rendering**:
   - How does current system replace placeholders? (Check n8n "Prepare Message" nodes)
   - Can we use the same `{{placeholder}}` syntax?
   - Add validation: Warn if placeholder data missing for selected leads

5. **Lead Assignment & Conflict Detection**:
   - How to batch-update `SMS Campaign ID` for selected leads?
   - Check existing active campaigns: Query `smsSequencePosition < 3 AND SMS Campaign ID IS NOT NULL`
   - Use sync queue for assignment OR direct Airtable MCP (100+ leads)?
   - Handle assignment failures gracefully (retry queue)

6. **AI Integration** ✅ CORE FEATURE:
   - **Recommendation**: Direct OpenAI API call from UI (faster UX)
   - Model: GPT-4 (better compliance adherence)
   - Prompt structure: System prompt enforces SMS compliance + placeholder usage
   - Fallback: If API fails, show manual mode with helper text
   - Store AI-generated messages same as manual (no special handling)

7. **Analytics Integration**:
   - Custom campaigns should appear in `/analytics` dashboard
   - Add to existing campaign stats queries (GROUP BY SMS Campaign ID)
   - Track: Messages sent, Response rate, Click rate, Booking rate
   - Reuse existing analytics components (just add custom campaign filter)

8. **Resource Attachment**:
   - Option A: Upload to cloud storage (S3/Cloudflare) → Generate short link
   - Option B: Paste URL → Validate + shorten via existing link shortener
   - Store in Campaigns table: `resourceLink`, `resourceName` fields
   - AI auto-inserts `{{resource_link}}` placeholder when resource attached

---

## CONSTRAINTS & ASSUMPTIONS

### Constraints
- Must work within existing Airtable structure
- Must not break existing form-based campaigns (webinar, standard)
- Must use existing SMS scheduler (no new workflows)
- Must respect SMS Stop and compliance rules
- Must maintain multi-tenant isolation
- Must prevent over-messaging (one active campaign per lead)

### Assumptions
- Leads have Kajabi Tags populated (from API polling)
- PostgreSQL sync is working (Airtable → PostgreSQL)
- Airtable sync queue is working (PostgreSQL → Airtable)
- Existing scheduler can support custom campaigns with minor filter update
- OpenAI API access available for AI message generation
- Tags are stored as comma-separated strings (need deduplication for UI)

### Critical Design Decisions ✅ APPROVED

**1. Campaign Conflict Strategy**: Override with user confirmation (see Key Features §1)

**2. Message Limit**: Fixed 3 messages (simple, clear)

**3. AI Integration**: Core feature from day 1 (not optional add-on)

**4. Data Model**: Reuse Campaigns table with `campaignType = "Custom"`

**5. Scheduler**: Extend existing standard scheduler (not new workflow)

**6. Analytics**: Integrate with existing dashboard (not separate view)

---

## OPEN QUESTIONS (For Implementation Agent to Answer)

### Critical Questions (Must Answer Before Coding)

1. **Message Storage**:
   - Store in SMS_Templates table (add Campaign reference field)?
   - OR store as JSON in Campaigns table (simpler, but less queryable)?
   - **Recommendation needed**: Propose with pros/cons

2. **Lead Assignment Mechanism**:
   - How to batch-update 100+ leads with `SMS Campaign ID`?
   - Use sync queue (slower, reliable) or direct Airtable MCP (faster, less reliable)?
   - **Recommendation needed**: Based on existing patterns

3. **Tag Deduplication**:
   - Confirm tags are comma-separated strings
   - Propose efficient deduplication method (backend vs frontend)
   - Should tags be cached in Redis or fetched per query?

4. **AI Implementation**:
   - Use OpenAI API directly from Next.js API route?
   - OR trigger n8n workflow with AI node?
   - **Recommendation**: API route (faster, simpler) unless compliance requires audit trail

5. **Resource Hosting**:
   - Where to store uploaded resources? (S3, Cloudflare, Vercel Blob?)
   - Use existing link shortener system or new one?
   - **Recommendation needed**: Check if file upload exists elsewhere in portal

### Nice-to-Know Questions (Can Decide During Build)

6. **Draft Campaigns**: PostgreSQL only (not synced to Airtable until activated)?
7. **Timing Units**: Days only for v1 (keep simple)?
8. **Campaign Duplication**: Copy campaign + messages with new name?
9. **Preview Leads**: Show full list or just count + sample (e.g., first 10)?

---

## HANDOFF TO IMPLEMENTATION AGENT

**Context to Review**:
- `/uysp-client-portal/src/lib/db/schema.ts` - Understand campaigns + leads + sms_templates tables
- `/uysp-client-portal/src/lib/airtable/client.ts` - Understand sync patterns
- `/workflows/UYSP-Kajabi-SMS-Scheduler-*.json` - Understand how scheduler works
- Existing `/admin/campaigns` endpoints (if any) - Understand API patterns

**First Tasks**:
1. Research existing campaign architecture
2. Propose data model (with pros/cons)
3. Validate scheduler can support custom campaigns
4. Design API contract (GET, POST, PATCH)
5. Sketch UI wireframe for approval

**Success Criteria**:
- User can create custom campaign in <10 min
- Messages render placeholders correctly 100% of time
- No impact on existing form-based campaigns
- Scheduler picks up custom campaigns automatically

---

**Next Agent**: 

**CRITICAL - Workspace Setup**:
1. Navigate to: `/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal/`
2. Verify git remote: `chieflatif/uysp-client-portal`
3. Create docs folder: `docs/features/custom-campaigns/`
4. Move this PRD there: `docs/features/custom-campaigns/PRD.md`

**Phase 1 - Research** (~2 hours):
1. Review codebase IN PORTAL SUBFOLDER:
   - `src/lib/db/schema.ts` - campaigns, leads, sms_templates tables
   - `src/app/api/admin/sync/route.ts` - sync patterns
   - `src/lib/airtable/client.ts` - Airtable integration
   - Review n8n scheduler (outside portal): `/workflows/UYSP-Kajabi-SMS-Scheduler-*.json`
2. Answer critical questions (see above) with evidence from code
3. Document findings in: `docs/features/custom-campaigns/RESEARCH-FINDINGS.md`
4. Propose technical approach in: `docs/features/custom-campaigns/TECHNICAL-SPEC.md`
5. Get user approval on approach

**Phase 2 - Build** (~12-15 hours):
1. Implement API routes (ALL IN `src/app/api/admin/campaigns/`)
2. Build UI components (ALL IN `src/components/admin/`)
3. Create campaign page (IN `src/app/(client)/admin/campaigns/`)
4. Integrate AI message generation (OpenAI API route)
5. Connect to analytics dashboard (update existing components)
6. Test end-to-end (create → activate → verify scheduler picks up)
7. Document in: `docs/features/custom-campaigns/IMPLEMENTATION-LOG.md`

**Success Criteria**:
- User creates custom campaign in <10 min
- AI generates compliant messages 80%+ acceptance rate
- No conflicts/over-messaging
- Analytics show custom campaign performance alongside existing campaigns

---

## PRD REVIEW: GAPS, RISKS & OPPORTUNITIES

### What We Added After Review ✅

1. **Campaign Conflict Management** (Critical Miss)
   - Added: Explicit conflict detection with skip/override/delay options
   - Why: Prevents over-messaging and compliance issues
   - User has control: Clear warning + 3 resolution paths

2. **Campaign Analytics Integration** (Critical Miss)
   - Added: Story 4 - Performance metrics requirement
   - Added: Integration with existing dashboard (not separate)
   - Why: Can't improve what you don't measure

3. **Resource Attachment Flow** (Critical Miss)
   - Added: Upload or URL paste with auto-shortening
   - Added: AI auto-inserts placeholders when resource attached
   - Why: Mentioned in original request but not specified

4. **AI as Core Feature** (Design Decision)
   - Changed from: "Optional AI generation"
   - To: "Hybrid builder - AI built from day 1"
   - Why: User feedback - wants it core, not bolted on later

5. **Pause/Stop Campaign** (Lifecycle Gap)
   - Added: Pause option to campaign management
   - Why: Need escape hatch for underperforming campaigns

### Key Risks & Mitigations 🚨

**Risk 1: Scheduler Compatibility**
- Assumption: Existing scheduler handles custom campaigns
- Mitigation: Agent must validate scheduler logic + propose mods
- Fallback: If incompatible, add simple filter to standard scheduler

**Risk 2: Tag Performance** (100+ leads, 50+ tags)
- Assumption: Tag querying is fast enough for live preview
- Mitigation: Agent to research tag storage + optimize query
- Fallback: Show count only (not full list) until user confirms

**Risk 3: Over-Messaging**
- Assumption: One campaign per lead prevents spam
- Mitigation: Conflict detection built into lead selection flow
- Fallback: Hard cap on messages per lead per week (add to scheduler)

**Risk 4: Placeholder Data Missing**
- Assumption: All leads have required data (first name, company, etc.)
- Mitigation: Validation warns if >20% of leads missing placeholder data
- Fallback: AI uses generic fallbacks ("Hey there" vs "Hey {{first_name}}")

### Design Improvements Made 💡

1. **Simplified Message Storage**: Recommend JSON in Campaigns table (agent to validate)
2. **Fixed 3 Messages**: No configurability = simpler UX, faster build
3. **AI + Manual Coexist**: User can mix modes across messages (flexibility)
4. **Reuse Existing Patterns**: Campaigns table + existing scheduler = minimal new infrastructure

### What's Still Flexible 🔧

Agent has room to decide (based on codebase research):
- Message storage (SMS_Templates vs JSON field)
- Lead assignment method (sync queue vs MCP)
- AI implementation (API route vs n8n)
- Resource hosting (if upload exists elsewhere, reuse)

### Bottom Line

✅ **PRD is ready** - covers business needs, AI integration, conflict handling, analytics  
✅ **Risks identified** - agent will validate assumptions during research  
✅ **Flexible enough** - agent can optimize based on existing patterns  
✅ **AI-first design** - not an afterthought, built into hybrid builder from start

**Estimated Build**: 12-15 hours (2 hours research + 10-13 hours implementation)


