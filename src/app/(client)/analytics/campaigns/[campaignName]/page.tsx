'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Users, Search, ArrowUpDown } from 'lucide-react';
import { theme } from '@/theme';

interface Lead {
  id: string;
  name: string;
  company: string;
  icpScore: number;
  status: string;
  lastSentAt: string | null;
  sentCount: number;
  clicked: boolean;
  booked: boolean;
  stopped: boolean;
}

interface SequenceStep {
  stepNumber: number;
  totalLeads: number;
  leads: Lead[];
  metrics: {
    avgDaysAtStep: number;
    conversionRate: number;
    bookingRate: number;
    optOutRate: number;
  };
}

type SortField = 'name' | 'company' | 'icpScore' | 'status' | 'sentCount';
type SortDirection = 'asc' | 'desc';

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignName = decodeURIComponent(params.campaignName as string);
  
  const [steps, setSteps] = useState<SequenceStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('icpScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const fetchCampaignDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/analytics/sequences/${encodeURIComponent(campaignName)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch campaign details');
      }

      const data = await response.json();
      setSteps(data.steps || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaign details');
      console.error('Error fetching campaign details:', err);
    } finally {
      setIsLoading(false);
    }
  }, [campaignName]);

  useEffect(() => {
    fetchCampaignDetails();
  }, [fetchCampaignDetails]);

  const filterAndSortLeads = useCallback((leads: Lead[]) => {
    // Filter by search query
    let filtered = leads;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = leads.filter(lead => 
        lead.name.toLowerCase().includes(query) ||
        lead.company.toLowerCase().includes(query) ||
        lead.status.toLowerCase().includes(query)
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let aVal, bVal;
      
      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'company':
          aVal = a.company.toLowerCase();
          bVal = b.company.toLowerCase();
          break;
        case 'icpScore':
          aVal = a.icpScore;
          bVal = b.icpScore;
          break;
        case 'status':
          aVal = a.status.toLowerCase();
          bVal = b.status.toLowerCase();
          break;
        case 'sentCount':
          aVal = a.sentCount;
          bVal = b.sentCount;
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
  }, [searchQuery, sortField, sortDirection]);

  const processedSteps = useMemo(() => {
    return steps.map(step => ({
      ...step,
      leads: filterAndSortLeads(step.leads)
    }));
  }, [steps, filterAndSortLeads]);

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

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-screen ${theme.core.darkBg}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400" />
          <p className={`${theme.core.bodyText} text-sm`}>Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${theme.core.darkBg} min-h-screen`}>
        <div className="bg-red-900/20 border border-red-600 rounded-md p-4">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  const totalLeads = steps.reduce((sum, step) => sum + step.totalLeads, 0);
  const filteredTotalLeads = processedSteps.reduce((sum, step) => sum + step.leads.length, 0);

  return (
    <div className={`min-h-screen ${theme.core.darkBg} p-6 space-y-6`}>
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/analytics')}
          className={`p-2 hover:bg-gray-800 rounded-lg transition ${theme.core.bodyText} hover:text-cyan-400`}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className={`text-3xl font-bold ${theme.core.white}`}>
            {campaignName}
          </h1>
          <p className={theme.core.bodyText}>
            {filteredTotalLeads} of {totalLeads} leads
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${theme.core.bodyText}`} />
          <input
            type="text"
            placeholder="Search leads by name, company, or status..."
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

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {processedSteps.map((step) => (
          <div key={step.stepNumber} className={`${theme.components.card}`}>
            <div className={`text-sm font-medium ${theme.accents.tertiary.class} mb-1`}>
              {step.stepNumber === 0 ? 'Not Started' : `Step ${step.stepNumber}`}
            </div>
            <div className={`text-3xl font-bold ${theme.core.white} mb-2`}>{step.leads.length}</div>
            <div className={`space-y-1 text-sm ${theme.core.bodyText}`}>
              <div className="flex justify-between">
                <span>Booking Rate:</span>
                <span className="font-semibold text-green-400">
                  {step.metrics.bookingRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Opt-Out Rate:</span>
                <span className="font-semibold text-red-400">
                  {step.metrics.optOutRate.toFixed(1)}%
                </span>
              </div>
              {step.stepNumber > 0 && (
                <div className="flex justify-between">
                  <span>Avg Days:</span>
                  <span className="font-semibold">{step.metrics.avgDaysAtStep}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Lead Lists by Step */}
      <div className="space-y-6">
        {processedSteps.map((step) => (
          <div key={step.stepNumber} className={theme.components.card}>
            <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${theme.core.white}`}>
              <Users className="h-5 w-5" />
              {step.stepNumber === 0 ? 'Not Started' : `Step ${step.stepNumber}`} 
              <span className={`${theme.core.bodyText} font-normal text-base`}>({step.leads.length} leads)</span>
            </h2>

            {step.leads.length === 0 ? (
              <p className={`text-center ${theme.core.bodyText} py-8`}>
                {searchQuery ? 'No leads match your search' : 'No leads at this step'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th 
                        className={`text-left py-3 px-4 cursor-pointer hover:bg-gray-800 transition ${theme.accents.tertiary.class} text-xs uppercase tracking-wider font-semibold`}
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center">
                          Lead {getSortIcon('name')}
                        </div>
                      </th>
                      <th 
                        className={`text-left py-3 px-4 cursor-pointer hover:bg-gray-800 transition ${theme.accents.tertiary.class} text-xs uppercase tracking-wider font-semibold`}
                        onClick={() => handleSort('company')}
                      >
                        <div className="flex items-center">
                          Company {getSortIcon('company')}
                        </div>
                      </th>
                      <th 
                        className={`text-right py-3 px-4 cursor-pointer hover:bg-gray-800 transition ${theme.accents.tertiary.class} text-xs uppercase tracking-wider font-semibold`}
                        onClick={() => handleSort('icpScore')}
                      >
                        <div className="flex items-center justify-end">
                          ICP Score {getSortIcon('icpScore')}
                        </div>
                      </th>
                      <th 
                        className={`text-left py-3 px-4 cursor-pointer hover:bg-gray-800 transition ${theme.accents.tertiary.class} text-xs uppercase tracking-wider font-semibold`}
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center">
                          Status {getSortIcon('status')}
                        </div>
                      </th>
                      <th 
                        className={`text-right py-3 px-4 cursor-pointer hover:bg-gray-800 transition ${theme.accents.tertiary.class} text-xs uppercase tracking-wider font-semibold`}
                        onClick={() => handleSort('sentCount')}
                      >
                        <div className="flex items-center justify-end">
                          Messages {getSortIcon('sentCount')}
                        </div>
                      </th>
                      <th className={`text-left py-3 px-4 ${theme.accents.tertiary.class} text-xs uppercase tracking-wider font-semibold`}>
                        Last Sent
                      </th>
                      <th className={`text-center py-3 px-4 ${theme.accents.tertiary.class} text-xs uppercase tracking-wider font-semibold`}>
                        Clicked
                      </th>
                      <th className={`text-center py-3 px-4 ${theme.accents.tertiary.class} text-xs uppercase tracking-wider font-semibold`}>
                        Booked
                      </th>
                      <th className={`text-left py-3 px-4 ${theme.accents.tertiary.class} text-xs uppercase tracking-wider font-semibold`}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {step.leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-800 transition border-l-4 border-indigo-600">
                        <td className={`py-3 px-4 font-medium ${theme.core.white}`}>{lead.name}</td>
                        <td className={`py-3 px-4 ${theme.core.bodyText}`}>{lead.company}</td>
                        <td className="text-right py-3 px-4">
                          <span className={`font-semibold ${
                            lead.icpScore >= 70 ? 'text-green-400' :
                            lead.icpScore >= 40 ? 'text-yellow-400' :
                            theme.core.bodyText
                          }`}>
                            {lead.icpScore}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-700 text-gray-300">
                            {lead.status}
                          </span>
                        </td>
                        <td className={`text-right py-3 px-4 ${theme.core.white}`}>{lead.sentCount}</td>
                        <td className={`py-3 px-4 text-sm ${theme.core.bodyText}`}>
                          {lead.lastSentAt 
                            ? new Date(lead.lastSentAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'Never'
                          }
                        </td>
                        <td className="text-center py-3 px-4">
                          {lead.clicked ? (
                            <span className={theme.accents.secondary.class}>✓</span>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </td>
                        <td className="text-center py-3 px-4">
                          {lead.booked ? (
                            <span className="text-green-400 font-semibold">✓</span>
                          ) : lead.stopped ? (
                            <span className="text-red-400 font-semibold">✗</span>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <a
                            href={`/leads/${lead.id}`}
                            className={`text-sm ${theme.accents.tertiary.class} hover:text-cyan-300 underline`}
                          >
                            View Lead
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Step Metrics Summary */}
            {step.leads.length > 0 && (
              <div className={`mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-700`}>
                <div className="text-sm">
                  <span className={theme.core.bodyText}>Conversion Rate:</span>
                  <span className={`ml-2 font-semibold ${theme.core.white}`}>{step.metrics.conversionRate.toFixed(1)}%</span>
                </div>
                <div className="text-sm">
                  <span className={theme.core.bodyText}>Booking Rate:</span>
                  <span className="ml-2 font-semibold text-green-400">{step.metrics.bookingRate.toFixed(1)}%</span>
                </div>
                <div className="text-sm">
                  <span className={theme.core.bodyText}>Opt-Out Rate:</span>
                  <span className="ml-2 font-semibold text-red-400">{step.metrics.optOutRate.toFixed(1)}%</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
