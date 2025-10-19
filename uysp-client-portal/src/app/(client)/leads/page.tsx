'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { theme } from '@/lib/theme';

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
  createdAt: string;
}

export default function LeadsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

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
        setTotalPages(Math.ceil((data.leads?.length || 0) / itemsPerPage));
      } catch (error) {
        console.error('Error fetching leads:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [status]);

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

  const filteredLeads = leads.filter((lead) => {
    if (filter === 'high') return lead.icpScore >= 70;
    if (filter === 'medium') return lead.icpScore >= 40 && lead.icpScore < 70;
    return true;
  });

  const startIdx = (page - 1) * itemsPerPage;
  const paginatedLeads = filteredLeads.slice(startIdx, startIdx + itemsPerPage);

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
              {filteredLeads.length} leads
            </p>
            <p className="text-xs">
              Page {page} of {totalPages}
            </p>
          </div>
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
                <th className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase tracking-wider`}>
                  Name
                </th>
                <th className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase tracking-wider`}>
                  Company
                </th>
                <th className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase tracking-wider`}>
                  Email
                </th>
                <th className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase tracking-wider`}>
                  ICP Score
                </th>
                <th className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase tracking-wider`}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className={`px-6 py-12 text-center ${theme.core.bodyText}`}>
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
                    <td className="px-6 py-4">
                      <div className={`font-semibold ${theme.core.white}`}>
                        {lead.firstName} {lead.lastName}
                      </div>
                      <div className={`text-xs ${theme.core.bodyText}`}>
                        {lead.title || 'No title'}
                      </div>
                    </td>
                    <td className={`px-6 py-4 ${theme.core.bodyText}`}>
                      {lead.company || '—'}
                    </td>
                    <td className={`px-6 py-4 text-sm ${theme.core.bodyText}`}>
                      {lead.email}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(
                          lead.icpScore
                        )}`}
                      >
                        {lead.icpScore}
                      </span>
                    </td>
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
