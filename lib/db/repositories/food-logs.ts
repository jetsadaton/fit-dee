// Food-logs repository.
//
// Reads filter `deleted_at IS NULL` (soft-delete contract) AND
// `confirmed_at IS NOT NULL` (only confirmed logs count toward dashboard
// totals — per topic doc; coach-proposed but unconfirmed rows live in DB
// but are invisible to summaries).

import { and, asc, between, eq, gte, isNotNull, isNull, lt, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { attachments, foodLogs, foods } from '@/lib/db/schema';
import type { DailyFoodTotals, FoodLog, NewFoodLog } from '@/lib/types/db/logs';

export type FoodLogWithName = {
  id: string;
  nameTh: string;
  mealType: string;
  kcal: number;
  kcalLow: number | null;
  kcalHigh: number | null;
  proteinG: string;
  carbG: string;
  fatG: string;
  portionG: number | null;
  loggedAt: Date;
  photoUrl: string | null;
};

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

/**
 * Per-day kcal totals for a date range, grouped by ICT calendar day.
 * Returns an array of { dateIct: 'YYYY-MM-DD', kcal, proteinG } sorted ascending.
 */
export async function dailyTotalsInRange(args: {
  userId: string;
  startUtc: Date;
  endUtc: Date;
}): Promise<{ dateIct: string; kcal: number; proteinG: number; waterMl?: number }[]> {
  const rows = await db
    .select({
      dateIct: sql<string>`to_char(${foodLogs.loggedAt} AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD')`,
      kcal: sql<number>`coalesce(sum(${foodLogs.kcal}), 0)`,
      proteinG: sql<number>`coalesce(sum(${foodLogs.proteinG}), 0)`,
    })
    .from(foodLogs)
    .where(and(eq(foodLogs.userId, args.userId), between(foodLogs.loggedAt, args.startUtc, args.endUtc), isLive))
    .groupBy(sql`to_char(${foodLogs.loggedAt} AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${foodLogs.loggedAt} AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD')`);
  return rows.map((r) => ({ dateIct: r.dateIct, kcal: Number(r.kcal), proteinG: Number(r.proteinG) }));
}

/**
 * Count of days where kcal ≥ floor within the range (ICT calendar days).
 * Used by the month tab "วันถึงเป้าแคล" stat.
 */
export async function countDaysHitKcal(args: {
  userId: string;
  startUtc: Date;
  endUtc: Date;
  floorKcal: number;
}): Promise<number> {
  const rows = await db.select({ n: sql<number>`count(*)` }).from(
    db
      .select({
        dateIct: sql<string>`to_char(${foodLogs.loggedAt} AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD')`,
        kcal: sql<number>`sum(${foodLogs.kcal})`,
      })
      .from(foodLogs)
      .where(and(eq(foodLogs.userId, args.userId), between(foodLogs.loggedAt, args.startUtc, args.endUtc), isLive))
      .groupBy(sql`to_char(${foodLogs.loggedAt} AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM-DD')`)
      .having(sql`sum(${foodLogs.kcal}) >= ${args.floorKcal}`)
      .as('days_hit'),
  );
  return Number(rows[0]?.n ?? 0);
}

export async function softDelete(id: string): Promise<void> {
  await db
    .update(foodLogs)
    .set({ deletedAt: new Date() })
    .where(and(eq(foodLogs.id, id), isNull(foodLogs.deletedAt)));
}

/** Soft-delete with ownership check — safe for user-facing actions. */
export async function softDeleteOwned(id: string, userId: string): Promise<void> {
  await db
    .update(foodLogs)
    .set({ deletedAt: new Date() })
    .where(and(eq(foodLogs.id, id), eq(foodLogs.userId, userId), isNull(foodLogs.deletedAt)));
}

/**
 * Confirmed food logs for a date range, with display name and optional photo URL.
 * nameTh: COALESCE(food_logs.name_th, foods.name_th, 'อาหาร')
 * photoUrl: attachments.blob_url when photo_id is set (food photo entries)
 */
export async function listWithName(args: { userId: string; startUtc: Date; endUtc: Date }): Promise<FoodLogWithName[]> {
  return db
    .select({
      id: foodLogs.id,
      nameTh: sql<string>`coalesce(${foodLogs.nameTh}, ${foods.nameTh}, 'อาหาร')`,
      mealType: foodLogs.mealType,
      kcal: foodLogs.kcal,
      kcalLow: foodLogs.kcalLow,
      kcalHigh: foodLogs.kcalHigh,
      proteinG: foodLogs.proteinG,
      carbG: foodLogs.carbG,
      fatG: foodLogs.fatG,
      portionG: foodLogs.portionG,
      loggedAt: foodLogs.loggedAt,
      photoUrl: attachments.blobUrl,
    })
    .from(foodLogs)
    .leftJoin(foods, eq(foodLogs.foodId, foods.id))
    .leftJoin(attachments, and(eq(foodLogs.photoId, attachments.id), isNull(attachments.deletedAt)))
    .where(
      and(
        eq(foodLogs.userId, args.userId),
        gte(foodLogs.loggedAt, args.startUtc),
        lt(foodLogs.loggedAt, args.endUtc),
        isNull(foodLogs.deletedAt),
        isNotNull(foodLogs.confirmedAt),
      ),
    )
    .orderBy(foodLogs.mealType, asc(foodLogs.loggedAt));
}

/** Edit kcal + macros. Collapses kcalLow/kcalHigh to the exact value (no longer an estimate). */
export async function updateFoodLog(
  id: string,
  userId: string,
  input: { kcal: number; proteinG: string; carbG: string; fatG: string },
): Promise<FoodLog | undefined> {
  const [row] = await db
    .update(foodLogs)
    .set({
      kcal: input.kcal,
      kcalLow: input.kcal,
      kcalHigh: input.kcal,
      proteinG: input.proteinG,
      carbG: input.carbG,
      fatG: input.fatG,
    })
    .where(
      and(
        eq(foodLogs.id, id),
        eq(foodLogs.userId, userId),
        isNull(foodLogs.deletedAt),
        isNotNull(foodLogs.confirmedAt),
      ),
    )
    .returning();
  return row;
}
