# De-enrollment System - Quick Reference Card

**Version**: 2.0
**For**: Operations Team
**Status**: ACTIVE

---

## 🎯 What This System Does

Automatically de-enrolls leads who complete their campaign sequences every 15 minutes.

---

## 📊 Daily Health Check (5 minutes)

Run this query every morning at 9 AM:

```sql
-- Quick health check
SELECT
  COUNT(*) as runs_24h,
  COUNT(*) FILTER (WHERE status = 'failed') as failures,
  SUM(leads_de_enrolled) as total_processed
FROM de_enrollment_runs
WHERE run_at > NOW() - INTERVAL '24 hours';
```

**Expected**: 96 runs, <5 failures, >0 processed

**If abnormal**: See [Incident Response](#incident-response)

---

## 🚨 Alert Response

### "No runs in 2 hours"

1. Check n8n workflow is active (should show green)
2. If inactive: Click "Activate" button
3. If active: Click "Execute Workflow" manually
4. Monitor for 15 minutes

### "High failure rate"

1. Run this query:
   ```sql
   SELECT client_id, error_details
   FROM de_enrollment_runs
   WHERE status = 'failed'
     AND run_at > NOW() - INTERVAL '24 hours'
   LIMIT 5;
   ```
2. Try manual run for problem client:
   ```bash
   npx tsx scripts/de-enroll-completed-leads-v2.ts --client-id=<uuid>
   ```
3. If still fails: Escalate to engineering

### "Stuck leads growing"

1. Run health check:
   ```bash
   npx tsx scripts/de-enroll-completed-leads-v2.ts --health-check
   ```
2. If >100 stuck: Escalate to engineering

---

## 🔧 Common Tasks

### Check Recent Runs
```sql
SELECT
  run_at,
  client_id,
  leads_de_enrolled,
  status,
  duration_ms
FROM de_enrollment_runs
ORDER BY run_at DESC
LIMIT 10;
```

### Check System Health
```bash
npx tsx scripts/de-enroll-completed-leads-v2.ts --health-check
```

### Process Specific Client Manually
```bash
npx tsx scripts/de-enroll-completed-leads-v2.ts --client-id=<uuid>
```

### View Monitoring Dashboard
- **URL**: [Link to Grafana/DataDog]
- **Key metrics**: Success rate, processing time, stuck leads

---

## 📞 When to Escalate

| Situation | Response Time | Contact |
|-----------|---------------|---------|
| No runs for 2+ hours | Immediate | On-call engineer |
| Failure rate >20% | Within 1 hour | Engineering team |
| Stuck leads >500 | Within 15 min | On-call engineer |
| Data integrity issues | Immediate | Engineering lead |

---

## 🔍 Quick Diagnostics

### Is the system running?
```sql
SELECT MAX(run_at) as last_run FROM de_enrollment_runs;
```
Should be <15 minutes ago

### Are leads being processed?
```sql
SELECT SUM(leads_de_enrolled) FROM de_enrollment_runs
WHERE run_at > NOW() - INTERVAL '1 hour';
```
Should be >0 if there are completed leads

### Any errors?
```sql
SELECT error_details FROM de_enrollment_runs
WHERE status = 'failed'
ORDER BY run_at DESC LIMIT 1;
```

---

## 📚 Full Documentation

- **SOP (Operations)**: `docs/SOP_DE_ENROLLMENT_SYSTEM.md` ← **AUTHORITATIVE**
- **Deployment Guide**: `docs/DE_ENROLLMENT_V2_DEPLOYMENT.md`
- **Architecture**: `docs/CAMPAIGN_MANAGER_UPGRADE_V2.md`

---

## ⚡ Emergency Commands

### Stop Processing (Emergency Only)
1. Go to n8n → Workflows
2. Find "Campaign De-enrollment V2"
3. Click "Deactivate"

### Restart Processing
1. Ensure issue is resolved
2. Go to n8n → Workflows
3. Click "Activate"

### Check n8n Execution History
1. Go to n8n → Executions
2. Filter by workflow name
3. Review error messages

---

**Remember**: When in doubt, check the SOP or escalate to engineering!