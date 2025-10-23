# Kajabi Integration - Master Implementation Plan

**Last Updated**: October 23, 2025  
**Architecture**: Hybrid Real-Time (Webhook) + Daily Batch (CSV Sync)  
**Timeline**: 4 weeks (20 hours total)  
**Current Plan**: Kajabi Pro (webhooks + CSV export)

---

## 🎯 OVERVIEW

### What We're Building

**Goal**: Capture Kajabi form submissions in real-time, route to correct campaigns, send personalized SMS messages with full engagement context.

**Architecture**: Two-phase hybrid approach
1. **Phase 1**: Real-time webhook (fast initial capture)
2. **Phase 2**: Daily batch sync (complete data enrichment)

**Why Hybrid**: Speed where it matters (first touch) + Depth where it matters (follow-up)

---

## 📅 COMPLETE TIMELINE

```
Week 1: Real-Time Webhook Setup
  └─ Deliverable: Instant lead capture working

Week 2: Initial Message Optimization  
  └─ Deliverable: Fast, personalized first touch

Week 3: Daily Batch Sync Implementation
  └─ Deliverable: Full engagement data enrichment

Week 4: Follow-Up Personalization
  └─ Deliverable: Rich multi-touch sequences
```

**Total**: 20 hours over 4 weeks

---

## 🚀 PHASE 1: REAL-TIME WEBHOOK (Weeks 1-2)

### Week 1: Core Webhook Setup

**Goal**: Real-time lead capture and basic campaign routing

**Time**: 5 hours

---

#### Day 1: Kajabi Configuration (1 hour)

**Tasks**:
1. ✅ Get list of all forms from Ian
   - Form ID, Form Name, Associated Campaign
   - Example: `form_jb_webinar_123` → "JB Webinar" → Campaign "webinar_jb_2024"

2. ✅ Create form → campaign mapping table
   ```
   Form ID              | Form Name        | Campaign Assignment
   ─────────────────────|──────────────────|────────────────────
   form_jb_webinar_123  | JB Webinar       | webinar_jb_2024
   form_sales_web_456   | Sales Webinar    | webinar_sales_2024
   form_ai_web_789      | AI Webinar       | webinar_ai_2024
   ```

3. ✅ Configure webhook in Kajabi
   - Login to Kajabi → Settings → Webhooks
   - Add webhook: Event = "Form Submission"
   - URL: `https://rebelhq.app.n8n.cloud/webhook/kajabi-leads`
   - Save and test

**Deliverable**: Kajabi sends webhook on every form submission

---

#### Day 2: n8n Workflow Build (2 hours)

**Tasks**:
1. ✅ Create new n8n workflow: "UYSP-Kajabi-Realtime-Ingestion"

2. ✅ Build 10-node workflow:
   ```
   Node 1: Webhook Trigger
     └─ Receives Kajabi form_submission event
     
   Node 2: Extract Submission Data (Code)
     └─ Parse payload, extract email, name, phone, form_id
     
   Node 3: Map Form to Campaign (Code)
     └─ form_id → campaign assignment lookup
     
   Node 4: Check Duplicate in Airtable
     └─ Search by email
     
   Node 5: IF - New or Existing?
     ├─ New → Create Record
     └─ Existing → Update Record
     
   Node 6: Create/Update Airtable Lead
     └─ Write to Leads table
     
   Node 7: Create Audit Log
     └─ Write to Kajabi_Sync_Audit table
     
   Node 8: Trigger Clay Enrichment
     └─ Add to Clay enrichment queue (optional)
     
   Node 9: Error Handler
     └─ Catch and log errors
     
   Node 10: Send Notification
     └─ Slack/email on success (optional)
   ```

3. ✅ Configure each node with proper error handling

**Deliverable**: n8n workflow ready to process webhooks

---

#### Day 3: Airtable Schema Updates (1 hour)

**Tasks**:
1. ✅ Update Leads table with Kajabi fields:
   ```sql
   -- New fields to add:
   kajabi_contact_id       (Single line text)
   kajabi_form_id          (Single line text)
   kajabi_submission_id    (Single line text)
   kajabi_tags             (Long text - JSON array)
   kajabi_last_sync        (Date/time)
   kajabi_member_status    (Single select: Prospect/Active/Churned)
   lead_source_detail      (Single line text)
   ```

2. ✅ Create SMS_Templates table:
   ```sql
   campaign_id             (Single line text - primary)
   campaign_name           (Single line text)
   kajabi_tag_match        (Single line text)
   message_template        (Long text)
   active                  (Checkbox)
   created_date            (Date)
   updated_date            (Date)
   ```

3. ✅ Add sample campaign templates:
   ```
   Campaign: webinar_jb_2024
   Message: "Hi {{first_name}}, saw you at our JB webinar. 
            Quick question about {{problem}} at {{company}}?"
   ```

**Deliverable**: Airtable ready to receive webhook data

---

#### Day 4: Testing (1 hour)

**Tasks**:
1. ✅ Test with 5 sample form submissions:
   - Test 1: New lead, JB Webinar form
   - Test 2: New lead, Sales Webinar form
   - Test 3: Existing lead, AI Webinar form (update)
   - Test 4: Lead with incomplete data
   - Test 5: Duplicate submission (same email, same day)

2. ✅ Verify for each test:
   - Webhook received in n8n
   - Correct campaign assigned
   - Airtable record created/updated
   - Audit log created
   - No errors

3. ✅ Edge case testing:
   - Missing phone number
   - Invalid email format
   - Unknown form_id
   - Webhook timeout

**Deliverable**: All test cases pass

---

#### Day 5: Production Deployment (30 min)

**Tasks**:
1. ✅ Activate n8n workflow
2. ✅ Enable Kajabi webhook for all forms
3. ✅ Monitor for 24 hours
4. ✅ Check logs for errors
5. ✅ Verify first real submissions work

**Deliverable**: Phase 1 live in production

---

### Week 2: Initial Message Optimization

**Goal**: Optimize initial SMS messaging and Clay enrichment

**Time**: 3 hours

---

#### Tasks:

1. ✅ Tune Clay enrichment (1 hour)
   - Verify company name accuracy
   - Check title enrichment rate
   - Optimize ICP scoring
   - Fix any data quality issues

2. ✅ Refine SMS templates per campaign (1 hour)
   - Review initial message performance
   - A/B test different openings
   - Optimize for response rate
   - Update SMS_Templates table

3. ✅ Monitor and optimize (1 hour)
   - Track response rates by campaign
   - Identify high/low performers
   - Adjust messaging
   - Document learnings

**Deliverable**: Optimized initial outreach with >10% response rate

---

## 🔄 PHASE 2: DAILY BATCH SYNC (Weeks 3-4)

### Week 3: Batch Sync Implementation

**Goal**: Daily enrichment with complete Kajabi data

**Time**: 8 hours

---

#### Day 1: CSV Export Setup (2 hours)

**Tasks**:
1. ✅ Set up Kajabi contact export
   - Login to Kajabi → People → Contacts
   - Click "Export" → Configure fields
   - Include: Email, Name, Phone, Tags, Custom Fields, Status
   - Download sample CSV

2. ✅ Analyze CSV structure
   - Map CSV columns to Airtable fields
   - Identify tag format (comma-separated? JSON?)
   - Test with sample data

3. ✅ Set up automated export (optional)
   - Option A: Manual export daily (simple, free)
   - Option B: Browser automation (Zapier/Selenium)
   - Option C: Schedule reminder to export

**Deliverable**: CSV export process defined

---

#### Day 2: n8n CSV Parser Build (3 hours)

**Tasks**:
1. ✅ Create new n8n workflow: "UYSP-Kajabi-Daily-Sync"

2. ✅ Build sync workflow:
   ```
   Node 1: Schedule Trigger
     └─ Runs daily at 11:00 PM
     
   Node 2: Read CSV File
     └─ From Google Drive/Dropbox/local upload
     
   Node 3: Parse CSV Data
     └─ Convert to JSON
     
   Node 4: For Each Contact (Loop)
     ├─ Node 5: Search Airtable by Email
     ├─ Node 6: IF - Found or Not?
     │   ├─ Found → Update existing record
     │   └─ Not Found → Skip (or create new)
     │
     └─ Node 7: Update Airtable with:
         - kajabi_tags (all tags from CSV)
         - kajabi_member_status
         - kajabi_last_sync (current timestamp)
         - engagement_score (calculated from tag count)
   
   Node 8: Summary Report
     └─ Count: updated, not found, errors
     
   Node 9: Send Notification
     └─ Email/Slack with summary
   ```

3. ✅ Add engagement scoring logic:
   ```javascript
   // Calculate engagement score based on tags
   const tags = contact.tags.split(',');
   const highValueTags = [
     'JB Webinar', 'Sales Webinar', 'AI Webinar',
     'Downloaded Whitepaper', 'Attended Demo'
   ];
   
   const engagementScore = tags.filter(t => 
     highValueTags.includes(t.trim())
   ).length;
   
   // Score: 0-10 (number of high-value interactions)
   ```

**Deliverable**: CSV sync workflow built and tested

---

#### Day 3: Testing & Optimization (2 hours)

**Tasks**:
1. ✅ Test with sample CSV:
   - 10 existing contacts
   - 2 new contacts
   - 1 contact with no tags
   - 1 contact with 10+ tags

2. ✅ Verify:
   - Email matching works 100%
   - Tags imported correctly
   - Engagement score calculated
   - Audit logs created
   - No data overwrites (preserve existing data)

3. ✅ Optimize:
   - Handle edge cases (empty tags, special characters)
   - Add retry logic for Airtable rate limits
   - Optimize loop performance

**Deliverable**: Sync workflow ready for production

---

#### Day 4: Production Deployment (1 hour)

**Tasks**:
1. ✅ Schedule first sync for 11:00 PM
2. ✅ Export CSV from Kajabi
3. ✅ Upload to sync location (Google Drive, etc.)
4. ✅ Monitor sync execution
5. ✅ Verify results in Airtable
6. ✅ Check notification/summary report

**Deliverable**: Daily sync running in production

---

### Week 4: Follow-Up Personalization

**Goal**: Rich follow-up sequences using engagement data

**Time**: 4 hours

---

#### Tasks:

1. ✅ Design engagement-based sequences (2 hours)
   ```javascript
   // High engagement (3+ webinars)
   if (lead.engagement_score >= 3) {
     campaign = "hot_leads_priority";
     message = "Hi {{name}}, noticed you attended {{webinar_count}} 
               of our webinars. Seeing a pattern with {{title}}s 
               at {{company_size}} companies. Worth a 15-min chat?";
   }
   
   // Medium engagement (2 webinars)
   else if (lead.engagement_score >= 2) {
     campaign = "warm_leads_nurture";
     message = "Hi {{name}}, great to see you at both {{webinar_1}} 
               and {{webinar_2}}. Quick question...";
   }
   
   // Low engagement (1 webinar)
   else {
     campaign = "standard_nurture";
     message = "Hi {{name}}, saw you at {{webinar}}...";
   }
   ```

2. ✅ Update SMS Scheduler (1 hour)
   - Add engagement score check
   - Route to appropriate sequence
   - Personalize with tag data

3. ✅ A/B Testing (1 hour)
   - Test: Engagement-based vs standard messaging
   - Measure: Response rate, booking rate
   - Optimize: Adjust sequences based on results

**Deliverable**: Rich personalization improving response rates by 20%+

---

## 📊 MILESTONES & SUCCESS CRITERIA

### Milestone 1: Phase 1 Complete (End of Week 1)

**Criteria**:
- ✅ Webhook captures 100% of form submissions
- ✅ Correct campaign assigned based on form_id
- ✅ Airtable records created within 1 minute
- ✅ Initial SMS sent within 10 minutes (via Clay)
- ✅ Zero errors for 48 hours

**Metrics**:
- Webhook success rate: 99.9%+
- Time to Airtable: <60 seconds
- Campaign routing accuracy: 100%

---

### Milestone 2: Initial Message Optimized (End of Week 2)

**Criteria**:
- ✅ Clay enrichment success rate >80%
- ✅ Campaign-specific templates tested
- ✅ Response rate baseline established
- ✅ No missed leads for 7 days

**Metrics**:
- Clay enrichment rate: >80%
- Initial response rate: >10%
- Lead capture rate: 100%

---

### Milestone 3: Batch Sync Working (End of Week 3)

**Criteria**:
- ✅ Daily sync runs automatically
- ✅ CSV import success rate >95%
- ✅ Email matching works 100%
- ✅ Engagement scores calculated
- ✅ No data overwrites or losses

**Metrics**:
- Sync completion rate: 100%
- Email match rate: >95%
- Data quality: 100% (no losses)

---

### Milestone 4: Rich Personalization Live (End of Week 4)

**Criteria**:
- ✅ Engagement-based sequences deployed
- ✅ Tag data used in messaging
- ✅ Response rate improvement measured
- ✅ Client approves messaging

**Metrics**:
- Response rate lift: >20% vs baseline
- Engagement detection accuracy: 100%
- Client satisfaction: "This is amazing"

---

## 🔧 TECHNICAL REQUIREMENTS

### Kajabi
- ✅ Pro Plan (you have this)
- ✅ Admin access
- ✅ Webhook configuration access
- ✅ Contact export access

### n8n
- ✅ Cloud account (rebelhq.app.n8n.cloud)
- ✅ 2 workflows created
- ✅ Webhook trigger enabled
- ✅ Schedule trigger enabled

### Airtable
- ✅ UYSP base access
- ✅ Leads table updated
- ✅ SMS_Templates table created
- ✅ Kajabi_Sync_Audit table created

### Clay
- ✅ Enrichment running
- ✅ Integration with Airtable
- ✅ Company + title enrichment enabled

---

## 📋 PRE-IMPLEMENTATION CHECKLIST

### Information Gathering
- [ ] Get list of all Kajabi forms (IDs and names)
- [ ] Define form → campaign mappings
- [ ] Identify custom field mappings (custom_1/2/3)
- [ ] Get sample form submission for testing

### Access & Permissions
- [ ] Kajabi admin access confirmed
- [ ] n8n Cloud access confirmed
- [ ] Airtable editor access confirmed
- [ ] Clay account access confirmed

### Technical Setup
- [ ] n8n webhook URL generated
- [ ] Kajabi webhook can reach n8n (not blocked)
- [ ] Airtable API credentials in n8n
- [ ] Test Airtable connection from n8n

### Documentation Review
- [ ] Read INDEX.md
- [ ] Read HYBRID-ARCHITECTURE-REAL-TIME-PLUS-BATCH.md
- [ ] Read WEBHOOK-PAYLOAD-BREAKDOWN.md
- [ ] Read MANUAL-CONFIGURATION-GUIDE.md

---

## 🚨 RISK MITIGATION

### Risk 1: Webhook Failures

**Risk**: Kajabi webhook fails to reach n8n  
**Likelihood**: Low  
**Impact**: High (missed leads)

**Mitigation**:
- Monitor webhook success rate daily
- Set up alerts for webhook failures
- Have backup: Daily CSV import catches any missed

**Backup Plan**: Daily CSV sync ensures no leads are permanently lost

---

### Risk 2: Email Matching Issues

**Risk**: CSV email doesn't match Airtable email (typos, case sensitivity)  
**Likelihood**: Medium  
**Impact**: Medium (duplicate records)

**Mitigation**:
- Normalize emails (lowercase, trim whitespace)
- Add fuzzy matching for close matches
- Manual review of unmatched records weekly

**Backup Plan**: Dedupe tool in Airtable

---

### Risk 3: CSV Export Burden

**Risk**: Manual CSV export becomes tedious  
**Likelihood**: High (if manual)  
**Impact**: Low (just annoying)

**Mitigation**:
- Start with manual (1 min/day)
- Automate if it becomes bottleneck
- Consider API upgrade if volume justifies

**Backup Plan**: Upgrade to top-tier for API access

---

### Risk 4: Rate Limits (Airtable/n8n)

**Risk**: Batch sync hits rate limits with large contact lists  
**Likelihood**: Medium  
**Impact**: Low (sync just takes longer)

**Mitigation**:
- Add rate limit handling (wait/retry)
- Process in batches of 100
- Run overnight (plenty of time)

**Backup Plan**: Optimize batch size, add delays

---

## 📈 OPTIMIZATION OPPORTUNITIES

### Month 2+

**If everything is working well, consider:**

1. **API Upgrade** (if volume justifies)
   - Eliminates manual CSV export
   - Real-time access to all data
   - Cost: ~$X/month more

2. **Advanced Segmentation**
   - Multi-touch sequences per engagement level
   - Timing optimization (when to follow up)
   - Channel optimization (SMS vs email)

3. **Predictive Scoring**
   - Machine learning on conversion patterns
   - Predict which leads will convert
   - Prioritize sales team time

4. **Real-Time Enrichment**
   - Add more data sources beyond Clay
   - Intent signals, technographics
   - Competitive intelligence

---

## 📞 SUPPORT & ESCALATION

### Issues During Implementation

**Technical Issues**:
- n8n errors → Check n8n community forum
- Airtable issues → Check Airtable support
- Kajabi issues → Check Kajabi help center

**Design Questions**:
- Review HYBRID-ARCHITECTURE document
- Check WEBHOOK-PAYLOAD-BREAKDOWN for data questions
- Refer to INDEX.md for navigation

**Blockers**:
- Document blocker clearly
- Identify root cause
- Propose 2-3 solutions
- Get client input on decision

---

## ✅ FINAL DELIVERABLES

### End of Week 1
- ✅ Real-time webhook working
- ✅ Campaign routing accurate
- ✅ Initial SMS flow complete
- 📄 Week 1 status report

### End of Week 2
- ✅ Optimized messaging templates
- ✅ Response rate baseline
- ✅ Performance metrics dashboard
- 📄 Week 2 optimization report

### End of Week 3
- ✅ Daily batch sync working
- ✅ Full engagement data in Airtable
- ✅ Sync monitoring dashboard
- 📄 Week 3 sync report

### End of Week 4
- ✅ Rich personalization sequences live
- ✅ Engagement-based routing
- ✅ Response rate improvement measured
- 📄 Final implementation report
- 📄 Operations runbook
- 📄 Client training materials

---

## 🎯 SUMMARY

**Timeline**: 4 weeks (20 hours)

**Phase 1** (Weeks 1-2): Real-time webhook
- Fast initial capture and response
- 90% of value delivered
- Zero upgrade cost

**Phase 2** (Weeks 3-4): Daily batch sync
- Complete data enrichment
- Rich follow-up personalization
- Remaining 10% of value

**Result**: Fast + complete system with no API upgrade needed

---

**Ready to Build?** Start with Week 1, Day 1 and follow this plan step-by-step. 🚀

---

*Last Updated: October 23, 2025*  
*Next Review: After Phase 1 completion (Week 2)*

