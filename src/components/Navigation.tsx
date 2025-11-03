'use client';

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { theme } from '@/theme';
import { LayoutDashboard, Users, BarChart3, Briefcase, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

export function Navigation() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session) return null;

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'SUPER_ADMIN', 'CLIENT'] },
    { href: '/leads', label: 'Leads', icon: Users, roles: ['ADMIN', 'SUPER_ADMIN', 'CLIENT'] },
    { href: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['ADMIN', 'SUPER_ADMIN'] },
    { href: '/project-management', label: 'Project Management', icon: Briefcase, roles: ['ADMIN', 'SUPER_ADMIN'] },
  ];

  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(session.user.role)
  );

  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <nav className="bg-gray-900 border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-700 via-indigo-600 to-cyan-400 flex items-center justify-center">
              <span className="text-white font-bold text-sm">UY</span>
            </div>
            <span className={`text-xl font-bold ${theme.core.white}`}>UYSP Portal</span>
          </Link>

          {/* Main Navigation */}
          <div className="flex items-center gap-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                    active
                      ? `${theme.accents.tertiary.bgClass} text-gray-900`
                      : `${theme.core.bodyText} hover:bg-gray-800 hover:text-white`
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className={`text-right ${theme.core.bodyText} text-sm`}>
              <p className={theme.core.white}>{session.user.name || session.user.email}</p>
              <p className="text-xs">{session.user.role}</p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/settings"
                className={`p-2 rounded-lg ${theme.core.bodyText} hover:bg-gray-800 hover:text-white transition`}
              >
                <SettingsIcon className="w-5 h-5" />
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className={`p-2 rounded-lg ${theme.core.bodyText} hover:bg-gray-800 hover:text-pink-700 transition`}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

