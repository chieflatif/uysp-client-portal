# Multi-Tenant Airtable Architecture Analysis

**Question**: Should we use one Airtable base for all clients, or separate bases per client?  
**Date**: 2025-10-21  
**Status**: Decision Required

---

## 🏗️ OPTION A: Separate Airtable Base Per Client (CURRENT)

### How It Works

```
Client 1 (UYSP)
├─ Airtable Base: app4wIsBfpJTg7pWS
├─ Leads table: 11,046 UYSP leads
├─ n8n workflows: UYSP-specific
└─ PostgreSQL: client_id = UYSP_ID

Client 2 (Acme Corp)
├─ Airtable Base: appXXXXXXXXXXXXXX (different base)
├─ Leads table: Acme's leads
├─ n8n workflows: Acme-specific
└─ PostgreSQL: client_id = ACME_ID

Client 3 (TechCo)
├─ Airtable Base: appYYYYYYYYYYYYYY (different base)
├─ Leads table: TechCo's leads
├─ n8n workflows: TechCo-specific
└─ PostgreSQL: client_id = TECHCO_ID
```

### Pros ✅

**1. Perfect Data Isolation**
- Each client's data physically separated
- No risk of data leakage
- Client A can't accidentally see Client B's data
- Deleting a client = delete their Airtable base

**2. Independent Workflows**
- Each client has custom n8n workflows
- Different SMS campaigns per client
- Different enrichment logic per client
- Client-specific automations

**3. Customizable Schema**
- Client A needs field X, Client B doesn't
- Add/remove fields per client
- Different campaign structures
- No "one size fits all" schema problems

**4. Security & Compliance**
- Clear data ownership
- Easy to export client's data (just export their base)
- GDPR deletion simple (delete base)
- Audit trail per client

**5. Performance**
- Each base stays smaller (<50k records)
- Faster queries
- No cross-client filtering needed
- Airtable performs better with smaller bases

### Cons ❌

**1. Management Overhead**
- Need to create new Airtable base for each client
- Duplicate n8n workflows per client
- More bases to monitor
- More webhooks to configure

**2. Cost**
- Airtable pricing per workspace/base
- Multiple bases might cost more
- But: Each client pays for their own infrastructure

**3. Sync Complexity**
- Need to sync from multiple bases
- Track which base belongs to which client
- Loop through all clients when syncing

**4. n8n Duplication**
- Same workflow copied per client
- Changes need to be applied to all copies
- Version control harder

---

## 🏗️ OPTION B: Single Airtable Base for All Clients (NEW)

### How It Works

```
One Airtable Base: appALLCLIENTS123
├─ Leads table:
│  ├─ client_id column (Link to Clients table)
│  ├─ UYSP leads (11,046 records)
│  ├─ Acme leads (5,000 records)
│  └─ TechCo leads (8,000 records)
├─ Clients table:
│  ├─ UYSP (record)
│  ├─ Acme (record)
│  └─ TechCo (record)
└─ Campaigns table:
   ├─ Linked to Client
   └─ Linked to Leads

PostgreSQL mirrors structure:
├─ clients table
├─ leads table (with client_id)
└─ Same data, synced
```

### Pros ✅

**1. Unified Management**
- One base to manage
- One set of n8n workflows (with client_id parameter)
- One sync process
- Easier to maintain

**2. Cross-Client Analytics**
- Compare performance across clients
- Benchmark campaigns
- Aggregate reporting
- System-wide insights

**3. Shared Resources**
- One SMS template library (shared)
- One enrichment workflow (shared)
- One AI agent configuration
- Efficiency gains

**4. Simpler Sync**
- Sync once from one base
- All clients updated together
- No need to loop through bases

**5. Cost Efficiency**
- One Airtable workspace
- One set of automations
- Potentially cheaper at scale

### Cons ❌

**1. Data Isolation Risk** ⚠️ CRITICAL
- All client data in one base
- Risk of showing Client A's leads to Client B
- Requires bulletproof filtering everywhere
- One bug = data leakage

**2. Schema Conflicts**
- Client A needs field X, Client B doesn't
- "One size fits all" schema
- Can't customize per client
- Field bloat (many unused fields per client)

**3. Performance at Scale**
- Single base with 100k+ leads (all clients combined)
- Slower queries
- Airtable limits: 50k records per base (would need Pro plan)
- Views become complex with filters

**4. Security Concerns**
- Airtable API key gives access to ALL clients
- Can't revoke access per client
- Data breach affects everyone
- Harder to audit who accessed what

**5. Client Onboarding/Offboarding**
- Can't "delete a client" cleanly
- Need to soft-delete (client_id filter)
- Data stays in base forever
- Export for one client = filter huge table

---

## 🎯 RECOMMENDATION: Separate Bases Per Client ✅

### Why This Is The Right Choice

**1. Security First**
- SaaS rule: Physical data separation when possible
- Each client's data in their own "container"
- Zero risk of cross-client data leakage
- Clean deletion when client churns

**2. Customization**
- Enterprise clients need custom fields
- Startup clients need basic fields
- Can't force same schema on all
- Separate bases = separate schemas

**3. Scalability**
- Each base stays under 50k records
- Performance stays good
- Can always add more clients (just create new base)
- No "one base limit" problem

**4. Compliance**
- GDPR "right to deletion" = delete their base
- Data export = export their base
- Audit trail per client
- Client A can't sue because they saw Client B's data

**5. Cost Model**
- Client pays for their infrastructure
- Easy to charge per client
- Their Airtable base = their cost
- Scales naturally

### How to Manage Multiple Bases Efficiently

**Problem**: Don't want to duplicate n8n workflows 100 times

**Solution**: **Template Workflows with Client Parameter**

#### n8n Workflow Pattern (One Workflow, Multiple Clients)

```javascript
// Main workflow: "Lead Enrichment (Multi-Client)"

1. HTTP Webhook receives:
   {
     clientId: "UYSP_ID",
     airtableBaseId: "app4wIsBfpJTg7pWS",
     leadData: { ... }
   }

2. Set Base ID dynamically:
   - Airtable node uses: {{ $json.airtableBaseId }}
   - Not hardcoded!

3. Lookup lead in client's base:
   - GET from base: {{ $json.airtableBaseId }}
   - Table: "Leads"

4. Send to Clay for enrichment

5. Write back to client's base:
   - UPDATE base: {{ $json.airtableBaseId }}
   - Table: "Leads"

6. Notify portal:
   - POST /api/leads/sync-complete
   - { clientId, leadId, enrichedData }
```

**Key**: One workflow handles all clients by accepting `airtableBaseId` as parameter

#### Portal → n8n Webhook Pattern

**When user uploads leads in portal:**

```typescript
// Portal code
const client = await db.query.clients.findFirst({ where: eq(clients.id, clientId) });

// Call n8n with client's base ID
await fetch('https://n8n.yourdomain.com/webhook/enrich-lead', {
  method: 'POST',
  body: JSON.stringify({
    clientId: client.id,
    airtableBaseId: client.airtableBaseId, // ← Different per client
    leadData: { firstName, lastName, email, ... }
  })
});
```

**n8n receives different baseId per client**, uses correct base automatically.

---

## 🏗️ RECOMMENDED ARCHITECTURE (FINAL)

### Multi-Client Setup

```
PostgreSQL (Portal Database)
├─ clients table
│  ├─ id: UYSP_ID
│  │  └─ airtableBaseId: app4wIsBfpJTg7pWS
│  ├─ id: ACME_ID
│  │  └─ airtableBaseId: appXXXXXXXXXXXXXX
│  └─ id: TECHCO_ID
│     └─ airtableBaseId: appYYYYYYYYYYYYYY
└─ leads table
   ├─ client_id (foreign key)
   └─ All clients' leads mixed (but filtered by client_id)

Airtable (Automation Hub)
├─ Base 1: app4wIsBfpJTg7pWS (UYSP)
│  └─ Leads: 11,046 UYSP leads
├─ Base 2: appXXXXXXXXXXXXXX (Acme)
│  └─ Leads: 5,000 Acme leads
└─ Base 3: appYYYYYYYYYYYYYY (TechCo)
   └─ Leads: 8,000 TechCo leads

n8n (Automation Workflows)
├─ Lead Enrichment Workflow (ONE workflow)
│  └─ Accepts: clientId + airtableBaseId
│  └─ Routes to correct base dynamically
├─ Inbound SMS Workflow (ONE workflow)
│  └─ Looks up lead by phone
│  └─ Checks client's base
└─ Campaign Automation (ONE workflow per campaign type)
   └─ Uses baseId from client record
```

### Data Flow

**Lead Upload:**
```
1. Client uploads CSV in portal
2. Portal knows client's airtableBaseId (from clients table)
3. Portal → n8n webhook with { clientId, airtableBaseId, leads[] }
4. n8n writes to client's specific Airtable base
5. Clay enriches
6. n8n updates client's Airtable base
7. Sync pulls from client's base → PostgreSQL (filtered by client_id)
8. Portal displays with client_id filter
```

**Two-Way Messaging:**
```
1. Inbound SMS arrives
2. n8n looks up phone in PostgreSQL (fast)
3. Gets client_id + airtableBaseId
4. Fetches conversation from client's Airtable base
5. AI generates response (reads full history from their base)
6. Updates client's Airtable base
7. Also updates PostgreSQL immediately
8. Portal shows conversation (filtered by client_id)
```

---

## 🔧 IMPLEMENTATION PLAN

### Phase 1: Keep Current (1 Client)
**Now**: UYSP is only client, one Airtable base works fine

### Phase 2: Add Second Client (When It Happens)
**When client #2 onboards:**

1. Create new Airtable base for them
2. Copy base template (same schema as UYSP's)
3. Add client record in PostgreSQL with their baseId
4. n8n workflows already support multi-base (use baseId parameter)
5. Portal already supports multi-client (client_id filtering)
6. Just works!

### Phase 3: Scale to 10+ Clients
**Automation needed:**

1. **Base Template**
   - Create "Client Base Template" in Airtable
   - Has all standard fields
   - Copy when onboarding new client

2. **n8n Webhook Registration**
   - When new client created in portal
   - Auto-register webhooks for their base
   - Set up automations

3. **Sync Orchestration**
   - Background job syncs all clients
   - Loops through clients table
   - Syncs each client's base → PostgreSQL

---

## 📋 REQUIRED AIRTABLE SCHEMA (Per Base)

### Tables Needed (Each Client's Base)

**1. Leads Table** (Core)
```
Fields:
- Lead (Auto-number / Primary)
- First Name, Last Name, Email, Phone, Company, Job Title
- ICP Score, Engagement Score
- SMS Campaign ID, SMS Variant, SMS Sequence Position
- Processing Status, HRQ Status
- Booked, Booked At, SMS Stop
- Short Link ID, Click Count, Clicked Link
- conversation_thread (Long Text - JSON)
- has_responded (Checkbox)
- last_inbound_message, last_inbound_at
- Unbounce Tags (for engagement scoring)
- Form ID / Lead Source
```

**2. Campaigns Table** (Optional)
```
Fields:
- Campaign Name
- Status (Active, Paused)
- Total Leads (Count from Leads)
- Booked (Count)
- Opt-Outs (Count)
```

**3. SMS Audit Table** (For tracking)
```
Fields:
- Lead (Link to Leads)
- Message Text
- Sent At
- Status (Sent, Delivered, Failed)
- Direction (Outbound, Inbound)
```

---

## 🎯 FINAL RECOMMENDATION

### Use Separate Bases Per Client ✅

**Rationale:**

1. **Security**: Physical separation = zero risk of data leakage
2. **Compliance**: Easy GDPR compliance (delete base = delete all data)
3. **Customization**: Each client can have custom fields
4. **Performance**: Smaller bases = faster queries
5. **Scalability**: Add clients by creating new bases (no limit)
6. **Cost**: Each client pays for their infrastructure

**Trade-off Accepted:**
- More bases to manage (but automated with templates)
- n8n workflows use baseId parameter (already implemented)
- Sync loops through clients (already designed for this)

### How Portal Handles It (Already Built!)

**Client record in PostgreSQL:**
```sql
SELECT id, company_name, airtable_base_id FROM clients;

UYSP_ID    | UYSP      | app4wIsBfpJTg7pWS
ACME_ID    | Acme Corp | appXXXXXXXXXXXXXX
TECHCO_ID  | TechCo    | appYYYYYYYYYYYYYY
```

**When syncing:**
```typescript
// Loop through all clients
const clients = await db.query.clients.findMany();

for (const client of clients) {
  // Each client has their own Airtable base
  const airtable = getAirtableClient(client.airtableBaseId);
  
  // Sync their leads
  await syncLeadsForClient(airtable, client.id);
}
```

**This is exactly what your sync endpoint does now!**

---

## 🚀 ONBOARDING NEW CLIENT (Step-by-Step)

### Step 1: Create Airtable Base (5 min)

1. Go to Airtable
2. Click "Add a base"
3. Choose "Start from scratch" or "Duplicate UYSP base" (as template)
4. Name it: "[Client Name] - Lead Qualification"
5. Copy Base ID from URL: `app_______________`

### Step 2: Configure n8n Webhooks (10 min)

**Option A**: Client-specific workflows
- Duplicate UYSP workflow
- Change base ID in all Airtable nodes
- Rename workflow: "[Client Name] - Lead Enrichment"

**Option B**: Dynamic workflows (BETTER)
- Keep one workflow
- Accept baseId as webhook parameter
- n8n routes to correct base automatically

### Step 3: Add Client in Portal (2 min)

1. Login as SUPER_ADMIN
2. Go to /admin
3. Click "Add Client"
4. Enter:
   - Company Name: Acme Corp
   - Email: admin@acmecorp.com
   - Airtable Base ID: appXXXXXXXXXXXXXX
5. Create

**Portal now knows**:
- Acme's leads go to appXXXXXXXXXXXXXX
- Sync pulls from their base
- Analytics filter by their client_id

### Step 4: Create Admin User for Client (2 min)

1. In portal, go to Acme client detail page
2. Click "Add User"
3. Create ADMIN user for Acme
4. Give them login credentials

**They can now**:
- Login and see only their leads
- Upload their leads
- Manage their team
- View their analytics

### Total Onboarding Time: 20 minutes

---

## 🔄 HOW IT WORKS END-TO-END

### Scenario: Acme Corp Uploads 500 New Leads

**Portal (uysp-portal-v2.onrender.com):**
```
1. Acme ADMIN logs in
2. Goes to /leads/upload
3. Uploads CSV with 500 leads
4. Portal knows: Acme's client_id = ACME_ID
5. Portal knows: Acme's airtableBaseId = appXXXXXXXXXXXXXX
```

**n8n Webhook:**
```
6. Portal → n8n webhook:
   POST https://n8n.yourdomain.com/webhook/bulk-upload
   {
     clientId: "ACME_ID",
     airtableBaseId: "appXXXXXXXXXXXXXX",
     leads: [ { firstName, lastName, email, ... }, ... ]
   }

7. n8n receives, loops through leads:
   - For each lead → write to Acme's base (appXXXX...)
   - NOT to UYSP's base!
```

**Clay Enrichment:**
```
8. n8n → Clay: Enrich each lead
9. Clay → n8n: Returns enriched data
10. n8n → Acme's Airtable base: Update with enriched data
```

**Back to Portal:**
```
11. n8n → Portal webhook:
    POST /api/leads/sync-complete
    { clientId: "ACME_ID", enriched: true }

12. Portal triggers sync for Acme:
    - Reads from appXXXXXXXXXXXXXX
    - Inserts to PostgreSQL with client_id = ACME_ID
    - Acme ADMIN sees their 500 new leads
    - UYSP doesn't see them (filtered by client_id)
```

**Perfect isolation. No cross-contamination.**

---

## 🎯 SCHEMA STANDARDIZATION

### Core Fields (Every Client Must Have)

**Required for system to work:**
- First Name, Last Name, Email, Phone
- Campaign ID, SMS Variant, SMS Sequence Position
- Processing Status, Booked, SMS Stop
- conversation_thread (for two-way messaging)
- has_responded

**Template Base has all these fields pre-configured.**

### Custom Fields (Per Client)

**Client can add their own:**
- Custom tags
- Industry-specific fields
- Internal tracking fields
- Integration fields

**Won't break system** - portal only uses core fields.

---

## 🏗️ N8N WORKFLOW ARCHITECTURE (MULTI-BASE)

### Pattern: Dynamic Base Routing

**Workflow: "Lead Enrichment (Multi-Tenant)"**

```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "enrich-lead"
      }
    },
    {
      "name": "Set Base ID",
      "type": "n8n-nodes-base.set",
      "parameters": {
        "values": {
          "string": [
            {
              "name": "baseId",
              "value": "={{ $json.airtableBaseId }}"
            }
          ]
        }
      }
    },
    {
      "name": "Get Lead from Airtable",
      "type": "n8n-nodes-base.airtable",
      "parameters": {
        "operation": "get",
        "application": "={{ $json.baseId }}", // ← Dynamic!
        "table": "Leads",
        "id": "={{ $json.leadId }}"
      }
    },
    {
      "name": "Clay Enrichment",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": { /* ... */ }
    },
    {
      "name": "Update Airtable",
      "type": "n8n-nodes-base.airtable",
      "parameters": {
        "operation": "update",
        "application": "={{ $json.baseId }}", // ← Same base, dynamic
        "table": "Leads",
        "id": "={{ $json.leadId }}",
        "fields": "={{ $json.enrichedData }}"
      }
    }
  ]
}
```

**One workflow. All clients. No duplication.**

---

## 📊 COST COMPARISON

### Separate Bases (Recommended)

**Airtable:**
- 10 clients × $20/month per base = $200/month
- OR pass cost to client (they pay for their base)

**Pros**: Can charge clients for infrastructure  
**Cons**: Higher total cost if you absorb it

### Single Base

**Airtable:**
- 1 base with Pro plan (50k+ records) = $100-200/month
- All clients share one bill

**Pros**: Lower Airtable cost  
**Cons**: Can't charge per client, security risk

**Recommendation**: Charge clients for their base. Separate bases = better security, worth the cost.

---

## ✅ DECISION: SEPARATE BASES PER CLIENT

**Why:**
1. Security (physical isolation)
2. Compliance (easy deletion/export)
3. Customization (per-client schemas)
4. Performance (smaller bases)
5. Cost model (charge per client)

**Implementation:**
- ✅ Already built! Portal has `airtableBaseId` per client
- ✅ Sync endpoint accepts baseId parameter
- ✅ n8n workflows can use dynamic baseId
- ✅ Just need to create base template for onboarding

**No code changes needed. Architecture already supports this.**

---

## 🎯 NEXT STEPS

### Create Airtable Base Template (30 min)

1. Duplicate UYSP's base
2. Remove UYSP-specific data (keep schema)
3. Name it: "CLIENT-TEMPLATE-DO-NOT-DELETE"
4. Document schema in Notion/Airtable
5. Use for all new client onboarding

### When Client #2 Onboards

1. Duplicate template base
2. Rename: "[Client Name] - Leads"
3. Copy base ID
4. Add client in portal with base ID
5. Create ADMIN user for them
6. They can now upload leads, use portal
7. Their data stays in their base
8. Zero risk to other clients

---

## 🎁 BONUS: HYBRID BENEFITS

**You get best of both worlds:**

**Airtable (Per Client):**
- Data isolation
- Custom fields
- Independent automations
- Clean deletion

**PostgreSQL (Shared):**
- Fast analytics across all clients
- Cross-client comparisons
- Unified reporting
- Portal performance

**This is a professional SaaS architecture.** ✅

---

**Architecture decision finalized. Multi-tenant with separate Airtable bases per client. Ready to scale.** 🚀












