import { useQuery } from '@tanstack/react-query';

export interface ActivityLog {
  id: string;
  timestamp: string; // ISO string from API
  eventType: string;
  category: string;
  description: string;
  messageContent: string | null;
  lead: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  leadAirtableId: string;
  source: string;
}

export interface ActivityLogsResponse {
  activities: ActivityLog[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface UseActivityLogsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  enabled?: boolean;
}

export function useActivityLogs({
  page = 1,
  limit = 50,
  search = '',
  category = '',
  enabled = true,
}: UseActivityLogsParams = {}) {
  return useQuery<ActivityLogsResponse>({
    queryKey: ['activity-logs', { page, limit, search, category }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) {
        params.append('search', search);
      }

      if (category && category !== 'all') {
        params.append('category', category);
      }

      const response = await fetch(`/api/admin/activity-logs?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch activity logs: ${response.statusText}`);
      }

      return response.json();
    },
    enabled,
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchInterval: 60000, // Auto-refresh every 60 seconds
  });
}
