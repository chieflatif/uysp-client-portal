'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { theme } from '@/theme';
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2, Mail, Phone, Building2, XCircle } from 'lucide-react';
import { NotesList } from '@/components/notes/NotesList';
import { LeadTimeline } from '@/components/activity/LeadTimeline';

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
  claimedBy?: string;
  claimedAt?: string;
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession();
  const [id, setId] = useState<string>('');

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [removeReason, setRemoveReason] = useState('');

  useEffect(() => {
    if (params?.id) {
      setId(params.id as string);
    }
  }, [params]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    const fetchLead = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/leads/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch lead');
        }

        const data = await response.json();
        setLead(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading lead');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchLead();
    }
  }, [id, status, router]);

  const handleClaim = async () => {
    if (!lead) return;
    
    try {
      setClaiming(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/leads/${id}/claim`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to claim lead');
      }

      const data = await response.json();
      setLead(data);
      setSuccess('Lead claimed successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error claiming lead');
    } finally {
      setClaiming(false);
    }
  };

  const handleUnclaim = async () => {
    if (!lead) return;
    
    try {
      setClaiming(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/leads/${id}/unclaim`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to unclaim lead');
      }

      const data = await response.json();
      setLead(data);
      setSuccess('Lead unclaimed successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error unclaiming lead');
    } finally {
      setClaiming(false);
    }
  };

  const handleRemoveFromCampaign = async () => {
    if (!lead || !removeReason.trim()) {
      setError('Please provide a reason for removing this lead from the campaign');
      return;
    }
    
    try {
      setRemoving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/leads/${id}/remove-from-campaign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: removeReason,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove lead from campaign');
      }

      setSuccess('Lead removed from campaign successfully. Status updated in Airtable.');
      setShowRemoveDialog(false);
      setRemoveReason('');
      
      // Refresh lead data
      const leadRes = await fetch(`/api/leads/${id}`);
      if (leadRes.ok) {
        const data = await leadRes.json();
        setLead(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error removing lead from campaign');
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${theme.core.darkBg} p-8`}>
        <div className="max-w-4xl mx-auto flex items-center justify-center min-h-96">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error && !lead) {
    return (
      <div className={`min-h-screen ${theme.core.darkBg} p-8`}>
        <div className="max-w-4xl mx-auto">
          <Link href="/leads" className={`flex items-center gap-2 ${theme.accents.tertiary.class} hover:text-cyan-300 mb-6`}>
            <ArrowLeft className="w-4 h-4" />
            Back to Leads
          </Link>
          <div className="p-4 rounded-lg bg-red-900/20 border border-red-700/50 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!lead) {
    return null;
  }

  const isClaimed = !!lead.claimedBy;

  return (
    <div className={`min-h-screen ${theme.core.darkBg} p-8`}>
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href="/leads" className={`flex items-center gap-2 ${theme.accents.tertiary.class} hover:text-cyan-300 font-medium`}>
          <ArrowLeft className="w-4 h-4" />
          Back to Leads
        </Link>

        {success && (
          <div className="p-4 rounded-lg bg-green-900/20 border border-green-700/50 flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-green-300">{success}</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-red-900/20 border border-red-700/50 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300">{error}</p>
          </div>
        )}

        <div className={`${theme.components.card} border-l-4 border-l-cyan-400`}>
          <div className="flex justify-between items-start gap-4">
            <div>
              <h1 className={`text-3xl font-bold ${theme.core.white} mb-2`}>
                {lead.firstName} {lead.lastName}
              </h1>
              <p className={`${theme.core.bodyText} mb-4`}>
                {lead.title || 'No title'} {lead.company && `at ${lead.company}`}
              </p>
              <div className="flex items-center gap-4">
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                  lead.icpScore >= 70 ? theme.accents.primary.bgClass : 
                  lead.icpScore >= 40 ? theme.accents.secondary.bgClass :
                  'bg-gray-700'
                } text-white`}>
                  ICP Score: {lead.icpScore}
                </span>
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                  lead.status.toLowerCase().includes('booked') ? theme.accents.primary.bgClass :
                  lead.status.toLowerCase().includes('replied') ? theme.accents.secondary.bgClass :
                  lead.status.toLowerCase().includes('clicked') ? theme.accents.tertiary.bgClass :
                  'bg-gray-700'
                } text-white`}>
                  {lead.status}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              {isClaimed ? (
                <button
                  onClick={handleUnclaim}
                  disabled={claiming}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${theme.components.button.secondary} disabled:opacity-50`}
                >
                  {claiming && <Loader2 className="w-4 h-4 animate-spin" />}
                  {claiming ? 'Processing...' : 'Unclaim Lead'}
                </button>
              ) : (
                <button
                  onClick={handleClaim}
                  disabled={claiming}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${theme.components.button.primary} disabled:opacity-50`}
                >
                  {claiming && <Loader2 className="w-4 h-4 animate-spin" />}
                  {claiming ? 'Processing...' : 'Claim Lead'}
                </button>
              )}
              
              <button
                onClick={() => setShowRemoveDialog(true)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white disabled:opacity-50`}
              >
                <XCircle className="w-4 h-4" />
                Remove from Campaign
              </button>
            </div>
          </div>
        </div>

        <div className={theme.components.card}>
          <h2 className={`text-xl font-bold ${theme.core.white} mb-4`}>Contact Information</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-cyan-400" />
              <div>
                <p className={`text-xs ${theme.core.bodyText}`}>Email</p>
                <a href={`mailto:${lead.email}`} className={`${theme.accents.tertiary.class} hover:text-cyan-300 font-medium`}>
                  {lead.email}
                </a>
              </div>
            </div>
            {lead.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className={`text-xs ${theme.core.bodyText}`}>Phone</p>
                  <a href={`tel:${lead.phone}`} className={`${theme.accents.tertiary.class} hover:text-cyan-300 font-medium`}>
                    {lead.phone}
                  </a>
                </div>
              </div>
            )}
            {lead.company && (
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className={`text-xs ${theme.core.bodyText}`}>Company</p>
                  <p className={`${theme.core.white} font-medium`}>{lead.company}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={theme.components.card}>
          <h2 className={`text-xl font-bold ${theme.core.white} mb-4`}>Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className={`text-xs ${theme.core.bodyText} mb-1`}>Created</p>
              <p className={`${theme.core.white} font-medium`}>
                {new Date(lead.createdAt).toLocaleDateString()}
              </p>
            </div>
            {lead.claimedBy && lead.claimedAt && (
              <div>
                <p className={`text-xs ${theme.core.bodyText} mb-1`}>Claimed By</p>
                <p className={`${theme.core.white} font-medium`}>{lead.claimedBy}</p>
              </div>
            )}
          </div>
        </div>

        <NotesList leadId={lead.id} />

        <LeadTimeline leadId={lead.id} />

        {/* Remove from Campaign Dialog */}
        {showRemoveDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className={`${theme.components.card} max-w-md w-full`}>
              <h2 className={`text-xl font-bold ${theme.core.white} mb-4`}>
                Remove from Campaign
              </h2>
              <p className={`${theme.core.bodyText} mb-4`}>
                This will stop all automated messages to {lead.firstName} {lead.lastName} and update their status in Airtable.
              </p>
              
              <div className="mb-4">
                <label className={`block text-sm font-medium ${theme.core.white} mb-2`}>
                  Reason for removal *
                </label>
                <textarea
                  value={removeReason}
                  onChange={(e) => setRemoveReason(e.target.value)}
                  placeholder="e.g., Lead requested to stop, Not interested, etc."
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white placeholder-gray-400 min-h-[100px]"
                  maxLength={500}
                />
                <p className="text-xs text-gray-400 mt-1">
                  {removeReason.length}/500 characters
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRemoveDialog(false);
                    setRemoveReason('');
                    setError(null);
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold ${theme.components.button.ghost}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveFromCampaign}
                  disabled={removing || !removeReason.trim()}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50`}
                >
                  {removing && <Loader2 className="w-4 h-4 animate-spin" />}
                  {removing ? 'Removing...' : 'Confirm Removal'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
