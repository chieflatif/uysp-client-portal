# ACTUAL AIRTABLE SCHEMA - Live Data Analysis

**Date**: 2025-11-04  
**Source**: Live Airtable API inspection  
**Base ID**: app4wIsBfpJTg7pWS

---

## ✅ CONFIRMED FACTS

### 1. Kajabi Tags Field

**Field Name**: `"Kajabi Tags"` (confirmed!)  
**Format**: **Comma-separated string** (NOT array)  
**Sample Data** (14 tags from lead "Uche A"):
```
TT 10 Registration - Storytelling for Sales,
TT 6 Registration - Master Your Sales Pitch With The 5 P's,
Weekly Sales Training Newsletter,
JB Sales Webinar 6/5,
July 2023 Launch Sequence,
Sell Better Webinar (12/7/23),
Tanveer Webinar - Sell Better - 2/22,
Sell Better Webinar (3/13/24),
Sell Better Webinar (7/29/23),
Sell Better Webinar (9/26/24),
re-subscribed contacts (March 24 2025),
Newsletter Warmup Day 11,
Newsletter 8/12 Group A: 8AM,
Registration - Q4 2025 webinar
```

**Tag Categories Observed**:
1. **Registration tags**: "TT 10 Registration", "Registration - Q4 2025 webinar"
2. **Webinar tags**: "Sell Better Webinar (dates)", "JB Sales Webinar"
3. **Newsletter tags**: "Weekly Sales Training Newsletter", "Newsletter Warmup"
4. **Launch sequence tags**: "July 2023 Launch Sequence"
5. **Operational tags**: "re-subscribed contacts"

**For Campaign Filtering - Include Only**:
- Tags containing "Registration"
- Tags containing "Webinar"
- Tags containing "Training" (if they're event-based)

**For Campaign Filtering - Exclude**:
- "Newsletter Warmup"
- "re-subscribed contacts"
- Other operational/automation tags

---

### 2. Existing Tables in Base

**All 18 tables**:
1. ✅ **Settings** (ID: tblErXnFNMKYhh3Xr) - Currently has: Kajabi Last Poll
2. ✅ **Leads** (ID: tblYUvhGADerbD8EO) - Has Kajabi Tags field
3. ✅ **Campaigns** (ID: tblnIn8c1spOrImuz) - Active, Campaign Name, Type, Form ID
4. SMS_Templates
5. SMS_Audit  
6. Leads Backup
7. Kajabi_Sync_Audit
8. Tasks
9. Blockers
10. Project_Status
11. Project_Call_Summaries
12. AI_Config
13. Client_Safety_Config
14. Message_Decision_Log
15. Retry_Queue
16. Workflow_Health_Status
17. Companies
18. Table 1 (unknown purpose)

---

### 3. Leads Table Schema (Key Fields)

**Campaign/Sequence Fields**:
- `Campaign (CORRECTED)` - String (e.g., "Best-Q4-Ever-Webinar")
- `Form ID` - String
- `Lead Source` - String (e.g., "Webinar Form")
- `Lead Source Detail` - String
- `Linked Campaign` - Array (linked records)

**Engagement Fields** (IMPORTANT!):
- `Engagement - Level` - String (Red/Green/etc.)
- `Engagement - Recency Points` - Number
- `Engagement - Tag Count` - Number (calculated from Kajabi Tags)
- `Engagement - Total Score` - Number (0-100?)

**Tags & Kajabi Fields**:
- `Kajabi Tags` - String (comma-separated)
- `Kajabi Contact ID` - String
- `Kajabi Last Sync` - DateTime
- `Kajabi Member Status` - String (Prospect, Member, etc.)

**Processing Fields**:
- `Processing Status` - String (Ready for SMS, Queued, etc.)
- `SMS Eligible` - Boolean
- `HRQ Status` - String (None, Review, etc.)
- `HRQ Reason` - String

**Location/Scoring**:
- `ICP Score` - Number (0-20+)
- `Location Country` - String
- `Location Score Component` - Number

**Status Fields**:
- `Phone Valid` - Boolean
- `Enrichment Outcome` - String
- `Coaching Tier` - String

---

### 4. Campaigns Table Schema

**Current Fields**:
- `Campaign Name` - String (primary)
- `Campaign Type` - String (Standard, Webinar)
- `Form ID` - String
- `Active` - Boolean
- `Created` - DateTime
- `Total Leads` - Number

**Missing (Need to Add)**:
- `Target_Tags` - Long Text (comma-separated tags for filtering)
- `Messages` - Long Text (JSON array of messages)
- `Start_Datetime` - DateTime
- `Resource_Link` - URL
- `Resource_Name` - String
- `Messages_Sent` - Number
- `Auto_Discovered` - Boolean

---

### 5. Settings Table Schema

**Current Fields**:
- `Kajabi Last Poll` - DateTime

**Need to Add**:
- `Campaign_Tags_Available` - Long Text (JSON array of available tags)
- `Campaign_Tags_Last_Updated` - DateTime

---

## 📋 UPDATED ARCHITECTURE DECISIONS

### Decision 1: Tag Storage ✅

**Use Settings Table + n8n Automation**

**Settings Table - Add Field**:
```
Name: Campaign_Tags_Available
Type: Long Text
Format: JSON array
Example:
[
  {
    "tag": "Registration - Q4 2025 webinar",
    "category": "Webinar",
    "leadCount": 127,
    "lastSeen": "2025-11-04T01:25:33Z"
  },
  {
    "tag": "TT 10 Registration - Storytelling for Sales",
    "category": "Form",
    "leadCount": 89,
    "lastSeen": "2025-11-03T22:24:39Z"
  }
]
```

**n8n Workflow - Tag Aggregator**:
- Trigger: Schedule (daily at 2 AM)
- Query: Get all leads with Kajabi Tags
- Process: 
  - Split comma-separated tags
  - Categorize by pattern matching
  - Count leads per tag
  - Filter to only Form/Webinar tags
  - Update Settings.Campaign_Tags_Available

**PostgreSQL Cache** (optional for performance):
```sql
-- Sync from Settings table for fast queries
CREATE TABLE campaign_tags_cache (
  tag_name text PRIMARY KEY,
  category text,
  lead_count integer,
  last_seen_at timestamp,
  synced_at timestamp DEFAULT now()
);
```

---

### Decision 2: Tag Categorization ✅

**Pattern Matching Rules**:

```typescript
function categorizeTa(tag: string): 'Form' | 'Webinar' | 'Exclude' {
  const lower = tag.toLowerCase();
  
  // Webinar tags
  if (lower.includes('webinar') || 
      lower.includes('registration - q') ||
      lower.includes('training') && !lower.includes('newsletter')) {
    return 'Webinar';
  }
  
  // Form/Registration tags
  if (lower.includes('registration') || 
      lower.includes('tt ') && lower.includes('registration')) {
    return 'Form';
  }
  
  // Exclude operational tags
  if (lower.includes('newsletter warmup') ||
      lower.includes('re-subscribed') ||
      lower.includes('launch sequence') ||
      lower.includes('group a:') ||
      lower.includes('group b:')) {
    return 'Exclude';
  }
  
  // Default: include as general
  return 'Form';
}
```

---

### Decision 3: Enhanced Lead Filtering ✅

**Filters Available in UI**:

1. **Tag Selection** (multi-select)
   - Pre-filtered to Form/Webinar categories
   - Show lead count per tag
   - OR logic (any tag matches)

2. **Date Range**
   - From: Date picker
   - To: Date picker
   - Filter by `Record Created AT` or `Imported At`

3. **ICP Score Range**
   - Min: 0
   - Max: 20+
   - Filter by `ICP Score`

4. **Engagement Score Range**
   - Min: 0
   - Max: 100 (or whatever your max is)
   - Filter by `Engagement - Total Score`

5. **Engagement Level** (optional)
   - Green (high engagement)
   - Red (low engagement)
   - Filter by `Engagement - Level`

**SQL Query**:
```sql
SELECT * FROM leads
WHERE 
  -- Tag filtering (OR logic)
  kajabi_tags LIKE ANY(ARRAY['%Registration - Q4%', '%Sell Better Webinar%'])
  
  -- Date range
  AND created_at >= '2024-10-01'
  AND created_at <= '2025-11-04'
  
  -- ICP Score
  AND icp_score >= 5
  AND icp_score <= 20
  
  -- Engagement Score
  AND engagement_score >= 7
  AND engagement_score <= 100
  
  -- Auto-exclusions
  AND sms_stop = false
  AND booked = false
  AND phone_valid = true
  
  -- Active status
  AND processing_status NOT IN ('Stopped', 'Completed')
```

---

### Decision 4: Engagement Score Field ⚠️

**Question**: Is `engagement_score` a separate field or calculated?

**Current Observation**:
- `Engagement - Total Score` exists in Airtable
- Values range: 0, 28, etc.
- Appears to be calculated from Tag Count + Recency Points

**Need to Confirm**:
1. Is this field already synced to PostgreSQL?
2. If not, add to sync mapper
3. If it's calculated, should we calculate in PostgreSQL or sync from Airtable?

---

## 🚀 UPDATED IMPLEMENTATION PLAN

### Phase 1: Airtable Schema Updates (1 hour)

**Settings Table**:
- [ ] Add `Campaign_Tags_Available` (Long Text, JSON)
- [ ] Add `Campaign_Tags_Last_Updated` (DateTime)

**Campaigns Table**:
- [ ] Add `Target_Tags` (Long Text, comma-separated)
- [ ] Add `Messages` (Long Text, JSON array)
- [ ] Add `Start_Datetime` (DateTime)
- [ ] Add `Resource_Link` (URL)
- [ ] Add `Resource_Name` (Single Line Text)
- [ ] Extend `Campaign Type` enum: Standard, Webinar, **Custom**

---

### Phase 2: n8n Tag Aggregator Workflow (2 hours)

**Create New Workflow**: "UYSP-Campaign-Tags-Aggregator"

**Nodes**:
1. Schedule Trigger (daily 2 AM)
2. Airtable: Get All Leads (with Kajabi Tags)
3. Code: Aggregate & Categorize Tags
4. Airtable: Update Settings.Campaign_Tags_Available
5. Error Handler: Notify if fails

**Code Node Logic**:
```javascript
// Aggregate tags from all leads
const tagMap = new Map();

for (const lead of $input.all()) {
  const tags = lead.json.fields['Kajabi Tags'];
  if (!tags) continue;
  
  const tagArray = tags.split(',').map(t => t.trim());
  
  for (const tag of tagArray) {
    const category = categorizeTag(tag);
    if (category === 'Exclude') continue;
    
    if (!tagMap.has(tag)) {
      tagMap.set(tag, {
        tag,
        category,
        leadCount: 0,
        lastSeen: lead.json.fields['Kajabi Last Sync']
      });
    }
    
    tagMap.get(tag).leadCount++;
  }
}

// Convert to JSON
const tagsJson = JSON.stringify(Array.from(tagMap.values()));

return [{
  json: {
    Campaign_Tags_Available: tagsJson,
    Campaign_Tags_Last_Updated: new Date().toISOString()
  }
}];
```

---

### Phase 3: PostgreSQL Schema Updates (1 hour)

**Add to leads table** (if not already there):
```sql
ALTER TABLE leads 
  ADD COLUMN IF NOT EXISTS engagement_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS kajabi_tags text[];

-- Create GIN index for array operations
CREATE INDEX IF NOT EXISTS idx_leads_kajabi_tags_gin 
  ON leads USING GIN (kajabi_tags);
```

**Add campaign_tags_cache table**:
```sql
CREATE TABLE campaign_tags_cache (
  tag_name text PRIMARY KEY,
  category text NOT NULL,
  lead_count integer DEFAULT 0,
  last_seen_at timestamp,
  synced_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX idx_campaign_tags_category ON campaign_tags_cache (category);
```

**Update airtable/client.ts mapper**:
```typescript
// In mapToDatabaseLead():
kajabiTags: (() => {
  const tagsStr = fields['Kajabi Tags'];
  if (!tagsStr) return [];
  return tagsStr.split(',').map(t => t.trim()).filter(Boolean);
})(),
engagementScore: Number(fields['Engagement - Total Score']) || 0,
```

---

### Phase 4: API Routes (4 hours)

All APIs already specified in TECHNICAL-SPEC.md, just update:

**GET /api/admin/tags** - Query from `campaign_tags_cache` instead of live aggregation

**POST /api/admin/campaigns/preview-leads** - Add engagement_score filter

---

## ❓ QUESTIONS FOR YOU

### 1. Engagement Score

**Current field in Airtable**: `Engagement - Total Score`  
**Question**: Is this already synced to PostgreSQL as `engagement_score`?

**Check**: Look at `src/lib/airtable/client.ts` - is this field mapped?

If NO → I'll add it to the mapper

---

### 2. Tag Categorization

**Option A: Automatic (pattern matching)** ✅ RECOMMENDED
- Fast, no manual work
- 95% accuracy
- Can adjust patterns over time

**Option B: Manual curation**
- 100% accuracy
- Requires someone to tag each tag
- More maintenance

**Your preference?**

---

### 3. Settings Table vs. New Campaign_Tags Table

**Option A: Use Settings table** ✅ SIMPLER
- One row, JSON field
- Fast to update
- Simpler sync

**Option B: Dedicated Campaign_Tags table**
- Better for querying
- Can add metadata per tag
- More flexible

**Your preference?** (I recommend Settings for V1)

---

### 4. Azure Model Preferences

Which models do you have access to?
- GPT-4 Turbo?
- GPT-4?
- Claude 3.5 Sonnet?
- Other?

I'll set up the fallback chain based on your answer.

---

## 📊 SUMMARY

**What I Found** ✅:
1. Kajabi Tags field EXISTS (comma-separated string)
2. 14-tag sample with mix of categories
3. Settings table EXISTS (perfect for storing available tags)
4. Engagement score field EXISTS
5. 18 tables total in base

**What Needs to Be Built**:
1. Tag aggregator workflow (n8n)
2. Campaigns table extension (Airtable)
3. PostgreSQL sync for engagement_score
4. API routes for tag filtering
5. UI components for tag selection + score filters

**Timeline**: Still 14-16 hours (2-3 days)

**Ready to proceed once you answer the 4 questions above!** 🚀
