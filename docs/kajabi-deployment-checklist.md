# Kajabi Integration - Deployment Checklist

**Date**: 2025-11-01  
**Branch**: `main` (production)  
**Status**: Ready for Testing → Deployment

---

## 📊 WORKFLOWS CREATED

### ✅ Workflow 1: UYSP-Kajabi-API-Polling
- **ID**: `0scB7vqk8QHp8s5b`
- **URL**: https://rebelhq.app.n8n.cloud/workflow/0scB7vqk8QHp8s5b
- **Trigger**: Cron (every 5 minutes)
- **Purpose**: Poll Kajabi API for new form submissions → Import to Airtable
- **Status**: ⏸️ **INACTIVE** (awaiting testing)

### ✅ Workflow 2: UYSP-Kajabi-SMS-Scheduler
- **ID**: `kJMMZ10anu4NqYUL`
- **URL**: https://rebelhq.app.n8n.cloud/workflow/kJMMZ10anu4NqYUL
- **Trigger**: Cron (every 15 minutes)
- **Purpose**: Send SMS 60 min - 3 hours after registration (8 AM - 8 PM ET)
- **Status**: ⏸️ **INACTIVE** (awaiting testing)

### ✅ Workflow 3: UYSP-SimpleTexting-Reply-Handler
- **ID**: `CmaISo2tBtYRqNs0`
- **URL**: https://rebelhq.app.n8n.cloud/workflow/CmaISo2tBtYRqNs0
- **Webhook URL**: `https://rebelhq.app.n8n.cloud/webhook/simpletexting-reply`
- **Purpose**: Capture SMS replies → Update Airtable → Email notifications
- **Status**: ⏸️ **INACTIVE** (awaiting testing + SimpleTexting config)

---

## 🔧 PRE-DEPLOYMENT SETUP

### 1. Airtable Configuration

**Required Field in Settings Table** (tblErXnFNMKYhh3Xr):
- [ ] Add field: `Kajabi Last Poll` (type: DateTime)
  - This field tracks the last API poll timestamp
  - Initial value: leave empty (will auto-populate on first run)

### 2. Gmail Credential Configuration

**Workflow 3 needs Gmail OAuth2**:
- [ ] Configure Gmail OAuth2 credential in N8N
- [ ] Update workflow node `send-email` with correct credential ID
- [ ] Test email sending capability

**Current placeholder**: `YOUR_GMAIL_CREDENTIAL_ID` (needs replacement)

**Alternative**: Can use SMTP instead of Gmail:
- Change node type from `gmail` to `n8n-nodes-base.emailSend`
- Configure SMTP credentials (host, port, username, password)

### 3. SimpleTexting Webhook Configuration

**Configure inbound SMS forwarding**:
- [ ] Login to SimpleTexting dashboard
- [ ] Go to Settings → API → Webhooks tab
- [ ] Set SMS Forwarding Webhook URL to:
  ```
  https://rebelhq.app.n8n.cloud/webhook/simpletexting-reply
  ```
- [ ] HTTP Method: **GET** (important!)
- [ ] Test with a reply SMS to verify connection

---

## 🧪 TESTING PHASE

### Test 1: Kajabi API Connection (CRITICAL)
**Run this first**: `./scripts/test-kajabi-api.sh`

Expected results:
- [ ] API authentication succeeds
- [ ] Form submissions endpoint returns data
- [ ] `created_after` filter works correctly
- [ ] Form IDs are present in responses
- [ ] Member/contact data includes all required fields

**If API test fails**:
1. Verify Kajabi API credentials in `.env` file
2. Confirm Pro plan subscription (API access required)
3. Check OAuth2 token hasn't expired in N8N
4. Review Kajabi API documentation: http://developers.kajabi.com

### Test 2: Workflow 1 (Kajabi Polling) - Manual Trigger
**Steps**:
1. [ ] Open workflow: https://rebelhq.app.n8n.cloud/workflow/0scB7vqk8QHp8s5b
2. [ ] Click "Execute Workflow" (manual trigger)
3. [ ] Verify "Get Last Poll Timestamp" node succeeds
4. [ ] Verify "Kajabi API: Get New Submissions" returns data
5. [ ] Check "Parse & Map Submissions" correctly maps form IDs
6. [ ] Confirm leads created/updated in Airtable
7. [ ] Verify `Campaign Assignment` field populated correctly
8. [ ] Check `Imported At` timestamp is set

**Expected behavior**:
- First run: imports last 24 hours of submissions
- Subsequent runs: only imports new submissions since last poll
- Duplicate emails: updates existing lead (doesn't create new)
- New emails: creates new lead record

**Success criteria**:
- [ ] At least 1 lead imported successfully
- [ ] No errors in execution log
- [ ] Airtable records match Kajabi form data
- [ ] `Campaign Assignment` mapped correctly

### Test 3: Timing Logic Validation
**Steps**:
1. [ ] Create test lead in Airtable manually:
   - Set `Imported At` = 65 minutes ago
   - Set `Campaign Assignment` = "chatgpt_use_cases"
   - Set `Phone Valid` = TRUE
   - Set `SMS Status` = "Not Sent"
   - Set `SMS Stop` = FALSE
   - Set `Booked` = FALSE

2. [ ] Open workflow: https://rebelhq.app.n8n.cloud/workflow/kJMMZ10anu4NqYUL
3. [ ] Execute manually
4. [ ] Verify lead appears in "Filter 60 Min - 3 Hour Window" node
5. [ ] Check SMS message uses correct template
6. [ ] Confirm SMS sent (if during 8 AM - 8 PM ET)

**Edge case tests**:
- [ ] Lead at 59 minutes: should NOT send
- [ ] Lead at 60 minutes: should send
- [ ] Lead at 180 minutes: should send
- [ ] Lead at 181 minutes: should NOT send
- [ ] Test before 8 AM ET: should skip all leads
- [ ] Test after 8 PM ET: should skip all leads

### Test 4: SMS Message Templates
**Verify each campaign's message**:
- [ ] `chatgpt_use_cases`: Uses Ian's team message
- [ ] `pricing_rules`: Uses Ian Koniak's assistant message
- [ ] `default_nurture`: Fallback message works
- [ ] `{{first_name}}` placeholder replaced correctly
- [ ] Calendly link present: `https://calendly.com/d/cm5d-w79-8xp/sales-coaching-strategy-call-rr`

### Test 5: Reply Handler (CRITICAL)
**Steps**:
1. [ ] Activate workflow: https://rebelhq.app.n8n.cloud/workflow/CmaISo2tBtYRqNs0
2. [ ] Configure SimpleTexting webhook (see step 3 in Pre-Deployment)
3. [ ] Send test SMS to your SimpleTexting number from a lead's phone
4. [ ] Verify webhook triggered in N8N execution log
5. [ ] Check Airtable lead updated:
   - `Last Reply At` = current timestamp
   - `Last Reply Text` = your test message
   - `Reply Count` incremented
6. [ ] Verify email received at:
   - davidson@iankoniak.com
   - rebel@rebelhq.ai
7. [ ] Check email contains:
   - Lead name, phone, email
   - Company and job title
   - Reply text
   - Link to Airtable record

**If webhook doesn't trigger**:
1. Check SimpleTexting webhook URL is correct
2. Verify webhook is active in N8N (workflow must be active)
3. Test webhook URL in browser: should return N8N webhook response
4. Check SimpleTexting API logs for errors

### Test 6: End-to-End Integration
**Full flow test**:
1. [ ] Submit test lead via Kajabi form (use real form)
2. [ ] Wait 5 minutes (polling interval)
3. [ ] Verify lead imported to Airtable
4. [ ] Wait 60 minutes
5. [ ] Verify SMS sent (if within 8 AM - 8 PM ET)
6. [ ] Reply to SMS
7. [ ] Verify reply notification received via email

**Success criteria**:
- [ ] Lead appears in Airtable within 5 minutes
- [ ] SMS sent within 60-180 minute window
- [ ] Reply captured and email sent
- [ ] All Airtable fields updated correctly
- [ ] SMS_Audit table has complete records

---

## 🚀 PRODUCTION DEPLOYMENT

### Phase 1: Activate Workflows (Sequential)

**Step 1: Activate Workflow 1 (Polling)**
- [ ] Open https://rebelhq.app.n8n.cloud/workflow/0scB7vqk8QHp8s5b
- [ ] Toggle "Active" switch ON
- [ ] Monitor first 3 executions (15 minutes)
- [ ] Verify no errors in execution log
- [ ] Check Airtable for new leads

**Step 2: Activate Workflow 2 (SMS Scheduler)**
- [ ] **Wait 24 hours** after Step 1 (let leads accumulate)
- [ ] Open https://rebelhq.app.n8n.cloud/workflow/kJMMZ10anu4NqYUL
- [ ] Toggle "Active" switch ON
- [ ] Monitor first 4 executions (1 hour)
- [ ] Verify SMS only sent during 8 AM - 8 PM ET
- [ ] Check SMS_Audit table for logs

**Step 3: Activate Workflow 3 (Reply Handler)**
- [ ] Confirm SimpleTexting webhook configured
- [ ] Open https://rebelhq.app.n8n.cloud/workflow/CmaISo2tBtYRqNs0
- [ ] Toggle "Active" switch ON
- [ ] Send test reply to confirm working
- [ ] Monitor email notifications

### Phase 2: Monitoring (First 48 Hours)

**Metrics to track**:
- [ ] Kajabi API poll success rate (should be 100%)
- [ ] Leads imported per hour
- [ ] SMS sent per hour (only 8 AM - 8 PM ET)
- [ ] SMS delivery rate (should be >95%)
- [ ] Reply capture rate
- [ ] Email notification delivery

**Check these dashboards**:
- N8N Executions: https://rebelhq.app.n8n.cloud/workflows/executions
- Airtable Leads table: app4wIsBfpJTg7pWS
- Airtable SMS_Audit table: tbl5TOGNGdWXTjhzP
- SimpleTexting dashboard for SMS delivery status

**Red flags** (require immediate action):
- ⚠️ Kajabi API errors (401 Unauthorized = credential issue)
- ⚠️ Multiple workflow failures in a row
- ⚠️ SMS sent outside 8 AM - 8 PM window
- ⚠️ Duplicate leads created (should update, not create)
- ⚠️ Reply handler not triggering
- ⚠️ Email notifications not received

---

## 🔧 TROUBLESHOOTING GUIDE

### Issue: Kajabi API Returns 401 Unauthorized
**Solution**:
1. Check OAuth2 token in N8N hasn't expired
2. Re-authenticate Kajabi OAuth2 credential
3. Verify Pro plan subscription is active
4. Check API key permissions in Kajabi settings

### Issue: No Leads Being Imported
**Possible causes**:
1. **No new form submissions**: Check Kajabi forms received submissions
2. **Polling timestamp issue**: Reset "Kajabi Last Poll" field in Settings table
3. **API filter incorrect**: Verify `created_after` parameter in API call
4. **Duplicate detection blocking**: Check if leads already exist by email

**Debug steps**:
1. Check N8N execution log for errors
2. Manually trigger workflow and inspect each node output
3. Verify API response contains `data` array
4. Check form IDs in mapping match actual Kajabi form IDs

### Issue: SMS Not Sending at Right Time
**Possible causes**:
1. **Time window check**: Verify current time is 8 AM - 8 PM ET
2. **Imported At missing**: Check lead has `Imported At` timestamp
3. **Wrong timing calculation**: Lead may be outside 60-180 min window
4. **Campaign Assignment missing**: Lead needs valid campaign

**Debug steps**:
1. Check "Filter 60 Min - 3 Hour Window" node output
2. Verify lead's `Imported At` timestamp is correct
3. Calculate manually: (current time - imported time) in minutes
4. Check workflow execution log for time window rejection

### Issue: Reply Handler Not Receiving Webhooks
**Possible causes**:
1. **Webhook URL wrong**: Verify SimpleTexting has correct URL
2. **Workflow not active**: Must toggle Active switch ON
3. **HTTP method mismatch**: SimpleTexting uses GET, not POST
4. **Webhook disabled in SimpleTexting**: Check API settings

**Debug steps**:
1. Test webhook URL in browser: `https://rebelhq.app.n8n.cloud/webhook/simpletexting-reply?from=1234567890&to=9094988474&text=test`
2. Check N8N webhook execution log
3. Verify SimpleTexting webhook configuration
4. Check SimpleTexting API logs for delivery errors

### Issue: Email Notifications Not Sending
**Possible causes**:
1. **Gmail credential not configured**: Needs OAuth2 setup
2. **Email address typo**: Verify davidson@iankoniak.com and rebel@rebelhq.ai
3. **Gmail quota exceeded**: Check daily sending limit
4. **Authentication error**: Re-authenticate Gmail

**Debug steps**:
1. Check "Send Email Notification" node execution result
2. Verify Gmail credential is valid
3. Test sending email to different address
4. Check spam folder for emails

---

## 📋 ROLLBACK PLAN

**If critical issues occur**:

### Emergency Rollback Steps:
1. **Deactivate all 3 workflows immediately**:
   - Toggle Active switch OFF for each workflow
   - This stops all processing

2. **Assess impact**:
   - Check how many leads were affected
   - Review SMS_Audit table for any erroneous sends
   - Check Airtable for data corruption

3. **Revert to webhook-based flow** (if needed):
   - Reactivate existing `UYSP-Kajabi-Realtime-Ingestion` webhook
   - Use old SMS scheduler until issues resolved

4. **Document issue**:
   - Capture N8N execution logs
   - Note what failed and when
   - Export Airtable records for analysis

---

## 📊 SUCCESS METRICS (Week 1)

### Key Performance Indicators:
- **Kajabi Polling**:
  - [ ] >99% uptime (polls every 5 minutes = 288/day)
  - [ ] Zero missed submissions
  - [ ] <5 second average API response time

- **SMS Delivery**:
  - [ ] >95% SMS sent within 60-180 min window
  - [ ] 100% compliance with 8 AM - 8 PM ET window
  - [ ] >95% delivery rate (check SimpleTexting)

- **Reply Tracking**:
  - [ ] 100% of replies captured
  - [ ] 100% of emails delivered
  - [ ] <30 second webhook processing time

- **Data Quality**:
  - [ ] Zero duplicate leads created
  - [ ] 100% campaign assignment accuracy
  - [ ] All SMS_Audit logs complete

---

## 🎯 POST-DEPLOYMENT TASKS

### Day 1:
- [ ] Monitor all 3 workflows every 2 hours
- [ ] Check Airtable for data quality
- [ ] Verify email notifications working
- [ ] Review SMS_Audit for any anomalies

### Day 2:
- [ ] Analyze first 24 hours of data
- [ ] Calculate actual SMS timing (should be 60-180 min)
- [ ] Check reply capture rate
- [ ] Review any errors or warnings

### Week 1:
- [ ] Generate performance report
- [ ] Document any issues encountered
- [ ] Optimize polling frequency if needed
- [ ] Review SMS message templates for engagement

### Week 2:
- [ ] Analyze SMS reply rates by campaign
- [ ] Calculate ROI (leads → bookings)
- [ ] Consider A/B testing different message variants
- [ ] Plan enrichment service integration (if needed)

---

## 📞 SUPPORT CONTACTS

**Technical Issues**:
- N8N Support: https://community.n8n.io/
- Kajabi API Support: https://help.kajabi.com/hc/en-us/requests/new?ticket_form_id=35398714066203
- SimpleTexting Support: support@simpletexting.net
- Airtable Support: https://support.airtable.com/

**Escalation Path**:
1. Check troubleshooting guide above
2. Review N8N execution logs
3. Test individual workflow nodes
4. Contact API provider support
5. Create backup plan (rollback if critical)

---

## ✅ FINAL PRE-LAUNCH CHECKLIST

**Complete ALL items before activating workflows**:
- [ ] Kajabi API test successful (`./scripts/test-kajabi-api.sh`)
- [ ] Airtable field `Kajabi Last Poll` created in Settings table
- [ ] Gmail OAuth2 credential configured (or SMTP alternative)
- [ ] SimpleTexting webhook URL configured
- [ ] All 3 workflows tested manually
- [ ] Timing logic validated (60 min - 3 hours, 8 AM - 8 PM ET)
- [ ] SMS message templates verified
- [ ] Reply handler tested with real SMS
- [ ] Email notifications received at both addresses
- [ ] End-to-end test completed successfully
- [ ] Rollback plan documented and understood
- [ ] Monitoring dashboard bookmarked
- [ ] Team notified of go-live time

**GO / NO-GO Decision**:
- ✅ **GO**: All items checked → Proceed with Phase 1 activation
- ❌ **NO-GO**: Any item unchecked → Address issues first

---

**Document Status**: ✅ Ready for Testing  
**Last Updated**: 2025-11-01  
**Next Steps**: Run Kajabi API test, then proceed with Test Phase




