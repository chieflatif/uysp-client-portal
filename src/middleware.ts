/**
 * NextAuth Middleware
 * 
 * Protects routes and redirects unauthenticated users to login
 * Auth routes (login, register) are allowed without authentication
 */

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';


export default withAuth(
  function middleware() {
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
