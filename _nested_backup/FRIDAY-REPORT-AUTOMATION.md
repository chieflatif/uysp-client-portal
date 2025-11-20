# Friday Weekly Report Automation

Automatically send project reports every Friday at 5 PM.

## Quick Setup (Render)

### 1. Add Environment Variable

In Render dashboard:
```
CRON_SECRET=<generate-random-secret-here>
```

Generate secret:
```bash
openssl rand -base64 32
```

### 2. Add Cron Job to Render

**Dashboard:** https://dashboard.render.com

1. Click "New +" → "Cron Job"
2. Configure:
   - **Name**: weekly-reports
   - **Schedule**: `0 17 * * 5` (Every Friday 5 PM UTC)
   - **Command**:
     ```bash
     curl -X GET "https://uysp-portal-v2.onrender.com/api/cron/weekly-report" \
       -H "Authorization: Bearer $CRON_SECRET"
     ```

### 3. Test It

```bash
# Manual test (replace with your CRON_SECRET)
curl -X GET "https://uysp-portal-v2.onrender.com/api/cron/weekly-report" \
  -H "Authorization: Bearer your-secret-here"
```

## Schedule Options

```
0 17 * * 5  - Friday 5 PM UTC
0 9 * * 5   - Friday 9 AM UTC  
0 17 * * 1  - Monday 5 PM UTC
```

## What Happens

Every Friday at 5 PM:
- ✅ Sends report for each client (isolated data)
- ✅ CLIENT_ADMIN users get their client's report
- ✅ SUPER_ADMIN users get one email per client
- ✅ Beautiful HTML email with charts, tasks, blockers

## Alternative: GitHub Actions

If using GitHub, add `.github/workflows/weekly-report.yml`:

```yaml
name: Weekly Project Report

on:
  schedule:
    - cron: '0 17 * * 5'  # Friday 5 PM UTC

jobs:
  send-reports:
    runs-on: ubuntu-latest
    steps:
      - name: Send Weekly Reports
        run: |
          curl -X GET "${{ secrets.APP_URL }}/api/cron/weekly-report" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

Add secrets to GitHub repo settings.

---

**That's it. Set it and forget it.** 📊✨

