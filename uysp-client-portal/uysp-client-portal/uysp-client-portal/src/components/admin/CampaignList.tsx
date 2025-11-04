'use client';

import { useState } from 'react';
import { theme } from '@/theme';
import { Edit, Pause, Play, Trash2 } from 'lucide-react';

interface Campaign {
  id: string;
  clientId: string;
  name: string;
  campaignType: 'Webinar' | 'Standard';
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

interface CampaignListProps {
  campaigns: Campaign[];
  onEdit: (campaign: Campaign) => void;
  onTogglePause: (campaignId: string, currentPaused: boolean) => void;
  onDelete: (campaignId: string) => void;
}

export default function CampaignList({
  campaigns,
  onEdit,
  onTogglePause,
  onDelete,
}: CampaignListProps) {
  const [typeFilter, setTypeFilter] = useState<'All' | 'Webinar' | 'Standard'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Paused'>('All');

  // Apply filters
  const filteredCampaigns = campaigns.filter((campaign) => {
    if (typeFilter !== 'All' && campaign.campaignType !== typeFilter) {
      return false;
    }
    if (statusFilter === 'Active' && campaign.isPaused) {
      return false;
    }
    if (statusFilter === 'Paused' && !campaign.isPaused) {
      return false;
    }
    return true;
  });

  const formatDate = (date: string | null | undefined): string => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex gap-2">
          <span className={`text-sm font-semibold ${theme.accents.tertiary.class} self-center`}>
            Type:
          </span>
          {(['All', 'Webinar', 'Standard'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                typeFilter === type
                  ? type === 'Webinar'
                    ? 'bg-purple-600 text-white'
                    : type === 'Standard'
                    ? `${theme.accents.primary.bgClass} text-white`
                    : `${theme.accents.tertiary.bgClass} text-gray-900`
                  : `bg-gray-700 ${theme.core.bodyText} hover:bg-gray-600`
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <span className={`text-sm font-semibold ${theme.accents.tertiary.class} self-center`}>
            Status:
          </span>
          {(['All', 'Active', 'Paused'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                statusFilter === status
                  ? status === 'Active'
                    ? 'bg-green-600 text-white'
                    : status === 'Paused'
                    ? 'bg-gray-600 text-white'
                    : `${theme.accents.tertiary.bgClass} text-gray-900`
                  : `bg-gray-700 ${theme.core.bodyText} hover:bg-gray-600`
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Campaign Count */}
      <div className={`text-sm ${theme.core.bodyText}`}>
        Showing {filteredCampaigns.length} of {campaigns.length} campaigns
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900 border-b border-gray-700">
            <tr>
              <th className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase tracking-wider`}>
                Campaign
              </th>
              <th className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase tracking-wider`}>
                Type
              </th>
              <th className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase tracking-wider`}>
                Form ID
              </th>
              <th className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase tracking-wider`}>
                Status
              </th>
              <th className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase tracking-wider`}>
                Webinar Date
              </th>
              <th className={`px-6 py-4 text-center text-xs font-semibold ${theme.accents.tertiary.class} uppercase tracking-wider`}>
                Leads
              </th>
              <th className={`px-6 py-4 text-center text-xs font-semibold ${theme.accents.tertiary.class} uppercase tracking-wider`}>
                Messages
              </th>
              <th className={`px-6 py-4 text-center text-xs font-semibold ${theme.accents.tertiary.class} uppercase tracking-wider`}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filteredCampaigns.length === 0 ? (
              <tr>
                <td colSpan={8} className={`px-6 py-12 text-center ${theme.core.bodyText}`}>
                  No campaigns found
                </td>
              </tr>
            ) : (
              filteredCampaigns.map((campaign) => (
                <tr
                  key={campaign.id}
                  className="hover:bg-gray-700 transition"
                >
                  {/* Campaign Name */}
                  <td className="px-6 py-4">
                    <div className={`font-semibold ${theme.core.white}`}>
                      {campaign.name}
                    </div>
                    <div className={`text-xs ${theme.core.bodyText} mt-0.5`}>
                      Created {formatDate(campaign.createdAt)}
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        campaign.campaignType === 'Webinar'
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      {campaign.campaignType}
                    </span>
                  </td>

                  {/* Form ID */}
                  <td className={`px-6 py-4 text-sm ${theme.core.bodyText}`}>
                    <code className="bg-gray-900 px-2 py-1 rounded text-xs">
                      {campaign.formId}
                    </code>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        campaign.isPaused
                          ? 'bg-gray-600 text-gray-300'
                          : 'bg-green-500/20 text-green-400'
                      }`}
                    >
                      {campaign.isPaused ? 'Paused' : 'Active'}
                    </span>
                  </td>

                  {/* Webinar Date */}
                  <td className={`px-6 py-4 text-sm ${theme.core.bodyText}`}>
                    {campaign.campaignType === 'Webinar' && campaign.webinarDatetime
                      ? formatDate(campaign.webinarDatetime)
                      : '—'}
                  </td>

                  {/* Leads Count */}
                  <td className={`px-6 py-4 text-center text-sm ${theme.core.white} font-semibold`}>
                    {campaign.totalLeads}
                  </td>

                  {/* Messages Sent */}
                  <td className={`px-6 py-4 text-center text-sm ${theme.core.white} font-semibold`}>
                    {campaign.messagesSent}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onEdit(campaign)}
                        className={`p-2 rounded ${theme.accents.tertiary.class} hover:bg-cyan-400/10 transition`}
                        title="Edit campaign"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onTogglePause(campaign.id, campaign.isPaused)}
                        className={`p-2 rounded ${
                          campaign.isPaused
                            ? 'text-green-400 hover:bg-green-400/10'
                            : 'text-yellow-400 hover:bg-yellow-400/10'
                        } transition`}
                        title={campaign.isPaused ? 'Activate campaign' : 'Pause campaign'}
                      >
                        {campaign.isPaused ? (
                          <Play className="h-4 w-4" />
                        ) : (
                          <Pause className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to deactivate "${campaign.name}"?`)) {
                            onDelete(campaign.id);
                          }
                        }}
                        className="p-2 rounded text-red-400 hover:bg-red-400/10 transition"
                        title="Deactivate campaign"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
