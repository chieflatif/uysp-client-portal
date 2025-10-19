'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { theme } from '@/lib/theme';
import { AlertCircle, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Password strength indicator
  const getPasswordStrength = () => {
    if (!password) return { strength: 0, color: 'bg-gray-600', label: '' };
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    if (strength <= 2) return { strength, color: 'bg-red-500', label: 'Weak' };
    if (strength <= 3) return { strength, color: 'bg-yellow-500', label: 'Fair' };
    if (strength <= 4) return { strength, color: 'bg-blue-500', label: 'Good' };
    return { strength, color: 'bg-green-500', label: 'Strong' };
  };

  const passwordStrength = getPasswordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!firstName.trim()) {
      setError('First name is required');
      return;
    }
    if (!lastName.trim()) {
      setError('Last name is required');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError('Password must contain an uppercase letter');
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError('Password must contain a lowercase letter');
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError('Password must contain a number');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Register user
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
        }),
      });

      if (!registerResponse.ok) {
        const data = await registerResponse.json();
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={`min-h-screen ${theme.core.darkBg} flex items-center justify-center p-4`}>
        <div className="w-full max-w-md text-center">
          <div className="mb-6">
            <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto" />
          </div>
          <h2 className={`text-2xl font-bold ${theme.core.white} mb-2`}>
            Account Created!
          </h2>
          <p className={theme.core.bodyText}>
            Your account has been successfully created. Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.core.darkBg} flex items-center justify-center p-4 py-12`}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-4xl font-bold ${theme.core.white} mb-2`}>
            Rebel <span className={theme.accents.primary.class}>HQ</span>
          </h1>
          <p className={`${theme.core.bodyText} text-sm`}>
            Create Your Account
          </p>
        </div>

        {/* Form Card */}
        <div className={`${theme.components.card} border-t-2 border-t-cyan-400`}>
          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-900/20 border border-red-700/50 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-sm font-medium ${theme.core.white} mb-2`}>
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={`${theme.components.input} w-full`}
                  placeholder="John"
                  disabled={loading}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${theme.core.white} mb-2`}>
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={`${theme.components.input} w-full`}
                  placeholder="Doe"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className={`block text-sm font-medium ${theme.core.white} mb-2`}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${theme.components.input} w-full`}
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label className={`block text-sm font-medium ${theme.core.white} mb-2`}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${theme.components.input} w-full pr-10`}
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
              </div>
              
              {/* Password Strength */}
              {password && (
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-400">Strength:</span>
                    <span className={`text-xs font-semibold ${
                      passwordStrength.label === 'Weak' ? 'text-red-400' :
                      passwordStrength.label === 'Fair' ? 'text-yellow-400' :
                      passwordStrength.label === 'Good' ? 'text-blue-400' :
                      'text-green-400'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${passwordStrength.color} transition-all duration-300`}
                      style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className={`block text-sm font-medium ${theme.core.white} mb-2`}>
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`${theme.components.input} w-full pr-10`}
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  tabIndex={-1}
                >
                  {showConfirm ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full ${theme.components.button.primary} flex items-center justify-center gap-2 disabled:opacity-50`}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 pt-6 border-t border-gray-700 text-center">
            <p className={theme.core.bodyText}>
              Already have an account?{' '}
              <Link
                href="/login"
                className={`${theme.accents.tertiary.class} hover:text-cyan-300 font-medium`}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className={`text-center ${theme.core.bodyText} text-xs mt-8`}>
          © 2025 Rebel HQ. All rights reserved.
        </p>
      </div>
    </div>
  );
}
