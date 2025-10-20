'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { theme } from '@/lib/theme';
import Link from 'next/link';
import { ArrowLeft, Bell, Lock, Palette } from 'lucide-react';

export default function SettingsPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  return (
    <div className={`min-h-screen ${theme.core.darkBg} p-8`}>
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href="/leads" className={`flex items-center gap-2 ${theme.accents.tertiary.class} hover:text-cyan-300 font-medium`}>
          <ArrowLeft className="w-4 h-4" />
          Back to Leads
        </Link>

        <div>
          <h1 className={`text-3xl font-bold ${theme.core.white} mb-2`}>
            Settings
          </h1>
          <p className={theme.core.bodyText}>
            Manage your preferences and account
          </p>
        </div>

        <div className="space-y-4">
          <div className={theme.components.card}>
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-cyan-400 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h2 className={`text-lg font-bold ${theme.core.white} mb-1`}>
                  Account Security
                </h2>
                <p className={`${theme.core.bodyText} text-sm mb-4`}>
                  Manage your password and security settings
                </p>
                <button className={`${theme.components.button.secondary}`}>
                  Change Password
                </button>
              </div>
            </div>
          </div>

          <div className={theme.components.card}>
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-cyan-400 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h2 className={`text-lg font-bold ${theme.core.white} mb-1`}>
                  Notifications
                </h2>
                <p className={`${theme.core.bodyText} text-sm mb-4`}>
                  Manage notification preferences
                </p>
                <button className={`${theme.components.button.secondary}`}>
                  Configure Alerts
                </button>
              </div>
            </div>
          </div>

          <div className={theme.components.card}>
            <div className="flex items-start gap-3">
              <Palette className="w-5 h-5 text-cyan-400 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h2 className={`text-lg font-bold ${theme.core.white} mb-1`}>
                  Appearance
                </h2>
                <p className={`${theme.core.bodyText} text-sm mb-4`}>
                  Customize theme and display options
                </p>
                <button className={`${theme.components.button.secondary}`}>
                  Customize Theme
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className={`${theme.components.card} border-t-2 border-t-indigo-600`}>
          <p className={`${theme.core.bodyText} text-sm`}>
            More settings coming soon. Check back for additional options and preferences.
          </p>
        </div>
      </div>
    </div>
  );
}
