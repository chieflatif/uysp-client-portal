# SOP: UYSP Booking Tracking System

**Document Version:** 1.0  
**Last Updated:** September 15, 2025  
**Workflow ID:** `LiVE3BlxsFkHhG83`  
**Webhook URL:** `https://rebelhq.app.n8n.cloud/webhook/calendly`

## Purpose and Scope

This SOP provides operational procedures for the UYSP Booking Tracking System, which automatically processes Calendly booking notifications and updates lead records to stop SMS sequences for booked leads.

## System Overview

**Primary Function:** Real-time booking detection and SMS sequence management  
**Trigger:** Calendly webhook events  
**Integration:** Calendly → n8n → Airtable → Slack  
**Business Impact:** Prevents SMS spam to booked leads, improves customer experience

## Prerequisites

### Required Access:
- [ ] Calendly account with webhook configuration access
- [ ] n8n Cloud workflow management access
- [ ] Airtable base access (`app6cU9HecxLpgT0P`)
- [ ] Slack workspace access

### Required Configurations:
- [ ] Calendly webhook pointing to correct n8n URL
- [ ] n8n workflow active and properly configured
- [ ] Airtable lead table with booking fields
- [ ] Slack channel access for notifications

## System Configuration

### 1. Calendly Webhook Configuration

**Webhook URL:** `https://rebelhq.app.n8n.cloud/webhook/calendly`  
**Events:** `invitee.created` (when someone books)  
**Method:** POST  
**Authentication:** None (public webhook)

**Required Calendly Form Fields:**
- **Email:** Mandatory for lead matching
- **Phone Number:** Secondary identifier (can be in custom questions)

### 2. n8n Workflow Configuration

**Workflow Name:** `UYSP-Calendly-Booked`  
**Status:** Active  
**Webhook Path:** `calendly`  
**Response Mode:** Last Node

**Node Flow:**
1. `Webhook (Calendly)` → Receives booking data
2. `Parse Calendly` → Extracts lead identifiers
3. `Find Lead by Email` → Locates lead in Airtable
4. `Mark Booked` → Updates lead status
5. `Booked Notify` → Sends Slack alert
6. `Respond 200` → Confirms receipt to Calendly

### 3. Airtable Field Requirements

**Lead Table Fields:**
- `Email` (Text) - Primary matching field
- `Phone` (Phone) - Secondary matching field
- `Booked` (Checkbox) - Booking status flag
- `Booked At` (DateTime) - Booking timestamp
- `SMS Stop` (Checkbox) - Sequence stop flag
- `SMS Stop Reason` (Text) - Stop reason tracking
- `Processing Status` (Select) - Lifecycle status

## Daily Operations

### 1. Morning Health Check (9 AM EST)

**Webhook Status Verification:**
- [ ] Check n8n workflow execution history for overnight bookings
- [ ] Verify any booking executions completed successfully
- [ ] Review Slack `#uysp-sales-daily` for booking notifications
- [ ] Spot-check booked leads in Airtable for correct status

**Health Check Process:**
1. Navigate to `UYSP-Calendly-Booked` workflow
2. Click "Executions" tab
3. Review last 24 hours of webhook executions
4. Verify all executions show "Finished: true"
5. Check execution data for any parsing errors

### 2. Booking Verification Process

**For Each Booking Notification:**
1. **Verify Lead Found:** Check execution shows lead located in Airtable
2. **Confirm Updates Applied:** Verify all booking fields updated
3. **Check SMS Stop:** Ensure SMS sequence halted for booked lead
4. **Validate Slack Alert:** Confirm notification sent to team

**Data Verification Checklist:**
- [ ] `Booked` = true
- [ ] `Booked At` = correct timestamp
- [ ] `SMS Stop` = true
- [ ] `SMS Stop Reason` = "BOOKED"
- [ ] `Processing Status` = "Completed"

### 3. Exception Handling

**No Booking Executions When Expected:**
1. **Check Calendly Webhook Status:** Verify webhook is active
2. **Test Webhook Connectivity:** Send test webhook to n8n
3. **Review Calendly Logs:** Check for webhook delivery failures
4. **Verify n8n Availability:** Confirm webhook endpoint responding

**Booking Detected But Lead Not Found:**
1. **Check Email Match:** Verify exact email in Airtable
2. **Check Phone Match:** Verify phone format consistency
3. **Review Parsing Logic:** Check `Parse Calendly` node output
4. **Manual Update:** Apply booking status manually if needed

## Weekly Operations

### 1. Booking Data Analysis

**Weekly Booking Report:**
1. **Export Booking Data:** Download all bookings from past week
2. **Analyze Sources:** Track which campaigns generated bookings
3. **Calculate Conversion:** SMS → Click → Booking funnel
4. **Identify Patterns:** Time of day, message variants, lead characteristics

**Report Template:**
```
Week of [Date]: Booking Analysis
- Total Bookings: [X]
- SMS-to-Booking Rate: [Y]%
- Click-to-Booking Rate: [Z]%
- Peak Booking Times: [Hours]
- Top Converting Messages: [Variant A/B]
```

### 2. System Performance Review

**Webhook Performance:**
- [ ] Average response time <2 seconds
- [ ] Success rate >98%
- [ ] No missed booking events
- [ ] Proper error handling for edge cases

**Data Quality Assessment:**
- [ ] All bookings properly matched to leads
- [ ] No duplicate booking records
- [ ] Correct SMS sequence stopping
- [ ] Accurate timestamp recording

## Monthly Operations

### 1. Webhook Health Assessment

**Comprehensive Testing:**
1. **Test Booking Flow:** Book test appointment and verify full flow
2. **Test Edge Cases:** Invalid data, missing fields, duplicate events
3. **Performance Testing:** Monitor response times and reliability
4. **Security Review:** Verify webhook security and access controls

### 2. Integration Maintenance

**Calendly Integration:**
- [ ] Verify webhook configuration remains active
- [ ] Check for any Calendly platform updates affecting webhooks
- [ ] Review event type configurations
- [ ] Test with different booking scenarios

**Airtable Integration:**
- [ ] Verify field mappings remain correct
- [ ] Check for any schema changes
- [ ] Review data quality and consistency
- [ ] Update field configurations if needed

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue: Webhook Not Firing

**Symptoms:**
- Bookings occur but no n8n executions
- No Slack notifications for bookings
- Booked leads continue receiving SMS

**Diagnostic Steps:**
1. Check Calendly webhook status and configuration
2. Verify webhook URL: `https://rebelhq.app.n8n.cloud/webhook/calendly`
3. Test webhook with manual trigger
4. Review Calendly webhook logs if available

**Resolution:**
1. Verify webhook URL in Calendly matches n8n configuration
2. Check n8n workflow is active
3. Test with curl command:
```bash
curl -X POST https://rebelhq.app.n8n.cloud/webhook/calendly \
  -H "Content-Type: application/json" \
  -d '{"event":"invitee.created","payload":{"email":"test@example.com"}}'
```

#### Issue: Lead Not Found

**Symptoms:**
- Webhook fires but no Airtable updates
- Booking notifications but SMS continues
- Execution completes but no lead changes

**Diagnostic Steps:**
1. Check `Parse Calendly` node output for extracted data
2. Verify email/phone format in webhook payload
3. Compare with lead data in Airtable
4. Test Airtable search filter manually

**Resolution:**
1. Check email exact match (case-insensitive)
2. Verify phone number format consistency
3. Update matching logic if needed
4. Manual booking update if lead confirmed

#### Issue: Booking Not Stopping SMS

**Symptoms:**
- Lead marked as booked but SMS continues
- `SMS Stop` field not preventing sends
- Workflow updates but SMS Scheduler ignores

**Diagnostic Steps:**
1. Verify `SMS Stop` = true in lead record
2. Check SMS Scheduler filter includes `NOT({SMS Stop})`
3. Review timing between booking and next SMS execution
4. Confirm `Processing Status` = "Completed"

**Resolution:**
1. Manually verify all booking fields are set correctly
2. Check SMS Scheduler lead filter logic
3. Force SMS Scheduler execution to test filtering
4. Update booking workflow if field mapping incorrect

## Emergency Procedures

### Critical Booking System Failure

**Immediate Actions:**
1. **Identify Scope:** How many bookings potentially missed?
2. **Manual Processing:** Manually update any recent bookings
3. **Stop SMS Sends:** Temporarily disable SMS Scheduler if needed
4. **Alert Team:** Notify operations team of issue

**Recovery Steps:**
1. **Diagnose Root Cause:** Check webhook, parsing, or Airtable issues
2. **Fix Configuration:** Address identified problems
3. **Test Thoroughly:** Verify complete booking flow works
4. **Resume Operations:** Reactivate systems after verification
5. **Backfill Data:** Manually process any missed bookings

### Data Integrity Issues

**Detection:**
- Inconsistent booking data
- Missing booking timestamps
- Incorrect SMS stop status

**Response:**
1. **Backup Current State:** Export current Airtable data
2. **Identify Corruption Scope:** Determine affected records and timeframe
3. **Manual Correction:** Fix data directly in Airtable
4. **Root Cause Analysis:** Identify and fix workflow issues
5. **Prevent Recurrence:** Update configuration to prevent repeat

## Performance Monitoring

### Key Performance Indicators

**System Health:**
- **Webhook Response Time:** Target <1 second
- **Lead Match Rate:** Target >95%
- **SMS Stop Accuracy:** Target 100%
- **Notification Delivery:** Target 100%

**Business Metrics:**
- **Booking Detection Rate:** Target 100% of actual bookings
- **SMS Sequence Stop Rate:** Target 100% for booked leads
- **False Positive Rate:** Target <1%
- **Data Accuracy:** Target 100% match with Calendly

### Monitoring Dashboard

**Daily Metrics:**
- Number of bookings processed
- Webhook execution success rate
- Lead match success rate
- Average response time

**Weekly Trends:**
- Booking volume patterns
- Peak booking times
- Conversion rates by campaign
- System reliability metrics

## Documentation and Reporting

### Daily Logs:
- Booking events processed
- Any errors or exceptions
- Manual interventions required
- System performance notes

### Weekly Reports:
- Booking volume and trends
- System performance summary
- Issues encountered and resolved
- Recommendations for improvements

### Monthly Reviews:
- Comprehensive system assessment
- Performance trend analysis
- Security and compliance review
- Documentation updates needed

---

**OPERATIONAL STATUS:** FULLY FUNCTIONAL  
**LAST TESTED:** September 15, 2025  
**NEXT REVIEW:** September 22, 2025
