// Background sync — drains the offline queue when the browser comes back online.
// Called from useSyncQueue hook; also triggered by service worker Background Sync
// (when the sw is registered in Phase 4).

'use client';

import { getPending, markSynced, markFailed, type PendingLog } from './db';
import { logWaterAction, logMoodAction, logWeightAction } from '@/app/today/actions';

async function dispatchOne(log: PendingLog): Promise<void> {
  switch (log.action) {
    case 'log_water':
      await logWaterAction(log.payload);
      break;
    case 'log_mood':
      await logMoodAction(log.payload);
      break;
    case 'log_weight':
      await logWeightAction(log.payload);
      break;
    case 'log_food':
      // log_food goes through chat → confirmFood action; skip in offline queue
      // (food logs require the confirm-card flow, not a direct action).
      break;
    default:
      break;
  }
}

export async function drainQueue(): Promise<{ synced: number; failed: number }> {
  const pending = await getPending();
  let synced = 0;
  let failed = 0;
  for (const log of pending) {
    try {
      await dispatchOne(log);
      await markSynced(log.id!);
      synced++;
    } catch {
      await markFailed(log.id!);
      failed++;
    }
  }
  return { synced, failed };
}
