// Onboarding orchestrator — turns the 9-turn form into a persisted profile.
//
// Pure-ish: takes validated input + userId, computes targets via tdee service,
// then writes user_profiles via repository. No HTTP, no auth checks here —
// caller (Server Action) does both.

import { computeTdee, type ActivityLevel, type Goal, type Sex } from '@/lib/services/tdee';
import { upsert as upsertProfile } from '@/lib/db/repositories/profiles';
import type { OnboardingInput } from '@/lib/types/dto/onboarding';
import type { UserProfile } from '@/lib/types/db/users';

export type OnboardingResult = {
  profile: UserProfile;
  tdee: number;
  kcalTarget: number;
  formula: 'mifflin-st-jeor' | 'katch-mcardle';
  flooredAt: number | null;
};

export async function completeOnboarding(args: { userId: string; input: OnboardingInput }): Promise<OnboardingResult> {
  const { userId, input } = args;

  const tdeeResult = computeTdee({
    sex: input.sex as Sex,
    weightKg: input.weightKgInitial,
    heightCm: input.heightCm,
    age: input.age,
    activityLevel: input.activityLevel as ActivityLevel,
    goal: input.goal as Goal,
    bodyFatPct: input.bodyFatPct ?? null,
  });

  const profile = await upsertProfile({
    userId,
    displayName: input.displayName,
    sex: input.sex,
    age: input.age,
    heightCm: input.heightCm,
    // Drizzle numeric columns expect string in node-postgres — cast at boundary.
    weightKgInitial: String(input.weightKgInitial),
    targetWeightKg: String(input.targetWeightKg),
    goal: input.goal,
    daysPerWeek: input.daysPerWeek,
    activityLevel: input.activityLevel,
    equipment: input.equipment,
    injuries: input.injuries,
    tdeeKcal: tdeeResult.tdee,
    kcalTarget: tdeeResult.kcalTarget,
    proteinGTarget: tdeeResult.macros.proteinG,
    carbGTarget: tdeeResult.macros.carbG,
    fatGTarget: tdeeResult.macros.fatG,
    planRecalibratedAt: new Date(),
  });

  return {
    profile,
    tdee: tdeeResult.tdee,
    kcalTarget: tdeeResult.kcalTarget,
    formula: tdeeResult.formula,
    flooredAt: tdeeResult.flooredAt,
  };
}
