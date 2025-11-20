'use client';

import { useActivityTracking } from '@/hooks/useActivityTracking';

/**
 * Activity tracking component
 * Add this to your root layout to enable automatic page view tracking
 */
export function ActivityTracker() {
  useActivityTracking();
  return null;
}
