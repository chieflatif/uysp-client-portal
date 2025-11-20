/** @jest-environment jsdom */
'use client';

import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import LeadsPage from '@/app/(client)/leads/page';
import { ClientProvider } from '@/contexts/ClientContext';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null),
  }),
}));

const mockSession: Session = {
  user: {
    id: 'test-user',
    email: 'test@example.com',
    role: 'SUPER_ADMIN',
    clientId: 'client-1',
  },
  expires: '2026-01-01',
};

describe('Leads status display', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders Airtable status value even when processingStatus differs', async () => {
    const mockLead = {
      id: 'lead-1',
      firstName: 'Chris',
      lastName: 'Sullivan',
      email: 'chris@example.com',
      icpScore: 82,
      status: 'Queued',
      processingStatus: 'Completed',
      createdAt: '2025-11-10T00:00:00.000Z',
      campaignName: 'Nurture',
      leadSource: 'Standard Form',
      lastActivity: null,
      linkedinUrl: null,
    };

    const fetchMock = jest.fn((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.url;

      if (url.includes('/api/admin/clients')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            clients: [{ id: 'client-1', companyName: 'UYSP' }],
          }),
        });
      }

      if (url.includes('/api/leads')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            leads: [mockLead],
            count: 1,
          }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });

    global.fetch = fetchMock as unknown as typeof global.fetch;

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <SessionProvider session={mockSession}>
        <QueryClientProvider client={queryClient}>
          <ClientProvider>
            <LeadsPage />
          </ClientProvider>
        </QueryClientProvider>
      </SessionProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Chris Sullivan')).toBeTruthy();
    });

    const airtableStatus = await screen.findByText('Queued');
    expect(airtableStatus).toBeTruthy();
    expect(screen.queryByText('Completed')).toBeNull();
  });
});

