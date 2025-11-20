'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { theme } from '@/theme';
import CampaignForm from '@/components/admin/CampaignForm';
import CampaignList from '@/components/admin/CampaignList';

interface Campaign {
  id: string;
  clientId: string;
  name: string;
  campaignType: 'Webinar' | 'Standard' | 'Custom';
  formId: string;
  isPaused: boolean;
  webinarDatetime?: string | null;
  zoomLink?: string | null;
  resourceLink?: string | null;
  resourceName?: string | null;
  messagesSent: number;
  totalLeads: number;
  createdAt: string;
  updatedAt: string;
}

interface Client {
  id: string;
  companyName: string;
}

export default function CampaignsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (
      status === 'authenticated' &&
      !['SUPER_ADMIN', 'ADMIN', 'CLIENT_ADMIN', 'CLIENT', 'CLIENT_USER'].includes(session?.user?.role || '')
    ) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  // Set default client ID
  useEffect(() => {
    if (session?.user?.clientId && !selectedClientId) {
      setSelectedClientId(session.user.clientId);
    }
  }, [session, selectedClientId]);

  // Fetch clients (SUPER_ADMIN only)
  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await fetch('/api/admin/clients');
      if (!response.ok) throw new Error('Failed to fetch clients');
      const data = await response.json();
      return data.clients || [];
    },
    enabled: status === 'authenticated' && session?.user?.role === 'SUPER_ADMIN',
  });

  const clients: Client[] = clientsData || [];

  // Fetch campaigns
  const {
    data: campaignsData,
    isLoading: loadingCampaigns,
    refetch: refetchCampaigns,
  } = useQuery({
    queryKey: ['campaigns', selectedClientId],
    queryFn: async () => {
      const url = selectedClientId
        ? `/api/admin/campaigns?clientId=${selectedClientId}`
        : '/api/admin/campaigns';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      const data = await response.json();
      return data.campaigns || [];
    },
    enabled: status === 'authenticated' && Boolean(selectedClientId),
  });

  const campaigns: Campaign[] = campaignsData || [];

  // Toggle pause mutation
  const togglePauseMutation = useMutation({
    mutationFn: async ({ campaignId, isPaused }: { campaignId: string; isPaused: boolean }) => {
      const response = await fetch(`/api/admin/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaused }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update campaign');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await fetch(`/api/admin/campaigns/${campaignId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete campaign');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  const handleTogglePause = (campaignId: string, currentPaused: boolean) => {
    togglePauseMutation.mutate({ campaignId, isPaused: !currentPaused });
  };

  const handleDelete = (campaignId: string) => {
    deleteMutation.mutate(campaignId);
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCampaign(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingCampaign(null);
    refetchCampaigns();
  };

  if (status === 'loading' || loadingCampaigns) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${theme.core.darkBg}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400" />
          <p className={`${theme.core.bodyText} text-sm`}>Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.core.darkBg} p-8`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-4xl font-bold ${theme.core.white} mb-2`}>
              Campaign <span className={theme.accents.primary.class}>Management</span>
            </h1>
            <p className={theme.core.bodyText}>
              Create and manage webinar and standard campaigns
            </p>
          </div>
          <button
            onClick={() => {
              setEditingCampaign(null);
              setShowForm(true);
            }}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition ${theme.accents.primary.bgClass} hover:bg-green-600`}
          >
            <Plus className="h-5 w-5" />
            New Campaign
          </button>
        </div>

        {/* Client Selector (SUPER_ADMIN only) */}
        {session?.user?.role === 'SUPER_ADMIN' && clients.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <label className={`block text-sm font-semibold ${theme.accents.tertiary.class} mb-2`}>
              Select Client
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className={`${theme.components.input} w-full max-w-md`}
            >
              <option value="">-- Select a client --</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.companyName}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className={`text-xs ${theme.accents.tertiary.class} font-semibold uppercase mb-1`}>
              Total Campaigns
            </p>
            <p className={`text-2xl font-bold ${theme.core.white}`}>
              {campaigns.length}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className={`text-xs text-green-400 font-semibold uppercase mb-1`}>
              Active
            </p>
            <p className={`text-2xl font-bold ${theme.core.white}`}>
              {campaigns.filter((c) => !c.isPaused).length}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className={`text-xs text-purple-400 font-semibold uppercase mb-1`}>
              Webinars
            </p>
            <p className={`text-2xl font-bold ${theme.core.white}`}>
              {campaigns.filter((c) => c.campaignType === 'Webinar').length}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className={`text-xs text-blue-400 font-semibold uppercase mb-1`}>
              Standard
            </p>
            <p className={`text-2xl font-bold ${theme.core.white}`}>
              {campaigns.filter((c) => c.campaignType === 'Standard').length}
            </p>
          </div>
        </div>

        {/* Campaign List */}
        {selectedClientId ? (
          <CampaignList
            campaigns={campaigns}
            onEdit={handleEdit}
            onTogglePause={handleTogglePause}
            onDelete={handleDelete}
          />
        ) : (
          <div className="bg-gray-800 rounded-lg p-12 border border-gray-700 text-center">
            <p className={`${theme.core.bodyText} text-lg`}>
              Please select a client to view campaigns
            </p>
          </div>
        )}

        {/* Campaign Form Modal */}
        {showForm && (
          <CampaignForm
            campaign={editingCampaign}
            clientId={selectedClientId}
            onClose={handleCloseForm}
            onSuccess={handleFormSuccess}
          />
        )}
      </div>
    </div>
  );
}
