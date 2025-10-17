# Kajabi Integration - Executive Summary
**Date**: October 17, 2025  
**Status**: Specification Complete - Ready for Implementation

---

## 🎯 WHAT WE'RE BUILDING

A real-time integration that captures leads from Kajabi forms, enriches them through your existing UYSP system, and sends campaign-specific SMS messages based on the lead's source tags.

**Simple flow:**
```
Kajabi Form → n8n Webhook → Airtable → Clay Enrichment → Campaign-Specific SMS
```

---

## 🔑 KEY INSIGHTS FROM TRANSCRIPT

### What Your Client Wants (Ian)
✅ **Keep Kajabi emails separate** - Don't touch existing email sequences  
✅ **Add SMS intelligence layer** - Qualify leads, score them, send contextual outreach  
✅ **Tag-based messaging** - "JB Webinar" leads get different messages than "Sales Webinar" leads  
✅ **Flag hot leads to sales** - System identifies who's worth talking to  
❌ **NO write-back to Kajabi** - Not needed for now (but keep door open)

### Go-to-Market Strategy (Your Sales Plan)
🎁 **Free offer**: Enrich 1,000-5,000 Kajabi leads for free  
🎯 **Target market**: Kajabi users with email sequences but no SMS/lead scoring  
💡 **Value prop**: "We sit alongside Kajabi and tell you who's actually worth calling"  
🚀 **Future upsell**: WhatsApp, two-way conversations, unified inbox

---

## 📋 WHAT NEEDS TO HAPPEN

### Technical Changes (8-10 hours total)

**1. Airtable Updates (30 minutes)**
- Add 6 new fields to Leads table (Kajabi Contact ID, Tags, Campaign Assignment, etc.)
- Create SMS_Templates table with campaign logic
- Create Kajabi_Sync_Audit table for monitoring

**2. n8n Workflow - NEW: "UYSP-Kajabi-Realtime-Ingestion" (4 hours)**
- Webhook receiver for Kajabi form submissions
- Call Kajabi API to get full contact details
- Extract and parse tags → determine which campaign
- Check for duplicate email in Airtable
- Create or update lead record
- Log sync for debugging

**3. n8n Workflow - MODIFY: "UYSP-SMS-Scheduler" (2 hours)**
- Add campaign-aware template lookup
- Match lead's `campaign_assignment` to SMS_Templates
- Send campaign-specific message with variables
- Fallback to default template if no match

**4. Testing & Validation (3 hours)**
- Test with 5-10 sample leads
- Verify duplicate handling
- Confirm Clay picks up leads
- Validate correct campaign messages sent

### Client Setup Required
1. **Kajabi API Key** - Need credentials from client
2. **Kajabi Webhook URL** - Point form.submitted event to n8n
3. **Campaign Mapping** - List of tags and desired messages
4. **Custom Fields** - Which Kajabi custom fields to capture

---

## 🗂️ CAMPAIGN SYSTEM EXPLAINED

### How It Works
Each Kajabi lead has **tags** (e.g., "JB Webinar", "Sales Webinar"). These tags determine which **campaign** they enter, which determines which **SMS template** they receive.

**Example:**
```
Lead comes in with tag: "JB Webinar"
   ↓
System assigns campaign: "webinar_jb_2024"
   ↓
Looks up template where Campaign ID = "webinar_jb_2024"
   ↓
Sends: "Hi John, saw you at our JB webinar. Other AEs seeing 20% lift..."
```

### Easy to Add New Campaigns
Client can add new campaigns in Airtable (no code changes):
1. Go to SMS_Templates table
2. Add new record:
   - Campaign ID: `webinar_new_2024`
   - Kajabi Tag Match: `New Webinar`
   - Message Template: `Hi {{first_name}}, noticed you're {{title}}...`
3. Done! Next lead with "New Webinar" tag gets this message.

---

## ⚠️ CRITICAL DECISIONS NEEDED

### Before You Start Building
1. **Does client have Kajabi API access?**
   - Not all Kajabi plans include API
   - Need to confirm + get API key

2. **Which forms to enable?**
   - Start with 1 low-risk form for testing
   - Or go all-in on all forms?

3. **What's the default campaign?**
   - What happens if lead has no recognized tags?
   - Option A: Generic nurture sequence
   - Option B: Hold for human review

4. **List all tag → campaign mappings**
   - From transcript: "JB Webinar", "Sales Webinar", "AI Webinar"
   - Need exact tag strings + desired messages for each

5. **Custom fields to capture?**
   - From transcript: LinkedIn URL (custom_29), Coaching Interest (custom_67)
   - Are there others?

### Before Production Launch
6. **How to handle duplicates?**
   - Email-based deduplication (recommended)
   - Or add phone number to dedup logic?

7. **Click tracking setup?**
   - Use Switchy with custom domain (go.clientdomain.com)?
   - Client mentioned this in transcript

8. **Monitoring alerts?**
   - Slack channel for errors?
   - Daily summary report?

---

## 💰 COST & TIMELINE

### One-Time Setup
- **Development**: 8-10 hours ($600-750 at your rate)
- **Testing**: 3 hours ($225)
- **Training**: 2 hours ($150)
- **Total**: ~$1,000-1,125 + $100 for 1,000 test lead enrichments

### Ongoing Costs Per Client
- n8n: $0 (within plan for <1,000 leads/month)
- Airtable: $0 (within plan)
- Clay: $50/month (500 leads × $0.10)
- SMS: $10/month (500 msgs × $0.02)
- **Total**: ~$60/month per client

### Revenue Model (Your Sales Plan)
- **Free offer**: $100 acquisition cost → 20% convert → $100/month revenue
- **Bronze plan**: 1,000 leads/month @ $499/month
- **Silver plan**: 5,000 leads/month @ $1,499/month
- **Gold plan**: Unlimited @ $2,999/month

### Break-Even Analysis
- 1 client at Bronze ($499/month) = covers 8 clients' infrastructure ($60 × 8 = $480)
- Very healthy margins for SaaS model

---

## 🚀 RECOMMENDED APPROACH

### Week 1: Build Core Integration
**Goal**: Get Kajabi leads flowing into Airtable and enriched by Clay

1. **Day 1**: Airtable schema updates + get Kajabi API access
2. **Day 2-3**: Build n8n ingestion workflow
3. **Day 4**: Testing with sample data
4. **Day 5**: Deploy and monitor 1 test form

### Week 2: Add Campaign Intelligence
**Goal**: Campaign-specific messaging working

1. **Day 1-2**: Build SMS_Templates table + 3 campaigns
2. **Day 3**: Update SMS Scheduler for campaign lookup
3. **Day 4-5**: Test with real leads, measure results

### Week 3: Production Rollout
**Goal**: Full deployment + monitoring

1. **Day 1-2**: Enable all Kajabi forms
2. **Day 3-5**: Monitor, fix edge cases, optimize
3. **Day 5-7**: Document, train client, celebrate

### Future (Month 2+)
- Add write-back to Kajabi (tag when booked)
- WhatsApp integration
- Two-way conversations
- AI reply assistant

---

## 📊 SUCCESS LOOKS LIKE

### Technical Success
✅ 99%+ webhook capture rate  
✅ <10 second webhook → Airtable time  
✅ 100% campaign assignment accuracy  
✅ Zero missed leads (daily reconciliation)  
✅ SMS delivery >97%

### Business Success
✅ Client can add new campaigns without dev help  
✅ Lead qualification rate >60% (score >70)  
✅ Meeting book rate >5% of qualified leads  
✅ Client reports "it just works"  
✅ Ready to sell to next Kajabi client

### Go-to-Market Success
✅ Demo video recorded  
✅ Free trial offer landing page live  
✅ First 5 Kajabi prospects identified  
✅ Pricing calculator built  
✅ Case study from Ian published

---

## 🎬 NEXT STEPS

### Immediate (This Week)
1. **Review this summary** with Gabriel - confirm approach
2. **Gather info from client**:
   - Kajabi API credentials
   - List of all forms with tags
   - Campaign message templates
   - Custom fields mapping
3. **Answer critical decisions** (see section above)

### Once Info Gathered (Next Week)
4. Start Week 1 implementation plan
5. Set up Slack channel for monitoring
6. Schedule client training session

### Questions?
- Check full spec: `docs/architecture/KAJABI-INTEGRATION-SPEC.md`
- Or ask me - I'll be here!

---

**Confidence Score**: 90%  
**Why not 100%?** Need confirmation on:
- Kajabi API access/plan level
- Exact tag strings from client
- Custom fields mapping
- Go-to-market timeline

**Once we have those answers, we're ready to build!**

