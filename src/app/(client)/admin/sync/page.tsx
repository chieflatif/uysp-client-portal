'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { theme } from '@/theme';
import { RefreshCw, Loader2, CheckCircle, AlertCircle, Clock, Database } from 'lucide-react';

interface Client {
  id: string;
  companyName: string;
  airtableBaseId: string | null;
  lastSyncAt: string | null;
}

interface SyncResult {
  clientId: string;
  status: 'idle' | 'syncing' | 'success' | 'error';
  message?: string;
  results?: {
    leads: {
      totalFetched: number;
      totalProcessed: number; // Renamed from totalInserted
      totalDeleted: number;
      errors: number;
      deletionError?: string | null;
    };
    campaigns: {
      synced: number;
      errors: number;
    };
  };
}

interface DeltaSyncResult {
  status: 'idle' | 'syncing' | 'success' | 'error';
  message?: string;
  results?: {
    stage1: {
      processed: number;
      errors: number;
      description: string;
    };
    stage2: {
      updated: number;
      skipped: number;
      errors: number;
      description: string;
    };
  };
  duration?: string;
}

export default function AdminSyncPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncResults, setSyncResults] = useState<Record<string, SyncResult>>({});
  const [deltaSyncResult, setDeltaSyncResult] = useState<DeltaSyncResult>({ status: 'idle' });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && session?.user?.role !== 'SUPER_ADMIN') {
      router.push('/dashboard');
      return;
    }

    if (status === 'authenticated') {
      fetchClients();
    }
  }, [status, session, router]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/clients');

      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }

      const data = await response.json();
      setClients(data.clients || []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load clients';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (clientId: string) => {
    // Set syncing state
    setSyncResults(prev => ({
      ...prev,
      [clientId]: { clientId, status: 'syncing' }
    }));

    try {
      const response = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Sync failed');
      }

      // Update with success
      setSyncResults(prev => ({
        ...prev,
        [clientId]: {
          clientId,
          status: 'success',
          message: data.message,
          results: data.results,
        }
      }));

      // Refresh clients to get updated lastSyncAt
      await fetchClients();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Sync failed';
      setSyncResults(prev => ({
        ...prev,
        [clientId]: {
          clientId,
          status: 'error',
          message: errorMsg,
        }
      }));
    }
  };

  const handleDeltaSync = async (minutes: number = 20) => {
    // Set syncing state
    setDeltaSyncResult({ status: 'syncing' });

    try {
      const response = await fetch('/api/admin/sync/delta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ minutes }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Delta sync failed');
      }

      // Update with success
      setDeltaSyncResult({
        status: 'success',
        message: data.message,
        results: data.results,
        duration: data.duration,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Delta sync failed';
      setDeltaSyncResult({
        status: 'error',
        message: errorMsg,
      });
    }
  };

  const formatRelativeTime = (dateString: string | null): string => {
    if (!dateString) return 'Never';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (status === 'loading' || loading) {
    return (
      <div className={`min-h-screen ${theme.core.darkBg} flex items-center justify-center`}>
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${theme.core.darkBg} ${theme.core.bodyText} p-8`}>
        <div className={`max-w-7xl mx-auto ${theme.components.card} border-red-500/30 bg-red-500/5`}>
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <div>
              <h2 className={`text-xl font-bold ${theme.core.white}`}>Error Loading Clients</h2>
              <p className="text-red-400 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.core.darkBg} ${theme.core.bodyText} p-8`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${theme.core.white} mb-2 flex items-center gap-3`}>
            <Database className={`w-8 h-8 ${theme.accents.tertiary.class}`} />
            Airtable Sync <span className={theme.accents.primary.class}>Manager</span>
          </h1>
          <p className={theme.core.bodyText}>
            Manually trigger Airtable → PostgreSQL sync for each client
          </p>
        </div>

        {/* Quick Delta Sync */}
        <div className={`${theme.components.card} mb-6`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className={`text-xl font-bold ${theme.core.white} mb-2 flex items-center gap-2`}>
                <RefreshCw className={`w-5 h-5 ${theme.accents.tertiary.class}`} />
                Quick Delta Sync
              </h2>
              <p className={`text-sm ${theme.core.bodyText} mb-4`}>
                Sync recently changed leads (last 20 minutes). Fast bi-directional sync for portal-owned fields.
              </p>

              {/* Delta Sync Results */}
              {deltaSyncResult.status === 'syncing' && (
                <div className="flex items-center gap-2 text-cyan-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">Running delta sync...</span>
                </div>
              )}

              {deltaSyncResult.status === 'success' && deltaSyncResult.results && (
                <div className="text-sm space-y-2">
                  <div className="flex items-center gap-2 text-green-400 font-medium">
                    <CheckCircle className="w-4 h-4" />
                    {deltaSyncResult.message}
                    {deltaSyncResult.duration && (
                      <span className={theme.core.bodyText}>({deltaSyncResult.duration})</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                    <div className={`p-3 rounded-lg ${theme.core.darkBg}`}>
                      <p className={`text-xs ${theme.core.bodyText} mb-1`}>Stage 1: AT→PG</p>
                      <p className={`text-lg font-bold ${theme.core.white}`}>
                        {deltaSyncResult.results.stage1.processed} processed
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${theme.core.darkBg}`}>
                      <p className={`text-xs ${theme.core.bodyText} mb-1`}>Stage 2: PG→AT</p>
                      <p className={`text-lg font-bold ${theme.core.white}`}>
                        {deltaSyncResult.results.stage2.updated} updated
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${theme.core.darkBg}`}>
                      <p className={`text-xs ${theme.core.bodyText} mb-1`}>Skipped</p>
                      <p className={`text-lg font-bold ${theme.core.bodyText}`}>
                        {deltaSyncResult.results.stage2.skipped}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${theme.core.darkBg}`}>
                      <p className={`text-xs ${theme.core.bodyText} mb-1`}>Total Errors</p>
                      <p className={`text-lg font-bold ${
                        (deltaSyncResult.results.stage1.errors + deltaSyncResult.results.stage2.errors) > 0
                          ? 'text-red-400'
                          : theme.core.white
                      }`}>
                        {deltaSyncResult.results.stage1.errors + deltaSyncResult.results.stage2.errors}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {deltaSyncResult.status === 'error' && (
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">{deltaSyncResult.message}</span>
                </div>
              )}
            </div>

            {/* Quick Sync Button */}
            <button
              onClick={() => handleDeltaSync(20)}
              disabled={deltaSyncResult.status === 'syncing'}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                deltaSyncResult.status === 'syncing'
                  ? 'bg-cyan-500/20 text-cyan-400 cursor-wait'
                  : `border border-cyan-400 ${theme.accents.tertiary.class} hover:bg-cyan-400 hover:text-gray-900`
              }`}
            >
              {deltaSyncResult.status === 'syncing' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Quick Sync
                </>
              )}
            </button>
          </div>
        </div>

        {/* Full Sync Section Header */}
        <div className="mb-4">
          <h2 className={`text-xl font-bold ${theme.core.white} flex items-center gap-2`}>
            <Database className={`w-5 h-5 ${theme.accents.primary.class}`} />
            Full Client Sync
          </h2>
          <p className={`text-sm ${theme.core.bodyText} mt-1`}>
            Complete Airtable → PostgreSQL sync per client (use for initial sync or major changes)
          </p>
        </div>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 gap-4">
          {clients.map((client) => {
            const syncResult = syncResults[client.id];
            const isSyncing = syncResult?.status === 'syncing';
            const hasError = syncResult?.status === 'error';
            const hasSuccess = syncResult?.status === 'success';

            return (
              <div
                key={client.id}
                className={`${theme.components.card} ${
                  hasError
                    ? 'border-red-500/30 bg-red-500/5'
                    : hasSuccess
                    ? 'border-green-500/30 bg-green-500/5'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  {/* Client Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`text-xl font-bold ${theme.core.white}`}>
                        {client.companyName}
                      </h3>
                      {!client.airtableBaseId && (
                        <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300">
                          No Airtable Base ID
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className={`w-4 h-4 ${theme.core.bodyText}`} />
                        <span className={theme.core.bodyText}>
                          Last Sync: <span className={theme.core.white}>{formatRelativeTime(client.lastSyncAt)}</span>
                        </span>
                      </div>

                      {client.airtableBaseId && (
                        <div className="flex items-center gap-2">
                          <Database className={`w-4 h-4 ${theme.core.bodyText}`} />
                          <span className={theme.core.bodyText}>
                            Base ID: <span className={`${theme.core.white} font-mono text-xs`}>{client.airtableBaseId}</span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Sync Results */}
                    {syncResult && (
                      <div className="mt-4">
                        {syncResult.status === 'syncing' && (
                          <div className="flex items-center gap-2 text-cyan-400">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm font-medium">Syncing with Airtable...</span>
                          </div>
                        )}

                        {syncResult.status === 'success' && syncResult.results && (
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-2 text-green-400 font-medium mb-2">
                              <CheckCircle className="w-4 h-4" />
                              {syncResult.message}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                              <div className={`p-3 rounded-lg ${theme.core.darkBg}`}>
                                <p className={`text-xs ${theme.core.bodyText} mb-1`}>Leads Synced</p>
                                <p className={`text-lg font-bold ${theme.core.white}`}>
                                  {syncResult.results.leads.totalFetched}
                                </p>
                              </div>
                              <div className={`p-3 rounded-lg ${theme.core.darkBg}`}>
                                <p className={`text-xs ${theme.core.bodyText} mb-1`}>Leads Deleted</p>
                                <p className={`text-lg font-bold text-red-400`}>
                                  {syncResult.results.leads.totalDeleted}
                                </p>
                              </div>
                              <div className={`p-3 rounded-lg ${theme.core.darkBg}`}>
                                <p className={`text-xs ${theme.core.bodyText} mb-1`}>Campaigns</p>
                                <p className={`text-lg font-bold ${theme.core.white}`}>
                                  {syncResult.results.campaigns.synced}
                                </p>
                              </div>
                              <div className={`p-3 rounded-lg ${theme.core.darkBg}`}>
                                <p className={`text-xs ${theme.core.bodyText} mb-1`}>Errors</p>
                                <p className={`text-lg font-bold ${
                                  syncResult.results.leads.errors > 0 ? 'text-red-400' : theme.core.white
                                }`}>
                                  {syncResult.results.leads.errors}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {syncResult.status === 'error' && (
                          <div className="flex items-center gap-2 text-red-400">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">{syncResult.message}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Sync Button */}
                  <button
                    onClick={() => handleSync(client.id)}
                    disabled={isSyncing || !client.airtableBaseId}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                      isSyncing
                        ? 'bg-cyan-500/20 text-cyan-400 cursor-wait'
                        : !client.airtableBaseId
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : `border border-cyan-400 ${theme.accents.tertiary.class} hover:bg-cyan-400 hover:text-gray-900`
                    }`}
                  >
                    {isSyncing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Sync Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {clients.length === 0 && (
          <div className={`${theme.components.card} text-center py-12`}>
            <Database className={`w-12 h-12 ${theme.core.bodyText} mx-auto mb-3 opacity-30`} />
            <p className={`${theme.core.bodyText} mb-2`}>No clients found</p>
          </div>
        )}
      </div>
    </div>
  );
}
