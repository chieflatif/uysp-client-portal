'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, TrendingUp, Users, MousePointerClick, Calendar, ChevronRight } from 'lucide-react';
import { theme } from '@/theme';

interface DashboardStats {
  overview: {
    totalLeads: number;
    activeLeads: number;
    completedLeads: number;
    newToday: number;
    newThisWeek: number;
  };
  campaigns: {
    total: number;
    active: number;
    paused: number;
  };
  performance: {
    messagesSent: number;
    messagesThisPeriod: number;
    totalBooked: number;
    bookedThisPeriod: number;
    bookingRate: number;
    totalOptedOut: number;
    optedOutThisPeriod: number;
    optOutRate: number;
    totalClicks: number;
    clickRate: number;
  };
  topPerformers: {
    campaigns: Array<{
      name: string;
      bookingRate: number;
      totalBooked: number;
    }>;
    leads: Array<{
      id: string;
      name: string;
      icpScore: number;
      status: string;
      clicked: boolean;
      booked: boolean;
    }>;
  };
}

interface CampaignAnalytics {
  name: string;
  totalLeads: number;
  sequenceSteps: {
    notStarted: number;
    step1: number;
    step2: number;
    step3: number;
    completed: number;
  };
  statusBreakdown: {
    queued: number;
    readyForSMS: number;
    inSequence: number;
    stopped: number;
    completed: number;
  };
  conversions: {
    booked: number;
    optedOut: number;
    replied: number;
    bookingRate: number;
    optOutRate: number;
  };
  clicks: {
    totalClicks: number;
    uniqueClickers: number;
    clickRate: number;
  };
  messages: {
    totalSent: number;
    avgPerLead: number;
    lastSentAt: string | null;
  };
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [campaignStats, setCampaignStats] = useState<CampaignAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch dashboard stats
      const dashboardRes = await fetch(`/api/analytics/dashboard?period=${period}`);
      if (dashboardRes.ok) {
        const dashboardData = await dashboardRes.json();
        setDashboardStats(dashboardData);
      }

      // Fetch campaign stats
      const campaignsRes = await fetch('/api/analytics/campaigns');
      if (campaignsRes.ok) {
        const campaignsData = await campaignsRes.json();
        setCampaignStats(campaignsData.campaigns || []);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-screen ${theme.core.darkBg}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400" />
          <p className={`${theme.core.bodyText} text-sm`}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.core.darkBg} p-6 space-y-6`}>
      <div className="flex justify-between items-center">
        <h1 className={`text-3xl font-bold flex items-center gap-2 ${theme.core.white}`}>
          <BarChart3 className={`h-6 w-6 ${theme.accents.tertiary.class}`} />
          Analytics <span className={theme.accents.primary.class}>Dashboard</span>
        </h1>

        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className={theme.components.input}
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Overview Stats */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Leads"
            value={dashboardStats.overview.totalLeads}
            icon={<Users className="h-5 w-5" />}
            subtitle={`${dashboardStats.overview.newThisWeek} new this week`}
          />
          <StatCard
            title="Active in Sequence"
            value={dashboardStats.overview.activeLeads}
            icon={<TrendingUp className="h-5 w-5" />}
            color="secondary"
          />
          <StatCard
            title="Booking Rate"
            value={`${dashboardStats.performance.bookingRate.toFixed(1)}%`}
            icon={<Calendar className="h-5 w-5" />}
            subtitle={`${dashboardStats.performance.totalBooked} booked`}
            color="tertiary"
          />
          <StatCard
            title="Click Rate"
            value={`${dashboardStats.performance.clickRate.toFixed(1)}%`}
            icon={<MousePointerClick className="h-5 w-5" />}
            subtitle={`${dashboardStats.performance.totalClicks} total clicks`}
            color="primary"
          />
        </div>
      )}

      {/* Campaign Performance Table */}
      <div className={theme.components.card}>
        <h2 className={`text-xl font-bold mb-4 ${theme.core.white}`}>Campaign Performance</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className={`text-left py-3 px-4 ${theme.accents.tertiary.class} text-xs uppercase tracking-wider font-semibold`}>Campaign</th>
                <th className={`text-right py-3 px-4 ${theme.accents.tertiary.class} text-xs uppercase tracking-wider font-semibold`}>Total Leads</th>
                <th className={`text-right py-3 px-4 ${theme.accents.tertiary.class} text-xs uppercase tracking-wider font-semibold`}>Step 1</th>
                <th className={`text-right py-3 px-4 ${theme.accents.tertiary.class} text-xs uppercase tracking-wider font-semibold`}>Step 2</th>
                <th className={`text-right py-3 px-4 ${theme.accents.tertiary.class} text-xs uppercase tracking-wider font-semibold`}>Step 3</th>
                <th className={`text-right py-3 px-4 ${theme.accents.tertiary.class} text-xs uppercase tracking-wider font-semibold`}>Completed</th>
                <th className={`text-right py-3 px-4 ${theme.accents.tertiary.class} text-xs uppercase tracking-wider font-semibold`}>Booked</th>
                <th className={`text-right py-3 px-4 ${theme.accents.tertiary.class} text-xs uppercase tracking-wider font-semibold`}>Opt-Out</th>
                <th className={`text-right py-3 px-4 ${theme.accents.tertiary.class} text-xs uppercase tracking-wider font-semibold`}>Clicks</th>
                <th className={`text-right py-3 px-4 ${theme.accents.tertiary.class} text-xs uppercase tracking-wider font-semibold`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {campaignStats.map((campaign) => (
                <tr 
                  key={campaign.name} 
                  className="hover:bg-gray-800 transition cursor-pointer border-l-4 border-indigo-600"
                  onClick={() => router.push(`/analytics/campaigns/${encodeURIComponent(campaign.name)}`)}
                >
                  <td className={`py-3 px-4 font-medium ${theme.core.white}`}>{campaign.name}</td>
                  <td className={`text-right py-3 px-4 ${theme.core.bodyText}`}>{campaign.totalLeads}</td>
                  <td className={`text-right py-3 px-4 ${theme.core.bodyText}`}>{campaign.sequenceSteps.step1}</td>
                  <td className={`text-right py-3 px-4 ${theme.core.bodyText}`}>{campaign.sequenceSteps.step2}</td>
                  <td className={`text-right py-3 px-4 ${theme.core.bodyText}`}>{campaign.sequenceSteps.step3}</td>
                  <td className={`text-right py-3 px-4 ${theme.core.bodyText}`}>{campaign.sequenceSteps.completed}</td>
                  <td className="text-right py-3 px-4">
                    <span className="text-green-400 font-semibold">
                      {campaign.conversions.booked} ({campaign.conversions.bookingRate.toFixed(1)}%)
                    </span>
                  </td>
                  <td className="text-right py-3 px-4">
                    <span className="text-red-400">
                      {campaign.conversions.optedOut} ({campaign.conversions.optOutRate.toFixed(1)}%)
                    </span>
                  </td>
                  <td className="text-right py-3 px-4">
                    <span className={theme.accents.secondary.class}>
                      {campaign.clicks.uniqueClickers} ({campaign.clicks.clickRate.toFixed(1)}%)
                    </span>
                  </td>
                  <td className="text-right py-3 px-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/analytics/campaigns/${encodeURIComponent(campaign.name)}`);
                      }}
                      className={`text-sm ${theme.accents.tertiary.class} hover:text-cyan-300 underline flex items-center gap-1 ml-auto`}
                    >
                      View Details
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
              {campaignStats.length === 0 && (
                <tr>
                  <td colSpan={10} className={`py-12 text-center ${theme.core.bodyText}`}>
                    No campaigns found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Performers */}
      {dashboardStats && dashboardStats.topPerformers.campaigns.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Campaigns */}
          <div className={theme.components.card}>
            <h2 className={`text-xl font-bold mb-4 ${theme.core.white}`}>
              Top <span className={theme.accents.primary.class}>Performing</span> Campaigns
            </h2>
            <div className="space-y-3">
              {dashboardStats.topPerformers.campaigns.map((campaign, index) => (
                <button
                  key={campaign.name}
                  onClick={() => router.push(`/analytics/campaigns/${encodeURIComponent(campaign.name)}`)}
                  className="w-full flex justify-between items-center p-3 border border-gray-700 rounded-lg hover:bg-gray-800 hover:border-cyan-400 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-2xl font-bold ${theme.accents.tertiary.class}`}>#{index + 1}</span>
                    <div className="text-left">
                      <div className={`font-medium ${theme.core.white}`}>{campaign.name}</div>
                      <div className={`text-sm ${theme.core.bodyText}`}>{campaign.totalBooked} bookings</div>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <div className="text-xl font-bold text-green-400">
                        {campaign.bookingRate.toFixed(1)}%
                      </div>
                      <div className={`text-xs ${theme.core.bodyText}`}>booking rate</div>
                    </div>
                    <ChevronRight className={`h-5 w-5 ${theme.accents.tertiary.class}`} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Hot Leads (Clicked but not booked) */}
          <div className={theme.components.card}>
            <h2 className={`text-xl font-bold mb-4 ${theme.core.white}`}>
              Hot <span className={theme.accents.primary.class}>Leads</span> (Clicked, Not Booked)
            </h2>
            <div className="space-y-3">
              {dashboardStats.topPerformers.leads.map((lead) => (
                <button
                  key={lead.id}
                  onClick={() => router.push(`/leads/${lead.id}`)}
                  className="w-full flex justify-between items-center p-3 border border-gray-700 rounded-lg hover:bg-gray-800 hover:border-pink-700 transition cursor-pointer"
                >
                  <div className="text-left">
                    <div className={`font-medium ${theme.core.white}`}>{lead.name}</div>
                    <div className={`text-sm ${theme.core.bodyText}`}>{lead.status}</div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <div className={`text-lg font-bold ${theme.accents.primary.class}`}>
                        Score: {lead.icpScore}
                      </div>
                      <div className="flex gap-2 items-center justify-end text-xs">
                        <MousePointerClick className={`h-3 w-3 ${theme.accents.secondary.class}`} />
                        <span className={theme.accents.secondary.class}>Clicked</span>
                      </div>
                    </div>
                    <ChevronRight className={`h-5 w-5 ${theme.accents.tertiary.class}`} />
                  </div>
                </button>
              ))}
              {dashboardStats.topPerformers.leads.length === 0 && (
                <p className={`text-center ${theme.core.bodyText} py-8`}>No hot leads yet</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon, 
  subtitle, 
  color = 'gray' 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  subtitle?: string;
  color?: 'gray' | 'primary' | 'secondary' | 'tertiary';
}) {
  const iconColors = {
    gray: theme.core.bodyText,
    primary: theme.accents.primary.class,
    secondary: theme.accents.secondary.class,
    tertiary: theme.accents.tertiary.class,
  };

  return (
    <div className={theme.components.card}>
      <div className="flex justify-between items-start mb-2">
        <div className={`text-sm font-medium ${theme.accents.tertiary.class} uppercase tracking-wider`}>{title}</div>
        <div className={iconColors[color]}>{icon}</div>
      </div>
      <div className={`text-3xl font-bold ${theme.core.white}`}>{value}</div>
      {subtitle && <div className={`text-sm ${theme.core.bodyText} mt-1`}>{subtitle}</div>}
    </div>
  );
}
