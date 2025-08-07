# ICP Scoring V3.0 Methodology - Enhanced AI-Driven Framework

## Executive Summary

This framework integrates customer data insights with the V3.0 methodology for an AI-optimized scoring system:
- **Primary Target**: Account Executives (60%+ of high-value customers) with 1-5 years experience
- **AI-First Approach**: Claude API primary scoring with domain-based fallback
- **Company Size**: Minimal weight (25% max) - B2B SaaS focus, no size discrimination
- **Engagement**: Key driver (35%) - touchpoints, webinars, coaching interest
- **Outreach Threshold**: Score ≥70 triggers calls/SMS with upgrade potential assumption
- **Tech/SaaS Boost**: +15 points for tech domains, -10 for generic domains

---

## ICP Scoring Framework (0-100 Points)

### COMPANY FACTORS (25 points max)
*Further reduced from 30 points - company factors are marginal*

| Category | Criteria | Points | Weight | Notes |
|----------|----------|--------|--------|--------|
| **Company Type** | | | | |
| | B2B SaaS/Tech Company | 0-15 | High | Any B2B tech qualifies |
| | B2B Tech Services | 0-5 | Low | Only 5% of membership |
| | B2C or Unknown | 0-2 | Minimal | Rarely converts |
| **Company Recognition** | | | | |
| | Fortune 500 Tech/Known Brand | 0-10 | Medium | Salesforce, HubSpot, etc. |
| | Any Other B2B Tech | 0-8 | Medium | Size doesn't matter much |

**Note**: Company size removed entirely - *"If one works at Salesforce and one at a startup, they score about the same if intent is equal"*

### ROLE FACTORS (40 points max)
*Adjusted to reflect AE-first approach*

| Category | Criteria | Points | Weight | Notes |
|----------|----------|--------|--------|--------|
| **Title Level** | | | | |
| | Account Executive (Any Level) | 0-20 | Critical | Primary decision makers |
| | Enterprise/Strategic/Senior AE | +5 | Bonus | Premium titles |
| | Account Director/Manager | 0-18 | High | Similar to AE roles |
| | Sales Manager/Team Lead | 0-10 | Medium | Can influence but don't buy often |
| | VP/Director Sales | 0-8 | Low | "Very few sales leaders in program" |
| | SDR/BDR | 0-3 | Minimal | "99% can't afford coaching" |
| | Non-sales | 0 | None | Auto-exclude |
| **Department** | | | | |
| | Sales/Revenue | 0-10 | High | Direct fit |
| | Revenue Operations | 0-5 | Medium | Adjacent fit |
| | Other | 0 | None | Not relevant |
| **Recent Role Change** | | | | |
| | <90 days in new role | +10 | Bonus | "Huge tell" per client |

### ENGAGEMENT FACTORS (35 points max)
*Increased from 25 - "One of the most important things"*

| Category | Criteria | Points | Weight | Notes |
|----------|----------|--------|--------|--------|
| **Direct Interest Signal** | | | | |
| | Answered "Yes" to coaching interest | +10 | Critical | "They raised their hand" |
| **Content Engagement** | | | | |
| | Multiple touchpoints (3+) | 0-15 | Critical | "Shows they're indoctrinated" |
| | Recent + Historical engagement | 0-12 | High | Recency + depth |
| | Recent only (<30 days) | 0-8 | Medium | Active but not proven |
| | Historical only (>90 days) | 0-3 | Low | Needs reactivation |
| **UYSP History** | | | | |
| | Course Purchaser (non-member) | 0-10 | High | "Proven buyer" |
| | Webinar Attendee | 0-8 | High | Direct engagement |
| | Bronze/Silver Member | 0-8 | Medium | Upgrade potential |
| | Past Member | 0-5 | Low | "Haven't seen many return" |
| | Gold/Platinum Member | 0-2 | Minimal | No upgrade room |

---

## Updated Scoring Examples

### Ultra High Score (90-100)
**Example**: AE at Any B2B SaaS, Course Purchaser, Recent Role Change, Said Yes to Coaching
- B2B SaaS Company: 15 points
- Known Brand: 8 points
- Account Executive: 20 points
- Sales Department: 10 points
- Recent Role Change: 10 points
- Course Purchaser: 10 points
- Multiple Touchpoints: 15 points
- Said Yes to Coaching: 10 points
- **Total: 98 points**

### High Score (75-89)
**Example**: AE at Startup, Webinar Attendee, High Engagement
- B2B SaaS Company: 15 points
- Startup (no brand bonus): 0 points
- Account Executive: 20 points
- Sales Department: 10 points
- Webinar Attendee: 8 points
- Multiple Touchpoints: 12 points
- Recent Engagement: 8 points
- **Total: 73-83 points**

### Qualified (70-74)
**Example**: Sales Manager, Recent Engagement Only
- B2B Company: 15 points
- Sales Manager: 10 points
- Sales Department: 10 points
- Recent Engagement: 8 points
- Single Touchpoint: 5 points
- Webinar: 8 points
- **Total: 56-70 points** (needs multiple signals)

---

## Lead Routing & Human Intervention

### Action Framework by Score

| Score Range | Tier | Primary Action | Secondary Action | Timing |
|-------------|------|----------------|------------------|---------|
| 90-100 | Ultra High | Davidson calls immediately | SMS if no answer | Within minutes |
| 75-89 | High Priority | Davidson gets call list | Automated SMS sequence | Same day |
| 70-74 | Qualified | SMS Campaign only | Davidson gets B-list report | Automated |
| <70 | Archive | No action | Database only | Never contact |

### Human Intervention Rules

**Immediate Slack Alert to Davidson:**
- Any lead scoring 75+ (A-list for calling)
- Any lead that responds "Yes" to coaching interest
- Referrals (any score)
- Past high-value customers returning

**Davidson's Call Priority:**
1. Fresh leads (submitted today) scoring 90+
2. All other 90+ scores
3. 75-89 scores with "Yes" to coaching
4. 75-89 other scores (his discretion)

**Human Review Queue (via Slack):**
- **Anomalies**: High engagement but wrong title
- **International leads** (non-US numbers)
- **Unclear job titles** that might be AE equivalents
- **Data quality issues**

---

## SMS Messaging Strategy

### Message Approach
*"Not B2B prospecting - these people are already bought in"*

**Template A - Direct & Soft:**
> Hi {FirstName}, this is Ian Koniak's team. Your response to our {ResourceName} qualifies you for a free sales strategy call. We'll provide a clear path forward by end of call. {CalendlyLink}

**Template B - Value-First:**
> Hi {FirstName}, just a quick follow-up — many members make back the cost of the program (and more) during their time with us. Free strategy call: {CalendlyLink}

### SMS Sequence Timing
- **First SMS**: Within minutes of form submission
- **Second SMS**: Next business day
- **Third SMS**: Two business days later
- **Stop**: After 3 attempts

### Business Hours Only
**Monday-Friday, 9am-5pm EST** - *"We want Davidson available to call if they respond"*

---

## Critical Implementation Notes

### Scoring Philosophy
- **Engagement > Company > Role** in terms of actual buying behavior
- **Company size is nearly irrelevant** - *"Startup AEs need this just as much"*
- **Multiple touchpoints indicate "indoctrination"** - key buying signal
- **"Yes" to coaching interest = immediate high priority**

### What NOT to Do
- Don't overweight large companies
- Don't prioritize VPs/Directors (they don't buy)
- Don't ignore SDRs completely (score low but don't exclude)
- Don't use hard sales messaging (*"We're not convincing, they're already bought in"*)

---

## Testing Strategy

1. **Start with historical high-engagement lists**
2. **Test with recent webinar attendees first**
3. **Run A/B tests on messaging**
4. **Track cost per meeting** (<$5 target)

---

## Volume Expectations

- **Past members**: ~500 (low priority)
- **Recent webinar attendees**: ~2,000 (high priority)
- **Course purchasers**: ~750 (high priority)
- **High-engagement non-customers**: ~1,000 (medium priority)

---

## Future Enhancements (Phase 2)

- Personality-based messaging
- Two-way SMS conversations
- More sophisticated time zone handling
- Behavioral trigger campaigns

---

---

## 🤖 **AI-ENHANCED IMPLEMENTATION SPECIFICATIONS**

### **Updated Claude Prompt Template**

```json
{
  "updated_prompt_template": "You are an expert ICP scoring system for Untap Your Sales Potential (UYSP), a B2B sales coaching platform. Score prospects 0-100 using this methodology:\n\n**COMPANY FACTORS (25% max):**\n- B2B SaaS/Tech: 15 points (salesforce.com, hubspot.com, etc. +15 tech boost)\n- Known Brand: +10 points (Fortune 500 recognition)\n- Generic domains: -10 points (gmail.com, yahoo.com, etc.)\n- B2C/Unknown: 2 points max\n\n**ROLE FACTORS (40% max):**\n- Account Executive (any level): 20 points (60%+ of successful customers)\n- Enterprise/Senior AE: +5 bonus (25 total)\n- 3+ years experience: +10 points (proven sweet spot)\n- Recent role change (<90 days): +10 points\n- SDR/BDR: 3 points (99% can't afford)\n- Non-sales: 0 points\n\n**ENGAGEMENT FACTORS (35% max):**\n- 'Yes' to coaching interest: +10 points (critical signal)\n- Multiple touchpoints (3+): 15 points (shows indoctrination)\n- Webinar attendance: 8-10 points\n- Course purchaser: 10 points (proven buyer)\n- Sales-focused motivations: +5 points\n\n**ROUTING LOGIC:**\n- 90-100: Ultra (immediate human call)\n- 75-89: High (same-day outreach)\n- 70-74: Qualified (SMS campaign)\n- <70: Archive\n\n**OUTPUT REQUIRED:** Return JSON with {score: number, tier: string, reason: string, outreach_potential: boolean (true if >=70), human_review_needed: boolean, domain_boost_applied: number}\n\nAnalyze this prospect data and return the JSON scoring result:",

  "js_function": "function calculateICPScore(prospectData) {\n  let score = 0;\n  let reasons = [];\n  let domainBoost = 0;\n  let humanReview = false;\n  \n  // COMPANY FACTORS (25 max)\n  const email = prospectData.email || '';\n  const company = prospectData.company || '';\n  const domain = email.split('@')[1] || '';\n  \n  // Tech domain boost/penalty\n  const techDomains = ['salesforce.com', 'hubspot.com', 'microsoft.com', 'google.com', 'amazon.com'];\n  const genericDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];\n  \n  if (techDomains.some(d => domain.includes(d))) {\n    domainBoost = 15;\n    score += 15;\n    reasons.push('Tech domain boost +15');\n  } else if (genericDomains.some(d => domain.includes(d))) {\n    domainBoost = -10;\n    score -= 10;\n    reasons.push('Generic domain penalty -10');\n  }\n  \n  // B2B SaaS/Tech company\n  if (company.toLowerCase().includes('saas') || company.toLowerCase().includes('software') || company.toLowerCase().includes('tech')) {\n    score += 15;\n    reasons.push('B2B SaaS/Tech +15');\n  }\n  \n  // ROLE FACTORS (40 max)\n  const title = (prospectData.title || '').toLowerCase();\n  const experience = prospectData.experience_years || 0;\n  const recentRoleChange = prospectData.recent_role_change || false;\n  \n  // AE roles (60%+ of successful customers)\n  if (title.includes('account executive') || title.includes('ae ')) {\n    score += 20;\n    reasons.push('Account Executive +20');\n    \n    if (title.includes('senior') || title.includes('enterprise') || title.includes('strategic')) {\n      score += 5;\n      reasons.push('Senior/Enterprise AE +5');\n    }\n  } else if (title.includes('account manager') || title.includes('account director')) {\n    score += 18;\n    reasons.push('Account Management +18');\n  } else if (title.includes('sales manager') || title.includes('team lead')) {\n    score += 10;\n    reasons.push('Sales Management +10');\n  } else if (title.includes('sdr') || title.includes('bdr') || title.includes('business development')) {\n    score += 3;\n    reasons.push('SDR/BDR +3');\n  } else if (!title.includes('sales') && !title.includes('revenue')) {\n    score += 0;\n    reasons.push('Non-sales role +0');\n  }\n  \n  // Experience boost (3+ years sweet spot)\n  if (experience >= 3) {\n    score += 10;\n    reasons.push('3+ years experience +10');\n  }\n  \n  // Recent role change\n  if (recentRoleChange) {\n    score += 10;\n    reasons.push('Recent role change +10');\n  }\n  \n  // ENGAGEMENT FACTORS (35 max)\n  const coachingInterest = prospectData.interested_in_coaching || false;\n  const touchpoints = prospectData.touchpoint_count || 0;\n  const webinarAttendee = prospectData.webinar_attendee || false;\n  const coursePurchaser = prospectData.course_purchaser || false;\n  const salesMotivation = prospectData.sales_focused_motivation || false;\n  \n  if (coachingInterest) {\n    score += 10;\n    reasons.push('Coaching interest +10');\n  }\n  \n  if (touchpoints >= 3) {\n    score += 15;\n    reasons.push('Multiple touchpoints +15');\n  } else if (touchpoints >= 1) {\n    score += 8;\n    reasons.push('Some engagement +8');\n  }\n  \n  if (webinarAttendee) {\n    score += 8;\n    reasons.push('Webinar attendee +8');\n  }\n  \n  if (coursePurchaser) {\n    score += 10;\n    reasons.push('Course purchaser +10');\n  }\n  \n  if (salesMotivation) {\n    score += 5;\n    reasons.push('Sales motivation +5');\n  }\n  \n  // Anomaly detection for human review\n  if ((touchpoints > 5 && score < 50) || (coachingInterest && !title.includes('sales'))) {\n    humanReview = true;\n  }\n  \n  // Cap at 100\n  score = Math.min(100, Math.max(0, score));\n  \n  // Determine tier\n  let tier;\n  if (score >= 90) tier = 'Ultra';\n  else if (score >= 75) tier = 'High';\n  else if (score >= 70) tier = 'Qualified';\n  else tier = 'Archive';\n  \n  return {\n    score: score,\n    tier: tier,\n    reason: reasons.join('; '),\n    outreach_potential: score >= 70,\n    human_review_needed: humanReview,\n    domain_boost_applied: domainBoost,\n    claude_api_fallback: true\n  };\n}",

  "airtable_updates": [\n    {\n      "field_name": "outreach_potential",\n      "field_type": "checkbox",\n      "description": "True if ICP score >= 70, triggers calls/SMS campaigns"\n    },\n    {\n      "field_name": "human_review_needed",\n      "field_type": "checkbox", \n      "description": "Flags anomalies requiring manual review"\n    },\n    {\n      "field_name": "domain_boost_applied",\n      "field_type": "number",\n      "description": "Points added/subtracted based on email domain (+15 tech, -10 generic)"\n    },\n    {\n      "field_name": "experience_years",\n      "field_type": "number",\n      "description": "Years of sales experience (3+ gets +10 points)"\n    },\n    {\n      "field_name": "recent_role_change",\n      "field_type": "checkbox",\n      "description": "Started new role within 90 days (+10 points)"\n    },\n    {\n      "field_name": "touchpoint_count",\n      "field_type": "number",\n      "description": "Number of engagement touchpoints (3+ gets +15 points)"\n    },\n    {\n      "field_name": "sales_focused_motivation",\n      "field_type": "checkbox",\n      "description": "Motivation is sales/revenue focused vs mindset (+5 points)"\n    },\n    {\n      "field_name": "claude_api_used",\n      "field_type": "checkbox",\n      "description": "True if Claude API was used for scoring (vs fallback)"\n    }\n  ],

  "testing_examples": [\n    {\n      "name": "High-Value AE at Tech Company",\n      "input": {\n        "email": "john.doe@salesforce.com",\n        "title": "Senior Account Executive",\n        "company": "Salesforce",\n        "experience_years": 4,\n        "interested_in_coaching": true,\n        "touchpoint_count": 5,\n        "webinar_attendee": true,\n        "recent_role_change": false\n      },\n      "expected_output": {\n        "score": 95,\n        "tier": "Ultra",\n        "outreach_potential": true,\n        "reason": "Tech domain boost +15; B2B SaaS/Tech +15; Senior Account Executive +25; 3+ years experience +10; Coaching interest +10; Multiple touchpoints +15; Webinar attendee +8"\n      }\n    },\n    {\n      "name": "Startup AE with High Engagement", \n      "input": {\n        "email": "sarah@startupco.com",\n        "title": "Account Executive",\n        "company": "StartupCo",\n        "experience_years": 2,\n        "interested_in_coaching": true,\n        "touchpoint_count": 4,\n        "course_purchaser": true\n      },\n      "expected_output": {\n        "score": 78,\n        "tier": "High",\n        "outreach_potential": true,\n        "reason": "B2B SaaS/Tech +15; Account Executive +20; Coaching interest +10; Multiple touchpoints +15; Course purchaser +10"\n      }\n    },\n    {\n      "name": "SDR with Generic Email",\n      "input": {\n        "email": "mike@gmail.com", \n        "title": "Sales Development Representative",\n        "company": "TechCorp",\n        "experience_years": 1,\n        "touchpoint_count": 2,\n        "sales_focused_motivation": true\n      },\n      "expected_output": {\n        "score": 23,\n        "tier": "Archive", \n        "outreach_potential": false,\n        "reason": "Generic domain penalty -10; B2B SaaS/Tech +15; SDR/BDR +3; Some engagement +8; Sales motivation +5"\n      }\n    },\n    {\n      "name": "Recent Role Change AE",\n      "input": {\n        "email": "alex@hubspot.com",\n        "title": "Account Executive", \n        "company": "HubSpot",\n        "experience_years": 5,\n        "recent_role_change": true,\n        "touchpoint_count": 1,\n        "webinar_attendee": true\n      },\n      "expected_output": {\n        "score": 86,\n        "tier": "High",\n        "outreach_potential": true,\n        "reason": "Tech domain boost +15; B2B SaaS/Tech +15; Account Executive +20; 3+ years experience +10; Recent role change +10; Some engagement +8; Webinar attendee +8"\n      }\n    },\n    {\n      "name": "Sales Manager at Enterprise",\n      "input": {\n        "email": "lisa@microsoft.com",\n        "title": "Sales Manager",\n        "company": "Microsoft", \n        "experience_years": 6,\n        "touchpoint_count": 3,\n        "interested_in_coaching": false\n      },\n      "expected_output": {\n        "score": 73,\n        "tier": "Qualified",\n        "outreach_potential": true,\n        "reason": "Tech domain boost +15; B2B SaaS/Tech +15; Sales Management +10; 3+ years experience +10; Multiple touchpoints +15"\n      }\n    }\n  ],

  "monitoring": "{\n  \"key_metrics\": [\n    \"claude_api_success_rate\": \"Track API uptime and response quality\",\n    \"fallback_usage_rate\": \"Monitor when domain-based scoring is used\", \n    \"score_distribution\": \"Track Ultra/High/Qualified/Archive percentages\",\n    \"outreach_conversion_rate\": \"Measure score >=70 to meeting conversion\",\n    \"human_review_accuracy\": \"Validate anomaly detection effectiveness\",\n    \"domain_boost_impact\": \"Analyze tech domain scoring improvements\"\n  ],\n  \"alerts\": [\n    {\n      \"metric\": \"claude_api_failure_rate\",\n      \"threshold\": \">5%\", \n      \"action\": \"Switch to fallback scoring, notify dev team\"\n    },\n    {\n      \"metric\": \"ultra_tier_percentage\", \n      \"threshold\": \">15% or <3%\",\n      \"action\": \"Review scoring calibration\"\n    },\n    {\n      \"metric\": \"outreach_potential_conversion\",\n      \"threshold\": \"<10%\",\n      \"action\": \"Analyze threshold effectiveness, consider adjustment\"\n    }\n  ],\n  \"dashboards\": {\n    \"real_time\": \"Score distribution, API health, outreach pipeline\",\n    \"weekly\": \"Conversion rates by tier, human review outcomes\", \n    \"monthly\": \"ROI analysis, model performance, threshold optimization\"\n  }\n}"
}
```

---

**Document Status**: ✅ **ENHANCED WITH AI INTEGRATION**  
**Last Updated**: 2025-01-27  
**Source**: Customer data analysis + V3.0 methodology + AI optimization  
**Implementation Priority**: Phase 2B - AI-driven scoring system ready