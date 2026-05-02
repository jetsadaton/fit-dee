// Water-logs repository — additive log (no soft-delete column on this table
// per schema; users hard-delete via PDPA cascade only).

import { and, between, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { waterLogs } from '@/lib/db/schema';
import type { NewWaterLog, WaterLog } from '@/lib/types/db/logs';

export async function findInRange(args: { userId: string; startUtc: Date; endUtc: Date }): Promise<WaterLog[]> {
  return db
    .select()
    .from(waterLogs)
    .where(and(eq(waterLogs.userId, args.userId), between(waterLogs.loggedAt, args.startUtc, args.endUtc)));
}

/** Sum of ml ingested in [start, end). */
export async function sumMlInRange(args: { userId: string; startUtc: Date; endUtc: Date }): Promise<number> {
  const rows = await db
    .select({ total: sql<number>`coalesce(sum(${waterLogs.ml}), 0)` })
    .from(waterLogs)
    .where(and(eq(waterLogs.userId, args.userId), between(waterLogs.loggedAt, args.startUtc, args.endUtc)));
  return Number(rows[0]?.total ?? 0);
}

export async function create(input: NewWaterLog): Promise<WaterLog> {
  const [row] = await db.insert(waterLogs).values(input).returning();
  if (!row) throw new Error('water-logs.create: insert returned no row');
  return row;
}
