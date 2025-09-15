# SOP: UYSP Complete System Integration

**Document Version:** 1.0  
**Last Updated:** September 15, 2025  
**System Status:** PRODUCTION OPERATIONAL  
**Integration Scope:** SMS + Click Tracking + Booking Management

## System Architecture Overview

The UYSP system consists of three integrated workflows that work together to provide complete lead lifecycle management:

### Core Workflows:
1. **`UYSP-SMS-Scheduler-v2`** - Main SMS outreach with click tracking
2. **`UYSP-Switchy-Click-Tracker`** - Automated click monitoring  
3. **`UYSP-Calendly-Booked`** - Booking detection and sequence management

### Supporting Workflows:
4. **`UYSP-SMS-Inbound-STOP`** - STOP request processing
5. **`UYSP-ST-Delivery-V2`** - Delivery status tracking
6. **`UYSP-Backlog-Ingestion`** - Lead import processing

## Integration Data Flow

### Complete Lead Lifecycle:

```
Lead Import → SMS Scheduler → Click Tracking → Booking Detection
     ↓              ↓              ↓              ↓
  Airtable    SMS + Unique     Click Count    SMS Stop +
   Record      Tracking URL     Updates       Completed
```

### Detailed Flow:

1. **Lead Preparation:**
   - Airtable: Lead marked "Ready for SMS"
   - SMS Scheduler: Picks up eligible leads

2. **Link Generation:**
   - Generate unique alias (e.g., "53n7ko")
   - Create trackable link via Switchy.io
   - Save link data to Airtable

3. **Message Delivery:**
   - Add contact to SimpleTexting with campaign tags
   - Send SMS with unique tracking link
   - Update lead status to "In Sequence"

4. **Click Monitoring:**
   - Every 10 minutes: Query Switchy.io for click data
   - Update Airtable with new click counts
   - Send Slack alerts for new clicks

5. **Booking Detection:**
   - Real-time: Calendly webhook triggers on booking
   - Find lead by email/phone in Airtable
   - Mark as booked and stop SMS sequence

## Integration Points and Dependencies

### 1. Airtable as Central Data Hub

**Tables and Relationships:**
- **Leads** (`tblYUvhGADerbD8EO`) - Central lead data with all tracking fields
- **Settings** (`tblErXnFNMKYhh3Xr`) - Campaign configuration and A/B ratios
- **Templates** (`tblsSX9dYMnexdAa7`) - SMS message variants
- **Audit Log** (`tbl5TOGNGdWXTjhzP`) - Send attempt tracking

**Critical Fields for Integration:**
```
Leads Table:
├── Core Identity
│   ├── Email (text) - Primary identifier
│   ├── Phone (phone) - Secondary identifier  
│   └── Record ID (text) - Internal reference
├── SMS Management
│   ├── SMS Status (select) - Send status tracking
│   ├── SMS Sequence Position (number) - Current step
│   ├── SMS Stop (checkbox) - Sequence halt flag
│   └── Processing Status (select) - Lifecycle stage
├── Click Tracking
│   ├── Short Link ID (text) - Unique alias
│   ├── Short Link URL (url) - Full tracking link
│   ├── Click Count (number) - Total clicks
│   └── Clicked Link (checkbox) - Click indicator
└── Booking Management
    ├── Booked (checkbox) - Booking status
    ├── Booked At (datetime) - Booking timestamp
    └── SMS Stop Reason (text) - Stop justification
```

### 2. API Integration Architecture

**Switchy.io Integration:**
- **REST API:** Link creation during SMS preparation
- **GraphQL API:** Click data queries every 10 minutes
- **Authentication:** API key in headers
- **Rate Limits:** 3600 requests/hour (sufficient)

**SimpleTexting Integration:**
- **Contacts API:** Add/update contact with campaign tags
- **Messages API:** Send SMS with tracking links
- **Authentication:** Bearer token
- **Account Phone:** `3102218890`

**Calendly Integration:**
- **Webhook Events:** Real-time booking notifications
- **Event Types:** `invitee.created`, `invitee.canceled`
- **Authentication:** None (public webhook)
- **Payload:** Complete booking and lead data

### 3. Slack Integration Architecture

**Notification Channels:**
- **`#uysp-tests`** - SMS send status and click alerts
- **`#uysp-sales-daily`** - Booking notifications and daily reports

**Alert Types:**
- SMS send confirmations with lead details
- Click activity alerts with delta information
- Booking notifications with lead identification
- Error alerts for system failures

## Operational Procedures

### 1. Daily System Startup

**Morning Checklist (9 AM EST):**
- [ ] Verify all 3 core workflows show "Active" status
- [ ] Check overnight execution history for errors
- [ ] Review Slack channels for any alerts or issues
- [ ] Confirm Airtable data integrity

**System Health Validation:**
1. **SMS Scheduler:** Check last execution time and success
2. **Click Tracker:** Verify recent executions every 10 minutes
3. **Booking Tracker:** Review any overnight booking activity
4. **Credentials:** Confirm all green status indicators

### 2. Lead Processing Workflow

**Pre-SMS Execution:**
1. **Review Eligible Leads:** Check "Ready for SMS" count in Airtable
2. **Verify Templates:** Ensure current message variants approved
3. **Check Settings:** Confirm campaign configuration and A/B ratios
4. **Manual Execution:** Run SMS Scheduler workflow

**Post-SMS Monitoring:**
1. **Immediate:** Verify SMS send confirmations in Slack
2. **10 Minutes:** Check for any click activity alerts
3. **1 Hour:** Confirm Airtable updates completed
4. **End of Day:** Review overall performance metrics

### 3. Exception Management

**Workflow Failure Response:**
1. **Immediate:** Stop automatic executions if needed
2. **Assess:** Determine failure scope and impact
3. **Communicate:** Alert team via Slack
4. **Resolve:** Follow troubleshooting procedures
5. **Resume:** Restart operations after verification

**Data Inconsistency Response:**
1. **Identify:** Compare data across systems (Airtable, Switchy, SimpleTexting)
2. **Quantify:** Determine extent of inconsistency
3. **Prioritize:** Address most critical issues first
4. **Correct:** Manual data fixes where needed
5. **Prevent:** Update workflows to prevent recurrence

## Performance Monitoring

### Key Performance Indicators

**System Reliability:**
- **SMS Scheduler Success Rate:** Target >98%
- **Click Tracker Uptime:** Target >99%
- **Booking Detection Rate:** Target 100%
- **Data Consistency:** Target 100%

**Business Metrics:**
- **SMS Delivery Rate:** Target >95%
- **Click-Through Rate:** Benchmark 5-15%
- **Booking Conversion Rate:** Benchmark 1-5%
- **SMS-to-Booking Funnel:** Track complete conversion

### Monitoring Dashboard

**Real-Time Metrics:**
- Current execution status (all workflows)
- Recent SMS send activity
- Click activity in last hour
- Booking events today

**Daily Trends:**
- SMS volume and success rates
- Click activity patterns
- Booking conversion trends
- System error frequency

## Quality Assurance

### Daily QA Procedures

**Data Quality Checks:**
- [ ] No negative or impossible values (click counts, sequence positions)
- [ ] Consistent data across integrated systems
- [ ] Proper lead lifecycle progression
- [ ] Accurate timestamp recording

**Integration Verification:**
- [ ] SMS sends create tracking links
- [ ] Click tracking updates Airtable
- [ ] Bookings stop SMS sequences
- [ ] All notifications functioning

### Weekly QA Procedures

**End-to-End Testing:**
1. **Create Test Lead:** Add test record to Airtable
2. **Run SMS Workflow:** Send test SMS with tracking
3. **Click Test Link:** Verify click detection works
4. **Book Test Meeting:** Verify booking tracking works
5. **Verify Sequence Stop:** Confirm no further SMS sent
6. **Clean Up:** Remove test data

**Performance Analysis:**
- Review execution times and success rates
- Analyze error patterns and frequency
- Assess resource utilization
- Document any performance degradation

## Security and Compliance

### Data Security Measures:
- **API Key Management:** Secure storage in n8n credentials
- **Access Control:** Limited to authorized personnel
- **Audit Logging:** Complete execution history maintained
- **Data Encryption:** All API communications use HTTPS

### Compliance Considerations:
- **Consent Management:** SMS opt-in tracked in Airtable
- **Data Retention:** Click and booking data retained per policy
- **Privacy Protection:** Minimal PII exposure in tracking URLs
- **Audit Trail:** Complete activity logging for compliance

## Backup and Recovery

### Backup Strategy:
- **Daily:** Automatic workflow execution logging
- **Weekly:** Manual workflow configuration backup
- **Monthly:** Complete system state backup including Airtable schemas

**Recovery Procedures:**
1. **Workflow Recovery:** Import from `workflows/backups/uysp-targeted-*`
2. **Data Recovery:** Restore Airtable from backup if needed
3. **Configuration Recovery:** Rebuild from documented settings
4. **Integration Recovery:** Re-establish API connections

### Backup Locations:
- **Local:** `workflows/backups/` directory
- **Remote:** GitHub repository (automatic push)
- **Documentation:** All configurations documented in SOPs

## Future Enhancements

### Planned Improvements:
1. **Enhanced Analytics:** Advanced click and conversion reporting
2. **A/B Testing:** Automated message variant optimization
3. **Predictive Analytics:** Lead scoring based on engagement
4. **Multi-Channel:** Integration with email and social platforms

### Scalability Considerations:
1. **Volume Scaling:** Support for 100+ leads per execution
2. **Geographic Expansion:** International phone number support
3. **Campaign Scaling:** Multiple simultaneous campaigns
4. **Team Scaling:** Multi-user access and role management

---

**SYSTEM STATUS:** FULLY OPERATIONAL  
**INTEGRATION HEALTH:** ALL SYSTEMS CONNECTED  
**LAST VERIFIED:** September 15, 2025  
**NEXT REVIEW:** September 22, 2025

**CONFIDENCE: 100%** - All integrations tested and verified  
**EVIDENCE SOURCES:** Live system testing, execution logs, API verification
