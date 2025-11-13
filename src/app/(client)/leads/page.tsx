'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, ArrowUpDown, X, Upload } from 'lucide-react';
import { theme } from '@/theme';
import { useClient } from '@/contexts/ClientContext';
import { ImportLeadsModal } from '@/components/leads/ImportLeadsModal';
import { formatICPScore, getICPBadgeClass } from '@/lib/utils/icp-score';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  title?: string;
  icpScore: number;
  status: string;
  processingStatus: string; // The workflow status (Queued/In Sequence/Completed)
  linkedinUrl?: string;
  enrichmentOutcome?: string;
  createdAt: string;
  // Week 4 additions
  campaignName?: string;
  leadSource?: string;
  lastActivity?: string | null;
  // Engagement metrics
  engagementLevel?: string;
  engagementTier?: string;
}

type SortField = 'name' | 'company' | 'icpScore' | 'status' | 'lastActivity' | 'campaign' | 'leadSource';
type SortDirection = 'asc' | 'desc';

export default function LeadsPage() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const campaignFilter = searchParams?.get('campaign');
  const queryClient = useQueryClient();
  const { selectedClientId, isLoading: clientLoading } = useClient();

  const [filter, setFilter] = useState<'all' | 'high' | 'medium'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchQuery, setSearchQuery] = useState(''); // API search query (debounced)
  const [searchInput, setSearchInput] = useState(''); // Immediate input value for display
  const [sortField, setSortField] = useState<SortField>('icpScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const itemsPerPage = 50;

  // Debounce timer for search input (300ms delay)
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search handler
  const handleSearchChange = useCallback((value: string) => {
    // Update input immediately for instant visual feedback
    setSearchInput(value);

    // Clear existing timer
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    // Set new timer with 300ms delay for API call
    searchTimerRef.current = setTimeout(() => {
      setSearchQuery(value);
      setPage(1); // Reset to first page on search
    }, 300);
  }, []);

  // Cleanup timer on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  // React Query: Fetch leads with server-side search and filtering
  const { data: leadsData, isLoading: loading } = useQuery({
    queryKey: ['leads', selectedClientId, searchQuery], // Include client and search in cache key
    queryFn: async () => {
      // CRITICAL: Enforce client selection for data isolation
      if (!selectedClientId) return [];

      // Build query URL with search parameter and clientId
      const params = new URLSearchParams({
        limit: '50000', // High limit for comprehensive results
      });

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      // Pass clientId for explicit filtering (super admins)
      params.append('clientId', selectedClientId);

      const response = await fetch(`/api/leads?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch leads');
      const data = await response.json();
      return data.leads || [];
    },
    enabled: status === 'authenticated' && !clientLoading,
    // Use global defaults (5 min stale, 10 min cache)
  });

  const leads = leadsData || [];

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Filter and sort leads (search now handled server-side)
  const processedLeads = useMemo(() => {
    // Apply ICP filter
    let filtered = leads.filter((lead: Lead) => {
      if (filter === 'high') return lead.icpScore >= 70;
      if (filter === 'medium') return lead.icpScore >= 40 && lead.icpScore < 70;
      return true;
    });

    // Apply campaign filter from URL
    if (campaignFilter) {
      filtered = filtered.filter((lead: Lead) =>
        lead.campaignName?.toLowerCase() === campaignFilter.toLowerCase()
      );
    }

    // NOTE: Search filtering is now handled server-side in /api/leads
    // Client-side search logic removed for better performance

    // Apply sort
    const sorted = [...filtered].sort((a: Lead, b: Lead) => {
      let aVal, bVal;

      switch (sortField) {
        case 'name':
          aVal = `${a.firstName} ${a.lastName}`.toLowerCase();
          bVal = `${b.firstName} ${b.lastName}`.toLowerCase();
          break;
        case 'company':
          aVal = (a.company || '').toLowerCase();
          bVal = (b.company || '').toLowerCase();
          break;
        case 'icpScore':
          aVal = a.icpScore;
          bVal = b.icpScore;
          break;
        case 'status':
          aVal = (a.processingStatus || a.status).toLowerCase();
          bVal = (b.processingStatus || b.status).toLowerCase();
          break;
        case 'campaign':
          aVal = (a.campaignName || '').toLowerCase();
          bVal = (b.campaignName || '').toLowerCase();
          break;
        case 'leadSource':
          aVal = (a.leadSource || '').toLowerCase();
          bVal = (b.leadSource || '').toLowerCase();
          break;
        case 'lastActivity':
          aVal = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
          bVal = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
          break;
        default:
          aVal = a.icpScore;
          bVal = b.icpScore;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [leads, filter, campaignFilter, sortField, sortDirection]);

  // Update total pages when processedLeads changes
  useEffect(() => {
    setTotalPages(Math.ceil(processedLeads.length / itemsPerPage));
    setPage(1); // Reset to first page when filters change
  }, [processedLeads]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-30" />;
    return <ArrowUpDown className={`h-3 w-3 ml-1 ${theme.accents.tertiary.class}`} />;
  };

  const formatRelativeTime = (date: string | null): string => {
    if (!date) return 'No activity';

    const now = new Date();
    const activity = new Date(date);
    const diffMs = now.getTime() - activity.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return activity.toLocaleDateString();
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return `${theme.accents.primary.bgClass} text-white`;
    if (score >= 40) return `${theme.accents.secondary.bgClass} text-white`;
    return 'bg-gray-700 text-gray-300';
  };

  const getStatusBadgeColor = (status: string) => {
    const statusLower = status.toLowerCase();
    // Processing status colors (Queued/In Sequence/Completed)
    if (statusLower === 'completed' || statusLower === 'complete') return theme.accents.primary.bgClass;
    if (statusLower === 'in sequence' || statusLower.includes('sequence')) return theme.accents.secondary.bgClass;
    if (statusLower === 'queued') return theme.accents.tertiary.bgClass;
    // Fallback for legacy statuses
    if (statusLower.includes('booked')) return theme.accents.primary.bgClass;
    if (statusLower.includes('replied')) return theme.accents.secondary.bgClass;
    if (statusLower.includes('clicked')) return theme.accents.tertiary.bgClass;
    return 'bg-gray-700';
  };

  // Only show loading screen if there's no data AND we're loading (first load)
  if ((status === 'loading' || loading) && leads.length === 0) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${theme.core.darkBg}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400" />
          <p className={`${theme.core.bodyText} text-sm`}>Loading leads...</p>
        </div>
      </div>
    );
  }

  const startIdx = (page - 1) * itemsPerPage;
  const paginatedLeads = processedLeads.slice(startIdx, startIdx + itemsPerPage);

  return (
    <div className={`min-h-screen ${theme.core.darkBg} p-8`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className={`text-4xl font-bold ${theme.core.white} mb-2`}>
              Your <span className={theme.accents.primary.class}>Leads</span>
            </h1>
            <p className={theme.core.bodyText}>
              Manage and track your qualified leads
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`text-right ${theme.core.bodyText}`}>
              <p className="text-sm font-semibold">
                {processedLeads.length} leads
                {searchQuery && ` matching "${searchQuery}"`}
                {campaignFilter && ` in campaign "${campaignFilter}"`}
              </p>
              <p className="text-xs">
                Page {page} of {totalPages}
              </p>
            </div>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-pink-700 via-indigo-600 to-cyan-400 text-white rounded-lg font-semibold hover:opacity-90 transition shadow-lg"
            >
              <Upload className="w-5 h-5" />
              Import Leads
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${theme.core.bodyText}`} />
            <input
              type="text"
              placeholder="Search by name, company, title, email, phone, or status..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className={`${theme.components.input} w-full pl-10`}
            />
          </div>
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput('');
                setSearchQuery('');
                if (searchTimerRef.current) {
                  clearTimeout(searchTimerRef.current);
                }
              }}
              className={`text-sm ${theme.accents.tertiary.class} hover:text-cyan-300`}
            >
              Clear search
            </button>
          )}
        </div>

        {/* Campaign Filter Badge */}
        {campaignFilter && (
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-900/50 border border-indigo-600 rounded-lg">
            <span className={`text-sm font-medium ${theme.core.white}`}>
              Campaign: <span className={theme.accents.primary.class}>{campaignFilter}</span>
            </span>
            <button
              onClick={() => router.push('/leads')}
              className={`ml-2 p-1 rounded ${theme.core.bodyText} hover:text-white hover:bg-gray-700 transition`}
              title="Clear campaign filter"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              setFilter('all');
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              filter === 'all'
                ? `${theme.accents.tertiary.bgClass} text-gray-900`
                : `bg-gray-800 ${theme.core.bodyText} hover:bg-gray-700`
            }`}
          >
            All Leads
          </button>
          <button
            onClick={() => {
              setFilter('high');
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              filter === 'high'
                ? `${theme.accents.primary.bgClass} text-white`
                : `bg-gray-800 ${theme.core.bodyText} hover:bg-gray-700`
            }`}
          >
            High ICP (70+)
          </button>
          <button
            onClick={() => {
              setFilter('medium');
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              filter === 'medium'
                ? `${theme.accents.secondary.bgClass} text-white`
                : `bg-gray-800 ${theme.core.bodyText} hover:bg-gray-700`
            }`}
          >
            Medium ICP (40-70)
          </button>
        </div>

        {/* Stats Dashboard */}
        <div className={`grid grid-cols-3 gap-4`}>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className={`text-xs ${theme.accents.tertiary.class} font-semibold uppercase mb-1`}>
              Total Leads
            </p>
            <p className={`text-2xl font-bold ${theme.core.white}`}>
              {leads.length.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className={`text-xs ${theme.accents.primary.class} font-semibold uppercase mb-1`}>
              High ICP
            </p>
            <p className={`text-2xl font-bold ${theme.core.white}`}>
              {leads.filter((l: Lead) => l.icpScore >= 70).length}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className={`text-xs ${theme.accents.secondary.class} font-semibold uppercase mb-1`}>
              Avg Score
            </p>
            <p className={`text-2xl font-bold ${theme.core.white}`}>
              {leads.length > 0 ? Math.round((leads.reduce((sum: number, l: Lead) => sum + l.icpScore, 0) / leads.length) * 10) / 10 : 0}
            </p>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th
                  className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition`}
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Lead Info {getSortIcon('name')}
                  </div>
                </th>
                <th
                  className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition`}
                  onClick={() => handleSort('company')}
                >
                  <div className="flex items-center">
                    Company {getSortIcon('company')}
                  </div>
                </th>
                <th
                  className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition`}
                  onClick={() => handleSort('campaign')}
                >
                  <div className="flex items-center">
                    Campaign {getSortIcon('campaign')}
                  </div>
                </th>
                <th
                  className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition`}
                  onClick={() => handleSort('leadSource')}
                >
                  <div className="flex items-center">
                    Lead Source {getSortIcon('leadSource')}
                  </div>
                </th>
                <th
                  className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition`}
                  onClick={() => handleSort('lastActivity')}
                >
                  <div className="flex items-center">
                    Last Activity {getSortIcon('lastActivity')}
                  </div>
                </th>
                <th
                  className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition`}
                  onClick={() => handleSort('icpScore')}
                >
                  <div className="flex items-center">
                    ICP {getSortIcon('icpScore')}
                  </div>
                </th>
                <th className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase tracking-wider`}>
                  LinkedIn
                </th>
                <th
                  className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition`}
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Status {getSortIcon('status')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className={`px-6 py-12 text-center ${theme.core.bodyText}`}>
                    No leads found
                  </td>
                </tr>
              ) : (
                paginatedLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-gray-700 transition cursor-pointer border-l-4 border-indigo-600"
                    onClick={() => router.push(`/leads/${lead.id}`)}
                  >
                    {/* Lead Info: Name + Title */}
                    <td className="px-6 py-4">
                      <div className={`font-semibold ${theme.core.white} text-base`}>
                        {lead.firstName} {lead.lastName}
                      </div>
                      <div className={`text-sm ${theme.accents.tertiary.class} font-medium mt-0.5`}>
                        {lead.title || 'No title specified'}
                      </div>
                    </td>

                    {/* Company */}
                    <td className={`px-6 py-4 ${theme.core.white} font-medium`}>
                      {lead.company || '—'}
                    </td>

                    {/* Campaign */}
                    <td className={`px-6 py-4 ${theme.core.bodyText} text-sm`}>
                      {lead.campaignName || '—'}
                    </td>

                    {/* Lead Source */}
                    <td className={`px-6 py-4 text-sm`}>
                      {lead.leadSource ? (
                        <span className={`inline-block px-2 py-1 rounded ${
                          lead.leadSource === 'Webinar Form'
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}>
                          {lead.leadSource}
                        </span>
                      ) : (
                        <span className={theme.core.bodyText}>—</span>
                      )}
                    </td>

                    {/* Last Activity */}
                    <td className={`px-6 py-4 text-sm`}>
                      <span className={lead.lastActivity ? theme.core.white : theme.core.bodyText}>
                        {formatRelativeTime(lead.lastActivity)}
                      </span>
                    </td>

                    {/* ICP Score */}
                    <td className="px-6 py-4">
                      <span className={getICPBadgeClass(lead.icpScore)}>
                        {formatICPScore(lead.icpScore)}
                      </span>
                    </td>

                    {/* LinkedIn Profile */}
                    <td className="px-6 py-4">
                      {lead.linkedinUrl ? (
                        <a
                          href={lead.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border ${theme.accents.tertiary.class} border-cyan-400/30 hover:border-cyan-400 hover:bg-cyan-400/10 transition text-xs`}
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                          </svg>
                          View
                        </a>
                      ) : (
                        <span className={`text-xs ${theme.core.bodyText} italic`}>—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white ${getStatusBadgeColor(
                          lead.processingStatus || lead.status
                        )}`}
                      >
                        {lead.processingStatus || lead.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                page === 1
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : `bg-gray-800 ${theme.core.bodyText} hover:bg-gray-700`
              }`}
            >
              ← Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                  page === p
                    ? `${theme.accents.tertiary.bgClass} text-gray-900`
                    : `bg-gray-800 ${theme.core.bodyText} hover:bg-gray-700`
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                page === totalPages
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : `bg-gray-800 ${theme.core.bodyText} hover:bg-gray-700`
              }`}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Import Leads Modal */}
      <ImportLeadsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          // Invalidate leads query to refresh the list
          queryClient.invalidateQueries({ queryKey: ['leads'] });
        }}
      />
    </div>
  );
}
