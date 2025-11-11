'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { validatePassword } from '@/lib/utils/password';
import { theme } from '@/theme';
import { Lock, CheckCircle, XCircle, Eye, EyeOff, Loader2 } from 'lucide-react';

function SetupPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams?.get('email') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Real-time password validation
  const validation = validatePassword(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  // Requirements checklist
  const requirements = [
    { text: 'At least 12 characters', met: password.length >= 12 },
    { text: 'One uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
    { text: 'One lowercase letter (a-z)', met: /[a-z]/.test(password) },
    { text: 'One number (0-9)', met: /[0-9]/.test(password) },
    { text: 'One special character (!@#$%^&*)', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const allRequirementsMet = requirements.every((r) => r.met);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!allRequirementsMet) {
      setError('Please meet all password requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Set password via API
      const response = await fetch('/api/auth/setup-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Auto-login after password setup
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (result?.ok) {
          router.push('/dashboard');
        } else {
          setError('Password set successfully! Please login.');
          setTimeout(() => router.push('/login'), 2000);
        }
      } else {
        setError(data.error || 'Failed to set password');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <div className={`min-h-screen ${theme.core.darkBg} flex items-center justify-center p-4`}>
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className={`text-2xl font-bold ${theme.core.white} mb-2`}>Invalid Setup Link</h1>
          <p className={theme.core.bodyText}>Please contact your administrator for a new invitation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.core.darkBg} flex items-center justify-center p-4`}>
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`w-16 h-16 ${theme.accents.secondary.bgClass} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-3xl font-bold ${theme.core.white} mb-2`}>Set Your Password</h1>
          <p className={theme.core.bodyText}>Welcome! Create a secure password for {email}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={`${theme.components.card} border-t-2 border-t-cyan-400`}>
          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 mb-6 flex items-start gap-2">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Password Requirements */}
          <div className="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-700">
            <p className={`text-sm font-semibold ${theme.core.bodyText} mb-3`}>Password Requirements:</p>
            <ul className="space-y-2">
              {requirements.map((req, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  {req.met ? (
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-600 flex-shrink-0" />
                  )}
                  <span className={req.met ? 'text-green-400' : 'text-gray-400'}>{req.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Password Input */}
          <div className="mb-4">
            <label className={`block text-sm font-medium ${theme.core.bodyText} mb-2`}>Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${theme.components.input} w-full pr-10`}
                placeholder="Create a strong password"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Input */}
          <div className="mb-6">
            <label className={`block text-sm font-medium ${theme.core.bodyText} mb-2`}>Confirm Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`${theme.components.input} w-full`}
              placeholder="Re-enter your password"
              required
              disabled={loading}
            />
            {confirmPassword.length > 0 && (
              <p className={`text-sm mt-1 flex items-center gap-1 ${passwordsMatch ? 'text-green-400' : 'text-red-400'}`}>
                {passwordsMatch ? (
                  <>
                    <CheckCircle className="w-4 h-4" /> Passwords match
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" /> Passwords do not match
                  </>
                )}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !allRequirementsMet || !passwordsMatch}
            className={`${theme.components.button.primary} w-full flex items-center justify-center gap-2 disabled:opacity-50`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Setting Password...
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                Set Password & Login
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className={`text-center ${theme.core.bodyText} text-xs mt-8`}>
          © 2025 Rebel HQ. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default function SetupPasswordPage() {
  return (
    <Suspense fallback={
      <div className={`min-h-screen ${theme.core.darkBg} flex items-center justify-center`}>
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    }>
      <SetupPasswordContent />
    </Suspense>
  );
}
