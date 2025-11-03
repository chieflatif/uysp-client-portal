# Weekly Report - Quick Start (2 Minutes)

## Try it NOW! ⚡

### Step 1: Send Test Report

```bash
cd "/Users/latifhorst/cursor projects/UYSP Lead Qualification V1/uysp-client-portal"

npx tsx scripts/send-weekly-report.ts 6a08f898-19cd-49f8-bd77-6fcb2dd56db9 --test rebel@rebelhq.ai
```

### Step 2: Check Your Email

Look for: **"📊 [TEST] Weekly Project Report - Week of October 23, 2025"**

### Step 3: Set Up Weekly Automation

**Add to Render (or preferred scheduler):**

- **Schedule**: Every Monday at 9 AM
- **Cron**: `0 9 * * 1`
- **Command**: 
  ```bash
  npx tsx scripts/send-weekly-report.ts 6a08f898-19cd-49f8-bd77-6fcb2dd56db9
  ```

---

## What's in the Report?

📊 **Project Health** - Color-coded status  
💡 **Key Insights** - Auto-generated highlights  
✅ **Task Summary** - Stats with visual charts  
📅 **Upcoming Tasks** - Next 7 days  
🚧 **Active Blockers** - Critical issues  
📈 **Project Metrics** - Custom status

---

## UI Button

After deployment:
1. Go to **Project Management** page
2. Click **"Send Report"** button (purple, top-right)
3. Instant test report to your email

---

## Full Documentation

- **Setup Guide**: `docs/WEEKLY-REPORT-SETUP.md`
- **Feature Summary**: `WEEKLY-REPORT-FEATURE-SUMMARY.md`

---

**That's it! Simple, beautiful, automated.** ✨

