'use client';

// Root client-side providers. Wraps the app in:
// - QueryClientProvider — every client island reads via TanStack Query, never raw fetch.
// - ReactQueryDevtools  — dev-only inspector (tree-shaken in prod build).
// - SyncQueueMonitor   — drains offline queue when back online, shows pending badge.
//
// Defaults rationale (Coachly):
// - staleTime 30s            chat/today fragments don't need realtime; gives RSC a head-start
// - gcTime 5min              keep recently-viewed data warm when user pops between tabs
// - refetchOnWindowFocus off iOS PWA backgrounding triggers focus events constantly
// - retry 1                  Neon HTTP rarely flakes; one retry is enough
// - networkMode 'offlineFirst' offline queue reads from cache while disconnected

import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, type QueryClientConfig } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { InstallPrompt } from '@/components/pwa/install-prompt';
import { SyncQueueMonitor } from '@/components/pwa/sync-queue-monitor';

const defaultConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 0,
      networkMode: 'offlineFirst',
    },
  },
};

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient(defaultConfig));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <SyncQueueMonitor />
      <InstallPrompt />
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />}
    </QueryClientProvider>
  );
}
