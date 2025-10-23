'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { theme } from '@/theme';
import {
  Users,
  UserPlus,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  Copy,
  Check,
  Trash2,
  UserX,
} from 'lucide-react';
import { canManageUsers, isSuperAdmin, getRoleBadgeColor, getRoleName } from '@/lib/auth/permissions-client';

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  clientId: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSetupLink, setShowSetupLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [error, setError] = useState('');
  const [deleteModalUser, setDeleteModalUser] = useState<{ id: string; name: string; action: 'deactivate' | 'delete' } | null>(null);

  // Check permissions
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      if (!canManageUsers(session.user.role)) {
        router.push('/dashboard');
      } else {
        loadUsers();
      }
    }
  }, [status, session, router]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
      } else {
        setError(data.error || 'Failed to load users');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDeactivateUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        // No permanent=true, so this is a soft delete (deactivation)
      });

      const data = await response.json();

      if (response.ok) {
        setDeleteModalUser(null);
        await loadUsers();
      } else {
        alert(data.error || 'Failed to deactivate user');
      }
    } catch (err) {
      alert('An unexpected error occurred');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}?permanent=true`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setDeleteModalUser(null);
        await loadUsers();
      } else {
        alert(data.error || 'Failed to delete user');
      }
    } catch (err) {
      alert('An unexpected error occurred');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className={`min-h-screen ${theme.core.darkBg}`}>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      </div>
    );
  }

  const canAddMoreUsers = () => {
    if (isSuperAdmin(session?.user?.role || '')) {
      return true;
    }
    // CLIENT_ADMIN: max 4 users (2 admins + 2 users)
    // IMPORTANT: Exclude SUPER_ADMIN users from count - they don't count towards client limit
    const activeUsers = users.filter((u) => u.isActive && u.role !== 'SUPER_ADMIN');
    return activeUsers.length < 4;
  };

  // Format role for display - removes "CLIENT_" prefix for client users
  const formatRole = (role: string) => {
    if (role === 'SUPER_ADMIN') return 'Super Admin';
    if (role === 'CLIENT_ADMIN') return 'Admin';
    if (role === 'CLIENT_USER') return 'User';
    return role;
  };

  return (
    <div className={`min-h-screen ${theme.core.darkBg}`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
            <p className="text-gray-400">
              Manage users and access permissions
            </p>
          </div>
          {canAddMoreUsers() && (
            <button
              onClick={() => setShowAddModal(true)}
              className={`${theme.components.button.primary} flex items-center gap-2`}
            >
              <UserPlus className="w-5 h-5" />
              Add User
            </button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* User Limit Warning */}
        {!canAddMoreUsers() && !isSuperAdmin(session?.user?.role || '') && (
          <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-6 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <p className="text-yellow-400">
              Maximum user limit reached (1 admin + 1 user per client)
            </p>
          </div>
        )}

        {/* Users Table */}
        <div className={`${theme.components.card} overflow-hidden`}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-4 px-6 text-gray-300 font-semibold">Name</th>
                <th className="text-left py-4 px-6 text-gray-300 font-semibold">Email</th>
                {isSuperAdmin(session?.user?.role || '') && (
                  <th className="text-left py-4 px-6 text-gray-300 font-semibold">Organization</th>
                )}
                <th className="text-left py-4 px-6 text-gray-300 font-semibold">Role</th>
                <th className="text-left py-4 px-6 text-gray-300 font-semibold">Status</th>
                <th className="text-left py-4 px-6 text-gray-300 font-semibold">Last Login</th>
                <th className="text-right py-4 px-6 text-gray-300 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin(session?.user?.role || '') ? 7 : 6} className="text-center py-12 text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No users found</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                    <td className="py-4 px-6">
                      <div className="text-white font-medium">
                        {user.firstName} {user.lastName}
                      </div>
                      {user.mustChangePassword && (
                        <div className="text-xs text-yellow-400 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3" />
                          Must change password
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-gray-300">{user.email}</td>
                    {isSuperAdmin(session?.user?.role || '') && (
                      <td className="py-4 px-6 text-gray-300">
                        {(user as any).clientOrganization || 'N/A'}
                      </td>
                    )}
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.role === 'SUPER_ADMIN'
                            ? 'bg-pink-700 text-white'
                            : user.role === 'CLIENT_ADMIN'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-cyan-400 text-gray-900'
                        }`}
                      >
                        {formatRole(user.role)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.isActive
                            ? 'bg-green-900/30 text-green-400 border border-green-700'
                            : 'bg-red-900/30 text-red-400 border border-red-700'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-400 text-sm">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        {user.id !== session?.user?.id && (
                          <>
                            {user.isActive && (
                              <button
                                onClick={() => setDeleteModalUser({
                                  id: user.id,
                                  name: `${user.firstName} ${user.lastName}`,
                                  action: 'deactivate'
                                })}
                                className="text-yellow-400 hover:text-yellow-300 p-2 rounded hover:bg-yellow-900/20"
                                title="Deactivate user (temporary)"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteModalUser({
                                id: user.id,
                                name: `${user.firstName} ${user.lastName}`,
                                action: 'delete'
                              })}
                              className="text-red-400 hover:text-red-300 p-2 rounded hover:bg-red-900/20"
                              title="Delete user permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onSuccess={(setupLink) => {
            setShowSetupLink(setupLink);
            setShowAddModal(false);
            loadUsers();
          }}
          isSuperAdmin={isSuperAdmin(session?.user?.role || '')}
        />
      )}

      {/* Setup Link Display Modal */}
      {showSetupLink && (
        <SetupLinkModal
          setupLink={showSetupLink}
          onClose={() => {
            setShowSetupLink(null);
            setCopiedLink(false);
          }}
          onCopy={() => handleCopyLink(showSetupLink)}
          copied={copiedLink}
        />
      )}

      {/* Delete/Deactivate Confirmation Modal */}
      {deleteModalUser && (
        <DeleteConfirmModal
          user={deleteModalUser}
          onConfirm={() => {
            if (deleteModalUser.action === 'delete') {
              handleDeleteUser(deleteModalUser.id);
            } else {
              handleDeactivateUser(deleteModalUser.id);
            }
          }}
          onCancel={() => setDeleteModalUser(null)}
        />
      )}
    </div>
  );
}

// Add User Modal Component
function AddUserModal({
  onClose,
  onSuccess,
  isSuperAdmin,
}: {
  onClose: () => void;
  onSuccess: (setupLink: string) => void;
  isSuperAdmin: boolean;
}) {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'CLIENT_USER',
    clientId: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clients, setClients] = useState<Array<{ id: string; companyName: string }>>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  // Fetch clients if super admin
  useEffect(() => {
    if (isSuperAdmin) {
      setLoadingClients(true);
      fetch('/api/admin/clients')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.clients) {
            setClients(data.clients);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch clients:', err);
          setError('Failed to load clients list');
        })
        .finally(() => {
          setLoadingClients(false);
        });
    }
  }, [isSuperAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess(data.setupUrl);
      } else {
        setError(data.error || 'Failed to create user');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Add New User</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 mb-4 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={theme.components.input}
              placeholder="user@example.com"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                First Name
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className={theme.components.input}
                placeholder="John"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className={theme.components.input}
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className={theme.components.input}
              required
            >
              <option value="CLIENT_USER">User (Read-only)</option>
              <option value="CLIENT_ADMIN">Admin (Full Access)</option>
            </select>
          </div>

          {isSuperAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Client Organization
              </label>
              {loadingClients ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading clients...
                </div>
              ) : (
                <select
                  value={formData.clientId}
                  onChange={(e) =>
                    setFormData({ ...formData, clientId: e.target.value })
                  }
                  className={theme.components.input}
                  required
                >
                  <option value="">Select a client...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.companyName}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`${theme.components.button.primary} flex-1 flex items-center justify-center gap-2`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Create User
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`${theme.components.button.ghost} px-6`}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Setup Link Display Modal
function SetupLinkModal({
  setupLink,
  onClose,
  onCopy,
  copied,
}: {
  setupLink: string;
  onClose: () => void;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg max-w-lg w-full p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">User Invited!</h2>
          <p className="text-gray-400">
            An invitation email has been sent. You can also share this setup link manually.
          </p>
        </div>

        {/* Setup Link Display */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Password Setup Link:
          </label>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-cyan-400 text-sm font-mono bg-gray-800 px-3 py-2 rounded break-all">
              {setupLink}
            </code>
            <button
              onClick={onCopy}
              className={`${
                copied ? 'bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'
              } text-white p-2 rounded transition flex-shrink-0`}
              title={copied ? 'Copied!' : 'Copy link'}
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-6">
          <p className="text-blue-400 text-sm flex items-start gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>
              The user will create their own secure password when they click the link.
              No temporary passwords needed!
            </span>
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className={`${theme.components.button.primary} w-full`}
        >
          Close
        </button>
      </div>
    </div>
  );
}

// Delete/Deactivate Confirmation Modal
function DeleteConfirmModal({
  user,
  onConfirm,
  onCancel,
}: {
  user: { id: string; name: string; action: 'deactivate' | 'delete' };
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isDelete = user.action === 'delete';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className={`p-3 rounded-lg ${isDelete ? 'bg-red-900/30' : 'bg-yellow-900/30'}`}>
            {isDelete ? (
              <Trash2 className="w-6 h-6 text-red-400" />
            ) : (
              <UserX className="w-6 h-6 text-yellow-400" />
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white mb-1">
              {isDelete ? 'Delete User Permanently?' : 'Deactivate User?'}
            </h2>
            <p className="text-gray-400 text-sm">
              {isDelete
                ? 'This action cannot be undone'
                : 'You can reactivate this user later'}
            </p>
          </div>
        </div>

        {/* User Info */}
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 mb-6">
          <p className="text-white font-medium">{user.name}</p>
          {isDelete ? (
            <div className="mt-2 text-sm">
              <p className="text-red-400 font-medium">⚠️ This will permanently:</p>
              <ul className="list-disc list-inside text-gray-400 mt-1 space-y-1">
                <li>Remove the user from the database</li>
                <li>Revoke all access immediately</li>
                <li>Delete cannot be undone</li>
              </ul>
            </div>
          ) : (
            <div className="mt-2 text-sm">
              <p className="text-yellow-400 font-medium">This will temporarily:</p>
              <ul className="list-disc list-inside text-gray-400 mt-1 space-y-1">
                <li>Revoke user's access</li>
                <li>Keep user data intact</li>
                <li>Can be reactivated later</li>
              </ul>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className={`${theme.components.button.ghost} flex-1`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
              isDelete
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-yellow-600 hover:bg-yellow-700 text-white'
            }`}
          >
            {isDelete ? 'Delete Permanently' : 'Deactivate User'}
          </button>
        </div>
      </div>
    </div>
  );
}
