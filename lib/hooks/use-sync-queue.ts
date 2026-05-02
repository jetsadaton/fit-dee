'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { countPending } from '@/lib/offline/db';
import { drainQueue } from '@/lib/offline/sync';

export function useSyncQueue() {
  const [pendingCount, setPendingCount] = useState(0);
  const draining = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const n = await countPending();
      setPendingCount(n);
    } catch {}
  }, []);

  const drain = useCallback(async () => {
    if (draining.current || !navigator.onLine) return;
    draining.current = true;
    try {
      await drainQueue();
      await refresh();
    } finally {
      draining.current = false;
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
    window.addEventListener('online', drain);
    if (navigator.onLine) drain();
    return () => window.removeEventListener('online', drain);
  }, [drain, refresh]);

  return { pendingCount, drain };
}
