/**
 * Branded Weekly Report Email Template - Rebel HQ Oceanic Theme
 * Clean, minimal, on-brand design
 */

import { db } from '@/lib/db';
import { clientProjectTasks, clientProjectBlockers, clientProjectStatus, users, clients } from '@/lib/db/schema';
import { eq, and, desc, sql, gte } from 'drizzle-orm';
import { sendEmail } from './mailer';

// Re-export types and data gathering from original file
export { sendWeeklyReport, sendTestReport, sendAllWeeklyReports } from './weekly-report';

interface WeeklyReportData {
  weekOf: string;
  clientName: string;
  clientId: string;
  tasks: {
    total: number;
    completedThisWeek: number;
    inProgress: number;
    upcoming: number;
  };
  blockers: {
    total: number;
    critical: number;
  };
  callSummary?: {
    callDate: string | null;
    executiveSummary: string;
    topPriorities: string;
    keyDecisions: string;
    nextSteps: string;
    attendees: string;
  } | null;
  metrics: Array<{
    label: string;
    value: string;
  }>;
}

/**
 * Generate clean, on-brand HTML email
 * Rebel HQ Oceanic Theme: Dark (#111827), Pink (#be185d), Indigo (#4f46e5), Cyan (#22d3ee)
 */
export function generateBrandedReportHTML(data: WeeklyReportData): string {
  // Brand colors
  const c = {
    bg: '#111827',
    card: '#1f2937',
    border: '#374151',
    white: '#ffffff',
    text: '#d1d5db',
    textMuted: '#9ca3af',
    pink: '#be185d',
    indigo: '#4f46e5',
    cyan: '#22d3ee',
  };

  const dashboardUrl = `${process.env.NEXTAUTH_URL || 'https://uysp-portal-v2.onrender.com'}/project-management?clientId=${data.clientId}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${c.bg};
      color: ${c.text};
      line-height: 1.5;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: ${c.bg};
    }
    .header {
      border-bottom: 2px solid ${c.pink};
      padding: 24px 0;
      margin-bottom: 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo {
      font-size: 20px;
      font-weight: 700;
      color: ${c.white};
    }
    .logo .hq {
      color: ${c.pink};
    }
    .client-name {
      font-size: 20px;
      font-weight: 700;
      color: ${c.white};
    }
    .week {
      font-size: 14px;
      color: ${c.textMuted};
      margin-top: 16px;
    }
    .section {
      margin-bottom: 32px;
    }
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: ${c.white};
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 16px;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    .stat {
      background: ${c.card};
      border: 1px solid ${c.border};
      border-radius: 6px;
      padding: 16px;
    }
    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: ${c.white};
      margin-bottom: 4px;
    }
    .stat-label {
      font-size: 12px;
      color: ${c.textMuted};
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat.primary { border-left: 3px solid ${c.pink}; }
    .stat.secondary { border-left: 3px solid ${c.indigo}; }
    .stat.tertiary { border-left: 3px solid ${c.cyan}; }
    .alert {
      background: ${c.card};
      border: 1px solid ${c.pink};
      border-radius: 6px;
      padding: 16px;
      margin-bottom: 12px;
    }
    .alert-title {
      font-size: 14px;
      font-weight: 600;
      color: ${c.pink};
      margin-bottom: 4px;
    }
    .alert-text {
      font-size: 14px;
      color: ${c.text};
    }
    .metrics {
      background: ${c.card};
      border: 1px solid ${c.border};
      border-radius: 6px;
      padding: 16px;
    }
    .metric-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid ${c.border};
    }
    .metric-row:last-child { border-bottom: none; }
    .metric-label {
      font-size: 14px;
      color: ${c.text};
    }
    .metric-value {
      font-size: 14px;
      font-weight: 600;
      color: ${c.cyan};
    }
    .footer {
      margin-top: 40px;
      padding-top: 24px;
      border-top: 1px solid ${c.border};
      text-align: center;
    }
    .footer-text {
      font-size: 12px;
      color: ${c.textMuted};
      margin-bottom: 12px;
    }
    .footer-link {
      font-size: 13px;
      color: ${c.cyan};
      text-decoration: none;
      font-weight: 600;
    }
    .footer-link:hover { color: ${c.indigo}; }
    .call-summary {
      background: ${c.card};
      border: 1px solid ${c.border};
      border-left: 3px solid ${c.indigo};
      border-radius: 6px;
      padding: 16px;
      margin-bottom: 12px;
    }
    .call-summary-title {
      font-size: 13px;
      font-weight: 600;
      color: ${c.indigo};
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .call-summary-text {
      font-size: 14px;
      color: ${c.text};
      line-height: 1.6;
      margin-bottom: 12px;
    }
    .call-summary-text:last-child {
      margin-bottom: 0;
    }
    .call-date {
      font-size: 12px;
      color: ${c.textMuted};
      margin-bottom: 12px;
    }
    a.email-wrapper {
      text-decoration: none;
      color: inherit;
      display: block;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo">Rebel <span class="hq">HQ</span></div>
      <div class="client-name">${data.clientName}</div>
    </div>
    <div class="week">Weekly Report · ${data.weekOf}</div>

    <a href="${dashboardUrl}" class="email-wrapper">
    <!-- Call Summary -->
    ${data.callSummary ? `
    <div class="section">
      <div class="section-title">Last Call Summary</div>
      <div class="call-summary">
        ${data.callSummary.callDate ? `<div class="call-date">📞 ${new Date(data.callSummary.callDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>` : ''}

        ${data.callSummary.executiveSummary ? `
        <div class="call-summary-title">Executive Summary</div>
        <div class="call-summary-text">${data.callSummary.executiveSummary}</div>
        ` : ''}

        ${data.callSummary.topPriorities ? `
        <div class="call-summary-title">Top Priorities</div>
        <div class="call-summary-text">${data.callSummary.topPriorities}</div>
        ` : ''}

        ${data.callSummary.keyDecisions ? `
        <div class="call-summary-title">Key Decisions</div>
        <div class="call-summary-text">${data.callSummary.keyDecisions}</div>
        ` : ''}

        ${data.callSummary.nextSteps ? `
        <div class="call-summary-title">Next Steps</div>
        <div class="call-summary-text">${data.callSummary.nextSteps}</div>
        ` : ''}

        ${data.callSummary.attendees ? `<div class="call-date">👥 ${data.callSummary.attendees}</div>` : ''}
      </div>
    </div>
    ` : ''}

    <!-- Task Stats -->
    <div class="section">
      <div class="section-title">Tasks</div>
      <div class="stats">
        <div class="stat primary">
          <div class="stat-value">${data.tasks.total}</div>
          <div class="stat-label">Total</div>
        </div>
        <div class="stat tertiary">
          <div class="stat-value">${data.tasks.completedThisWeek}</div>
          <div class="stat-label">Completed</div>
        </div>
        <div class="stat secondary">
          <div class="stat-value">${data.tasks.inProgress}</div>
          <div class="stat-label">In Progress</div>
        </div>
        <div class="stat tertiary">
          <div class="stat-value">${data.tasks.upcoming}</div>
          <div class="stat-label">Due Next 7 Days</div>
        </div>
      </div>
    </div>

    <!-- Blockers -->
    ${data.blockers.total > 0 ? `
    <div class="section">
      <div class="section-title">Blockers</div>
      <div class="alert">
        <div class="alert-title">${data.blockers.total} Active ${data.blockers.total === 1 ? 'Blocker' : 'Blockers'}</div>
        <div class="alert-text">${data.blockers.critical} critical · Requires immediate attention</div>
      </div>
    </div>
    ` : ''}

    <!-- Metrics -->
    ${data.metrics.length > 0 ? `
    <div class="section">
      <div class="section-title">Metrics</div>
      <div class="metrics">
        ${data.metrics.map(m => `
          <div class="metric-row">
            <div class="metric-label">${m.label}</div>
            <div class="metric-value">${m.value}</div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    </a>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-text">Automated weekly report from Rebel HQ</div>
      <div class="footer-text" style="margin-top: 8px; font-size: 11px;">Click anywhere to view full dashboard</div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
