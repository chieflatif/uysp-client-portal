'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, AlertTriangle, Info, Tag } from 'lucide-react';
import { theme } from '@/theme';
import { useClient } from '@/contexts/ClientContext';
import CampaignList from '@/components/admin/CampaignList';
import CampaignForm from '@/components/admin/CampaignForm';
import CustomCampaignForm from '@/components/admin/CustomCampaignForm';
import {
  VALID_TYPE_FILTERS,
  VALID_STATUS_FILTERS,
  CAMPAIGN_TYPE_UI_TO_DB,
  CampaignTypeFilter,
  CampaignStatusFilter,
} from '@/lib/constants/campaigns';

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
  const router = useRouter();
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const { selectedClientId, isLoading: clientLoading } = useClient();

  // State for modals and forms
  const [showForm, setShowForm] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [newCampaignType, setNewCampaignType] = useState<'Standard' | 'Webinar'>('Standard');
  const [customCampaignMode, setCustomCampaignMode] = useState<'leadForm' | 'nurture'>('nurture');

  const [typeFilter, setTypeFilter] = useState<CampaignTypeFilter>('All');
  const [statusFilter, setStatusFilter] = useState<CampaignStatusFilter>('All');

  // React Query: Fetch campaigns from server-side filtering API
  const {
    data: campaigns = [],
    isLoading: campaignsLoading,
    error: campaignsError,
    refetch: refetchCampaigns,
  } = useQuery<Campaign[]>({
    queryKey: ['campaigns', selectedClientId, typeFilter, statusFilter],
    queryFn: async () => {
      if (!selectedClientId) return []; // Don't fetch if no client selected

      // Translate UI filter to DB value
      const typeDbFilter = CAMPAIGN_TYPE_UI_TO_DB[typeFilter] || 'All';

      const response = await fetch(
        `/api/admin/campaigns?clientId=${selectedClientId}&type=${typeDbFilter}&status=${statusFilter}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }
      const data = await response.json();
      return data.campaigns || [];
    },
    enabled: !!selectedClientId, // Only run query if a client is selected
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

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

  // Mutations for pausing and deleting campaigns
  const togglePauseMutation = useMutation({
    mutationFn: async ({ campaignId, isPaused }: { campaignId: string; isPaused: boolean }) => {
      // ... (implementation)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      // ... (implementation)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  });


  const handleFilterChange = useCallback(
    (type: CampaignTypeFilter, status: CampaignStatusFilter) => {
      setTypeFilter(type);
      setStatusFilter(status);
    },
    [] // No dependencies, function is stable
  );

  const handleEditCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    if (campaign.campaignType === 'Webinar') {
      setShowForm(true);
    } else {
      // For 'Standard' or 'Custom', we might use the custom form
      setCustomCampaignMode(campaign.campaignType === 'Standard' ? 'leadForm' : 'nurture');
      setShowCustomForm(true);
    }
  };

  const handleTogglePause = (campaignId: string, isPaused: boolean) => {
    togglePauseMutation.mutate({ campaignId, isPaused: !isPaused });
  };

  const handleDelete = (campaignId: string) => {
    if (confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      deleteMutation.mutate(campaignId);
    }
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

  if (status === 'loading' || clientLoading) {
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
    <main className={`min-h-screen ${theme.core.darkBg} p-8`}>
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

        {/* Informational Alert for Client Selection */}
        {!selectedClientId && (
          <div
            className={`flex items-center gap-3 p-4 rounded-lg border ${theme.accents.primary.class.replace('text-', 'border-')} bg-cyan-900/20`}
          >
            <Info className={`h-5 w-5 ${theme.accents.primary.class}`} />
            <p className={`text-sm ${theme.core.bodyText}`}>
              Please select a client from the top navigation to view and manage campaigns.
            </p>
          </div>
        )}

        {/* Loading and Error States */}
        {campaignsLoading && selectedClientId && (
          <div className={`text-center py-12 ${theme.core.bodyText}`}>Loading campaigns...</div>
        )}
        {campaignsError && (
          <div
            className={`flex items-center gap-3 p-4 rounded-lg border border-red-500/50 bg-red-900/20 text-red-300`}
          >
            <AlertTriangle className="h-5 w-5" />
            <p className="text-sm">
              Failed to load campaigns: {campaignsError.message}
            </p>
          </div>
        )}

        {/* Campaign List (only render if client is selected and no error) */}
        {selectedClientId && !campaignsError && (
          <CampaignList
            campaigns={campaigns}
            onEdit={handleEditCampaign}
            onTogglePause={handleTogglePause}
            onDelete={handleDelete}
            onFilterChange={handleFilterChange}
          />
        )}

        {/* Campaign Form Modal (for Webinars) */}
        {showForm && selectedClientId && (
          <CampaignForm
            campaign={editingCampaign}
            clientId={selectedClientId}
            onClose={handleCloseForm}
            onSuccess={handleFormSuccess}
            initialCampaignType={newCampaignType}
          />
        )}

        {/* Custom Campaign Form Modal (for Lead Forms & Nurture) */}
        {showCustomForm && selectedClientId && (
          <CustomCampaignForm
            campaign={editingCampaign}
            clientId={selectedClientId}
            onClose={handleCloseForm}
            onSuccess={handleFormSuccess}
            mode={customCampaignMode}
          />
        )}
      </div>
    </main>
  );
}
