# SOP: UYSP Click Tracking System

**Document Version:** 1.0  
**Last Updated:** September 15, 2025  
**Workflow ID:** `bA3vEZvfokE84AGY`  
**Status:** PRODUCTION ACTIVE

## Purpose and Scope

This SOP provides operational procedures for the UYSP Click Tracking System, which monitors link clicks from SMS campaigns and updates lead records with click activity data.

## System Components

### Primary Workflow: `UYSP-Switchy-Click-Tracker`
**Function:** Automated click monitoring and data updates  
**Schedule:** Every 10 minutes (`*/10 * * * *`)  
**Integration:** Switchy.io GraphQL API + Airtable

### Supporting Systems:
- **Switchy.io:** Link hosting and click analytics
- **Airtable:** Lead data storage and click count tracking
- **Slack:** Real-time click notifications

## Daily Operations

### 1. System Health Monitoring

**Morning Checklist (9 AM EST):**
- [ ] Check click tracking workflow execution history (last 24 hours)
- [ ] Verify no failed executions in n8n dashboard
- [ ] Review Slack `#uysp-tests` channel for click alerts
- [ ] Spot-check 2-3 lead records for accurate click counts

**Execution History Review:**
1. Navigate to `UYSP-Switchy-Click-Tracker` workflow
2. Click "Executions" tab
3. Verify last 144 executions (24 hours) show success
4. Investigate any failed executions immediately

### 2. Click Data Verification

**Daily Spot Check Process:**
1. **Select Test Leads:** Choose 2-3 leads with recent SMS activity
2. **Check Airtable:** Note current Click Count values
3. **Check Switchy Dashboard:** Compare with Switchy.io analytics
4. **Verify Accuracy:** Counts should match within 10-minute intervals

**Discrepancy Resolution:**
If Airtable ≠ Switchy data:
1. **Manual Workflow Run:** Execute click tracking workflow manually
2. **Check API Status:** Verify Switchy.io API connectivity
3. **Review Logs:** Check execution data for errors
4. **Manual Update:** Correct Airtable data if needed

### 3. Performance Monitoring

**Key Metrics to Track:**
- **Execution Success Rate:** Target >95%
- **Click Detection Latency:** Target <10 minutes
- **API Response Time:** Target <2 seconds
- **Data Accuracy:** Target 100% match with Switchy

## Weekly Operations

### 1. Campaign Performance Analysis

**Click-Through Rate Analysis:**
1. **Export Click Data:** Download Airtable lead data for past week
2. **Calculate CTR:** (Total Clicks / Total SMS Sent) × 100
3. **Analyze by Variant:** Compare A vs B message performance
4. **Identify Trends:** Look for patterns in high-performing messages

**Reporting Template:**
```
Week of [Date]: SMS Campaign Performance
- Total SMS Sent: [X]
- Total Clicks: [Y] 
- Click-Through Rate: [Z]%
- Top Performing Variant: [A/B]
- Booking Conversion: [N] bookings from clicks
```

### 2. System Maintenance

**Configuration Verification:**
- [ ] All workflow nodes show green status
- [ ] Credentials remain connected
- [ ] API endpoints responding correctly
- [ ] Slack notifications functioning

**Data Cleanup:**
- [ ] Archive old execution logs (>30 days)
- [ ] Review and clean test data
- [ ] Verify backup integrity

## Monthly Operations

### 1. Comprehensive System Review

**Performance Analysis:**
- Review 30-day execution history
- Analyze click patterns and trends
- Assess system reliability and uptime
- Document any recurring issues

**Configuration Audit:**
- [ ] Verify all node configurations match documentation
- [ ] Check for any unauthorized changes
- [ ] Update API keys if rotation needed
- [ ] Review and update this SOP

### 2. Backup and Recovery Testing

**Backup Verification:**
1. **Run Backup Script:** Execute `scripts/backup-uysp-only.sh`
2. **Verify Exports:** Check all workflows exported successfully
3. **Test Restore:** Import one backup to verify integrity
4. **Document Results:** Update backup logs

## Troubleshooting Procedures

### Issue: Click Tracking Stopped Working

**Symptoms:**
- No click updates in Airtable for >20 minutes
- Click tracking workflow showing failed executions
- Missing click alerts in Slack

**Diagnostic Steps:**
1. **Check Workflow Status:** Verify `UYSP-Switchy-Click-Tracker` is active
2. **Review Latest Execution:** Look for error messages in failed runs
3. **Test API Connectivity:** Use curl to test Switchy GraphQL endpoint
4. **Verify Credentials:** Check Switchy API key status

**Resolution Steps:**
1. **Manual Execution:** Run click tracking workflow manually
2. **Fix Configuration:** Address any node configuration issues
3. **Update Credentials:** Re-select if authentication failed
4. **Test End-to-End:** Verify full workflow completion

**Curl Test Command:**
```bash
curl -X POST https://graphql.switchy.io/v1/graphql \
  -H "Api-Authorization: 0ea65170-03e2-41d6-ae53-a7cbd7dc273d" \
  -H "Content-Type: application/json" \
  -d '{"query":"query($id: String!) { links(where: {id: {_eq: $id}}) { id clicks } }","variables":{"id":"TEST_ALIAS"}}'
```

### Issue: Inaccurate Click Counts

**Symptoms:**
- Airtable click counts don't match Switchy dashboard
- Click counts not incrementing despite known clicks
- Inconsistent data across leads

**Diagnostic Steps:**
1. **Compare Data Sources:** Airtable vs Switchy.io dashboard
2. **Check Execution Timing:** Verify 10-minute intervals
3. **Review Node Output:** Check `Compare Clicks` node data
4. **Validate API Response:** Ensure GraphQL returns expected data

**Resolution Steps:**
1. **Manual Sync:** Run click tracking workflow manually
2. **Fix Data Issues:** Correct any parsing errors in workflow
3. **Update Airtable:** Manually correct discrepant records
4. **Monitor Recovery:** Watch next few automatic executions

### Issue: Excessive Click Alerts

**Symptoms:**
- Too many Slack notifications
- Duplicate click alerts
- False positive click detection

**Diagnostic Steps:**
1. **Review Alert Logic:** Check delta calculation in `Compare Clicks` node
2. **Verify Data Quality:** Ensure clean lead data input
3. **Check Execution Frequency:** Confirm 10-minute intervals
4. **Analyze Click Patterns:** Look for unusual activity

**Resolution Steps:**
1. **Adjust Thresholds:** Modify alert logic if needed
2. **Filter Duplicates:** Ensure delta calculation is correct
3. **Update Notification Rules:** Refine Slack alert conditions
4. **Test Adjustments:** Verify changes work as expected

## Configuration Management

### Critical Configuration Items

**Never Modify Without Backup:**
- Node authentication settings
- API endpoint URLs
- GraphQL query structures
- Airtable field mappings

**Safe to Modify:**
- Execution schedules
- Slack notification text
- Alert thresholds
- Reporting parameters

### Change Control Process

**Before Any Changes:**
1. **Create Backup:** Run `scripts/backup-uysp-only.sh`
2. **Document Change:** Record what and why
3. **Test Individually:** Verify each change in isolation
4. **Full System Test:** Run complete end-to-end test

**After Changes:**
1. **Verify Configuration:** Check all nodes retain settings
2. **Monitor Executions:** Watch next 3-5 automatic runs
3. **Update Documentation:** Reflect changes in this SOP
4. **Commit Changes:** Backup new configuration

## API Reference

### Switchy.io GraphQL API

**Endpoint:** `https://graphql.switchy.io/v1/graphql`  
**Authentication:** `Api-Authorization: 0ea65170-03e2-41d6-ae53-a7cbd7dc273d`

**Click Query:**
```graphql
query($id: String!) { 
  links(where: {id: {_eq: $id}}) { 
    id 
    clicks 
  } 
}
```

**Variables:** `{"id": "link-alias"}`

**Response Format:**
```json
{
  "data": {
    "links": [
      {
        "id": "alias123",
        "clicks": 5
      }
    ]
  }
}
```

### Airtable API Integration

**Base ID:** `app6cU9HecxLpgT0P`  
**Table:** `tblYUvhGADerbD8EO` (Leads)

**Click Tracking Fields:**
- `Short Link ID` (Text) - Unique alias identifier
- `Short Link URL` (URL) - Full trackable link
- `Click Count` (Number) - Total clicks detected
- `Clicked Link` (Checkbox) - Boolean click indicator

## Quality Assurance

### Testing Procedures

**Weekly QA Test:**
1. **Create Test Lead:** Add test record to Airtable
2. **Send Test SMS:** Run workflow manually for test lead
3. **Click Test Link:** Click the generated tracking link
4. **Verify Detection:** Confirm click count updates within 10 minutes
5. **Clean Up:** Remove test data after verification

**Monthly Comprehensive Test:**
1. **Multi-Lead Test:** Test with 5+ leads simultaneously
2. **Performance Test:** Measure execution times and success rates
3. **Stress Test:** Test with maximum expected lead volume
4. **Recovery Test:** Test backup and restore procedures

### Data Quality Checks

**Daily Checks:**
- [ ] No negative click counts
- [ ] Click counts only increase (never decrease)
- [ ] All tracked links have valid Short Link IDs
- [ ] No orphaned click data

**Weekly Checks:**
- [ ] Click data matches across all systems
- [ ] No duplicate tracking entries
- [ ] Proper lead lifecycle progression
- [ ] Accurate campaign attribution

## Security and Compliance

### Data Protection:
- **PII Handling:** Lead names used in link titles (minimal exposure)
- **API Security:** Keys stored in n8n credential system
- **Access Control:** Limited to authorized team members
- **Audit Trail:** All changes logged in execution history

### Compliance Requirements:
- **Data Retention:** Click data retained per business requirements
- **Privacy:** No sensitive data exposed in URLs
- **Consent:** Click tracking aligned with SMS opt-in consent
- **Reporting:** Available for compliance audits

---

**DOCUMENT CONTROL:**
- **Version:** 1.0
- **Approved By:** UYSP Operations Team
- **Next Review:** October 15, 2025
- **Distribution:** Operations team, technical support
