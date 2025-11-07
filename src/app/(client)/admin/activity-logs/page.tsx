'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Activity, Search, Filter, Download, RefreshCw, Clock, User, MessageSquare } from 'lucide-react';

interface ActivityLog {
  id: string;
  timestamp: Date;
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
  source: string;
}

export default function ActivityLogsPage() {
  const { data: session } = useSession();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Check if user is admin or super admin
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    // For Day 1: Use mock data
    // Day 2+: Wire up to API endpoint GET /api/admin/activity-logs
    const mockData: ActivityLog[] = [
      {
        id: '1',
        timestamp: new Date('2025-11-07T10:30:00Z'),
        eventType: 'MESSAGE_SENT',
        category: 'SMS',
        description: 'Initial outreach message sent',
        messageContent: 'Hi! Saw your interest in our program...',
        lead: {
          id: 'lead-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com'
        },
        source: 'n8n:kajabi-scheduler'
      },
      {
        id: '2',
        timestamp: new Date('2025-11-07T10:35:00Z'),
        eventType: 'MESSAGE_DELIVERED',
        category: 'SMS',
        description: 'Message delivered successfully',
        messageContent: null,
        lead: {
          id: 'lead-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com'
        },
        source: 'n8n:delivery-status'
      },
      {
        id: '3',
        timestamp: new Date('2025-11-07T11:00:00Z'),
        eventType: 'BOOKING_CONFIRMED',
        category: 'BOOKING',
        description: 'Call booked via Calendly',
        messageContent: null,
        lead: {
          id: 'lead-2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com'
        },
        source: 'n8n:calendly-webhook'
      },
    ];

    setTimeout(() => {
      setActivities(mockData);
      setLoading(false);
    }, 500);
  }, []);

  // Authorization check
  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600">You don't have permission to view this page.</p>
      </div>
    );
  }

  // Filter activities based on search and category
  const filteredActivities = activities.filter((activity) => {
    const matchesSearch = searchTerm === '' ||
      activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.lead?.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || activity.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Get category counts for filter chips
  const categoryCounts = activities.reduce((acc, activity) => {
    acc[activity.category] = (acc[activity.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              onClick={() => {/* TODO: Day 3 - Add auto-refresh */}}
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
              placeholder="Search across all events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <Filter className="w-4 h-4" />
            Filter by:
          </span>

          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-blue-100 text-blue-800 border-2 border-blue-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({activities.length})
          </button>

          <button
            onClick={() => setSelectedCategory('SMS')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'SMS'
                ? 'bg-blue-100 text-blue-800 border-2 border-blue-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            SMS ({categoryCounts.SMS || 0})
          </button>

          <button
            onClick={() => setSelectedCategory('BOOKING')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'BOOKING'
                ? 'bg-green-100 text-green-800 border-2 border-green-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Bookings ({categoryCounts.BOOKING || 0})
          </button>

          <button
            onClick={() => setSelectedCategory('CAMPAIGN')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'CAMPAIGN'
                ? 'bg-purple-100 text-purple-800 border-2 border-purple-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Campaigns ({categoryCounts.CAMPAIGN || 0})
          </button>
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading activities...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="p-8 text-center">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No activities found</p>
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
              {filteredActivities.map((activity) => (
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

      {/* Pagination Placeholder */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <div>
          Showing {filteredActivities.length} of {activities.length} activities
        </div>
        <div className="flex gap-2">
          {/* TODO: Day 2 - Add real pagination */}
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled>
            Previous
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
