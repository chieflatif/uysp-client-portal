# UYSP Master Reference & Architecture
*Complete System Specification and Success Framework*

## Executive Summary

### What We're Building
An automated lead qualification and outreach system that transforms UYSP's manual process (100 leads/day) into an AI-powered system processing 700+ leads/week initially, scaling to 7,000/week. The system qualifies leads, enriches data, scores them 0-100, and sends personalized SMS to book meetings.

### Key Business Metrics
- **Current State**: 40 manual calls/day → 6-8 conversations → 1-2 meetings
- **Target State**: 700+ automated touches/week → 70+ conversations → 50+ meetings
- **ROI**: 3-5x increase in meetings booked at <$5 per meeting
- **Timeline**: MVP in 4 weeks, full system in 12 weeks

### Critical Decisions Made
1. **SMS-First Strategy**: No email improvements (accepting 14% open rate)
2. **Apollo-Only Enrichment**: Single provider for simplicity
3. **Two-Phase Qualification**: Verify B2B tech first, then sales role
4. **Human Review Queue**: Route unclear cases for manual review
5. **No Complex CRM**: Airtable as simple identity layer

---

## System Architecture

### High-Level Flow

```
Kajabi Forms → Zapier Webhook → n8n Orchestration
    ↓
Field Normalization (MANDATORY FIRST STEP)
    ↓
Identity Resolution (Airtable)
    ↓
Two-Phase Qualification:
├─ Phase 1: Company (Apollo Org API) → B2B Tech?
│   ├─ Yes → Phase 2
│   └─ No → Archive
└─ Phase 2: Person (Apollo People API) → Sales Role?
    ├─ Yes → ICP Scoring (0-100)
    └─ No → Human Review
    ↓
Routing Decision:
├─ Score 70+ with Phone → SMS Campaign
├─ Score 70+ no Phone → Skip (Phase 1)
├─ Score <70 → Archive
└─ Unclear → Human Review
```

For validation testing, session-0-validator.py creates output files like tests/session-0-results.json. Add in script: import os; os.makedirs('tests', exist_ok=True). Docs: Generalize paths (e.g., avoid absolute like /Users/...); verify webhook URL accessibility before tests to handle reliability issues.

### Technology Stack & Costs

| Platform | Purpose | Monthly Cost | Why This Choice |
|----------|---------|--------------|-----------------|
| n8n Cloud | Orchestration hub | $150 | Visual workflows, MCP compatible |
| Airtable Team | Identity/CRM | $240 | Simple, non-technical friendly |
| Zapier Starter | Kajabi bridge | $29 | Kajabi has no webhooks |
| SimpleTexting | SMS delivery | $300 | Built-in compliance |
| Apollo Pro | Enrichment | $99 | Two-phase qualification |
| API Costs | Various | ~$130 | Pay-per-use enrichment |
| **Total** | **Platform costs** | **~$948** | Under $1k target |

---

## Data Architecture

### Core Tables (Airtable)

#### 1. People - Golden Records
Primary key: email
Secondary identifier: linkedin_url
**Critical Fields**:
- Identity: email, phone_primary, first_name, last_name
- Enrichment: company, title, linkedin_url, phone_enriched
- Scoring: icp_score (0-100), icp_tier, routing
- Tracking: processing_status, test_mode_record
- **NEW**: field_mapping_success_rate, enrichment_failed

#### 2. Communications - Outreach Log
Links to: People (many-to-one)
**Tracks**: All SMS attempts, delivery, clicks
**Critical Fields**:
- message_content, sent_time, template_used
- tracking_link, clicked, delivery_status
- **NEW**: dnd_checked, time_window_checked

#### 3. Field_Mapping_Log (NEW - CRITICAL)
**Purpose**: Track unknown webhook fields
**Fields**:
- timestamp, unknown_field, webhook_source
- occurrence_count, first_seen, last_seen
**Usage**: Weekly review to update field normalizer

#### 4. Daily_Costs - Circuit Breaker
Primary key: date
**Purpose**: Hard stop at $50/day limit
**Tracks**: All API costs by service
**Critical**: circuit_breaker_triggered field

#### 5. DND_List - Compliance
Primary key: phone
**Purpose**: Never contact opt-outs
**Critical**: Checked before EVERY SMS

#### 6. Human_Review_Queue
Links to: People
**Triggers**: Unclear company, non-sales role, international
**SLA**: 48-hour review before auto-archive

#### 7. Daily_Metrics - Performance
**Enhanced Fields**:
- enhancement_rate, avg_processing_time
- sms_delivery_rate, compliance_check_rate
- field_mapping_success_rate

### Key Design Patterns
- **Identity Resolution**: Email + Phone matching with duplicate handling
- **Cache-First**: 90-day enrichment cache to reduce costs
- **Circuit Breaker**: Hard stop at daily spend limit
- **Compliance First**: DND check, time window, 10DLC
- **Field Normalization**: MANDATORY first step after webhook

---

## Two-Phase Qualification Logic

### Phase 1: Company Qualification ($0.01/check)

**Input**: Email domain or company name
**API**: Apollo Organizations API
**Check**: Is this a B2B tech company?

**Known Good Domains** (bypass API):
- Salesforce, HubSpot, Microsoft, Google
- Any domain in "known_b2b_tech" list

**Decision Tree**:
- B2B Tech → Proceed to Phase 2
- Non-B2B → Archive immediately  
- Unclear → Human review queue
- No data → Human review queue

### Phase 2: Person Enrichment ($0.025/check)

**Trigger**: ONLY if Phase 1 passes
**API**: Apollo People API
**Check**: Is this a sales/revenue role?

**Sales Keywords**: 
- **Positive**: "sales", "account executive", "business development", "revenue"
- **Negative**: "engineer", "marketing", "support", "success"

**Decision Tree**:
- Sales role → ICP Scoring
- Non-sales → Human review
- No title → Human review
- CEO/Founder → Special handling

### Cost Optimization
- Phase 1 filters ~72% of leads
- Only 28% proceed to Phase 2
- Saves $0.025 per filtered lead
- Monthly savings: ~$400

---

## ICP Scoring Algorithm

### Primary Method: Claude AI Analysis
```javascript
const scoringPrompt = `
Score this sales professional 0-100 based on:
- Title: ${enrichedData.title}
- Company: ${enrichedData.company} 
- Company Size: ${enrichedData.company_size}
- Technologies: ${enrichedData.technologies}

Scoring Guidelines:
95-100: Enterprise AE at Tier 1 B2B SaaS
85-94: Strategic/Enterprise AE at known B2B
70-84: Mid-Market AE or Senior SDR
50-69: SMB AE or SDR
30-49: Junior SDR or unclear role
0-29: Not sales or very junior

Return only the numeric score.
`;
```

**Fallback Method: Domain-Based Scoring**
Used when Claude API fails or times out:

```javascript
const domainScores = {
  'salesforce.com': 95,
  'hubspot.com': 90,
  'microsoft.com': 90,
  // ... extensive list
  'unknown': 60
};
```

### Routing Logic

| Score | Tier | Action | Timing |
|-------|------|--------|---------|
| 95-100 | Ultra | SMS immediately | <1 min |
| 85-94 | High | SMS within 5 min | Quick |
| 70-84 | Medium | SMS within 15 min | Standard |
| 50-69 | Low | Archive | None |
| 0-49 | Archive | No action | None |
| Error | Review | Human queue | 48hr SLA |

## SMS Execution Framework

### Compliance Requirements

**10DLC Registration**: 
- Pre-registration: 1,000 SMS/month limit
- Post-registration: Based on trust score
- Current: TEN_DLC_REGISTERED=false

**Time Windows**: 
- 8am-9pm recipient local time
- Timezone detection via area code
- Fallback to company timezone

**DND Enforcement**:
- Check before EVERY send
- Instant opt-out processing
- Weekly audit of compliance

### SMS Template Structure

```
[Personalization] + [Value Prop] + [CTA] = <135 chars
```

**Examples**:
```
"Hi {first_name}, saw you joined {company} as {title}! 
Other {similar_title}s love our {value_prop}. 
Chat with Davidson? {tracking_link}"
```

### Tracking & Attribution
- Unique short links per recipient
- UTM parameters: source, medium, campaign, content
- Click tracking via redirect
- Meeting attribution via Calendly webhook

## Implementation Phases

### Phase 1: MVP Foundation (Month 1)

**BUILDING**: 
✅ Webhook reception with field normalization
✅ Lead validation and deduplication  
✅ Two-phase qualification (B2B → Sales)
✅ ICP scoring with Claude AI
✅ One-way SMS to qualified leads
✅ Basic metrics and cost tracking
✅ Python validation suite (session-0-validator.py) for webhook testing, requiring requests library. Handle None in special_checks: if special_checks: for check in special_checks: .... Test booleans ('yes', 1) and international phones (+44...). Success: 95% pass rate in JSON output with timestamps.

**NOT BUILDING**: 
❌ Two-way SMS conversations
❌ Phone enrichment services
❌ Email automation changes
❌ LinkedIn automation
❌ Complex multi-touch sequences
❌ Real-time dashboards

### Phase 2: Scale & Optimize (Month 2)
**Adding**:
- Database mining (30k existing contacts)
- Enhanced delivery tracking
- SMS template A/B testing
- Batch processing optimization
- Weekly performance reports

**Still NOT**:
- Two-way SMS (wait for Month 3)
- Email campaigns
- Voice calling
- Multi-channel orchestration

### Phase 3: Intelligence Layer (Month 3)
**Finally Adding**:
- Two-way SMS with Claude AI
- Phone enrichment for high-value (85+)
- Behavioral triggers
- Re-engagement campaigns
- Predictive scoring

### Phase 4-6: Future Vision
**Potential** (not committed):
- Email automation outside Kajabi
- LinkedIn automation
- Voice AI calling
- WhatsApp international
- Full omnichannel orchestration

## Success Metrics Framework

### Three Levels of Measurement

#### Level 1: System Execution (We Control)
**Definition**: Our code working correctly
**Target**: 100% success rate

| Metric | Success Criteria | Measurement |
|--------|------------------|-------------|
| Webhook Processing | 100% return 200 | Response logs |
| Field Normalization | 95%+ field capture | Mapping success rate |
| Lead Validation | 100% validated | No invalid data |
| ICP Scoring | 100% scored | Score field populated |
| Routing Logic | 100% routed | Routing field set |
| Cost Tracking | 100% logged | Daily_Costs updated |

#### Level 2: External Dependencies (We Monitor)
**Definition**: Third-party service performance
**Target**: Work around failures

| Service | Expected | If Down | Our Response |
|---------|----------|---------|--------------|
| Apollo API | 95% uptime | Can't enrich | Use cache + queue |
| Claude API | 95% uptime | Can't score | Domain fallback |
| SimpleTexting | 99% uptime | Can't SMS | Retry queue |
| Twilio | 95% uptime | Can't validate | Skip validation |

#### Level 3: Business Outcomes (We Enable)
**Definition**: Results from everything working
**Target**: Hit business goals

| Metric | Month 1 Target | Formula | Proves |
|--------|----------------|---------|---------|
| Meetings Booked | 30+ | Tracking links | System works |
| SMS → Meeting | 5%+ | Meetings/SMS sent | Message quality |
| Cost per Meeting | <$5 | Total cost/Meetings | Economics work |
| Processing Time | <5 min | End time - Start time | Fast enough |

### Month 1 Success Definition

**Minimum Viable Success**
✅ System processes 95%+ leads without errors
✅ 20+ meetings booked
✅ Zero compliance violations  
✅ Costs tracked and controlled

**Target Success**
✅ System processes 99%+ leads
✅ 30+ meetings booked
✅ 5%+ SMS conversion rate
✅ <$5 per meeting

**Exceptional Success**
✅ 40+ meetings booked
✅ 7%+ SMS conversion rate
✅ <$3 per meeting
✅ Ready for Phase 2 scaling

## Critical Decision Log

### Why SMS-First?
- Email: 14% open rate (not fixing)
- SMS: 98% open rate
- Target: Mobile sales professionals
- Timing: Strike while intent is hot
- Compliance: SimpleTexting handles

### Why Apollo Only?
- Simplifies integration (one API)
- Adequate data quality (80%+)
- Predictable costs
- Two-phase saves money
- Good enough for MVP

### Why Not HubSpot?
- Ian: "Don't want it in HubSpot"
- Adds complexity
- Airtable simpler for team
- Visual database preferred
- Easy no-code automation

### Why Human Review Queue?
- ~30% of leads are unclear
- Preserves potential value
- Learning opportunity
- Improves algorithm
- Safety net for edge cases

## Risk Mitigation

### Technical Risks

| Risk | Impact | Mitigation | Owner |
|------|--------|------------|-------|
| API Rate Limits | Halts processing | Exponential backoff + queue | System |
| Cost Overrun | Budget breach | Circuit breaker at $50/day | System |
| Field Variations | Data loss | Field normalizer + monitoring | PM |
| Platform Bugs | Features break | Document + workaround | PM |

### Business Risks

| Risk | Impact | Mitigation | Owner |
|------|--------|------------|-------|
| Low Qualification | Few SMS | Adjust thresholds | Team |
| Poor SMS Response | No meetings | Test templates | Team |
| Compliance Issues | Legal risk | Built-in checks | System |
| Team Adoption | Manual continues | Training + docs | PM |

## Operational Handoffs

### For Development (Cursor AI)
- Patterns in order: 00 → 01 → 02 → 03 → 04 → 05
- Test requirements: 10 payloads minimum
- Evidence required: IDs for all claims
- Platform gotchas: See Critical Patterns doc

### For Operations (Human Team)
- **Daily**: Check human review queue
- **Daily**: Monitor cost dashboard
- **Weekly**: Review Field_Mapping_Log
- **Weekly**: Analyze conversion metrics
- **Monthly**: Optimize templates

### For Sales (End Users)
- **What changes**: Leads arrive pre-qualified
- **Timing**: Meetings book automatically
- **Quality**: Only ICP 70+ reach you
- **Volume**: Expect 10-15 meetings/week
- **Your job**: Close deals, not qualify

## Appendix: Technical Specifications

### Required API Keys

```yaml
Apollo:
  - API_KEY: Required
  - Plan: Pro ($99/month)
  - Credits: 2,000/day
  
SimpleTexting:
  - API_KEY: Required  
  - PHONE_NUMBER: E.164 format
  - 10DLC: Register before production
  
Twilio:
  - ACCOUNT_SID: Required
  - AUTH_TOKEN: Required
  - Services: Lookup API v2
  
Claude:
  - API_KEY: Required
  - Model: claude-4-opus
  - Usage: ICP scoring
  
Airtable:
  - PERSONAL_ACCESS_TOKEN: Required
  - Scopes: data.records:read/write
  - Base_ID: From URL
```

### Webhook Configuration

```javascript
// Zapier → n8n webhook format
{
  method: 'POST',
  headers: {
    'X-API-Key': 'your-webhook-key',
    'Content-Type': 'application/json'
  },
  body: {
    // Highly variable fields - see normalizer
    email: 'user@example.com', // or Email, EMAIL, email_address
    name: 'John Doe',          // or Name, full_name, etc.
    phone: '555-0123',         // or Phone, phone_number, etc.
    company: 'Acme Corp',      // or Company, company_name, etc.
    // ... 50+ possible field variations
  }
}
```

**Python-Based Webhook Validation**
To test this webhook configuration, use session-0-validator.py which sends payloads via requests library. Install dependencies: pip install requests (Python 3.12+). Handle errors gracefully: try: response = requests.post(url, json=payload) except requests.exceptions.RequestException: log_error(). Note: Webhook failures (e.g., timeouts) should skip tests; consider mocking with httpbin.org for local testing.

### Cost Control Configuration

```javascript
// Daily limit enforcement
const DAILY_COST_LIMIT = 50; // USD
const COSTS = {
  APOLLO_ORG: 0.01,
  APOLLO_PERSON: 0.025,
  TWILIO_LOOKUP: 0.015,
  SMS_SEND: 0.02,
  CLAUDE_API: 0.001
};

// Circuit breaker logic
if (todayCosts + nextCallCost > DAILY_COST_LIMIT) {
  throw new Error('Daily cost limit exceeded');
}
```

For Python-based monitoring extensions (e.g., in session-0-validator.py), use: try: ... except Exception as e: print(f'Error: {e}'). Note ANSI colors (\033[92m) may need Windows Terminal for portability; optionally remove for cross-platform.

This document represents the complete system architecture after extensive iteration, failure analysis, and simplification. It prioritizes SMS automation, cost control, and practical implementation over complex multi-channel orchestration.

