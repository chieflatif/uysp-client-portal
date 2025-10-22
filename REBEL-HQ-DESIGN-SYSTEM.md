# Rebel HQ Design System & Tech Stack Guide

**Purpose**: Comprehensive guide for building Rebel HQ applications with consistent design, modern frameworks, and cutting-edge tools.

**Date**: 2025-10-21  
**Version**: 1.0  
**Reference Application**: UYSP Lead Qualification Client Portal

---

## 🎨 Design System: "Oceanic Theme"

### Core Color Palette

**Dark Background Foundation:**
- Primary BG: `#111827` (bg-gray-900) - Main background
- Card BG: `#1f2937` (bg-gray-800) - Elevated surfaces
- Border: `#374151` (border-gray-700) - Subtle dividers

**Text Hierarchy:**
- Headlines: `#ffffff` (text-white) - Main headings, important text
- Body Text: `#d1d5db` (text-gray-300) - Readable body copy
- Muted Text: `#9ca3af` (text-gray-400) - Secondary info, labels

### Oceanic Accent System (CRITICAL)

This is what makes Rebel HQ visually distinctive. Use **exactly** this hierarchy:

**1. Primary Accent (Pink/Red) - `#be185d`**
- **Usage**: Most important emphasis - single keyword or concept
- **Class**: `text-pink-700`
- **Example**: "Admin **Dashboard**" → "Dashboard" is pink-700
- **Background**: `bg-pink-700` for buttons, badges

**2. Secondary Accent (Indigo) - `#4f46e5`**
- **Usage**: Second-level emphasis - key benefits, interactive elements
- **Class**: `text-indigo-600`
- **Example**: Button states, selected items, secondary CTAs
- **Background**: `bg-indigo-600`

**3. Tertiary Accent (Cyan) - `#22d3ee`**
- **Usage**: Brightest accent - final points, attention-grabbing details
- **Class**: `text-cyan-400`
- **Example**: Labels, stats, hover states, links
- **Background**: `bg-cyan-400`

### Accent Usage Pattern

**In a typical header:**
```tsx
<h1 className="text-4xl font-bold text-white">
  <span className="text-pink-700">Admin</span> Dashboard
</h1>
<p className="text-gray-300">System administration and client management</p>
```

**Result**: "Admin" is pink (primary), "Dashboard" is white, description is gray-300

### Status Colors (Beyond Oceanic Palette)

Use semantic colors for status indicators:
- **Success/Active**: `text-green-400` / `bg-green-500` - #10b981
- **Warning/Paused**: `text-orange-400` / `bg-orange-500` - #f97316
- **Error/Inactive**: `text-red-400` / `bg-red-500` - #ef4444
- **Info/Neutral**: `text-blue-400` / `bg-blue-500` - #3b82f6
- **Purple (Unclaimed)**: `text-purple-400` / `bg-purple-500` - #a855f7

---

## 🧱 Component Design Patterns

### Buttons

**Primary Button (Pink - Main CTA):**
```tsx
<button className="bg-pink-700 hover:bg-pink-800 text-white font-semibold py-2 px-4 rounded transition">
  Add Client
</button>
```

**Secondary Button (Indigo):**
```tsx
<button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded transition">
  Add User
</button>
```

**Success/Action Button (Green):**
```tsx
<button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition">
  Sync Data
</button>
```

**Warning Button (Orange):**
```tsx
<button className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded transition">
  Pause Campaigns
</button>
```

**Danger Button (Red):**
```tsx
<button className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition">
  Deactivate Client
</button>
```

**Ghost Button (Outlined):**
```tsx
<button className="text-cyan-400 hover:text-cyan-300 border border-cyan-400 hover:border-cyan-300 font-semibold py-2 px-4 rounded transition">
  Cancel
</button>
```

### Cards

**Standard Card:**
```tsx
<div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
  {/* Content */}
</div>
```

**Card with Color Bar (Left Border):**
```tsx
<div className="bg-gray-800 border border-gray-700 rounded-lg p-6 border-l-4 border-l-cyan-400">
  <p className="text-xs text-cyan-400 uppercase tracking-wider mb-1 font-semibold">
    Total Leads
  </p>
  <p className="text-3xl font-bold text-white">
    {count.toLocaleString()}
  </p>
</div>
```

### Form Inputs

**Text Input:**
```tsx
<input
  type="text"
  className="bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded px-4 py-2 focus:outline-none focus:border-cyan-400"
  placeholder="Enter value..."
/>
```

**Select Dropdown:**
```tsx
<select className="bg-gray-800 border border-gray-700 text-white rounded px-4 py-2 focus:outline-none focus:border-cyan-400">
  <option value="">Choose...</option>
  <option value="1">Option 1</option>
</select>
```

### Tables

**Modern Data Table:**
```tsx
<div className="overflow-x-auto">
  <table className="w-full">
    <thead>
      <tr className="border-b border-gray-700">
        <th className="text-left py-3 px-4 text-cyan-400 text-xs uppercase tracking-wider font-semibold">
          Column Name
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-700">
      <tr className="hover:bg-gray-800 transition">
        <td className="py-3 px-4 font-medium text-white">
          Data
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### Status Badges

**Active Status:**
```tsx
<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold">
  <CheckCircle2 className="w-3 h-3" />
  Active
</span>
```

**Inactive Status:**
```tsx
<span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold">
  <XCircle className="w-3 h-3" />
  Inactive
</span>
```

### Alert/Message Boxes

**Success Message:**
```tsx
<div className="p-4 rounded-lg bg-green-900/20 border border-green-600/50 flex items-start gap-3">
  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
  <div className="flex-1">
    <p className="text-green-300 font-medium">Operation successful!</p>
  </div>
  <button onClick={close} className="text-green-400 hover:text-green-300">
    <XCircle className="w-5 h-5" />
  </button>
</div>
```

**Error Message:**
```tsx
<div className="p-4 rounded-lg bg-red-900/20 border border-red-600/50 flex items-start gap-3">
  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
  <div className="flex-1">
    <p className="text-red-300 font-medium">Error occurred</p>
  </div>
  <button onClick={close} className="text-red-400 hover:text-red-300">
    <XCircle className="w-5 h-5" />
  </button>
</div>
```

### Progress Bars

**Real-time Progress (like sync):**
```tsx
<div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
  <div 
    className="h-full bg-green-500 transition-all duration-300"
    style={{ width: `${percentage}%` }}
  ></div>
</div>
<div className="flex justify-between text-sm mt-2">
  <span className="text-gray-300">Processed: {count}</span>
  <span className="text-white">{percentage}%</span>
</div>
```

### Metric Cards (Dashboard Stats)

**5-Metric Row Pattern:**
```tsx
<div className="grid grid-cols-5 gap-3">
  <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
    <p className="text-xs text-cyan-400 uppercase font-semibold mb-2">Total Leads</p>
    <p className="text-2xl font-bold text-white">{total.toLocaleString()}</p>
  </div>
  <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
    <p className="text-xs text-green-400 uppercase font-semibold mb-2">Active</p>
    <p className="text-2xl font-bold text-green-400">{active.toLocaleString()}</p>
  </div>
  {/* ... more metrics */}
</div>
```

---

## 🛠️ Tech Stack

### Frontend Framework

**Next.js 15.5.6** (App Router)
- **Why**: Server-side rendering, file-based routing, API routes, React Server Components
- **Key Features Used**:
  - App Router (`src/app/` directory structure)
  - Server Components for static pages
  - Client Components (`'use client'`) for interactive pages
  - API Routes (`route.ts` files)
  - Dynamic routes (`[id]/page.tsx`)
  - Route groups (`(client)/` for layout nesting)
  - Middleware for authentication

**React 18**
- **Hooks Used**: `useState`, `useEffect`, `useRouter`, `useSession`, `useParams`
- **Patterns**: Functional components, TypeScript interfaces, controlled forms

### Styling

**Tailwind CSS** (Utility-First)
- **Config**: Uses JIT mode for optimal performance
- **Custom Classes**: Defined in `theme.ts` for consistency
- **Dark Mode**: Default (all components dark theme)
- **Responsive**: Mobile-first with `md:`, `lg:` breakpoints

**Key Tailwind Patterns:**
```tsx
// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

// Hover states
<button className="bg-pink-700 hover:bg-pink-800 transition">

// Conditional classes
<span className={`${isActive ? 'text-green-400' : 'text-red-400'}`}>

// Opacity variants for backgrounds
<div className="bg-green-900/20 border border-green-600/50">
```

### Icons

**Lucide React** (Modern, Consistent Icons)
- **Why**: Clean, consistent, tree-shakeable, TypeScript support
- **Size Convention**: `w-5 h-5` for buttons, `w-4 h-4` for inline, `w-8 h-8` for large

**Common Icons Used:**
```tsx
import { 
  Shield,        // Admin, security
  Users,         // User management
  Building2,     // Clients, companies
  Activity,      // Analytics, sync, activity
  Plus,          // Add actions
  Loader2,       // Loading spinners
  AlertCircle,   // Errors
  CheckCircle2,  // Success
  XCircle,       // Close, cancel, inactive
  Database,      // Database health
  Pause,         // Pause actions
  Trash2,        // Delete, deactivate
  Eye,           // View
  ArrowLeft,     // Back navigation
} from 'lucide-react';
```

### Authentication

**NextAuth.js** (Auth for Next.js)
- **Session Management**: JWT-based sessions
- **Providers**: Credentials provider (email/password)
- **Roles**: SUPER_ADMIN, ADMIN, CLIENT (role-based access control)
- **Hooks**: `useSession()` for client components
- **Server**: `getServerSession(authOptions)` for API routes

**Auth Pattern:**
```tsx
// Client component
const { data: session, status } = useSession();

if (status === 'loading') return <Loading />;
if (status === 'unauthenticated') router.push('/login');
if (session.user.role !== 'SUPER_ADMIN') router.push('/dashboard');

// API route
const session = await getServerSession(authOptions);
if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
if (session.user.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
```

### Database

**PostgreSQL** (Render-hosted)
- **ORM**: Drizzle ORM (Modern, TypeScript-first, type-safe)
- **Schema**: Defined in `src/lib/db/schema.ts`
- **Migrations**: Schema changes tracked in code

**Drizzle ORM Patterns:**
```tsx
import { db } from '@/lib/db';
import { clients, leads } from '@/lib/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// Query
const client = await db.query.clients.findFirst({
  where: eq(clients.id, clientId),
});

// Insert
await db.insert(clients).values({ companyName, email }).returning();

// Update
await db.update(clients).set({ isActive: false }).where(eq(clients.id, id));

// Aggregation
const stats = await db
  .select({
    total: sql<number>`count(*)`,
    active: sql<number>`sum(case when ${leads.processingStatus} != 'Paused' then 1 else 0 end)`,
  })
  .from(leads)
  .where(eq(leads.clientId, clientId));
```

### Data Integration

**Airtable** (External Data Source)
- **Purpose**: Source of truth for leads, campaigns, messages
- **Pattern**: Sync from Airtable → PostgreSQL for fast reads
- **Client**: Custom `AirtableClient` class in `src/lib/airtable/client.ts`
- **Multi-tenant**: Each client has their own Airtable base

**Sync Pattern:**
```tsx
// Fetch from Airtable
const airtable = getAirtableClient(client.airtableBaseId);
await airtable.streamAllLeads(async (record) => {
  const leadData = airtable.mapToDatabaseLead(record, clientId);
  // Insert/update in PostgreSQL
});
```

### Validation

**Zod** (TypeScript Schema Validation)
- **Why**: Type-safe runtime validation, great error messages
- **Usage**: Validate API request bodies before processing

**Zod Pattern:**
```tsx
import { z } from 'zod';

const createClientSchema = z.object({
  companyName: z.string().min(1, 'Company name required'),
  email: z.string().email('Valid email required'),
  airtableBaseId: z.string().regex(/^app[a-zA-Z0-9]{14}$/, 'Invalid Airtable Base ID'),
});

// In API route
const validation = createClientSchema.safeParse(body);
if (!validation.success) {
  return NextResponse.json(
    { error: 'Validation failed', details: validation.error.flatten() },
    { status: 400 }
  );
}
```

---

## 📊 Analytics & Visualization Patterns

### Dashboard Layout Structure

**3-Tier Information Hierarchy:**

1. **Top Stats Row** (4-column grid)
   - Total clients
   - Total users
   - Total leads
   - Average per client

2. **Data Table** (Clickable rows for drilldown)
   - Clients list
   - Leads list
   - Campaigns list

3. **Breakdown Cards** (Grid of detail cards)
   - Per-client stats
   - Per-campaign stats

### Metric Card Design

**Large Number Display:**
```tsx
<div className="bg-gray-800 border border-gray-700 rounded-lg p-6 border-l-4 border-l-pink-700">
  <div className="flex items-start justify-between">
    <div>
      <p className="text-xs text-pink-700 uppercase tracking-wider mb-1 font-semibold">
        Total Clients
      </p>
      <p className="text-3xl font-bold text-white">
        {totalClients}
      </p>
      <p className="text-xs text-gray-300 mt-1">
        {activeClients} active
      </p>
    </div>
    <Building2 className="w-6 h-6 text-pink-700" />
  </div>
</div>
```

### Time Period Filtering

**Tab-Style Period Selector:**
```tsx
<div className="flex gap-2">
  <button
    onClick={() => setPeriod('all')}
    className={`px-3 py-1 rounded text-sm font-semibold transition ${
      period === 'all'
        ? 'bg-cyan-600 text-white'
        : 'text-cyan-400 hover:text-cyan-300'
    }`}
  >
    All Time
  </button>
  <button
    onClick={() => setPeriod('7d')}
    className={`px-3 py-1 rounded text-sm font-semibold transition ${
      period === '7d'
        ? 'bg-cyan-600 text-white'
        : 'text-cyan-400 hover:text-cyan-300'
    }`}
  >
    Last 7 Days
  </button>
  <button
    onClick={() => setPeriod('30d')}
    className={`px-3 py-1 rounded text-sm font-semibold transition ${
      period === '30d'
        ? 'bg-cyan-600 text-white'
        : 'text-cyan-400 hover:text-cyan-300'
    }`}
  >
    Last 30 Days
  </button>
</div>
```

### Real-Time Sync Progress

**Progress Bar with Live Updates:**
```tsx
{syncing && (
  <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
    <h3 className="text-lg font-bold text-white mb-4">Syncing Data from Airtable...</h3>
    <div className="space-y-3">
      <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
        <div 
          className="h-full bg-green-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-300">Fetched: {fetched.toLocaleString()}</span>
        <span className="text-white">{percentage}%</span>
        <span className="text-gray-300">Inserted: {inserted} | Updated: {updated}</span>
      </div>
    </div>
  </div>
)}
```

**Implementation**: Use Server-Sent Events (SSE) for streaming updates from backend to frontend.

---

## 🏗️ Architecture Patterns

### API Route Structure

**Standard CRUD API Route:**
```tsx
// src/app/api/admin/clients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { clients } from '@/lib/db/schema';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  // 1. Authentication
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Authorization (role-based)
  if (session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 3. Validation (Zod)
  const schema = z.object({ /* ... */ });
  const validation = schema.safeParse(await request.json());
  if (!validation.success) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
  }

  // 4. Business Logic
  const result = await db.insert(clients).values(validation.data).returning();

  // 5. Return Success
  return NextResponse.json({ success: true, data: result }, { status: 201 });
}
```

### Page Structure

**Client Component Pattern:**
```tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { theme } from '@/theme';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Authentication check
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    fetchData();
  }, [status, session, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/endpoint');
      if (res.ok) {
        const data = await res.json();
        setData(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className={`min-h-screen ${theme.core.darkBg} p-8`}>
      {/* Page content */}
    </div>
  );
}
```

### Loading States

**Centered Spinner:**
```tsx
<div className="min-h-screen bg-gray-900 flex items-center justify-center">
  <div className="flex flex-col items-center gap-4">
    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
    <p className="text-gray-300 text-sm">Loading...</p>
  </div>
</div>
```

**Inline Loading:**
```tsx
{loading ? (
  <div className="flex items-center gap-2">
    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
    <span className="text-gray-300">Loading...</span>
  </div>
) : (
  <DataDisplay />
)}
```

---

## 📁 Project Structure

```
uysp-client-portal/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Auth route group
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (client)/            # Client route group (with navbar)
│   │   │   ├── layout.tsx       # Shared layout with nav
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── leads/page.tsx
│   │   │   ├── analytics/page.tsx
│   │   │   └── admin/
│   │   │       ├── page.tsx     # Main admin dashboard
│   │   │       └── clients/[id]/page.tsx  # Client detail
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── admin/
│   │   │   │   ├── clients/route.ts
│   │   │   │   ├── clients/[id]/route.ts
│   │   │   │   ├── clients/[id]/campaigns/route.ts
│   │   │   │   ├── sync/route.ts
│   │   │   │   └── sync-stream/route.ts  # Real-time progress
│   │   │   └── leads/route.ts
│   │   ├── layout.tsx           # Root layout
│   │   └── page.tsx             # Landing page
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts         # Database connection
│   │   │   └── schema.ts        # Drizzle schema
│   │   ├── auth/
│   │   │   └── config.ts        # NextAuth config
│   │   └── airtable/
│   │       └── client.ts        # Airtable API client
│   ├── components/              # Reusable components
│   └── theme.ts                 # Design system constants
├── drizzle/                     # Database migrations
├── tests/                       # Test files
├── public/                      # Static assets
├── .env.local                   # Environment variables
├── tailwind.config.ts           # Tailwind configuration
├── tsconfig.json                # TypeScript config
└── package.json                 # Dependencies
```

---

## 📦 Key Dependencies

```json
{
  "dependencies": {
    "next": "15.5.6",
    "react": "^18.3.0",
    "next-auth": "^4.24.0",
    "drizzle-orm": "^0.36.0",
    "postgres": "^3.4.0",
    "zod": "^3.23.0",
    "lucide-react": "^0.462.0"
  },
  "devDependencies": {
    "@types/react": "^18",
    "@types/node": "^20",
    "typescript": "^5",
    "tailwindcss": "^3.4.0",
    "drizzle-kit": "^0.28.0"
  }
}
```

---

## 🎯 Design Principles

### 1. Dark-First Design
- All interfaces use dark mode by default
- High contrast for readability
- Oceanic accents provide visual hierarchy

### 2. Information Density
- Tables show maximum data without scrolling
- Cards use compact but readable layouts
- Responsive breakpoints optimize for screen size

### 3. Visual Hierarchy
- Pink (primary) → Indigo (secondary) → Cyan (tertiary)
- White headlines → Gray body text
- Icons reinforce meaning

### 4. Action Clarity
- Large, prominent buttons for primary actions
- Color-coded by action type (green=sync, orange=pause, red=delete)
- Loading states show progress
- Success/error messages are clear and actionable

### 5. Real-Time Updates
- Live progress bars for long operations
- Auto-refresh after mutations
- Optimistic UI updates where appropriate

---

## 💡 Advanced Patterns Used

### Server-Sent Events (SSE) for Streaming

**Backend (API Route):**
```tsx
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Send progress updates
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
        type: 'progress', 
        percentage: 50, 
        count: 1000 
      })}\n\n`));
      
      // Send completion
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
        type: 'complete' 
      })}\n\n`));
      
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

**Frontend (React Component):**
```tsx
const handleSync = async () => {
  const response = await fetch('/api/sync-stream', { method: 'POST', body: JSON.stringify({ id }) });
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        if (data.type === 'progress') {
          setProgress(data.percentage);
        } else if (data.type === 'complete') {
          setComplete(true);
        }
      }
    }
  }
};
```

### Batch Database Operations

**Instead of:**
```tsx
// SLOW - One query per record
for (const record of records) {
  await db.insert(leads).values(record);
}
```

**Use:**
```tsx
// FAST - Batch insert
await db.insert(leads).values(records);

// FAST - Batch with conflict handling
const toInsert = [];
const toUpdate = [];

const existing = await db.query.leads.findMany({
  where: inArray(leads.airtableRecordId, recordIds),
});

const existingMap = new Map(existing.map(e => [e.airtableRecordId, e]));

for (const record of records) {
  if (existingMap.has(record.airtableRecordId)) {
    toUpdate.push(record);
  } else {
    toInsert.push(record);
  }
}

if (toInsert.length > 0) await db.insert(leads).values(toInsert);
for (const item of toUpdate) {
  await db.update(leads).set(item).where(eq(leads.id, item.id));
}
```

### Multi-Tenant Data Isolation

**Pattern**: Each client has separate Airtable base, data isolated by `clientId`

```tsx
// Always filter by client
const leads = await db.query.leads.findMany({
  where: eq(leads.clientId, session.user.clientId),
});

// ADMINs can see all clients
if (session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN') {
  // Can query across clients
} else {
  // Must filter to their client only
}
```

---

## 🎨 Typography Scale

**Headings:**
- H1: `text-4xl font-bold` (36px)
- H2: `text-xl font-bold` (20px)
- H3: `text-lg font-bold` (18px)

**Body:**
- Large: `text-base` (16px)
- Standard: `text-sm` (14px)
- Small: `text-xs` (12px)

**Labels:**
- Uppercase: `text-xs uppercase tracking-wider font-semibold`

---

## 🔧 Development Tools

**TypeScript**: Strict mode, full type safety
**ESLint**: Code quality and consistency
**Prettier**: Code formatting (if configured)
**Drizzle Kit**: Database migrations and introspection

---

## 📋 Quick Reference Checklist

When building a new Rebel HQ application:

- [ ] Use Next.js 15+ with App Router
- [ ] Install: next-auth, drizzle-orm, zod, lucide-react, tailwindcss
- [ ] Copy `theme.ts` for consistent styling
- [ ] Use dark mode (`bg-gray-900`, `bg-gray-800`, `border-gray-700`)
- [ ] Follow Oceanic accent hierarchy (Pink → Indigo → Cyan)
- [ ] Implement authentication with role-based access
- [ ] Use Drizzle ORM for database queries
- [ ] Validate with Zod
- [ ] Add loading states with Loader2 icon
- [ ] Show success/error messages (green/red alert boxes)
- [ ] Use metric cards for dashboard stats
- [ ] Implement real-time updates for long operations
- [ ] Make tables clickable for drilldown
- [ ] Add time period filtering for analytics
- [ ] Use semantic status colors (green=active, orange=paused, red=inactive)
- [ ] Large, prominent action buttons with icons
- [ ] Batch database operations for performance

---

## 🎯 Example: Building a New Dashboard

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Activity, TrendingUp, Users, Loader2 } from 'lucide-react';
import { theme } from '@/theme';

export default function AnalyticsDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (session) fetchStats();
  }, [status, session, period]);

  const fetchStats = async () => {
    setLoading(true);
    const res = await fetch(`/api/analytics?period=${period}`);
    if (res.ok) setStats(await res.json());
    setLoading(false);
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${theme.core.darkBg} flex items-center justify-center`}>
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.core.darkBg} p-8`}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className={`text-4xl font-bold ${theme.core.white}`}>
            <span className={theme.accents.primary.class}>Analytics</span> Dashboard
          </h1>
          <p className={theme.core.bodyText}>Real-time performance metrics</p>
        </div>

        {/* Time Period Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('7d')}
            className={`px-3 py-1 rounded text-sm font-semibold transition ${
              period === '7d' ? 'bg-cyan-600 text-white' : theme.components.button.ghost
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setPeriod('30d')}
            className={`px-3 py-1 rounded text-sm font-semibold transition ${
              period === '30d' ? 'bg-cyan-600 text-white' : theme.components.button.ghost
            }`}
          >
            Last 30 Days
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`${theme.components.card} border-l-4 border-l-cyan-400`}>
            <p className="text-xs text-cyan-400 uppercase tracking-wider mb-1 font-semibold">
              Total Conversions
            </p>
            <p className="text-3xl font-bold text-white">
              {stats.conversions.toLocaleString()}
            </p>
          </div>
          {/* More stats */}
        </div>

        {/* Data Table */}
        <div className={theme.components.card}>
          <h2 className={`text-xl font-bold ${theme.core.white} mb-4`}>
            Campaign <span className={theme.accents.primary.class}>Performance</span>
          </h2>
          <table className="w-full">
            {/* Table content */}
          </table>
        </div>
      </div>
    </div>
  );
}
```

---

## 🚀 Getting Started with This Guide

1. **Copy the theme file**: Use `theme.ts` exactly as shown
2. **Install dependencies**: All packages listed above
3. **Follow component patterns**: Cards, buttons, tables - use the exact class patterns
4. **Use the accent hierarchy**: Pink > Indigo > Cyan
5. **Implement auth first**: Use NextAuth with role-based access
6. **Build API routes**: Authentication → Authorization → Validation → Logic → Response
7. **Add loading states**: Every async operation needs a loading UI
8. **Test with real data**: Use actual PostgreSQL and Airtable

---

**This guide contains everything needed to build a Rebel HQ application that looks and feels identical to the UYSP portal.**





