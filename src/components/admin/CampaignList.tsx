'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { theme } from '@/theme';
import { Edit, Pause, Play, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Eye } from 'lucide-react';

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

interface CampaignListProps {
  campaigns: Campaign[];
  onEdit: (campaign: Campaign) => void;
  onTogglePause: (campaignId: string, currentPaused: boolean) => void;
  onDelete: (campaignId: string) => void;
  onFilterChange: (type: string, status: string) => void;
}

type SortField = 'name' | 'totalLeads' | 'messagesSent' | 'createdAt' | 'webinarDatetime' | 'type' | 'status';
type SortDirection = 'asc' | 'desc';

export default function CampaignList({
  campaigns,
  onEdit,
  onTogglePause,
  onDelete,
  onFilterChange,
}: CampaignListProps) {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState<'All' | 'Lead Form' | 'Webinar' | 'Nurture'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Paused'>('All');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Notify parent when filters change (triggers server-side refetch)
  useEffect(() => {
    onFilterChange(typeFilter, statusFilter);
  }, [typeFilter, statusFilter, onFilterChange]);

  // Handle sort column click
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to descending for new field
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Apply sorting (server already filtered, we only sort client-side)
  const sortedCampaigns = [...campaigns].sort((a, b) => {
    let aVal: any;
    let bVal: any;

    switch (sortField) {
      case 'name':
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case 'totalLeads':
        aVal = a.totalLeads;
        bVal = b.totalLeads;
        break;
      case 'messagesSent':
        aVal = a.messagesSent;
        bVal = b.messagesSent;
        break;
      case 'createdAt':
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
        break;
      case 'webinarDatetime':
        aVal = a.webinarDatetime ? new Date(a.webinarDatetime).getTime() : 0;
        bVal = b.webinarDatetime ? new Date(b.webinarDatetime).getTime() : 0;
        break;
      case 'type':
        aVal = a.campaignType.toLowerCase();
        bVal = b.campaignType.toLowerCase();
        break;
      case 'status':
        aVal = a.isPaused ? 1 : 0;
        bVal = b.isPaused ? 1 : 0;
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Sort indicator component
  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 opacity-50" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3 w-3" />
    ) : (
      <ArrowDown className="h-3 w-3" />
    );
  };

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
          {(['All', 'Lead Form', 'Webinar', 'Nurture'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                typeFilter === type
                  ? type === 'Webinar'
                    ? 'bg-purple-600 text-white'
                    : type === 'Lead Form'
                    ? 'bg-green-600 text-white'
                    : type === 'Nurture'
                    ? 'bg-cyan-600 text-white'
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
        Showing {sortedCampaigns.length} campaign{sortedCampaigns.length !== 1 ? 's' : ''}
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900 border-b border-gray-700">
            <tr>
              <th
                className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition`}
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-2">
                  Campaign
                  <SortIndicator field="name" />
                </div>
              </th>
              <th
                className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition`}
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center gap-2">
                  Type
                  <SortIndicator field="type" />
                </div>
              </th>
              <th className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase tracking-wider`}>
                Form ID
              </th>
              <th
                className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition`}
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-2">
                  Status
                  <SortIndicator field="status" />
                </div>
              </th>
              <th
                className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition`}
                onClick={() => handleSort('webinarDatetime')}
              >
                <div className="flex items-center gap-2">
                  Webinar Date
                  <SortIndicator field="webinarDatetime" />
                </div>
              </th>
              <th
                className={`px-6 py-4 text-center text-xs font-semibold ${theme.accents.tertiary.class} uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition`}
                onClick={() => handleSort('totalLeads')}
              >
                <div className="flex items-center justify-center gap-2">
                  Leads
                  <SortIndicator field="totalLeads" />
                </div>
              </th>
              <th
                className={`px-6 py-4 text-center text-xs font-semibold ${theme.accents.tertiary.class} uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition`}
                onClick={() => handleSort('messagesSent')}
              >
                <div className="flex items-center justify-center gap-2">
                  Messages
                  <SortIndicator field="messagesSent" />
                </div>
              </th>
              <th className={`px-6 py-4 text-center text-xs font-semibold ${theme.accents.tertiary.class} uppercase tracking-wider`}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {sortedCampaigns.length === 0 ? (
              <tr>
                <td colSpan={8} className={`px-6 py-12 text-center ${theme.core.bodyText}`}>
                  No campaigns found
                </td>
              </tr>
            ) : (
              sortedCampaigns.map((campaign) => (
                <tr
                  key={campaign.id}
                  onClick={() => router.push(`/admin/campaigns/${campaign.id}`)}
                  className="hover:bg-gray-700 transition cursor-pointer"
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
                          : campaign.campaignType === 'Custom'
                          ? 'bg-orange-500/20 text-orange-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      {campaign.campaignType}
                    </span>
                    {/* Show custom campaign details */}
                    {campaign.campaignType === 'Custom' && campaign.targetTags && (
                      <div className={`text-xs ${theme.core.bodyText} mt-1`}>
                        {campaign.targetTags.slice(0, 2).join(', ')}
                        {campaign.targetTags.length > 2 && ` +${campaign.targetTags.length - 2}`}
                      </div>
                    )}
                  </td>

                  {/* Form ID */}
                  <td className={`px-6 py-4 text-sm ${theme.core.bodyText}`}>
                    {campaign.formId ? (
                      <code className="bg-gray-900 px-2 py-1 rounded text-xs">
                        {campaign.formId}
                      </code>
                    ) : (
                      <span className="text-gray-500 text-xs">—</span>
                    )}
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
                    {/* Show enrollment status for custom campaigns */}
                    {campaign.campaignType === 'Custom' && campaign.enrollmentStatus && (
                      <div className={`text-xs mt-1 ${
                        campaign.enrollmentStatus === 'scheduled'
                          ? 'text-yellow-400'
                          : campaign.enrollmentStatus === 'completed'
                          ? 'text-gray-400'
                          : 'text-cyan-400'
                      }`}>
                        {campaign.enrollmentStatus}
                      </div>
                    )}
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
                    {/* Show enrolled count for custom campaigns */}
                    {campaign.campaignType === 'Custom' && campaign.leadsEnrolled !== undefined && (
                      <div className={`text-xs ${theme.core.bodyText} font-normal mt-1`}>
                        {campaign.leadsEnrolled} enrolled
                      </div>
                    )}
                  </td>

                  {/* Messages Sent */}
                  <td className={`px-6 py-4 text-center text-sm ${theme.core.white} font-semibold`}>
                    {campaign.messagesSent}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {/* View Campaign Details */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/campaigns/${campaign.id}`);
                        }}
                        className={`p-2 rounded ${theme.accents.primary.class} hover:bg-cyan-400/10 transition`}
                        title="View campaign details and leads"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {/* Only allow editing Standard/Webinar campaigns (not Custom) */}
                      {campaign.campaignType !== 'Custom' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(campaign);
                          }}
                          className={`p-2 rounded ${theme.accents.tertiary.class} hover:bg-cyan-400/10 transition`}
                          title="Edit campaign"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const action = campaign.isPaused ? 'activate' : 'pause';
                          if (confirm(`Are you sure you want to ${action} "${campaign.name}"?`)) {
                            onTogglePause(campaign.id, campaign.isPaused);
                          }
                        }}
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
                        onClick={(e) => {
                          e.stopPropagation();
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
