// Streaks repository.
// One row per user; the Inngest nightly job (Phase 3) is the only writer in
// production. /today reads `current` for the header flame badge.

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { streaks } from '@/lib/db/schema';

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
