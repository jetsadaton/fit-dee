// Dexie (IndexedDB) offline queue for Coachly.
// Stores pending mutations while offline; sync drains the queue when online.
//
// Table: pendingLogs
//   action:  'log_food' | 'log_water' | 'log_mood' | 'log_weight'
//   payload: serialised action input (same shape as Server Action args)
//   status:  'pending' | 'syncing' | 'failed'
//   retries: int
//   createdAt: ms timestamp

import Dexie, { type Table } from 'dexie';

export type PendingAction = 'log_food' | 'log_water' | 'log_mood' | 'log_weight';
export type PendingStatus = 'pending' | 'syncing' | 'failed';

export interface PendingLog {
  id?: number; // auto-increment PK
  action: PendingAction;
  payload: Record<string, unknown>;
  status: PendingStatus;
  retries: number;
  createdAt: number; // Date.now()
}

class CoachlyOfflineDB extends Dexie {
  pendingLogs!: Table<PendingLog, number>;

  constructor() {
    super('coachly-offline');
    this.version(1).stores({
      pendingLogs: '++id, action, status, createdAt',
    });
  }
}

// Singleton — safe to call from any client component.
let _db: CoachlyOfflineDB | null = null;
export function getOfflineDB(): CoachlyOfflineDB {
  if (!_db) _db = new CoachlyOfflineDB();
  return _db;
}

export async function enqueue(action: PendingAction, payload: Record<string, unknown>): Promise<number> {
  return getOfflineDB().pendingLogs.add({ action, payload, status: 'pending', retries: 0, createdAt: Date.now() });
}

export async function getPending(): Promise<PendingLog[]> {
  return getOfflineDB().pendingLogs.where('status').equals('pending').sortBy('createdAt');
}

export async function markSynced(id: number): Promise<void> {
  await getOfflineDB().pendingLogs.delete(id);
}

export async function markFailed(id: number): Promise<void> {
  await getOfflineDB().pendingLogs.update(id, { status: 'failed' });
}

export async function countPending(): Promise<number> {
  return getOfflineDB().pendingLogs.where('status').equals('pending').count();
}
