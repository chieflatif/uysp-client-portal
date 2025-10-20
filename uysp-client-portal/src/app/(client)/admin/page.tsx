'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Shield, 
  Users, 
  Building2, 
  Activity,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { theme } from '@/lib/theme';

interface Client {
  id: string;
  companyName: string;
  email: string;
  phone: string | null;
  airtableBaseId: string;
  isActive: boolean;
  lastSyncAt: string | null;
  createdAt: string;
}

interface AdminStats {
  totalClients: number;
  activeClients: number;
  totalUsers: number;
  totalLeads: number;
  leadsByClient: Array<{
    clientId: string;
    clientName: string;
    leadCount: number;
    userCount: number;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    details: string | null;
    createdAt: string;
    userId: string | null;
  }>;
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);

  // Add client form state
  const [newClient, setNewClient] = useState({
    companyName: '',
    email: '',
    phone: '',
    airtableBaseId: '',
  });
  
  // Add user form state
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    clientId: '',
    role: 'CLIENT' as 'CLIENT' | 'ADMIN',
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    // Check if user is ADMIN
    if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
      router.push('/dashboard');
      return;
    }

    fetchAdminData();
  }, [status, session, router]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Fetch clients
      const clientsRes = await fetch('/api/admin/clients');
      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        setClients(clientsData.clients || []);
      }

      // Fetch admin stats
      const statsRes = await fetch('/api/admin/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validation
    if (!newClient.companyName.trim()) {
      setError('Company name is required');
      return;
    }
    if (!newClient.email.trim() || !newClient.email.includes('@')) {
      setError('Valid email is required');
      return;
    }
    if (!newClient.airtableBaseId.trim() || !newClient.airtableBaseId.startsWith('app')) {
      setError('Valid Airtable Base ID is required (starts with "app")');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create client');
        return;
      }

      setSuccess(`Client "${newClient.companyName}" created successfully!`);
      setNewClient({ companyName: '', email: '', phone: '', airtableBaseId: '' });
      setShowAddClient(false);
      
      // Refresh data
      fetchAdminData();
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validation
    if (!newUser.email.trim() || !newUser.email.includes('@')) {
      setError('Valid email is required');
      return;
    }
    if (newUser.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!newUser.firstName.trim() || !newUser.lastName.trim()) {
      setError('First and last name are required');
      return;
    }
    if (!newUser.clientId) {
      setError('Please select a client');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create user');
        return;
      }

      setSuccess(`User "${newUser.firstName} ${newUser.lastName}" created successfully!`);
      setNewUser({ email: '', password: '', firstName: '', lastName: '', clientId: '', role: 'CLIENT' });
      setShowAddUser(false);
      
      // Refresh data
      fetchAdminData();
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${theme.core.darkBg} flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className={`${theme.core.bodyText} text-sm`}>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.core.darkBg} p-8`}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-pink-700/10">
              <Shield className="w-8 h-8 text-pink-700" />
            </div>
            <div>
              <h1 className={`text-4xl font-bold ${theme.core.white}`}>
                <span className={theme.accents.primary.class}>Admin</span> Dashboard
              </h1>
              <p className={theme.core.bodyText}>System administration and client management</p>
            </div>
          </div>
          
          {!showAddClient && !showAddUser && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddClient(true)}
                className={theme.components.button.primary}
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Add Client
              </button>
              <button
                onClick={() => setShowAddUser(true)}
                className={theme.components.button.secondary}
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Add User
              </button>
            </div>
          )}
        </div>

        {/* Admin Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`${theme.components.card} border-l-4 border-l-pink-700`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-xs ${theme.accents.primary.class} uppercase tracking-wider mb-1 font-semibold`}>
                    Total Clients
                  </p>
                  <p className={`text-3xl font-bold ${theme.core.white}`}>
                    {stats.totalClients}
                  </p>
                  <p className={`text-xs ${theme.core.bodyText} mt-1`}>
                    {stats.activeClients} active
                  </p>
                </div>
                <Building2 className="w-6 h-6 text-pink-700" />
              </div>
            </div>

            <div className={`${theme.components.card} border-l-4 border-l-cyan-400`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-xs ${theme.accents.tertiary.class} uppercase tracking-wider mb-1 font-semibold`}>
                    Total Users
                  </p>
                  <p className={`text-3xl font-bold ${theme.core.white}`}>
                    {stats.totalUsers}
                  </p>
                  <p className={`text-xs ${theme.core.bodyText} mt-1`}>Across all clients</p>
                </div>
                <Users className="w-6 h-6 text-cyan-400" />
              </div>
            </div>

            <div className={`${theme.components.card} border-l-4 border-l-indigo-600`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-xs ${theme.accents.secondary.class} uppercase tracking-wider mb-1 font-semibold`}>
                    Total Leads
                  </p>
                  <p className={`text-3xl font-bold ${theme.core.white}`}>
                    {stats.totalLeads.toLocaleString()}
                  </p>
                  <p className={`text-xs ${theme.core.bodyText} mt-1`}>System-wide</p>
                </div>
                <Activity className="w-6 h-6 text-indigo-600" />
              </div>
            </div>

            <div className={`${theme.components.card} border-l-4 border-l-green-500`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-xs text-green-400 uppercase tracking-wider mb-1 font-semibold`}>
                    Avg Leads/Client
                  </p>
                  <p className={`text-3xl font-bold ${theme.core.white}`}>
                    {stats.totalClients > 0 
                      ? Math.round(stats.totalLeads / stats.totalClients).toLocaleString()
                      : 0
                    }
                  </p>
                  <p className={`text-xs ${theme.core.bodyText} mt-1`}>Per client</p>
                </div>
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </div>
        )}

        {/* Success/Error Messages */}
        {success && (
          <div className="p-4 rounded-lg bg-green-900/20 border border-green-600/50 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-green-300 font-medium">{success}</p>
            </div>
            <button onClick={() => setSuccess('')} className="text-green-400 hover:text-green-300">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-red-900/20 border border-red-600/50 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-300 font-medium">{error}</p>
            </div>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-300">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Add User Form */}
        {showAddUser && (
          <div className={theme.components.card}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-bold ${theme.core.white}`}>
                Add New <span className={theme.accents.secondary.class}>User</span>
              </h2>
              <button
                onClick={() => {
                  setShowAddUser(false);
                  setError('');
                  setNewUser({ email: '', password: '', firstName: '', lastName: '', clientId: '', role: 'CLIENT' });
                }}
                className={`text-sm ${theme.core.bodyText} hover:text-white`}
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${theme.accents.tertiary.class} mb-2`}>
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    className={theme.components.input}
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${theme.accents.tertiary.class} mb-2`}>
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    className={theme.components.input}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.accents.tertiary.class} mb-2`}>
                  Email *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className={theme.components.input}
                  placeholder="user@company.com"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.accents.tertiary.class} mb-2`}>
                  Password *
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className={theme.components.input}
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.accents.tertiary.class} mb-2`}>
                  Assign to Client *
                </label>
                <select
                  value={newUser.clientId}
                  onChange={(e) => setNewUser({ ...newUser, clientId: e.target.value })}
                  className={theme.components.input}
                  required
                >
                  <option value="">Select a client...</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.companyName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.accents.tertiary.class} mb-2`}>
                  Role *
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'CLIENT' | 'ADMIN' })}
                  className={theme.components.input}
                >
                  <option value="CLIENT">Client User (Standard Access)</option>
                  <option value="ADMIN">Admin (Full Access)</option>
                </select>
                <p className={`text-xs ${theme.core.bodyText} mt-1`}>
                  Client users see only their client&apos;s data. Admins see all clients.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className={theme.components.button.secondary}
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Create User
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className={theme.components.button.ghost}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Add Client Form */}
        {showAddClient && (
          <div className={theme.components.card}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-bold ${theme.core.white}`}>
                Add New <span className={theme.accents.primary.class}>Client</span>
              </h2>
              <button
                onClick={() => {
                  setShowAddClient(false);
                  setError('');
                  setNewClient({ companyName: '', email: '', phone: '', airtableBaseId: '' });
                }}
                className={`text-sm ${theme.core.bodyText} hover:text-white`}
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleAddClient} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${theme.accents.tertiary.class} mb-2`}>
                  Company Name *
                </label>
                <input
                  type="text"
                  value={newClient.companyName}
                  onChange={(e) => setNewClient({ ...newClient, companyName: e.target.value })}
                  className={theme.components.input}
                  placeholder="Acme Corporation"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.accents.tertiary.class} mb-2`}>
                  Contact Email *
                </label>
                <input
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  className={theme.components.input}
                  placeholder="contact@acme.com"
                  required
                />
                <p className={`text-xs ${theme.core.bodyText} mt-1`}>
                  Users with matching email domain can register
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.accents.tertiary.class} mb-2`}>
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  className={theme.components.input}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.accents.tertiary.class} mb-2`}>
                  Airtable Base ID *
                </label>
                <input
                  type="text"
                  value={newClient.airtableBaseId}
                  onChange={(e) => setNewClient({ ...newClient, airtableBaseId: e.target.value })}
                  className={theme.components.input}
                  placeholder="appXXXXXXXXXXXXXX"
                  required
                />
                <p className={`text-xs ${theme.core.bodyText} mt-1`}>
                  Find this in your Airtable base URL (starts with "app")
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className={theme.components.button.primary}
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Create Client
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddClient(false)}
                  className={theme.components.button.ghost}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Clients List */}
        <div className={theme.components.card}>
          <h2 className={`text-xl font-bold ${theme.core.white} mb-4 flex items-center gap-2`}>
            <Building2 className={`w-5 h-5 ${theme.accents.tertiary.class}`} />
            Client <span className={theme.accents.primary.class}>Management</span>
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className={`text-left py-3 px-4 ${theme.accents.tertiary.class} text-xs uppercase tracking-wider font-semibold`}>
                    Company
                  </th>
                  <th className={`text-left py-3 px-4 ${theme.accents.tertiary.class} text-xs uppercase tracking-wider font-semibold`}>
                    Contact Email
                  </th>
                  <th className={`text-left py-3 px-4 ${theme.accents.tertiary.class} text-xs uppercase tracking-wider font-semibold`}>
                    Airtable Base
                  </th>
                  <th className={`text-right py-3 px-4 ${theme.accents.tertiary.class} text-xs uppercase tracking-wider font-semibold`}>
                    Leads
                  </th>
                  <th className={`text-right py-3 px-4 ${theme.accents.tertiary.class} text-xs uppercase tracking-wider font-semibold`}>
                    Users
                  </th>
                  <th className={`text-center py-3 px-4 ${theme.accents.tertiary.class} text-xs uppercase tracking-wider font-semibold`}>
                    Status
                  </th>
                  <th className={`text-left py-3 px-4 ${theme.accents.tertiary.class} text-xs uppercase tracking-wider font-semibold`}>
                    Last Sync
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {clients.map((client) => {
                  const clientStats = stats?.leadsByClient.find(s => s.clientId === client.id);
                  return (
                    <tr key={client.id} className="hover:bg-gray-800 transition">
                      <td className={`py-3 px-4 font-medium ${theme.core.white}`}>
                        {client.companyName}
                      </td>
                      <td className={`py-3 px-4 ${theme.core.bodyText}`}>
                        {client.email}
                      </td>
                      <td className={`py-3 px-4 font-mono text-sm ${theme.accents.secondary.class}`}>
                        {client.airtableBaseId}
                      </td>
                      <td className={`text-right py-3 px-4 ${theme.core.white} font-semibold`}>
                        {clientStats?.leadCount.toLocaleString() || 0}
                      </td>
                      <td className={`text-right py-3 px-4 ${theme.core.white} font-semibold`}>
                        {clientStats?.userCount || 0}
                      </td>
                      <td className="text-center py-3 px-4">
                        {client.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold">
                            <XCircle className="w-3 h-3" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className={`py-3 px-4 text-sm ${theme.core.bodyText}`}>
                        {client.lastSyncAt 
                          ? new Date(client.lastSyncAt).toLocaleDateString()
                          : 'Never'
                        }
                      </td>
                    </tr>
                  );
                })}
                {clients.length === 0 && (
                  <tr>
                    <td colSpan={7} className={`py-12 text-center ${theme.core.bodyText}`}>
                      No clients yet. Click "Add Client" to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Client Breakdown Cards */}
        {stats && stats.leadsByClient.length > 0 && (
          <div>
            <h2 className={`text-xl font-bold ${theme.core.white} mb-4`}>
              Client <span className={theme.accents.primary.class}>Breakdown</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.leadsByClient.map((clientData) => (
                <div key={clientData.clientId} className={`${theme.components.card} border-l-4 border-l-indigo-600`}>
                  <h3 className={`font-bold ${theme.core.white} mb-3`}>
                    {clientData.clientName}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={theme.core.bodyText}>Leads:</span>
                      <span className={`font-bold text-lg ${theme.accents.tertiary.class}`}>
                        {clientData.leadCount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={theme.core.bodyText}>Users:</span>
                      <span className={`font-bold ${theme.accents.secondary.class}`}>
                        {clientData.userCount}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
