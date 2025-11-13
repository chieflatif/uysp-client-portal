'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { theme } from '@/theme';
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2, Save, User, Calendar, FileText } from 'lucide-react';

interface Task {
  id: string;
  task: string;
  status: string;
  priority: string;
  owner?: string;
  dueDate?: string;
  notes?: string;
  dependencies?: string;
  createdAt: string;
  updatedAt: string;
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [taskId, setTaskId] = useState<string>('');

  useEffect(() => {
    if (params?.id) {
      setTaskId(params.id as string);
    }
  }, [params]);

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Editable fields
  const [editedTask, setEditedTask] = useState({
    task: '',
    status: '',
    priority: '',
    owner: '',
    dueDate: '',
    notes: '',
    dependencies: '',
  });

  useEffect(() => {
    async function fetchTask() {
      try {
        setLoading(true);
        const clientId = session?.user?.clientId;
        if (!clientId) return;

        const response = await fetch(`/api/clients/${clientId}/project`);
        if (!response.ok) {
          throw new Error('Failed to fetch project data');
        }

        const data = await response.json();
        const allTasks = [
          ...data.taskBoard.critical,
          ...data.taskBoard.high,
          ...data.taskBoard.medium,
          ...data.taskBoard.complete,
        ];

        const foundTask = allTasks.find((t: Task) => t.id === taskId);
        if (!foundTask) {
          throw new Error('Task not found');
        }

        setTask(foundTask);
        setEditedTask({
          task: foundTask.task,
          status: foundTask.status,
          priority: foundTask.priority,
          owner: foundTask.owner || '',
          dueDate: foundTask.dueDate || '',
          notes: foundTask.notes || '',
          dependencies: foundTask.dependencies || '',
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load task');
      } finally {
        setLoading(false);
      }
    }

    if (session && taskId) {
      fetchTask();
    }
  }, [session, taskId]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/project/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedTask),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update task');
      }

      const data = await response.json();
      setTask(data.task);
      setSuccess('Task updated successfully and synced to Airtable!');
    } catch (err: any) {
      setError(err.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${theme.core.darkBg} p-8`}>
        <div className="max-w-4xl mx-auto flex items-center justify-center min-h-96">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error && !task) {
    return (
      <div className={`min-h-screen ${theme.core.darkBg} p-8`}>
        <div className="max-w-4xl mx-auto">
          <Link href="/project-management" className={`flex items-center gap-2 ${theme.accents.tertiary.class} hover:text-cyan-300 mb-6`}>
            <ArrowLeft className="w-4 h-4" />
            Back to Project Management
          </Link>
          <div className="p-4 rounded-lg bg-red-900/20 border border-red-700/50 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!task) return null;

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

  return (
    <div className={`min-h-screen ${theme.core.darkBg} p-8`}>
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={() => router.back()}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition ${theme.components.button.secondary} hover:bg-gray-700`}
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Project Management
        </button>

        {success && (
          <div className="p-4 rounded-lg bg-green-900/20 border border-green-700/50 flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-green-300">{success}</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-red-900/20 border border-red-700/50 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Task Header */}
        <div className={`${theme.components.card} border-l-4 border-l-cyan-400`}>
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={editedTask.task}
                onChange={(e) => setEditedTask({ ...editedTask, task: e.target.value })}
                className="w-full text-3xl font-bold bg-transparent text-white border-none outline-none focus:ring-0 p-0 mb-4"
                placeholder="Task name"
              />
              <div className="flex items-center gap-3">
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${getPriorityColor(editedTask.priority)}`}>
                  {editedTask.priority}
                </span>
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(editedTask.status)}`}>
                  {editedTask.status}
                </span>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${theme.components.button.primary} disabled:opacity-50`}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Edit Form */}
        <div className={theme.components.card}>
          <h2 className={`text-xl font-bold ${theme.core.white} mb-6`}>Task Details</h2>
          
          <div className="space-y-6">
            {/* Status & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${theme.accents.tertiary.class} mb-2`}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Status
                  </div>
                </label>
                <select
                  value={editedTask.status}
                  onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value })}
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
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Priority
                  </div>
                </label>
                <select
                  value={editedTask.priority}
                  onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value })}
                  className={theme.components.input}
                >
                  <option value="🔴 Critical">🔴 Critical</option>
                  <option value="🟠 High">🟠 High</option>
                  <option value="🟡 Medium">🟡 Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            {/* Owner & Due Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${theme.accents.tertiary.class} mb-2`}>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Owner
                  </div>
                </label>
                <input
                  type="text"
                  value={editedTask.owner}
                  onChange={(e) => setEditedTask({ ...editedTask, owner: e.target.value })}
                  className={theme.components.input}
                  placeholder="Assign to..."
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.accents.tertiary.class} mb-2`}>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Due Date
                  </div>
                </label>
                <input
                  type="date"
                  value={editedTask.dueDate ? editedTask.dueDate.split('T')[0] : ''}
                  onChange={(e) => setEditedTask({ ...editedTask, dueDate: e.target.value })}
                  className={theme.components.input}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className={`block text-sm font-medium ${theme.accents.tertiary.class} mb-2`}>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notes
                </div>
              </label>
              <textarea
                value={editedTask.notes}
                onChange={(e) => setEditedTask({ ...editedTask, notes: e.target.value })}
                className={`${theme.components.input} min-h-[120px]`}
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
                value={editedTask.dependencies}
                onChange={(e) => setEditedTask({ ...editedTask, dependencies: e.target.value })}
                className={theme.components.input}
                placeholder="e.g., Task #123, Waiting on client approval"
              />
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className={theme.components.card}>
          <h2 className={`text-xl font-bold ${theme.core.white} mb-4`}>Metadata</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className={`text-xs ${theme.core.bodyText} mb-1`}>Created</p>
              <p className={`${theme.core.white} font-medium`}>
                {new Date(task.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p className={`text-xs ${theme.core.bodyText} mb-1`}>Last Updated</p>
              <p className={`${theme.core.white} font-medium`}>
                {new Date(task.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

