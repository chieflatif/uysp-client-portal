'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Tag } from 'lucide-react';
import { theme } from '@/theme';
import { useClient } from '@/contexts/ClientContext';
import CampaignForm from '@/components/admin/CampaignForm';
import CustomCampaignForm from '@/components/admin/CustomCampaignForm';
import CampaignList from '@/components/admin/CampaignList';

interface Campaign {
  id: string;
  clientId: string;
  name: string;
  campaignType: 'Webinar' | 'Standard' | 'Custom';
  formId?: string;
  isPaused: boolean;
  webinarDatetime?: string | null;
  zoomLink?: string | null;
  resourceLink?: string | null;
  resourceName?: string | null;
  messagesSent: number;
  totalLeads: number;
  createdAt: string;
  updatedAt: string;
  // Custom campaign fields
  targetTags?: string[];
  enrollmentStatus?: 'scheduled' | 'active' | 'paused' | 'completed';
  leadsEnrolled?: number;
}

export default function CampaignsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { selectedClientId, isLoading: clientLoading } = useClient();

  const [showForm, setShowForm] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [newCampaignType, setNewCampaignType] = useState<'Standard' | 'Webinar'>('Standard');
  const [customCampaignMode, setCustomCampaignMode] = useState<'leadForm' | 'nurture'>('nurture');

  // SERVER-SIDE FILTER STATE
  const [typeFilter, setTypeFilter] = useState<'All' | 'Lead Form' | 'Webinar' | 'Nurture'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Paused'>('All');

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

  // CRITICAL FIX: Use selectedClientId from ClientContext (controlled by top nav dropdown)
  // SERVER-SIDE FILTERING: Include filter state in query key to trigger automatic refetch
  const {
    data: campaignsData,
    isLoading: loadingCampaigns,
    refetch: refetchCampaigns,
  } = useQuery({
    queryKey: ['campaigns', selectedClientId, typeFilter, statusFilter],
    queryFn: async () => {
      if (!selectedClientId) return [];

      // Build query params with filters
      const params = new URLSearchParams({
        clientId: selectedClientId,
        type: typeFilter,
        status: statusFilter,
      });

      const response = await fetch(`/api/admin/campaigns?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      const data = await response.json();
      return data.campaigns || [];
    },
    enabled: status === 'authenticated' && !clientLoading && Boolean(selectedClientId),
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
    // Only allow editing Standard/Webinar campaigns (Custom campaigns can't be edited)
    if (campaign.campaignType === 'Custom') {
      alert('Custom campaigns cannot be edited. Please create a new custom campaign instead.');
      return;
    }
    setEditingCampaign(campaign);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setShowCustomForm(false);
    setEditingCampaign(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setShowCustomForm(false);
    setEditingCampaign(null);
    refetchCampaigns();
  };

  /**
   * Handle filter changes from CampaignList component
   * Triggers server-side refetch via React Query when filter state changes
   * @param type - Campaign type filter ('All' | 'Lead Form' | 'Webinar' | 'Nurture')
   * @param status - Campaign status filter ('All' | 'Active' | 'Paused')
   */
  const handleFilterChange = useCallback((type: 'All' | 'Lead Form' | 'Webinar' | 'Nurture', status: 'All' | 'Active' | 'Paused') => {
    setTypeFilter(type);
    setStatusFilter(status);
  }, []); // Empty deps - function logic doesn't depend on any external values

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
              Create and manage lead form, webinar, and nurture campaigns
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setEditingCampaign(null);
                setCustomCampaignMode('leadForm');
                setShowCustomForm(true);
              }}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-white transition bg-green-600 hover:bg-green-700`}
            >
              <Plus className="h-5 w-5" />
              <div className="text-left">
                <div className="text-sm leading-tight">New Lead Form</div>
                <div className="text-sm leading-tight">Campaign</div>
              </div>
            </button>
            <button
              onClick={() => {
                setEditingCampaign(null);
                setNewCampaignType('Webinar');
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-white transition bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-5 w-5" />
              <div className="text-left">
                <div className="text-sm leading-tight">New Webinar</div>
                <div className="text-sm leading-tight">Campaign</div>
              </div>
            </button>
            <button
              onClick={() => {
                setEditingCampaign(null);
                setCustomCampaignMode('nurture');
                setShowCustomForm(true);
              }}
              className="flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-white transition bg-cyan-600 hover:bg-cyan-700"
            >
              <Tag className="h-5 w-5" />
              <div className="text-left">
                <div className="text-sm leading-tight">New Nurture</div>
                <div className="text-sm leading-tight">Campaign</div>
              </div>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4">
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
            <p className={`text-xs text-green-400 font-semibold uppercase mb-1`}>
              Lead Forms
            </p>
            <p className={`text-2xl font-bold ${theme.core.white}`}>
              {campaigns.filter((c) => c.campaignType === 'Standard').length}
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
            <p className={`text-xs text-cyan-400 font-semibold uppercase mb-1`}>
              Nurture
            </p>
            <p className={`text-2xl font-bold ${theme.core.white}`}>
              {campaigns.filter((c) => c.campaignType === 'Custom').length}
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
            onFilterChange={handleFilterChange}
          />
        ) : (
          <div className="bg-gray-800 rounded-lg p-12 border border-gray-700 text-center">
            <p className={`${theme.core.bodyText} text-lg`}>
              {clientLoading ? 'Loading client data...' : 'Please select a client from the top navigation'}
            </p>
          </div>
        )}

        {/* Campaign Form Modal */}
        {showForm && selectedClientId && (
          <CampaignForm
            campaign={editingCampaign}
            clientId={selectedClientId}
            onClose={handleCloseForm}
            onSuccess={handleFormSuccess}
            initialCampaignType={newCampaignType}
          />
        )}

        {/* Custom Campaign Form Modal */}
        {showCustomForm && selectedClientId && (
          <CustomCampaignForm
            clientId={selectedClientId}
            onClose={handleCloseForm}
            onSuccess={handleFormSuccess}
            mode={customCampaignMode}
          />
        )}
      </div>
    </div>
  );
}
