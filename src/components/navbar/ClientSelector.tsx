'use client';

import { useClient } from '@/contexts/ClientContext';
import { useSession } from 'next-auth/react';
import { theme } from '@/theme';
import { ChevronDown, Building2 } from 'lucide-react';
import { useState } from 'react';

export function ClientSelector() {
  const { data: session } = useSession();
  const { selectedClientId, setSelectedClientId, availableClients, selectedClient, isLoading } = useClient();
  const [isOpen, setIsOpen] = useState(false);

  // Only show for SUPER_ADMIN
  if (session?.user?.role !== 'SUPER_ADMIN') return null;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2">
        <div className="w-32 h-8 bg-gray-700 animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition border border-gray-700`}
      >
        <Building2 className="w-4 h-4 text-cyan-400" />
        <span className={`text-sm font-medium ${theme.core.white}`}>
          {selectedClient?.companyName || 'Select Client'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="p-2 border-b border-gray-700">
              <p className="text-xs text-gray-400 font-semibold uppercase px-2">Switch Client</p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {availableClients.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-400">
                  No clients found
                </div>
              ) : (
                availableClients.map(client => (
                  <button
                    key={client.id}
                    onClick={() => {
                      setSelectedClientId(client.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-700 transition flex items-center justify-between ${
                      selectedClientId === client.id ? 'bg-gray-700' : ''
                    }`}
                  >
                    <span className={theme.core.white}>{client.companyName}</span>
                    {selectedClientId === client.id && (
                      <span className={`${theme.accents.tertiary.class} font-bold`}>✓</span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
