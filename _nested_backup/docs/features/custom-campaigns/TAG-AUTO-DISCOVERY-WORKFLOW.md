# Tag Auto-Discovery Workflow Specification

**Status**: Specification Complete
**Purpose**: Automatically discover and aggregate Kajabi tags from leads to prevent manual entry errors
**Related**: FORENSIC-AUDIT.md (Critical Issue #1)

---

## Overview

This n8n workflow automatically discovers available Kajabi tags from leads and stores them in a cache for campaign creation UI. This eliminates manual tag entry errors and ensures campaign tag selectors always show current, valid tags.

## Problem Solved

**Before**: Admin manually types tag names when creating campaigns
- Typos break lead matching (e.g., "Q4 2025 Webinar" vs "Registration - Q4 2025 webinar")
- No validation of tag existence
- Stale tags shown in UI

**After**: System auto-discovers tags daily
- UI shows dropdown of actual tags from leads
- No typos possible
- Always up-to-date with current tags

---

## Workflow Architecture

### Trigger
- **Type**: Schedule (Cron)
- **Schedule**: Daily at 2:00 AM ET
- **Reason**: Low-traffic time, ensures UI has fresh tags for morning use

### Data Flow
```
Airtable Leads → Extract Tags → Filter & Deduplicate → Store in PostgreSQL → Sync to Airtable Settings
```

---

## Workflow Steps (n8n Nodes)

### 1. Schedule Trigger
```yaml
Node Type: Schedule Trigger
Cron: 0 2 * * *
Timezone: America/New_York
```

### 2. Fetch All Leads from Airtable
```yaml
Node Type: Airtable (List Records)
Base: {{ CLIENT_AIRTABLE_BASE_ID }}
Table: Leads
Fields: ["Kajabi Tags"]
Max Records: 50000 (or use pagination)
Filter: {Kajabi Tags} != BLANK()
```

**Output**: Array of lead records with Kajabi Tags field

### 3. Extract All Tags (Code Node)
```javascript
// Node: Extract Tags
const allTags = [];

for (const item of $input.all()) {
  const kajabiTags = item.json['Kajabi Tags'];

  if (kajabiTags && typeof kajabiTags === 'string') {
    // Split comma-separated tags
    const tags = kajabiTags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    allTags.push(...tags);
  }
}

return [{ json: { allTags } }];
```

**Output**: Single item with `allTags` array

### 4. Filter Tags by Category (Code Node)
```javascript
// Node: Filter Tags
const allTags = $input.first().json.allTags;

// Tag categorization rules
const FORM_PATTERNS = [
  /registration/i,
  /webinar/i,
  /training/i,
  /tt \d+/i,           // Tech Talk series (TT 6, TT 10)
  /jb /i,              // JB events
  /sell better/i,
];

const EXCLUDE_PATTERNS = [
  /newsletter/i,
  /launch sequence/i,
  /warmup/i,
  /re-subscribed/i,
  /unsubscribed/i,
  /group [a-z]:/i,     // Newsletter groups (Group A:, Group B:)
];

function isRelevantTag(tag) {
  // Exclude operational tags
  for (const pattern of EXCLUDE_PATTERNS) {
    if (pattern.test(tag)) return false;
  }

  // Include form/webinar tags
  for (const pattern of FORM_PATTERNS) {
    if (pattern.test(tag)) return true;
  }

  // Exclude anything else (default conservative)
  return false;
}

// Filter and deduplicate
const uniqueTags = [...new Set(allTags)]
  .filter(isRelevantTag)
  .sort(); // Alphabetical order

return [{
  json: {
    tags: uniqueTags,
    totalCount: uniqueTags.length,
    generatedAt: new Date().toISOString(),
  }
}];
```

**Output**:
```json
{
  "tags": ["Registration - Q4 2025 webinar", "TT 10 Registration - Storytelling for Sales", ...],
  "totalCount": 14,
  "generatedAt": "2025-11-03T02:00:00Z"
}
```

### 5. Store in PostgreSQL (Code Node with pg client)
```javascript
// Node: Store in PostgreSQL
const { Client } = require('pg');

const tags = $input.first().json.tags;
const generatedAt = $input.first().json.generatedAt;

const client = new Client({
  connectionString: $env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

await client.connect();

try {
  // Create or update cache record
  await client.query(`
    INSERT INTO campaign_tags_cache (
      client_id,
      tags,
      generated_at,
      updated_at
    ) VALUES (
      $1, $2, $3, NOW()
    )
    ON CONFLICT (client_id)
    DO UPDATE SET
      tags = EXCLUDED.tags,
      generated_at = EXCLUDED.generated_at,
      updated_at = NOW()
  `, [
    $env.CLIENT_ID,
    JSON.stringify(tags),
    generatedAt
  ]);

  console.log(`✅ Stored ${tags.length} tags for client ${$env.CLIENT_ID}`);

  return [{
    json: {
      success: true,
      tagsStored: tags.length
    }
  }];
} finally {
  await client.end();
}
```

### 6. Sync to Airtable Settings (Optional)
```yaml
Node Type: Airtable (Update Record)
Base: {{ CLIENT_AIRTABLE_BASE_ID }}
Table: Settings
Record ID: {{ SETTINGS_RECORD_ID }}
Fields:
  Campaign_Tags_Available: {{ JSON.stringify($json.tags) }}
  Campaign_Tags_Last_Updated: {{ $json.generatedAt }}
```

---

## Database Schema

### New Table: `campaign_tags_cache`
```sql
CREATE TABLE IF NOT EXISTS campaign_tags_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
  tags JSONB NOT NULL, -- Array of tag strings
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tags_cache_client ON campaign_tags_cache (client_id);

COMMENT ON TABLE campaign_tags_cache IS 'Auto-discovered Kajabi tags cache for campaign creation UI';
COMMENT ON COLUMN campaign_tags_cache.tags IS 'JSON array of valid Kajabi tags (form/webinar only)';
```

---

## API Endpoint for UI

### GET `/api/admin/campaigns/available-tags`

**Purpose**: Fetch available tags for campaign creation form

**Request**:
```bash
GET /api/admin/campaigns/available-tags?clientId=<uuid>
Authorization: Bearer <token>
```

**Response**:
```json
{
  "tags": [
    "Registration - Q4 2025 webinar",
    "TT 10 Registration - Storytelling for Sales",
    "TT 6 Registration - Master Your Sales Pitch With The 5 P's",
    "JB Sales Webinar 6/5",
    "Sell Better Webinar (3/13/24)"
  ],
  "count": 5,
  "lastUpdated": "2025-11-03T02:00:00Z"
}
```

**Implementation**:
```typescript
// uysp-client-portal/src/app/api/admin/campaigns/available-tags/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { campaignTagsCache } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get client ID (from query for SUPER_ADMIN, from session otherwise)
    let clientId = session.user.clientId;
    if (session.user.role === 'SUPER_ADMIN') {
      const queryClientId = request.nextUrl.searchParams.get('clientId');
      if (queryClientId) clientId = queryClientId;
    }

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID required' }, { status: 400 });
    }

    // Fetch tags from cache
    const cache = await db.query.campaignTagsCache.findFirst({
      where: eq(campaignTagsCache.clientId, clientId),
    });

    if (!cache) {
      return NextResponse.json({
        tags: [],
        count: 0,
        lastUpdated: null,
        message: 'No tags discovered yet. Please wait for nightly sync or contact support.',
      });
    }

    return NextResponse.json({
      tags: cache.tags as string[],
      count: (cache.tags as string[]).length,
      lastUpdated: cache.generatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching available tags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## UI Integration

### Campaign Form Component

**Before** (Manual Entry):
```tsx
<input
  type="text"
  placeholder="Enter tag (e.g., Q4 2025 Webinar)"
  value={selectedTag}
  onChange={(e) => setSelectedTag(e.target.value)}
/>
```

**After** (Auto-Discovery):
```tsx
const [availableTags, setAvailableTags] = useState<string[]>([]);

useEffect(() => {
  fetch(`/api/admin/campaigns/available-tags?clientId=${clientId}`)
    .then(res => res.json())
    .then(data => setAvailableTags(data.tags || []));
}, [clientId]);

return (
  <div>
    <label>Select Tags</label>
    <Select
      isMulti
      options={availableTags.map(tag => ({ value: tag, label: tag }))}
      value={selectedTags}
      onChange={setSelectedTags}
      placeholder="Select one or more tags..."
    />
    {availableTags.length === 0 && (
      <p className="text-yellow-400 text-sm mt-2">
        ⚠️ No tags available yet. Tags are updated daily at 2:00 AM.
      </p>
    )}
  </div>
);
```

---

## Monitoring & Alerts

### Success Metrics
- Number of tags discovered
- Last successful run timestamp
- Tags added/removed since last run

### Failure Alerts
- Workflow execution failure
- Zero tags discovered (indicates data issue)
- PostgreSQL connection failure

### Logging
```javascript
// Add to workflow final node
console.log(JSON.stringify({
  workflow: 'tag-auto-discovery',
  timestamp: new Date().toISOString(),
  tagsDiscovered: $json.totalCount,
  clientId: $env.CLIENT_ID,
  success: true
}));
```

---

## Manual Trigger (For Testing)

Admins can manually trigger tag refresh:

### POST `/api/admin/campaigns/refresh-tags`

**Request**:
```bash
POST /api/admin/campaigns/refresh-tags
Authorization: Bearer <token>
Content-Type: application/json

{
  "clientId": "uuid"
}
```

**Implementation**:
```typescript
// Triggers n8n workflow via webhook
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { clientId } = await request.json();

  // Trigger n8n workflow
  const response = await fetch(process.env.N8N_WEBHOOK_TAG_DISCOVERY!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId }),
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: 'Failed to trigger workflow' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: 'Tag discovery triggered. Check back in 2-3 minutes.',
  });
}
```

---

## Migration Plan

### Phase 1: Create Infrastructure
1. Run migration to create `campaign_tags_cache` table
2. Deploy API endpoint `/api/admin/campaigns/available-tags`

### Phase 2: Deploy Workflow
1. Create n8n workflow from this spec
2. Test with manual trigger
3. Verify tags stored correctly in PostgreSQL

### Phase 3: Update UI
1. Replace manual tag input with multi-select dropdown
2. Fetch tags from new endpoint
3. Test campaign creation flow

### Phase 4: Monitor
1. Verify daily runs complete successfully
2. Check tag counts remain stable
3. Gather user feedback on tag selection UX

---

## Rollback Plan

If tag auto-discovery fails:

1. **Immediate**: UI falls back to manual text input
2. **Short-term**: Run manual SQL to populate cache from existing campaigns
3. **Long-term**: Debug workflow and redeploy

```sql
-- Emergency cache population from existing campaigns
INSERT INTO campaign_tags_cache (client_id, tags, generated_at)
SELECT DISTINCT
  client_id,
  jsonb_agg(DISTINCT tag) as tags,
  NOW() as generated_at
FROM (
  SELECT
    client_id,
    jsonb_array_elements_text(target_tags) as tag
  FROM campaigns
  WHERE target_tags IS NOT NULL
) subquery
GROUP BY client_id
ON CONFLICT (client_id)
DO UPDATE SET
  tags = EXCLUDED.tags,
  generated_at = EXCLUDED.generated_at,
  updated_at = NOW();
```

---

## Cost & Performance

### Resource Usage
- **Airtable API**: ~1 request per 100 leads (with pagination)
- **PostgreSQL**: 1 upsert per client per day
- **Execution Time**: ~30-60 seconds for 5000 leads
- **Storage**: ~10KB per client (JSON array of strings)

### Scalability
- Current: 1 client, ~5000 leads → 60 seconds
- Future: 100 clients, ~500K leads → 1 hour (acceptable for 2 AM cron)
- Optimization: Run per-client workflows in parallel if needed

---

## Alternative Approaches Considered

### 1. Real-time Tag Extraction (Rejected)
- **Pro**: Always up-to-date
- **Con**: High API usage, slow UI response, Airtable rate limits
- **Decision**: Batch daily is sufficient

### 2. Manual Tag Management Table (Rejected)
- **Pro**: Admin controls exactly which tags shown
- **Con**: Requires manual maintenance, prone to staleness
- **Decision**: Auto-discovery eliminates manual work

### 3. Scan PostgreSQL Instead of Airtable (Considered)
- **Pro**: Faster, no Airtable API calls
- **Con**: PostgreSQL is cache, may be out of sync during sync window
- **Decision**: Use Airtable as source of truth for accuracy

---

## Success Criteria

✅ **Zero manual tag entry required**
✅ **Tags always reflect current lead data**
✅ **No campaign creation failures due to typos**
✅ **UI loads tags in <500ms**
✅ **Workflow runs successfully every night**
✅ **Admin can manually refresh if needed**

---

## Next Steps

1. Create migration SQL for `campaign_tags_cache` table
2. Implement `/api/admin/campaigns/available-tags` endpoint
3. Build n8n workflow in dev environment
4. Test with real Airtable data
5. Deploy to production
6. Update campaign creation UI
7. Monitor for 1 week, gather feedback
