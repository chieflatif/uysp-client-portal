'use client';

import { useQuery } from '@tanstack/react-query';
import { X, Users, TrendingUp, Loader2, AlertTriangle } from 'lucide-react';
import { theme } from '@/theme';
import { useSession } from 'next-auth/react';

interface LeadPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    targetTags: string[];
    createdAfter?: string | null;
    createdBefore?: string | null;
    minIcpScore?: number | null;
    maxIcpScore?: number | null;
    engagementLevels?: string[] | null;
    excludeBooked?: boolean;
    excludeSmsStop?: boolean;
    excludeInActiveCampaign?: boolean;
  };
  clientId: string;
}

interface PreviewLead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  icpScore: number;
  engagementLevel: string;
  kajabiTags: string[];
}

interface EngagementBreakdown {
  level: string;
  count: number;
}

export default function LeadPreviewModal({
  isOpen,
  onClose,
  filters,
  clientId,
}: LeadPreviewModalProps) {
  // CRITICAL-6 FIX: Validate clientId against session (defense-in-depth)
  const { data: session, status: sessionStatus } = useSession();

  // CRITICAL-6 FIX: Validate client ID matches session for non-SUPER_ADMIN
  const isClientIdValid =
    sessionStatus === 'loading' ||
    sessionStatus === 'unauthenticated' ||
    !session ||
    session.user?.role === 'SUPER_ADMIN' ||
    session.user?.clientId === clientId;

  const { data, isLoading, error } = useQuery({
    queryKey: ['preview-leads', filters, clientId],
    queryFn: async () => {
      // CRITICAL-6 FIX: Double-check validation before API call
      if (!isClientIdValid) {
        console.error('❌ SECURITY: Client ID mismatch detected in preview modal');
        throw new Error('Security validation failed: Client ID mismatch');
      }

      const response = await fetch('/api/admin/campaigns/preview-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, ...filters }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to preview leads');
      }
      return response.json();
    },
    enabled: isOpen && isClientIdValid, // CRITICAL-6 FIX: Only run if validation passes
  });

  if (!isOpen) return null;

  // CRITICAL-6 FIX: Show security error if client ID validation fails
  if (sessionStatus !== 'loading' && !isClientIdValid) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
        <div className="bg-gray-800 rounded-lg shadow-2xl max-w-md w-full border border-red-500">
          <div className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-red-300 font-bold text-lg mb-2">
                  Security Validation Failed
                </h3>
                <p className="text-red-300 text-sm">
                  Client ID mismatch detected. This action has been logged for security audit.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalCount = data?.totalCount || 0;
  const sampleLeads: PreviewLead[] = data?.sampleLeads || [];
  const engagementBreakdown: EngagementBreakdown[] = data?.engagementBreakdown || [];

  const getEngagementColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high':
        return 'text-green-400 bg-green-500/20';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'low':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getEngagementPercentage = (level: string) => {
    if (totalCount === 0) return 0;
    const breakdown = engagementBreakdown.find((b) => b.level === level);
    return breakdown ? Math.round((breakdown.count / totalCount) * 100) : 0;
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-cyan-400" />
            <h2 className={`text-2xl font-bold ${theme.core.white}`}>
              Lead Preview
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`${theme.core.bodyText} hover:text-white transition`}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />
              <p className={`${theme.core.bodyText}`}>Loading lead data...</p>
            </div>
          ) : error ? (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-6 text-center">
              <p className="text-red-300 font-semibold">Failed to load leads</p>
              <p className="text-red-400 text-sm mt-2">{(error as Error).message}</p>
            </div>
          ) : (
            <>
              {/* Total Count Card */}
              <div className="bg-gradient-to-br from-purple-600/20 to-cyan-600/20 border border-purple-500/50 rounded-lg p-8 text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <TrendingUp className="h-8 w-8 text-purple-400" />
                  <p className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    {totalCount.toLocaleString()}
                  </p>
                </div>
                <p className={`text-xl ${theme.core.bodyText}`}>
                  Total Matching Leads
                </p>
              </div>

              {/* Engagement Breakdown */}
              <div>
                <h3 className={`text-lg font-bold ${theme.accents.tertiary.class} mb-4`}>
                  Engagement Breakdown
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {['High', 'Medium', 'Low'].map((level) => {
                    const breakdown = engagementBreakdown.find((b) => b.level === level);
                    const count = breakdown?.count || 0;
                    const percentage = getEngagementPercentage(level);

                    return (
                      <div key={level} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm font-semibold ${getEngagementColor(level).split(' ')[0]}`}>
                            {level}
                          </span>
                          <span className={`text-xs ${theme.core.bodyText}`}>
                            {percentage}%
                          </span>
                        </div>
                        <p className={`text-2xl font-bold ${theme.core.white}`}>
                          {count.toLocaleString()}
                        </p>
                        <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getEngagementColor(level).split(' ')[1]}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sample Leads Table */}
              {sampleLeads.length > 0 && (
                <div>
                  <h3 className={`text-lg font-bold ${theme.accents.tertiary.class} mb-4`}>
                    Sample Leads ({sampleLeads.length} of {totalCount})
                  </h3>
                  <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-950 border-b border-gray-700">
                          <tr>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase`}>
                              Name
                            </th>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase`}>
                              Email
                            </th>
                            <th className={`px-4 py-3 text-center text-xs font-semibold ${theme.accents.tertiary.class} uppercase`}>
                              ICP Score
                            </th>
                            <th className={`px-4 py-3 text-center text-xs font-semibold ${theme.accents.tertiary.class} uppercase`}>
                              Engagement
                            </th>
                            <th className={`px-4 py-3 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase`}>
                              Tags
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                          {sampleLeads.map((lead) => (
                            <tr key={lead.id} className="hover:bg-gray-800 transition">
                              <td className={`px-4 py-3 ${theme.core.white} font-medium`}>
                                {lead.firstName} {lead.lastName}
                              </td>
                              <td className={`px-4 py-3 text-sm ${theme.core.bodyText}`}>
                                {lead.email}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                                  lead.icpScore >= 75
                                    ? 'bg-green-500/20 text-green-400'
                                    : lead.icpScore >= 50
                                    ? 'bg-yellow-500/20 text-yellow-400'
                                    : 'bg-red-500/20 text-red-400'
                                }`}>
                                  {lead.icpScore}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                                  getEngagementColor(lead.engagementLevel || 'Unknown')
                                }`}>
                                  {lead.engagementLevel || 'Unknown'}
                                </span>
                              </td>
                              <td className={`px-4 py-3 text-xs ${theme.core.bodyText}`}>
                                <div className="flex flex-wrap gap-1">
                                  {(lead.kajabiTags || []).slice(0, 2).map((tag, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                  {(lead.kajabiTags || []).length > 2 && (
                                    <span className="px-2 py-0.5 bg-gray-700 text-gray-400 rounded">
                                      +{(lead.kajabiTags || []).length - 2}
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {totalCount > 10 && (
                    <p className={`text-sm ${theme.core.bodyText} mt-2 text-center`}>
                      Showing first 10 leads. {totalCount - 10} more will be enrolled.
                    </p>
                  )}
                </div>
              )}

              {/* No Leads Message */}
              {totalCount === 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-6 text-center">
                  <p className="text-yellow-300 font-semibold mb-2">No Matching Leads</p>
                  <p className={`text-sm ${theme.core.bodyText}`}>
                    Try adjusting your filters to find more leads
                  </p>
                </div>
              )}

              {/* Filter Summary */}
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <h4 className={`text-sm font-semibold ${theme.accents.tertiary.class} mb-2`}>
                  Applied Filters
                </h4>
                <div className="space-y-1 text-sm">
                  <p className={theme.core.bodyText}>
                    <span className="font-semibold">Tags:</span> {filters.targetTags.join(', ')}
                  </p>
                  {filters.createdAfter && (
                    <p className={theme.core.bodyText}>
                      <span className="font-semibold">Created After:</span> {new Date(filters.createdAfter).toLocaleDateString()}
                    </p>
                  )}
                  {filters.createdBefore && (
                    <p className={theme.core.bodyText}>
                      <span className="font-semibold">Created Before:</span> {new Date(filters.createdBefore).toLocaleDateString()}
                    </p>
                  )}
                  {(filters.minIcpScore !== null && filters.minIcpScore !== undefined) ||
                   (filters.maxIcpScore !== null && filters.maxIcpScore !== undefined) ? (
                    <p className={theme.core.bodyText}>
                      <span className="font-semibold">ICP Score:</span> {filters.minIcpScore || 0} - {filters.maxIcpScore || 100}
                    </p>
                  ) : null}
                  {filters.engagementLevels && filters.engagementLevels.length > 0 && (
                    <p className={theme.core.bodyText}>
                      <span className="font-semibold">Engagement:</span> {filters.engagementLevels.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t border-gray-700">
            <button
              onClick={onClose}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold text-white transition ${
                totalCount > 0
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              {totalCount > 0 ? 'Continue with Campaign' : 'Adjust Filters'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
