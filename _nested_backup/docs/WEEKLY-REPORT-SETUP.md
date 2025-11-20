# Weekly Project Management Report Setup

Automatically send beautiful project management reports to administrators every week.

## ✨ What You Get

Beautiful HTML email reports that include:
- 📊 **Project Health** - Overall status with color-coded health indicators
- 💡 **Key Insights** - Automated insights (tasks completed, blockers, upcoming deadlines)
- ✅ **Task Summary** - Total tasks, completion rate, status breakdown
- 📈 **Visual Charts** - Tasks by status, priority, and type
- 📅 **Upcoming Tasks** - Tasks due in the next 7 days
- 🚧 **Active Blockers** - Critical and high-severity blockers with action plans
- 📈 **Project Metrics** - Custom metrics from your project status

## 🚀 Quick Start

### Option 1: Manual Trigger (Test First!)

Test the report before setting up automation:

```bash
# Send test report to your email
npx tsx scripts/send-weekly-report.ts <YOUR_CLIENT_ID> --test your@email.com

# Example:
npx tsx scripts/send-weekly-report.ts 6a08f898-19cd-49f8-bd77-6fcb2dd56db9 --test rebel@rebelhq.ai
```

### Option 2: Send via UI

1. Go to **Project Management** dashboard
2. Click **"Send Report"** button in the header
3. Confirm to send test report to your email
4. Check your inbox for the beautiful report

### Option 3: API Endpoint

```bash
# Send test report (to requesting user)
curl -X POST "https://your-app.onrender.com/api/reports/weekly?test=true" \
  -H "Cookie: your-session-cookie"

# Send to all admins
curl -X POST "https://your-app.onrender.com/api/reports/weekly" \
  -H "Cookie: your-session-cookie"
```

---

## ⏰ Automated Weekly Scheduling

### Option A: Render Cron Jobs (Recommended for Render deployments)

Render supports native cron jobs for scheduled tasks.

**1. Create a cron job endpoint:**

File: `src/app/api/cron/weekly-report/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { sendWeeklyReport } from '@/lib/email/weekly-report';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all active client IDs that need reports
    const clientIds = process.env.REPORT_CLIENT_IDS?.split(',') || [];
    
    for (const clientId of clientIds) {
      await sendWeeklyReport(clientId.trim());
    }

    return NextResponse.json({ 
      success: true, 
      message: `Reports sent for ${clientIds.length} client(s)` 
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Failed to send reports' }, { status: 500 });
  }
}
```

**2. Add to `render.yaml`:**

```yaml
services:
  - type: web
    name: uysp-portal
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm run start
    
  # Add cron job for weekly reports
  - type: cron
    name: weekly-reports
    env: node
    schedule: "0 9 * * 1"  # Every Monday at 9 AM UTC
    buildCommand: npm install
    startCommand: |
      curl -X GET "https://your-app.onrender.com/api/cron/weekly-report" \
        -H "Authorization: Bearer $CRON_SECRET"
```

**3. Add environment variables:**

```bash
CRON_SECRET=<generate-random-secret>
REPORT_CLIENT_IDS=client-id-1,client-id-2
```

### Option B: GitHub Actions (For GitHub-hosted projects)

**1. Create workflow file:**

`.github/workflows/weekly-report.yml`

```yaml
name: Weekly Project Report

on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9 AM UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  send-report:
    runs-on: ubuntu-latest
    steps:
      - name: Send Weekly Report
        run: |
          curl -X POST "${{ secrets.APP_URL }}/api/cron/weekly-report" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

**2. Add secrets to GitHub:**
- `APP_URL`: Your deployed app URL
- `CRON_SECRET`: Random secret for authentication

### Option C: Server-Side Cron (For VPS/dedicated servers)

**1. Create wrapper script:**

`scripts/cron-weekly-report.sh`

```bash
#!/bin/bash
cd /path/to/your/app
source .env.local

# Get first client ID from database
CLIENT_ID=$(psql $DATABASE_URL -t -c "SELECT id FROM clients LIMIT 1;")

# Send report
npx tsx scripts/send-weekly-report.ts $CLIENT_ID

# Log result
echo "Weekly report sent at $(date)" >> logs/weekly-reports.log
```

**2. Make executable:**

```bash
chmod +x scripts/cron-weekly-report.sh
```

**3. Add to crontab:**

```bash
crontab -e

# Add this line (runs every Monday at 9 AM)
0 9 * * 1 /path/to/your/app/scripts/cron-weekly-report.sh
```

### Option D: Node-Cron (In-app scheduling)

**1. Install dependency:**

```bash
npm install node-cron
```

**2. Create scheduler:**

`src/lib/scheduler.ts`

```typescript
import cron from 'node-cron';
import { sendWeeklyReport } from './email/weekly-report';

export function startScheduler() {
  // Run every Monday at 9 AM
  cron.schedule('0 9 * * 1', async () => {
    console.log('Running weekly report cron job...');
    
    const clientIds = process.env.REPORT_CLIENT_IDS?.split(',') || [];
    
    for (const clientId of clientIds) {
      try {
        await sendWeeklyReport(clientId.trim());
        console.log(`✅ Report sent for client: ${clientId}`);
      } catch (error) {
        console.error(`❌ Failed to send report for ${clientId}:`, error);
      }
    }
  });

  console.log('📅 Weekly report scheduler started');
}
```

**3. Initialize in app:**

`src/app/layout.tsx` or server initialization:

```typescript
import { startScheduler } from '@/lib/scheduler';

if (process.env.NODE_ENV === 'production') {
  startScheduler();
}
```

---

## 🎨 Customizing the Report

### Change Report Content

Edit `src/lib/email/weekly-report.ts`:

```typescript
// Add custom sections
insights.push(`📊 Custom metric: ${yourMetric}`);

// Modify data gathering
const customData = await fetchYourCustomData();

// Adjust HTML template
const html = generateReportHTML({
  ...reportData,
  customSection: customData,
});
```

### Change Email Styling

The report uses inline CSS for maximum email client compatibility.

Key style variables in `generateReportHTML()`:

```typescript
const statusColors = {
  'Done': '#10b981',      // Green
  'In Progress': '#3b82f6', // Blue
  'To Do': '#6b7280',      // Gray
  'Blocked': '#ef4444',    // Red
};

const priorityColors = {
  'Critical': '#dc2626',   // Dark red
  'High': '#ea580c',       // Orange
  'Medium': '#f59e0b',     // Yellow
  'Low': '#10b981',        // Green
};
```

### Change Report Schedule

Cron syntax reference:

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
│ │ │ │ │
│ │ │ │ │
* * * * *

Examples:
0 9 * * 1  - Every Monday at 9 AM
0 9 * * 5  - Every Friday at 9 AM
0 17 * * 5 - Every Friday at 5 PM
0 9 1 * *  - First day of every month at 9 AM
```

---

## 📧 Email Configuration

Ensure your SMTP settings are configured:

### Environment Variables

```bash
SMTP_USER=your-gmail@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM_EMAIL=noreply@uysp.com
SMTP_FROM_NAME=UYSP Portal
```

### Gmail Setup (if using Gmail SMTP)

1. Enable 2-factor authentication on your Google account
2. Go to: https://myaccount.google.com/apppasswords
3. Create app password for "Mail"
4. Use that password as `SMTP_PASSWORD`

See `GMAIL-SMTP-SETUP-GUIDE.md` for detailed instructions.

### Test Email Configuration

```bash
npx tsx scripts/test-email.ts
```

---

## 🎯 Who Receives Reports

Reports are sent to users with these roles:
- ✅ `SUPER_ADMIN` - Receives all client reports
- ✅ `CLIENT_ADMIN` - Receives reports for their client
- ❌ `CLIENT_USER` - Does not receive reports

### Add Recipients

Create admin users:

```bash
# Via API endpoint
POST /api/admin/users
{
  "email": "admin@example.com",
  "firstName": "Admin",
  "lastName": "User",
  "role": "CLIENT_ADMIN",
  "clientId": "your-client-id"
}

# Via script
npx tsx scripts/create-client-user.ts
# Select role: CLIENT_ADMIN
```

---

## 📊 Report Content Details

### Data Included

1. **Project Health Status**
   - 🟢 Healthy - No critical blockers
   - 🟡 On Track with Issues - Has high-severity blockers
   - 🔴 Needs Attention - Has critical blockers

2. **Task Metrics**
   - Total tasks
   - Tasks completed this week
   - Tasks in progress
   - Tasks due in next 7 days

3. **Task Breakdown**
   - By Status (Done, In Progress, To Do, Blocked)
   - By Priority (Critical, High, Medium, Low)
   - By Type (Feature, Bug, Task, Improvement, Documentation, Research)

4. **Upcoming Tasks**
   - Tasks due within next 7 days
   - Sorted by due date
   - Shows priority and owner

5. **Active Blockers**
   - All blockers with status = "Active"
   - Grouped by severity
   - Shows action to resolve

6. **Project Metrics**
   - Custom metrics from `client_project_status` table
   - Grouped by category

### Report Frequency

**Recommended:** Weekly on Monday morning
- Gives team visibility into week ahead
- Shows progress from previous week
- Highlights blockers needing attention

**Alternative schedules:**
- **Friday afternoon**: Week wrap-up summary
- **First of month**: Monthly progress report
- **Daily**: For high-velocity projects (not recommended for most)

---

## 🧪 Testing

### Test Report Generation

```bash
# Send to your email
npx tsx scripts/send-weekly-report.ts <CLIENT_ID> --test your@email.com
```

### Test via UI

1. Login as admin
2. Go to Project Management
3. Click "Send Report" button
4. Confirm
5. Check your email

### Verify Email Rendering

Test in multiple email clients:
- ✅ Gmail
- ✅ Outlook
- ✅ Apple Mail
- ✅ Mobile (iOS/Android)

Use tools like:
- [Litmus](https://litmus.com)
- [Email on Acid](https://www.emailonacid.com)
- [Mail Tester](https://www.mail-tester.com)

---

## 🔧 Troubleshooting

### Report Not Sending

**Check SMTP configuration:**
```bash
npx tsx scripts/test-email.ts
```

**Check admin users exist:**
```bash
npx tsx scripts/list-users.ts
# Verify CLIENT_ADMIN or SUPER_ADMIN users exist
```

**Check logs:**
```bash
# Render logs
render logs -n uysp-portal

# Or check console output
```

### Report Contains No Data

**Verify project data synced:**
```bash
# Check database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM client_project_tasks;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM client_project_blockers;"
```

**Sync data if empty:**
```bash
# Via API
POST /api/admin/sync

# Or via UI
Admin → Client → Sync Data
```

### Email Goes to Spam

**Fix deliverability:**
1. Use authenticated SMTP (Gmail App Password)
2. Add SPF/DKIM records to domain
3. Verify sender email address
4. Avoid spam trigger words in subject/body
5. Use proper HTML structure (already implemented)

**Test spam score:**
```bash
# Send to https://www.mail-tester.com
npx tsx scripts/send-weekly-report.ts <CLIENT_ID> --test test-xxxxx@srv1.mail-tester.com
```

### Cron Job Not Running

**Render cron:**
- Check Render dashboard → Cron Jobs
- Verify schedule is correct
- Check cron job logs

**GitHub Actions:**
- Go to repository → Actions tab
- Check workflow runs
- Verify secrets are set

**Server cron:**
```bash
# Check crontab is set
crontab -l

# Check cron logs
grep CRON /var/log/syslog

# Test script manually
/path/to/scripts/cron-weekly-report.sh
```

---

## 📝 Examples

### Example Report Preview

![Weekly Report Preview](https://via.placeholder.com/800x600?text=Weekly+Project+Report)

**Key sections:**
- Header with project health status
- Key insights (auto-generated)
- Task summary statistics
- Visual charts (status, priority, type)
- Upcoming tasks list
- Active blockers with severity
- Custom project metrics
- Footer with dashboard link

### Example Schedule Configuration

**For agency with multiple clients:**

```bash
# Environment variables
REPORT_CLIENT_IDS=client-1-id,client-2-id,client-3-id

# Cron schedule (every Monday 9 AM)
0 9 * * 1

# Sends 3 reports, one per client
```

---

## 🎁 Future Enhancements

Potential features to add:

- [ ] PDF export option
- [ ] Configurable sections (enable/disable)
- [ ] Multiple recipients per client
- [ ] Custom report templates
- [ ] Slack/Discord integration
- [ ] Daily digest option
- [ ] Report history archive
- [ ] Analytics (open rates, click rates)
- [ ] AI-generated insights
- [ ] Trend analysis (week-over-week)

---

## 📚 Related Documentation

- [Email Setup Guide](GMAIL-SMTP-SETUP-GUIDE.md)
- [Project Management Documentation](PM-DASHBOARD-PRD.md)
- [Deployment Guide](DEPLOYMENT-GUIDE.md)

---

**Ready to get started?**

```bash
# 1. Test the report
npx tsx scripts/send-weekly-report.ts <CLIENT_ID> --test your@email.com

# 2. Set up automated scheduling (choose one method above)

# 3. Sit back and receive beautiful reports every week! 📊✨
```

