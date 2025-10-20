import type { Metadata } from 'next';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { Navbar } from '@/components/navbar/Navbar';
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
          <Navbar />
          <main>{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
