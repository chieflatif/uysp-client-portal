'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Lock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { theme } from '@/theme';

export default function ChangePasswordPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to change password');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Failed to change password', error);
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen ${theme.core.darkBg} flex items-center justify-center p-8`}>
      <div className="w-full max-w-md">
        <div className={theme.components.card}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-pink-700/10">
              <Lock className="w-6 h-6 text-pink-700" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${theme.core.white}`}>
                Change <span className={theme.accents.primary.class}>Password</span>
              </h1>
              <p className={`text-sm ${theme.core.bodyText}`}>
                {session?.user?.mustChangePassword 
                  ? 'You must change your password to continue'
                  : 'Update your account password'
                }
              </p>
            </div>
          </div>

          {success ? (
            <div className="p-4 rounded-lg bg-green-900/20 border border-green-600/50">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-300 font-medium">Password changed successfully!</p>
                  <p className="text-green-300/70 text-sm mt-1">Redirecting to dashboard...</p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-4 rounded-lg bg-red-900/20 border border-red-600/50">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300 font-medium">{error}</p>
                  </div>
                </div>
              )}

              <div>
                <label className={`block text-sm font-medium ${theme.accents.tertiary.class} mb-2`}>
                  Current Password *
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={theme.components.input}
                  placeholder="Enter your current password"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.accents.tertiary.class} mb-2`}>
                  New Password *
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={theme.components.input}
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
                  disabled={submitting}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.accents.tertiary.class} mb-2`}>
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={theme.components.input}
                  placeholder="Re-enter new password"
                  required
                  minLength={8}
                  disabled={submitting}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`w-full ${theme.components.button.primary} flex items-center justify-center gap-2`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Changing Password...
                  </>
                ) : (
                  'Change Password'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}












