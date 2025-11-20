'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Clock, Target, TrendingUp, Loader2 } from 'lucide-react';
import { theme } from '@/theme';

interface Task {
  id: string;
  task: string;
  status: string;
  priority: string;
  owner?: string;
  dueDate?: string;
  notes?: string;
}

interface Blocker {
  id: string;
  blocker: string;
  severity: string;
  actionToResolve?: string;
  createdAt: string;
}

interface Milestone {
  id: string;
  milestone: string;
  value: string;
  displayOrder?: number;
}

interface ProjectData {
  client: {
    id: string;
    companyName: string;
  };
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
  milestones: Milestone[];
}

export default function ProjectManagementEmbed({ clientId }: { clientId: string }) {
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjectData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/clients/${clientId}/project`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch project data');
        }

        const data = (await response.json()) as ProjectData;
        setProjectData(data);
        setError(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load project data';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    if (clientId) {
      fetchProjectData();
    }
  }, [clientId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className={`${theme.core.bodyText} text-sm`}>Loading project data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className={theme.components.card} style={{ maxWidth: '600px' }}>
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
            <div>
              <h3 className={`text-lg font-bold ${theme.core.white} mb-2`}>
                No Project Data Yet
              </h3>
              <p className={`${theme.core.bodyText} mb-4`}>
                The project management tables haven&rsquo;t been synced yet. Run a data sync to populate this dashboard.
              </p>
              <p className={`${theme.core.bodyText} text-sm`}>
                Error: {error}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className={`${theme.core.bodyText}`}>No project data available</p>
      </div>
    );
  }

  const { overview, taskBoard, blockers, milestones } = projectData;

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Current Phase */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className={`${theme.components.card} border-l-4 border-l-indigo-600`}
        >
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-5 h-5 text-indigo-600" />
            <h3 className="text-gray-400 text-sm font-medium">Current Phase</h3>
          </div>
          <p className="text-white text-xl font-bold">{overview.currentPhase}</p>
        </motion.div>

        {/* Progress */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className={`${theme.components.card} border-l-4 border-l-cyan-400`}
        >
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h3 className="text-gray-400 text-sm font-medium">Progress</h3>
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <p className="text-white text-xl font-bold">{overview.progressPercentage}%</p>
            <p className="text-gray-400 text-xs">
              ({overview.completedTasks}/{overview.totalTasks} tasks)
            </p>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-pink-700 via-indigo-600 to-cyan-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${overview.progressPercentage}%` }}
            />
          </div>
        </motion.div>

        {/* Active Tasks */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className={`${theme.components.card} border-l-4 border-l-indigo-600`}
        >
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h3 className="text-gray-400 text-sm font-medium">Active Tasks</h3>
          </div>
          <p className="text-white text-xl font-bold">{overview.activeTasks}</p>
        </motion.div>

        {/* Active Blockers */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className={`${theme.components.card} border-l-4 border-l-pink-700`}
        >
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-5 h-5 text-pink-700" />
            <h3 className="text-gray-400 text-sm font-medium">Active Blockers</h3>
          </div>
          <p className="text-white text-xl font-bold">{overview.activeBlockers}</p>
        </motion.div>
      </div>

      {/* Active Blockers Section */}
      {blockers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-pink-700" />
            <h2 className="text-2xl font-bold text-white">Active Blockers</h2>
          </div>
          <div className="space-y-3">
            {blockers.map((blocker, index) => (
              <motion.div
                key={blocker.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="bg-pink-700/10 border border-pink-700/30 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        blocker.severity === '🔴 Critical' ? 'bg-pink-700 text-white' :
                        blocker.severity === '🟠 High' ? 'bg-orange-600 text-white' :
                        'bg-yellow-600 text-white'
                      }`}>
                        {blocker.severity}
                      </span>
                    </div>
                    <h3 className="text-white font-medium mb-1">{blocker.blocker}</h3>
                    {blocker.actionToResolve && (
                      <p className="text-gray-300 text-sm mt-2">
                        <span className="text-cyan-400 font-medium">Action: </span>
                        {blocker.actionToResolve}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Kanban Board */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle2 className="w-6 h-6 text-cyan-400" />
          <h2 className="text-2xl font-bold text-white">Task Board</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <TaskColumn title="Critical" tasks={taskBoard.critical} icon="🔴" delay={0.7} />
          <TaskColumn title="High" tasks={taskBoard.high} icon="🟠" delay={0.8} />
          <TaskColumn title="Medium" tasks={taskBoard.medium} icon="🟡" delay={0.9} />
          <TaskColumn title="Complete" tasks={taskBoard.complete} icon="✅" delay={1.0} />
        </div>
      </motion.div>

      {/* Milestones */}
      {milestones.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-white">Milestones</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 + index * 0.1 }}
                className="bg-gray-800 border border-indigo-600/30 rounded-lg p-4"
              >
                <h3 className="text-indigo-600 font-medium mb-1">{milestone.milestone}</h3>
                <p className="text-white text-sm">{milestone.value}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function TaskColumn({ title, tasks, icon, delay }: { 
  title: string; 
  tasks: Task[]; 
  icon: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-gray-800 rounded-lg p-4 border border-gray-700"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{icon}</span>
        <h3 className="text-white font-bold">{title}</h3>
        <span className="ml-auto text-gray-400 text-sm">({tasks.length})</span>
      </div>
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {tasks.map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + 0.1 + index * 0.05 }}
            className="bg-gray-900 rounded-lg p-3 border border-gray-700 hover:border-cyan-400 transition-colors cursor-pointer"
          >
            <p className="text-white text-sm font-medium mb-2">{task.task}</p>
            {task.owner && (
              <p className="text-gray-400 text-xs mb-1">
                👤 {task.owner}
              </p>
            )}
            {task.notes && (
              <p className="text-gray-500 text-xs mt-2 italic line-clamp-2">
                {task.notes}
              </p>
            )}
          </motion.div>
        ))}
        {tasks.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">No tasks</p>
        )}
      </div>
    </motion.div>
  );
}

