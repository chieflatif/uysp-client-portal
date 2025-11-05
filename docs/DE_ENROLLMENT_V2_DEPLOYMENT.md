# De-enrollment V2 Deployment Guide

## Overview

This guide covers deploying the production-ready, multi-client de-enrollment system designed to handle 10,000-100,000 leads across multiple clients with proper monitoring, error recovery, and performance optimization.

---

## 🚀 Quick Start

### Prerequisites

1. PostgreSQL 12+ with JSONB support
2. Node.js 18+ with TypeScript
3. n8n automation platform (or similar cron system)
4. Monitoring/alerting webhook endpoints (Slack, DataDog, etc.)

### Environment Variables

Add to `.env.local` (development) and production environment:

```bash
# De-enrollment Configuration
DE_ENROLLMENT_BATCH_SIZE=100              # Leads per batch (default: 100)
DE_ENROLLMENT_MAX_RUNTIME=240000          # Max runtime in ms (default: 4 minutes)
DE_ENROLLMENT_ALERT_WEBHOOK=https://hooks.slack.com/xxx  # Alert webhook
LOG_LEVEL=info                            # info, debug, error

# Monitoring Webhooks
MONITORING_WEBHOOK_URL=https://your-monitoring.com/webhook
ALERT_WEBHOOK_URL=https://hooks.slack.com/services/xxx
```

---

## 📋 Deployment Steps

### Step 1: Backup Existing Data

**CRITICAL: Create backups before any migration**

```sql
-- Backup leads table
CREATE TABLE leads_backup_20241104 AS SELECT * FROM leads;

-- Backup campaigns table
CREATE TABLE campaigns_backup_20241104 AS SELECT * FROM campaigns;

-- Verify backups
SELECT COUNT(*) FROM leads_backup_20241104;
SELECT COUNT(*) FROM campaigns_backup_20241104;
```

### Step 2: Run Migrations in Order

```bash
# 1. Add campaign completion tracking (Phase 1)
PGPASSWORD="..." psql -h <host> -U <user> -d <db> -f migrations/0019_add_campaign_completion_tracking.sql

# 2. Unify campaign model (Phase 1)
PGPASSWORD="..." psql -h <host> -U <user> -d <db> -f migrations/0020_unify_campaign_model.sql

# 3. Add monitoring infrastructure (V2)
PGPASSWORD="..." psql -h <host> -U <user> -d <db> -f migrations/0021_add_de_enrollment_monitoring.sql
```

### Step 3: Verify Migration Success

```sql
-- Check new columns exist
\d leads
\d campaigns

-- Check monitoring tables
\d de_enrollment_runs
\d de_enrollment_lead_log

-- Check functions
\df get_leads_for_de_enrollment
\df process_de_enrollment_batch

-- Check indexes
SELECT indexname FROM pg_indexes
WHERE tablename IN ('leads', 'campaigns')
AND indexname LIKE '%de_enrollment%';
```

### Step 4: Run One-Time Stuck Leads Migration

```bash
# This migrates existing stuck leads (one-time operation)
npx tsx scripts/migrate-stuck-leads.ts

# Review the output report for any issues
```

### Step 5: Test De-enrollment V2 Locally

```bash
# Test with a single client first
npx tsx scripts/de-enroll-completed-leads-v2.ts --client-id=<test-client-uuid>

# Check monitoring table
psql -c "SELECT * FROM de_enrollment_runs ORDER BY run_at DESC LIMIT 5"

# Run health check
npx tsx scripts/de-enroll-completed-leads-v2.ts --health-check
```

### Step 6: Deploy to Production

1. Deploy the new script files
2. Ensure environment variables are set
3. Test with a single client in production
4. Monitor logs and metrics

### Step 7: Set Up n8n Workflow

1. Import the workflow: `docs/n8n-de-enrollment-workflow.json`
2. Update paths in Execute Command nodes
3. Configure webhook URLs
4. Set up Slack credentials
5. Test workflow manually first
6. Enable scheduled triggers

---

## 📊 Monitoring Setup

### Key Metrics to Monitor

```sql
-- Real-time monitoring dashboard query
SELECT
  client_id,
  COUNT(*) FILTER (WHERE run_at > NOW() - INTERVAL '1 hour') as runs_last_hour,
  COUNT(*) FILTER (WHERE status = 'failed' AND run_at > NOW() - INTERVAL '24 hours') as failures_24h,
  AVG(duration_ms) FILTER (WHERE status = 'success') as avg_duration_ms,
  SUM(leads_de_enrolled) FILTER (WHERE run_at > NOW() - INTERVAL '24 hours') as total_processed_24h,
  MAX(run_at) as last_run
FROM de_enrollment_runs
GROUP BY client_id
ORDER BY failures_24h DESC, last_run DESC;
```

### Alert Conditions

Set up alerts for:

1. **No runs in 2 hours**
   ```sql
   SELECT client_id
   FROM de_enrollment_health
   WHERE EXTRACT(EPOCH FROM (NOW() - last_success)) > 7200;
   ```

2. **High failure rate**
   ```sql
   SELECT client_id, failed_runs_24h
   FROM de_enrollment_health
   WHERE failed_runs_24h > 2;
   ```

3. **Stuck leads growing**
   ```sql
   SELECT COUNT(*) as stuck_count
   FROM leads l
   JOIN campaigns c ON l.campaign_link_id = c.id
   WHERE l.is_active = true
     AND l.completed_at IS NULL
     AND l.current_message_position >= jsonb_array_length(c.messages)
     AND l.updated_at < NOW() - INTERVAL '48 hours';
   ```

### Grafana Dashboard (Optional)

```json
{
  "dashboard": {
    "panels": [
      {
        "title": "De-enrollment Success Rate",
        "query": "SELECT success_rate FROM de_enrollment_health"
      },
      {
        "title": "Leads Processed per Hour",
        "query": "SELECT SUM(leads_de_enrolled) FROM de_enrollment_runs WHERE run_at > NOW() - INTERVAL '1 hour'"
      },
      {
        "title": "Average Processing Time",
        "query": "SELECT AVG(duration_ms) FROM de_enrollment_runs WHERE status = 'success'"
      }
    ]
  }
}
```

---

## 🔧 Troubleshooting

### Issue: Script times out

**Symptoms**: Script exits after 4 minutes with partial completion

**Solution**:
1. Reduce batch size: `DE_ENROLLMENT_BATCH_SIZE=50`
2. Process specific clients separately
3. Check for database locks:
   ```sql
   SELECT * FROM pg_locks WHERE NOT granted;
   ```

### Issue: High memory usage

**Symptoms**: Node.js heap out of memory errors

**Solution**:
1. Reduce batch size
2. Increase Node memory: `NODE_OPTIONS="--max-old-space-size=4096"`
3. Process clients sequentially instead of loading all at once

### Issue: Duplicate de-enrollments

**Symptoms**: Same lead appears multiple times in campaign_history

**Solution**:
1. Check for multiple n8n workflows running
2. Verify row locking is working:
   ```sql
   SELECT * FROM de_enrollment_lead_log
   WHERE lead_id = '<duplicate-lead-id>'
   ORDER BY processed_at;
   ```

### Issue: Campaign stats drift

**Symptoms**: `active_leads_count` doesn't match reality

**Solution**: Recalculate stats
```sql
UPDATE campaigns c
SET
  active_leads_count = (
    SELECT COUNT(*)
    FROM leads
    WHERE campaign_link_id = c.id
      AND is_active = true
      AND opted_out = false
  ),
  completed_leads_count = (
    SELECT COUNT(*)
    FROM leads
    WHERE campaign_link_id = c.id
      AND completed_at IS NOT NULL
  )
WHERE c.is_active = true;
```

---

## 🔐 Security Considerations

1. **Database Permissions**: Ensure application user has minimal required permissions
   ```sql
   GRANT SELECT, INSERT, UPDATE ON leads TO app_user;
   GRANT SELECT, UPDATE ON campaigns TO app_user;
   GRANT SELECT, INSERT, UPDATE ON de_enrollment_runs TO app_user;
   GRANT SELECT, INSERT ON de_enrollment_lead_log TO app_user;
   GRANT EXECUTE ON FUNCTION get_leads_for_de_enrollment TO app_user;
   ```

2. **Webhook Security**: Use signed webhooks for alerts
3. **Rate Limiting**: Implement at n8n level to prevent DOS
4. **Audit Logging**: All de-enrollments are logged in `de_enrollment_lead_log`

---

## 🔄 Rollback Plan

If issues arise, rollback in reverse order:

```bash
# 1. Stop n8n workflows immediately

# 2. Rollback monitoring (0021)
psql -f migrations/rollback/0021_rollback.sql

# 3. Rollback campaign model (0020)
psql -f migrations/rollback/0020_rollback.sql

# 4. Rollback completion tracking (0019)
psql -f migrations/rollback/0019_rollback.sql

# 5. Restore from backup if needed
UPDATE leads l
SET
  is_active = b.is_active,
  completed_at = b.completed_at,
  campaign_history = b.campaign_history
FROM leads_backup_20241104 b
WHERE l.id = b.id;
```

---

## 📈 Performance Tuning

### For 10,000-50,000 leads

```bash
DE_ENROLLMENT_BATCH_SIZE=100
DE_ENROLLMENT_MAX_RUNTIME=240000  # 4 minutes
```

### For 50,000-100,000 leads

```bash
DE_ENROLLMENT_BATCH_SIZE=200
DE_ENROLLMENT_MAX_RUNTIME=480000  # 8 minutes
NODE_OPTIONS="--max-old-space-size=4096"
```

Consider:
- Running separate n8n workflows for large clients
- Processing during off-peak hours
- Using read replicas for queries

---

## 🎯 Success Criteria

After deployment, verify:

- [ ] All stuck leads have been de-enrolled
- [ ] No leads with `current_message_position >= message_count` remain active
- [ ] Campaign statistics match actual counts
- [ ] Monitoring shows successful runs every 15 minutes
- [ ] No error alerts in first 24 hours
- [ ] Processing time < 5 minutes for all clients
- [ ] Memory usage stable under 2GB
- [ ] No database locks lasting > 1 second

---

## 📞 Support

For issues:
1. Check `de_enrollment_runs` table for errors
2. Review `de_enrollment_lead_log` for specific lead issues
3. Run health check: `--health-check`
4. Check n8n execution logs
5. Review database locks and slow queries

---

## Appendix: Useful Queries

### Find clients needing processing
```sql
SELECT
  c.client_id,
  COUNT(l.id) as leads_to_process
FROM campaigns c
JOIN leads l ON l.campaign_link_id = c.id
WHERE c.is_active = true
  AND l.is_active = true
  AND l.completed_at IS NULL
  AND l.current_message_position >= jsonb_array_length(c.messages)
GROUP BY c.client_id
ORDER BY leads_to_process DESC;
```

### Check processing history
```sql
SELECT
  client_id,
  DATE(run_at) as date,
  COUNT(*) as runs,
  SUM(leads_de_enrolled) as total_processed,
  AVG(duration_ms)::integer as avg_ms,
  COUNT(*) FILTER (WHERE status = 'failed') as failures
FROM de_enrollment_runs
WHERE run_at > NOW() - INTERVAL '7 days'
GROUP BY client_id, DATE(run_at)
ORDER BY date DESC, client_id;
```

### Verify campaign history integrity
```sql
SELECT
  l.id,
  l.first_name,
  l.last_name,
  jsonb_array_length(campaign_history) as campaigns_completed,
  campaign_history
FROM leads l
WHERE jsonb_array_length(campaign_history) > 0
ORDER BY jsonb_array_length(campaign_history) DESC
LIMIT 10;
```

---

**Document Version**: 2.0
**Last Updated**: November 4, 2024
**Status**: Production Ready