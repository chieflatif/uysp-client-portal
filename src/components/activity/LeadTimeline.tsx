'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Clock,
  MessageSquare,
  Calendar,
  Bell,
  User,
  ChevronDown,
  ChevronUp,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { theme } from '@/theme';

interface ActivityEvent {
  id: string;
  timestamp: Date;
  eventType: string;
  category: string; // API returns 'category' not 'eventCategory'
  description: string;
  messageContent?: string;
  source: string;
  metadata?: Record<string, unknown> | null;
}

type ActivityApiEvent = Omit<ActivityEvent, 'timestamp'> & { timestamp: string };

interface LeadTimelineProps {
  leadId: string;
  leadAirtableId?: string | null;
}

export function LeadTimeline({ leadId, leadAirtableId }: LeadTimelineProps) {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({
    all: 0,
    SMS: 0,
    BOOKING: 0,
    CAMPAIGN: 0,
    MANUAL: 0,
    SYSTEM: 0,
  });

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        leadId,
        limit: '100',
        sortBy: 'timestamp',
        sortOrder: 'desc',
      });

      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      if (leadAirtableId) {
        params.append('leadAirtableId', leadAirtableId);
      }

      const response = await fetch(`/api/admin/activity-logs?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch activity timeline');
      }

      const data = await response.json() as { activities: ActivityApiEvent[] };
      setActivities(
        data.activities.map((activity) => ({
          ...activity,
          timestamp: new Date(activity.timestamp),
        }))
      );

      // Fetch category counts
      const countParams = new URLSearchParams({ leadId });
      if (leadAirtableId) {
        countParams.append('leadAirtableId', leadAirtableId);
      }
      const countsResponse = await fetch(
        `/api/admin/activity-logs/counts?${countParams.toString()}`
      );
      if (countsResponse.ok) {
        const counts = await countsResponse.json() as Record<string, number>;
        setCategoryCounts((prev) => ({
          ...prev,
          ...counts,
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load timeline');
    } finally {
      setLoading(false);
    }
  }, [leadId, leadAirtableId, selectedCategory]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'SMS':
        return <MessageSquare className="w-4 h-4" />;
      case 'BOOKING':
        return <Calendar className="w-4 h-4" />;
      case 'CAMPAIGN':
        return <Bell className="w-4 h-4" />;
      case 'MANUAL':
        return <User className="w-4 h-4" />;
      case 'SYSTEM':
        return <Activity className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'SMS':
        return 'text-blue-400 bg-blue-900/30 border-blue-700';
      case 'BOOKING':
        return 'text-green-400 bg-green-900/30 border-green-700';
      case 'CAMPAIGN':
        return 'text-purple-400 bg-purple-900/30 border-purple-700';
      case 'MANUAL':
        return 'text-yellow-400 bg-yellow-900/30 border-yellow-700';
      case 'SYSTEM':
        return 'text-gray-400 bg-gray-900/30 border-gray-700';
      default:
        return 'text-gray-400 bg-gray-900/30 border-gray-700';
    }
  };

  const formatEventType = (eventType: string) => {
    return eventType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className={theme.components.card}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-bold ${theme.core.white}`}>Activity Timeline</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={theme.components.card}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-bold ${theme.core.white}`}>Activity Timeline</h2>
        </div>
        <div className="p-4 rounded-lg bg-red-900/20 border border-red-700/50">
          <p className="text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={theme.components.card}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-xl font-bold ${theme.core.white} mb-1`}>Activity Timeline</h2>
          <p className={`text-sm ${theme.core.bodyText}`}>
            Chronological history of all events for this lead
          </p>
        </div>
        <button
          onClick={fetchActivities}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg ${theme.components.button.ghost}`}
          aria-label="Refresh timeline"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <Filter className="w-4 h-4 text-gray-400" />
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === 'all'
              ? 'bg-cyan-600/30 text-cyan-300 border-2 border-cyan-500'
              : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 border border-gray-600'
          }`}
        >
          All ({categoryCounts.all || 0})
        </button>
        <button
          onClick={() => setSelectedCategory('SMS')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === 'SMS'
              ? 'bg-blue-600/30 text-blue-300 border-2 border-blue-500'
              : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 border border-gray-600'
          }`}
        >
          SMS ({categoryCounts.SMS || 0})
        </button>
        <button
          onClick={() => setSelectedCategory('BOOKING')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === 'BOOKING'
              ? 'bg-green-600/30 text-green-300 border-2 border-green-500'
              : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 border border-gray-600'
          }`}
        >
          Bookings ({categoryCounts.BOOKING || 0})
        </button>
        <button
          onClick={() => setSelectedCategory('CAMPAIGN')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === 'CAMPAIGN'
              ? 'bg-purple-600/30 text-purple-300 border-2 border-purple-500'
              : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 border border-gray-600'
          }`}
        >
          Campaigns ({categoryCounts.CAMPAIGN || 0})
        </button>
      </div>

      {/* Timeline */}
      {activities.length === 0 ? (
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className={`${theme.core.bodyText} font-medium`}>No activity events found</p>
          {selectedCategory !== 'all' && (
            <p className={`text-sm ${theme.core.bodyText} mt-2`}>
              Try selecting a different category
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="relative pl-8 pb-4 border-l-2 border-gray-700/50 last:border-l-transparent"
            >
              {/* Timeline dot */}
              <div
                className={`absolute left-[-9px] top-0 w-4 h-4 rounded-full border-2 ${getCategoryColor(
                  activity.category
                )}`}
              />

              {/* Event card */}
              <div
                className={`bg-gray-800/50 border rounded-lg p-4 hover:bg-gray-800 transition-colors cursor-pointer ${
                  expandedId === activity.id
                    ? 'border-cyan-500/50'
                    : 'border-gray-700/50'
                }`}
                onClick={() => toggleExpanded(activity.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`p-1.5 rounded ${getCategoryColor(activity.category)}`}>
                        {getCategoryIcon(activity.category)}
                      </span>
                      <span className={`text-sm font-medium ${theme.core.white}`}>
                        {formatEventType(activity.eventType)}
                      </span>
                      <span className={`text-xs ${theme.core.bodyText}`}>
                        {activity.category}
                      </span>
                    </div>

                    {/* Description */}
                    <p className={`${theme.core.bodyText} text-sm mb-2`}>
                      {activity.description}
                    </p>

                    {/* Timestamp */}
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>
                        {new Date(activity.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-xs">{activity.source}</span>
                    </div>
                  </div>

                  {/* Expand/Collapse button */}
                  <button
                    className="p-1 hover:bg-gray-700/50 rounded transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpanded(activity.id);
                    }}
                    aria-label={expandedId === activity.id ? 'Collapse' : 'Expand'}
                  >
                    {expandedId === activity.id ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Expanded content */}
                {expandedId === activity.id && (
                  <div className="mt-4 pt-4 border-t border-gray-700/50 space-y-3">
                    {/* Message content */}
                    {activity.messageContent && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-400 uppercase mb-2">
                          Message Content
                        </h4>
                        <div className="bg-gray-900/50 rounded p-3 border border-gray-700/50">
                          <p className="text-sm text-gray-300 whitespace-pre-wrap">
                            {activity.messageContent}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-400 uppercase mb-2">
                          Additional Details
                        </h4>
                        <pre className="bg-gray-900/50 rounded p-3 border border-gray-700/50 text-xs text-gray-300 overflow-x-auto">
                          {JSON.stringify(activity.metadata, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Activity ID */}
                    <div>
                      <h4 className="text-xs font-medium text-gray-400 uppercase mb-1">
                        Activity ID
                      </h4>
                      <code className="text-xs font-mono text-gray-500">{activity.id}</code>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
