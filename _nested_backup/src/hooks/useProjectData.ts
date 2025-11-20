import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

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

interface Blocker {
  id: string;
  blocker: string;
  severity: string;
  status: string;
  actionToResolve?: string;
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

export function useProjectData(clientId?: string) {
  return useQuery({
    queryKey: ['project', clientId],
    queryFn: async () => {
      if (!clientId) throw new Error('No client ID');
      const response = await fetch(`/api/clients/${clientId}/project`);
      if (!response.ok) throw new Error('Failed to fetch project data');
      return response.json() as Promise<ProjectData>;
    },
    enabled: !!clientId,
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async ({
      taskId,
      updates,
    }: {
      taskId: string;
      updates: Partial<Task>;
    }) => {
      const response = await fetch(`/api/project/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update task');
      return response.json();
    },
    onMutate: async ({ taskId, updates }) => {
      const clientId = session?.user?.clientId;
      if (!clientId) return;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['project', clientId] });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<ProjectData>([
        'project',
        clientId,
      ]);

      // Optimistically update
      queryClient.setQueryData<ProjectData>(['project', clientId], (old) => {
        if (!old) return old;

        const updateTask = (tasks: Task[]) =>
          tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t));

        return {
          ...old,
          taskBoard: {
            critical: updateTask(old.taskBoard.critical),
            high: updateTask(old.taskBoard.high),
            medium: updateTask(old.taskBoard.medium),
            complete: updateTask(old.taskBoard.complete),
          },
        };
      });

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      // Revert on error
      const clientId = session?.user?.clientId;
      if (clientId && context?.previousData) {
        queryClient.setQueryData(['project', clientId], context.previousData);
      }
    },
  });
}

export function useLeadsData() {
  return useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const response = await fetch('/api/leads');
      if (!response.ok) throw new Error('Failed to fetch leads');
      const data = await response.json();
      return data.leads || [];
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}
