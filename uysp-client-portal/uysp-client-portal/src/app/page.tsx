/**
 * Home Page
 * 
 * Redirects authenticated users to /dashboard
 * Redirects unauthenticated users to /login
 */

'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (session) {
      // Authenticated - redirect to dashboard
      router.push('/dashboard');
    } else {
      // Not authenticated - redirect to login
      router.push('/login');
    }
  }, [session, status, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
