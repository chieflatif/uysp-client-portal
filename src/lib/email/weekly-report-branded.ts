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

interface Task {
  task: string;
  status: string;
  priority: string;
  taskType?: string;
  owner?: string;
  dueDate?: Date | null;
}

interface Blocker {
  blocker: string;
  severity: string;
  actionToResolve?: string;
  status: string;
}

interface WeeklyReportData {
  weekOf: string;
  clientName: string;
  clientId: string;
  tasks: Task[];
  blockers: Blocker[];
  callSummary?: {
    callDate: string | null;
    executiveSummary: string;
    topPriorities: string;
    keyDecisions: string;
    nextSteps: string;
    attendees: string;
  } | null;
  dashboard?: {
    currentPhase: string;
    progressPercentage: number;
    totalTasks: number;
    completedTasks: number;
    activeTasks: number;
    activeBlockers: number;
  };
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

  // Helper: Get priority badge class
  const getPriorityClass = (priority: string): string => {
    const p = priority.toLowerCase();
    if (p.includes('critical') || p.includes('🔴')) return 'priority-critical';
    if (p.includes('high') || p.includes('🟠')) return 'priority-high';
    if (p.includes('medium') || p.includes('🟡')) return 'priority-medium';
    return 'priority-low';
  };

  // Helper: Get status badge class
  const getStatusClass = (status: string): string => {
    const s = status.toLowerCase();
    if (s.includes('done') || s.includes('complete')) return 'status-done';
    if (s.includes('progress')) return 'status-progress';
    if (s.includes('blocked')) return 'status-blocked';
    return 'status-todo';
  };

  // Helper: Get severity class
  const getSeverityClass = (severity: string): string => {
    const s = severity.toLowerCase();
    if (s.includes('critical')) return 'severity-critical';
    if (s.includes('high')) return 'severity-high';
    return 'severity-medium';
  };

  // Helper: Format date
  const formatDate = (date: Date | null | undefined): string => {
    if (!date) return 'No due date';
    try {
      return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'No due date';
    }
  };

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
    .task-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }
    .task-row {
      border-bottom: 1px solid ${c.border};
    }
    .task-row:last-child {
      border-bottom: none;
    }
    .task-cell {
      padding: 12px 8px;
      vertical-align: top;
    }
    .task-name {
      color: ${c.white};
      font-weight: 500;
      margin-bottom: 4px;
    }
    .task-meta {
      font-size: 12px;
      color: ${c.textMuted};
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 6px;
    }
    .task-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }
    .priority-critical { background: #dc2626; color: white; }
    .priority-high { background: #ea580c; color: white; }
    .priority-medium { background: #f59e0b; color: white; }
    .priority-low { background: #10b981; color: white; }
    .status-done { background: #10b981; color: white; }
    .status-progress { background: #3b82f6; color: white; }
    .status-blocked { background: #ef4444; color: white; }
    .status-todo { background: #6b7280; color: white; }
    .blocker-list {
      margin-top: 12px;
    }
    .blocker-item {
      background: ${c.card};
      border-left: 3px solid #ef4444;
      padding: 12px;
      margin-bottom: 8px;
      border-radius: 4px;
    }
    .blocker-item:last-child {
      margin-bottom: 0;
    }
    .blocker-header {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-bottom: 6px;
    }
    .blocker-text {
      color: ${c.white};
      font-weight: 500;
      margin-bottom: 6px;
    }
    .blocker-action {
      color: ${c.textMuted};
      font-size: 12px;
    }
    .severity-critical { background: #dc2626; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: 600; }
    .severity-high { background: #ea580c; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: 600; }
    .severity-medium { background: #f59e0b; color: white; padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: 600; }
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

    <!-- Dashboard Stats -->
    ${data.dashboard ? `
    <div class="section">
      <div class="section-title">Project Overview</div>
      <div class="stats">
        <div class="stat primary">
          <div class="stat-value">${data.dashboard.progressPercentage}%</div>
          <div class="stat-label">Progress</div>
        </div>
        <div class="stat secondary">
          <div class="stat-value">${data.dashboard.activeTasks}</div>
          <div class="stat-label">Active Tasks</div>
        </div>
        <div class="stat tertiary">
          <div class="stat-value">${data.dashboard.completedTasks}/${data.dashboard.totalTasks}</div>
          <div class="stat-label">Completed</div>
        </div>
        <div class="stat primary">
          <div class="stat-value">${data.dashboard.activeBlockers}</div>
          <div class="stat-label">Active Blockers</div>
        </div>
      </div>
      ${data.dashboard.currentPhase ? `
      <div class="metrics" style="margin-top: 12px;">
        <div class="metric-row" style="border-bottom: none;">
          <div class="metric-label">Current Phase</div>
          <div class="metric-value">${data.dashboard.currentPhase}</div>
        </div>
      </div>
      ` : ''}
    </div>
    ` : ''}

    <!-- Tasks -->
    <div class="section">
      <div class="section-title">Tasks (${data.tasks.length})</div>
      ${data.tasks.length > 0 ? `
        <table class="task-table">
          ${data.tasks.map(task => `
            <tr class="task-row">
              <td class="task-cell">
                <div class="task-name">${task.task}</div>
                <div class="task-meta">
                  <span class="task-badge ${getPriorityClass(task.priority)}">${task.priority}</span>
                  <span class="task-badge ${getStatusClass(task.status)}">${task.status}</span>
                  ${task.taskType ? `<span style="color: ${c.textMuted};">${task.taskType}</span>` : ''}
                  ${task.owner ? `<span style="color: ${c.textMuted};">👤 ${task.owner}</span>` : ''}
                  ${task.dueDate ? `<span style="color: ${c.textMuted};">📅 ${formatDate(task.dueDate)}</span>` : ''}
                </div>
              </td>
            </tr>
          `).join('')}
        </table>
      ` : `
        <div style="color: ${c.textMuted}; text-align: center; padding: 20px;">No tasks yet</div>
      `}
    </div>

    <!-- Blockers -->
    ${data.blockers.length > 0 ? `
    <div class="section">
      <div class="section-title">Blockers (${data.blockers.length})</div>
      <div class="blocker-list">
        ${data.blockers.map(blocker => `
          <div class="blocker-item">
            <div class="blocker-header">
              <span class="${getSeverityClass(blocker.severity)}">${blocker.severity.toUpperCase()}</span>
            </div>
            <div class="blocker-text">${blocker.blocker}</div>
            ${blocker.actionToResolve ? `
              <div class="blocker-action">→ ${blocker.actionToResolve}</div>
            ` : ''}
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
