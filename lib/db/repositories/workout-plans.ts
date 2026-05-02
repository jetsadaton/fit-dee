// Workout-plans repository.
//
// Schema enforces "one active plan per (user, week_starts_on)" via partial
// unique index. To swap plan mid-week the service must:
//   1. UPDATE old row SET active = false
//   2. INSERT new row with version = old.version + 1
// Repo exposes the building blocks; the orchestrator lives in
// lib/services/plan-generator.ts (Phase 2).

import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { workoutPlans } from '@/lib/db/schema';
import type { NewWorkoutPlan, WorkoutPlan } from '@/lib/types/db/workouts';

/** Currently active plan for the user (any week). */
export async function findActive(userId: string): Promise<WorkoutPlan | undefined> {
  const rows = await db
    .select()
    .from(workoutPlans)
    .where(and(eq(workoutPlans.userId, userId), eq(workoutPlans.active, true)))
    .orderBy(desc(workoutPlans.weekStartsOn))
    .limit(1);
  return rows[0];
}

export async function findById(id: string): Promise<WorkoutPlan | undefined> {
  const rows = await db.select().from(workoutPlans).where(eq(workoutPlans.id, id)).limit(1);
  return rows[0];
}

/**
 * History — useful for the recalibration job (Phase 3) and plan-versioning UI.
 * Most recent first.
 */
export async function listForUser(userId: string, limit = 20): Promise<WorkoutPlan[]> {
  return db
    .select()
    .from(workoutPlans)
    .where(eq(workoutPlans.userId, userId))
    .orderBy(desc(workoutPlans.weekStartsOn))
    .limit(limit);
}

export async function create(input: NewWorkoutPlan): Promise<WorkoutPlan> {
  const [row] = await db.insert(workoutPlans).values(input).returning();
  if (!row) throw new Error('workout-plans.create: insert returned no row');
  return row;
}

/** Mark a plan inactive; partial unique index allows the new active row. */
export async function deactivate(id: string): Promise<void> {
  await db
    .update(workoutPlans)
    .set({ active: false, updatedAt: new Date() })
    .where(and(eq(workoutPlans.id, id), eq(workoutPlans.active, true)));
}
