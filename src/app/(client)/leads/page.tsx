'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Search, ArrowUpDown } from 'lucide-react';
import { theme } from '@/theme';

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
  linkedinUrl?: string;
  enrichmentOutcome?: string;
  createdAt: string;
}

type SortField = 'name' | 'company' | 'icpScore' | 'status';
type SortDirection = 'asc' | 'desc';

export default function LeadsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('icpScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const itemsPerPage = 50;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    const fetchLeads = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/leads');
        const data = await response.json();
        setLeads(data.leads || []);
      } catch (error) {
        console.error('Error fetching leads:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [status]);

  // Filter, search, and sort leads (MOVED BEFORE EARLY RETURN)
  const processedLeads = useMemo(() => {
    // Apply ICP filter
    let filtered = leads.filter((lead) => {
      if (filter === 'high') return lead.icpScore >= 70;
      if (filter === 'medium') return lead.icpScore >= 40 && lead.icpScore < 70;
      return true;
    });

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(lead =>
        `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(query) ||
        (lead.company?.toLowerCase() || '').includes(query) ||
        (lead.title?.toLowerCase() || '').includes(query) ||
        (lead.email?.toLowerCase() || '').includes(query) ||
        lead.status.toLowerCase().includes(query)
      );
    }

    // Apply sort
    const sorted = [...filtered].sort((a, b) => {
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
          aVal = a.status.toLowerCase();
          bVal = b.status.toLowerCase();
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
  }, [leads, filter, searchQuery, sortField, sortDirection]);

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

  const getScoreColor = (score: number) => {
    if (score >= 70) return `${theme.accents.primary.bgClass} text-white`;
    if (score >= 40) return `${theme.accents.secondary.bgClass} text-white`;
    return 'bg-gray-700 text-gray-300';
  };

  const getStatusBadgeColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('booked')) return theme.accents.primary.bgClass;
    if (statusLower.includes('replied')) return theme.accents.secondary.bgClass;
    if (statusLower.includes('clicked')) return theme.accents.tertiary.bgClass;
    return 'bg-gray-700';
  };

  // Early return AFTER all hooks
  if (status === 'loading' || loading) {
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-4xl font-bold ${theme.core.white} mb-2`}>
              Your <span className={theme.accents.primary.class}>Leads</span>
            </h1>
            <p className={theme.core.bodyText}>
              Manage and track your qualified leads
            </p>
          </div>
          <div className={`text-right ${theme.core.bodyText}`}>
            <p className="text-sm font-semibold">
              {processedLeads.length} leads
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
            <p className="text-xs">
              Page {page} of {totalPages}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${theme.core.bodyText}`} />
            <input
              type="text"
              placeholder="Search by name, company, title, email, or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${theme.components.input} w-full pl-10`}
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={`text-sm ${theme.accents.tertiary.class} hover:text-cyan-300`}
            >
              Clear search
            </button>
          )}
        </div>

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
                <th className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase tracking-wider`}>
                  LinkedIn Profile
                </th>
                <th 
                  className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition`}
                  onClick={() => handleSort('icpScore')}
                >
                  <div className="flex items-center">
                    ICP {getSortIcon('icpScore')}
                  </div>
                </th>
                <th className={`px-6 py-4 text-center text-xs font-semibold ${theme.accents.tertiary.class} uppercase tracking-wider`}>
                  Data
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
                  <td colSpan={6} className={`px-6 py-12 text-center ${theme.core.bodyText}`}>
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
                    
                    {/* LinkedIn Profile - MOST IMPORTANT */}
                    <td className="px-6 py-4">
                      {lead.linkedinUrl ? (
                        <a
                          href={lead.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 ${theme.accents.tertiary.class} border-cyan-400/30 hover:border-cyan-400 hover:bg-cyan-400/10 transition font-medium`}
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                          </svg>
                          View LinkedIn
                        </a>
                      ) : (
                        <span className={`text-sm ${theme.core.bodyText} italic`}>No LinkedIn</span>
                      )}
                    </td>
                    
                    {/* ICP Score + Enrichment Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(
                          lead.icpScore
                        )}`}
                      >
                        {lead.icpScore}
                      </span>
                    </td>
                    
                    {/* Data Quality Indicator */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {lead.enrichmentOutcome === 'Success' && (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 text-green-400" title="Successfully enriched">
                            ✓
                          </span>
                        )}
                        {lead.enrichmentOutcome === 'No Match' && (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400" title="No match found">
                            ⚠
                          </span>
                        )}
                        {!lead.enrichmentOutcome && (
                          <span className={`text-xs ${theme.core.bodyText}`}>—</span>
                        )}
                      </div>
                    </td>
                    
                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white ${getStatusBadgeColor(
                          lead.status
                        )}`}
                      >
                        {lead.status}
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

        {/* Stats Footer */}
        <div className={`grid grid-cols-3 gap-4 pt-6 border-t border-gray-700`}>
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
              {leads.filter((l) => l.icpScore >= 70).length}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className={`text-xs ${theme.accents.secondary.class} font-semibold uppercase mb-1`}>
              Avg Score
            </p>
            <p className={`text-2xl font-bold ${theme.core.white}`}>
              {Math.round((leads.reduce((sum, l) => sum + l.icpScore, 0) / leads.length) * 10) / 10}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
