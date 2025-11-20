# Technical Specification: Custom Tag-Based SMS Campaigns

**Date**: 2025-11-03  
**Version**: 1.0  
**Status**: 🟡 PENDING APPROVAL  
**Based On**: RESEARCH-FINDINGS.md

---

## OVERVIEW

This specification defines the technical implementation for custom tag-based SMS campaigns, enabling admins to select leads by Kajabi tags and enroll them in multi-message SMS nurture sequences with AI-assisted message creation.

**Key Design Decisions** (from research):
1. ✅ Extend campaigns table (not new table)
2. ✅ Store messages in JSONB (not SMS_Templates)
3. ✅ Direct database update for lead assignment (+ sync queue)
4. ✅ Sync custom messages to SMS_Templates for scheduler compatibility
5. ✅ Add kajabiTags field to leads table
6. ✅ Direct OpenAI API integration (not n8n)

---

## 1. DATABASE SCHEMA CHANGES

### 1.1 Migration: `add-custom-campaigns.sql`

```sql
-- ============================================================================
-- MIGRATION: Add Custom Tag-Based Campaign Support
-- Date: 2025-11-03
-- Description: Enables custom campaigns with tag-based lead selection
-- ============================================================================

-- Add Kajabi tags to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS kajabi_tags text[];
CREATE INDEX IF NOT EXISTS idx_leads_kajabi_tags ON leads USING GIN (kajabi_tags);

-- Extend campaigns table for custom campaigns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS target_tags text[];
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS messages jsonb;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS start_datetime timestamp with time zone;
ALTER TABLE campaigns ALTER COLUMN form_id DROP NOT NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_target_tags ON campaigns USING GIN (target_tags);
CREATE INDEX IF NOT EXISTS idx_campaigns_start_datetime ON campaigns (start_datetime);
CREATE INDEX IF NOT EXISTS idx_campaigns_type_status ON campaigns (campaign_type, is_paused);

-- Add comment for documentation
COMMENT ON COLUMN leads.kajabi_tags IS 'Array of Kajabi tags for lead segmentation (from Airtable sync)';
COMMENT ON COLUMN campaigns.target_tags IS 'Tags used to filter leads for custom campaigns';
COMMENT ON COLUMN campaigns.messages IS 'Array of message objects for custom campaigns: [{step, delayDays, body, resourceLink, resourceName}]';
COMMENT ON COLUMN campaigns.start_datetime IS 'When to begin sending messages (custom campaigns only)';
```

### 1.2 TypeScript Schema Updates

**Location**: `src/lib/db/schema.ts`

```typescript
// Update leads table:
export const leads = pgTable(
  'leads',
  {
    // ... existing fields ...
    kajabiTags: text('kajabi_tags').array(), // NEW
  },
  (table) => ({
    // ... existing indexes ...
    kajabiTagsIdx: index('idx_leads_kajabi_tags').using('gin', table.kajabiTags), // NEW
  })
);

// Update campaigns table:
export const campaigns = pgTable(
  'campaigns',
  {
    // ... existing fields ...
    formId: varchar('form_id', { length: 255 }), // CHANGED: Remove .notNull()
    targetTags: text('target_tags').array(), // NEW
    messages: jsonb('messages'), // NEW
    startDatetime: timestamp('start_datetime', { withTimezone: true }), // NEW
  },
  (table) => ({
    // ... existing indexes ...
    targetTagsIdx: index('idx_campaigns_target_tags').using('gin', table.targetTags), // NEW
    startDatetimeIdx: index('idx_campaigns_start_datetime').on(table.startDatetime), // NEW
    typeStatusIdx: index('idx_campaigns_type_status').on(table.campaignType, table.isPaused), // NEW
  })
);

// Add type definitions:
export interface CampaignMessage {
  step: number;              // 1, 2, 3
  delayDays: number;         // 0 for first message, 3 for second, etc.
  body: string;              // Message text with {{placeholders}}
  resourceLink?: string;     // Optional per-message resource URL
  resourceName?: string;     // Resource display name
  aiGenerated?: boolean;     // Track if AI-generated
  aiPrompt?: string;         // Original AI prompt (for regeneration)
}

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;
```

---

## 2. API ENDPOINTS

### 2.1 GET /api/admin/tags

**Purpose**: List all unique Kajabi tags for a client

**Auth**: CLIENT_ADMIN (own client), SUPER_ADMIN (any client)

**Query Params**:
- `clientId` (string, required for SUPER_ADMIN)

**Response**:
```typescript
{
  tags: Array<{
    tag: string;
    leadCount: number;
  }>;
  total: number;
}
```

**Implementation**:
```typescript
// File: src/app/api/admin/tags/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { leads } from '@/lib/db/schema';
import { eq, sql, and, isNotNull } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get clientId (from session or query param)
  let clientId = session.user.clientId;
  const queryClientId = request.nextUrl.searchParams.get('clientId');
  if (session.user.role === 'SUPER_ADMIN' && queryClientId) {
    clientId = queryClientId;
  }

  if (!clientId) {
    return NextResponse.json({ error: 'Client ID required' }, { status: 400 });
  }

  // Query unique tags with counts
  const result = await db.execute(sql`
    SELECT tag, COUNT(*) as lead_count
    FROM leads, UNNEST(kajabi_tags) AS tag
    WHERE client_id = ${clientId}
      AND kajabi_tags IS NOT NULL
      AND kajabi_tags != ARRAY[]::text[]
    GROUP BY tag
    ORDER BY lead_count DESC, tag ASC
  `);

  const tags = result.rows.map((r: any) => ({
    tag: r.tag,
    leadCount: parseInt(r.lead_count),
  }));

  return NextResponse.json({
    tags,
    total: tags.length,
  });
}
```

---

### 2.2 POST /api/admin/campaigns/preview-leads

**Purpose**: Preview how many leads match selected tags

**Auth**: CLIENT_ADMIN, SUPER_ADMIN

**Request Body**:
```typescript
{
  clientId: string;
  tags: string[];           // Selected tags (OR logic)
  excludeAutoExclusions: boolean;  // If true, exclude SMS Stop, Booked, etc.
}
```

**Response**:
```typescript
{
  totalMatching: number;
  excluded: {
    smsStop: number;
    booked: number;
    invalidPhone: number;
  };
  enrollable: number;
  conflicts: {
    count: number;
    campaigns: Array<{
      campaignId: string;
      campaignName: string;
      leadCount: number;
    }>;
  };
  sampleLeads: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    tags: string[];
  }>;  // First 10 leads
}
```

**Implementation**:
```typescript
// File: src/app/api/admin/campaigns/preview-leads/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { leads, campaigns } from '@/lib/db/schema';
import { eq, sql, and, isNotNull, isNull } from 'drizzle-orm';
import { z } from 'zod';

const previewSchema = z.object({
  clientId: z.string().uuid(),
  tags: z.array(z.string()).min(1),
  excludeAutoExclusions: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const validation = previewSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input', details: validation.error }, { status: 400 });
  }

  const { clientId, tags, excludeAutoExclusions } = validation.data;

  // Authorization check
  if (session.user.role !== 'SUPER_ADMIN' && session.user.clientId !== clientId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Build where clause
  const whereConditions = [
    eq(leads.clientId, clientId),
    sql`${leads.kajabiTags} && ARRAY[${tags.join(',')}]::text[]`,
  ];

  if (excludeAutoExclusions) {
    whereConditions.push(
      eq(leads.smsStop, false),
      eq(leads.booked, false),
      isNotNull(leads.phone)
    );
  }

  // Count total matching
  const totalMatching = await db
    .select({ count: sql<number>`count(*)` })
    .from(leads)
    .where(and(...whereConditions))
    .then(r => parseInt(r[0]?.count as any) || 0);

  // Count exclusions
  const excluded = await db
    .select({
      smsStop: sql<number>`count(*) FILTER (WHERE sms_stop = true)`,
      booked: sql<number>`count(*) FILTER (WHERE booked = true)`,
      invalidPhone: sql<number>`count(*) FILTER (WHERE phone IS NULL OR phone = '')`,
    })
    .from(leads)
    .where(and(
      eq(leads.clientId, clientId),
      sql`${leads.kajabiTags} && ARRAY[${tags.join(',')}]::text[]`
    ))
    .then(r => ({
      smsStop: parseInt(r[0]?.smsStop as any) || 0,
      booked: parseInt(r[0]?.booked as any) || 0,
      invalidPhone: parseInt(r[0]?.invalidPhone as any) || 0,
    }));

  // Check conflicts (leads in active campaigns)
  const conflictingLeads = await db
    .select({
      leadId: leads.id,
      campaignId: campaigns.id,
      campaignName: campaigns.name,
    })
    .from(leads)
    .innerJoin(campaigns, eq(leads.campaignLinkId, campaigns.id))
    .where(and(
      ...whereConditions,
      isNotNull(leads.campaignLinkId),
      eq(campaigns.isPaused, false),
      sql`${leads.smsSequencePosition} < 3`  // Still in sequence
    ));

  // Group conflicts by campaign
  const conflictsByCampaign = conflictingLeads.reduce((acc, conflict) => {
    const existing = acc.find(c => c.campaignId === conflict.campaignId);
    if (existing) {
      existing.leadCount++;
    } else {
      acc.push({
        campaignId: conflict.campaignId,
        campaignName: conflict.campaignName,
        leadCount: 1,
      });
    }
    return acc;
  }, [] as Array<{ campaignId: string; campaignName: string; leadCount: number }>);

  // Get sample leads (first 10)
  const sampleLeads = await db
    .select({
      id: leads.id,
      firstName: leads.firstName,
      lastName: leads.lastName,
      email: leads.email,
      tags: leads.kajabiTags,
    })
    .from(leads)
    .where(and(...whereConditions))
    .limit(10);

  return NextResponse.json({
    totalMatching,
    excluded,
    enrollable: totalMatching,
    conflicts: {
      count: conflictingLeads.length,
      campaigns: conflictsByCampaign,
    },
    sampleLeads,
  });
}
```

---

### 2.3 POST /api/admin/campaigns/generate-message

**Purpose**: AI-generate SMS message with placeholders

**Auth**: CLIENT_ADMIN, SUPER_ADMIN

**Request Body**:
```typescript
{
  campaignGoal: string;      // "Follow up on Q4 webinar"
  tone: 'Professional' | 'Casual' | 'Urgent';
  resourceName?: string;     // If provided, include {{resource_link}}
  availablePlaceholders: string[];  // Context for AI
}
```

**Response**:
```typescript
{
  message: string;           // Generated message with placeholders
  charCount: number;
  smsCount: number;
  placeholdersUsed: string[];
  regenerationToken?: string;  // For "Regenerate" button
}
```

**Implementation**:
```typescript
// File: src/app/api/admin/campaigns/generate-message/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import OpenAI from 'openai';
import { z } from 'zod';

const generateSchema = z.object({
  campaignGoal: z.string().min(1).max(500),
  tone: z.enum(['Professional', 'Casual', 'Urgent']),
  resourceName: z.string().optional(),
  availablePlaceholders: z.array(z.string()),
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const validation = generateSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const { campaignGoal, tone, resourceName, availablePlaceholders } = validation.data;

  // Rate limiting (10 per minute per user)
  // TODO: Implement rate limiting via Redis

  // Build system prompt
  const systemPrompt = `You are an AI assistant creating compliant SMS messages for sales lead nurturing.

REQUIREMENTS:
- Message must be under 160 characters (1 SMS segment)
- Must identify sender (e.g., "This is Ian's team at UYSP")
- Must be compliance-friendly (professional, opt-out implicit)
- Use provided placeholders to personalize
- Be action-oriented with clear CTA

TONE: ${tone}
AVAILABLE PLACEHOLDERS: ${availablePlaceholders.map(p => `{{${p}}}`).join(', ')}
${resourceName ? `RESOURCE TO INCLUDE: "${resourceName}" via {{resource_link}}` : ''}

Generate a concise, professional SMS message that achieves the goal. ONLY output the message text, nothing else.`;

  const userPrompt = `Campaign goal: ${campaignGoal}

Generate the SMS message now.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    const message = completion.choices[0]?.message?.content?.trim() || '';
    
    // Extract placeholders used
    const placeholdersUsed = (message.match(/\{\{(\w+)\}\}/g) || [])
      .map(p => p.replace(/\{\{|\}\}/g, ''));

    // Calculate SMS count
    const charCount = message.length;
    const smsCount = Math.ceil(charCount / 160);

    return NextResponse.json({
      message,
      charCount,
      smsCount,
      placeholdersUsed,
    });
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate message', details: error.message },
      { status: 500 }
    );
  }
}
```

---

### 2.4 POST /api/admin/campaigns (Extended)

**Purpose**: Create custom campaign

**Updates to existing endpoint**:

```typescript
// File: src/app/api/admin/campaigns/route.ts (EXTEND EXISTING)

// Add to schema:
const createCampaignSchema = z.discriminatedUnion('campaignType', [
  // Existing Webinar/Standard schemas...
  z.object({
    campaignType: z.literal('Custom'),
    clientId: z.string().uuid(),
    name: z.string().min(1).max(255),
    targetTags: z.array(z.string()).min(1),
    messages: z.array(z.object({
      step: z.number().int().min(1).max(3),
      delayDays: z.number().int().min(0),
      body: z.string().min(1).max(500),
      resourceLink: z.string().url().optional(),
      resourceName: z.string().max(255).optional(),
      aiGenerated: z.boolean().optional(),
      aiPrompt: z.string().optional(),
    })).min(1).max(3),
    startDatetime: z.string().datetime(),
    isPaused: z.boolean().default(false),
  }),
]);

// In POST handler, add Custom campaign logic:
if (data.campaignType === 'Custom') {
  // Validate start datetime is in future
  if (new Date(data.startDatetime) < new Date()) {
    return NextResponse.json({ error: 'Start datetime must be in future' }, { status: 400 });
  }

  // Validate messages are sequential
  const steps = data.messages.map(m => m.step).sort();
  if (steps[0] !== 1 || steps.some((s, i) => s !== i + 1)) {
    return NextResponse.json({ error: 'Message steps must be 1, 2, 3 in order' }, { status: 400 });
  }

  // Validate first message has delayDays = 0
  if (data.messages[0].delayDays !== 0) {
    return NextResponse.json({ error: 'First message must have delayDays = 0' }, { status: 400 });
  }

  // Create campaign (paused by default, activated later)
  const newCampaign = await db.insert(campaigns).values({
    clientId: data.clientId,
    name: data.name,
    campaignType: 'Custom',
    formId: null,  // Custom campaigns don't have form IDs
    targetTags: data.targetTags,
    messages: data.messages,
    startDatetime: new Date(data.startDatetime),
    isPaused: true,  // Don't activate until user explicitly activates
    airtableRecordId: '',  // Will be filled when synced
    messagesSent: 0,
    totalLeads: 0,
  }).returning();

  const campaign = newCampaign[0];

  return NextResponse.json({
    campaign,
    message: 'Custom campaign created. Activate to enroll leads and begin sending.',
  }, { status: 201 });
}
```

---

### 2.5 POST /api/admin/campaigns/[id]/activate

**Purpose**: Activate custom campaign (enroll leads, sync messages to templates)

**Auth**: CLIENT_ADMIN, SUPER_ADMIN

**Request Body**:
```typescript
{
  conflictResolution: 'skip' | 'override' | 'delay';
}
```

**Response**:
```typescript
{
  campaign: Campaign;
  leadsEnrolled: number;
  conflictsResolved: {
    skipped: number;
    overridden: number;
    delayed: boolean;
  };
  messagesSynced: number;
}
```

**Implementation**:
```typescript
// File: src/app/api/admin/campaigns/[id]/activate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { campaigns, leads, smsTemplates, activityLog, airtableSyncQueue } from '@/lib/db/schema';
import { eq, and, sql, inArray, isNotNull } from 'drizzle-orm';
import { z } from 'zod';

const activateSchema = z.object({
  conflictResolution: z.enum(['skip', 'override', 'delay']),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const validation = activateSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const { conflictResolution } = validation.data;
  const campaignId = params.id;

  // Get campaign
  const campaign = await db.query.campaigns.findFirst({
    where: eq(campaigns.id, campaignId),
  });

  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  // Authorization check
  if (session.user.role !== 'SUPER_ADMIN' && session.user.clientId !== campaign.clientId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Validate campaign is Custom type
  if (campaign.campaignType !== 'Custom') {
    return NextResponse.json({ error: 'Only custom campaigns can be activated via this endpoint' }, { status: 400 });
  }

  // Validate campaign is not already active
  if (!campaign.isPaused) {
    return NextResponse.json({ error: 'Campaign is already active' }, { status: 400 });
  }

  // Get matching leads
  const matchingLeads = await db
    .select({ id: leads.id, campaignLinkId: leads.campaignLinkId, smsSequencePosition: leads.smsSequencePosition })
    .from(leads)
    .where(and(
      eq(leads.clientId, campaign.clientId),
      sql`${leads.kajabiTags} && ARRAY[${campaign.targetTags.join(',')}]::text[]`,
      eq(leads.smsStop, false),
      eq(leads.booked, false),
      isNotNull(leads.phone)
    ));

  if (matchingLeads.length === 0) {
    return NextResponse.json({ error: 'No eligible leads match the selected tags' }, { status: 400 });
  }

  // Check for conflicts
  const conflictingLeads = matchingLeads.filter(
    l => l.campaignLinkId !== null && l.smsSequencePosition < 3
  );

  let leadsToEnroll: typeof matchingLeads = matchingLeads;

  // Handle conflicts
  if (conflictingLeads.length > 0) {
    if (conflictResolution === 'skip') {
      leadsToEnroll = matchingLeads.filter(l => !conflictingLeads.some(c => c.id === l.id));
    } else if (conflictResolution === 'override') {
      // Pause old campaigns
      const oldCampaignIds = [...new Set(conflictingLeads.map(l => l.campaignLinkId).filter(Boolean))];
      await db.update(campaigns)
        .set({ isPaused: true, updatedAt: new Date() })
        .where(inArray(campaigns.id, oldCampaignIds as string[]));

      // Log overrides
      await db.insert(activityLog).values(
        conflictingLeads.map(l => ({
          userId: session.user.id,
          clientId: campaign.clientId,
          leadId: l.id,
          action: 'CAMPAIGN_OVERRIDE',
          details: `Moved to "${campaign.name}" from conflicting campaign`,
        }))
      );
    } else if (conflictResolution === 'delay') {
      return NextResponse.json({
        error: 'Delay resolution not yet implemented',
        suggestion: 'Please resolve conflicts manually or use skip/override',
      }, { status: 400 });
    }
  }

  if (leadsToEnroll.length === 0) {
    return NextResponse.json({ error: 'All leads have conflicts and were skipped' }, { status: 400 });
  }

  // Enroll leads (batch update)
  await db.update(leads)
    .set({
      campaignLinkId: campaignId,
      campaignName: campaign.name,
      smsSequencePosition: 0,
      smsLastSentAt: null,
      updatedAt: new Date(),
    })
    .where(inArray(leads.id, leadsToEnroll.map(l => l.id)));

  // Sync to Airtable (queue)
  await db.insert(airtableSyncQueue).values(
    leadsToEnroll.map(l => ({
      clientId: campaign.clientId,
      tableName: 'Leads',
      recordId: l.id,
      operation: 'update',
      payload: {
        'SMS Campaign ID': campaign.name,
        'SMS Sequence Position': 0,
        'SMS Last Sent At': null,
      },
      status: 'pending',
    }))
  );

  // Sync messages to SMS_Templates table (for scheduler compatibility)
  const messagesData = campaign.messages as any as Array<{
    step: number;
    delayDays: number;
    body: string;
  }>;

  for (const message of messagesData) {
    await db.insert(smsTemplates).values({
      airtableRecordId: `custom-${campaignId}-${message.step}`,
      campaign: campaign.name,
      variant: null,
      step: message.step,
      delayDays: message.delayDays,
      fastDelayMinutes: null,
      body: message.body,
      templateType: 'Custom',
    }).onConflictDoUpdate({
      target: smsTemplates.airtableRecordId,
      set: {
        body: message.body,
        delayDays: message.delayDays,
        updatedAt: new Date(),
      },
    });
  }

  // Activate campaign
  await db.update(campaigns)
    .set({
      isPaused: false,
      totalLeads: leadsToEnroll.length,
      updatedAt: new Date(),
    })
    .where(eq(campaigns.id, campaignId));

  return NextResponse.json({
    campaign: { ...campaign, isPaused: false, totalLeads: leadsToEnroll.length },
    leadsEnrolled: leadsToEnroll.length,
    conflictsResolved: {
      skipped: conflictResolution === 'skip' ? conflictingLeads.length : 0,
      overridden: conflictResolution === 'override' ? conflictingLeads.length : 0,
      delayed: conflictResolution === 'delay',
    },
    messagesSynced: messagesData.length,
  });
}
```

---

## 3. AIRTABLE SYNC UPDATES

### 3.1 Update Lead Mapper

**File**: `src/lib/airtable/client.ts`

```typescript
// In mapToDatabaseLead() function, add:
kajabiTags: (() => {
  const tags = fields['Kajabi Tags'] || fields['Tags'];
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map(t => String(t).trim());
  if (typeof tags === 'string') return tags.split(',').map(t => t.trim()).filter(Boolean);
  return [];
})(),
```

---

## 4. UI COMPONENTS

### 4.1 CustomCampaignBuilder Component

**File**: `src/components/admin/CustomCampaignBuilder.tsx`

**Features**:
- Multi-step wizard (4 steps)
- Tag selection with live preview
- Message builder (AI + manual)
- Review & activate screen

**State Management**: React Context or Zustand

**Steps**:
1. **Select Leads**: Tag multi-select + live preview
2. **Campaign Settings**: Name, start date, number of messages
3. **Create Messages**: Hybrid builder (AI generation + manual editing)
4. **Review & Activate**: Summary + conflict resolution + activate

### 4.2 TagSelector Component

**File**: `src/components/admin/TagSelector.tsx`

**Features**:
- Multi-select dropdown (react-select)
- Search/filter tags
- Show lead count per tag
- Live preview count updates

**Implementation**:
```typescript
import Select from 'react-select';
import { useQuery } from '@tanstack/react-query';

interface TagOption {
  value: string;
  label: string;  // "Q4 Webinar (127)"
  leadCount: number;
}

export function TagSelector({
  clientId,
  selectedTags,
  onChange,
}: {
  clientId: string;
  selectedTags: string[];
  onChange: (tags: string[]) => void;
}) {
  const { data: tagsData } = useQuery({
    queryKey: ['tags', clientId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/tags?clientId=${clientId}`);
      return res.json();
    },
  });

  const options: TagOption[] = tagsData?.tags.map((t: any) => ({
    value: t.tag,
    label: `${t.tag} (${t.leadCount})`,
    leadCount: t.leadCount,
  })) || [];

  return (
    <Select
      isMulti
      options={options}
      value={options.filter(o => selectedTags.includes(o.value))}
      onChange={(selected) => onChange(selected.map(s => s.value))}
      placeholder="Select tags to filter leads..."
      className="text-gray-900"
    />
  );
}
```

### 4.3 MessageBuilder Component

**File**: `src/components/admin/MessageBuilder.tsx`

**Features**:
- AI generation mode (goal + tone → generate)
- Manual mode (text area + placeholder buttons)
- Character counter (SMS length)
- Placeholder validation
- Live preview with sample data

**Implementation**:
```typescript
export function MessageBuilder({
  message,
  onChange,
  onAIGenerate,
}: {
  message: CampaignMessage;
  onChange: (message: CampaignMessage) => void;
  onAIGenerate: (goal: string, tone: string) => Promise<string>;
}) {
  const [mode, setMode] = useState<'manual' | 'ai'>('ai');
  const [aiGoal, setAIGoal] = useState('');
  const [aiTone, setAITone] = useState<'Professional' | 'Casual' | 'Urgent'>('Professional');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const generated = await onAIGenerate(aiGoal, aiTone);
      onChange({ ...message, body: generated, aiGenerated: true, aiPrompt: aiGoal });
      setMode('manual'); // Switch to manual for editing
    } finally {
      setGenerating(false);
    }
  };

  const insertPlaceholder = (placeholder: string) => {
    // Insert at cursor position
    const cursorPos = textAreaRef.current?.selectionStart || message.body.length;
    const before = message.body.slice(0, cursorPos);
    const after = message.body.slice(cursorPos);
    onChange({ ...message, body: `${before}{{${placeholder}}}${after}` });
  };

  return (
    <div>
      {mode === 'ai' ? (
        <div>
          <input
            value={aiGoal}
            onChange={e => setAIGoal(e.target.value)}
            placeholder="Campaign goal (e.g., Follow up on Q4 webinar)"
          />
          <select value={aiTone} onChange={e => setAITone(e.target.value as any)}>
            <option value="Professional">Professional</option>
            <option value="Casual">Casual</option>
            <option value="Urgent">Urgent</option>
          </select>
          <button onClick={handleGenerate} disabled={generating}>
            {generating ? 'Generating...' : 'Generate with AI'}
          </button>
        </div>
      ) : (
        <div>
          <textarea
            ref={textAreaRef}
            value={message.body}
            onChange={e => onChange({ ...message, body: e.target.value })}
            placeholder="Enter your message..."
          />
          <div className="flex gap-2">
            <button onClick={() => insertPlaceholder('first_name')}>👤 First Name</button>
            <button onClick={() => insertPlaceholder('company')}>🏢 Company</button>
            <button onClick={() => insertPlaceholder('resource_link')}>📎 Resource Link</button>
          </div>
          <p>{message.body.length}/160 chars ({Math.ceil(message.body.length / 160)} SMS)</p>
        </div>
      )}
      <button onClick={() => setMode(mode === 'ai' ? 'manual' : 'ai')}>
        Switch to {mode === 'ai' ? 'Manual' : 'AI'} Mode
      </button>
    </div>
  );
}
```

---

## 5. TESTING STRATEGY

### 5.1 Unit Tests

- [ ] Validate tag filtering query performance
- [ ] Validate placeholder extraction regex
- [ ] Validate message character counting
- [ ] Validate conflict detection logic

### 5.2 Integration Tests

- [ ] Create custom campaign → Verify database state
- [ ] Activate campaign → Verify leads enrolled
- [ ] Activate campaign with conflicts → Verify resolution
- [ ] AI generation → Verify message format

### 5.3 End-to-End Test

**Scenario**: Create & activate custom campaign, verify scheduler picks up leads

**Steps**:
1. Create custom campaign with 2 messages
2. Activate campaign (skip conflicts)
3. Wait 60 seconds (scheduler cycle)
4. Verify first message sent (check smsAudit table)
5. Verify lead's smsSequencePosition = 1
6. Wait for delay + 60 seconds
7. Verify second message sent

---

## 6. DEPLOYMENT CHECKLIST

### Phase 1: Database (1 hour)
- [ ] Run migration: `add-custom-campaigns.sql`
- [ ] Verify indexes created (`\d+ leads`, `\d+ campaigns`)
- [ ] Update TypeScript types (`npm run db:generate`)
- [ ] Restart dev server

### Phase 2: Airtable Sync (1 hour)
- [ ] Update airtable/client.ts with kajabiTags mapping
- [ ] Trigger manual sync: `POST /api/admin/sync`
- [ ] Verify tags populated: `SELECT kajabi_tags FROM leads LIMIT 10;`
- [ ] Check unique tags count: `GET /api/admin/tags`

### Phase 3: API Routes (4 hours)
- [ ] Implement GET /api/admin/tags
- [ ] Implement POST /api/admin/campaigns/preview-leads
- [ ] Implement POST /api/admin/campaigns/generate-message
- [ ] Extend POST /api/admin/campaigns for Custom type
- [ ] Implement POST /api/admin/campaigns/[id]/activate
- [ ] Test all endpoints with Postman/curl

### Phase 4: UI Components (6 hours)
- [ ] Build TagSelector component
- [ ] Build MessageBuilder component
- [ ] Build CustomCampaignBuilder wizard
- [ ] Integrate with existing CampaignForm
- [ ] Add "Custom" campaign type to campaigns page
- [ ] Test UI flow end-to-end

### Phase 5: Scheduler Integration (2 hours)
- [ ] Verify scheduler loads custom messages from SMS_Templates
- [ ] Test with 1 lead in custom campaign
- [ ] Monitor scheduler logs for errors
- [ ] Verify message sent and logged to smsAudit

### Phase 6: Analytics (2 hours)
- [ ] Verify custom campaigns appear in analytics dashboard
- [ ] Test filtering by campaignType = 'Custom'
- [ ] Verify stats (messages sent, responses, bookings)

**Total**: ~16-18 hours (2-3 days)

---

## 7. MONITORING & ALERTS

### Key Metrics
- Custom campaigns created per day
- AI generation success rate (vs manual fallback)
- Lead enrollment success rate
- Conflict resolution distribution (skip/override/delay)
- Scheduler pickup time for custom campaigns

### Alerts
- ⚠️ AI generation failure rate > 10%
- ⚠️ Lead enrollment failure rate > 5%
- ⚠️ Scheduler not picking up custom campaigns (1 hour delay)
- ⚠️ Conflict detection errors

---

## 8. ROLLBACK PLAN

If issues arise in production:

1. **Disable Custom Campaign Creation**:
   ```sql
   -- Temporarily disable all custom campaigns
   UPDATE campaigns SET is_paused = true WHERE campaign_type = 'Custom';
   ```

2. **Revert Schema** (if needed):
   ```sql
   -- Remove new columns (data loss!)
   ALTER TABLE leads DROP COLUMN kajabi_tags;
   ALTER TABLE campaigns DROP COLUMN target_tags;
   ALTER TABLE campaigns DROP COLUMN messages;
   ALTER TABLE campaigns DROP COLUMN start_datetime;
   ```

3. **Remove Custom Templates** (if scheduler breaks):
   ```sql
   DELETE FROM sms_templates WHERE template_type = 'Custom';
   ```

---

## 9. FUTURE ENHANCEMENTS (Post-V1)

- [ ] A/B testing (Custom A vs Custom B variants)
- [ ] Advanced scheduling (specific times per message, not just dates)
- [ ] Conditional logic (if/then branches based on responses)
- [ ] Campaign templates (save/reuse message sequences)
- [ ] Bulk campaign management (pause/delete multiple)
- [ ] Campaign duplication
- [ ] Advanced analytics (cohort analysis, funnel visualization)
- [ ] Multi-message bulk editing
- [ ] Placeholder fallback values (e.g., "there" if {{first_name}} missing)

---

**END OF TECHNICAL SPECIFICATION**
