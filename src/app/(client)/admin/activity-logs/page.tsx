'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Activity, Search, Filter, Download, RefreshCw, Clock, User, MessageSquare, ArrowUp, ArrowDown, X } from 'lucide-react';
import { useActivityLogs } from '@/hooks/useActivityLogs';
import { useDebounce } from '@/hooks/useDebounce';

export default function ActivityLogsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get URL params or defaults
  const pageFromUrl = parseInt(searchParams?.get('page') || '1', 10);
  const categoryFromUrl = searchParams?.get('category') || 'all';
  const searchFromUrl = searchParams?.get('search') || '';
  const sortByFromUrl = searchParams?.get('sortBy') || 'timestamp';
  const sortOrderFromUrl = searchParams?.get('sortOrder') || 'desc';

  // Local state
  const [searchTerm, setSearchTerm] = useState(searchFromUrl);
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl);
  const [page, setPage] = useState(pageFromUrl);
  const [sortBy, setSortBy] = useState<'timestamp' | 'eventType' | 'eventCategory'>(sortByFromUrl as any);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(sortOrderFromUrl as any);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(() => {
    // Load from localStorage on mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('activity-logs-auto-refresh');
      return saved === null ? true : saved === 'true'; // Default to ON
    }
    return true;
  });

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
    sortBy,
    sortOrder,
    autoRefresh,
    enabled: isAdmin, // Only fetch if user is admin
  });

  // Save autoRefresh preference to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('activity-logs-auto-refresh', autoRefresh.toString());
    }
  }, [autoRefresh]);

  // Fetch category counts (accurate per-category totals)
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({
    all: 0,
    SMS: 0,
    BOOKING: 0,
    CAMPAIGN: 0,
  });

  useEffect(() => {
    if (!isAdmin) return;

    const fetchCounts = async () => {
      try {
        const params = new URLSearchParams();
        if (debouncedSearch) params.set('search', debouncedSearch);

        const response = await fetch(`/api/admin/activity-logs/counts?${params.toString()}`);
        if (response.ok) {
          const counts = await response.json();
          setCategoryCounts(counts);
        }
      } catch (error) {
        console.error('Failed to fetch category counts:', error);
      }
    };

    fetchCounts();
  }, [debouncedSearch, isAdmin]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', page.toString());
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (searchTerm) params.set('search', searchTerm);
    if (sortBy !== 'timestamp') params.set('sortBy', sortBy);
    if (sortOrder !== 'desc') params.set('sortOrder', sortOrder);

    const newUrl = `/admin/activity-logs${params.toString() ? `?${params.toString()}` : ''}`;
    router.replace(newUrl, { scroll: false });
  }, [page, selectedCategory, searchTerm, sortBy, sortOrder, router]);

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

  // Handle column sort
  const handleSort = (column: 'timestamp' | 'eventType' | 'eventCategory') => {
    if (sortBy === column) {
      // Toggle sort order if clicking same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // New column - default to desc
      setSortBy(column);
      setSortOrder('desc');
    }
    setPage(1); // Reset to page 1 when sort changes
  };

  // Sort indicator component
  const SortIndicator = ({ column }: { column: string }) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ArrowDown className="w-4 h-4 inline ml-1" />
    );
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedActivity) {
        setSelectedActivity(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [selectedActivity]);

  // CSV Export function
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      // Fetch ALL filtered results (no pagination)
      const params = new URLSearchParams({
        page: '1',
        limit: '10000', // Large limit to get all results
        sortBy,
        sortOrder,
      });

      if (debouncedSearch) params.append('search', debouncedSearch);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);

      const response = await fetch(`/api/admin/activity-logs?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch activity logs');

      const data = await response.json();

      // CSV escaping helper (RFC 4180 compliant)
      const escapeCSV = (value: string | null | undefined): string => {
        const str = value || '';
        return `"${str.replace(/"/g, '""')}"`;
      };

      // Convert to CSV
      const csvRows = [];

      // Header row
      csvRows.push([
        'Timestamp',
        'Category',
        'Event Type',
        'Description',
        'Message Content',
        'Lead Name',
        'Lead Email',
        'Source',
      ].join(','));

      // Data rows with proper escaping for all fields
      for (const activity of data.activities) {
        const row = [
          new Date(activity.timestamp).toISOString(),
          escapeCSV(activity.category),
          escapeCSV(activity.eventType.replace(/_/g, ' ')),
          escapeCSV(activity.description),
          escapeCSV(activity.messageContent),
          activity.lead ? escapeCSV(`${activity.lead.firstName} ${activity.lead.lastName}`) : '""',
          activity.lead ? escapeCSV(activity.lead.email) : '""',
          escapeCSV(activity.source),
        ];
        csvRows.push(row.join(','));
      }

      // Create blob and download
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `activity-logs-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('CSV export failed:', error);

      // User-friendly error message with recovery steps
      const errorMessage = error instanceof Error && error.message.includes('fetch')
        ? 'Unable to export activities. Please check your internet connection and try again.'
        : 'Failed to export activities. The file may be too large or a temporary error occurred. Try:\n\n• Applying filters to reduce the number of activities\n• Refreshing the page and trying again\n• Contacting support if the problem persists';

      alert(errorMessage);
    } finally {
      setIsExporting(false);
    }
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
              aria-label="Refresh activity logs"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                autoRefresh
                  ? 'bg-green-50 border-2 border-green-500 text-green-700 hover:bg-green-100'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setAutoRefresh(!autoRefresh)}
              aria-label={`Auto-refresh is ${autoRefresh ? 'ON' : 'OFF'}. Click to toggle.`}
              aria-pressed={autoRefresh}
            >
              <RefreshCw className={`w-4 h-4 ${autoRefresh && isLoading ? 'animate-spin' : ''}`} />
              Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleExportCSV}
              disabled={isExporting}
              aria-label={isExporting ? 'Exporting activity logs...' : 'Export activity logs to CSV'}
            >
              <Download className={`w-4 h-4 ${isExporting ? 'animate-pulse' : ''}`} />
              {isExporting ? 'Exporting...' : 'Export CSV'}
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
              aria-label="Search activity logs"
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
            aria-label={`Show all activities (${categoryCounts.all || 0})`}
            aria-pressed={selectedCategory === 'all'}
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
            aria-label={`Filter by SMS activities (${categoryCounts.SMS || 0})`}
            aria-pressed={selectedCategory === 'SMS'}
          >
            SMS ({categoryCounts.SMS || 0})
          </button>

          <button
            onClick={() => handleCategoryChange('BOOKING')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'BOOKING'
                ? 'bg-green-100 text-green-800 border-2 border-green-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-label={`Filter by booking activities (${categoryCounts.BOOKING || 0})`}
            aria-pressed={selectedCategory === 'BOOKING'}
          >
            Bookings ({categoryCounts.BOOKING || 0})
          </button>

          <button
            onClick={() => handleCategoryChange('CAMPAIGN')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'CAMPAIGN'
                ? 'bg-purple-100 text-purple-800 border-2 border-purple-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-label={`Filter by campaign activities (${categoryCounts.CAMPAIGN || 0})`}
            aria-pressed={selectedCategory === 'CAMPAIGN'}
          >
            Campaigns ({categoryCounts.CAMPAIGN || 0})
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
          <table className="w-full" role="table" aria-label="Activity logs table">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  scope="col"
                  onClick={() => handleSort('timestamp')}
                  aria-label="Sort by timestamp"
                >
                  <span className="flex items-center">
                    When
                    <SortIndicator column="timestamp" />
                  </span>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" scope="col">
                  Lead
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  scope="col"
                  onClick={() => handleSort('eventCategory')}
                  aria-label="Sort by event category"
                >
                  <span className="flex items-center">
                    Event
                    <SortIndicator column="eventCategory" />
                  </span>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" scope="col">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" scope="col">
                  Source
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activities.map((activity) => (
                <tr
                  key={activity.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedActivity(activity)}
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
        <nav className="mt-4 flex items-center justify-between text-sm text-gray-600" aria-label="Activity logs pagination">
          <div aria-live="polite" aria-atomic="true">
            Showing {((page - 1) * 50) + 1} to {Math.min(page * 50, data.pagination.totalCount)} of {data.pagination.totalCount} activities
          </div>
          <div className="flex gap-2" role="group">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Go to previous page"
            >
              Previous
            </button>
            <div className="flex items-center gap-2 px-3" aria-label={`Current page ${page} of ${data.pagination.totalPages}`}>
              <span className="text-gray-900 font-medium">Page {page}</span>
              <span className="text-gray-400">of {data.pagination.totalPages}</span>
            </div>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={!data.pagination.hasMore}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Go to next page"
            >
              Next
            </button>
          </div>
        </nav>
      )}

      {/* Detail Modal */}
      {selectedActivity && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedActivity(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 id="modal-title" className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Activity className="w-6 h-6 text-blue-600" />
                Activity Details
              </h2>
              <button
                onClick={() => setSelectedActivity(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Timestamp & Category Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span className="text-lg font-medium text-gray-900">
                    {selectedActivity.timestamp.toLocaleString()}
                  </span>
                </div>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  selectedActivity.category === 'SMS' ? 'bg-blue-100 text-blue-800' :
                  selectedActivity.category === 'BOOKING' ? 'bg-green-100 text-green-800' :
                  selectedActivity.category === 'CAMPAIGN' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedActivity.category}
                </span>
              </div>

              {/* Event Type */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Event Type</h3>
                <p className="text-base text-gray-900">{selectedActivity.eventType.replace(/_/g, ' ')}</p>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Description</h3>
                <p className="text-base text-gray-900 whitespace-pre-wrap">{selectedActivity.description}</p>
              </div>

              {/* Message Content */}
              {selectedActivity.messageContent && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    Message Content
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-base text-gray-900 whitespace-pre-wrap">{selectedActivity.messageContent}</p>
                  </div>
                </div>
              )}

              {/* Lead Information */}
              {selectedActivity.lead && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <User className="w-4 h-4" />
                    Lead
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-base font-medium text-gray-900">
                      {selectedActivity.lead.firstName} {selectedActivity.lead.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{selectedActivity.lead.email}</p>
                    <p className="text-xs text-gray-500 mt-1">ID: {selectedActivity.lead.id}</p>
                  </div>
                </div>
              )}

              {/* Source */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Source</h3>
                <code className="text-sm font-mono bg-gray-100 px-3 py-1 rounded border border-gray-200">
                  {selectedActivity.source}
                </code>
              </div>

              {/* Metadata (if present) */}
              {selectedActivity.metadata && Object.keys(selectedActivity.metadata).length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Metadata</h3>
                  <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto border border-gray-700">
                    {JSON.stringify(selectedActivity.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {/* IDs */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Activity ID</h4>
                  <code className="text-xs font-mono text-gray-600">{selectedActivity.id}</code>
                </div>
                {selectedActivity.leadAirtableId && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Airtable Lead ID</h4>
                    <code className="text-xs font-mono text-gray-600">{selectedActivity.leadAirtableId}</code>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setSelectedActivity(null)}
                className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
