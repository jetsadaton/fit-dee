import { and, desc, eq, gte } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { insightsCache } from '@/lib/db/schema';
import type { Insight, InsightRange } from '@/lib/types/dto/insights';

const STALE_MS = 12 * 60 * 60 * 1000; // 12 hours

export async function findFresh(args: {
  userId: string;
  range: InsightRange;
  dateIct: string;
}): Promise<Insight[] | null> {
  const cutoff = new Date(Date.now() - STALE_MS);
  const rows = await db
    .select({ insights: insightsCache.insights })
    .from(insightsCache)
    .where(
      and(
        eq(insightsCache.userId, args.userId),
        eq(insightsCache.range, args.range),
        eq(insightsCache.dateIct, args.dateIct),
        gte(insightsCache.generatedAt, cutoff),
      ),
    )
    .orderBy(desc(insightsCache.generatedAt))
    .limit(1);
  if (!rows[0]) return null;
  return rows[0].insights as Insight[];
}

export async function upsert(args: {
  userId: string;
  range: InsightRange;
  dateIct: string;
  insights: Insight[];
}): Promise<void> {
  await db
    .insert(insightsCache)
    .values({
      userId: args.userId,
      range: args.range,
      dateIct: args.dateIct,
      insights: args.insights,
    })
    .onConflictDoUpdate({
      target: [insightsCache.userId, insightsCache.range, insightsCache.dateIct],
      set: { insights: args.insights, generatedAt: new Date() },
    });
}
