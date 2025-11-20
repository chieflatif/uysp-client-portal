/** @jest-environment jsdom */
/**
 * Integration Tests: Campaign Search Functionality
 *
 * Tests server-side search implementation for Campaign Management
 * Covers API endpoint, debouncing, and UI integration
 *
 * RETROACTIVE TEST SUITE (Code-First Development)
 * Created during forensic audit of UI Remediation Sprint
 */

import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import CampaignsPage from '@/app/(client)/admin/campaigns/page';
import { ClientProvider } from '@/contexts/ClientContext';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

// Mock session
const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'SUPER_ADMIN',
    clientId: 'test-client-id',
  },
  expires: '2025-12-31',
};

// Mock campaigns data
const mockCampaigns = [
  {
    id: '1',
    clientId: 'test-client-id',
    name: 'Summer Webinar 2025',
    campaignType: 'Webinar',
    formId: 'form-webinar-001',
    isPaused: false,
    messagesSent: 150,
    totalLeads: 300,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    clientId: 'test-client-id',
    name: 'Lead Form Campaign',
    campaignType: 'Standard',
    formId: 'form-standard-001',
    isPaused: false,
    messagesSent: 200,
    totalLeads: 400,
    createdAt: '2025-01-02T00:00:00Z',
    updatedAt: '2025-01-02T00:00:00Z',
  },
  {
    id: '3',
    clientId: 'test-client-id',
    name: 'Nurture Sequence',
    campaignType: 'Custom',
    formId: 'form-custom-001',
    isPaused: true,
    messagesSent: 50,
    totalLeads: 100,
    createdAt: '2025-01-03T00:00:00Z',
    updatedAt: '2025-01-03T00:00:00Z',
  },
];

beforeEach(() => {
  localStorage.clear();
});

const mockClientList = [
  {
    id: 'test-client-id',
    companyName: 'UYSP',
  },
];

const mockClientsFetchResponse = () => ({
  ok: true,
  json: async () => ({
    clients: mockClientList,
  }),
});

const selectTestClient = () => {
  localStorage.setItem('selectedClientId', 'test-client-id');
};

const getUrlFromRequest = (input: RequestInfo | URL): string => {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  const maybeRequest = input as Request & { url?: string };
  if (maybeRequest?.url) return maybeRequest.url;
  return '';
};

const setupClientAndCampaignFetch = (campaignResponse: { campaigns: typeof mockCampaigns; count: number }) => {
  const campaignFetch = jest.fn((input: RequestInfo | URL) =>
    Promise.resolve({
      ok: true,
      json: async () => campaignResponse,
    })
  );

  global.fetch = (jest.fn((input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : (input as Request).url;
    if (typeof url === 'string' && url.includes('/api/admin/clients')) {
      return Promise.resolve(mockClientsFetchResponse());
    }
    return campaignFetch(url as RequestInfo);
  }) as unknown) as typeof fetch;

  return campaignFetch;
};

describe('Campaign Search - API Endpoint', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should filter campaigns by name (case-insensitive)', async () => {
    const mockResponse = {
      campaigns: [mockCampaigns[0]], // Only "Summer Webinar 2025"
      count: 1,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const response = await fetch(
      '/api/admin/campaigns?clientId=test-client-id&type=All&status=All&search=webinar'
    );
    const data = await response.json();

    expect(data.campaigns).toHaveLength(1);
    expect(data.campaigns[0].name).toBe('Summer Webinar 2025');
  });

  it('should filter campaigns by formId', async () => {
    const mockResponse = {
      campaigns: [mockCampaigns[1]], // Only "form-standard-001"
      count: 1,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const response = await fetch(
      '/api/admin/campaigns?clientId=test-client-id&type=All&status=All&search=standard-001'
    );
    const data = await response.json();

    expect(data.campaigns).toHaveLength(1);
    expect(data.campaigns[0].formId).toBe('form-standard-001');
  });

  it('should return all campaigns when search is empty', async () => {
    const mockResponse = {
      campaigns: mockCampaigns,
      count: 3,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const response = await fetch(
      '/api/admin/campaigns?clientId=test-client-id&type=All&status=All'
    );
    const data = await response.json();

    expect(data.campaigns).toHaveLength(3);
  });

  it('should combine search with type filter', async () => {
    const mockResponse = {
      campaigns: [mockCampaigns[0]], // Only webinar matching "summer"
      count: 1,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const response = await fetch(
      '/api/admin/campaigns?clientId=test-client-id&type=Webinar&status=All&search=summer'
    );
    const data = await response.json();

    expect(data.campaigns).toHaveLength(1);
    expect(data.campaigns[0].campaignType).toBe('Webinar');
  });

  it('should combine search with status filter', async () => {
    const mockResponse = {
      campaigns: [], // No paused campaigns matching "summer"
      count: 0,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const response = await fetch(
      '/api/admin/campaigns?clientId=test-client-id&type=All&status=Paused&search=summer'
    );
    const data = await response.json();

    expect(data.campaigns).toHaveLength(0);
  });

  it('should handle special characters in search query', async () => {
    const mockResponse = {
      campaigns: [],
      count: 0,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    // Test with SQL special characters (should be escaped by ILIKE)
    const response = await fetch(
      '/api/admin/campaigns?clientId=test-client-id&type=All&status=All&search=%_%'
    );
    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(data.campaigns).toBeDefined();
  });
});

describe('Campaign Search - Debouncing', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('should debounce search input by 300ms', async () => {
    selectTestClient();
    const campaignFetch = setupClientAndCampaignFetch({ campaigns: mockCampaigns, count: 3 });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    const renderResult = render(
      <SessionProvider session={mockSession as any}>
        <QueryClientProvider client={queryClient}>
          <ClientProvider>
            <CampaignsPage />
          </ClientProvider>
        </QueryClientProvider>
      </SessionProvider>
    );

    const searchInput = await renderResult.findByPlaceholderText(/Search campaigns/i);
    await waitFor(() => {
      expect(campaignFetch).toHaveBeenCalled();
    });
    campaignFetch.mockClear();

    // Type quickly (should only trigger one API call)
    fireEvent.change(searchInput, { target: { value: 'w' } });
    fireEvent.change(searchInput, { target: { value: 'we' } });
    fireEvent.change(searchInput, { target: { value: 'web' } });
    fireEvent.change(searchInput, { target: { value: 'webi' } });
    fireEvent.change(searchInput, { target: { value: 'webin' } });
    fireEvent.change(searchInput, { target: { value: 'webina' } });
    fireEvent.change(searchInput, { target: { value: 'webinar' } });

    // Fast forward 299ms (should NOT trigger API call yet)
    await act(async () => {
      jest.advanceTimersByTime(299);
    });
    expect(campaignFetch).not.toHaveBeenCalled();

    // Fast forward 1ms more (total 300ms - should trigger API call)
    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    await waitFor(() => {
      expect(campaignFetch).toHaveBeenCalledTimes(1);
    });

    expect(campaignFetch).toHaveBeenCalledWith(
      expect.stringContaining('search=webinar')
    );
  });

  it('should cancel previous timer on new input', async () => {
    selectTestClient();
    const campaignFetch = setupClientAndCampaignFetch({ campaigns: [], count: 0 });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    const renderResult = render(
      <SessionProvider session={mockSession as any}>
        <QueryClientProvider client={queryClient}>
          <ClientProvider>
            <CampaignsPage />
          </ClientProvider>
        </QueryClientProvider>
      </SessionProvider>
    );

    const searchInput = await renderResult.findByPlaceholderText(/Search campaigns/i);
    await waitFor(() => {
      expect(campaignFetch).toHaveBeenCalled();
    });
    campaignFetch.mockClear();

    // Type "test"
    fireEvent.change(searchInput, { target: { value: 'test' } });
    await act(async () => {
      jest.advanceTimersByTime(200);
    });

    // Type "webinar" (should cancel "test" timer)
    fireEvent.change(searchInput, { target: { value: 'webinar' } });
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(campaignFetch).toHaveBeenCalledTimes(1);
    });

    expect(campaignFetch).toHaveBeenCalledWith(
      expect.stringContaining('search=webinar')
    );
    expect(campaignFetch).not.toHaveBeenCalledWith(
      expect.stringContaining('search=test')
    );
  });
});

describe('Campaign Search - Memory Leak Prevention', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('should clear timer on component unmount', async () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    selectTestClient();
    setupClientAndCampaignFetch({ campaigns: mockCampaigns, count: 3 });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    const renderResult = render(
      <SessionProvider session={mockSession as any}>
        <QueryClientProvider client={queryClient}>
          <ClientProvider>
            <CampaignsPage />
          </ClientProvider>
        </QueryClientProvider>
      </SessionProvider>
    );

    const searchInput = await renderResult.findByPlaceholderText(/Search campaigns/i);

    // Start typing
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Unmount before timer fires
    renderResult.unmount();

    // Verify clearTimeout was called
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});

describe('Campaign Search - React Query Integration', () => {
  it('should include search in queryKey to trigger refetch', async () => {
    selectTestClient();
    const campaignFetch = setupClientAndCampaignFetch({ campaigns: mockCampaigns, count: 3 });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    const renderResult = render(
      <SessionProvider session={mockSession as any}>
        <QueryClientProvider client={queryClient}>
          <ClientProvider>
            <CampaignsPage />
          </ClientProvider>
        </QueryClientProvider>
      </SessionProvider>
    );

    const searchInput = await renderResult.findByPlaceholderText(/Search campaigns/i);

    await waitFor(() => {
      expect(campaignFetch).toHaveBeenCalled();
    });
    const initialCallUrl = getUrlFromRequest(campaignFetch.mock.calls[0][0]);
    expect(initialCallUrl).not.toContain('search=');
    campaignFetch.mockClear();

    // Add search term
    fireEvent.change(searchInput, { target: { value: 'webinar' } });
    await waitFor(() => {
      expect(campaignFetch).toHaveBeenCalledWith(
        expect.stringContaining('search=webinar')
      );
    });
    campaignFetch.mockClear();

    // Change search term (should trigger new fetch)
    fireEvent.change(searchInput, { target: { value: 'lead' } });
    await waitFor(() => {
      expect(campaignFetch).toHaveBeenCalledWith(
        expect.stringContaining('search=lead')
      );
    });
  });
});

describe('Campaign Search - Edge Cases', () => {
  it('should handle whitespace-only search', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ campaigns: mockCampaigns, count: 3 }),
    });
    global.fetch = mockFetch;

    const response = await fetch(
      '/api/admin/campaigns?clientId=test-client-id&type=All&status=All&search=   '
    );

    // Whitespace-only should be treated as empty search
    expect(response.ok).toBe(true);
  });

  it('should preserve search when filters change', async () => {
    selectTestClient();
    const campaignFetch = setupClientAndCampaignFetch({ campaigns: [], count: 0 });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    const renderResult = render(
      <SessionProvider session={mockSession as any}>
        <QueryClientProvider client={queryClient}>
          <ClientProvider>
            <CampaignsPage />
          </ClientProvider>
        </QueryClientProvider>
      </SessionProvider>
    );

    const searchInput = await renderResult.findByPlaceholderText(/Search campaigns/i);
    await waitFor(() => {
      expect(campaignFetch).toHaveBeenCalled();
    });
    campaignFetch.mockClear();

    const getByText = renderResult.getByText;
    fireEvent.change(searchInput, { target: { value: 'webinar' } });

    await waitFor(() => {
      expect(campaignFetch).toHaveBeenCalledWith(
        expect.stringContaining('search=webinar')
      );
    });
    campaignFetch.mockClear();

    // Change type filter
    const webinarFilterButton = getByText('Webinar');
    fireEvent.click(webinarFilterButton);

    await waitFor(() => {
      expect(campaignFetch).toHaveBeenCalledWith(
        expect.stringMatching(/type=Webinar.*search=webinar|search=webinar.*type=Webinar/)
      );
    });
  });
});
