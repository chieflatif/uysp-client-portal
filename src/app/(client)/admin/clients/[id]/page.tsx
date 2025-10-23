'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  Pause,
  Trash2,
  Plus,
  Users,
  Activity,
  Database,
  Briefcase,
  BarChart3
} from 'lucide-react';
import { theme } from '@/theme';
import ProjectManagementEmbed from '@/components/ProjectManagementEmbed';

interface Client {
  id: string;
  companyName: string;
  email: string;
  phone: string | null;
  airtableBaseId: string;
  isActive: boolean;
  lastSyncAt: string | null;
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface CampaignStats {
  totalLeads: number;
  pausedLeads: number;
  activeLeads: number;
}

interface ClientHealth {
  client: {
    id: string;
    companyName: string;
    lastSyncAt: string | null;
  };
  leads: {
    total: number;
    paused: number;
    claimed: number;
    unclaimed: number;
    active: number;
  };
  recentActivity: Array<{
    action: string;
    details: string | null;
    createdAt: string;
  }>;
}

interface CampaignWithAnalytics {
  campaignName: string;
  totalLeads: number;
  claimed: number;
  unclaimed: number;
  paused: number;
  active: number;
  lastUpdated: string | null;
}

export default function ClientDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignStats | null>(null);
  const [health, setHealth] = useState<ClientHealth | null>(null);
  const [campaignsWithAnalytics, setCampaignsWithAnalytics] = useState<CampaignWithAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showPauseCampaigns, setShowPauseCampaigns] = useState(false);
  const [showDeactivateClient, setShowDeactivateClient] = useState(false);

  // Form states
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'CLIENT' as 'CLIENT' | 'ADMIN',
  });

  const [pauseReason, setPauseReason] = useState('');
  const [deactivateReason, setDeactivateReason] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ fetched: 0, inserted: 0, updated: 0, percentage: 0 });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'project'>('overview');

  // Time period filter for campaigns
  const [campaignsPeriod, setCampaignsPeriod] = useState<'all' | '7d' | '30d'>('all');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (session?.user?.role !== 'SUPER_ADMIN' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    fetchClientData();
  }, [status, session, router, clientId]);

  // Refetch campaigns when period changes
  useEffect(() => {
    if (clientId) {
      const fetchCampaignsOnly = async () => {
        try {
          const campaignsAnalyticsRes = await fetch(`/api/admin/clients/${clientId}/campaigns?period=${campaignsPeriod}`);
          if (campaignsAnalyticsRes.ok) {
            const campaignsData = await campaignsAnalyticsRes.json();
            setCampaignsWithAnalytics(campaignsData.campaigns || []);
          }
        } catch (error) {
          console.error('Error fetching campaigns:', error);
        }
      };
      fetchCampaignsOnly();
    }
  }, [campaignsPeriod, clientId]);

  const fetchClientData = async () => {
    try {
      setLoading(true);

      // PERFORMANCE: Parallel API calls instead of sequential (saves 600-1200ms)
      const [clientRes, usersRes, campaignsRes, healthRes, campaignsAnalyticsRes] = await Promise.all([
        fetch(`/api/admin/clients/${clientId}`),
        fetch(`/api/admin/users?clientId=${clientId}`),
        fetch(`/api/admin/campaigns?clientId=${clientId}`),
        fetch(`/api/admin/clients/${clientId}/health`),
        fetch(`/api/admin/clients/${clientId}/campaigns?period=${campaignsPeriod}`),
      ]);

      // Process responses
      if (clientRes.ok) {
        const clientData = await clientRes.json();
        setClient(clientData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }

      if (campaignsRes.ok) {
        const campaignsData = await campaignsRes.json();
        setCampaigns(campaignsData);
      }

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealth(healthData);
      }

      if (campaignsAnalyticsRes.ok) {
        const campaignsData = await campaignsAnalyticsRes.json();
        setCampaignsWithAnalytics(campaignsData.campaigns || []);
      }
    } catch (error) {
      console.error('Error fetching client data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!newUser.email.trim() || !newUser.email.includes('@')) {
      setError('Valid email is required');
      return;
    }
    if (newUser.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!newUser.firstName.trim() || !newUser.lastName.trim()) {
      setError('First and last name are required');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newUser,
          clientId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create user');
        return;
      }

      setSuccess(`User "${newUser.firstName} ${newUser.lastName}" created successfully!`);
      setNewUser({ email: '', password: '', firstName: '', lastName: '', role: 'CLIENT' });
      setShowAddUser(false);
      
      fetchClientData();
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePauseCampaigns = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setSubmitting(true);
      const response = await fetch('/api/admin/campaigns/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          reason: pauseReason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to pause campaigns');
        return;
      }

      setSuccess(`Campaigns paused (${data.affectedLeadsCount} leads)`);
      setPauseReason('');
      setShowPauseCampaigns(false);
      
      fetchClientData();
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setSubmitting(true);
      const response = await fetch(`/api/admin/clients/${clientId}/deactivate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: deactivateReason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to deactivate client');
        return;
      }

      setSuccess('Client deactivated successfully.');
      setShowDeactivateClient(false);
      
      setTimeout(() => {
        router.push('/admin');
      }, 1500);
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivateUser = async (userId: string, userName: string) => {
    if (!confirm(`Deactivate ${userName}?`)) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}/deactivate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to deactivate user');
        return;
      }

      setSuccess(`${userName} deactivated successfully.`);
      fetchClientData();
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  const handleSyncData = async () => {
    if (!confirm(`Sync all data from Airtable for ${client?.companyName}? This may take 1-2 minutes.`)) return;

    setError('');
    setSuccess('');
    setSyncing(true);
    setSyncProgress({ fetched: 0, inserted: 0, updated: 0, percentage: 0 });

    try {
      const response = await fetch('/api/admin/sync-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      });

      if (!response.ok) {
        setError('Failed to start sync');
        setSyncing(false);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        setError('Failed to stream sync progress');
        setSyncing(false);
        return;
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'progress') {
              setSyncProgress({
                fetched: data.totalFetched,
                inserted: data.totalInserted,
                updated: data.totalUpdated,
                percentage: data.percentage,
              });
            } else if (data.type === 'complete') {
              setSuccess(`Sync complete! Fetched: ${data.totalFetched}, Inserted: ${data.totalInserted}, Updated: ${data.totalUpdated}, Errors: ${data.errors}`);
              setSyncing(false);
              setTimeout(() => fetchClientData(), 1000);
            } else if (data.type === 'error') {
              setError(data.error || 'Sync failed');
              setSyncing(false);
            }
          }
        }
      }
    } catch (error) {
      setError('Network error during sync');
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${theme.core.darkBg} flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className={`${theme.core.bodyText} text-sm`}>Loading client details...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className={`min-h-screen ${theme.core.darkBg} p-8`}>
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push('/admin')}
            className={`flex items-center gap-2 ${theme.accents.primary.class} hover:text-white mb-8`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </button>
          <p className={`${theme.core.bodyText} text-center`}>Client not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.core.darkBg} p-8`}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <button
            onClick={() => router.push('/admin')}
            className={`flex items-center gap-2 ${theme.accents.primary.class} hover:text-white mb-4`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className={`text-4xl font-bold ${theme.core.white}`}>
                {client.companyName}
              </h1>
              <p className={theme.core.bodyText}>{client.email}</p>
            </div>
            <div className="flex flex-col gap-2">
              {client.isActive ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm font-semibold">
                  <XCircle className="w-4 h-4" />
                  Inactive
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-semibold transition flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-b-2 border-cyan-400 text-cyan-400'
                : `${theme.core.bodyText} hover:text-white`
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('project')}
            className={`px-6 py-3 font-semibold transition flex items-center gap-2 ${
              activeTab === 'project'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : `${theme.core.bodyText} hover:text-white`
            }`}
          >
            <Briefcase className="w-5 h-5" />
            Project Management
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="p-4 rounded-lg bg-green-900/20 border border-green-600/50 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-green-300 font-medium">{success}</p>
            </div>
            <button onClick={() => setSuccess('')} className="text-green-400 hover:text-green-300">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-red-900/20 border border-red-600/50 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-300 font-medium">{error}</p>
            </div>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-300">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
        {/* Client Info */}
        <div className={theme.components.card}>
          <h2 className={`text-xl font-bold ${theme.core.white} mb-4`}>Client Information</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className={`text-sm ${theme.accents.tertiary.class} uppercase tracking-wider mb-1`}>
                Airtable Base ID
              </p>
              <p className={`font-mono ${theme.core.white}`}>{client.airtableBaseId}</p>
            </div>
            <div>
              <p className={`text-sm ${theme.accents.tertiary.class} uppercase tracking-wider mb-1`}>
                Last Sync
              </p>
              <p className={theme.core.bodyText}>
                {client.lastSyncAt ? new Date(client.lastSyncAt).toLocaleString() : 'Never'}
              </p>
            </div>
            <div>
              <p className={`text-sm ${theme.accents.tertiary.class} uppercase tracking-wider mb-1`}>
                Phone
              </p>
              <p className={theme.core.bodyText}>{client.phone || 'Not provided'}</p>
            </div>
            <div>
              <p className={`text-sm ${theme.accents.tertiary.class} uppercase tracking-wider mb-1`}>
                Created
              </p>
              <p className={theme.core.bodyText}>
                {new Date(client.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Campaign Stats */}
        {campaigns && (
          <div className="grid grid-cols-3 gap-4">
            <div className={`${theme.components.card} border-l-4 border-l-cyan-400`}>
              <p className={`text-sm ${theme.accents.tertiary.class} uppercase tracking-wider mb-1`}>Total Leads</p>
              <p className={`text-3xl font-bold ${theme.core.white}`}>
                {campaigns.totalLeads.toLocaleString()}
              </p>
            </div>
            <div className={`${theme.components.card} border-l-4 border-l-green-500`}>
              <p className={`text-sm text-green-400 uppercase tracking-wider mb-1`}>Active Leads</p>
              <p className={`text-3xl font-bold text-green-400`}>
                {campaigns.activeLeads.toLocaleString()}
              </p>
            </div>
            <div className={`${theme.components.card} border-l-4 border-l-orange-500`}>
              <p className={`text-sm text-orange-400 uppercase tracking-wider mb-1`}>Paused Leads</p>
              <p className={`text-3xl font-bold text-orange-400`}>
                {campaigns.pausedLeads.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Database Health */}
        {health && (
          <div className={theme.components.card}>
            <h2 className={`text-xl font-bold ${theme.core.white} mb-6 flex items-center gap-2`}>
              <Database className="w-5 h-5" />
              Database <span className={theme.accents.tertiary.class}>Health</span>
            </h2>
            
            <div className="grid grid-cols-5 gap-3 mb-6">
              <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                <p className={`text-xs ${theme.accents.tertiary.class} uppercase font-semibold mb-2`}>Total Leads</p>
                <p className={`text-2xl font-bold ${theme.core.white}`}>{health.leads.total.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                <p className={`text-xs text-green-400 uppercase font-semibold mb-2`}>Active</p>
                <p className="text-2xl font-bold text-green-400">{health.leads.active.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                <p className={`text-xs text-orange-400 uppercase font-semibold mb-2`}>Paused</p>
                <p className="text-2xl font-bold text-orange-400">{health.leads.paused.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                <p className={`text-xs text-blue-400 uppercase font-semibold mb-2`}>Claimed</p>
                <p className="text-2xl font-bold text-blue-400">{health.leads.claimed.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                <p className={`text-xs text-purple-400 uppercase font-semibold mb-2`}>Unclaimed</p>
                <p className="text-2xl font-bold text-purple-400">{health.leads.unclaimed.toLocaleString()}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-700">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  {health.client.lastSyncAt ? (
                    <>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <p className={`text-sm ${theme.core.bodyText}`}>
                        <span className="font-semibold">Last Sync:</span> {new Date(health.client.lastSyncAt).toLocaleString()}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <p className={`text-sm ${theme.core.bodyText}`}>
                        <span className="font-semibold">Last Sync:</span> Never synced
                      </p>
                    </>
                  )}
                </div>
              </div>

              {health.recentActivity.length > 0 && (
                <div>
                  <p className={`text-sm font-semibold ${theme.accents.tertiary.class} uppercase mb-3`}>Recent Activity</p>
                  <div className="space-y-2">
                    {health.recentActivity.map((activity, idx) => (
                      <div key={idx} className="p-2 rounded bg-gray-800/30 border border-gray-700/50">
                        <div className="flex justify-between items-start">
                          <p className={`text-xs font-mono ${theme.accents.secondary.class}`}>{activity.action}</p>
                          <p className={`text-xs ${theme.core.bodyText}`}>
                            {new Date(activity.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        {activity.details && (
                          <p className={`text-xs ${theme.core.bodyText} mt-1`}>{activity.details}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Campaigns Analytics */}
        {campaignsWithAnalytics.length > 0 && (
          <div className={theme.components.card}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-bold ${theme.core.white} flex items-center gap-2`}>
                <Activity className="w-5 h-5" />
                Campaigns <span className={theme.accents.primary.class}>Analytics</span>
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setCampaignsPeriod('all')}
                  className={`px-3 py-1 rounded text-sm font-semibold transition ${
                    campaignsPeriod === 'all'
                      ? 'bg-cyan-600 text-white'
                      : `${theme.components.button.ghost}`
                  }`}
                >
                  All Time
                </button>
                <button
                  onClick={() => setCampaignsPeriod('7d')}
                  className={`px-3 py-1 rounded text-sm font-semibold transition ${
                    campaignsPeriod === '7d'
                      ? 'bg-cyan-600 text-white'
                      : `${theme.components.button.ghost}`
                  }`}
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => setCampaignsPeriod('30d')}
                  className={`px-3 py-1 rounded text-sm font-semibold transition ${
                    campaignsPeriod === '30d'
                      ? 'bg-cyan-600 text-white'
                      : `${theme.components.button.ghost}`
                  }`}
                >
                  Last 30 Days
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className={`text-left py-3 px-4 ${theme.accents.tertiary.class} text-xs uppercase tracking-wider font-semibold`}>
                      Campaign Name
                    </th>
                    <th className={`text-right py-3 px-4 ${theme.accents.tertiary.class} text-xs uppercase tracking-wider font-semibold`}>
                      Total Leads
                    </th>
                    <th className={`text-right py-3 px-4 text-green-400 text-xs uppercase tracking-wider font-semibold`}>
                      Active
                    </th>
                    <th className={`text-right py-3 px-4 text-orange-400 text-xs uppercase tracking-wider font-semibold`}>
                      Paused
                    </th>
                    <th className={`text-right py-3 px-4 text-blue-400 text-xs uppercase tracking-wider font-semibold`}>
                      Claimed
                    </th>
                    <th className={`text-right py-3 px-4 text-purple-400 text-xs uppercase tracking-wider font-semibold`}>
                      Unclaimed
                    </th>
                    <th className={`text-left py-3 px-4 ${theme.accents.tertiary.class} text-xs uppercase tracking-wider font-semibold`}>
                      Last Updated
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {campaignsWithAnalytics.map((campaign) => (
                    <tr key={campaign.campaignName} className="hover:bg-gray-800 transition">
                      <td className={`py-3 px-4 font-medium ${theme.core.white}`}>
                        {campaign.campaignName || 'Unknown Campaign'}
                      </td>
                      <td className={`text-right py-3 px-4 ${theme.core.white} font-semibold`}>
                        {campaign.totalLeads.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4 text-green-400 font-semibold">
                        {campaign.active.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4 text-orange-400 font-semibold">
                        {campaign.paused.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4 text-blue-400 font-semibold">
                        {campaign.claimed.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4 text-purple-400 font-semibold">
                        {campaign.unclaimed.toLocaleString()}
                      </td>
                      <td className={`py-3 px-4 text-sm ${theme.core.bodyText}`}>
                        {campaign.lastUpdated 
                          ? new Date(campaign.lastUpdated).toLocaleDateString()
                          : 'Never'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sync Progress Bar */}
        {syncing && (
          <div className={theme.components.card}>
            <h3 className={`text-lg font-bold ${theme.core.white} mb-4`}>Syncing Data from Airtable...</h3>
            <div className="space-y-3">
              <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${syncProgress.percentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className={theme.core.bodyText}>Fetched: {syncProgress.fetched.toLocaleString()}</span>
                <span className={theme.core.white}>{syncProgress.percentage}%</span>
                <span className={theme.core.bodyText}>Inserted: {syncProgress.inserted} | Updated: {syncProgress.updated}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 flex-wrap">
          <button
            onClick={handleSyncData}
            disabled={syncing}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Activity className="w-5 h-5" />
                Sync Data
              </>
            )}
          </button>
          <button
            onClick={() => setShowPauseCampaigns(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold transition"
          >
            <Pause className="w-5 h-5" />
            Pause Campaigns
          </button>
          <button
            onClick={() => setShowDeactivateClient(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition"
          >
            <Trash2 className="w-5 h-5" />
            Deactivate Client
          </button>
        </div>

        {/* Users Section */}
        <div className={theme.components.card}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-bold ${theme.core.white} flex items-center gap-2`}>
              <Users className="w-5 h-5" />
              Users
            </h2>
            <button
              onClick={() => setShowAddUser(true)}
              className={`${theme.components.button.secondary} flex items-center gap-2`}
            >
              <Plus className="w-4 h-4" />
              Add User
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className={`text-left py-3 px-4 ${theme.accents.tertiary.class} text-xs uppercase tracking-wider font-semibold`}>
                    Name
                  </th>
                  <th className={`text-left py-3 px-4 ${theme.accents.tertiary.class} text-xs uppercase tracking-wider font-semibold`}>
                    Email
                  </th>
                  <th className={`text-left py-3 px-4 ${theme.accents.tertiary.class} text-xs uppercase tracking-wider font-semibold`}>
                    Role
                  </th>
                  <th className={`text-center py-3 px-4 ${theme.accents.tertiary.class} text-xs uppercase tracking-wider font-semibold`}>
                    Status
                  </th>
                  <th className={`text-center py-3 px-4 ${theme.accents.tertiary.class} text-xs uppercase tracking-wider font-semibold`}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-800 transition">
                    <td className={`py-3 px-4 font-medium ${theme.core.white}`}>
                      {user.firstName} {user.lastName}
                    </td>
                    <td className={`py-3 px-4 ${theme.core.bodyText}`}>
                      {user.email}
                    </td>
                    <td className={`py-3 px-4 ${theme.accents.secondary.class}`}>
                      {user.role}
                    </td>
                    <td className="text-center py-3 px-4">
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold">
                          <XCircle className="w-3 h-3" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="text-center py-3 px-4">
                      {user.isActive && (
                        <button
                          onClick={() => handleDeactivateUser(user.id, `${user.firstName} ${user.lastName}`)}
                          className="text-red-400 hover:text-red-300 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className={`py-12 text-center ${theme.core.bodyText}`}>
                      No users yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add User Modal */}
        {showAddUser && (
          <div className={theme.components.card}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-bold ${theme.core.white}`}>
                Add New <span className={theme.accents.secondary.class}>User</span>
              </h2>
              <button
                onClick={() => {
                  setShowAddUser(false);
                  setError('');
                  setNewUser({ email: '', password: '', firstName: '', lastName: '', role: 'CLIENT' });
                }}
                className={`text-sm ${theme.core.bodyText} hover:text-white`}
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${theme.accents.tertiary.class} mb-2`}>
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    className={theme.components.input}
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${theme.accents.tertiary.class} mb-2`}>
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    className={theme.components.input}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.accents.tertiary.class} mb-2`}>
                  Email *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className={theme.components.input}
                  placeholder="user@company.com"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.accents.tertiary.class} mb-2`}>
                  Password *
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className={theme.components.input}
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.accents.tertiary.class} mb-2`}>
                  Role *
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'CLIENT' | 'ADMIN' })}
                  className={theme.components.input}
                >
                  <option value="CLIENT">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className={theme.components.button.secondary}
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    'Create User'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className={theme.components.button.ghost}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Pause Campaigns Modal */}
        {showPauseCampaigns && (
          <div className={theme.components.card}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-bold ${theme.core.white}`}>
                Pause <span className={theme.accents.primary.class}>Campaigns</span>
              </h2>
              <button
                onClick={() => {
                  setShowPauseCampaigns(false);
                  setError('');
                  setPauseReason('');
                }}
                className={`text-sm ${theme.core.bodyText} hover:text-white`}
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handlePauseCampaigns} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${theme.accents.tertiary.class} mb-2`}>
                  Reason (Optional)
                </label>
                <input
                  type="text"
                  value={pauseReason}
                  onChange={(e) => setPauseReason(e.target.value)}
                  className={theme.components.input}
                  placeholder="e.g., Client requested pause"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className={theme.components.button.primary}
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Pausing...
                    </span>
                  ) : (
                    'Pause Campaigns'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPauseCampaigns(false)}
                  className={theme.components.button.ghost}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Deactivate Client Modal */}
        {showDeactivateClient && (
          <div className={theme.components.card}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-bold text-red-400`}>
                Deactivate <span className={`${theme.accents.primary.class}`}>Client</span>
              </h2>
              <button
                onClick={() => {
                  setShowDeactivateClient(false);
                  setError('');
                  setDeactivateReason('');
                }}
                className={`text-sm ${theme.core.bodyText} hover:text-white`}
              >
                Cancel
              </button>
            </div>

            <p className={`${theme.core.bodyText} mb-4`}>
              Warning: This will deactivate {client.companyName} and all associated users. This action cannot be undone without manual intervention.
            </p>

            <form onSubmit={handleDeactivateClient} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${theme.accents.tertiary.class} mb-2`}>
                  Reason (Optional)
                </label>
                <input
                  type="text"
                  value={deactivateReason}
                  onChange={(e) => setDeactivateReason(e.target.value)}
                  className={theme.components.input}
                  placeholder="e.g., Client requested"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deactivating...
                    </span>
                  ) : (
                    'Confirm Deactivation'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeactivateClient(false)}
                  className={theme.components.button.ghost}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
          </>
        )}

        {/* Project Management Tab */}
        {activeTab === 'project' && (
          <ProjectManagementEmbed clientId={clientId} />
        )}
      </div>
    </div>
  );
}
