// Weight-logs repository.
// Latest weight drives Today's "ชั่งน้ำหนักเช้านี้" card and the 14-day
// recalibration job (Phase 3).

import { and, between, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { weightLogs } from '@/lib/db/schema';
import type { NewWeightLog, WeightLog } from '@/lib/types/db/logs';

/** Most recent weigh-in (any time), or undefined if user has never logged. */
export async function latest(userId: string): Promise<WeightLog | undefined> {
  const rows = await db
    .select()
    .from(weightLogs)
    .where(eq(weightLogs.userId, userId))
    .orderBy(desc(weightLogs.loggedAt))
    .limit(1);
  return rows[0];
}

/** Range query — used by recalibration to compute 14-day trend. */
export async function findInRange(args: { userId: string; startUtc: Date; endUtc: Date }): Promise<WeightLog[]> {
  return db
    .select()
    .from(weightLogs)
    .where(and(eq(weightLogs.userId, args.userId), between(weightLogs.loggedAt, args.startUtc, args.endUtc)))
    .orderBy(desc(weightLogs.loggedAt));
}

export async function create(input: NewWeightLog): Promise<WeightLog> {
  const [row] = await db.insert(weightLogs).values(input).returning();
  if (!row) throw new Error('weight-logs.create: insert returned no row');
  return row;
}
