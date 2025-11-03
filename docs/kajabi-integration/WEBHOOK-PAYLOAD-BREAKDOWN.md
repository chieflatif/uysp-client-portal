# What Kajabi Webhook Actually Sends You

**Created**: October 23, 2025  
**For**: Understanding exactly what data you get with webhooks (Pro Plan)

---

## 🎯 THE STRAIGHT ANSWER

### What the Webhook Sends When Form is Submitted

Here's the **ACTUAL payload** you receive (this is what Kajabi documented):

```json
[
  {
    "id": "form_sub_abc123",
    "type": "form_submissions",
    "attributes": {
      "name": "John Smith",
      "email": "john@example.com",
      "phone_number": "+15555555555",
      "business_number": "",
      "address_line_1": "",
      "address_city": "",
      "address_state": "",
      "address_zip": "",
      "address_country": "",
      "custom_1": "Value from custom field 1",
      "custom_2": "Value from custom field 2",
      "custom_3": "Value from custom field 3"
    },
    "relationships": {
      "form": {
        "data": {
          "id": "form_jb_webinar_123",  // ← Which form they submitted
          "type": "forms"
        }
      },
      "tags": {
        "data": [
          {
            "id": "tag_abc123",  // ← Tag IDs (not names!)
            "type": "tags"
          },
          {
            "id": "tag_xyz789",
            "type": "tags"
          }
        ]
      }
    }
  }
]
```

---

## ✅ WHAT YOU **DO** GET (In the Webhook)

### Contact Information ✅
```javascript
✅ Email: "john@example.com"
✅ Name: "John Smith"
✅ Phone: "+15555555555"
✅ Business Phone: "" (if form collected it)
✅ Address Fields: (if form collected them)
   - address_line_1
   - address_city
   - address_state
   - address_zip
   - address_country
```

### Form Information ✅
```javascript
✅ Form ID: "form_jb_webinar_123"  // Which form they submitted
✅ Submission ID: "form_sub_abc123"  // Unique submission ID
```

### Custom Form Fields ✅
```javascript
✅ custom_1: "LinkedIn URL" (or whatever your form collects)
✅ custom_2: "Company Size"
✅ custom_3: "Industry"
```
**NOTE**: You only get 3 custom fields max. Whatever Ian put in those fields.

### Tags (Limited) ⚠️
```javascript
⚠️ Tag IDs: ["tag_abc123", "tag_xyz789"]
```

**CRITICAL LIMITATION**:
- ✅ You get tag **IDs** (e.g., "tag_abc123")
- ❌ You DON'T get tag **names** (e.g., "JB Webinar")
- ⚠️ You ONLY get tags applied **by this specific form**
- ❌ You DON'T get all historical tags from previous forms

---

## ❌ WHAT YOU **DON'T** GET (In the Webhook)

### Tag Names ❌
```javascript
// What you get:
tags: [{ id: "tag_abc123", type: "tags" }]

// What you DON'T get:
tags: [{ id: "tag_abc123", name: "JB Webinar" }]  // ❌ No names!
```

**To get tag names, you need**:
1. Pre-build a lookup table (tag_id → tag_name) using API, OR
2. Don't care about tag names, just use form_id for routing (recommended)

---

### Historical Tags ❌
```javascript
// Scenario: Person registered for 3 webinars over time

// What webhook shows:
tags: [{ id: "tag_current_form" }]  // Only from THIS form

// What it doesn't show:
tags: [
  { id: "tag_jb_webinar" },      // ❌ From 2 months ago
  { id: "tag_sales_webinar" },   // ❌ From 1 month ago
  { id: "tag_ai_webinar" }       // ✅ Only this one (current form)
]
```

**Why this matters**: If someone registered for multiple webinars, webhook only shows tags from the current form submission.

**Solution**: Use `form_id` instead of tags for campaign routing!

---

### Customer/Purchase Data ❌
```javascript
// Webhook does NOT include:
❌ customer_status: "active" / "trial" / "churned"
❌ membership_level: "pro"
❌ purchase_history: [...]
❌ offers_purchased: [...]
❌ account_created_date: "2024-01-15"
❌ last_login_date: "2025-10-23"
```

**To get this, you need**: API access (top-tier plan)

---

### Full Contact Profile ❌
```javascript
// Webhook does NOT include:
❌ first_name: "John" (separate from full name)
❌ last_name: "Smith" (separate from full name)
❌ company: "Acme Corp"
❌ job_title: "VP Sales"
❌ website: "acme.com"
❌ social_profiles: {...}
```

**Note**: You only get what the **form collected**. If form didn't ask for company, you don't get company.

---

## 🎯 WHAT THIS MEANS FOR YOUR BUILD

### Can You Route to Campaigns? ✅ **YES**

**Strategy**: Use `form_id` (not tags)

```javascript
// Webhook gives you:
form_id: "form_jb_webinar_123"

// Your mapping:
const campaignMap = {
  "form_jb_webinar_123": "webinar_jb_2024",
  "form_sales_webinar_456": "webinar_sales_2024",
  "form_ai_webinar_789": "webinar_ai_2024"
};

// Result:
campaign = campaignMap[form_id];  // "webinar_jb_2024"
```

✅ **This works perfectly. Form ID = which webinar they registered for.**

---

### Can You Get Contact Info? ✅ **YES**

```javascript
// From webhook:
email: "john@example.com"
name: "John Smith"
phone: "+15555555555"
custom_1: "linkedin.com/in/johnsmith"  // If form asked for it
custom_2: "50-100 employees"          // If form asked for it
custom_3: "SaaS"                       // If form asked for it
```

✅ **You get everything the form collected.**

**What you DON'T get**: Stuff the form didn't ask for.
- Form didn't ask for company? → You don't get company
- Form didn't ask for title? → You don't get title

**Solution**: Use Clay enrichment (your existing flow) to get company, title, etc.

---

### Can You Get Kajabi Tags? ⚠️ **SORT OF**

**What you get from webhook**:
```javascript
tags: [
  { id: "tag_abc123", type: "tags" },  // ← ID only, no name
  { id: "tag_xyz789", type: "tags" }   // ← ID only, no name
]
```

**Option A: Ignore tags entirely** (Recommended)
- Use `form_id` for campaign routing
- Don't care about tag names
- Simpler, more reliable

**Option B: Build tag ID → name lookup**
- One-time: Get list of all tags from Kajabi UI
- Create mapping: `tag_abc123` → "JB Webinar"
- Use in workflow to translate IDs to names

**Option C: Use API** (Requires upgrade)
- Call API to get tag names
- Get ALL historical tags, not just current form
- More complex, requires top-tier plan

**For your use case**: **Option A** is best.

---

## 🔥 CRITICAL GOTCHA: Tags vs Form ID

### The Problem with Using Tags

**Scenario**: Someone registers for multiple webinars

1. **Sept 1**: Registers for JB Webinar → Gets tag "JB Webinar"
2. **Oct 1**: Registers for Sales Webinar → Gets tag "Sales Webinar"
3. **Oct 23**: Registers for AI Webinar → Gets tag "AI Webinar"

**When Oct 23 webhook fires, what tags does it show?**

❌ **WRONG ASSUMPTION**: All 3 tags  
✅ **REALITY**: Only "AI Webinar" tag (the current form's tag)

**This is why form_id is better**:
- Form ID tells you EXACTLY which form they just submitted
- No ambiguity
- No historical confusion

---

## 📋 COMPLETE WEBHOOK PAYLOAD REFERENCE

### Every Field You Get

```javascript
{
  // SUBMISSION METADATA
  "id": "form_sub_abc123",              // ✅ Unique submission ID
  "type": "form_submissions",           // ✅ Always this value
  
  // CONTACT FIELDS (from form)
  "attributes": {
    "name": "John Smith",               // ✅ Full name
    "email": "john@example.com",        // ✅ Email
    "phone_number": "+15555555555",     // ✅ Phone
    "business_number": "",              // ⚠️ Only if form asked
    
    // ADDRESS (only if form collected)
    "address_line_1": "",               // ⚠️ Only if form asked
    "address_city": "",                 // ⚠️ Only if form asked
    "address_state": "",                // ⚠️ Only if form asked
    "address_zip": "",                  // ⚠️ Only if form asked
    "address_country": "",              // ⚠️ Only if form asked
    
    // CUSTOM FIELDS (max 3)
    "custom_1": "Value 1",              // ✅ If form has custom field 1
    "custom_2": "Value 2",              // ✅ If form has custom field 2
    "custom_3": "Value 3"               // ✅ If form has custom field 3
  },
  
  // RELATIONSHIPS
  "relationships": {
    "form": {
      "data": {
        "id": "form_jb_webinar_123",    // ✅ CRITICAL: Which form!
        "type": "forms"                 // ✅ Always "forms"
      }
    },
    "tags": {
      "data": [                         // ⚠️ Tags from THIS form only
        {
          "id": "tag_abc123",           // ⚠️ Tag ID (not name!)
          "type": "tags"                // ✅ Always "tags"
        }
      ]
    }
  }
}
```

---

## 🎯 DO YOU HAVE ENOUGH DATA?

### Your Requirements Checklist

| Need | In Webhook? | Status |
|------|------------|--------|
| Email | ✅ Yes | **GOOD** |
| Name | ✅ Yes | **GOOD** |
| Phone | ✅ Yes | **GOOD** |
| Which webinar registered for | ✅ Yes (form_id) | **GOOD** |
| Campaign routing | ✅ Yes (via form_id) | **GOOD** |
| Custom form fields | ✅ Yes (custom_1/2/3) | **GOOD** |
| Kajabi tag names | ❌ No (IDs only) | **Use form_id instead** |
| All historical tags | ❌ No (current form only) | **Don't need for routing** |
| Customer status | ❌ No (API only) | **Don't need for MVP** |
| Purchase history | ❌ No (API only) | **Don't need for MVP** |

### Verdict
✅ **You have 100% of what you need for campaign routing**

---

## 💡 RECOMMENDED WORKFLOW

### What to Do with Webhook Data

```javascript
// Step 1: Receive webhook
const payload = $input.first().json;
const submission = Array.isArray(payload) ? payload[0] : payload;

// Step 2: Extract what you need
const leadData = {
  // Contact info (you get all of this!)
  email: submission.attributes.email,
  name: submission.attributes.name,
  phone: submission.attributes.phone_number,
  
  // Form info (this is the key!)
  form_id: submission.relationships?.form?.data?.id,
  
  // Custom fields (if form collected them)
  linkedin: submission.attributes.custom_1 || '',
  company_size: submission.attributes.custom_2 || '',
  industry: submission.attributes.custom_3 || '',
  
  // Tag IDs (if you want them - but probably don't need)
  tag_ids: submission.relationships?.tags?.data?.map(t => t.id) || []
};

// Step 3: Map form → campaign
const campaignMap = {
  'form_jb_webinar_123': 'webinar_jb_2024',
  'form_sales_webinar_456': 'webinar_sales_2024',
  'form_ai_webinar_789': 'webinar_ai_2024'
};

leadData.campaign = campaignMap[leadData.form_id] || 'default_nurture';

// Step 4: Send to Airtable
// You have: email, name, phone, campaign, custom fields
// This is everything you need! ✅

// Step 5: Clay enriches the rest
// Clay gets: company name, title, employee count, etc.
// This fills in what the form didn't collect

// Step 6: SMS sends campaign-specific message
// Based on campaign field ("webinar_jb_2024")
```

---

## 🚨 COMMON QUESTIONS

### Q: "Do I get the contact's company name?"

**A**: Only if the form asked for it.

- Form has "Company" field → ✅ You get it in webhook
- Form doesn't have "Company" field → ❌ You don't get it
- **Solution**: Clay enrichment fills this in (from email domain)

---

### Q: "Do I get all their Kajabi tags?"

**A**: No, only tags applied by THIS form.

- Webhook shows: Tags from current form submission only
- Webhook doesn't show: Tags from previous forms
- **Solution**: Use form_id for routing (don't need historical tags)

---

### Q: "Do I get tag names or just IDs?"

**A**: Just IDs.

- Webhook gives: `{ id: "tag_abc123", type: "tags" }`
- Webhook doesn't give: Tag name like "JB Webinar"
- **Solution**: Use form_id for routing (don't need tag names)

---

### Q: "What if the form has 5 custom fields?"

**A**: Webhook only sends 3.

- Kajabi forms support: Up to 10+ custom fields
- Webhook sends: Only custom_1, custom_2, custom_3
- Fields 4-10: Not included in webhook
- **Solution**: Ask Ian which 3 fields are most important

---

### Q: "Can I tell if they're already a customer?"

**A**: No, not from webhook.

- Webhook doesn't include: Customer status, purchases, membership
- **To get this**: Need API (top-tier plan)
- **For MVP**: Don't need this for basic campaign routing

---

## ✅ FINAL ANSWER

### "Do I get all the fucking information I need?"

**Contact Info**: ✅ **YES**
- Email, name, phone → All there

**Which Webinar**: ✅ **YES**
- form_id tells you exactly which form

**Campaign Routing**: ✅ **YES**
- Map form_id → campaign → Done

**Custom Fields**: ✅ **YES** (first 3)
- custom_1, custom_2, custom_3 → All there

**Kajabi Tag Names**: ❌ **NO** (but you don't need them)
- Use form_id instead → Simpler and better

**Historical Tags**: ❌ **NO** (but you don't need them)
- Current form's tags only
- Use form_id instead

**Customer Status**: ❌ **NO** (API only)
- Not needed for MVP
- Can add later if needed

---

## 🎯 BOTTOM LINE

### You Get Everything You Need ✅

**For your use case**:
> "When a lead comes in via web form, capture data and route to correct campaign based on which webinar"

**Webhook gives you**:
1. ✅ Lead captured (real-time)
2. ✅ Contact info (email, name, phone)
3. ✅ Form ID (which webinar)
4. ✅ Campaign routing (via form_id mapping)
5. ✅ Custom fields (3 fields)

**What you DON'T get** (but don't need):
- ❌ Tag names (use form_id instead)
- ❌ Historical tags (use form_id instead)
- ❌ Customer status (not needed for routing)

**Verdict**: **Webhook has 100% of what you need. Build with confidence.** 🚀

---

*Last Updated: October 23, 2025*  
*Source: Kajabi webhook documentation + form_submission payload spec*

