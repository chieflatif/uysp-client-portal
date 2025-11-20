/** @jest-environment jsdom */
'use client';

import { render, screen, waitFor } from '@testing-library/react';
import { LeadTimeline } from '@/components/activity/LeadTimeline';

describe('LeadTimeline', () => {
  const leadId = 'lead-123';
  const leadAirtableId = 'recABC123';

  beforeEach(() => {
    jest.resetAllMocks();
    global.fetch = jest.fn((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url.includes('/api/admin/activity-logs?')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            activities: [
              {
                id: 'act-1',
                timestamp: '2025-11-06T10:00:00.000Z',
                eventType: 'MESSAGE_DELIVERED',
                category: 'SMS',
                description: 'SMS delivered',
                messageContent: 'Your message was delivered',
                source: 'test-suite',
                metadata: null,
              },
            ],
          }),
        }) as Response;
      }

      if (url.includes('/api/admin/activity-logs/counts')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            all: 1,
            SMS: 1,
          }),
        }) as Response;
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      }) as Response;
    }) as unknown as typeof fetch;
  });

  it('passes leadAirtableId when fetching activities and renders timeline entries', async () => {
    render(<LeadTimeline leadId={leadId} leadAirtableId={leadAirtableId} />);

    await waitFor(() => {
      expect(screen.getByText('SMS delivered')).toBeTruthy();
    });

    const fetchMock = global.fetch as jest.Mock;
    const activityCall = fetchMock.mock.calls.find(([url]) =>
      typeof url === 'string' && url.includes('/api/admin/activity-logs?')
    );
    const countsCall = fetchMock.mock.calls.find(([url]) =>
      typeof url === 'string' && url.includes('/api/admin/activity-logs/counts')
    );

    expect(activityCall?.[0]).toContain(`leadAirtableId=${leadAirtableId}`);
    expect(countsCall?.[0]).toContain(`leadAirtableId=${leadAirtableId}`);
  });
});
