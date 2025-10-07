# SOP: UYSP SMS Scheduler v2 with Click Tracking

**Document Version:** 3.0 - HARDENED PRODUCTION SYSTEM  
**Last Updated:** October 6, 2025  
**Workflow ID:** `UAZWVFzMrJaVbvGM`  
**Status:** ACTIVE - MANUAL OPERATION ONLY

## Purpose and Scope

This SOP provides step-by-step procedures for operating, monitoring, and maintaining the UYSP SMS Scheduler v2 workflow with integrated click tracking capabilities.

## System Overview

**Primary Function:** Manual SMS outreach with per-lead click tracking and intelligent batch control  
**Schedule:** MANUAL TRIGGER ONLY - 9 AM-5 PM Eastern Time  
**Capacity:** NO HARD-CODED LIMIT - Batch size controlled manually via Airtable `{SMS Batch Control}` field  
**Integration:** Airtable + SimpleTexting + Switchy.io + Slack  
**🚨 CRITICAL**: Enhanced safeguards after September 17, 2025 disaster (852 duplicate messages) + October 6, 2025 hardening (batch control + permanent failure handling + current client protection)

## Prerequisites

### Required Access:
- [ ] n8n Cloud account with workflow access
- [ ] Airtable base access (`app4wIsBfpJTg7pWS`)
- [ ] SimpleTexting account with API access
- [ ] Switchy.io account with API access
- [ ] Slack workspace access

### Required Credentials:
- [ ] `Airtable UYSP Option C` - Airtable API token
- [ ] `Simple-TXT-API` - SimpleTexting HTTP header auth
- [ ] `Switchy API` - Switchy.io HTTP header auth  
- [ ] `Slack account` - OAuth2 for notifications

## Daily Operations

### 1. Pre-Execution Checklist

**Before Each SMS Send:**
- [ ] Verify leads in "Ready for SMS" status exist
- [ ] Check SMS templates are current and approved
- [ ] Confirm account phone number is correct (`3102218890`)
- [ ] Verify all credentials are connected (green indicators)

**Airtable Verification:**
- [ ] Leads table has eligible records
- [ ] Settings table has active campaign configured
- [ ] Templates table has current message variants

### 2. Manual Execution Process

**Step 1: Access Workflow**
1. Navigate to n8n Cloud dashboard
2. Open `UYSP-SMS-Scheduler-v2` workflow
3. Verify workflow status shows "Active"

**Step 2: Pre-Flight Check**
1. Click on `List Due Leads` node
2. Click "Execute node" to preview eligible leads
3. Verify expected leads appear in output
4. Check lead count is reasonable (typically 2-10)

**Step 3: Execute Workflow**
1. Click "Execute workflow" button
2. Monitor execution progress in real-time
3. Watch for any red error indicators
4. Wait for completion (typically 10-15 seconds)

**Step 4: Verify Results**
1. Check execution completed successfully (green checkmarks)
2. Verify SMS Test Notify shows "Status: Sent" for all leads
3. Check Slack notifications for send confirmations
4. Confirm Airtable updates (SMS Status = "Sent", Processing Status = "In Sequence")

### 3. Post-Execution Verification

**Immediate Checks (Within 5 minutes):**
- [ ] All targeted leads show "SMS Status: Sent"
- [ ] Short Link ID and URL fields populated
- [ ] SMS Sequence Position incremented
- [ ] Processing Status updated appropriately

**Extended Checks (Within 1 hour):**
- [ ] Click tracking workflow detecting new links (runs every 10 minutes)
- [ ] No error messages in Slack channels
- [ ] SimpleTexting dashboard shows messages sent

## Click Tracking Operations

### 1. Monitoring Click Activity

**Automatic Monitoring:**
- Click tracking runs every 10 minutes automatically
- Updates Click Count and Clicked Link fields in Airtable
- Sends Slack alerts for new clicks

**Manual Check Process:**
1. Open `UYSP-Switchy-Click-Tracker` workflow
2. Click "Execute workflow" to run immediate check
3. Monitor execution for any errors
4. Verify Airtable updates for clicked leads

### 2. Click Data Verification

**Daily Verification:**
1. Compare Airtable Click Count with Switchy.io dashboard
2. Spot-check individual link statistics
3. Verify click alerts in Slack match actual activity

**Weekly Analysis:**
1. Review click-through rates by campaign
2. Identify high-performing message variants
3. Analyze click-to-booking conversion rates

## Booking Tracking Operations

### 1. Webhook Monitoring

**Automatic Process:**
- Calendly sends webhook to `https://rebelhq.app.n8n.cloud/webhook/calendly`
- Workflow automatically marks leads as booked
- SMS sequence stops immediately for booked leads

**Verification Process:**
1. Check `UYSP-Calendly-Booked` workflow execution history
2. Verify webhook executions correspond to actual bookings
3. Confirm booked leads show correct status in Airtable

### 2. Booking Data Management

**When Lead Books:**
- [ ] `Booked` field set to `true`
- [ ] `Booked At` timestamp recorded
- [ ] `SMS Stop` set to `true`
- [ ] `SMS Stop Reason` set to "BOOKED"
- [ ] `Processing Status` changed to "Completed"

## Troubleshooting Procedures

### Issue: No SMS Sent

**Diagnostic Steps:**
1. Check `List Due Leads` node output - any leads found?
2. Check `Prepare Text (A/B)` node output - leads processed?
3. Check `SimpleTexting HTTP` node output - any errors?
4. Verify account phone number: `3102218890`
5. Check SimpleTexting API credential status

**Common Causes:**
- No eligible leads in Airtable
- Credential disconnection
- Wrong account phone number
- API rate limiting

### Issue: Fallback URL in SMS

**Diagnostic Steps:**
1. Check `Create Short Link (Switchy)` node output - links created?
2. Check `Save Short Link` node output - URLs saved to Airtable?
3. Verify Switchy API credential and endpoint
4. Test link creation with curl command

**Common Causes:**
- Switchy API failure
- Wrong API endpoint configuration
- Authentication issues
- Alias collision (existing ID)

### Issue: Click Tracking Not Working

**Diagnostic Steps:**
1. Check `UYSP-Switchy-Click-Tracker` execution history
2. Verify GraphQL API connectivity
3. Test individual link click query
4. Check Airtable field mapping

**Common Causes:**
- Wrong GraphQL endpoint
- Authentication failure
- Data structure mismatch
- Airtable update errors

## Maintenance Procedures

### Daily Maintenance
- [ ] Review execution history for errors
- [ ] Check Slack notifications for issues
- [ ] Verify credential status (green indicators)
- [ ] Monitor SMS delivery rates

### Weekly Maintenance
- [ ] Analyze campaign performance metrics
- [ ] Review click-through rates
- [ ] Check booking conversion rates
- [ ] Update message templates if needed

### Monthly Maintenance
- [ ] Review and rotate API keys if needed
- [ ] Backup workflow configurations
- [ ] Update documentation with any changes
- [ ] Performance optimization review

## Emergency Procedures

### Complete System Failure

**Immediate Actions:**
1. **Stop Workflow:** Deactivate to prevent further issues
2. **Identify Scope:** Check last successful execution
3. **Assess Impact:** Count affected leads and timeframe
4. **Notify Team:** Alert via Slack with details

**Recovery Steps:**
1. **Restore from Backup:** Use latest backup from `workflows/backups/`
2. **Verify Configuration:** Check all node settings
3. **Test with Single Lead:** Manual execution with one test lead
4. **Resume Operations:** Reactivate after verification

### Credential Loss

**Detection:**
- Red warning indicators in n8n UI
- Authentication errors in execution logs
- API failure messages

**Recovery:**
1. **Identify Affected Nodes:** Check all HTTP and Airtable nodes
2. **Re-select Credentials:** Use n8n UI (cannot be done via API)
3. **Test Each Node:** Execute individual nodes to verify
4. **Full Test:** Run complete workflow with test data

### Data Corruption

**Detection:**
- Incorrect field values in Airtable
- Missing click tracking data
- Inconsistent SMS status

**Recovery:**
1. **Backup Current State:** Export current workflow
2. **Identify Timeframe:** Determine when corruption started
3. **Manual Correction:** Fix Airtable data directly
4. **Prevent Recurrence:** Fix root cause in workflow

## Performance Monitoring

### Key Metrics to Track:

**Execution Metrics:**
- Success rate (target: >95%)
- Execution time (target: <20 seconds)
- Lead processing rate (target: 2-10 leads per run)

**SMS Metrics:**
- Delivery rate (target: >98%)
- Click-through rate (benchmark: 5-15%)
- Booking conversion rate (benchmark: 1-5%)

**System Health:**
- Credential status (target: 100% connected)
- API response times (target: <2 seconds)
- Error frequency (target: <1% of executions)

### Alerting Thresholds:

**Critical Alerts:**
- Execution failure rate >5%
- No SMS sent for >1 hour during business hours
- Credential disconnection
- API errors >10% of requests

**Warning Alerts:**
- Execution time >30 seconds
- Click tracking delay >20 minutes
- Booking webhook missed >1 event

## Contact Information

### Escalation Path:
1. **Level 1:** Check this SOP and troubleshooting guide
2. **Level 2:** Review execution logs and error messages
3. **Level 3:** Contact system administrator
4. **Level 4:** Engage technical support

### Key Resources:
- **Workflow Backups:** `workflows/backups/uysp-targeted-*`
- **Documentation:** `documentation/` folder
- **Troubleshooting:** `TROUBLESHOOTING-GUIDE-COMPLETE.md`
- **API Documentation:** Switchy.io, SimpleTexting, Airtable docs

---

**DOCUMENT CONTROL:**
- **Created:** September 15, 2025
- **Version:** 2.0 (with click tracking)
- **Next Review:** September 22, 2025
- **Owner:** UYSP Operations Team
