/**
 * Authentication utilities
 * Exports auth function for use in API routes and server components
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from './config';

/**
 * Get the current session
 * Wrapper around getServerSession for convenience
 */
export async function auth() {
  return await getServerSession(authOptions);
}

// Re-export authOptions for direct use where needed
export { authOptions } from './config';



