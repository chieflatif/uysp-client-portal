[HISTORICAL]
Last Updated: 2025-01-27
Superseded by: docs/CURRENT/ICP-SCORING-V3-METHODOLOGY.md

# ICP Scoring V3.0 Methodology - Final Client Framework

## Executive Summary

This framework reflects the final client preferences from the meeting:
- **Primary Target**: Account Executives at any company size (not just enterprise)
- **Company Size**: Minimal weight - startups need coaching just as much
- **Engagement**: Most critical factor showing buying intent
- **Human Touch**: All high-scoring leads get human calls first
- **Messaging**: Soft, value-first approach (no hard sales pitch)

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

**Document Status**: ✅ **COMPLETE - CLIENT FEEDBACK INTEGRATION**  
**Last Updated**: 2025-01-27  
**Source**: Client meeting feedback and ICP refinement session  
**Implementation Priority**: Phase 2B - Immediate development ready