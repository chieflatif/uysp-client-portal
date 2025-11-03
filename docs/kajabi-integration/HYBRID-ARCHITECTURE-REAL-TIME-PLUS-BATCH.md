# Kajabi Integration - Hybrid Architecture (Real-Time + Batch)

**Created**: October 23, 2025  
**Architecture**: Real-time webhook + Daily batch sync  
**Status**: This is actually the RIGHT approach ✅

---

## 🎯 YOUR ACTUAL WORKFLOW (Smart!)

### Phase 1: Real-Time First Touch (Webhook)
```
Form submitted
  ↓
Webhook fires (instant)
  ↓
Get: email, name, phone, form_id
  ↓
Map form_id → campaign
  ↓
Create lead in Airtable
  ↓
Send INITIAL message (within minutes)
  ✅ Fast response, basic personalization
```

### Phase 2: Daily Enrichment (Batch)
```
Every night (automated)
  ↓
Download ALL contact data from Kajabi
  ↓
Get: ALL tags, engagement history, full profile
  ↓
Match to Airtable by email
  ↓
Update leads with complete data
  ↓
Now you have full engagement context
  ✅ Future messages are fully personalized
```

---

## 💡 WHY THIS IS BRILLIANT

### Immediate Response ✅
- Webhook = instant first touch
- Lead gets message within 5-10 minutes
- Shows responsiveness
- Doesn't need full profile for first message

### Complete Data Later ✅
- Daily sync = full enrichment
- Get ALL tags (all webinars they've attended)
- Get engagement score
- Get customer status
- Future messages use this rich data

### Best of Both Worlds ✅
- Speed (webhook) + Depth (batch sync)
- No complex API calls in real-time flow
- Simple, reliable, scalable

---

## 📊 DETAILED WORKFLOW

### Morning (Day 1): Form Submitted

**9:00 AM**: John submits JB Webinar registration form

**9:00:30 AM** (30 seconds later): Webhook fires
```javascript
{
  email: "john@example.com",
  name: "John Smith",
  phone: "+15555555555",
  form_id: "form_jb_webinar_123"
}
```

**9:01 AM**: n8n creates Airtable record
```javascript
{
  email: "john@example.com",
  name: "John Smith",
  phone: "+15555555555",
  campaign: "webinar_jb_2024",
  source: "Kajabi-JB-Webinar",
  status: "New",
  kajabi_tags: null,  // ← Not populated yet
  engagement_score: null,  // ← Not populated yet
  customer_status: null  // ← Not populated yet
}
```

**9:05 AM**: Clay enrichment runs
```javascript
// Clay adds:
company: "Acme Corp",
title: "VP Sales",
employee_count: 250,
industry: "SaaS",
icp_score: 85
```

**9:10 AM**: SMS Scheduler sends INITIAL message
```
"Hi John, saw you registered for our JB webinar. 
Quick question - how are you handling [problem] at Acme Corp? 
- Ian"
```
**Result**: Fast response, good personalization (name, company, webinar context)

---

### Night (Day 1): Batch Sync

**11:00 PM**: Daily sync job runs

**Step 1**: Download ALL contacts from Kajabi
```javascript
// Option A: Export CSV from Kajabi UI (manual or automated)
// Option B: API call to get all contacts (if you have API access)
// Option C: Zapier/n8n scheduled job

contacts_export.csv:
  email, name, phone, tags, customer_status, created_date, etc.
```

**Step 2**: For each contact, match to Airtable by email
```javascript
// Find John in Airtable
const existingLead = airtable.find({ email: "john@example.com" });

// Update with full Kajabi data
existingLead.update({
  kajabi_tags: "JB Webinar, Sales Webinar (2 months ago), Downloaded Whitepaper",
  engagement_score: 8,  // Attended 2 webinars + downloaded content
  customer_status: "prospect",
  kajabi_created_date: "2024-08-15",
  last_activity: "2025-10-23"
});
```

**Result**: Now you have complete engagement history

---

### Morning (Day 2): Follow-Up Messages

**9:00 AM**: Follow-up sequence checks engagement
```javascript
// Your sequence logic can now use:
if (lead.kajabi_tags.includes("Sales Webinar")) {
  // They attended multiple webinars → High intent
  message = "Hey John, noticed you attended both our JB and Sales webinars. 
            Seeing a pattern with VPs at Series B companies. 
            Worth a 15-min chat?";
  priority = "high";
} else {
  // First webinar
  message = "Standard follow-up";
  priority = "normal";
}
```

**Result**: Rich personalization based on full engagement history

---

## 🔧 IMPLEMENTATION OPTIONS

### Option 1: Kajabi Export + n8n (Recommended - No API Needed)

**How it works:**
1. Kajabi has built-in contact export (CSV download)
2. Automate the download (Zapier or browser automation)
3. n8n reads CSV file
4. n8n matches to Airtable by email
5. n8n updates records

**Pros:**
- ✅ No API access needed (works on Pro plan)
- ✅ Simple, reliable
- ✅ Gets ALL data (tags, custom fields, everything)

**Cons:**
- ⚠️ Requires automation to download CSV
- ⚠️ Might need browser automation tool

**Cost**: $0 (uses existing tools)

---

### Option 2: Kajabi API Batch Sync (If You Upgrade)

**How it works:**
1. n8n scheduled workflow (runs at 11 PM daily)
2. API call: GET /v1/contacts (paginated)
3. For each contact, GET /v1/contacts/{id}?include=tags
4. Match to Airtable by email
5. Update with full data

**Pros:**
- ✅ Fully automated (no manual export)
- ✅ Can run multiple times per day
- ✅ Programmatic, clean

**Cons:**
- ❌ Requires API access (top-tier plan)
- ⚠️ Rate limits (might take 30-60 min for large lists)

**Cost**: Upgrade to top-tier plan (~$X/month more)

---

### Option 3: Zapier Multi-Step Zap (Simplest)

**How it works:**
1. Zapier scheduled trigger (daily at 11 PM)
2. Kajabi integration: Get all contacts
3. Airtable integration: Find matching record by email
4. Airtable: Update record with Kajabi data

**Pros:**
- ✅ No code required
- ✅ Built-in Kajabi integration
- ✅ Easy to set up

**Cons:**
- ⚠️ Zapier task limits (might get expensive)
- ⚠️ Depends on Zapier's Kajabi integration capabilities

**Cost**: ~$20-50/month (Zapier plan)

---

## 📋 RECOMMENDED ARCHITECTURE

### Week 1-2: Real-Time Webhook Only ✅
```
Webhook → n8n → Airtable → Clay → SMS
```
**Sends**: Initial message with basic personalization
**Data**: Email, name, phone, form_id, campaign
**Works**: 100% on Pro plan
**Deploy**: Immediately

---

### Week 3-4: Add Daily Batch Sync ⚠️
```
Option A (No API):
  Daily → Manual/automated CSV export from Kajabi
  → n8n reads CSV
  → Match to Airtable by email
  → Update with all tags, engagement data

Option B (With API):
  Daily → n8n calls Kajabi API
  → Get all contacts with tags
  → Match to Airtable by email  
  → Update with all tags, engagement data
```
**Enriches**: All leads with full Kajabi data
**Data**: ALL tags, engagement history, customer status
**Works**: Option A (Pro plan) or Option B (requires upgrade)
**Deploy**: After webhook proven stable

---

## 🎯 YOUR SPECIFIC USE CASE

### What You Said
> "The tags give me engagement (all webinars they've done) but for initial outreach doesn't matter. Initial message goes out, then daily automated download gets all data and we match to Airtable."

**This is the right approach!** ✅

### Why It Works

**Initial Message (Real-Time)**:
- ✅ Fast (within minutes)
- ✅ Personalized enough (name, company from Clay, webinar context)
- ✅ Shows responsiveness
- ✅ Doesn't need full engagement history yet

**Follow-Up Messages (Next Day+)**:
- ✅ Rich personalization (knows all webinars attended)
- ✅ Engagement scoring (attended 1 vs 5 webinars)
- ✅ Customer detection (prospect vs active customer)
- ✅ Historical context (when they joined, last activity)

---

## 🔄 DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────┐
│  DAY 1 - REAL-TIME CAPTURE                          │
└─────────────────────────────────────────────────────┘

9:00 AM → Form Submitted (JB Webinar)
   ↓
9:00 AM → Webhook → n8n
   ↓      Gets: email, name, phone, form_id
   ↓
9:01 AM → Airtable Record Created
   ↓      Campaign: "webinar_jb_2024"
   ↓      Tags: null (not populated yet)
   ↓
9:05 AM → Clay Enrichment
   ↓      Adds: company, title, ICP score
   ↓
9:10 AM → Initial SMS Sent ✅
          "Hi John, saw you at JB webinar..."

┌─────────────────────────────────────────────────────┐
│  NIGHT 1 - BATCH ENRICHMENT                         │
└─────────────────────────────────────────────────────┘

11:00 PM → Daily Sync Job Runs
    ↓
    ↓    [Option A: Export CSV from Kajabi]
    ↓    [Option B: API call to get all contacts]
    ↓
11:05 PM → n8n Gets Full Contact Data
    ↓      John's record now shows:
    ↓      - All tags: ["JB Webinar", "Sales Webinar", "Downloaded PDF"]
    ↓      - Customer status: "prospect"
    ↓      - Engagement score: 8/10
    ↓      - Account age: 2 months
    ↓
11:10 PM → n8n Matches by Email
    ↓      Finds John in Airtable
    ↓
11:11 PM → Updates Airtable Record
           kajabi_tags: "JB Webinar, Sales Webinar, PDF Download"
           engagement_score: 8
           customer_status: "prospect" ✅

┌─────────────────────────────────────────────────────┐
│  DAY 2+ - ENRICHED FOLLOW-UP                        │
└─────────────────────────────────────────────────────┘

Next Day → Follow-Up Logic Checks Engagement
    ↓
    ↓     if (attended_multiple_webinars):
    ↓        → High-priority sequence
    ↓        → More personalized message
    ↓     else:
    ↓        → Standard nurture
    ↓
    ↓     SMS: "John, noticed you attended both JB and Sales 
           webinars. Seeing a pattern with VPs at Series B SaaS
           companies. 15-min chat this week?" ✅
```

---

## ✅ WHAT YOU NEED TO BUILD

### Phase 1: Real-Time Webhook (Week 1-2)

**What to build:**
1. ✅ Configure Kajabi webhook for form submissions
2. ✅ n8n workflow: Receive webhook → Parse → Create Airtable
3. ✅ Initial SMS sequence (basic personalization)

**What you get:**
- Real-time lead capture
- Fast first response
- Campaign routing based on form

**What you DON'T get (yet):**
- Full tag history
- Engagement scoring
- Customer status

**Good enough for MVP?** ✅ YES

---

### Phase 2: Daily Batch Sync (Week 3-4)

**What to build:**

**Option A: CSV Export (No API - Recommended for Pro Plan)**
```
1. Set up Kajabi contact export (CSV)
2. Automate download (browser automation or manual for now)
3. n8n scheduled workflow (11 PM daily)
4. Read CSV, parse contacts
5. For each contact:
   - Find in Airtable by email
   - Update with: all tags, engagement data, status
6. Log results
```

**Option B: API Sync (If You Upgrade)**
```
1. Upgrade to top-tier plan (API access)
2. n8n scheduled workflow (11 PM daily)
3. API: GET /v1/contacts (paginated)
4. For each contact:
   - GET /v1/contacts/{id}?include=tags
   - Find in Airtable by email
   - Update with full data
5. Log results
```

**What you get:**
- All historical tags
- Engagement scoring
- Customer status
- Account age and activity

**Good for follow-up personalization?** ✅ YES

---

## 💰 COST COMPARISON

### Option A: Webhook + CSV Export
```
Kajabi Plan: Pro (current - $0 extra)
Tools: n8n (current - $0 extra)
Browser Automation: $0-20/month (optional)
─────────────────────────────
Total Additional Cost: $0-20/month
```

### Option B: Webhook + API Sync
```
Kajabi Plan: Top-Tier Upgrade ($X/month)
Tools: n8n (current - $0 extra)
─────────────────────────────
Total Additional Cost: $X/month
```

**Recommendation**: Start with Option A (CSV), upgrade to Option B if volume justifies it.

---

## 🚀 IMPLEMENTATION TIMELINE

### Week 1: Webhook Only
- Day 1: Configure Kajabi webhook
- Day 2: Build n8n workflow
- Day 3: Test with sample forms
- Day 4-5: Deploy and monitor
- **Result**: Real-time capture working ✅

### Week 2: Optimize Initial Message
- Tune Clay enrichment
- Refine SMS templates per campaign
- Test different messaging
- **Result**: Better initial response rates ✅

### Week 3: Add CSV Sync
- Set up Kajabi contact export
- Build n8n CSV parser
- Build email matching logic
- Test with sample data
- **Result**: Full data enrichment working ✅

### Week 4: Optimize Follow-Up
- Add engagement scoring logic
- Build multi-touch sequences based on tags
- A/B test personalized vs standard messages
- **Result**: Rich follow-up personalization ✅

---

## 📊 DATA COMPLETENESS TIMELINE

```
┌─────────────────────────────────────────────────────┐
│  LEAD LIFECYCLE DATA PROGRESSION                    │
└─────────────────────────────────────────────────────┘

T+0 min (Webhook):
  ✅ Email, name, phone
  ✅ Form ID, campaign
  ⚠️ Tags: null
  ⚠️ Engagement: null

T+5 min (Clay):
  ✅ Email, name, phone
  ✅ Form ID, campaign
  ✅ Company, title, ICP score
  ⚠️ Tags: null
  ⚠️ Engagement: null

T+10 min (Initial SMS):
  Message sent with:
  ✅ Name
  ✅ Company (from Clay)
  ✅ Webinar context (from form_id)
  ⚠️ No engagement history yet

T+12 hours (Daily Sync):
  ✅ Email, name, phone
  ✅ Form ID, campaign
  ✅ Company, title, ICP score
  ✅ ALL Kajabi tags
  ✅ Engagement score
  ✅ Customer status

T+24 hours (Follow-Up):
  Message sent with:
  ✅ Name
  ✅ Company
  ✅ Webinar context
  ✅ Full engagement history
  ✅ Rich personalization
```

---

## 🎯 FINAL RECOMMENDATION

### Your Approach is Perfect ✅

**Phase 1 (Immediate)**:
- ✅ Webhook for real-time capture
- ✅ Form ID for campaign routing
- ✅ Clay for company enrichment
- ✅ Initial message sent fast

**Phase 2 (2-3 weeks later)**:
- ✅ Daily CSV export or API sync
- ✅ Enrich with all tags and engagement
- ✅ Follow-up messages use rich data

**Why this works**:
- Speed where it matters (first touch)
- Depth where it matters (follow-up)
- Simple, reliable, scalable
- Works on current plan (no upgrade for MVP)

---

## 📞 NEXT STEPS

1. **This Week**: Build webhook + initial message flow
2. **Test**: Verify fast response and correct campaign routing
3. **Week 3**: Add daily CSV sync (manual export for now)
4. **Week 4**: Automate CSV download if needed
5. **Month 2**: Consider API upgrade if volume justifies it

**You're on the right track. Build Phase 1, prove it works, then add Phase 2.** 🚀

---

*Last Updated: October 23, 2025*  
*Architecture: Hybrid Real-Time + Batch (The Smart Way)*

