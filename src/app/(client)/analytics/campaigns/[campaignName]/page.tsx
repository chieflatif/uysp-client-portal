'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, Users, MousePointerClick, MessageSquare, Loader2 } from 'lucide-react';
import { theme } from '@/theme';
import Link from 'next/link';

interface CampaignDetail {
  name: string;
  totalLeads: number;
  sequenceSteps: {
    notStarted: number;
    step1: number;
    step2: number;
    step3: number;
    completed: number;
  };
  conversions: {
    booked: number;
    optedOut: number;
    clicked: number;
    bookingRate: number;
    optOutRate: number;
    clickRate: number;
  };
  messages: {
    totalSent: number;
    avgPerLead: number;
  };
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignName = decodeURIComponent(params.campaignName as string);
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');

  useEffect(() => {
    fetchCampaignDetail();
  }, [campaignName, period]);

  const fetchCampaignDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/analytics/campaigns?campaignName=${encodeURIComponent(campaignName)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.campaigns && data.campaigns.length > 0) {
          setCampaign(data.campaigns[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching campaign detail:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${theme.core.darkBg} flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className={theme.core.bodyText}>Loading campaign details...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className={`min-h-screen ${theme.core.darkBg} p-8`}>
        <Link href="/analytics" className={`flex items-center gap-2 ${theme.accents.primary.class} hover:text-white mb-8`}>
          <ArrowLeft className="w-4 h-4" />
          Back to Analytics
        </Link>
        <p className={theme.core.bodyText}>Campaign not found</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.core.darkBg} p-8`}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <Link href="/analytics" className={`flex items-center gap-2 ${theme.accents.primary.class} hover:text-white mb-4`}>
            <ArrowLeft className="w-4 h-4" />
            Back to Analytics
          </Link>
          <h1 className={`text-4xl font-bold ${theme.core.white}`}>
            <span className={theme.accents.primary.class}>{campaign.name}</span> Campaign
          </h1>
          <p className={theme.core.bodyText}>Detailed performance analytics</p>
        </div>

        {/* Time Period Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('all')}
            className={`px-3 py-1 rounded text-sm font-semibold transition ${
              period === 'all' ? 'bg-cyan-600 text-white' : theme.components.button.ghost
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => setPeriod('7d')}
            className={`px-3 py-1 rounded text-sm font-semibold transition ${
              period === '7d' ? 'bg-cyan-600 text-white' : theme.components.button.ghost
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setPeriod('30d')}
            className={`px-3 py-1 rounded text-sm font-semibold transition ${
              period === '30d' ? 'bg-cyan-600 text-white' : theme.components.button.ghost
            }`}
          >
            Last 30 Days
          </button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`${theme.components.card} border-l-4 border-l-cyan-400`}>
            <p className="text-xs text-cyan-400 uppercase tracking-wider mb-1 font-semibold">Total Leads</p>
            <p className="text-3xl font-bold text-white">{campaign.totalLeads.toLocaleString()}</p>
          </div>
          <div className={`${theme.components.card} border-l-4 border-l-green-500`}>
            <p className="text-xs text-green-400 uppercase tracking-wider mb-1 font-semibold">Booking Rate</p>
            <p className="text-3xl font-bold text-green-400">{campaign.conversions.bookingRate.toFixed(1)}%</p>
            <p className="text-xs text-green-300 mt-1">{campaign.conversions.booked} booked</p>
          </div>
          <div className={`${theme.components.card} border-l-4 border-l-blue-500`}>
            <p className="text-xs text-blue-400 uppercase tracking-wider mb-1 font-semibold">Click Rate</p>
            <p className="text-3xl font-bold text-blue-400">{campaign.conversions.clickRate.toFixed(1)}%</p>
            <p className="text-xs text-blue-300 mt-1">{campaign.conversions.clicked} clicked</p>
          </div>
          <div className={`${theme.components.card} border-l-4 border-l-orange-500`}>
            <p className="text-xs text-orange-400 uppercase tracking-wider mb-1 font-semibold">Opt-Out Rate</p>
            <p className="text-3xl font-bold text-orange-400">{campaign.conversions.optOutRate.toFixed(1)}%</p>
            <p className="text-xs text-orange-300 mt-1">{campaign.conversions.optedOut} opted out</p>
          </div>
        </div>

        {/* Sequence Progress */}
        <div className={theme.components.card}>
          <h2 className={`text-xl font-bold ${theme.core.white} mb-6`}>
            Sequence <span className={theme.accents.primary.class}>Progress</span>
          </h2>
          <div className="grid grid-cols-5 gap-4">
            <div className="text-center">
              <p className={`text-sm ${theme.accents.tertiary.class} mb-2`}>Not Started</p>
              <p className={`text-2xl font-bold ${theme.core.white}`}>{campaign.sequenceSteps.notStarted}</p>
            </div>
            <div className="text-center">
              <p className={`text-sm ${theme.accents.tertiary.class} mb-2`}>Step 1</p>
              <p className={`text-2xl font-bold ${theme.core.white}`}>{campaign.sequenceSteps.step1}</p>
            </div>
            <div className="text-center">
              <p className={`text-sm ${theme.accents.tertiary.class} mb-2`}>Step 2</p>
              <p className={`text-2xl font-bold ${theme.core.white}`}>{campaign.sequenceSteps.step2}</p>
            </div>
            <div className="text-center">
              <p className={`text-sm ${theme.accents.tertiary.class} mb-2`}>Step 3</p>
              <p className={`text-2xl font-bold ${theme.core.white}`}>{campaign.sequenceSteps.step3}</p>
            </div>
            <div className="text-center">
              <p className={`text-sm text-green-400 mb-2`}>Completed</p>
              <p className={`text-2xl font-bold text-green-400`}>{campaign.sequenceSteps.completed}</p>
            </div>
          </div>
        </div>

        {/* Messages Sent */}
        <div className={theme.components.card}>
          <h2 className={`text-xl font-bold ${theme.core.white} mb-4`}>
            Message <span className={theme.accents.primary.class}>Activity</span>
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className={`text-sm ${theme.accents.tertiary.class} uppercase tracking-wider mb-1`}>Total Messages Sent</p>
              <p className={`text-3xl font-bold ${theme.core.white}`}>{campaign.messages.totalSent.toLocaleString()}</p>
            </div>
            <div>
              <p className={`text-sm ${theme.accents.tertiary.class} uppercase tracking-wider mb-1`}>Avg Per Lead</p>
              <p className={`text-3xl font-bold ${theme.core.white}`}>{campaign.messages.avgPerLead.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
