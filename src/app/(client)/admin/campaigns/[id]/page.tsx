'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { theme } from '@/theme';
import { ArrowLeft, Calendar, Users, MessageSquare, Link as LinkIcon, Loader2, ExternalLink, CheckCircle, MousePointerClick } from 'lucide-react';
import Link from 'next/link';

interface Campaign {
  id: string;
  name: string;
  campaignType: 'Webinar' | 'Standard' | 'Custom';
  formId?: string;
  isPaused: boolean;
  webinarDatetime?: string | null;
  zoomLink?: string | null;
  resourceLink?: string | null;
  resourceName?: string | null;
  bookingLink?: string | null;
  messagesSent: number;
  totalLeads: number;
  createdAt: string;
  updatedAt: string;
  targetTags?: string[];
  enrollmentStatus?: string;
  leadsEnrolled?: number;
  // Campaign V2 count fields
  bookedCount?: number;
  // TODO: Add clickedCount field to schema and API
}

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  leadSource?: string;
  engagementLevel?: string;
  createdAt: string;
  icpScore?: number;
  enrolledAt?: string;
  smsSequencePosition?: number;
  processingStatus?: string;
  smsEligible: boolean;
  whatsappEligible: boolean;
  isArchived: boolean;
  smsStop?: boolean;
  smsStopReason?: string;
}

interface LeadsSummary {
  total: number;
  filtered: number;
  statusCounts: Record<string, number>;
  eligibilityCounts: {
    sms: number;
    whatsapp: number;
    archived: number;
  };
}

interface LeadsResponse {
  leads: Lead[];
  summary: LeadsSummary;
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params?.id as string;
  const [statusFilter, setStatusFilter] = useState<'All' | 'Ready for SMS' | 'Queued' | 'Stopped' | 'Complete'>('All');
  const [eligibilityFilter, setEligibilityFilter] = useState<'All' | 'SMS' | 'WhatsApp' | 'Archived'>('All');

  // Fetch campaign details
  const { data: campaign, isLoading: loadingCampaign } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/campaigns/${campaignId}`);
      if (!res.ok) throw new Error('Failed to fetch campaign');
      return res.json() as Promise<Campaign>;
    },
  });

  const { data: leadsResponse, isLoading: loadingLeads } = useQuery({
    queryKey: ['campaign-leads', campaignId, statusFilter, eligibilityFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'All') {
        params.set('status', statusFilter);
      }
      if (eligibilityFilter !== 'All') {
        params.set('eligibility', eligibilityFilter.toLowerCase());
      }
      const query = params.toString();
      const res = await fetch(`/api/admin/campaigns/${campaignId}/leads${query ? `?${query}` : ''}`);
      if (!res.ok) throw new Error('Failed to fetch leads');
      return res.json() as Promise<LeadsResponse>;
    },
  });

  const leads = leadsResponse?.leads ?? [];
  const leadSummary = leadsResponse?.summary;

  if (loadingCampaign) {
    return (
      <div className={`min-h-screen ${theme.core.darkBg} flex items-center justify-center`}>
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className={`min-h-screen ${theme.core.darkBg} p-8`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className={`text-2xl font-bold ${theme.core.white} mb-4`}>Campaign Not Found</h1>
            <Link href="/admin/campaigns" className={`${theme.accents.primary.class} hover:underline`}>
              ← Back to Campaigns
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`min-h-screen ${theme.core.darkBg} p-8`}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/campaigns')}
              className={`p-2 rounded ${theme.core.bodyText} hover:bg-gray-800 hover:text-white transition`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className={`text-3xl font-bold ${theme.core.white}`}>{campaign.name}</h1>
              <p className={`text-sm ${theme.core.bodyText} mt-1`}>
                Created {formatDate(campaign.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-4 py-2 rounded-full text-sm font-bold ${
                campaign.campaignType === 'Webinar'
                  ? 'bg-purple-500/20 text-purple-300'
                  : campaign.campaignType === 'Custom'
                  ? 'bg-orange-500/20 text-orange-300'
                  : 'bg-blue-500/20 text-blue-300'
              }`}
            >
              {campaign.campaignType}
            </span>
            <span
              className={`px-4 py-2 rounded-full text-sm font-bold ${
                campaign.isPaused
                  ? 'bg-gray-600 text-gray-300'
                  : 'bg-green-500/20 text-green-400'
              }`}
            >
              {campaign.isPaused ? 'Paused' : 'Active'}
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <Users className={`w-5 h-5 ${theme.accents.primary.class}`} />
              <h3 className={`text-sm font-semibold ${theme.accents.tertiary.class} uppercase`}>
                Total Leads
              </h3>
            </div>
            <p className={`text-3xl font-bold ${theme.core.white}`}>{campaign.totalLeads}</p>
            {campaign.campaignType === 'Custom' && campaign.leadsEnrolled !== undefined && (
              <p className={`text-sm ${theme.core.bodyText} mt-1`}>
                {campaign.leadsEnrolled} enrolled
              </p>
            )}
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <MessageSquare className={`w-5 h-5 ${theme.accents.primary.class}`} />
              <h3 className={`text-sm font-semibold ${theme.accents.tertiary.class} uppercase`}>
                Messages Sent
              </h3>
            </div>
            <p className={`text-3xl font-bold ${theme.core.white}`}>{campaign.messagesSent}</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className={`w-5 h-5 ${theme.accents.primary.class}`} />
              <h3 className={`text-sm font-semibold ${theme.accents.tertiary.class} uppercase`}>
                Booked
              </h3>
            </div>
            <p className={`text-3xl font-bold ${theme.core.white}`}>{campaign.bookedCount || 0}</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <MousePointerClick className={`w-5 h-5 ${theme.accents.primary.class}`} />
              <h3 className={`text-sm font-semibold ${theme.accents.tertiary.class} uppercase`}>
                Clicked
              </h3>
            </div>
            <p className={`text-3xl font-bold ${theme.core.white}`}>—</p>
            <p className={`text-xs ${theme.core.bodyText} mt-1`}>Coming soon</p>
          </div>

          {campaign.campaignType === 'Webinar' && campaign.webinarDatetime && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 md:col-span-2 lg:col-span-4">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className={`w-5 h-5 ${theme.accents.primary.class}`} />
                <h3 className={`text-sm font-semibold ${theme.accents.tertiary.class} uppercase`}>
                  Webinar Date
                </h3>
              </div>
              <p className={`text-lg font-bold ${theme.core.white}`}>
                {formatDate(campaign.webinarDatetime)}
              </p>
            </div>
          )}
        </div>

        {/* Campaign Details */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className={`text-xl font-bold ${theme.core.white} mb-4`}>Campaign Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaign.formId && (
              <div>
                <p className={`text-sm font-semibold ${theme.accents.tertiary.class} mb-1`}>
                  Form ID
                </p>
                <code className="bg-gray-900 px-3 py-1 rounded text-sm text-cyan-400">
                  {campaign.formId}
                </code>
              </div>
            )}

            {campaign.bookingLink && (
              <div>
                <p className={`text-sm font-semibold ${theme.accents.tertiary.class} mb-1`}>
                  Booking Link
                </p>
                <a
                  href={campaign.bookingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 ${theme.accents.primary.class} hover:underline text-sm`}
                >
                  <LinkIcon className="w-4 h-4" />
                  View Calendly
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {campaign.zoomLink && (
              <div>
                <p className={`text-sm font-semibold ${theme.accents.tertiary.class} mb-1`}>
                  Zoom Link
                </p>
                <a
                  href={campaign.zoomLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 ${theme.accents.primary.class} hover:underline text-sm`}
                >
                  <LinkIcon className="w-4 h-4" />
                  Join Webinar
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {campaign.resourceLink && (
              <div>
                <p className={`text-sm font-semibold ${theme.accents.tertiary.class} mb-1`}>
                  Resource: {campaign.resourceName || 'Download'}
                </p>
                <a
                  href={campaign.resourceLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 ${theme.accents.primary.class} hover:underline text-sm`}
                >
                  <LinkIcon className="w-4 h-4" />
                  View Resource
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {campaign.targetTags && campaign.targetTags.length > 0 && (
              <div className="md:col-span-2">
                <p className={`text-sm font-semibold ${theme.accents.tertiary.class} mb-2`}>
                  Target Tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {campaign.targetTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-900 rounded-full text-xs text-cyan-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-700 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className={`text-xl font-bold ${theme.core.white}`}>
                Campaign Leads ({loadingLeads ? '...' : leadSummary?.filtered ?? leads.length})
              </h2>
              {leadSummary && (
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className={`${theme.core.bodyText}`}>
                    Total: <strong className={theme.core.white}>{leadSummary.total}</strong>
                  </span>
                  <span className={`${theme.core.bodyText}`}>
                    SMS Eligible: <strong className="text-green-400">{leadSummary.eligibilityCounts.sms}</strong>
                  </span>
                  <span className={`${theme.core.bodyText}`}>
                    WhatsApp Eligible: <strong className="text-cyan-400">{leadSummary.eligibilityCounts.whatsapp}</strong>
                  </span>
                  <span className={`${theme.core.bodyText}`}>
                    Archived / Stopped: <strong className="text-gray-400">{leadSummary.eligibilityCounts.archived}</strong>
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col lg:flex-row gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-semibold uppercase tracking-wide ${theme.accents.tertiary.class}`}>
                  Status:
                </span>
                {(['All', 'Ready for SMS', 'Queued', 'Stopped', 'Complete'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                      statusFilter === status
                        ? 'bg-cyan-600 text-white'
                        : 'bg-gray-900 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {status}
                    {status !== 'All' && leadSummary?.statusCounts[status] !== undefined && (
                      <span className="ml-1 text-gray-300">({leadSummary.statusCounts[status]})</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-semibold uppercase tracking-wide ${theme.accents.tertiary.class}`}>
                  Eligibility:
                </span>
                {(['All', 'SMS', 'WhatsApp', 'Archived'] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => setEligibilityFilter(option)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                      eligibilityFilter === option
                        ? option === 'Archived'
                          ? 'bg-gray-600 text-white'
                          : option === 'WhatsApp'
                          ? 'bg-cyan-600 text-white'
                          : option === 'SMS'
                          ? 'bg-green-600 text-white'
                          : `${theme.accents.tertiary.bgClass} text-gray-900`
                        : 'bg-gray-900 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loadingLeads ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
          ) : leads.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900 border-b border-gray-700">
                  <tr>
                    <th className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase`}>
                      Name
                    </th>
                    <th className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase`}>
                      Phone
                    </th>
                    <th className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase`}>
                      Company
                    </th>
                    <th className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase`}>
                      ICP Score
                    </th>
                    <th className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase`}>
                      Engagement
                    </th>
                    <th className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase`}>
                      Date Enrolled
                    </th>
                    <th className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase`}>
                      Status
                    </th>
                    <th className={`px-6 py-4 text-left text-xs font-semibold ${theme.accents.tertiary.class} uppercase`}>
                      Lead Source
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-700 transition">
                      <td className="px-6 py-4">
                        <Link
                          href={`/leads/${lead.id}`}
                          className={`font-semibold ${theme.core.white} hover:${theme.accents.primary.class} transition`}
                        >
                          {lead.firstName} {lead.lastName}
                        </Link>
                        {lead.jobTitle && (
                          <p className={`text-xs ${theme.core.bodyText} mt-0.5`}>
                            {lead.jobTitle}
                          </p>
                        )}
                      </td>
                      <td className={`px-6 py-4 text-sm ${theme.core.bodyText}`}>
                        {lead.phone || '—'}
                      </td>
                      <td className={`px-6 py-4 text-sm ${theme.core.bodyText}`}>
                        {lead.company || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          (lead.icpScore || 0) >= 70
                            ? 'bg-green-500/20 text-green-400'
                            : (lead.icpScore || 0) >= 40
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {lead.icpScore !== undefined ? lead.icpScore : '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          lead.engagementLevel === 'High'
                            ? 'bg-green-500/20 text-green-400'
                            : lead.engagementLevel === 'Medium'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : lead.engagementLevel === 'Low'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {lead.engagementLevel || '—'}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-sm ${theme.core.bodyText}`}>
                        {lead.enrolledAt ? formatDate(lead.enrolledAt) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              lead.isArchived
                                ? 'bg-gray-600 text-gray-200'
                                : lead.processingStatus === 'Ready for SMS'
                                ? 'bg-purple-500/20 text-purple-300'
                                : lead.processingStatus === 'Queued'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : lead.processingStatus === 'Stopped'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-green-500/20 text-green-400'
                            }`}
                          >
                            {lead.processingStatus || 'Unknown'}
                          </span>
                          {lead.smsEligible && !lead.isArchived && (
                            <span className="px-3 py-1 rounded-full text-xs bg-green-600/20 text-green-300">
                              SMS
                            </span>
                          )}
                          {lead.whatsappEligible && (
                            <span className="px-3 py-1 rounded-full text-xs bg-cyan-600/20 text-cyan-300">
                              WhatsApp
                            </span>
                          )}
                          {(lead.isArchived || lead.smsStop) && (
                            <span className="px-3 py-1 rounded-full text-xs bg-gray-500/20 text-gray-300">
                              Archived
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-gray-900 rounded-full text-xs text-cyan-400">
                          {campaign.name}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={`py-12 text-center ${theme.core.bodyText}`}>
              No leads found for this campaign
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
