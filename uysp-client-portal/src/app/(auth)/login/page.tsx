'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { theme } from '@/lib/theme';
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        router.push('/dashboard');
      }
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${theme.core.darkBg} flex items-center justify-center p-4`}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-4xl font-bold ${theme.core.white} mb-2`}>
            Rebel <span className={theme.accents.primary.class}>HQ</span>
          </h1>
          <p className={theme.core.bodyText}>Sign in to your account</p>
        </div>

        {/* Login Card */}
        <div className={`${theme.components.card} border-t-2 border-t-cyan-400`}>
          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-900/20 border border-red-700/50 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className={`block text-sm font-medium ${theme.core.white} mb-2`}>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`${theme.components.input} w-full`}
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className={`block text-sm font-medium ${theme.core.white} mb-2`}>
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full ${theme.components.button.primary} flex items-center justify-center gap-2 disabled:opacity-50`}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 pt-6 border-t border-gray-700 text-center">
            <p className={theme.core.bodyText}>
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className={`${theme.accents.tertiary.class} hover:text-cyan-300 font-medium`}
              >
                Create one
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
