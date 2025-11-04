# Global Client Selector - Specification

## Current State (PROBLEM)
- Analytics page has its own client selector
- Leads page shows only user's client
- PM page shows only user's client
- SUPER_ADMIN has to reload page or manually add `?clientId=xxx` to URL

## Desired State (SOLUTION)
**One global dropdown in the navbar** that:
1. Shows only for SUPER_ADMIN users
2. Changes ALL pages at once (Leads, PM, Analytics, Dashboard)
3. Persists selection across navigation (localStorage)
4. Shows current client name in navbar
5. ADMIN users don't see it (locked to their client)

---

## Visual Mockup

### Current Navbar (All Users):
```
┌───────────────────────────────────────────────────────────────┐
│ Rebel HQ  Dashboard  Leads  Analytics  PM  Admin  [R] Logout │
└───────────────────────────────────────────────────────────────┘
```

### New Navbar (SUPER_ADMIN Only):
```
┌────────────────────────────────────────────────────────────────────┐
│ Rebel HQ  [▼ UYSP Client]  Dashboard  Leads  Analytics  PM  Admin │
│                                                     [R] Logout      │
└────────────────────────────────────────────────────────────────────┘
                 ↓ (click dropdown)
         ┌───────────────────┐
         │ UYSP Client   ✓   │
         │ Acme Corp         │
         │ TechStart Inc     │
         └───────────────────┘
```

---

## Technical Implementation

### 1. Create Global Client Context

**File**: `/src/contexts/ClientContext.tsx`

```typescript
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface ClientContextType {
  selectedClientId: string | null;
  setSelectedClientId: (id: string) => void;
  isLoading: boolean;
  availableClients: Array<{ id: string; companyName: string }>;
}

const ClientContext = createContext<ClientContextType | null>(null);

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [selectedClientId, setSelectedClientIdState] = useState<string | null>(null);
  const [availableClients, setAvailableClients] = useState<Array<{ id: string; companyName: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session) return;

    // ADMIN users: locked to their client
    if (session.user.role === 'ADMIN') {
      setSelectedClientIdState(session.user.clientId);
      setIsLoading(false);
      return;
    }

    // SUPER_ADMIN: fetch all clients
    if (session.user.role === 'SUPER_ADMIN') {
      fetch('/api/admin/clients')
        .then(r => r.json())
        .then(data => {
          setAvailableClients(data.clients || []);

          // Check localStorage for saved selection
          const saved = localStorage.getItem('selectedClientId');
          if (saved && data.clients.some((c: any) => c.id === saved)) {
            setSelectedClientIdState(saved);
          } else {
            // Default to first client (UYSP)
            const defaultClient = data.clients[0];
            if (defaultClient) {
              setSelectedClientIdState(defaultClient.id);
            }
          }
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch clients:', err);
          setIsLoading(false);
        });
    }
  }, [session]);

  const setSelectedClientId = (id: string) => {
    setSelectedClientIdState(id);
    localStorage.setItem('selectedClientId', id);
  };

  return (
    <ClientContext.Provider value={{ selectedClientId, setSelectedClientId, isLoading, availableClients }}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  const context = useContext(ClientContext);
  if (!context) throw new Error('useClient must be used within ClientProvider');
  return context;
}
```

### 2. Add Client Selector to Navbar

**File**: `/src/components/navbar/ClientSelector.tsx`

```typescript
'use client';

import { useClient } from '@/contexts/ClientContext';
import { useSession } from 'next-auth/react';
import { theme } from '@/theme';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

export function ClientSelector() {
  const { data: session } = useSession();
  const { selectedClientId, setSelectedClientId, availableClients } = useClient();
  const [isOpen, setIsOpen] = useState(false);

  // Only show for SUPER_ADMIN
  if (session?.user?.role !== 'SUPER_ADMIN') return null;

  const selectedClient = availableClients.find(c => c.id === selectedClientId);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg ${theme.components.button.secondary} hover:bg-gray-700 transition`}
      >
        <span className={`text-sm font-medium ${theme.core.white}`}>
          {selectedClient?.companyName || 'Select Client'}
        </span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden">
            {availableClients.map(client => (
              <button
                key={client.id}
                onClick={() => {
                  setSelectedClientId(client.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 hover:bg-gray-700 transition flex items-center justify-between ${
                  selectedClientId === client.id ? 'bg-gray-700' : ''
                }`}
              >
                <span className={theme.core.white}>{client.companyName}</span>
                {selectedClientId === client.id && (
                  <span className={theme.accents.tertiary.class}>✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

### 3. Update Navbar to Include Selector

**File**: `/src/components/navbar/Navbar.tsx`

Add after logo, before nav items:

```typescript
import { ClientSelector } from './ClientSelector';

// Inside Navbar component, after logo:
<div className="flex items-center gap-6">
  <Link href="/leads" className="flex items-center gap-2">
    <div className={`text-2xl font-bold ${theme.core.white}`}>
      Rebel <span className={theme.accents.primary.class}>HQ</span>
    </div>
  </Link>

  {/* SUPER_ADMIN Client Selector */}
  <ClientSelector />
</div>
```

### 4. Update All Pages to Use Global Client

**Pattern for every page**:

```typescript
// OLD:
const [clientId, setClientId] = useState(session?.user?.clientId);

// NEW:
import { useClient } from '@/contexts/ClientContext';
const { selectedClientId } = useClient();
```

**Files to update**:
- `/src/app/(client)/leads/page.tsx`
- `/src/app/(client)/project-management/page.tsx`
- `/src/app/(client)/analytics/page.tsx`
- `/src/app/(client)/dashboard/page.tsx`

### 5. Update API Calls

**All fetch calls change from**:
```typescript
fetch(`/api/leads`)
```

**To**:
```typescript
fetch(`/api/leads?clientId=${selectedClientId}`)
```

### 6. Update React Query Hooks

**File**: `/src/hooks/useProjectData.ts`

```typescript
export function useProjectData() {
  const { selectedClientId } = useClient();

  return useQuery({
    queryKey: ['project', selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) throw new Error('No client selected');
      const response = await fetch(`/api/clients/${selectedClientId}/project`);
      if (!response.ok) throw new Error('Failed to fetch project data');
      return response.json();
    },
    enabled: !!selectedClientId,
  });
}
```

---

## Permissions Matrix

| Role         | Can See Selector | Sees Data For        | Can Switch Clients |
|--------------|------------------|----------------------|--------------------|
| SUPER_ADMIN  | ✅ Yes           | Selected client      | ✅ Yes             |
| ADMIN        | ❌ No            | Their client only    | ❌ No              |
| CLIENT       | ❌ No            | Their client only    | ❌ No              |

---

## Benefits

### For SUPER_ADMIN:
- ✅ Switch clients instantly without URL hacks
- ✅ One dropdown affects ALL pages
- ✅ Selection persists across page navigation
- ✅ Can quickly compare multiple clients

### For System:
- ✅ Cleaner URLs (no `?clientId=xxx` needed)
- ✅ Single source of truth for selected client
- ✅ Better UX (clear which client you're viewing)
- ✅ Safer (can't accidentally see wrong client's data)

---

## Edge Cases to Handle

### 1. SUPER_ADMIN has no clients
- Show "No clients found" in dropdown
- Show empty state on all pages

### 2. Selected client is deleted
- Detect on page load
- Clear localStorage
- Default to first available client

### 3. ADMIN tries to access another client's data
- API returns 403
- UI shows "Access Denied"

### 4. localStorage cleared
- Default to first client (UYSP)
- Or remember last session client from database

---

## Migration Steps

1. ✅ Create `ClientContext.tsx`
2. ✅ Add `ClientProvider` to root layout
3. ✅ Create `ClientSelector` component
4. ✅ Add selector to Navbar
5. ⏳ Update Leads page to use `useClient()`
6. ⏳ Update PM page to use `useClient()`
7. ⏳ Update Analytics page to use `useClient()`
8. ⏳ Update Dashboard page to use `useClient()`
9. ⏳ Update all API endpoints to accept `clientId` param
10. ⏳ Test switching between clients
11. ⏳ Test ADMIN can't access other clients
12. ✅ Deploy

---

## Testing Checklist

**As SUPER_ADMIN:**
- [ ] See client dropdown in navbar
- [ ] Click dropdown → See all clients
- [ ] Select UYSP → All pages show UYSP data
- [ ] Navigate to Leads → Still shows UYSP
- [ ] Navigate to PM → Still shows UYSP
- [ ] Switch to different client → All pages update
- [ ] Refresh page → Selected client persists
- [ ] Logout → Login → Last client remembered

**As ADMIN:**
- [ ] Don't see client dropdown
- [ ] Only see own client's data
- [ ] Can't access other client data via URL

---

## Timeline

**Estimated time**: 2-3 hours

1. Create context & provider: 30 min
2. Create selector component: 30 min
3. Add to navbar: 15 min
4. Update 4 pages to use context: 1 hour
5. Update API endpoints: 30 min
6. Testing: 30 min

---

## Alternative: URL-Based

Instead of localStorage, use URL:
- `/leads?client=uuid`
- Pros: Shareable URLs
- Cons: Messier, harder to maintain

**Recommendation**: Use context + localStorage (cleaner UX)

---

## Future Enhancements

1. **Recently Viewed Clients**: Show top 3 most-viewed
2. **Quick Switch**: Keyboard shortcut (Cmd+K → Select client)
3. **Client Colors**: Each client has a color, navbar background changes
4. **Multi-Select**: Compare 2 clients side-by-side (advanced)

---

**Ready to implement? Should take ~2-3 hours to roll out across the app.**
