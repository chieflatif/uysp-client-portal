/**
 * Client-side Analytics Tracker
 *
 * Lightweight utility for tracking user activity events
 * Automatically manages sessions and provides simple API for custom events
 */

// Session ID stored in sessionStorage (cleared when browser closes)
const SESSION_KEY = 'analytics_session_id';

/**
 * Get or create session ID
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

type AnalyticsEventData = Record<string, unknown>;

export async function trackEvent(
  eventType: string,
  eventData: AnalyticsEventData = {},
  eventCategory: string = 'interaction'
): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const response = await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventType,
        eventCategory,
        eventData,
        pageUrl: window.location.pathname,
        referrer: document.referrer || null,
        sessionId: getSessionId(),
      }),
    });

    if (!response.ok) {
      console.warn('Analytics tracking failed:', response.status);
    }
  } catch (error) {
    // Fail silently - don't break app for analytics
    console.warn('Analytics tracking error:', error);
  }
}

/**
 * Track page view
 * Call this on route changes
 */
export function trackPageView(pageTitle?: string): void {
  trackEvent('page_view', {
    title: pageTitle || document.title,
    url: window.location.pathname,
    search: window.location.search,
  }, 'navigation');
}

/**
 * Track button click
 */
export function trackClick(buttonName: string, additionalData?: AnalyticsEventData): void {
  trackEvent('button_click', {
    buttonName,
    ...additionalData,
  }, 'interaction');
}

/**
 * Track form submission
 */
export function trackFormSubmit(formName: string, additionalData?: AnalyticsEventData): void {
  trackEvent('form_submit', {
    formName,
    ...additionalData,
  }, 'interaction');
}

/**
 * Track custom business event
 * Examples: task_created, lead_qualified, user_invited, etc.
 */
export function trackCustomEvent(eventName: string, data?: AnalyticsEventData): void {
  trackEvent(eventName, data, 'custom');
}

/**
 * Track error
 */
export function trackError(errorMessage: string, errorData?: AnalyticsEventData): void {
  trackEvent('error', {
    message: errorMessage,
    ...errorData,
  }, 'system');
}

/**
 * React hook for page view tracking
 * Use in components to automatically track page views
 */
export function usePageTracking(pageTitle?: string) {
  if (typeof window !== 'undefined') {
    // Track on mount
    trackPageView(pageTitle);
  }
}
