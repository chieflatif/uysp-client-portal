# Kajabi Webhook vs API - Quick Reference Card

**Created**: October 23, 2025  
**For**: Quick decision making

---

## 🎯 THE 30-SECOND ANSWER

**Question**: Can I build my lead capture system with just webhooks (Pro Plan)?

**Answer**: ✅ **YES**

**What works with webhooks only**:
- ✅ Real-time form capture
- ✅ Campaign routing based on form
- ✅ Name, email, phone, custom fields
- ✅ Form ID detection
- ✅ 90% of your requirements

**What requires API** (optional for v2):
- Historical tags
- Customer status
- Purchase history
- Write data back to Kajabi

---

## 📊 COMPARISON AT A GLANCE

```
┌─────────────────────────┬──────────────┬──────────────┐
│ Feature                 │ Webhook      │ API          │
├─────────────────────────┼──────────────┼──────────────┤
│ Real-time capture       │ ✅ YES       │ ❌ NO        │
│ Form ID detection       │ ✅ YES       │ ⚠️ MANUAL    │
│ Name/Email/Phone        │ ✅ YES       │ ✅ YES       │
│ Custom form fields      │ ✅ YES       │ ✅ YES       │
│ ALL tags (historical)   │ ❌ NO        │ ✅ YES       │
│ Customer status         │ ❌ NO        │ ✅ YES       │
│ Purchase history        │ ❌ NO        │ ✅ YES       │
│ Update contacts         │ ❌ NO        │ ✅ YES       │
│ Complexity              │ ⭐ Simple    │ ⭐⭐ Medium  │
│ Setup time              │ 5 minutes    │ 30 minutes   │
│ Maintenance             │ Zero         │ Low          │
└─────────────────────────┴──────────────┴──────────────┘
```

---

## 🚀 RECOMMENDED PATH

### Week 1-2: Webhook MVP ✅
```
┌─────────────────────────────────────────────────┐
│ FORM SUBMITTED                                  │
│   ↓                                             │
│ WEBHOOK → n8n                                   │
│   ↓                                             │
│ Get: email, name, phone, form_id                │
│   ↓                                             │
│ Map form_id → campaign                          │
│   ↓                                             │
│ Airtable → Clay → SMS                           │
└─────────────────────────────────────────────────┘
```
**API Calls**: 0  
**Latency**: <1 second  
**Deploy**: 1 day

---

### Week 3-4: API Enhancement ⚠️
```
┌─────────────────────────────────────────────────┐
│ FORM SUBMITTED                                  │
│   ↓                                             │
│ WEBHOOK → n8n                                   │
│   ↓                                             │
│ [NEW] API: GET /contacts?email={email}          │
│   ↓                                             │
│ Get: all tags, customer status, purchases       │
│   ↓                                             │
│ Smart routing (customer vs prospect)            │
│   ↓                                             │
│ Airtable → Clay → SMS                           │
└─────────────────────────────────────────────────┘
```
**API Calls**: 1 per lead  
**Latency**: ~2-3 seconds  
**Deploy**: After MVP proven

---

## 💡 WHEN TO USE WHAT

### Use WEBHOOKS for:
- ✅ Capturing form submissions
- ✅ Getting basic lead data
- ✅ Campaign routing by form
- ✅ Real-time triggering
- ✅ Simple, reliable operations

### Use API for:
- ⚠️ Getting complete contact history
- ⚠️ Checking customer/membership status
- ⚠️ Retrieving purchase data
- ⚠️ Updating contact records
- ⚠️ Adding tags back to Kajabi

---

## 🎯 YOUR SPECIFIC USE CASE

**Requirement**: "Capture leads from web forms, route to correct campaign based on which webinar they registered for"

### ✅ Webhook Solution (Recommended)
```javascript
// Webhook payload includes form ID
const formId = webhook.relationships.form.data.id;

// Map form to campaign
const campaigns = {
  'form_jb_webinar': 'webinar_jb_2024',
  'form_sales_webinar': 'webinar_sales_2024',
  'form_ai_webinar': 'webinar_ai_2024'
};

const campaign = campaigns[formId];
```

**Result**: ✅ Perfect campaign routing with zero API calls

---

### ⚠️ API Enhancement (Optional v2)
```javascript
// After webhook, call API for enrichment
const contact = await api.getContact(email);

// Smarter routing
if (contact.customer.status === 'active') {
  campaign = 'customer_upsell';  // Different flow for customers
} else if (contact.tags.includes('High Engagement')) {
  campaign = 'hot_leads_priority';  // Fast-track engaged leads
} else {
  campaign = campaigns[formId];  // Default to form-based
}
```

**Result**: ⚠️ Smarter routing but adds complexity

---

## 🔐 AUTHENTICATION COMPARISON

### Webhooks
```
Setup: 5 minutes
─────────────────────────
1. Kajabi → Settings → Webhooks
2. Add webhook URL
3. Select "Form Submission" event
4. Save
✅ Done!

No credentials needed
No token management
No expiration handling
```

### API
```
Setup: 30 minutes
─────────────────────────
1. Kajabi → Settings → API → Create Key
2. Get client_id & client_secret
3. n8n → Credentials → OAuth2
4. Configure token endpoint
5. Test connection
6. Save
✅ Done!

OAuth 2.0 required
Tokens expire every 2 hours
n8n auto-refreshes tokens
```

---

## 📊 PERFORMANCE COMPARISON

```
┌──────────────────┬────────────┬────────────┐
│ Metric           │ Webhook    │ API        │
├──────────────────┼────────────┼────────────┤
│ Latency          │ <500ms     │ 1-3 sec    │
│ Reliability      │ 99.9%      │ 99%        │
│ Rate Limits      │ Unlimited  │ ~500/hour  │
│ Cost             │ $0         │ $0         │
│ Complexity       │ Very Low   │ Medium     │
│ Maintenance      │ Zero       │ Low        │
└──────────────────┴────────────┴────────────┘
```

---

## ⚡ DECISION TREE

```
START: Need to capture Kajabi form leads?
  │
  ├─ Is real-time capture critical?
  │  └─ YES → Use WEBHOOKS ✅
  │  └─ NO → Could use API (but webhooks still better)
  │
  ├─ Do you need historical data (all tags, purchases)?
  │  └─ YES → Use WEBHOOKS + API ⚠️
  │  └─ NO → Use WEBHOOKS only ✅
  │
  ├─ Do you need to write data back to Kajabi?
  │  └─ YES → Need API ⚠️
  │  └─ NO → Use WEBHOOKS only ✅
  │
  └─ Simple build or complex?
     └─ Simple → WEBHOOKS only ✅
     └─ Complex → WEBHOOKS + API ⚠️
```

**Most common answer**: ✅ **Start with WEBHOOKS only**

---

## 🎯 YOUR CHECKLIST

### ✅ Can Do with Webhooks (Pro Plan)
- [x] Capture form submissions in real-time
- [x] Get name, email, phone
- [x] Get custom form field values
- [x] Know which form triggered submission
- [x] Route to campaign based on form
- [x] Send to Airtable/Clay/SMS

### ⚠️ Need API for (Optional)
- [ ] Get ALL tags (not just from this form)
- [ ] Check if contact is active customer
- [ ] See purchase history
- [ ] Update contact data in Kajabi
- [ ] Add tags back to Kajabi contacts

---

## 💰 COST & VALUE

### Webhook-Only Build
```
Development: ~1 day
API Calls: 0 per lead
Monthly Cost: $0 (included)
Functionality: 90%
Business Value: HIGH ✅
```

### Webhook + API Build
```
Development: ~2 days
API Calls: 1-2 per lead
Monthly Cost: $0 (included)
Functionality: 100%
Business Value: VERY HIGH ⚠️
(but more complexity)
```

---

## 🚨 COMMON MISTAKES

### ❌ Don't Do This
```javascript
// Using API to capture form submissions
setInterval(async () => {
  const forms = await api.getFormSubmissions();
  // Process new submissions
}, 60000);  // Poll every minute
```
**Why**: Slow, unreliable, wastes API calls

### ✅ Do This Instead
```javascript
// Use webhook for real-time capture
webhook.on('form_submission', (data) => {
  // Process immediately
});
```
**Why**: Fast, reliable, no API calls

---

## 🏁 QUICK START

### Option 1: Webhook Only (Recommended)
```bash
Time: 3 hours
Complexity: ⭐ Simple
API Calls: 0

Steps:
1. Configure webhook in Kajabi (5 min)
2. Build n8n workflow (2 hours)
3. Test with forms (30 min)
4. Deploy ✅
```

### Option 2: Webhook + API
```bash
Time: 1 day
Complexity: ⭐⭐ Medium
API Calls: 1 per lead

Steps:
1. Configure webhook (5 min)
2. Set up OAuth in n8n (20 min)
3. Build enhanced workflow (3 hours)
4. Test with forms (1 hour)
5. Monitor rate limits (ongoing)
6. Deploy ✅
```

---

## 📞 FINAL RECOMMENDATION

### For Your Use Case
**Requirement**: Capture form leads → Route to campaign → Send SMS

**Best Solution**: ✅ **Webhooks Only (Phase 1)**

**Why**:
- ✅ Meets all requirements
- ✅ Simple & reliable
- ✅ Zero API calls
- ✅ Deploy in 1 day
- ✅ Zero maintenance

**When to Add API**: After 2 weeks, if you need:
- Customer detection
- Engagement scoring
- Historical tag analysis

---

## 🔗 FULL DOCUMENTATION

**Detailed Analysis**: `WEBHOOK-VS-API-GAP-ANALYSIS.md` (in same folder)

**Implementation Guide**: `MANUAL-CONFIGURATION-GUIDE.md`

**Technical Specs**: `API-INVESTIGATION-FINDINGS.md`

---

**Status**: ✅ You have everything you need  
**Plan**: Kajabi Pro (has webhooks - sufficient for build)  
**API Access**: Top-tier plan only (not required for MVP)  
**Next Step**: Configure webhook (5 min)

---

*Last Updated: October 23, 2025*

