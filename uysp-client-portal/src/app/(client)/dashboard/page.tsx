'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { theme } from '@/lib/theme';
import { TrendingUp, Users, Target, Activity, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

interface DashboardStats {
  totalLeads: number;
  highIcpLeads: number;
  claimedLeads: number;
  avgIcpScore: number;
}

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    highIcpLeads: 0,
    claimedLeads: 0,
    avgIcpScore: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/leads');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch leads: ${response.status}`);
        }
        
        const data = await response.json();
        const leadsData = data.leads || [];

        interface Lead {
          icpScore: number;
          claimedBy?: string | null;
        }
        const highIcp = (leadsData as Lead[]).filter((l: Lead) => l.icpScore >= 70).length;
        const claimed = (leadsData as Lead[]).filter((l: Lead) => l.claimedBy).length;
        const avgScore = leadsData.length > 0
          ? Math.round(((leadsData as Lead[]).reduce((sum: number, l: Lead) => sum + l.icpScore, 0) / leadsData.length) * 10) / 10
          : 0;

        setStats({
          totalLeads: leadsData.length,
          highIcpLeads: highIcp,
          claimedLeads: claimed,
          avgIcpScore: avgScore,
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to load dashboard';
        console.error('Error fetching stats:', errorMsg);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [status]);

  if (status === 'loading' || loading) {
    return (
      <div className={`min-h-screen ${theme.core.darkBg} flex items-center justify-center`}>
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`${theme.components.card} border-l-4 border-l-cyan-400`}>
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-xs ${theme.core.bodyText} uppercase tracking-wider mb-1`}>
                  Total Leads
                </p>
                <p className={`text-3xl font-bold ${theme.core.white}`}>
                  {stats.totalLeads.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-cyan-400/10">
                <Users className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
          </div>

          <div className={`${theme.components.card} border-l-4 border-l-pink-700`}>
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-xs ${theme.accents.primary.class} uppercase tracking-wider mb-1`}>
                  High ICP (70+)
                </p>
                <p className={`text-3xl font-bold ${theme.core.white}`}>
                  {stats.highIcpLeads.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-pink-700/10">
                <Target className="w-6 h-6 text-pink-700" />
              </div>
            </div>
          </div>

          <div className={`${theme.components.card} border-l-4 border-l-indigo-600`}>
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-xs ${theme.accents.secondary.class} uppercase tracking-wider mb-1`}>
                  Claimed
                </p>
                <p className={`text-3xl font-bold ${theme.core.white}`}>
                  {stats.claimedLeads.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-indigo-600/10">
                <Activity className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className={`${theme.components.card} border-l-4 border-l-green-500`}>
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-xs text-green-400 uppercase tracking-wider mb-1`}>
                  Avg Score
                </p>
                <p className={`text-3xl font-bold ${theme.core.white}`}>
                  {stats.avgIcpScore}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </div>
        </div>

        <div className={theme.components.card}>
          <h2 className={`text-xl font-bold ${theme.core.white} mb-4`}>Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Link
              href="/leads"
              className={`flex items-center justify-between p-4 rounded-lg border border-gray-700 hover:border-cyan-400 transition ${theme.core.bodyText} hover:${theme.core.white}`}
            >
              <div>
                <p className="font-medium">View All Leads</p>
                <p className="text-sm opacity-75">Browse and manage leads</p>
              </div>
              <ArrowRight className="w-5 h-5 text-cyan-400" />
            </Link>
            <Link
              href="/settings"
              className={`flex items-center justify-between p-4 rounded-lg border border-gray-700 hover:border-cyan-400 transition ${theme.core.bodyText} hover:${theme.core.white}`}
            >
              <div>
                <p className="font-medium">Settings</p>
                <p className="text-sm opacity-75">Manage preferences</p>
              </div>
              <ArrowRight className="w-5 h-5 text-cyan-400" />
            </Link>
          </div>
        </div>

        <div className={theme.components.card}>
          <h2 className={`text-xl font-bold ${theme.core.white} mb-4`}>
            Recent <span className={theme.accents.primary.class}>Activity</span>
          </h2>
          <p className={theme.core.bodyText}>
            Activity log coming soon. Check back later for recent actions and updates.
          </p>
        </div>
      </div>
    </div>
  );
}
