# SOP: SMS Batch Control System

**Document Version:** 2.0  
**Last Updated:** October 6, 2025  
**Purpose:** Manual batch control for safe, scalable SMS campaigns with automated pipeline cleanup

## Overview

The SMS Batch Control system allows manual control over which leads are processed by the SMS Scheduler, enabling staged rollouts of thousands of leads without overwhelming the system or hitting rate limits.

## How It Works

### Batch Control Field
**Field Name:** `SMS Batch Control`  
**Type:** Single Select  
**Options:** 
- `Active` - Lead will be processed immediately
- (Empty) - Lead will be held until manually activated

### Filter Logic Integration
**SMS Scheduler Filter:**
```
AND(
  {Phone Valid},
  NOT({SMS Stop}),
  NOT({Booked}),
  LEN({Phone})>0,
  {SMS Eligible},
  NOT({Current Coaching Client}),
  OR(
    AND({Processing Status}='Ready for SMS', {SMS Batch Control}='Active'),
    {Processing Status}='In Sequence'
  )
)
```

**Logic Explanation:**
- **"Ready for SMS" leads:** Only processed if `SMS Batch Control` = "Active"
- **"In Sequence" leads:** Always processed regardless of batch control
- **All other filters:** Standard eligibility requirements remain

## Operational Procedures

### 1. Large Lead Import Process

**Step 1: Import Leads**
1. Import leads to Airtable with `Processing Status` = "Ready for SMS"
2. Leave `SMS Batch Control` empty (default hold state)
3. Verify all leads imported correctly

**Step 2: Staged Activation**
1. Select first batch of leads (e.g., 100 leads)
2. Set `SMS Batch Control` to "Active" for selected leads
3. Run SMS Scheduler manually or wait for scheduled run
4. Monitor results and delivery

**Step 3: Progressive Rollout**
1. Wait for first batch to complete processing
2. Activate next batch of 100 leads
3. Repeat until all leads processed

### 2. Campaign Reset Process

**For New Campaigns:**
1. **Query audit table** by old campaign ID
2. **Reset lead fields:**
   - `SMS Sequence Position` = 0
   - `SMS Sent Count` = 0
   - `SMS Status` = "Not Sent"
   - `SMS Batch Control` = (empty)
3. **Update campaign ID** in Settings table
4. **Activate first batch** for new campaign

## Safety Controls

### Rate Limiting
- **NO HARD-CODED LIMIT:** The workflow processes ALL leads marked "Active" in `{SMS Batch Control}`
- **Recommended batch size:** Start with 25-50 leads, scale gradually to 100-200 based on carrier acceptance
- **Processing interval:** Wait for batch completion before next activation
- **Monitor delivery rates:** Check for carrier throttling and spam flags
- **Automated Cleanup:** Airtable automations automatically deactivate completed/stopped leads

### Error Handling
- **Failed sends:** Leads remain in "Ready for SMS" status
- **Retry logic:** Can reactivate failed leads after investigation
- **Audit trail:** Complete record of all send attempts

### Emergency Controls
- **Pause processing:** Set all leads to empty batch control
- **Kill switch:** Disable SMS Scheduler workflow
- **Rollback:** Reset lead statuses if needed

## Monitoring and Reporting

### Daily Monitoring
1. **Check batch progress:** Count leads by batch control status
2. **Review send success rates:** Monitor delivery and failure rates
3. **Audit trail verification:** Ensure all sends properly logged

### Batch Status Queries
```sql
-- Count leads by batch status
SELECT 
  SMS_Batch_Control,
  Processing_Status,
  COUNT(*) as Lead_Count
FROM Leads 
WHERE Processing_Status IN ('Ready for SMS', 'In Sequence')
GROUP BY SMS_Batch_Control, Processing_Status
```

### Campaign Performance
- **Filter audit by campaign:** `{Campaign ID} = "AI Webinar - AI BDR"`
- **Track completion rates:** Sent vs Delivered vs Clicked vs Booked
- **Cost analysis:** Total messages per campaign

## Best Practices

### For Thousands of Leads
1. **Start small:** Test with 10-20 leads first
2. **Gradual scaling:** 50 → 100 → 200 lead batches
3. **Monitor closely:** Watch for delivery issues or rate limiting
4. **Maintain audit trail:** Ensure complete tracking for Kajabi tagging

### Campaign Management
1. **One campaign at a time:** Don't mix campaign IDs
2. **Clean resets:** Always reset lead statuses between campaigns
3. **Audit verification:** Confirm all sends logged before Kajabi tagging
4. **Documentation:** Record batch sizes and success rates

## Technical Implementation

### Airtable Field Configuration
- **Field Type:** Single Select
- **Required Option:** "Active"
- **Default:** Empty (hold state)
- **Location:** Leads table (`tblYUvhGADerbD8EO`)

### n8n Integration
- **Workflow:** `UYSP-SMS-Scheduler-v2`
- **Node:** `List Due Leads`
- **Filter:** Enhanced with batch control logic
- **Backward Compatible:** Existing "In Sequence" leads unaffected

## Troubleshooting

### Leads Not Being Processed
1. **Check batch control:** Verify "Active" status set
2. **Verify other filters:** Ensure Phone Valid, SMS Eligible, etc.
3. **Review execution logs:** Check for filter errors

### Batch Processing Issues
1. **Rate limiting:** Reduce batch size
2. **Delivery failures:** Check SimpleTexting account status
3. **Airtable limits:** Monitor API usage

### Campaign Isolation Problems
1. **Audit trail gaps:** Verify all sends logged with campaign ID
2. **Cross-campaign contamination:** Check lead reset process
3. **Kajabi tagging errors:** Ensure email addresses captured correctly
