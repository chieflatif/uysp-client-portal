'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { theme } from '@/theme';
import { Eye, EyeOff, Loader2, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { validatePassword, getPasswordStrength } from '@/lib/utils/password';

export default function ForceChangePasswordPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Redirect if not flagged for password change
  if (session && !session.user.mustChangePassword) {
    router.push('/dashboard');
    return null;
  }

  const passwordStrength = getPasswordStrength(formData.newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationErrors([]);

    // Validate new password
    const validation = validatePassword(formData.newPassword);
    if (!validation.isValid) {
      setValidationErrors([validation.error || 'Invalid password']);
      return;
    }

    // Check password confirmation
    if (formData.newPassword !== formData.confirmPassword) {
      setValidationErrors(['Passwords do not match']);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to change password');
        setLoading(false);
        return;
      }

      // Update session to reflect password change
      await update({ mustChangePassword: false });

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className={`min-h-screen ${theme.core.darkBg} flex items-center justify-center px-4`}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-pink-700 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Change Your Password
          </h1>
          <p className="text-gray-400">
            For security reasons, you must change your temporary password before continuing.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {validationErrors.length > 0 && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
              <ul className="space-y-1">
                {validationErrors.map((err, index) => (
                  <li key={index} className="text-red-400 text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Current Password (Temporary)
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                className={`${theme.components.input} w-full pr-10`}
                placeholder="Enter temporary password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className={`${theme.components.input} w-full pr-10`}
                placeholder="Enter new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {formData.newPassword && (
              <div className="mt-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-400">Strength:</span>
                  <span
                    className={`font-semibold ${
                      passwordStrength === 'strong'
                        ? 'text-green-400'
                        : passwordStrength === 'medium'
                        ? 'text-yellow-400'
                        : 'text-red-400'
                    }`}
                  >
                    {passwordStrength.toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={`${theme.components.input} w-full pr-10`}
                placeholder="Confirm new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
              <div className="mt-2 flex items-center gap-1 text-xs text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span>Passwords match</span>
              </div>
            )}
          </div>

          {/* Password Requirements */}
          <div className="bg-gray-900 border border-gray-700 rounded p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Password Requirements:</h3>
            <ul className="space-y-1 text-xs text-gray-400">
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>At least 8 characters long</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Contains uppercase and lowercase letters</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Contains at least one number</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Contains at least one special character (!@#$%^&*)</span>
              </li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className={`${theme.components.button.primary} flex-1 flex items-center justify-center gap-2`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Changing Password...
                </>
              ) : (
                'Change Password'
              )}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loading}
              className={`${theme.components.button.ghost} px-6`}
            >
              Logout
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
