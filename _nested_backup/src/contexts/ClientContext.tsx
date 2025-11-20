'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface Client {
  id: string;
  companyName: string;
}

interface ClientContextType {
  selectedClientId: string | null;
  setSelectedClientId: (id: string) => void;
  isLoading: boolean;
  availableClients: Client[];
  selectedClient: Client | null;
}

const ClientContext = createContext<ClientContextType | null>(null);

export function ClientProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [selectedClientId, setSelectedClientIdState] = useState<string | null>(null);
  const [availableClients, setAvailableClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      setIsLoading(false);
      return;
    }

    // ADMIN users: locked to their client
    if (session.user.role === 'ADMIN') {
      setSelectedClientIdState(session.user.clientId);
      setIsLoading(false);
      return;
    }

    // CLIENT users: locked to their client
    if (session.user.role === 'CLIENT') {
      setSelectedClientIdState(session.user.clientId);
      setIsLoading(false);
      return;
    }

    // SUPER_ADMIN: fetch all clients and allow switching
    if (session.user.role === 'SUPER_ADMIN') {
      fetch('/api/admin/clients')
        .then(r => r.json())
        .then(data => {
          const clients = data.clients || [];
          setAvailableClients(clients);

          // Check localStorage for saved selection
          const saved = localStorage.getItem('selectedClientId');
          if (saved && clients.some((c: Client) => c.id === saved)) {
            setSelectedClientIdState(saved);
          } else {
            // Default to UYSP or first client
            const uysp = clients.find((c: Client) => c.companyName === 'UYSP');
            const defaultClient = uysp || clients[0];
            if (defaultClient) {
              setSelectedClientIdState(defaultClient.id);
              localStorage.setItem('selectedClientId', defaultClient.id);
            }
          }
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch clients:', err);
          // Fallback to user's own clientId if fetch fails
          if (session.user.clientId) {
            setSelectedClientIdState(session.user.clientId);
          }
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [session, status]);

  const setSelectedClientId = (id: string) => {
    setSelectedClientIdState(id);
    localStorage.setItem('selectedClientId', id);
  };

  const selectedClient = availableClients.find(c => c.id === selectedClientId) || null;

  return (
    <ClientContext.Provider
      value={{
        selectedClientId,
        setSelectedClientId,
        isLoading,
        availableClients,
        selectedClient
      }}
    >
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error('useClient must be used within ClientProvider');
  }
  return context;
}
