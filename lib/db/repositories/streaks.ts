// Streaks repository.
// One row per user; the Inngest nightly job writes via `upsert`.
// /today reads `current` for the header flame badge.

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { streaks } from '@/lib/db/schema';
import type { StreakState } from '@/lib/services/streak';

export type StreakRow = {
  userId: string;
  current: number;
  longest: number;
  lastActiveDate: string | null;
  updatedAt: Date;
};

export async function findByUserId(userId: string): Promise<StreakRow | undefined> {
  const rows = await db.select().from(streaks).where(eq(streaks.userId, userId)).limit(1);
  const r = rows[0];
  if (!r) return undefined;
  return {
    userId: r.userId,
    current: r.current ?? 0,
    longest: r.longest ?? 0,
    lastActiveDate: r.lastActiveDate ?? null,
    updatedAt: r.updatedAt ?? new Date(),
  };
}

export async function upsert(userId: string, state: StreakState): Promise<void> {
  await db
    .insert(streaks)
    .values({
      userId,
      current: state.current,
      longest: state.longest,
      lastActiveDate: state.lastActiveDate,
    })
    .onConflictDoUpdate({
      target: streaks.userId,
      set: {
        current: state.current,
        longest: state.longest,
        lastActiveDate: state.lastActiveDate,
        updatedAt: new Date(),
      },
    });
}
