'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useClient } from '@/contexts/ClientContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, ArrowUpDown, AlertCircle, TrendingUp, Clock, Target, RefreshCw, X, Calendar, Plus, Save, Mail, Trash2 } from 'lucide-react';
import { theme } from '@/theme';

interface Task {
  id: string;
  task: string;
  status: string;
  priority: string;
  taskType?: string; // Feature, Bug, Task, Improvement, Documentation, Research
  owner?: string;
  dueDate?: string;
  notes?: string;
  createdAt: string;
}

interface Blocker {
  id: string;
  blocker: string;
  severity: string;
  actionToResolve?: string;
  status: string;
}

interface ProjectData {
  overview: {
    currentPhase: string;
    progressPercentage: number;
    totalTasks: number;
    completedTasks: number;
    activeTasks: number;
    activeBlockers: number;
  };
  taskBoard: {
    critical: Task[];
    high: Task[];
    medium: Task[];
    complete: Task[];
  };
  blockers: Blocker[];
}

type SortField = 'task' | 'priority' | 'taskType' | 'status' | 'owner' | 'dueDate';
type SortDirection = 'asc' | 'desc';
type FilterType = 'all' | 'critical' | 'high' | 'medium' | 'blocked' | 'complete' | 'feature' | 'bug' | 'improvement';

interface CallSummary {
  id: string;
  callDate: string | null;
  executiveSummary: string;
  topPriorities: string;
  keyDecisions: string;
  blockersDiscussed: string;
  nextSteps: string;
  attendees: string;
  callRecordingUrl: string | null;
}

export default function ProjectManagementPage() {
  const { data: session, status: authStatus } = useSession();
  const { selectedClientId } = useClient();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [callHistory, setCallHistory] = useState<CallSummary[]>([]);
  const [showCallHistory, setShowCallHistory] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortField, setSortField] = useState<SortField>('priority');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    task: '',
    status: 'Not Started',
    priority: '🟡 Medium',
    taskType: 'Task',
    owner: '',
    dueDate: '',
    notes: '',
    dependencies: '',
  });
  const [creatingTask, setCreatingTask] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);
  const [syncCooldown, setSyncCooldown] = useState<number>(0);

  // React Query: Fetch project data with aggressive caching for instant navigation
  const { data: projectData, isLoading: loading, error: projectError, isFetching } = useQuery({
    queryKey: ['project', selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) throw new Error('No client selected');
      const response = await fetch(`/api/clients/${selectedClientId}/project`);
      if (!response.ok) throw new Error('Failed to fetch project data');
      return response.json() as Promise<ProjectData>;
    },
    enabled: !!selectedClientId,
    // Use global defaults (5 min stale, 10 min cache)
  });

  // React Query: Fetch call summary with caching
  const { data: callSummaryData } = useQuery({
    queryKey: ['callSummary', selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return null;
      const response = await fetch(`/api/clients/${selectedClientId}/call-summary`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.summary as CallSummary | null;
    },
    enabled: !!selectedClientId,
    // Use global defaults (5 min stale, 10 min cache)
  });

  const callSummary = callSummaryData || null;
  const error = projectError ? (projectError as Error).message : null;

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login');
    }
  }, [authStatus, router]);

  // Combine all tasks into one array
  const allTasks = useMemo(() => {
    if (!projectData) return [];
    return [
      ...projectData.taskBoard.critical,
      ...projectData.taskBoard.high,
      ...projectData.taskBoard.medium,
      ...projectData.taskBoard.complete,
    ];
  }, [projectData]);

  // Filter, search, and sort tasks
  const processedTasks = useMemo(() => {
    let filtered = allTasks;

    // Apply filter
    if (filter === 'critical') filtered = filtered.filter(t => t.priority === '🔴 Critical');
    else if (filter === 'high') filtered = filtered.filter(t => t.priority === '🟠 High');
    else if (filter === 'medium') filtered = filtered.filter(t => t.priority === '🟡 Medium');
    else if (filter === 'blocked') filtered = filtered.filter(t => t.status === 'Blocked');
    else if (filter === 'complete') filtered = filtered.filter(t => t.status === 'Complete');
    else if (filter === 'feature') filtered = filtered.filter(t => t.taskType === 'Feature');
    else if (filter === 'bug') filtered = filtered.filter(t => t.taskType === 'Bug');
    else if (filter === 'improvement') filtered = filtered.filter(t => t.taskType === 'Improvement');

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.task.toLowerCase().includes(query) ||
        (task.owner?.toLowerCase() || '').includes(query) ||
        (task.notes?.toLowerCase() || '').includes(query) ||
        task.status.toLowerCase().includes(query)
      );
    }

    // Apply sort
    const sorted = [...filtered].sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortField) {
        case 'task':
          aVal = a.task.toLowerCase();
          bVal = b.task.toLowerCase();
          break;
        case 'priority':
          const priorityOrder = { '🔴 Critical': 4, '🟠 High': 3, '🟡 Medium': 2, 'Low': 1 };
          aVal = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bVal = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          break;
        case 'taskType':
          aVal = (a.taskType || 'Task').toLowerCase();
          bVal = (b.taskType || 'Task').toLowerCase();
          break;
        case 'status':
          aVal = a.status.toLowerCase();
          bVal = b.status.toLowerCase();
          break;
        case 'owner':
          aVal = (a.owner || '').toLowerCase();
          bVal = (b.owner || '').toLowerCase();
          break;
        case 'dueDate':
          aVal = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          bVal = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          break;
        default:
          aVal = a.priority;
          bVal = b.priority;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [allTasks, filter, searchQuery, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-30" />;
    return <ArrowUpDown className={`h-3 w-3 ml-1 ${theme.accents.tertiary.class}`} />;
  };

  const getPriorityColor = (priority: string) => {
    if (priority === '🔴 Critical') return 'bg-pink-700 text-white';
    if (priority === '🟠 High') return 'bg-orange-600 text-white';
    if (priority === '🟡 Medium') return 'bg-indigo-600 text-white';
    return 'bg-gray-700 text-gray-300';
  };

  const getStatusColor = (status: string) => {
    if (status === 'Complete') return 'bg-green-600 text-white';
    if (status === 'In Progress') return 'bg-cyan-600 text-white';
    if (status === 'Blocked') return 'bg-red-600 text-white';
    return 'bg-gray-700 text-gray-300';
  };

  const getTaskTypeConfig = (taskType: string = 'Task') => {
    const types: Record<string, { icon: string; color: string }> = {
      'Feature': { icon: '✨', color: 'bg-purple-900/30 text-purple-400 border-purple-700' },
      'Bug': { icon: '🐛', color: 'bg-red-900/30 text-red-400 border-red-700' },
      'Task': { icon: '📋', color: 'bg-blue-900/30 text-blue-400 border-blue-700' },
      'Improvement': { icon: '⚡', color: 'bg-yellow-900/30 text-yellow-400 border-yellow-700' },
      'Documentation': { icon: '📚', color: 'bg-green-900/30 text-green-400 border-green-700' },
      'Research': { icon: '🔬', color: 'bg-cyan-900/30 text-cyan-400 border-cyan-700' },
    };
    return types[taskType] || types['Task'];
  };

  const handleQuickUpdate = async (taskId: string, field: 'owner' | 'dueDate' | 'status' | 'priority' | 'taskType', value: string) => {
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;

    // OPTIMISTIC UPDATE - Update React Query cache IMMEDIATELY
    queryClient.setQueryData(['project', selectedClientId], (old: ProjectData | undefined) => {
      if (!old) return old;

      const updateTask = (tasks: Task[]) =>
        tasks.map(t => t.id === taskId
          ? { ...t, [field]: field === 'dueDate' ? value : value || null }
          : t
        );

      return {
        ...old,
        taskBoard: {
          critical: updateTask(old.taskBoard.critical),
          high: updateTask(old.taskBoard.high),
          medium: updateTask(old.taskBoard.medium),
          complete: updateTask(old.taskBoard.complete),
        }
      };
    });
    setEditingTask(null);

    // BACKGROUND SYNC - Don't wait for this
    fetch(`/api/project/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: task.task,
        status: field === 'status' ? value : task.status,
        priority: field === 'priority' ? value : task.priority,
        taskType: field === 'taskType' ? value : (task.taskType || 'Task'),
        owner: field === 'owner' ? value : task.owner,
        dueDate: field === 'dueDate' ? value : task.dueDate,
        notes: task.notes,
      }),
    }).catch(err => {
      console.error('Background sync failed:', err);
      // Revert on error - invalidate cache to refetch
      queryClient.invalidateQueries({ queryKey: ['project', selectedClientId] });
    });
  };

  // Sync cooldown effect - countdown timer
  useEffect(() => {
    if (syncCooldown > 0) {
      const timer = setTimeout(() => {
        setSyncCooldown(syncCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [syncCooldown]);

  const handleSync = async () => {
    if (!selectedClientId) return;

    // Check cooldown period (30 seconds since last sync)
    const now = Date.now();
    const timeSinceLastSync = now - lastSyncTime;
    const COOLDOWN_PERIOD = 30000; // 30 seconds

    if (timeSinceLastSync < COOLDOWN_PERIOD) {
      const remainingSeconds = Math.ceil((COOLDOWN_PERIOD - timeSinceLastSync) / 1000);
      alert(`Please wait ${remainingSeconds} seconds before syncing again. This prevents data loss from overwriting recent updates.`);
      return;
    }

    try {
      setSyncing(true);
      setLastSyncTime(now);
      setSyncCooldown(30); // Start 30 second countdown

      const response = await fetch(`/api/admin/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: selectedClientId }),
      });

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      // Invalidate and refetch React Query cache
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['project', selectedClientId] }),
        queryClient.invalidateQueries({ queryKey: ['callSummary', selectedClientId] }),
      ]);

      alert('Sync completed successfully!');
    } catch (err) {
      console.error('Sync error:', err);
      alert('Sync failed. Check console for details.');
    } finally {
      setSyncing(false);
    }
  };

  const fetchCallHistory = async () => {
    if (!selectedClientId) return;

    try {
      const response = await fetch(`/api/clients/${selectedClientId}/call-history`);
      if (response.ok) {
        const data = await response.json();
        setCallHistory(data.callHistory || []);
        setShowCallHistory(true);
      }
    } catch (err) {
      console.error('Failed to fetch call history:', err);
      alert('Failed to load call history');
    }
  };

  const handleCreateTask = async () => {
    if (!selectedClientId || !newTask.task.trim()) {
      alert('Task name is required');
      return;
    }

    try {
      setCreatingTask(true);
      const response = await fetch(`/api/clients/${selectedClientId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      // Reset form
      setNewTask({
        task: '',
        status: 'Not Started',
        priority: '🟡 Medium',
        taskType: 'Task',
        owner: '',
        dueDate: '',
        notes: '',
        dependencies: '',
      });
      setShowNewTaskModal(false);

      // Invalidate React Query cache to refetch fresh data
      await queryClient.invalidateQueries({ queryKey: ['project', selectedClientId] });

      alert('Task created successfully!');
    } catch (err) {
      console.error('Failed to create task:', err);
      alert('Failed to create task. Please try again.');
    } finally {
      setCreatingTask(false);
    }
  };

  const handleSendWeeklyReport = async () => {
    if (!selectedClientId) return;

    const confirmed = confirm('Send weekly project report to all administrators?');
    if (!confirmed) return;

    try {
      setSendingReport(true);
      const response = await fetch(`/api/reports/weekly?clientId=${selectedClientId}&test=true`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send report');
      }

      const data = await response.json();
      alert(data.message || 'Weekly report sent successfully!');
    } catch (err) {
      console.error('Failed to send report:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send report. Please try again.';
      alert(errorMessage);
    } finally {
      setSendingReport(false);
    }
  };

  const handleDeleteTask = async (taskId: string, taskName: string) => {
    const confirmed = confirm(`Are you sure you want to delete "${taskName}"?\n\nThis will delete the task from both the database and Airtable.`);
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/project/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete task');
      }

      // Invalidate React Query cache to refetch
      await queryClient.invalidateQueries({ queryKey: ['project', selectedClientId] });

      alert('Task deleted successfully!');
    } catch (err) {
      console.error('Failed to delete task:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete task. Please try again.';
      alert(errorMessage);
    }
  };

  // Only show loading screen if there's no data AND we're loading (first load)
  if (loading && !projectData) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${theme.core.darkBg}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400" />
          <p className={`${theme.core.bodyText} text-sm`}>Loading project data...</p>
        </div>
      </div>
    );
  }

  if (error || !projectData) {
    return (
      <div className={`min-h-screen ${theme.core.darkBg} p-8`}>
        <div className="max-w-4xl mx-auto">
          <div className="p-6 rounded-lg bg-yellow-900/20 border border-yellow-700/50 flex gap-4">
            <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-white mb-2">No Project Data Yet</h3>
              <p className={theme.core.bodyText}>
                The project management tables haven't been synced yet. Go to <strong>Admin → UYSP Client → Overview → Sync Data</strong> to populate this dashboard.
              </p>
              {error && <p className="text-sm text-red-400 mt-2">Error: {error}</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { overview, blockers } = projectData;

  return (
    <div className={`min-h-screen ${theme.core.darkBg} p-8`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-4xl font-bold ${theme.core.white} mb-2`}>
              Project <span className={theme.accents.secondary.class}>Management</span>
            </h1>
            <p className={theme.core.bodyText}>
              Track tasks, blockers, and project progress
            </p>
          </div>
          <div className="flex items-center gap-4">
            {isFetching && !loading && (
              <div className="flex items-center gap-2 text-sm text-cyan-400">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Updating...</span>
              </div>
            )}
            {/* SECURITY: Only show Send Report button to admins */}
            {session?.user && (session.user.role === 'CLIENT_ADMIN' || session.user.role === 'SUPER_ADMIN') && (
              <button
                onClick={handleSendWeeklyReport}
                disabled={sendingReport}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                  sendingReport
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white'
                }`}
                title="Send weekly project report to administrators"
              >
                <Mail className="w-4 h-4" />
                {sendingReport ? 'Sending...' : 'Send Report'}
              </button>
            )}
            <div className={`text-right ${theme.core.bodyText}`}>
              <p className="text-sm font-semibold">
                {processedTasks.length} tasks
                {searchQuery && ` matching "${searchQuery}"`}
              </p>
            </div>
          </div>
        </div>

        {/* Latest Project Call Summary */}
        {callSummary && (
          <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border-2 border-indigo-600/50 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center">
                  <span className="text-2xl">📞</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3 gap-4">
                  <div className="flex-1">
                    <h2 className={`text-2xl font-bold ${theme.core.white} mb-1`}>
                      Latest Project Call
                    </h2>
                    {callSummary.callDate && (
                      <span className={`text-sm ${theme.accents.tertiary.class} font-medium`}>
                        {new Date(callSummary.callDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={fetchCallHistory}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition bg-indigo-600 hover:bg-indigo-500 text-white text-sm whitespace-nowrap shadow-lg`}
                  >
                    📋 View History
                  </button>
                </div>

                {callSummary.attendees && (
                  <p className={`text-sm ${theme.core.bodyText} mb-3`}>
                    <span className="font-semibold">Attendees:</span> {callSummary.attendees}
                  </p>
                )}

                {callSummary.executiveSummary && (
                  <p className={`${theme.core.white} leading-relaxed mb-4`}>
                    {callSummary.executiveSummary}
                  </p>
                )}

                {callSummary.topPriorities && (
                  <div className="mb-4">
                    <h3 className={`text-lg font-bold ${theme.accents.tertiary.class} mb-2`}>
                      TOP PRIORITIES:
                    </h3>
                    <div className={`${theme.core.white} whitespace-pre-line`}>
                      {callSummary.topPriorities.split('\n').map((line, idx) => (
                        line.trim() && <div key={idx} className="mb-1">{line}</div>
                      ))}
                    </div>
                  </div>
                )}

                {callSummary.callRecordingUrl && (
                  <div className="mt-6">
                    <a
                      href={callSummary.callRecordingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${theme.components.button.secondary} hover:bg-gray-700 text-base`}
                    >
                      🎥 View Call Recording
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`${theme.components.card} border-l-4 border-l-indigo-600`}>
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-indigo-600" />
              <p className="text-xs text-gray-400 uppercase font-semibold">Current Phase</p>
            </div>
            <p className="text-xl font-bold text-white">{overview.currentPhase}</p>
          </div>
          <div className={`${theme.components.card} border-l-4 border-l-cyan-400`}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <p className="text-xs text-gray-400 uppercase font-semibold">Progress</p>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <p className="text-xl font-bold text-white">{overview.progressPercentage}%</p>
              <p className="text-xs text-gray-400">({overview.completedTasks}/{overview.totalTasks})</p>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div
                className="bg-gradient-to-r from-pink-700 via-indigo-600 to-cyan-400 h-1.5 rounded-full transition-all"
                style={{ width: `${overview.progressPercentage}%` }}
              />
            </div>
          </div>
          <div className={`${theme.components.card} border-l-4 border-l-indigo-600`}>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <p className="text-xs text-gray-400 uppercase font-semibold">Active Tasks</p>
            </div>
            <p className="text-xl font-bold text-white">{overview.activeTasks}</p>
          </div>
          <div className={`${theme.components.card} border-l-4 border-l-pink-700`}>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-pink-700" />
              <p className="text-xs text-gray-400 uppercase font-semibold">Active Blockers</p>
            </div>
            <p className="text-xl font-bold text-white">{overview.activeBlockers}</p>
          </div>
        </div>

        {/* Active Blockers Alert */}
        {blockers.length > 0 && (
          <div className="bg-pink-700/10 border-2 border-pink-700/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-pink-700 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-pink-700 font-bold text-lg mb-2">
                  {blockers.length} Active Blocker{blockers.length !== 1 ? 's' : ''}
                </h3>
                <div className="space-y-2">
                  {blockers.map(blocker => (
                    <div key={blocker.id} className="bg-gray-900/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${getPriorityColor(blocker.severity)}`}>
                          {blocker.severity}
                        </span>
                        <span className="text-white font-medium">{blocker.blocker}</span>
                      </div>
                      {blocker.actionToResolve && (
                        <p className="text-gray-300 text-sm mt-1">
                          <span className="text-cyan-400 font-medium">Action: </span>
                          {blocker.actionToResolve}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${theme.core.bodyText}`} />
            <input
              type="text"
              placeholder="Search tasks by name, owner, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${theme.components.input} w-full pl-10`}
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={`text-sm ${theme.accents.tertiary.class} hover:text-cyan-300`}
            >
              Clear search
            </button>
          )}
        </div>

        {/* Filter Buttons + Action Buttons */}
        <div className="flex justify-between items-center gap-3 flex-wrap">
          {/* Filter Buttons on Left */}
          <div className="flex gap-3 flex-wrap">
            {[
              { key: 'all', label: 'All Tasks', color: 'cyan-400' },
              { key: 'critical', label: '🔴 Critical', color: 'pink-700' },
              { key: 'high', label: '🟠 High', color: 'orange-600' },
              { key: 'medium', label: '🟡 Medium', color: 'indigo-600' },
              { key: 'blocked', label: 'Blocked', color: 'red-600' },
              { key: 'complete', label: '✅ Complete', color: 'green-600' },
              { key: 'feature', label: '✨ Feature', color: 'purple-600' },
              { key: 'bug', label: '🐛 Bug', color: 'red-600' },
              { key: 'improvement', label: '⚡ Improvement', color: 'yellow-600' },
            ].map(({ key, label, color }) => (
              <button
                key={key}
                onClick={() => setFilter(key as FilterType)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  filter === key
                    ? `bg-${color} text-white`
                    : `bg-gray-800 ${theme.core.bodyText} hover:bg-gray-700`
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Action Buttons on Right */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNewTaskModal(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${theme.components.button.primary}`}
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
            <button
              onClick={handleSync}
              disabled={syncing || syncCooldown > 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${theme.components.button.secondary} hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed`}
              title={syncCooldown > 0 ? `Wait ${syncCooldown}s before syncing again` : 'Sync with Airtable'}
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : syncCooldown > 0 ? `Wait ${syncCooldown}s` : 'Sync'}
            </button>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th 
                  className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition`}
                  onClick={() => handleSort('task')}
                >
                  <div className="flex items-center">
                    Task {getSortIcon('task')}
                  </div>
                </th>
                <th
                  className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition`}
                  onClick={() => handleSort('priority')}
                >
                  <div className="flex items-center">
                    Priority {getSortIcon('priority')}
                  </div>
                </th>
                <th
                  className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition`}
                  onClick={() => handleSort('taskType')}
                >
                  <div className="flex items-center">
                    Type {getSortIcon('taskType')}
                  </div>
                </th>
                <th
                  className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition`}
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Status {getSortIcon('status')}
                  </div>
                </th>
                <th 
                  className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition`}
                  onClick={() => handleSort('owner')}
                >
                  <div className="flex items-center">
                    Owner {getSortIcon('owner')}
                  </div>
                </th>
                <th
                  className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition`}
                  onClick={() => handleSort('dueDate')}
                >
                  <div className="flex items-center">
                    Due Date {getSortIcon('dueDate')}
                  </div>
                </th>
                <th
                  className={`px-6 py-4 text-center text-xs font-semibold ${theme.accents.tertiary.class} uppercase tracking-wider`}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {processedTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className={`px-6 py-12 text-center ${theme.core.bodyText}`}>
                    {searchQuery || filter !== 'all' ? 'No tasks match your filters' : 'No tasks yet'}
                  </td>
                </tr>
              ) : (
                processedTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="hover:bg-gray-700 transition"
                  >
                    {/* Task Name */}
                    <td
                      className="px-6 py-4 cursor-pointer"
                      onClick={() => router.push(`/project-management/tasks/${task.id}`)}
                    >
                      <div className={`font-semibold ${theme.core.white}`}>
                        {task.task}
                      </div>
                      {task.notes && (
                        <div className={`text-xs ${theme.core.bodyText} mt-1 line-clamp-1`}>
                          {task.notes}
                        </div>
                      )}
                    </td>

                    {/* Priority - INLINE EDIT */}
                    <td
                      className="px-6 py-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTask(task.id + '-priority');
                      }}
                    >
                      {editingTask === task.id + '-priority' ? (
                        <select
                          value={task.priority}
                          autoFocus
                          onChange={(e) => {
                            handleQuickUpdate(task.id, 'priority', e.target.value);
                          }}
                          onBlur={() => setEditingTask(null)}
                          className="px-2 py-1 bg-gray-700 text-white rounded border border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-xs font-bold"
                          disabled={saving}
                        >
                          <option value="🔴 Critical">🔴 Critical</option>
                          <option value="🟠 High">🟠 High</option>
                          <option value="🟡 Medium">🟡 Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      ) : (
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold cursor-pointer hover:ring-2 hover:ring-cyan-400 transition ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      )}
                    </td>

                    {/* Task Type - INLINE EDIT */}
                    <td
                      className="px-6 py-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTask(task.id + '-taskType');
                      }}
                    >
                      {editingTask === task.id + '-taskType' ? (
                        <select
                          value={task.taskType || 'Task'}
                          autoFocus
                          onChange={(e) => {
                            handleQuickUpdate(task.id, 'taskType', e.target.value);
                          }}
                          onBlur={() => setEditingTask(null)}
                          className="px-2 py-1 bg-gray-700 text-white rounded border border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-xs font-semibold"
                          disabled={saving}
                        >
                          <option value="Task">📋 Task</option>
                          <option value="Feature">✨ Feature</option>
                          <option value="Bug">🐛 Bug</option>
                          <option value="Improvement">⚡ Improvement</option>
                          <option value="Documentation">📚 Documentation</option>
                          <option value="Research">🔬 Research</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer hover:ring-2 hover:ring-cyan-400 transition border ${getTaskTypeConfig(task.taskType || 'Task').color}`}>
                          <span>{getTaskTypeConfig(task.taskType || 'Task').icon}</span>
                          <span>{task.taskType || 'Task'}</span>
                        </span>
                      )}
                    </td>

                    {/* Status - INLINE EDIT */}
                    <td
                      className="px-6 py-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTask(task.id + '-status');
                      }}
                    >
                      {editingTask === task.id + '-status' ? (
                        <select
                          value={task.status}
                          autoFocus
                          onChange={(e) => {
                            handleQuickUpdate(task.id, 'status', e.target.value);
                          }}
                          onBlur={() => setEditingTask(null)}
                          className="px-2 py-1 bg-gray-700 text-white rounded border border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-xs font-bold"
                          disabled={saving}
                        >
                          <option value="Not Started">Not Started</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Blocked">Blocked</option>
                          <option value="Complete">Complete</option>
                        </select>
                      ) : (
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold cursor-pointer hover:ring-2 hover:ring-cyan-400 transition ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      )}
                    </td>

                    {/* Owner - INLINE EDIT */}
                    <td
                      className="px-6 py-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTask(task.id);
                      }}
                    >
                      {editingTask === task.id ? (
                        <input
                          type="text"
                          defaultValue={task.owner || ''}
                          autoFocus
                          onBlur={(e) => {
                            if (e.target.value !== (task.owner || '')) {
                              handleQuickUpdate(task.id, 'owner', e.target.value);
                            } else {
                              setEditingTask(null);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            } else if (e.key === 'Escape') {
                              setEditingTask(null);
                            }
                          }}
                          className="w-full px-2 py-1 bg-gray-700 text-white rounded border border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                          placeholder="Assign to..."
                          disabled={saving}
                        />
                      ) : (
                        <div className={`${theme.core.white} cursor-pointer hover:text-cyan-400 transition`}>
                          {task.owner || <span className="text-gray-500 italic">Click to assign</span>}
                        </div>
                      )}
                    </td>

                    {/* Due Date - INLINE EDIT */}
                    <td
                      className="px-6 py-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTask(task.id + '-date');
                      }}
                    >
                      {editingTask === task.id + '-date' ? (
                        <input
                          type="date"
                          defaultValue={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                          autoFocus
                          onBlur={(e) => {
                            const newDate = e.target.value;
                            const oldDate = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';
                            if (newDate !== oldDate) {
                              handleQuickUpdate(task.id, 'dueDate', newDate);
                            } else {
                              setEditingTask(null);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            } else if (e.key === 'Escape') {
                              setEditingTask(null);
                            }
                          }}
                          className="w-full px-2 py-1 bg-gray-700 text-white rounded border border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                          disabled={saving}
                        />
                      ) : (
                        <div className={`${theme.core.bodyText} cursor-pointer hover:text-cyan-400 transition`}>
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : <span className="text-gray-500 italic">Click to set</span>}
                        </div>
                      )}
                    </td>

                    {/* Actions - DELETE BUTTON */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(task.id, task.task);
                        }}
                        className="p-2 rounded-lg bg-red-900/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 transition-all"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Stats Footer */}
        <div className="grid grid-cols-4 gap-4 pt-6 border-t border-gray-700">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className={`text-xs ${theme.accents.tertiary.class} font-semibold uppercase mb-1`}>
              Total Tasks
            </p>
            <p className={`text-2xl font-bold ${theme.core.white}`}>
              {allTasks.length}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className={`text-xs ${theme.accents.primary.class} font-semibold uppercase mb-1`}>
              Critical
            </p>
            <p className={`text-2xl font-bold ${theme.core.white}`}>
              {allTasks.filter(t => t.priority === '🔴 Critical').length}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className={`text-xs text-orange-600 font-semibold uppercase mb-1`}>
              Blocked
            </p>
            <p className={`text-2xl font-bold ${theme.core.white}`}>
              {allTasks.filter(t => t.status === 'Blocked').length}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className={`text-xs text-green-600 font-semibold uppercase mb-1`}>
              Completed
            </p>
            <p className={`text-2xl font-bold ${theme.core.white}`}>
              {overview.completedTasks}
            </p>
          </div>
        </div>
      </div>

      {/* Call History Modal */}
      {showCallHistory && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-2xl border-2 border-gray-700 max-w-5xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className={`text-2xl font-bold ${theme.core.white}`}>
                Call History
              </h2>
              <button
                onClick={() => setShowCallHistory(false)}
                className="p-2 hover:bg-gray-700 rounded-lg transition"
              >
                <X className={`w-6 h-6 ${theme.core.bodyText} hover:text-white`} />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {callHistory.length === 0 ? (
                <div className="text-center py-12">
                  <p className={theme.core.bodyText}>No call history found</p>
                </div>
              ) : (
                callHistory.map((call, index) => (
                  <div
                    key={call.id}
                    className={`p-6 rounded-lg border-2 transition hover:border-indigo-600/70 ${
                      index === 0
                        ? 'bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border-indigo-600/50'
                        : 'bg-gray-900/50 border-gray-700'
                    }`}
                  >
                    {/* Call Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Calendar className={`w-5 h-5 ${theme.accents.tertiary.class}`} />
                        {call.callDate && (
                          <span className={`text-lg font-bold ${theme.core.white}`}>
                            {new Date(call.callDate).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        )}
                      </div>
                      {index === 0 && (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${theme.accents.tertiary.class} bg-cyan-400/10 border border-cyan-400/30`}>
                          LATEST
                        </span>
                      )}
                    </div>

                    {/* Attendees */}
                    {call.attendees && (
                      <p className={`text-sm ${theme.core.bodyText} mb-4`}>
                        <span className="font-semibold">Attendees:</span> {call.attendees}
                      </p>
                    )}

                    {/* Executive Summary */}
                    {call.executiveSummary && (
                      <div className="mb-4">
                        <h3 className={`text-sm font-bold ${theme.accents.tertiary.class} uppercase mb-2`}>
                          Executive Summary
                        </h3>
                        <p className={`${theme.core.white} leading-relaxed`}>
                          {call.executiveSummary}
                        </p>
                      </div>
                    )}

                    {/* Top Priorities */}
                    {call.topPriorities && (
                      <div className="mb-4">
                        <h3 className={`text-sm font-bold ${theme.accents.tertiary.class} uppercase mb-2`}>
                          Top Priorities
                        </h3>
                        <div className={`${theme.core.white} whitespace-pre-line text-sm`}>
                          {call.topPriorities.split('\n').map((line, idx) => (
                            line.trim() && <div key={idx} className="mb-1">{line}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Key Decisions */}
                    {call.keyDecisions && (
                      <div className="mb-4">
                        <h3 className={`text-sm font-bold ${theme.accents.tertiary.class} uppercase mb-2`}>
                          Key Decisions
                        </h3>
                        <div className={`${theme.core.white} whitespace-pre-line text-sm`}>
                          {call.keyDecisions.split('\n').map((line, idx) => (
                            line.trim() && <div key={idx} className="mb-1">{line}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Blockers Discussed */}
                    {call.blockersDiscussed && (
                      <div className="mb-4">
                        <h3 className={`text-sm font-bold text-pink-700 uppercase mb-2`}>
                          Blockers Discussed
                        </h3>
                        <div className={`${theme.core.white} whitespace-pre-line text-sm`}>
                          {call.blockersDiscussed.split('\n').map((line, idx) => (
                            line.trim() && <div key={idx} className="mb-1">{line}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Next Steps */}
                    {call.nextSteps && (
                      <div className="mb-4">
                        <h3 className={`text-sm font-bold ${theme.accents.tertiary.class} uppercase mb-2`}>
                          Next Steps
                        </h3>
                        <div className={`${theme.core.white} whitespace-pre-line text-sm`}>
                          {call.nextSteps.split('\n').map((line, idx) => (
                            line.trim() && <div key={idx} className="mb-1">{line}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Call Recording Link */}
                    {call.callRecordingUrl && (
                      <a
                        href={call.callRecordingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-2 text-sm ${theme.accents.tertiary.class} hover:text-cyan-300 font-medium transition`}
                      >
                        🎥 View Call Recording →
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-700 flex justify-end">
              <button
                onClick={() => setShowCallHistory(false)}
                className={`px-6 py-3 rounded-lg font-semibold transition ${theme.components.button.secondary} hover:bg-gray-700`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-2xl border-2 border-gray-700 max-w-2xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className={`text-2xl font-bold ${theme.core.white}`}>
                Create New Task
              </h2>
              <button
                onClick={() => setShowNewTaskModal(false)}
                className="p-2 hover:bg-gray-700 rounded-lg transition"
              >
                <X className={`w-6 h-6 ${theme.core.bodyText} hover:text-white`} />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Task Name */}
              <div>
                <label className={`block text-sm font-medium ${theme.accents.tertiary.class} mb-2`}>
                  Task Name *
                </label>
                <input
                  type="text"
                  value={newTask.task}
                  onChange={(e) => setNewTask({ ...newTask, task: e.target.value })}
                  className={theme.components.input}
                  placeholder="e.g., Complete API integration"
                  autoFocus
                />
              </div>

              {/* Status & Priority & Type */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${theme.accents.tertiary.class} mb-2`}>
                    Status
                  </label>
                  <select
                    value={newTask.status}
                    onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                    className={theme.components.input}
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Blocked">Blocked</option>
                    <option value="Complete">Complete</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${theme.accents.tertiary.class} mb-2`}>
                    Priority
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className={theme.components.input}
                  >
                    <option value="🔴 Critical">🔴 Critical</option>
                    <option value="🟠 High">🟠 High</option>
                    <option value="🟡 Medium">🟡 Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${theme.accents.tertiary.class} mb-2`}>
                    Type
                  </label>
                  <select
                    value={newTask.taskType}
                    onChange={(e) => setNewTask({ ...newTask, taskType: e.target.value })}
                    className={theme.components.input}
                  >
                    <option value="Task">📋 Task</option>
                    <option value="Feature">✨ Feature</option>
                    <option value="Bug">🐛 Bug</option>
                    <option value="Improvement">⚡ Improvement</option>
                    <option value="Documentation">📚 Documentation</option>
                    <option value="Research">🔬 Research</option>
                  </select>
                </div>
              </div>

              {/* Owner & Due Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${theme.accents.tertiary.class} mb-2`}>
                    Owner
                  </label>
                  <input
                    type="text"
                    value={newTask.owner}
                    onChange={(e) => setNewTask({ ...newTask, owner: e.target.value })}
                    className={theme.components.input}
                    placeholder="Assign to..."
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${theme.accents.tertiary.class} mb-2`}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className={theme.components.input}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className={`block text-sm font-medium ${theme.accents.tertiary.class} mb-2`}>
                  Notes
                </label>
                <textarea
                  value={newTask.notes}
                  onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                  className={`${theme.components.input} min-h-[100px]`}
                  placeholder="Add notes or details about this task..."
                />
              </div>

              {/* Dependencies */}
              <div>
                <label className={`block text-sm font-medium ${theme.accents.tertiary.class} mb-2`}>
                  Dependencies
                </label>
                <input
                  type="text"
                  value={newTask.dependencies}
                  onChange={(e) => setNewTask({ ...newTask, dependencies: e.target.value })}
                  className={theme.components.input}
                  placeholder="e.g., Task #123, Waiting on client approval"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowNewTaskModal(false)}
                className={`px-6 py-3 rounded-lg font-semibold transition ${theme.components.button.secondary} hover:bg-gray-700`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTask}
                disabled={creatingTask || !newTask.task.trim()}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${theme.components.button.primary} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {creatingTask ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Create Task
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
