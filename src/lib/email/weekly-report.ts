/**
 * Weekly Project Management Report Generator
 * Sends beautiful formatted reports to administrators
 */

import { db } from '@/lib/db';
import { clientProjectTasks, clientProjectBlockers, clientProjectStatus, users, clients } from '@/lib/db/schema';
import { eq, and, desc, sql, gte } from 'drizzle-orm';
import { sendEmail } from './mailer';
import { getAirtableClient } from '@/lib/airtable/client';
import { generateBrandedReportHTML } from './weekly-report-branded';

interface TaskSummary {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byType: Record<string, number>;
  upcoming: Array<{
    task: string;
    dueDate: Date | null;
    priority: string;
    owner: string | null;
  }>;
  completedThisWeek: number;
}

interface BlockerSummary {
  total: number;
  critical: number;
  high: number;
  byStatus: Record<string, number>;
  active: Array<{
    blocker: string;
    severity: string;
    actionToResolve: string | null;
  }>;
}

interface ProjectMetrics {
  overallHealth: string;
  statusMetrics: Array<{
    metric: string;
    value: string;
    category: string;
  }>;
}

interface WeeklyReportData {
  weekOf: string;
  clientName: string;
  clientId: string;
  tasks: TaskSummary;
  blockers: BlockerSummary;
  metrics: ProjectMetrics;
  insights: string[];
  callSummary?: {
    callDate: string | null;
    executiveSummary: string;
    topPriorities: string;
    keyDecisions: string;
    nextSteps: string;
    attendees: string;
  } | null;
}

/**
 * Gather weekly report data for a client
 */
async function gatherReportData(clientId: string): Promise<WeeklyReportData> {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // SECURITY: Get client info for this specific client ONLY
  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1);

  if (!client) {
    throw new Error(`Client ${clientId} not found`);
  }

  // SECURITY: Fetch tasks for THIS CLIENT ONLY
  const allTasks = await db
    .select()
    .from(clientProjectTasks)
    .where(eq(clientProjectTasks.clientId, clientId));

  // Fetch active blockers
  const activeBlockers = await db
    .select()
    .from(clientProjectBlockers)
    .where(
      and(
        eq(clientProjectBlockers.clientId, clientId),
        eq(clientProjectBlockers.status, 'Active')
      )
    );

  // Fetch project status metrics
  const statusMetrics = await db
    .select()
    .from(clientProjectStatus)
    .where(eq(clientProjectStatus.clientId, clientId))
    .orderBy(clientProjectStatus.displayOrder);

  // Calculate task summary
  const tasksByStatus: Record<string, number> = {};
  const tasksByPriority: Record<string, number> = {};
  const tasksByType: Record<string, number> = {};
  let completedThisWeek = 0;

  allTasks.forEach((task) => {
    tasksByStatus[task.status] = (tasksByStatus[task.status] || 0) + 1;
    tasksByPriority[task.priority] = (tasksByPriority[task.priority] || 0) + 1;
    tasksByType[task.taskType] = (tasksByType[task.taskType] || 0) + 1;

    if (task.status === 'Done' && task.updatedAt >= oneWeekAgo) {
      completedThisWeek++;
    }
  });

  // Get upcoming tasks (next 7 days)
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const upcomingTasks = allTasks
    .filter((task) => 
      task.dueDate && 
      task.dueDate <= nextWeek && 
      task.dueDate >= new Date() &&
      task.status !== 'Done'
    )
    .sort((a, b) => {
      if (!a.dueDate || !b.dueDate) return 0;
      return a.dueDate.getTime() - b.dueDate.getTime();
    })
    .slice(0, 5)
    .map((task) => ({
      task: task.task,
      dueDate: task.dueDate,
      priority: task.priority,
      owner: task.owner,
    }));

  // Calculate blocker summary
  const blockersByStatus: Record<string, number> = {};
  let critical = 0;
  let high = 0;

  activeBlockers.forEach((blocker) => {
    blockersByStatus[blocker.status] = (blockersByStatus[blocker.status] || 0) + 1;
    if (blocker.severity === 'Critical') critical++;
    if (blocker.severity === 'High') high++;
  });

  // Generate insights
  const insights: string[] = [];
  
  if (completedThisWeek > 0) {
    insights.push(`✅ ${completedThisWeek} tasks completed this week`);
  }
  
  if (critical > 0) {
    insights.push(`⚠️ ${critical} critical blocker${critical > 1 ? 's' : ''} need${critical === 1 ? 's' : ''} immediate attention`);
  }
  
  if (upcomingTasks.length > 0) {
    insights.push(`📅 ${upcomingTasks.length} tasks due in the next 7 days`);
  }

  const inProgressCount = tasksByStatus['In Progress'] || 0;
  if (inProgressCount > 0) {
    insights.push(`🔄 ${inProgressCount} tasks currently in progress`);
  }

  // Determine overall health
  const overallHealth = critical > 0 ? '🔴 Needs Attention' :
                       high > 0 ? '🟡 On Track with Issues' :
                       '🟢 Healthy';

  // Fetch latest call summary from Airtable
  let callSummary = null;
  try {
    if (client.airtableBaseId) {
      const airtable = getAirtableClient(client.airtableBaseId);
      const latestCallSummary = await airtable.getLatestCallSummary();

      if (latestCallSummary) {
        callSummary = {
          callDate: latestCallSummary.callDate,
          executiveSummary: latestCallSummary.executiveSummary,
          topPriorities: latestCallSummary.topPriorities,
          keyDecisions: latestCallSummary.keyDecisions,
          nextSteps: latestCallSummary.nextSteps,
          attendees: latestCallSummary.attendees,
        };
      }
    }
  } catch (error) {
    console.error('Error fetching call summary for report:', error);
    // Continue without call summary if fetch fails
  }

  return {
    weekOf: new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }),
    clientName: client.companyName,
    clientId: client.id,
    tasks: {
      total: allTasks.length,
      byStatus: tasksByStatus,
      byPriority: tasksByPriority,
      byType: tasksByType,
      upcoming: upcomingTasks,
      completedThisWeek,
    },
    blockers: {
      total: activeBlockers.length,
      critical,
      high,
      byStatus: blockersByStatus,
      active: activeBlockers.slice(0, 5).map((b) => ({
        blocker: b.blocker,
        severity: b.severity,
        actionToResolve: b.actionToResolve,
      })),
    },
    metrics: {
      overallHealth,
      statusMetrics: statusMetrics.map((m) => ({
        metric: m.metric,
        value: m.value,
        category: m.category,
      })),
    },
    insights,
    callSummary,
  };
}

/**
 * Generate beautiful HTML email for weekly report
 */
function generateReportHTML(data: WeeklyReportData): string {
  const statusColors: Record<string, string> = {
    'Done': '#10b981',
    'In Progress': '#3b82f6',
    'To Do': '#6b7280',
    'Blocked': '#ef4444',
  };

  const priorityColors: Record<string, string> = {
    'Critical': '#dc2626',
    'High': '#ea580c',
    'Medium': '#f59e0b',
    'Low': '#10b981',
  };

  const severityColors: Record<string, string> = {
    'Critical': '#dc2626',
    'High': '#ea580c',
    'Medium': '#f59e0b',
    'Low': '#10b981',
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: #f9fafb;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 32px;
      font-weight: 700;
    }
    .header .subtitle {
      margin: 0;
      font-size: 18px;
      opacity: 0.9;
    }
    .content {
      padding: 30px;
    }
    .section {
      margin-bottom: 40px;
    }
    .section-title {
      font-size: 22px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 20px 0;
      padding-bottom: 10px;
      border-bottom: 3px solid #667eea;
    }
    .health-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 16px;
      margin: 10px 0;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .stat-card {
      background: #f9fafb;
      border-radius: 12px;
      padding: 20px;
      border-left: 4px solid #667eea;
    }
    .stat-number {
      font-size: 36px;
      font-weight: 700;
      color: #667eea;
      margin: 0;
    }
    .stat-label {
      font-size: 14px;
      color: #6b7280;
      margin: 5px 0 0 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .chart-container {
      background: #f9fafb;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }
    .chart-row {
      display: flex;
      align-items: center;
      margin: 12px 0;
    }
    .chart-label {
      min-width: 120px;
      font-weight: 600;
      color: #374151;
    }
    .chart-bar-container {
      flex: 1;
      background: #e5e7eb;
      border-radius: 8px;
      height: 32px;
      position: relative;
      overflow: hidden;
    }
    .chart-bar {
      height: 100%;
      border-radius: 8px;
      display: flex;
      align-items: center;
      padding: 0 12px;
      color: white;
      font-weight: 600;
      font-size: 14px;
    }
    .chart-count {
      margin-left: 12px;
      font-weight: 600;
      color: #374151;
      min-width: 30px;
    }
    .task-list {
      background: #f9fafb;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }
    .task-item {
      background: white;
      border-radius: 8px;
      padding: 16px;
      margin: 12px 0;
      border-left: 4px solid #667eea;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .task-title {
      font-weight: 600;
      color: #111827;
      margin: 0 0 8px 0;
    }
    .task-meta {
      display: flex;
      gap: 16px;
      font-size: 14px;
      color: #6b7280;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .blocker-item {
      background: #fef2f2;
      border-left: 4px solid #ef4444;
      border-radius: 8px;
      padding: 16px;
      margin: 12px 0;
    }
    .blocker-title {
      font-weight: 700;
      color: #991b1b;
      margin: 0 0 8px 0;
    }
    .blocker-action {
      font-size: 14px;
      color: #6b7280;
      margin: 8px 0 0 0;
    }
    .insight-list {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .insight-item {
      margin: 10px 0;
      font-size: 16px;
      color: #1e40af;
    }
    .footer {
      background: #f9fafb;
      padding: 30px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      border-top: 1px solid #e5e7eb;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
    }
    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #9ca3af;
      font-size: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>📊 Weekly Project Report</h1>
      <p class="subtitle">Week of ${data.weekOf}</p>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Project Health -->
      <div class="section">
        <h2 class="section-title">🏥 Project Health</h2>
        <div class="health-badge" style="background: ${data.metrics.overallHealth.includes('🟢') ? '#10b981' : data.metrics.overallHealth.includes('🟡') ? '#f59e0b' : '#ef4444'}; color: white;">
          ${data.metrics.overallHealth}
        </div>
      </div>

      <!-- Key Insights -->
      ${data.insights.length > 0 ? `
      <div class="section">
        <h2 class="section-title">💡 Key Insights</h2>
        <div class="insight-list">
          ${data.insights.map(insight => `
            <div class="insight-item">${insight}</div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <!-- Task Summary -->
      <div class="section">
        <h2 class="section-title">✅ Task Summary</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <p class="stat-number">${data.tasks.total}</p>
            <p class="stat-label">Total Tasks</p>
          </div>
          <div class="stat-card">
            <p class="stat-number">${data.tasks.completedThisWeek}</p>
            <p class="stat-label">Completed This Week</p>
          </div>
          <div class="stat-card">
            <p class="stat-number">${data.tasks.byStatus['In Progress'] || 0}</p>
            <p class="stat-label">In Progress</p>
          </div>
          <div class="stat-card">
            <p class="stat-number">${data.tasks.upcoming.length}</p>
            <p class="stat-label">Due Next 7 Days</p>
          </div>
        </div>

        <!-- Tasks by Status -->
        <div class="chart-container">
          <h3 style="margin: 0 0 16px 0; color: #374151;">Tasks by Status</h3>
          ${Object.entries(data.tasks.byStatus).map(([status, count]) => `
            <div class="chart-row">
              <div class="chart-label">${status}</div>
              <div class="chart-bar-container">
                <div class="chart-bar" style="width: ${(count / data.tasks.total) * 100}%; background: ${statusColors[status] || '#6b7280'};">
                  ${count > 0 ? count : ''}
                </div>
              </div>
              <div class="chart-count">${count}</div>
            </div>
          `).join('')}
        </div>

        <!-- Tasks by Priority -->
        <div class="chart-container">
          <h3 style="margin: 0 0 16px 0; color: #374151;">Tasks by Priority</h3>
          ${Object.entries(data.tasks.byPriority).map(([priority, count]) => `
            <div class="chart-row">
              <div class="chart-label">${priority}</div>
              <div class="chart-bar-container">
                <div class="chart-bar" style="width: ${(count / data.tasks.total) * 100}%; background: ${priorityColors[priority] || '#6b7280'};">
                  ${count > 0 ? count : ''}
                </div>
              </div>
              <div class="chart-count">${count}</div>
            </div>
          `).join('')}
        </div>

        <!-- Tasks by Type -->
        <div class="chart-container">
          <h3 style="margin: 0 0 16px 0; color: #374151;">Tasks by Type</h3>
          ${Object.entries(data.tasks.byType).map(([type, count]) => `
            <div class="chart-row">
              <div class="chart-label">${type}</div>
              <div class="chart-bar-container">
                <div class="chart-bar" style="width: ${(count / data.tasks.total) * 100}%; background: #667eea;">
                  ${count > 0 ? count : ''}
                </div>
              </div>
              <div class="chart-count">${count}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Upcoming Tasks -->
      ${data.tasks.upcoming.length > 0 ? `
      <div class="section">
        <h2 class="section-title">📅 Upcoming Tasks (Next 7 Days)</h2>
        <div class="task-list">
          ${data.tasks.upcoming.map(task => `
            <div class="task-item">
              <div class="task-title">${task.task}</div>
              <div class="task-meta">
                <span>📆 Due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Not set'}</span>
                <span class="badge" style="background: ${priorityColors[task.priority] || '#6b7280'}; color: white;">${task.priority}</span>
                ${task.owner ? `<span>👤 ${task.owner}</span>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <!-- Blockers -->
      ${data.blockers.total > 0 ? `
      <div class="section">
        <h2 class="section-title">🚧 Active Blockers (${data.blockers.total})</h2>
        <div class="stats-grid">
          <div class="stat-card" style="border-left-color: #ef4444;">
            <p class="stat-number" style="color: #ef4444;">${data.blockers.critical}</p>
            <p class="stat-label">Critical</p>
          </div>
          <div class="stat-card" style="border-left-color: #f59e0b;">
            <p class="stat-number" style="color: #f59e0b;">${data.blockers.high}</p>
            <p class="stat-label">High Severity</p>
          </div>
        </div>
        
        ${data.blockers.active.map(blocker => `
          <div class="blocker-item">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
              <span class="badge" style="background: ${severityColors[blocker.severity] || '#6b7280'}; color: white;">
                ${blocker.severity}
              </span>
              <div class="blocker-title">${blocker.blocker}</div>
            </div>
            ${blocker.actionToResolve ? `
              <div class="blocker-action">
                <strong>Action to Resolve:</strong> ${blocker.actionToResolve}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
      ` : `
      <div class="section">
        <h2 class="section-title">🚧 Blockers</h2>
        <div class="empty-state">
          🎉 No active blockers! Project is running smoothly.
        </div>
      </div>
      `}

      <!-- Project Metrics -->
      ${data.metrics.statusMetrics.length > 0 ? `
      <div class="section">
        <h2 class="section-title">📈 Project Metrics</h2>
        <div class="chart-container">
          ${data.metrics.statusMetrics.map(metric => `
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
              <span style="font-weight: 600; color: #374151;">${metric.metric}</span>
              <span style="color: #667eea; font-weight: 600;">${metric.value}</span>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 0 0 10px 0;">
        This is an automated weekly report from your UYSP Project Management System
      </p>
      <p style="margin: 0;">
        <a href="${process.env.NEXTAUTH_URL}/project-management">View Full Dashboard →</a>
      </p>
      <p style="margin: 20px 0 0 0; font-size: 12px;">
        © ${new Date().getFullYear()} UYSP. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send weekly report for a specific client
 * SECURITY: Only sends to CLIENT_ADMIN users belonging to that client
 * and SUPER_ADMIN users (who can see all clients)
 */
export async function sendWeeklyReport(clientId: string): Promise<void> {
  try {
    // SECURITY: Get CLIENT_ADMIN users for THIS CLIENT ONLY
    const clientAdmins = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.clientId, clientId),
          eq(users.role, 'CLIENT_ADMIN'),
          eq(users.isActive, true)
        )
      );

    // SECURITY: Get ALL SUPER_ADMIN users (they see all clients)
    const superAdmins = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.role, 'SUPER_ADMIN'),
          eq(users.isActive, true)
        )
      );

    // Combine recipients
    const recipients = [...clientAdmins, ...superAdmins];
    const adminEmails = recipients.map(user => user.email);

    if (adminEmails.length === 0) {
      console.log(`⚠️ No administrators found for client ${clientId}`);
      return;
    }

    // Gather report data - ONLY for this client
    const reportData = await gatherReportData(clientId);

    // Fetch all tasks for this client (not just summary stats)
    const allTasks = await db
      .select()
      .from(clientProjectTasks)
      .where(eq(clientProjectTasks.clientId, clientId));

    // Fetch all active blockers
    const allBlockers = await db
      .select()
      .from(clientProjectBlockers)
      .where(
        and(
          eq(clientProjectBlockers.clientId, clientId),
          eq(clientProjectBlockers.status, 'Active')
        )
      );

    // Calculate dashboard stats
    const completedTasks = allTasks.filter(t => t.status === 'Complete' || t.status === 'Done').length;
    const activeTasks = allTasks.filter(t => t.status !== 'Complete' && t.status !== 'Done').length;
    const progressPercentage = allTasks.length > 0 ? Math.round((completedTasks / allTasks.length) * 100) : 0;

    // Get current phase from project status
    const currentPhaseMetric = await db
      .select()
      .from(clientProjectStatus)
      .where(
        and(
          eq(clientProjectStatus.clientId, clientId),
          eq(clientProjectStatus.metric, 'Current Phase')
        )
      )
      .limit(1);

    const currentPhase = currentPhaseMetric.length > 0 ? currentPhaseMetric[0].value : 'In Progress';

    // Transform data for branded template
    const brandedData = {
      weekOf: reportData.weekOf,
      clientName: reportData.clientName,
      clientId: reportData.clientId,
      tasks: allTasks.map(t => ({
        task: t.task,
        status: t.status,
        priority: t.priority,
        taskType: t.taskType || undefined,
        owner: t.owner || undefined,
        dueDate: t.dueDate || undefined,
      })),
      blockers: allBlockers.map(b => ({
        blocker: b.blocker,
        severity: b.severity,
        actionToResolve: b.actionToResolve || undefined,
        status: b.status,
      })),
      callSummary: reportData.callSummary,
      dashboard: {
        currentPhase,
        progressPercentage,
        totalTasks: allTasks.length,
        completedTasks,
        activeTasks,
        activeBlockers: allBlockers.length,
      },
    };

    // Generate HTML using branded template
    const html = generateBrandedReportHTML(brandedData);

    // Send to each admin
    for (const email of adminEmails) {
      await sendEmail({
        to: email,
        subject: `📊 Weekly Project Report - ${reportData.clientName} - Week of ${reportData.weekOf}`,
        html,
        emailType: 'weekly_report',
        clientId,
        metadata: {
          weekOf: reportData.weekOf,
          clientName: reportData.clientName,
          testMode: false,
        },
      });
    }

    console.log(`✅ Weekly report for client ${clientId} sent to ${adminEmails.length} administrator(s)`);
    console.log(`   - CLIENT_ADMIN: ${clientAdmins.length}`);
    console.log(`   - SUPER_ADMIN: ${superAdmins.length}`);
  } catch (error) {
    console.error(`❌ Error sending weekly report for client ${clientId}:`, error);
    throw error;
  }
}

/**
 * Send weekly reports for ALL clients
 * SECURITY: Each client gets their own isolated report
 * SUPER_ADMIN receives one report per client
 * CLIENT_ADMIN only receives their client's report
 */
export async function sendAllWeeklyReports(): Promise<void> {
  try {
    // Get all active clients
    const allClients = await db
      .select()
      .from(clients)
      .where(eq(clients.isActive, true));

    console.log(`📊 Sending weekly reports for ${allClients.length} client(s)...`);

    const results = [];
    
    for (const client of allClients) {
      try {
        await sendWeeklyReport(client.id);
        results.push({ clientId: client.id, companyName: client.companyName, status: 'success' });
      } catch (error) {
        console.error(`❌ Failed to send report for ${client.companyName}:`, error);
        results.push({ 
          clientId: client.id, 
          companyName: client.companyName, 
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'failed').length;

    console.log(`\n✅ Weekly reports complete:`);
    console.log(`   - Successful: ${successful}`);
    console.log(`   - Failed: ${failed}`);
    
    if (failed > 0) {
      console.log(`\n❌ Failed clients:`);
      results.filter(r => r.status === 'failed').forEach(r => {
        console.log(`   - ${r.companyName}: ${r.error}`);
      });
    }

    return;
  } catch (error) {
    console.error('❌ Error in sendAllWeeklyReports:', error);
    throw error;
  }
}

/**
 * Send test report (for development/testing)
 */
export async function sendTestReport(clientId: string, testEmail: string, sentByUserId?: string): Promise<void> {
  try {
    const reportData = await gatherReportData(clientId);

    // Fetch all tasks for this client (not just summary stats)
    const allTasks = await db
      .select()
      .from(clientProjectTasks)
      .where(eq(clientProjectTasks.clientId, clientId));

    // Fetch all active blockers
    const allBlockers = await db
      .select()
      .from(clientProjectBlockers)
      .where(
        and(
          eq(clientProjectBlockers.clientId, clientId),
          eq(clientProjectBlockers.status, 'Active')
        )
      );

    // Calculate dashboard stats
    const completedTasks = allTasks.filter(t => t.status === 'Complete' || t.status === 'Done').length;
    const activeTasks = allTasks.filter(t => t.status !== 'Complete' && t.status !== 'Done').length;
    const progressPercentage = allTasks.length > 0 ? Math.round((completedTasks / allTasks.length) * 100) : 0;

    // Get current phase from project status
    const currentPhaseMetric = await db
      .select()
      .from(clientProjectStatus)
      .where(
        and(
          eq(clientProjectStatus.clientId, clientId),
          eq(clientProjectStatus.metric, 'Current Phase')
        )
      )
      .limit(1);

    const currentPhase = currentPhaseMetric.length > 0 ? currentPhaseMetric[0].value : 'In Progress';

    // Transform data for branded template
    const brandedData = {
      weekOf: reportData.weekOf,
      clientName: reportData.clientName,
      clientId: reportData.clientId,
      tasks: allTasks.map(t => ({
        task: t.task,
        status: t.status,
        priority: t.priority,
        taskType: t.taskType || undefined,
        owner: t.owner || undefined,
        dueDate: t.dueDate || undefined,
      })),
      blockers: allBlockers.map(b => ({
        blocker: b.blocker,
        severity: b.severity,
        actionToResolve: b.actionToResolve || undefined,
        status: b.status,
      })),
      callSummary: reportData.callSummary,
      dashboard: {
        currentPhase,
        progressPercentage,
        totalTasks: allTasks.length,
        completedTasks,
        activeTasks,
        activeBlockers: allBlockers.length,
      },
    };

    const html = generateBrandedReportHTML(brandedData);

    await sendEmail({
      to: testEmail,
      subject: `📊 [TEST] Weekly Project Report - Week of ${reportData.weekOf}`,
      html,
      emailType: 'weekly_report',
      sentByUserId,
      clientId,
      metadata: {
        weekOf: reportData.weekOf,
        clientName: reportData.clientName,
        testMode: true,
      },
    });

    console.log(`✅ Test report sent to ${testEmail}`);
  } catch (error) {
    console.error('❌ Error sending test report:', error);
    throw error;
  }
}

