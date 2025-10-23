/**
 * NextAuth Middleware
 * 
 * Protects routes and redirects unauthenticated users to login
 * Auth routes (login, register) are allowed without authentication
 */

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';


export default withAuth(
  function middleware(req) {
    // SECURITY: Enforce HTTPS in production
    if (process.env.NODE_ENV === 'production') {
      const protocol = req.headers.get('x-forwarded-proto');
      if (protocol !== 'https') {
        const host = req.headers.get('host');
        const secureUrl = new URL(`https://${host}${req.nextUrl.pathname}${req.nextUrl.search}`);
        return NextResponse.redirect(secureUrl);
      }
    }

    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // ANALYTICS: Track page views for authenticated users (fire and forget)
    // Only track in production to avoid development server issues
    if (token && !pathname.startsWith('/api/') && process.env.NODE_ENV === 'production') {
      // Fire and forget - don't await, don't block the response
      fetch(`${req.nextUrl.origin}/api/analytics/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType: 'page_view',
          eventCategory: 'navigation',
          pageUrl: pathname,
          referrer: req.headers.get('referer') || null,
        }),
      }).catch(() => {
        // Silently fail - don't break the app for analytics
      });
    }

    // If user is authenticated and must change password
    if (token && token.mustChangePassword) {
      // Allow access to change password page and API
      if (
        pathname === '/force-change-password' ||
        pathname === '/api/auth/change-password' ||
        pathname === '/api/auth/signout'
      ) {
        return NextResponse.next();
      }

      // Redirect to force change password page
      const url = new URL('/force-change-password', req.url);
      return NextResponse.redirect(url);
    }

    // If user doesn't need to change password but is on change password page
    if (token && !token.mustChangePassword && pathname === '/force-change-password') {
      const url = new URL('/dashboard', req.url);
      return NextResponse.redirect(url);
    }

    // If user is accessing protected route without auth, they get redirected by withAuth
    // This function runs only for authenticated requests or allowed public routes
    return NextResponse.next();
  },
  {
    // Public routes that don't require authentication
    pages: {
      signIn: '/login',
      error: '/login',
    },
    // Require auth for all routes except specified public paths
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow public auth routes
        if (
          req.nextUrl.pathname === '/login' ||
          req.nextUrl.pathname === '/register' ||
          req.nextUrl.pathname === '/'
        ) {
          return true;
        }

        // Redirect to login if no token and accessing protected route
        if (!token) {
          return false;
        }

        return true;
      },
    },
  }
);

// Configure which routes use this middleware
export const config = {
  matcher: [
    // Protect all routes except:
    // - /login and /register (public)
    // - /api/* (all API routes bypass middleware, they handle auth internally)
    // - /_next/* (Next.js internals)
    // - /static/* (static files)
    '/((?!login|register|api|_next/static|_next/image).*)',
  ],
};
