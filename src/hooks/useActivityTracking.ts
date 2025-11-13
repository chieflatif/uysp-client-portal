'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

/**
 * Client-side activity tracking hook
 * Tracks page views and maintains session state
 */
export function useActivityTracking() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const sessionIdRef = useRef<string | null>(null);
  const lastPathRef = useRef<string>('');

  useEffect(() => {
    // Only track when authenticated and in production
    if (status !== 'authenticated' || !session?.user?.id) {
      return;
    }

    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    // Skip if pathname is null
    if (!pathname) {
      return;
    }

    // Skip API routes
    if (pathname.startsWith('/api/')) {
      return;
    }

    // Skip if same page (prevents double tracking on re-renders)
    if (pathname === lastPathRef.current) {
      return;
    }

    lastPathRef.current = pathname;

    // Track page view
    const trackPageView = async () => {
      try {
        const response = await fetch('/api/analytics/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventType: 'page_view',
            eventCategory: 'navigation',
            pageUrl: pathname,
            referrer: document.referrer || null,
            sessionId: sessionIdRef.current,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.sessionId && !sessionIdRef.current) {
            sessionIdRef.current = data.sessionId;
          }
        }
      } catch (error) {
        // Silently fail - don't break the app for analytics
        console.debug('Activity tracking failed:', error);
      }
    };

    trackPageView();
  }, [pathname, session, status]);
}
