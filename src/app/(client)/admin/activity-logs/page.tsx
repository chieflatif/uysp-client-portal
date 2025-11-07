'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Activity, Search, Filter, Download, RefreshCw, Clock, User, MessageSquare } from 'lucide-react';
import { useActivityLogs } from '@/hooks/useActivityLogs';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function ActivityLogsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get URL params or defaults
  const pageFromUrl = parseInt(searchParams.get('page') || '1', 10);
  const categoryFromUrl = searchParams.get('category') || 'all';
  const searchFromUrl = searchParams.get('search') || '';

  // Local state
  const [searchTerm, setSearchTerm] = useState(searchFromUrl);
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl);
  const [page, setPage] = useState(pageFromUrl);

  // Debounce search term for API calls (300ms delay)
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Authorization check
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';

  // Fetch activities with React Query
  const { data, isLoading, error, refetch } = useActivityLogs({
    page,
    limit: 50,
    search: debouncedSearch,
    category: selectedCategory === 'all' ? '' : selectedCategory,
    enabled: isAdmin, // Only fetch if user is admin
  });

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', page.toString());
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (searchTerm) params.set('search', searchTerm);

    const newUrl = `/admin/activity-logs${params.toString() ? `?${params.toString()}` : ''}`;
    router.replace(newUrl, { scroll: false });
  }, [page, selectedCategory, searchTerm, router]);

  // Get category counts from pagination metadata
  const categoryCounts = useMemo(() => {
    // Note: API doesn't return category counts in current implementation
    // This would need to be added to the API response for accurate counts
    // For now, show total count for selected category
    return {
      all: data?.pagination.totalCount || 0,
      [selectedCategory]: data?.pagination.totalCount || 0,
    };
  }, [data?.pagination.totalCount, selectedCategory]);

  // Handle category filter change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setPage(1); // Reset to page 1 when filter changes
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Authorization check - render before any hooks are called below
  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600">You don't have permission to view this page.</p>
      </div>
    );
  }

  // Parse activities with proper Date objects
  const activities = useMemo(() => {
    if (!data?.activities) return [];

    return data.activities.map(activity => ({
      ...activity,
      // FIX: Parse ISO string to Date object for display
      timestamp: new Date(activity.timestamp),
    }));
  }, [data?.activities]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-8 h-8 text-blue-600" />
              Activity Logs
            </h1>
            <p className="text-gray-600 mt-1">
              Browse and search all lead activity events
            </p>
          </div>

          <div className="flex gap-2">
            <button
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => refetch()}
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              onClick={() => {/* TODO: Day 3 - Add CSV export */}}
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 bg-white rounded-lg shadow p-6">
        {/* Search Input */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search descriptions, emails, event types... (searches after 300ms pause)"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1); // Reset to page 1 when search changes
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {debouncedSearch !== searchTerm && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
              </div>
            )}
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <Filter className="w-4 h-4" />
            Filter by:
          </span>

          <button
            onClick={() => handleCategoryChange('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-100 text-blue-800 border-2 border-blue-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({categoryCounts.all || 0})
          </button>

          <button
            onClick={() => handleCategoryChange('SMS')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'SMS'
                ? 'bg-blue-100 text-blue-800 border-2 border-blue-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            SMS
          </button>

          <button
            onClick={() => handleCategoryChange('BOOKING')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'BOOKING'
                ? 'bg-green-100 text-green-800 border-2 border-green-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Bookings
          </button>

          <button
            onClick={() => handleCategoryChange('CAMPAIGN')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'CAMPAIGN'
                ? 'bg-purple-100 text-purple-800 border-2 border-purple-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Campaigns
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">Error loading activities</p>
          <p className="text-red-600 text-sm mt-1">{error.message}</p>
        </div>
      )}

      {/* Activity Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading activities...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 font-medium">No activities found</p>
            {(searchTerm || selectedCategory !== 'all') && (
              <p className="text-gray-500 text-sm mt-1">
                Try adjusting your filters or search terms
              </p>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  When
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activities.map((activity) => (
                <tr
                  key={activity.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {/* TODO: Day 3 - Open detail modal */}}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900 font-medium">
                        {activity.timestamp.toLocaleTimeString()}
                      </span>
                      <span className="text-gray-500">
                        {activity.timestamp.toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {activity.lead ? (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {activity.lead.firstName} {activity.lead.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {activity.lead.email}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No lead</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        activity.category === 'SMS' ? 'bg-blue-100 text-blue-800' :
                        activity.category === 'BOOKING' ? 'bg-green-100 text-green-800' :
                        activity.category === 'CAMPAIGN' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {activity.category}
                      </span>
                      <span className="text-sm text-gray-900">
                        {activity.eventType.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-md truncate">
                      {activity.description}
                    </div>
                    {activity.messageContent && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                        <MessageSquare className="w-3 h-3" />
                        <span className="truncate max-w-xs">
                          {activity.messageContent}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {activity.source}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data && activities.length > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <div>
            Showing {((page - 1) * 50) + 1} to {Math.min(page * 50, data.pagination.totalCount)} of {data.pagination.totalCount} activities
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <div className="flex items-center gap-2 px-3">
              <span className="text-gray-900 font-medium">Page {page}</span>
              <span className="text-gray-400">of {data.pagination.totalPages}</span>
            </div>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={!data.pagination.hasMore}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
