'use client';

import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { theme } from '@/theme';
import { LayoutDashboard, Users, BarChart3, Briefcase, Settings as SettingsIcon, LogOut, Megaphone, Activity, ChevronDown, Database, UserCog, ClipboardList } from 'lucide-react';
import { signOut } from 'next-auth/react';

interface DropdownItem {
  href: string;
  label: string;
  icon: any;
}

interface NavItem {
  href?: string;
  label: string;
  icon: any;
  roles: string[];
  dropdown?: DropdownItem[];
}

export function Navigation() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  if (!session) return null;

  const navItems: NavItem[] = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'SUPER_ADMIN', 'CLIENT', 'CLIENT_ADMIN', 'CLIENT_USER']
    },
    {
      href: '/leads',
      label: 'Leads',
      icon: Users,
      roles: ['ADMIN', 'SUPER_ADMIN', 'CLIENT', 'CLIENT_ADMIN', 'CLIENT_USER']
    },
    {
      href: '/admin/campaigns',
      label: 'Campaigns',
      icon: Megaphone,
      roles: ['ADMIN', 'SUPER_ADMIN', 'CLIENT_ADMIN', 'CLIENT', 'CLIENT_USER']
    },
    {
      href: '/analytics',
      label: 'Analytics',
      icon: BarChart3,
      roles: ['ADMIN', 'SUPER_ADMIN']
    },
    {
      href: '/admin/activity-logs',
      label: 'Activity Logs',
      icon: Activity,
      roles: ['ADMIN', 'SUPER_ADMIN']
    },
    {
      href: '/project-management',
      label: 'Project Management',
      icon: Briefcase,
      roles: ['ADMIN', 'SUPER_ADMIN']
    },
    {
      label: 'Users',
      icon: UserCog,
      roles: ['ADMIN', 'SUPER_ADMIN'],
      dropdown: [
        { href: '/admin/users', label: 'User Management', icon: Users },
        { href: '/admin/user-activity', label: 'Activity Logs', icon: ClipboardList },
      ],
    },
  ];

  const settingsDropdown: DropdownItem[] = [
    { href: '/settings', label: 'Settings', icon: SettingsIcon },
    { href: '/admin/sync', label: 'Database Sync', icon: Database },
  ];

  const filteredNavItems = navItems.filter(item =>
    item.roles.includes(session.user.role)
  );

  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  const isDropdownActive = (items: DropdownItem[]) => {
    return items.some(item => isActive(item.href));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    // Only add listener when a dropdown is open
    if (!openDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      const clickedOutside = Object.values(dropdownRefs.current).every(
        ref => ref && !ref.contains(event.target as Node)
      );
      if (clickedOutside) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]); // Fix: Include openDropdown in dependencies

  const toggleDropdown = (key: string) => {
    setOpenDropdown(openDropdown === key ? null : key);
  };

  const renderNavItem = (item: NavItem, index: number) => {
    const Icon = item.icon;

    if (item.dropdown) {
      const dropdownKey = item.label;
      const isOpen = openDropdown === dropdownKey;
      const active = isDropdownActive(item.dropdown);

      return (
        <div
          key={dropdownKey}
          className="relative"
          ref={el => {
            dropdownRefs.current[dropdownKey] = el;
          }}
        >
          <button
            onClick={() => toggleDropdown(dropdownKey)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              active
                ? `${theme.accents.tertiary.bgClass} text-gray-900`
                : `${theme.core.bodyText} hover:bg-gray-800 hover:text-white`
            }`}
          >
            <Icon className="w-4 h-4" />
            {item.label}
            <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-1 z-50">
              {item.dropdown.map((dropdownItem) => {
                const DropdownIcon = dropdownItem.icon;
                const dropdownActive = isActive(dropdownItem.href);

                return (
                  <Link
                    key={dropdownItem.href}
                    href={dropdownItem.href}
                    onClick={() => setOpenDropdown(null)}
                    className={`flex items-center gap-3 px-4 py-2 transition ${
                      dropdownActive
                        ? `bg-cyan-600/20 ${theme.accents.tertiary.class}`
                        : `${theme.core.bodyText} hover:bg-gray-700 hover:text-white`
                    }`}
                  >
                    <DropdownIcon className="w-4 h-4" />
                    {dropdownItem.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    // Regular nav item
    const active = isActive(item.href!);
    return (
      <Link
        key={item.href}
        href={item.href!}
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
  };

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
            {filteredNavItems.map((item, index) => renderNavItem(item, index))}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className={`text-right ${theme.core.bodyText} text-sm`}>
              <p className={theme.core.white}>{session.user.name || session.user.email}</p>
              <p className="text-xs">{session.user.role}</p>
            </div>
            <div className="flex gap-2">
              {/* Settings Dropdown */}
              <div
                className="relative"
                ref={el => {
                  dropdownRefs.current['settings'] = el;
                }}
              >
                <button
                  onClick={() => toggleDropdown('settings')}
                  className={`p-2 rounded-lg ${theme.core.bodyText} hover:bg-gray-800 hover:text-white transition ${
                    isDropdownActive(settingsDropdown) ? 'text-cyan-400' : ''
                  }`}
                >
                  <SettingsIcon className="w-5 h-5" />
                </button>

                {openDropdown === 'settings' && (
                  <div className="absolute top-full right-0 mt-1 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-1 z-50">
                    {settingsDropdown.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpenDropdown(null)}
                          className={`flex items-center gap-3 px-4 py-2 transition ${
                            active
                              ? `bg-cyan-600/20 ${theme.accents.tertiary.class}`
                              : `${theme.core.bodyText} hover:bg-gray-700 hover:text-white`
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

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
