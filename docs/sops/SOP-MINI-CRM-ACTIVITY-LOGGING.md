# SOP: Mini-CRM Activity Logging System

**Version:** 1.0  
**Date:** 2025-11-07  
**Owner:** DevOps Team  
**Status:** Staging Testing

---

## Purpose

This SOP documents the operational procedures for the Mini-CRM activity logging system, which captures all lead interactions (SMS, bookings, replies, deliveries) to PostgreSQL for complete lead history tracking.

---

## System Overview

### What Gets Logged:

**4 Event Types (from 4 n8n workflows):**
1. **MESSAGE_SENT** - SMS successfully sent (Kajabi SMS Scheduler)
2. **MESSAGE_FAILED** - SMS send failed (Kajabi SMS Scheduler)
3. **BOOKING_CONFIRMED** - Calendly booking created (Calendly Booked)
4. **INBOUND_REPLY** - Lead replied to SMS (Reply Handler)
5. **MESSAGE_DELIVERED** - Carrier confirmed delivery (ST-Delivery V2)

### Where It's Logged:

**Primary:** PostgreSQL `lead_activity_log` table via API endpoint  
**Fallback:** Airtable Retry_Queue (tblsmRKDX7chymBwp) if API fails  
**Alerts:** Slack channel C09DAEWGUSY on persistent failures

---

## Daily Operations

### 1. Monitoring Activity Logging Health

**Check Daily (2 minutes):**

```bash
# Verify events are being logged
curl https://uysp-portal-v2.onrender.com/api/internal/activity-health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "events_last_hour": 15,
  "events_last_24h": 342,
  "retry_queue_size": 0
}
```

**Red Flags:**
- `events_last_hour: 0` during business hours → Portal down or workflows inactive
- `retry_queue_size > 20` → Portal connectivity issues
- No response → Portal completely down

---

### 2. Checking Retry_Queue

**When:** Daily, or when Slack alerts fire  
**Location:** Airtable base app4wIsBfpJTg7pWS, table Retry_Queue (tblsmRKDX7chymBwp)

**Normal State:** 0-5 records (occasional failures acceptable)  
**Alert State:** >20 records (sustained portal outage)

**If Queue Filling Up:**
1. Check portal status: `https://uysp-portal-v2.onrender.com/health`
2. Review Slack alerts for error patterns
3. Check n8n execution logs for HTTP failures
4. If portal down: Contact DevOps to restore
5. After portal restored: Process queue (see Recovery Procedures)

---

### 3. Reviewing Slack Alerts

**Channel:** C09DAEWGUSY (uysp-ops-alerts)  
**Alert Format:**
```
⚠️ Activity Log Failed

Workflow: UYSP-Kajabi-SMS-Scheduler
Execution: 29345
Lead: recABC123XYZ
Event: MESSAGE_SENT

Written to Retry_Queue for manual recovery.
```

**What It Means:**
- Portal API failed after 3 retries
- Event captured in Retry_Queue (not lost)
- Needs manual replay when portal is back

**Response Actions:**
- 1-5 alerts/day: Monitor, likely transient issues
- >20 alerts/hour: Portal outage, contact DevOps
- Sustained alerts: Check portal logs, investigate root cause

---

## Weekly Operations

### 1. Activity Log Database Health Check

**Run weekly query:**
```sql
SELECT 
  event_type,
  COUNT(*) as count,
  MAX(created_at) as most_recent
FROM lead_activity_log
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY event_type
ORDER BY count DESC;
```

**Expected Results:**
```
MESSAGE_SENT: ~1200/week (700 leads × 12% SMS rate × ~1.4 messages avg)
MESSAGE_DELIVERED: ~1000/week
INBOUND_REPLY: ~150/week (12.5% reply rate)
BOOKING_CONFIRMED: ~15/week
MESSAGE_FAILED: <50/week
```

**Red Flags:**
- MESSAGE_SENT = 0 → Scheduler not running
- MESSAGE_FAILED >200/week → High opt-out rate or SimpleTexting issues
- INBOUND_REPLY = 0 → Reply Handler webhook not configured

---

### 2. Retry_Queue Cleanup

**If queue has records:**

1. **Check portal is operational:**
   ```bash
   curl https://uysp-portal-v2.onrender.com/api/internal/activity-health
   ```

2. **For each record in Retry_Queue:**
   - Copy `payload` field (JSON)
   - POST to activity log endpoint:
   ```bash
   curl -X POST https://uysp-portal-v2.onrender.com/api/internal/log-activity \
     -H "Content-Type: application/json" \
     -H "x-api-key: 741fae954c8db9a58eb35baf60a5a1f56d8c8e9f1a2e3b4c5d6e7f8a9b0c1d2e" \
     -d '[PASTE PAYLOAD HERE]'
   ```
   - If successful: Delete from Retry_Queue
   - If fails: Leave in queue, increment retry_count

3. **If >50 records:** Contact DevOps for automated replay script

---

## Troubleshooting

### Issue: No Events Appearing in Database

**Symptoms:** Health check shows `events_last_hour: 0`

**Diagnosis:**
1. Check n8n workflows are active:
   - UYSP-Kajabi-SMS-Scheduler (kJMMZ10anu4NqYUL)
   - UYSP-Calendly-Booked (LiVE3BlxsFkHhG83)
   - UYSP-SimpleTexting-Reply-Handler (CmaISo2tBtYRqNs0)
   - UYSP-ST-Delivery V2 (vA0Gkp2BrxKppuSu)

2. Check recent n8n executions (last 1 hour)
3. Check "Write to Activity Log" node has credential assigned
4. Test manually: Run Kajabi scheduler, verify HTTP POST succeeds

**Fix:**
- If workflows inactive: Activate in n8n UI
- If no executions: Check scheduler cron is correct
- If HTTP fails: Verify credential configured, portal is up

---

### Issue: Retry_Queue Filling Up

**Symptoms:** >20 records in Retry_Queue, Slack alerts flooding

**Diagnosis:**
1. Check portal health endpoint
2. Review recent Slack alerts for error patterns
3. Check n8n execution logs for HTTP timeouts

**Fix:**
- Portal down: Restore portal service (contact DevOps)
- Credentials expired: Update Internal API Key credential in n8n
- Timeout issues: Portal performance degradation, scale up

---

### Issue: Duplicate Events in Database

**Symptoms:** Same event logged multiple times

**Diagnosis:**
1. Check if workflow executed multiple times (n8n execution history)
2. Check if Retry_Queue replay created duplicates
3. Review execution IDs in database (should be unique per event)

**Fix:**
- If workflow retried: This is expected behavior (idempotency issue)
- If manual replay: Be careful not to replay already-processed events
- Add deduplication logic to replay process (future enhancement)

---

## Recovery Procedures

### Scenario 1: Portal Down for Extended Period

**Situation:** Portal offline for 2+ hours, Retry_Queue filling up

**Actions:**
1. ✅ **DO NOTHING** - Events are captured in Retry_Queue (safe)
2. ✅ Verify workflows still completing successfully
3. ✅ Monitor queue size (should grow steadily)
4. ⏳ Wait for portal restoration
5. 🔧 After portal up: Run replay process (manual or automated)

**Timeline:**
- Portal down: 0-4 hours → Acceptable, queue captures everything
- Portal down: >4 hours → Consider manual intervention
- Portal down: >24 hours → Critical, coordinate with DevOps

---

### Scenario 2: Replaying Queued Events

**Situation:** Portal restored, 50+ events in Retry_Queue

**Manual Replay:**
```bash
# For each record:
PAYLOAD='[copy from Retry_Queue payload field]'
curl -X POST https://uysp-portal-v2.onrender.com/api/internal/log-activity \
  -H "Content-Type: application/json" \
  -H "x-api-key: 741fae954c8db9a58eb35baf60a5a1f56d8c8e9f1a2e3b4c5d6e7f8a9b0c1d2e" \
  -d "$PAYLOAD"

# If success: Delete Airtable record
# If fail: Leave for next retry
```

**Automated Replay (Future):**
- n8n workflow: "UYSP-Retry-Queue-Processor"
- Runs every 15 minutes
- Processes queue automatically
- Self-healing system

---

### Scenario 3: Testing After Configuration Change

**When:** After updating credentials, changing URLs, or modifying workflows

**Test Procedure:**
1. Enable Test Mode in Settings (checkbox)
2. Create test lead with phone `+18319990500`
3. Run Kajabi SMS Scheduler manually
4. Verify:
   - SMS sent to test phone
   - Activity appears in health check
   - Database has new record
   - Retry_Queue empty
5. Disable Test Mode
6. Monitor production for 1 hour

---

## Maintenance

### Monthly Tasks:

**1. Database Growth Check:**
```sql
SELECT 
  COUNT(*) as total_events,
  pg_size_pretty(pg_total_relation_size('lead_activity_log')) as table_size
FROM lead_activity_log;
```

**Expected Growth:** ~5,000-10,000 events/month, ~50-100 MB/month

**2. Credential Rotation (if required):**
- Generate new Internal API Key
- Update n8n credential
- Test all 4 workflows
- Verify no Retry_Queue growth

**3. Slack Alert Review:**
- Review alert frequency (should be <10/week in steady state)
- Investigate persistent patterns
- Adjust alert thresholds if needed

---

## Configuration Reference

### n8n Workflows:
1. UYSP-Kajabi-SMS-Scheduler (kJMMZ10anu4NqYUL)
2. UYSP-Calendly-Booked (LiVE3BlxsFkHhG83)
3. UYSP-SimpleTexting-Reply-Handler (CmaISo2tBtYRqNs0)
4. UYSP-ST-Delivery V2 (vA0Gkp2BrxKppuSu)

### API Endpoints:
- **Staging:** https://uysp-portal-staging.onrender.com/api/internal/log-activity
- **Production:** https://uysp-portal-v2.onrender.com/api/internal/log-activity
- **Health Check:** /api/internal/activity-health

### Credentials:
- **Internal API Key:** 741fae954c8db9a58eb35baf60a5a1f56d8c8e9f1a2e3b4c5d6e7f8a9b0c1d2e
- **n8n Credential Name:** "UYSP Internal API Key"
- **Type:** HTTP Header Auth (x-api-key)

### Airtable:
- **Base:** app4wIsBfpJTg7pWS
- **Retry_Queue Table:** tblsmRKDX7chymBwp
- **Leads Table:** tblYUvhGADerbD8EO

---

## Escalation

**Level 1 (Self-Service):**
- Check health endpoint
- Review Slack alerts
- Check Retry_Queue size

**Level 2 (Operations Team):**
- Retry_Queue >50 records
- Sustained portal outages
- Workflow failures

**Level 3 (DevOps/Engineering):**
- Portal architecture issues
- Database performance degradation
- Credential/security issues

---

**Document Location:** `uysp-client-portal/docs/sops/SOP-MINI-CRM-ACTIVITY-LOGGING.md`  
**Related Docs:** PRD-MINI-CRM-ACTIVITY-LOGGING.md, N8N-INSTRUMENTATION-GUIDE.md

