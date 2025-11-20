'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { theme } from '@/theme';
import { Menu, X, LogOut, Settings, Home, BarChart3, Shield, Briefcase, Users, Activity, Megaphone, Database } from 'lucide-react';
import { ClientSelector } from './ClientSelector';
import { canManageUsers } from '@/lib/auth/permissions-client';

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  if (!session) {
    return null;
  }

  // Check if user has admin privileges (using new role system)
  const hasAdminAccess = session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'CLIENT_ADMIN';
  const hasUserManagement = canManageUsers(session?.user?.role || '');
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/leads', label: 'Leads', icon: Users },
    { href: '/admin/campaigns', label: 'Campaigns', icon: Megaphone },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    ...(hasAdminAccess ? [{ href: '/project-management', label: 'Project Management', icon: Briefcase }] : []),
    ...(hasUserManagement ? [{ href: '/admin/users', label: 'Users', icon: Shield }] : []),
    ...(isSuperAdmin ? [{ href: '/admin/user-activity', label: 'User Activity', icon: Activity }] : []),
    ...(isSuperAdmin ? [{ href: '/admin/sync', label: 'Sync', icon: Database }] : []),
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <nav className={`${theme.core.darkBg} border-b border-gray-700 sticky top-0 z-50`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo + Client Selector */}
          <div className="flex items-center gap-4">
            <Link href="/leads" className="flex items-center gap-2">
              <div className={`text-2xl font-bold ${theme.core.white}`}>
                Rebel <span className={theme.accents.primary.class}>HQ</span>
              </div>
            </Link>
            <ClientSelector />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 text-sm font-medium transition ${
                    active
                      ? `${theme.accents.primary.class}`
                      : `${theme.core.bodyText} hover:text-white`
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cyan-400 flex items-center justify-center">
                <span className="text-gray-900 font-bold text-lg">
                  {session.user?.name?.[0]?.toUpperCase() || session.user?.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex flex-col">
                <p className={`text-sm font-medium ${theme.core.white}`}>
                  {session.user?.name || session.user?.email?.split('@')[0] || 'User'}
                </p>
                <p className={`text-xs ${theme.core.bodyText}`}>
                  {session.user?.email}
                </p>
              </div>
            </div>

            {/* Settings Icon */}
            <Link
              href="/settings"
              className={`hidden sm:flex items-center justify-center p-2 rounded-lg transition ${theme.core.bodyText} hover:bg-gray-800 hover:text-white`}
            >
              <Settings className="w-5 h-5" />
            </Link>

            {/* Desktop Logout */}
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition border border-cyan-400 ${theme.accents.tertiary.class} hover:bg-cyan-400 hover:text-gray-900`}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-800 transition"
            >
              {isOpen ? (
                <X className={`w-5 h-5 ${theme.accents.tertiary.class}`} />
              ) : (
                <Menu className={`w-5 h-5 ${theme.core.bodyText}`} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-2 rounded-lg text-sm font-medium transition ${
                    active
                      ? `${theme.accents.primary.class} bg-gray-800`
                      : `${theme.core.bodyText} hover:bg-gray-800`
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={() => {
                signOut({ callbackUrl: '/login' });
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition ${theme.components.button.ghost}`}
            >
              <div className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                Logout
              </div>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
