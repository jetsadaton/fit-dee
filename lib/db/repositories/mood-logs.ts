// Mood-logs repository — single energy reading per entry (1-5 scale).

import { and, between, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { moodLogs } from '@/lib/db/schema';
import type { MoodLog, NewMoodLog } from '@/lib/types/db/logs';

/** Most recent mood log within [start, end), or undefined. */
export async function latestInRange(args: {
  userId: string;
  startUtc: Date;
  endUtc: Date;
}): Promise<MoodLog | undefined> {
  const rows = await db
    .select()
    .from(moodLogs)
    .where(and(eq(moodLogs.userId, args.userId), between(moodLogs.loggedAt, args.startUtc, args.endUtc)))
    .orderBy(desc(moodLogs.loggedAt))
    .limit(1);
  return rows[0];
}

export async function create(input: NewMoodLog): Promise<MoodLog> {
  const [row] = await db.insert(moodLogs).values(input).returning();
  if (!row) throw new Error('mood-logs.create: insert returned no row');
  return row;
}
