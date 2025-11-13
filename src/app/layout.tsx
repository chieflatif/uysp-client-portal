import type { Metadata } from 'next';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ClientProvider } from '@/contexts/ClientContext';
import { Navbar } from '@/components/navbar/Navbar';
import { ActivityTracker } from '@/components/ActivityTracker';
import './globals.css';

export const metadata: Metadata = {
  title: 'UYSP Lead Qualification Portal',
  description: 'Manage and track qualified leads with AI-powered insights',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-900">
        <SessionProvider>
          <QueryProvider>
            <ClientProvider>
              <ActivityTracker />
              <Navbar />
              <main>{children}</main>
            </ClientProvider>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
// Build timestamp: 1731521688
