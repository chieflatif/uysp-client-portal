# Kajabi Integration - Complete Guide
**Created**: October 17, 2025  
**For**: Latif + Gabriel  
**Purpose**: Everything you need to know, nothing you don't

---

## 🎯 WHAT WE'RE BUILDING

Kajabi form gets submitted → Webhook captures it → Enriched by Clay → Campaign-specific SMS sent

**Simple.**

---

## 🔑 THE BIG PROBLEM WE SOLVED

**Your Question**: "When someone registers for multiple webinars, how do we know which one triggered the webhook?"

**Answer**: Kajabi webhook includes the form ID. We map form IDs to campaigns.

**Example:**
- JB Webinar form (ID: abc123) → Campaign "webinar_jb_2024" → Message: "Saw you at JB webinar..."
- Sales Webinar form (ID: xyz789) → Campaign "webinar_sales_2024" → Message: "Great to see you at sales webinar..."

Even if they registered for both, we know which one they just submitted because the webhook tells us the form ID.

---

## 📋 WHAT YOU NEED FROM IAN

### 1. OAuth Credentials
Kajabi Admin → Settings → API → Create API Key

You'll get:
- `client_id` (looks like: kajabi_abc123)
- `client_secret` (looks like: secret_xyz789)

Paste these into your `.env` file.

### 2. Forms List
Either:
- **Manual**: Screenshot Kajabi → Forms page (shows form names)
- **API**: We'll get this automatically once we have credentials

We need to know:
- Which forms exist
- What each form is for (JB Webinar, Sales Webinar, etc.)
- Which campaign each form should trigger

### 3. Message Templates
For each campaign, what should the SMS say?

Example:
```
Campaign: webinar_jb_2024
Message: "Hi {{first_name}}, saw you at our JB webinar. Other {{title}}s seeing 20% lift. Chat? {{calendly_link}}"
```

---

## 🏗️ HOW IT WORKS

### Step 1: Form Submitted in Kajabi
Someone fills out a form, Kajabi sends webhook to n8n.

### Step 2: We Get Form ID
Webhook tells us the submission ID. We call Kajabi API to get which form it was.

### Step 3: Map Form → Campaign
```
Form ID abc123 → Look up in table → Campaign "webinar_jb_2024"
```

### Step 4: Create Lead in Airtable
Lead record created with:
- Email, name, phone
- Campaign assignment: "webinar_jb_2024"
- Source: "Kajabi-Webhook"
- Kajabi Contact ID: (for future sync)

### Step 5: Clay Enriches (Existing Flow)
No changes needed - Clay picks up from queue like always.

### Step 6: SMS Scheduler Sends Campaign Message
Instead of one generic message, scheduler looks up template for "webinar_jb_2024" and sends that.

---

## 🔧 WHAT GABRIEL BUILDS

### Week 1: Core Integration (10 hours)
- Airtable: Add 6 fields to Leads table + create SMS_Templates table
- n8n: Build 10-node workflow (webhook → API → Airtable)
- Test: 5 test cases to verify it works

### Week 2: Campaign Messages (5 hours)
- Update SMS Scheduler to look up templates by campaign
- Test: Different forms get different messages
- Train you how to add new campaigns

### Week 3: Production (9 hours)
- Enable for 1 test form, monitor 48 hours
- Enable for all forms
- Optimize and fix any issues

**Total: 24 hours over 3 weeks**

---

## 🔐 AUTHENTICATION (How It Actually Works)

Kajabi uses OAuth 2.0 (not just a simple API key).

**What this means**:
- You give Ian's `client_id` + `client_secret` to Gabriel
- Gabriel configures n8n OAuth2 credential (one-time setup)
- n8n automatically gets access tokens and refreshes them
- You never think about this again

**Gabriel's Setup** (in n8n):
```
1. Credentials → Add → OAuth2 API
2. Paste client_id and client_secret
3. Test connection
4. Done - n8n handles the rest
```

---

## 📊 WHAT GETS ADDED TO AIRTABLE

### Leads Table - New Fields:
- Kajabi Contact ID (their ID in Kajabi)
- Kajabi Tags (JSON array of all their tags)
- Campaign Assignment (which SMS campaign: "webinar_jb_2024")
- Lead Source Detail (human-readable: "JB Webinar Registration")
- Kajabi Member Status (Active/Trial/Prospect/Churned)
- Kajabi Last Sync (timestamp)

### New Table: SMS_Templates
Campaign-specific message library.

**Example records:**
```
Campaign ID: webinar_jb_2024
Kajabi Tag Match: JB Webinar
Message: Hi {{first_name}}, saw you at JB webinar...
Active: ✓

Campaign ID: webinar_sales_2024
Kajabi Tag Match: Sales Webinar
Message: Hi {{first_name}}, great to see {{company}} at sales webinar...
Active: ✓
```

**You can add campaigns yourself** - just add row to this table. No code changes.

---

## ✅ SUCCESS CRITERIA

### Technical:
- 99%+ of form submissions captured
- Campaign assigned correctly 100% of time
- Clay picks up leads within 5 minutes
- SMS sends correct message per campaign

### Business:
- Ian says "this just works"
- You can add new campaign in 2 minutes
- No missed leads for 7 days straight
- Lead qual rate >60%

---

## 🚨 WHAT'S STILL NEEDED

### From Ian:
1. OAuth credentials (client_id + client_secret)
2. Forms list (which forms to capture)
3. Campaign mappings (which form → which campaign)
4. Message templates (what to send per campaign)

### From You:
1. Update `.env` with credentials when received
2. Share credentials with Gabriel securely
3. Review campaign mappings with Gabriel
4. Approve final build before production

---

## 💰 COST & TIMELINE

**Build Time**: 24 hours over 3 weeks  
**Cost**: ~$1,800 development + $100 testing  
**Monthly**: ~$60/client (Clay + SMS)  
**Revenue**: $499-2,999/month per client  

**LTV:CAC**: 60:1 (excellent)

---

## 📞 NEXT STEPS

**Today**:
1. Get OAuth credentials from Ian
2. Update `.env` file
3. Share with Gabriel

**Week 1** (Once credentials received):
1. Gabriel builds Airtable schema (Day 1)
2. Gabriel builds n8n workflow (Day 2-3)
3. Test with sample data (Day 4)
4. Test with real form (Day 5)

**Week 2**:
1. Add campaign-specific messages
2. Train you on campaign management

**Week 3**:
1. Soft launch (1 form, 48h monitor)
2. Full rollout (all forms)
3. Celebrate! 🎉

---

**That's it. No fluff, just what you need to know.**

**Questions? Check the machine-readable spec or ask me.**

