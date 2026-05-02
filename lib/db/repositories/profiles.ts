// User profiles repository — only file allowed to query `user_profiles`.
//
// Layering:
//   onboarding service → profiles repo → drizzle
// `user_profiles.user_id` is the PK + FK to users.id (1:1), so upsert is the
// natural shape: first run after onboarding inserts; later edits update.

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { userProfiles } from '@/lib/db/schema';
import type { NewUserProfile, UserProfile } from '@/lib/types/db/users';

export type PlanFieldsInput = {
  goal?: string;
  activityLevel?: string;
  targetWeightKg?: string;
  daysPerWeek?: number;
  equipment?: string;
  kcalTarget: number;
  tdeeKcal: number;
  proteinGTarget: number;
  carbGTarget: number;
  fatGTarget: number;
};

export async function findByUserId(userId: string): Promise<UserProfile | undefined> {
  const rows = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return rows[0];
}

/**
 * Insert a profile or update if it already exists (1:1 with users).
 * Caller must have validated `input` via the Zod DTO upstream.
 */
export async function upsert(input: NewUserProfile): Promise<UserProfile> {
  const [row] = await db
    .insert(userProfiles)
    .values(input)
    .onConflictDoUpdate({
      target: userProfiles.userId,
      set: {
        displayName: input.displayName,
        sex: input.sex,
        age: input.age,
        heightCm: input.heightCm,
        weightKgInitial: input.weightKgInitial,
        targetWeightKg: input.targetWeightKg,
        goal: input.goal,
        daysPerWeek: input.daysPerWeek,
        activityLevel: input.activityLevel,
        equipment: input.equipment,
        injuries: input.injuries,
        tdeeKcal: input.tdeeKcal,
        kcalTarget: input.kcalTarget,
        proteinGTarget: input.proteinGTarget,
        carbGTarget: input.carbGTarget,
        fatGTarget: input.fatGTarget,
        planRecalibratedAt: input.planRecalibratedAt,
        updatedAt: new Date(),
      },
    })
    .returning();
  if (!row) throw new Error('profiles.upsert: insert returned no row');
  return row;
}

/**
 * Update only plan-relevant fields — called by the update_profile AI tool confirm action.
 * Identity fields (displayName, sex, age, heightCm, weightKgInitial) are intentionally excluded.
 * Resets plan_recalibrated_at so the Inngest 14-day recalibration restarts from now.
 */
export async function updatePlanFields(userId: string, input: PlanFieldsInput): Promise<UserProfile> {
  const [row] = await db
    .update(userProfiles)
    .set({
      ...(input.goal !== undefined && { goal: input.goal }),
      ...(input.activityLevel !== undefined && { activityLevel: input.activityLevel }),
      ...(input.targetWeightKg !== undefined && { targetWeightKg: input.targetWeightKg }),
      ...(input.daysPerWeek !== undefined && { daysPerWeek: input.daysPerWeek }),
      ...(input.equipment !== undefined && { equipment: input.equipment }),
      kcalTarget: input.kcalTarget,
      tdeeKcal: input.tdeeKcal,
      proteinGTarget: input.proteinGTarget,
      carbGTarget: input.carbGTarget,
      fatGTarget: input.fatGTarget,
      planRecalibratedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(userProfiles.userId, userId))
    .returning();
  if (!row) throw new Error('profiles.updatePlanFields: no row returned');
  return row;
}
