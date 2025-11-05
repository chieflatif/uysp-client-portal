# STANDARD OPERATING PROCEDURE (SOP)
## Campaign De-enrollment System V2 - Authoritative Guide

**Document Status**: AUTHORITATIVE
**Version**: 2.0
**Last Updated**: November 4, 2024
**Owner**: Engineering Team
**Review Frequency**: Quarterly or after major incidents

---

## 🎯 PURPOSE

This SOP defines the standard procedures for operating, monitoring, and maintaining the automated campaign de-enrollment system. This system automatically de-enrolls leads who have completed their campaign sequences, ensuring data integrity and accurate campaign statistics across multiple clients.

**System Scale**: Designed for 10,000-100,000 active leads across multiple clients

---

## 📋 TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Standard Deployment Procedure](#standard-deployment-procedure)
4. [Daily Operations](#daily-operations)
5. [Monitoring & Health Checks](#monitoring--health-checks)
6. [Incident Response](#incident-response)
7. [Rollback Procedures](#rollback-procedures)
8. [Maintenance Tasks](#maintenance-tasks)
9. [Troubleshooting Guide](#troubleshooting-guide)
10. [Emergency Contacts](#emergency-contacts)

---

## SYSTEM OVERVIEW

### What It Does

The de-enrollment system automatically:
1. Identifies leads who have received all messages in their campaign sequence
2. Marks them as completed (`is_active = false`, sets `completed_at`)
3. Records their journey in `campaign_history` JSONB array
4. Updates campaign statistics (`active_leads_count`, `completed_leads_count`, etc.)
5. Logs all actions for audit and debugging

### How It Works

```
┌─────────────────┐
│  n8n Workflow   │ ← Runs every 15 minutes
│  (Scheduler)    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ de-enroll-completed-leads-v2.ts         │
│ • Loads all active clients              │
│ • Processes each client in isolation    │
│ • Batches leads (100 at a time)         │
│ • Uses database row locking             │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  PostgreSQL Functions                   │
│ • get_leads_for_de_enrollment()         │
│   - Returns locked batch of leads       │
│ • process_de_enrollment_batch()         │
│   - Atomically updates leads            │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Monitoring Tables                      │
│ • de_enrollment_runs                    │
│ • de_enrollment_lead_log                │
│ • de_enrollment_health (view)           │
└─────────────────────────────────────────┘
```

### Key Components

| Component | Purpose | Location |
|-----------|---------|----------|
| Migration 0019 | Adds completion tracking to leads | `migrations/0019_add_campaign_completion_tracking.sql` |
| Migration 0020 | Adds v2 campaign fields | `migrations/0020_unify_campaign_model.sql` |
| Migration 0021 | Adds monitoring infrastructure | `migrations/0021_add_de_enrollment_monitoring.sql` |
| V2 Script | Production de-enrollment script | `scripts/de-enroll-completed-leads-v2.ts` |
| n8n Workflow | Automation orchestration | `docs/n8n-de-enrollment-workflow.json` |
| Deployment Guide | Technical deployment details | `docs/DE_ENROLLMENT_V2_DEPLOYMENT.md` |

---

## PRE-DEPLOYMENT CHECKLIST

**CRITICAL**: Complete ALL items before deploying to production

### Database Prerequisites
- [ ] PostgreSQL version ≥ 12
- [ ] Database has JSONB support enabled
- [ ] Application user has required permissions
- [ ] Database has sufficient storage (check `campaign_history` will add ~2KB per lead)
- [ ] Database performance is normal (no ongoing incidents)

### Backup Requirements
- [ ] Full database backup completed within last 24 hours
- [ ] Specific table backups created:
  ```sql
  CREATE TABLE leads_backup_YYYYMMDD AS SELECT * FROM leads;
  CREATE TABLE campaigns_backup_YYYYMMDD AS SELECT * FROM campaigns;
  ```
- [ ] Backup restoration tested and verified
- [ ] Backup retention policy confirmed (minimum 30 days)

### Environment Configuration
- [ ] Environment variables configured:
  - `DE_ENROLLMENT_BATCH_SIZE` (default: 100)
  - `DE_ENROLLMENT_MAX_RUNTIME` (default: 240000)
  - `DE_ENROLLMENT_ALERT_WEBHOOK` (required)
  - `LOG_LEVEL` (info, debug, error)
- [ ] Alert webhook endpoints tested
- [ ] Monitoring dashboard configured

### Testing Requirements
- [ ] Script tested in staging environment
- [ ] Single client test completed successfully
- [ ] Health check command verified
- [ ] Monitoring tables populated correctly
- [ ] n8n workflow imported and tested

### Team Readiness
- [ ] Operations team briefed on new system
- [ ] Monitoring alerts configured
- [ ] Incident response plan reviewed
- [ ] Rollback procedure practiced
- [ ] On-call engineer identified for deployment window

---

## STANDARD DEPLOYMENT PROCEDURE

### Phase 1: Pre-Deployment (T-24 hours)

**Step 1.1**: Schedule maintenance window
- Preferred: Off-peak hours (2-4 AM in primary timezone)
- Duration: 2-hour window
- Communications: Notify stakeholders

**Step 1.2**: Create backups
```sql
-- Execute in psql
CREATE TABLE leads_backup_20241104 AS SELECT * FROM leads;
CREATE TABLE campaigns_backup_20241104 AS SELECT * FROM campaigns;

-- Verify backup size
SELECT
  pg_size_pretty(pg_total_relation_size('leads_backup_20241104')) as leads_size,
  pg_size_pretty(pg_total_relation_size('campaigns_backup_20241104')) as campaigns_size;
```

**Step 1.3**: Document current state
```sql
-- Capture baseline metrics
SELECT
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE is_active = true) as active_leads,
  COUNT(*) FILTER (WHERE completed_at IS NOT NULL) as completed_leads
FROM leads;

SELECT
  COUNT(*) as total_campaigns,
  SUM(active_leads_count) as sum_active_leads
FROM campaigns;
```

### Phase 2: Database Migrations (T-0)

**Step 2.1**: Run migrations in order

```bash
# Connect to production database
export PGPASSWORD="your_password"
export PGHOST="your_host"
export PGUSER="your_user"
export PGDATABASE="your_database"

# Migration 1: Completion tracking
psql -f migrations/0019_add_campaign_completion_tracking.sql

# Verify
psql -c "\d leads" | grep -E "completed_at|campaign_history"

# Migration 2: Campaign model unification
psql -f migrations/0020_unify_campaign_model.sql

# Verify
psql -c "\d campaigns" | grep -E "is_active|active_leads_count"

# Migration 3: Monitoring infrastructure
psql -f migrations/0021_add_de_enrollment_monitoring.sql

# Verify
psql -c "\d de_enrollment_runs"
psql -c "\df get_leads_for_de_enrollment"
```

**Step 2.2**: Verify migration success
```sql
-- Check all new columns exist
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name IN ('leads', 'campaigns')
  AND column_name IN (
    'completed_at', 'campaign_history',
    'is_active', 'active_leads_count', 'completed_leads_count',
    'opted_out_count', 'booked_count', 'deactivated_at',
    'last_enrollment_at', 'auto_discovered'
  )
ORDER BY table_name, column_name;

-- Check monitoring tables
SELECT COUNT(*) FROM de_enrollment_runs;
SELECT COUNT(*) FROM de_enrollment_lead_log;

-- Check functions
SELECT routine_name
FROM information_schema.routines
WHERE routine_name LIKE '%de_enrollment%';
```

### Phase 3: One-Time Data Migration

**Step 3.1**: Run stuck leads migration
```bash
# This migrates existing stuck leads (runs once)
npx tsx scripts/migrate-stuck-leads.ts > migration_report_$(date +%Y%m%d_%H%M%S).log

# Review the output
cat migration_report_*.log
```

**Step 3.2**: Verify migration results
```sql
-- Check how many leads were migrated
SELECT COUNT(*) FROM leads
WHERE completed_at IS NOT NULL
  AND completed_at::date = CURRENT_DATE;

-- Verify campaign_history was populated
SELECT
  COUNT(*) as leads_with_history,
  AVG(jsonb_array_length(campaign_history)) as avg_history_length
FROM leads
WHERE jsonb_array_length(campaign_history) > 0;
```

### Phase 4: Deploy V2 Script

**Step 4.1**: Deploy code
```bash
# Deploy the new script to production
git checkout campaign-manager-upgrade-v2
git pull origin campaign-manager-upgrade-v2

# Verify file exists
ls -lh scripts/de-enroll-completed-leads-v2.ts
```

**Step 4.2**: Test with single client
```bash
# Get a test client ID
psql -c "SELECT client_id FROM campaigns LIMIT 1"

# Run for single client
npx tsx scripts/de-enroll-completed-leads-v2.ts --client-id=<client-uuid>

# Check results
psql -c "SELECT * FROM de_enrollment_runs ORDER BY run_at DESC LIMIT 1"
```

**Step 4.3**: Run health check
```bash
npx tsx scripts/de-enroll-completed-leads-v2.ts --health-check
```

### Phase 5: Configure n8n Workflow

**Step 5.1**: Import workflow
1. Open n8n dashboard
2. Click "Workflows" → "Import"
3. Upload `docs/n8n-de-enrollment-workflow.json`
4. Workflow should appear as "Campaign De-enrollment V2 - Multi-Client"

**Step 5.2**: Configure workflow
1. Update Execute Command node paths:
   - Replace `/path/to/project` with actual path
2. Configure webhook URLs:
   - Set `MONITORING_WEBHOOK_URL` environment variable
   - Set `ALERT_WEBHOOK_URL` environment variable
3. Configure Slack credentials (if using Slack alerts)
4. Test each node individually

**Step 5.3**: Test workflow manually
1. Click "Execute Workflow" button
2. Monitor execution in real-time
3. Verify success in monitoring table:
   ```sql
   SELECT * FROM de_enrollment_runs ORDER BY run_at DESC LIMIT 1;
   ```

**Step 5.4**: Enable scheduled triggers
1. Activate "Every 15 minutes" trigger
2. Activate "Every Hour" health check trigger
3. Verify workflow is active (green indicator)

### Phase 6: Post-Deployment Verification

**Step 6.1**: Monitor first hour
```sql
-- Check runs every 5 minutes for first hour
SELECT
  run_at,
  client_id,
  leads_de_enrolled,
  status,
  duration_ms
FROM de_enrollment_runs
WHERE run_at > NOW() - INTERVAL '1 hour'
ORDER BY run_at DESC;
```

**Step 6.2**: Verify data integrity
```sql
-- No stuck leads should remain
SELECT COUNT(*) as stuck_leads
FROM leads l
JOIN campaigns c ON l.campaign_link_id = c.id
WHERE l.is_active = true
  AND l.completed_at IS NULL
  AND l.current_message_position >= jsonb_array_length(c.messages);

-- Campaign stats should match reality
SELECT
  c.id,
  c.name,
  c.active_leads_count as reported_active,
  COUNT(l.id) FILTER (WHERE l.is_active = true) as actual_active
FROM campaigns c
LEFT JOIN leads l ON l.campaign_link_id = c.id
GROUP BY c.id, c.name, c.active_leads_count
HAVING c.active_leads_count != COUNT(l.id) FILTER (WHERE l.is_active = true);
```

**Step 6.3**: Update documentation
- Mark deployment as complete in tracking system
- Update runbook with any issues encountered
- Document any configuration changes

---

## DAILY OPERATIONS

### Morning Health Check (Every Day, 9 AM)

**Duration**: 5 minutes

**Procedure**:
```sql
-- 1. Check overnight runs
SELECT
  COUNT(*) as total_runs,
  COUNT(*) FILTER (WHERE status = 'success') as successful,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(*) FILTER (WHERE status = 'partial') as partial,
  SUM(leads_de_enrolled) as total_processed
FROM de_enrollment_runs
WHERE run_at > NOW() - INTERVAL '24 hours';

-- 2. Check for alerts
SELECT
  client_id,
  failed_runs_24h,
  hours_since_success
FROM de_enrollment_health
WHERE failed_runs_24h > 0
   OR hours_since_success > 2;

-- 3. Check for stuck leads
SELECT COUNT(*) as stuck_count
FROM leads l
JOIN campaigns c ON l.campaign_link_id = c.id
WHERE l.is_active = true
  AND l.completed_at IS NULL
  AND l.current_message_position >= jsonb_array_length(c.messages);
```

**Expected Results**:
- Total runs: ~96 (4 per hour × 24 hours)
- Success rate: >95%
- Failed runs: <5
- Stuck leads: <50

**Action if abnormal**:
- See [Incident Response](#incident-response) section

### Weekly Review (Every Monday, 10 AM)

**Duration**: 15 minutes

**Procedure**:
```sql
-- 1. Weekly performance summary
SELECT
  DATE(run_at) as date,
  COUNT(*) as runs,
  COUNT(*) FILTER (WHERE status = 'success') as successful,
  SUM(leads_de_enrolled) as total_processed,
  AVG(duration_ms)::integer as avg_duration_ms
FROM de_enrollment_runs
WHERE run_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(run_at)
ORDER BY date DESC;

-- 2. Check database growth
SELECT
  pg_size_pretty(pg_total_relation_size('de_enrollment_runs')) as runs_table_size,
  pg_size_pretty(pg_total_relation_size('de_enrollment_lead_log')) as log_table_size;

-- 3. Review top errors
SELECT
  error_details,
  COUNT(*) as occurrences,
  MAX(run_at) as last_seen
FROM de_enrollment_runs
WHERE status = 'failed'
  AND run_at > NOW() - INTERVAL '7 days'
GROUP BY error_details
ORDER BY occurrences DESC
LIMIT 10;
```

**Action Items**:
- Document any recurring errors
- Schedule maintenance if table sizes exceed 10GB
- Report trends to team in weekly standup

---

## MONITORING & HEALTH CHECKS

### Real-Time Monitoring Dashboard

**Access**: [Link to monitoring dashboard]

**Key Metrics**:

| Metric | Threshold | Alert Level |
|--------|-----------|-------------|
| Success Rate (24h) | <95% | WARNING |
| Failed Runs (24h) | >5 | WARNING |
| Hours Since Success | >2 | ERROR |
| Stuck Leads | >100 | WARNING |
| Stuck Leads | >500 | ERROR |
| Avg Processing Time | >4 min | WARNING |
| Memory Usage | >2GB | WARNING |

### Alert Response Matrix

| Alert | Severity | Response Time | Action |
|-------|----------|---------------|--------|
| No runs in 2 hours | ERROR | Immediate | Check n8n workflow, restart if needed |
| Success rate <95% | WARNING | Within 1 hour | Review error logs, investigate common failures |
| Stuck leads >500 | ERROR | Within 15 min | Run manual de-enrollment, investigate root cause |
| Processing time >4min | WARNING | Within 1 day | Consider increasing resources or batch size |

### Manual Health Check Command

```bash
# Run anytime to check system health
npx tsx scripts/de-enroll-completed-leads-v2.ts --health-check

# Expected output:
# ✅ All clients processed successfully in last 24h
# ⚠️ Client X has 3 failed runs
# ❌ Client Y hasn't run successfully in 25 hours
```

---

## INCIDENT RESPONSE

### Level 1: System Not Running (CRITICAL)

**Symptoms**:
- No entries in `de_enrollment_runs` for >2 hours
- n8n workflow shows errors
- Stuck leads count increasing rapidly

**Response Procedure**:

1. **Immediate Assessment** (2 minutes)
   ```sql
   -- Check last successful run
   SELECT MAX(run_at) as last_run,
          MAX(run_at) FILTER (WHERE status = 'success') as last_success
   FROM de_enrollment_runs;
   ```

2. **Check n8n Workflow** (3 minutes)
   - Log into n8n dashboard
   - Check workflow execution history
   - Look for error messages
   - Check if workflow is active (should show green)

3. **Restart if Needed** (2 minutes)
   - If workflow inactive: Click "Activate" button
   - If workflow error: Click "Execute Workflow" manually
   - Monitor execution in real-time

4. **Verify Recovery** (5 minutes)
   ```sql
   -- Should see new entry within 15 minutes
   SELECT * FROM de_enrollment_runs
   ORDER BY run_at DESC LIMIT 1;
   ```

5. **Post-Incident**
   - Document root cause
   - Update runbook if new issue discovered
   - Review if alert thresholds need adjustment

### Level 2: High Failure Rate (WARNING)

**Symptoms**:
- Success rate <95% over 24 hours
- Multiple failed runs for specific clients
- Partial completions common

**Response Procedure**:

1. **Identify Problem Clients** (5 minutes)
   ```sql
   SELECT
     client_id,
     COUNT(*) as runs,
     COUNT(*) FILTER (WHERE status = 'failed') as failures,
     array_agg(DISTINCT error_details) as errors
   FROM de_enrollment_runs
   WHERE run_at > NOW() - INTERVAL '24 hours'
   GROUP BY client_id
   HAVING COUNT(*) FILTER (WHERE status = 'failed') > 0
   ORDER BY failures DESC;
   ```

2. **Review Error Details** (10 minutes)
   - Look for common error patterns
   - Check if database connection issues
   - Verify data integrity for problem clients

3. **Manual Intervention** (15 minutes)
   ```bash
   # Try processing problem client manually
   npx tsx scripts/de-enroll-completed-leads-v2.ts --client-id=<problem-client-uuid>

   # Check detailed logs
   tail -f /var/log/de-enrollment-v2.log
   ```

4. **Escalate if Needed**
   - If manual run also fails: Level 3 incident
   - If database errors: Contact DBA team
   - If persistent: Schedule maintenance window

### Level 3: Data Integrity Issue (CRITICAL)

**Symptoms**:
- Campaign statistics don't match reality
- Duplicate entries in campaign_history
- Leads de-enrolled incorrectly

**Response Procedure**:

1. **STOP PROCESSING IMMEDIATELY**
   ```bash
   # Disable n8n workflow
   # This prevents further data corruption
   ```

2. **Assess Damage** (15 minutes)
   ```sql
   -- Check for duplicates
   SELECT lead_id, COUNT(*) as count
   FROM de_enrollment_lead_log
   GROUP BY lead_id
   HAVING COUNT(*) > 1;

   -- Check stats accuracy
   SELECT
     c.id,
     c.active_leads_count as reported,
     COUNT(l.id) FILTER (WHERE l.is_active = true) as actual,
     ABS(c.active_leads_count - COUNT(l.id) FILTER (WHERE l.is_active = true)) as diff
   FROM campaigns c
   LEFT JOIN leads l ON l.campaign_link_id = c.id
   GROUP BY c.id
   HAVING ABS(c.active_leads_count - COUNT(l.id) FILTER (WHERE l.is_active = true)) > 10;
   ```

3. **Initiate Rollback if Severe**
   - See [Rollback Procedures](#rollback-procedures)
   - Contact engineering lead
   - Prepare incident report

4. **Fix Stats if Minor**
   ```sql
   -- Recalculate campaign statistics
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
     );
   ```

---

## ROLLBACK PROCEDURES

### When to Rollback

**Immediate rollback required if**:
- Data corruption detected
- >20% of campaigns have incorrect statistics
- System causing production outages
- Unable to resolve issues within 2 hours

**Consult engineering before rollback if**:
- Issue affects <5% of data
- Problem is client-specific
- Potential fix identified

### Rollback Procedure

**CRITICAL**: Follow steps exactly in order

**Step 1**: Stop all processing
```bash
# Disable n8n workflows immediately
# Confirm no scripts are running:
ps aux | grep de-enroll
```

**Step 2**: Verify backups exist
```sql
SELECT
  COUNT(*) as leads_backup_count
FROM leads_backup_20241104;

SELECT
  COUNT(*) as campaigns_backup_count
FROM campaigns_backup_20241104;
```

**Step 3**: Run rollback migrations (reverse order)
```bash
# Rollback monitoring (0021)
psql -f migrations/rollback/0021_rollback.sql

# Rollback campaign model (0020)
psql -f migrations/rollback/0020_rollback.sql

# Rollback completion tracking (0019)
psql -f migrations/rollback/0019_rollback.sql
```

**Step 4**: Restore data from backup (if needed)
```sql
BEGIN;

-- Restore leads table
UPDATE leads l
SET
  is_active = b.is_active,
  completed_at = b.completed_at,
  campaign_history = b.campaign_history
FROM leads_backup_20241104 b
WHERE l.id = b.id;

-- Restore campaigns table
UPDATE campaigns c
SET
  is_active = b.is_active,
  active_leads_count = b.active_leads_count,
  completed_leads_count = b.completed_leads_count,
  opted_out_count = b.opted_out_count,
  booked_count = b.booked_count
FROM campaigns_backup_20241104 b
WHERE c.id = b.id;

COMMIT;
```

**Step 5**: Verify rollback success
```sql
-- Check columns removed
\d leads
\d campaigns

-- Check backups still exist
SELECT COUNT(*) FROM leads_backup_20241104;
```

**Step 6**: Post-rollback actions
- Notify stakeholders
- Document root cause
- Schedule post-mortem
- Plan corrective actions

---

## MAINTENANCE TASKS

### Monthly: Database Cleanup (1st of month)

**Purpose**: Prevent monitoring tables from growing unbounded

**Procedure**:
```sql
BEGIN;

-- Archive old run records (keep last 90 days)
CREATE TABLE de_enrollment_runs_archive AS
SELECT * FROM de_enrollment_runs
WHERE run_at < NOW() - INTERVAL '90 days';

DELETE FROM de_enrollment_runs
WHERE run_at < NOW() - INTERVAL '90 days';

-- Archive old lead logs (keep last 30 days)
DELETE FROM de_enrollment_lead_log
WHERE processed_at < NOW() - INTERVAL '30 days';

-- Vacuum tables
VACUUM ANALYZE de_enrollment_runs;
VACUUM ANALYZE de_enrollment_lead_log;

COMMIT;
```

### Quarterly: Performance Review

**Tasks**:
1. Review average processing times
2. Analyze batch size effectiveness
3. Check index usage:
   ```sql
   SELECT
     schemaname,
     tablename,
     indexname,
     idx_scan as index_scans,
     idx_tup_read as tuples_read,
     idx_tup_fetch as tuples_fetched
   FROM pg_stat_user_indexes
   WHERE schemaname = 'public'
     AND indexname LIKE '%de_enrollment%'
   ORDER BY idx_scan DESC;
   ```
4. Optimize if needed
5. Update SOP with findings

### Annual: Disaster Recovery Test

**Tasks**:
1. Schedule 4-hour maintenance window
2. Perform full system rollback in staging
3. Verify backup restoration process
4. Test emergency procedures
5. Update disaster recovery plan
6. Train new team members

---

## TROUBLESHOOTING GUIDE

### Issue: Script Times Out After 4 Minutes

**Symptoms**:
- Status shows 'partial' in `de_enrollment_runs`
- Processing incomplete for large clients
- Same leads processed repeatedly

**Diagnosis**:
```sql
-- Check which clients take longest
SELECT
  client_id,
  AVG(duration_ms) as avg_ms,
  MAX(duration_ms) as max_ms,
  AVG(leads_de_enrolled) as avg_processed
FROM de_enrollment_runs
WHERE status IN ('success', 'partial')
  AND run_at > NOW() - INTERVAL '7 days'
GROUP BY client_id
ORDER BY max_ms DESC
LIMIT 10;
```

**Solutions**:
1. Reduce batch size for large clients:
   ```bash
   DE_ENROLLMENT_BATCH_SIZE=50 npx tsx scripts/de-enroll-completed-leads-v2.ts --client-id=<large-client>
   ```

2. Increase max runtime (if n8n timeout allows):
   ```bash
   DE_ENROLLMENT_MAX_RUNTIME=480000  # 8 minutes
   ```

3. Create separate n8n workflow for large clients

### Issue: Memory Usage Spikes

**Symptoms**:
- Node.js out of memory errors
- Server crashes during execution
- Slow performance

**Diagnosis**:
```bash
# Monitor memory during execution
node --max-old-space-size=4096 scripts/de-enroll-completed-leads-v2.ts --client-id=<test-client>
```

**Solutions**:
1. Increase Node memory limit:
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096"
   ```

2. Reduce batch size:
   ```bash
   DE_ENROLLMENT_BATCH_SIZE=50
   ```

3. Process fewer clients per run

### Issue: Duplicate De-enrollments

**Symptoms**:
- Same lead appears multiple times in `de_enrollment_lead_log`
- Campaign stats decremented too much
- Multiple entries in `campaign_history` for same campaign

**Diagnosis**:
```sql
-- Find duplicate processing
SELECT
  lead_id,
  COUNT(*) as times_processed,
  array_agg(run_id) as run_ids,
  array_agg(processed_at) as timestamps
FROM de_enrollment_lead_log
GROUP BY lead_id
HAVING COUNT(*) > 1
LIMIT 10;
```

**Solutions**:
1. Check for multiple n8n workflows running
2. Verify row locking is working:
   ```sql
   SELECT * FROM pg_locks WHERE locktype = 'tuple';
   ```
3. Add additional idempotency checks (contact engineering)

### Issue: Campaign Stats Drift

**Symptoms**:
- `active_leads_count` doesn't match actual active leads
- Statistics seem incorrect
- Reports don't match reality

**Diagnosis**:
```sql
-- Find campaigns with incorrect stats
SELECT
  c.id,
  c.name,
  c.active_leads_count as reported_active,
  COUNT(l.id) FILTER (WHERE l.is_active = true AND l.opted_out = false) as actual_active,
  ABS(c.active_leads_count - COUNT(l.id) FILTER (WHERE l.is_active = true AND l.opted_out = false)) as difference
FROM campaigns c
LEFT JOIN leads l ON l.campaign_link_id = c.id
GROUP BY c.id, c.name, c.active_leads_count
HAVING ABS(c.active_leads_count - COUNT(l.id) FILTER (WHERE l.is_active = true AND l.opted_out = false)) > 5
ORDER BY difference DESC;
```

**Solutions**:
1. Recalculate statistics:
   ```sql
   -- See "Fix Stats if Minor" in Level 3 incident response
   ```

2. If persistent, investigate transaction failures
3. Consider adding database triggers for automatic updates

---

## EMERGENCY CONTACTS

| Role | Name | Contact | Availability |
|------|------|---------|--------------|
| Engineering Lead | [Name] | [Email/Phone] | 24/7 for P0 incidents |
| Database Administrator | [Name] | [Email/Phone] | Business hours + on-call |
| DevOps Lead | [Name] | [Email/Phone] | 24/7 for P0 incidents |
| Product Owner | [Name] | [Email] | Business hours |

### Escalation Path

1. **Level 1** (0-15 min): On-call engineer investigates
2. **Level 2** (15-30 min): Engineering lead notified
3. **Level 3** (30-60 min): DBA team engaged
4. **Level 4** (>60 min): Full incident response team assembled

### External Resources

- **Documentation**: [Link to Confluence/Wiki]
- **Monitoring Dashboard**: [Link to Grafana/DataDog]
- **Incident Management**: [Link to PagerDuty/OpsGenie]
- **Code Repository**: [Link to GitHub/GitLab]

---

## APPENDIX A: USEFUL SQL QUERIES

### Find Leads Ready for De-enrollment
```sql
SELECT
  l.id,
  l.first_name,
  l.last_name,
  c.name as campaign_name,
  l.current_message_position,
  jsonb_array_length(c.messages) as total_messages
FROM leads l
JOIN campaigns c ON l.campaign_link_id = c.id
WHERE l.is_active = true
  AND l.completed_at IS NULL
  AND l.current_message_position >= jsonb_array_length(c.messages)
  AND l.client_id = '<client-uuid>'
LIMIT 10;
```

### Check Processing History for Specific Lead
```sql
SELECT
  l.run_id,
  r.run_at,
  l.action,
  l.outcome,
  l.messages_received,
  l.error_message
FROM de_enrollment_lead_log l
JOIN de_enrollment_runs r ON r.id = l.run_id
WHERE l.lead_id = '<lead-uuid>'
ORDER BY l.processed_at DESC;
```

### Monitor Real-Time Processing
```sql
-- Run this query repeatedly during execution
SELECT
  run_at,
  client_id,
  leads_evaluated,
  leads_de_enrolled,
  duration_ms,
  status
FROM de_enrollment_runs
WHERE run_at > NOW() - INTERVAL '5 minutes'
ORDER BY run_at DESC;
```

---

## APPENDIX B: CONFIGURATION REFERENCE

### Environment Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `DE_ENROLLMENT_BATCH_SIZE` | integer | 100 | Leads processed per batch |
| `DE_ENROLLMENT_MAX_RUNTIME` | integer | 240000 | Max runtime in milliseconds |
| `DE_ENROLLMENT_ALERT_WEBHOOK` | string | none | Webhook URL for alerts |
| `LOG_LEVEL` | string | info | Logging level (info/debug/error) |
| `MONITORING_WEBHOOK_URL` | string | none | Monitoring system webhook |
| `ALERT_WEBHOOK_URL` | string | none | Critical alerts webhook |

### Performance Tuning Guide

| Scale | Batch Size | Max Runtime | Memory Limit |
|-------|-----------|-------------|--------------|
| <10k leads | 100 | 4 min | 2GB |
| 10-50k leads | 100-150 | 4 min | 2-4GB |
| 50-100k leads | 150-200 | 8 min | 4GB |
| >100k leads | 200 | 8 min | 8GB |

---

## DOCUMENT REVISION HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 2.0 | 2024-11-04 | Engineering Team | Complete rewrite for V2 system with multi-client support |
| 1.0 | 2024-10-01 | Engineering Team | Initial SOP for V1 system |

---

**END OF STANDARD OPERATING PROCEDURE**

**Next Review Date**: February 1, 2025

**Document Owner**: Engineering Team
**Approval**: [Engineering Lead Name]
**Status**: ACTIVE / AUTHORITATIVE