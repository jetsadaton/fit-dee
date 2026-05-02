// Food-logs repository.
//
// Reads filter `deleted_at IS NULL` (soft-delete contract) AND
// `confirmed_at IS NOT NULL` (only confirmed logs count toward dashboard
// totals — per topic doc; coach-proposed but unconfirmed rows live in DB
// but are invisible to summaries).

import { and, between, eq, gte, isNotNull, isNull, lt, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { foodLogs } from '@/lib/db/schema';
import type { DailyFoodTotals, FoodLog, NewFoodLog } from '@/lib/types/db/logs';

const isLive = and(isNull(foodLogs.deletedAt), isNotNull(foodLogs.confirmedAt));

/** Inclusive start, exclusive end (ms-precision day window in caller's tz). */
export async function findInRange(args: { userId: string; startUtc: Date; endUtc: Date }): Promise<FoodLog[]> {
  return db
    .select()
    .from(foodLogs)
    .where(
      and(
        eq(foodLogs.userId, args.userId),
        gte(foodLogs.loggedAt, args.startUtc),
        lt(foodLogs.loggedAt, args.endUtc),
        isLive,
      ),
    );
}

/** Aggregated totals for the dashboard kcal ring + macro bar. */
export async function sumInRange(args: { userId: string; startUtc: Date; endUtc: Date }): Promise<DailyFoodTotals> {
  const rows = await db
    .select({
      kcal: sql<number>`coalesce(sum(${foodLogs.kcal}), 0)`,
      proteinG: sql<number>`coalesce(sum(${foodLogs.proteinG}), 0)`,
      carbG: sql<number>`coalesce(sum(${foodLogs.carbG}), 0)`,
      fatG: sql<number>`coalesce(sum(${foodLogs.fatG}), 0)`,
      meals: sql<number>`count(*)`,
    })
    .from(foodLogs)
    .where(and(eq(foodLogs.userId, args.userId), between(foodLogs.loggedAt, args.startUtc, args.endUtc), isLive));
  const r = rows[0];
  return {
    kcal: Number(r?.kcal ?? 0),
    proteinG: Number(r?.proteinG ?? 0),
    carbG: Number(r?.carbG ?? 0),
    fatG: Number(r?.fatG ?? 0),
    meals: Number(r?.meals ?? 0),
  };
}

/**
 * Insert a coach-proposed log (confirmed_at = null). UI surfaces a confirm
 * card before the user accepts; once accepted, call `confirm(id)`.
 */
export async function createPending(input: Omit<NewFoodLog, 'confirmedAt'>): Promise<FoodLog> {
  const [row] = await db
    .insert(foodLogs)
    .values({ ...input, confirmedAt: null })
    .returning();
  if (!row) throw new Error('food-logs.createPending: insert returned no row');
  return row;
}

/** Insert directly as a confirmed log (manual entry path). */
export async function createConfirmed(input: NewFoodLog): Promise<FoodLog> {
  const [row] = await db
    .insert(foodLogs)
    .values({ ...input, confirmedAt: input.confirmedAt ?? new Date() })
    .returning();
  if (!row) throw new Error('food-logs.createConfirmed: insert returned no row');
  return row;
}

export async function confirm(id: string): Promise<FoodLog | undefined> {
  const [row] = await db
    .update(foodLogs)
    .set({ confirmedAt: new Date() })
    .where(and(eq(foodLogs.id, id), isNull(foodLogs.deletedAt)))
    .returning();
  return row;
}

export async function softDelete(id: string): Promise<void> {
  await db
    .update(foodLogs)
    .set({ deletedAt: new Date() })
    .where(and(eq(foodLogs.id, id), isNull(foodLogs.deletedAt)));
}
