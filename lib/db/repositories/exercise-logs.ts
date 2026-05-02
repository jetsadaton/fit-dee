// Exercise-logs repository — one row per completed set within a session.

import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { exerciseLogs } from '@/lib/db/schema';
import type { ExerciseLog, NewExerciseLog } from '@/lib/types/db/workouts';

export async function findBySession(sessionId: string): Promise<ExerciseLog[]> {
  return db.select().from(exerciseLogs).where(eq(exerciseLogs.sessionId, sessionId)).orderBy(asc(exerciseLogs.setIdx));
}

export async function create(input: NewExerciseLog): Promise<ExerciseLog> {
  const [row] = await db.insert(exerciseLogs).values(input).returning();
  if (!row) throw new Error('exercise-logs.create: insert returned no row');
  return row;
}

/** Bulk insert (e.g. quick-log a whole exercise's worth of sets at once). */
export async function createMany(inputs: NewExerciseLog[]): Promise<ExerciseLog[]> {
  if (inputs.length === 0) return [];
  return db.insert(exerciseLogs).values(inputs).returning();
}
