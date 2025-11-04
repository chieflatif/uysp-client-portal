# AI Training: Lead Form SMS Messages (Quick Reference)

**Last Updated**: 2025-11-04

---

## ⚠️ CRITICAL: SMS Length Rules

**Target**: 280-320 characters (2 SMS segments)  
**Hard Maximum**: 350 characters (never exceed)  
**Current problem**: Most examples are 350-420 chars - AI must condense by 30-40%

### Why This Matters
- Single SMS: 160 characters
- Multi-part SMS: 153 characters per segment (7 chars overhead)
- 350+ characters = 3 segments = 3x cost + recipient fatigue
- If it wouldn't fit on your phone screen in 2-3 bubbles, it's too long

### Winning Formula (260-280 chars)
```
Hi {{first_name}}, Ian's assistant here. Saw you grabbed our "[Resource]" guide. Want help implementing? Book a call: [calendly link]
```

---

## Core Message Structure

Every lead form message follows this pattern:

1. **Greeting**: "Hi {{first_name}}" (15-20 chars)
2. **Identity**: "Ian's assistant here" (20-50 chars)
3. **Acknowledgment**: "Saw you grabbed our 'Resource Name' guide" (40-80 chars)
4. **CTA**: "Want help implementing?" (20-40 chars)
5. **Link**: Calendly URL with intro (80-90 chars)

**Total**: 280-320 characters

---

## Examples by Category

### Category 1: Resource Downloads

**❌ BEFORE (TOO LONG)**: 407 characters
```
Hi {{first_name}}, this is Ian Koniak's assistant. Noticed you downloaded our "6 Golden Rules of Pricing" resource. If you want help implementing or are interested in exploring what it could be like to have a sales coach tackle your biggest challenges with you, book a free strategy call with our team here: https://calendly.com/d/cm5d-w79-8xp/sales-coaching-strategy-call-rr
```

**✅ AFTER (IDEAL)**: 260 characters (-36% reduction)
```
Hi {{first_name}}, Ian Koniak's assistant here. Noticed you grabbed our "6 Golden Rules of Pricing" guide. Want help implementing? Book a call: https://calendly.com/d/cm5d-w79-8xp/sales-coaching-strategy-call-rr
```

**What Changed**:
- "this is Ian Koniak's assistant" → "Ian Koniak's assistant here" (-6 chars)
- "downloaded...resource" → "grabbed...guide" (-5 chars)
- Removed entire bloated middle phrase (-135 chars)
- Replaced with "Want help implementing?" (+24 chars)
- "book a free strategy call with our team here:" → "Book a call:" (-31 chars)
- **Net savings: 147 characters**

---

### Category 2: Video/Training Content

**❌ BEFORE (TOO LONG)**: 387 characters
```
Hi {{first_name}}, this is Ian Koniak's assistant. Noticed you watched our "Make 500K–1M in Tech Sales" video. If you want help implementing or are interested in exploring what it could be like to have a sales coach tackle your biggest challenges with you, book a free strategy call with our team here: https://calendly.com/d/cm5d-w79-8xp/sales-coaching-strategy-call-rr
```

**✅ AFTER (IDEAL)**: 250 characters (-35% reduction)
```
Hi {{first_name}}, Ian's assistant here. Saw you watched our "Make 500K–1M in Tech Sales" video. Interested in coaching? Book a call: https://calendly.com/d/cm5d-w79-8xp/sales-coaching-strategy-call-rr
```

**Key Differences from Resource Downloads**:
- Use "watched" instead of "grabbed/downloaded"
- "Interested in coaching?" instead of "Want help implementing?"

---

### Category 3: Default/Fallback

**✅ OPTIMAL**: 285 characters
```
Hi {{first_name}}, Ian Koniak's assistant here. Thanks for your interest in UYSP. Interested in exploring sales coaching to tackle your biggest challenges? Book a free strategy call: https://calendly.com/d/cm5d-w79-8xp/sales-coaching-strategy-call-rr
```

**When to Use**: No specific resource match exists or generic nurture needed.

---

## Character-Saving Substitutions

| Instead of... | Use... | Savings |
|---------------|--------|---------|
| "this is Ian Koniak's assistant" | "Ian's assistant here" | -10 chars |
| "Ian's team at Untap Your Sales Potential" | "Ian's team at UYSP" | -20 chars |
| "If you want help implementing or are interested in exploring what it could be like to have a sales coach tackle your biggest challenges with you" | "Want help implementing?" | -120 chars |
| "book a free strategy call with our team here:" | "Book a call:" | -30 chars |
| "Noticed you downloaded" | "Saw you grabbed" | -5 chars |
| "resource" | "guide" | -3 chars |

---

## Condensed Templates (USE THESE)

### Ultra-Short Version (240-280 chars) - RECOMMENDED
```
Hi {{first_name}}, Ian's assistant here. Saw you grabbed our "[Resource Name]" guide. Want help implementing? Book a free call: https://calendly.com/d/cm5d-w79-8xp/sales-coaching-strategy-call-rr
```

### Medium Version (280-320 chars) - ACCEPTABLE
```
Hi {{first_name}}, this is Ian Koniak's assistant. Noticed you grabbed our "[Resource Name]" resource. Interested in coaching to help implement? Book a call with our team: https://calendly.com/d/cm5d-w79-8xp/sales-coaching-strategy-call-rr
```

### Template Variables
```
Hi {{first_name}}, [Ian's assistant | Ian's team at UYSP] here. 

[Saw | Noticed] you [grabbed | downloaded | watched | joined] our "[exact resource name]" [guide | resource]. 

[Want help implementing? | Interested in coaching?] 

Book a [free | ] call: https://calendly.com/d/cm5d-w79-8xp/sales-coaching-strategy-call-rr
```

---

## Character Budget Breakdown

| Component | Characters | Example |
|-----------|-----------|---------|
| Greeting | 15-20 | "Hi {{first_name}}, " |
| Identity | 20-50 | "Ian's assistant here." |
| Acknowledgment | 40-80 | "Saw you grabbed our 'Pricing Guide' guide." |
| Micro-CTA | 20-40 | "Want help implementing?" |
| Link intro | 10-20 | "Book a call:" |
| Calendly URL | 70 | https://calendly.com/... |
| **TOTAL TARGET** | **280-320** | |

---

## Action Verbs by Content Type

| Content Type | Verb |
|--------------|------|
| Guide/Template/Tool download | grabbed, downloaded |
| Video content | watched |
| Training/Webinar | joined, attended |
| Generic | engaged with |

---

## AI Generation Checklist

When generating a new first message:

1. ✅ **Identify resource type** (download, video, training, generic)
2. ✅ **Extract exact resource name** from form/tag data
3. ✅ **Choose action verb** (grabbed, watched, joined)
4. ✅ **Select greeting style** (assistant or team, both work)
5. ✅ **Keep CTA simple**: "Want help implementing?" NOT long phrases
6. ✅ **Add standard Calendly link**
7. ✅ **COUNT CHARACTERS** - target 280-320 (hard max 350)
8. ✅ **Remove all filler words** - every word must serve a purpose
9. ✅ **Review tone** - conversational, helpful, not pushy

---

## What NOT to Do ❌

### Too Long
```
Hi {{first_name}}, this is Ian Koniak's assistant from Untap Your Sales Potential. I wanted to personally reach out because I noticed you recently downloaded our comprehensive guide about the 6 Golden Rules of Pricing...
```
**Problem**: 200+ characters before even getting to the point. Recipient loses interest.

### Too Generic
```
Hi {{first_name}}, thanks for downloading our resource. Want to learn more? Click here.
```
**Problem**: Doesn't acknowledge specific resource, no personal touch.

### Too Pushy
```
Hi {{first_name}}, you NEED to book a call NOW to see results! Limited spots available!
```
**Problem**: Aggressive, creates false urgency, spammy.

---

## Tone Guidelines

✅ **DO**:
- Sound conversational (like a real assistant)
- Reference specific resource by exact name
- Use "if you want" language (permission-based)
- Provide clear next step
- Keep it brief and scannable

❌ **DON'T**:
- Use sales pressure tactics
- Create false urgency
- Be overly formal or robotic
- Forget to personalize with {{first_name}}
- Exceed 350 characters

---

## Standard Variables Available

- `{{first_name}}` - Lead's first name
- `{{last_name}}` - Lead's last name
- `{{email}}` - Lead's email
- `{{phone}}` - Lead's phone number
- `{{company}}` - Lead's company name

---

## Real-World Examples (Actual Campaigns)

### ChatGPT Use Cases
```
Hi {{first_name}}, Ian's team at UYSP here. Saw you grabbed our "Top 4 ChatGPT Use Cases" guide. Want help implementing? Book a call: https://calendly.com/d/cm5d-w79-8xp/sales-coaching-strategy-call-rr
```
**Characters**: 248

### Problem Mapping Template
```
Hi {{first_name}}, Ian Koniak's assistant here. Noticed you grabbed our "Problem Mapping Template" resource. Interested in coaching? Book a call: https://calendly.com/d/cm5d-w79-8xp/sales-coaching-strategy-call-rr
```
**Characters**: 250

### Executive Email Template
```
Hi {{first_name}}, Ian's assistant here. Saw you grabbed our "Executive Email Template" guide. Want help implementing? Book a call: https://calendly.com/d/cm5d-w79-8xp/sales-coaching-strategy-call-rr
```
**Characters**: 243

---

## Success Criteria

A high-quality first message:

1. ✅ Stays between 280-320 characters
2. ✅ Acknowledges specific resource by exact name
3. ✅ Offers clear value through implementation or coaching
4. ✅ Includes one clear CTA with booking link
5. ✅ Sounds conversational and personal
6. ✅ Is mobile-friendly (short sentences, easy to scan)

---

## Related Documents

- `AI-MESSAGE-CONTEXT-STRATEGY-2025-11-04.md` - Full AI context strategy
- `BOOKING-LINK-IMPLEMENTATION-2025-11-04.md` - Campaign booking links
- `PRD-SMS-CAMPAIGN-MANAGEMENT.md` - Campaign system specifications

---

**Maintained By**: UYSP Lead Qualification System  
**Version**: 1.0 (Condensed)
