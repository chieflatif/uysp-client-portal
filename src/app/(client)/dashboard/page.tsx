'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { theme } from '@/theme';
import { 
  TrendingUp, 
  Users, 
  Target, 
  Calendar,
  MousePointerClick,
  ArrowRight, 
  Loader2, 
  AlertCircle,
  Clock,
  Briefcase
} from 'lucide-react';

interface DashboardStats {
  totalLeads: number;
  highIcpLeads: number;
  claimedLeads: number;
  bookedLeads: number;
  clickedLeads: number;
}

interface ActivityEntry {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  userId: string | null;
  leadId: string | null;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    highIcpLeads: 0,
    claimedLeads: 0,
    bookedLeads: 0,
    clickedLeads: 0,
  });
  const [recentActivity, setRecentActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    // Redirect to password change if required
    if (session?.user?.mustChangePassword) {
      router.push('/change-password');
      return;
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch leads for stats
        const leadsResponse = await fetch('/api/leads');
        if (!leadsResponse.ok) {
          throw new Error(`Failed to fetch leads: ${leadsResponse.status}`);
        }
        
        const leadsData = await leadsResponse.json();
        const leads = leadsData.leads || [];

        // Calculate stats
        const highIcp = leads.filter((l: any) => l.icpScore >= 70).length;
        const claimed = leads.filter((l: any) => l.claimedBy).length;
        const booked = leads.filter((l: any) => l.booked === true).length;
        const clicked = leads.filter((l: any) => l.clickedLink === true).length;

        setStats({
          totalLeads: leads.length,
          highIcpLeads: highIcp,
          claimedLeads: claimed,
          bookedLeads: booked,
          clickedLeads: clicked,
        });

        // Fetch recent activity
        try {
          const activityResponse = await fetch('/api/activity/recent');
          if (activityResponse.ok) {
            const activityData = await activityResponse.json();
            setRecentActivity(activityData.activities || []);
          }
        } catch (activityError) {
          console.error('Error fetching activity:', activityError);
          // Don't fail the whole dashboard if activity fails
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to load dashboard';
        console.error('Error fetching stats:', errorMsg);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [status]);

  if (status === 'loading' || loading) {
    return (
      <div className={`min-h-screen ${theme.core.darkBg} flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className={`${theme.core.bodyText} text-sm`}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${theme.core.darkBg} p-8`}>
        <div className="max-w-2xl mx-auto">
          <div className="p-4 rounded-lg bg-red-900/20 border border-red-700/50 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 font-medium">Error Loading Dashboard</p>
              <p className="text-red-200 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.core.darkBg} p-8`}>
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className={`text-4xl font-bold ${theme.core.white} mb-2`}>
            Welcome Back
          </h1>
          <p className={theme.core.bodyText}>
            Here&apos;s an overview of your lead pipeline
          </p>
        </div>

        {/* Clickable Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Leads */}
          <button
            onClick={() => router.push('/leads')}
            className={`${theme.components.card} border-l-4 border-l-cyan-400 hover:bg-gray-700 transition cursor-pointer text-left`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-xs ${theme.accents.tertiary.class} uppercase tracking-wider mb-1 font-semibold`}>
                  Total Leads
                </p>
                <p className={`text-3xl font-bold ${theme.core.white}`}>
                  {stats.totalLeads.toLocaleString()}
                </p>
                <p className={`text-xs ${theme.core.bodyText} mt-1`}>Click to view all</p>
              </div>
              <div className="p-3 rounded-lg bg-cyan-400/10">
                <Users className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
          </button>

          {/* High ICP Leads */}
          <button
            onClick={() => {
              router.push('/leads');
              // TODO: Add filter state to URL params
            }}
            className={`${theme.components.card} border-l-4 border-l-pink-700 hover:bg-gray-700 transition cursor-pointer text-left`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-xs ${theme.accents.primary.class} uppercase tracking-wider mb-1 font-semibold`}>
                  High ICP (70+)
                </p>
                <p className={`text-3xl font-bold ${theme.core.white}`}>
                  {stats.highIcpLeads.toLocaleString()}
                </p>
                <p className={`text-xs ${theme.core.bodyText} mt-1`}>Top prospects</p>
              </div>
              <div className="p-3 rounded-lg bg-pink-700/10">
                <Target className="w-6 h-6 text-pink-700" />
              </div>
            </div>
          </button>

          {/* Claimed Leads */}
          <button
            onClick={() => {
              router.push('/leads');
              // TODO: Add claimed filter to URL params
            }}
            className={`${theme.components.card} border-l-4 border-l-indigo-600 hover:bg-gray-700 transition cursor-pointer text-left`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-xs ${theme.accents.secondary.class} uppercase tracking-wider mb-1 font-semibold`}>
                  Claimed
                </p>
                <p className={`text-3xl font-bold ${theme.core.white}`}>
                  {stats.claimedLeads.toLocaleString()}
                </p>
                <p className={`text-xs ${theme.core.bodyText} mt-1`}>Being worked</p>
              </div>
              <div className="p-3 rounded-lg bg-indigo-600/10">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </button>

          {/* Booked Leads */}
          <button
            onClick={() => {
              router.push('/leads');
              // TODO: Add booked filter to URL params
            }}
            className={`${theme.components.card} border-l-4 border-l-green-500 hover:bg-gray-700 transition cursor-pointer text-left`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-xs text-green-400 uppercase tracking-wider mb-1 font-semibold`}>
                  Booked
                </p>
                <p className={`text-3xl font-bold ${theme.core.white}`}>
                  {stats.bookedLeads.toLocaleString()}
                </p>
                <p className={`text-xs ${theme.core.bodyText} mt-1`}>Conversions</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10">
                <Calendar className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </button>

          {/* Clicked Leads */}
          <button
            onClick={() => {
              router.push('/leads');
              // TODO: Add clicked filter to URL params
            }}
            className={`${theme.components.card} border-l-4 border-l-purple-500 hover:bg-gray-700 transition cursor-pointer text-left`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-xs text-purple-400 uppercase tracking-wider mb-1 font-semibold`}>
                  Clicked
                </p>
                <p className={`text-3xl font-bold ${theme.core.white}`}>
                  {stats.clickedLeads.toLocaleString()}
                </p>
                <p className={`text-xs ${theme.core.bodyText} mt-1`}>Engaged</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/10">
                <MousePointerClick className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </button>
        </div>

        {/* Quick Actions */}
        <div className={theme.components.card}>
          <h2 className={`text-xl font-bold ${theme.core.white} mb-4`}>Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link
              href="/leads"
              className={`flex items-center justify-between p-4 rounded-lg border border-gray-700 hover:border-cyan-400 hover:bg-gray-800 transition ${theme.core.bodyText}`}
            >
              <div>
                <p className={`font-medium ${theme.core.white}`}>View All Leads</p>
                <p className={`text-sm ${theme.core.bodyText}`}>Browse and manage leads</p>
              </div>
              <ArrowRight className="w-5 h-5 text-cyan-400" />
            </Link>
            <Link
              href="/analytics"
              className={`flex items-center justify-between p-4 rounded-lg border border-gray-700 hover:border-cyan-400 hover:bg-gray-800 transition ${theme.core.bodyText}`}
            >
              <div>
                <p className={`font-medium ${theme.core.white}`}>Analytics</p>
                <p className={`text-sm ${theme.core.bodyText}`}>Campaign performance</p>
              </div>
              <ArrowRight className="w-5 h-5 text-cyan-400" />
            </Link>
            {session?.user?.role === 'ADMIN' && (
              <Link
                href="/project-management"
                className={`flex items-center justify-between p-4 rounded-lg border border-gray-700 hover:border-indigo-600 hover:bg-gray-800 transition ${theme.core.bodyText}`}
              >
                <div>
                  <p className={`font-medium ${theme.core.white}`}>Project Management</p>
                  <p className={`text-sm ${theme.core.bodyText}`}>Tasks, blockers & progress</p>
                </div>
                <Briefcase className="w-5 h-5 text-indigo-600" />
              </Link>
            )}
            <Link
              href="/settings"
              className={`flex items-center justify-between p-4 rounded-lg border border-gray-700 hover:border-cyan-400 hover:bg-gray-800 transition ${theme.core.bodyText}`}
            >
              <div>
                <p className={`font-medium ${theme.core.white}`}>Settings</p>
                <p className={`text-sm ${theme.core.bodyText}`}>Manage preferences</p>
              </div>
              <ArrowRight className="w-5 h-5 text-cyan-400" />
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className={theme.components.card}>
          <h2 className={`text-xl font-bold ${theme.core.white} mb-4 flex items-center gap-2`}>
            <Clock className={`w-5 h-5 ${theme.accents.tertiary.class}`} />
            Recent <span className={theme.accents.primary.class}>Activity</span>
          </h2>
          
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.slice(0, 10).map((activity) => (
                <div 
                  key={activity.id} 
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-700 hover:border-gray-600 transition"
                >
                  <div className={`w-2 h-2 rounded-full ${getActivityColor(activity.action)} mt-2 flex-shrink-0`}></div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${theme.core.white} text-sm`}>
                      {formatActivityAction(activity.action)}
                    </p>
                    {activity.details && (
                      <p className={`text-xs ${theme.core.bodyText} mt-0.5 truncate`}>
                        {activity.details}
                      </p>
                    )}
                    <p className={`text-xs ${theme.core.bodyText} opacity-60 mt-1`}>
                      {formatTimeAgo(activity.createdAt)}
                    </p>
                  </div>
                  {activity.leadId && (
                    <button
                      onClick={() => router.push(`/leads/${activity.leadId}`)}
                      className={`text-xs ${theme.accents.tertiary.class} hover:text-cyan-300 flex-shrink-0`}
                    >
                      View Lead →
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className={`w-12 h-12 ${theme.core.bodyText} mx-auto mb-3 opacity-30`} />
              <p className={`${theme.core.bodyText}`}>No recent activity yet</p>
              <p className={`text-sm ${theme.core.bodyText} opacity-60 mt-1`}>
                Activity will appear here as you work with leads
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getActivityColor(action: string): string {
  if (action.includes('CLAIM')) return 'bg-indigo-400';
  if (action.includes('NOTE')) return 'bg-cyan-400';
  if (action.includes('STATUS')) return 'bg-purple-400';
  if (action.includes('CAMPAIGN')) return 'bg-red-400';
  if (action.includes('BOOKED')) return 'bg-green-400';
  return 'bg-gray-400';
}

function formatActivityAction(action: string): string {
  return action
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
