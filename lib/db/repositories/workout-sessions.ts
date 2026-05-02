// Workout-sessions repository — one row per "เริ่มเลย" tap on /plan.
// Sessions are mutated three times in a typical run:
//   start  → create()              ended_at null, totals null
//   set    → exercise-logs.create
//   finish → finish()              ended_at + total_volume + reps + elapsed

import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { workoutSessions } from '@/lib/db/schema';
import type { NewWorkoutSession, WorkoutSession } from '@/lib/types/db/workouts';

const isLive = isNull(workoutSessions.deletedAt);

export async function findById(id: string): Promise<WorkoutSession | undefined> {
  const rows = await db
    .select()
    .from(workoutSessions)
    .where(and(eq(workoutSessions.id, id), isLive))
    .limit(1);
  return rows[0];
}

/** In-flight session for the user (started, not yet ended). */
export async function findActive(userId: string): Promise<WorkoutSession | undefined> {
  const rows = await db
    .select()
    .from(workoutSessions)
    .where(and(eq(workoutSessions.userId, userId), isNull(workoutSessions.endedAt), isLive))
    .orderBy(desc(workoutSessions.startedAt))
    .limit(1);
  return rows[0];
}

export async function listForUser(userId: string, limit = 50): Promise<WorkoutSession[]> {
  return db
    .select()
    .from(workoutSessions)
    .where(and(eq(workoutSessions.userId, userId), isLive))
    .orderBy(desc(workoutSessions.startedAt))
    .limit(limit);
}

/** Create a fresh session. `startedAt` defaults to now() at the DB. */
export async function create(input: NewWorkoutSession): Promise<WorkoutSession> {
  const [row] = await db.insert(workoutSessions).values(input).returning();
  if (!row) throw new Error('workout-sessions.create: insert returned no row');
  return row;
}

/** Close out a session — write totals snapshot. Idempotent on already-ended. */
export async function finish(args: {
  id: string;
  totalVolumeKg: number;
  totalReps: number;
  elapsedSec: number;
}): Promise<WorkoutSession | undefined> {
  const [row] = await db
    .update(workoutSessions)
    .set({
      endedAt: new Date(),
      // numeric column; stringify at the boundary
      totalVolumeKg: String(args.totalVolumeKg),
      totalReps: args.totalReps,
      elapsedSec: args.elapsedSec,
    })
    .where(and(eq(workoutSessions.id, args.id), isNull(workoutSessions.endedAt)))
    .returning();
  return row;
}

export async function softDelete(id: string): Promise<void> {
  await db
    .update(workoutSessions)
    .set({ deletedAt: new Date() })
    .where(and(eq(workoutSessions.id, id), isLive));
}
