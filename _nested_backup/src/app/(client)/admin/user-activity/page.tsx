'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Activity, Users, Clock, BarChart3, TrendingUp, Monitor } from 'lucide-react';

interface ActivityStats {
  period: string;
  startDate: string;
  endDate: string;
  summary: {
    totalEvents: number;
    uniqueUsers: number;
    avgSessionDuration: number;
  };
  eventsByType: Array<{ eventType: string; count: number }>;
  eventsByCategory: Array<{ category: string; count: number }>;
  dailyActivity: Array<{ date: string; events: number }>;
  topUsers: Array<{
    userId: string;
    name: string;
    email: string;
    eventCount: number;
  }>;
  recentSessions: Array<{
    sessionId: string;
    userId: string;
    userName: string;
    sessionStart: string;
    sessionEnd: string | null;
    pageViews: number;
    durationSeconds: number | null;
    browser: string | null;
    deviceType: string | null;
  }>;
}

export default function UserActivityPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('30d');

  // Check if user is super admin
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (session) {
      fetchStats();
    }
  }, [period, session]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/analytics/user-activity?period=${period}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load analytics');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Failed to connect to analytics service');
    } finally {
      setLoading(false);
    }
  };

  // Show access denied if not super admin
  if (session && !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-[#0A0E27] p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-red-900/20 to-gray-900/50 backdrop-blur border border-red-700 rounded-xl p-8 text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h1>
            <p className="text-gray-300">This page is only accessible to Super Admins.</p>
          </div>
        </div>
      </div>
    );
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0m';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0E27] p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-cyan-400">Loading analytics...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0E27] p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-red-900/20 to-gray-900/50 backdrop-blur border border-red-700 rounded-xl p-8 text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Error Loading Analytics</h1>
            <p className="text-gray-300 mb-4">{error}</p>
            <button
              onClick={() => fetchStats()}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if no stats
  if (!stats || stats.summary.totalEvents === 0) {
    return (
      <div className="min-h-screen bg-[#0A0E27] p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">User Activity Analytics</h1>
            <p className="text-gray-400">Track user engagement and behavior patterns</p>
          </div>
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur border border-gray-700 rounded-xl p-12 text-center">
            <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Activity Data Yet</h2>
            <p className="text-gray-400 mb-6">
              User activity will appear here once users start navigating the application.
              <br />
              Page views, clicks, and custom events will be tracked automatically.
            </p>
            <button
              onClick={() => fetchStats()}
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold transition"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0E27] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">User Activity Analytics</h1>
            <p className="text-gray-400">Track user engagement and behavior patterns</p>
          </div>
          <div className="flex gap-2">
            {['7d', '30d', '90d'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  period === p
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-8 h-8 text-cyan-400" />
              <span className="text-xs text-gray-400 uppercase tracking-wider">Total Events</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats?.summary.totalEvents.toLocaleString()}</div>
            <p className="text-sm text-gray-400 mt-2">Page views, clicks, interactions</p>
          </div>

          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-purple-400" />
              <span className="text-xs text-gray-400 uppercase tracking-wider">Active Users</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats?.summary.uniqueUsers}</div>
            <p className="text-sm text-gray-400 mt-2">Unique users in this period</p>
          </div>

          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 text-green-400" />
              <span className="text-xs text-gray-400 uppercase tracking-wider">Avg Session</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {formatDuration(stats?.summary.avgSessionDuration || 0)}
            </div>
            <p className="text-sm text-gray-400 mt-2">Average session duration</p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Events by Type */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-6 h-6 text-cyan-400" />
              <h2 className="text-xl font-bold text-white">Events by Type</h2>
            </div>
            <div className="space-y-3">
              {stats?.eventsByType.slice(0, 8).map((event, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">{event.eventType}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-cyan-500 h-2 rounded-full"
                        style={{
                          width: `${(event.count / (stats.eventsByType[0]?.count || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-white font-semibold text-sm w-12 text-right">
                      {event.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Events by Category */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur border border-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-bold text-white">Events by Category</h2>
            </div>
            <div className="space-y-3">
              {stats?.eventsByCategory.map((cat, idx) => {
                const colors = ['bg-cyan-500', 'bg-purple-500', 'bg-green-500', 'bg-yellow-500'];
                return (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm capitalize">{cat.category}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-700 rounded-full h-2">
                        <div
                          className={`${colors[idx % colors.length]} h-2 rounded-full`}
                          style={{
                            width: `${(cat.count / (stats.eventsByCategory[0]?.count || 1)) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-white font-semibold text-sm w-12 text-right">
                        {cat.count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Active Users */}
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur border border-gray-700 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Top Active Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-700">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">User</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Email</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Events</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {stats?.topUsers.map((user, idx) => (
                  <tr key={idx} className="hover:bg-gray-800/30">
                    <td className="py-3 px-4 text-white font-medium">{user.name}</td>
                    <td className="py-3 px-4 text-gray-400">{user.email}</td>
                    <td className="py-3 px-4 text-right text-cyan-400 font-semibold">
                      {user.eventCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Monitor className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Recent Sessions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-700">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">User</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Start Time</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Duration</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Pages</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Device</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {stats?.recentSessions.map((session, idx) => (
                  <tr key={idx} className="hover:bg-gray-800/30">
                    <td className="py-3 px-4 text-white">{session.userName}</td>
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {new Date(session.sessionStart).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-300">
                      {formatDuration(session.durationSeconds)}
                    </td>
                    <td className="py-3 px-4 text-right text-cyan-400 font-semibold">
                      {session.pageViews}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {session.deviceType} • {session.browser}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
