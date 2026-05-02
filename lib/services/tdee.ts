// TDEE + macro calculator.
//
// SOURCE OF TRUTH (rules + numbers): .claude/topics/tdee-and-macros.md
// AI-generated code MUST match the topic doc. If you change a constant here,
// update the topic doc in the same commit (and vice versa).
//
// Pure functions only — no I/O. Repository writes happen in caller (service →
// repo, never here). Used by:
//   - app/onboarding/* (step 4 ETA + step 7 plan reveal)
//   - app/plan-preview/page.tsx (A3)
//   - lib/ai/tools/update_profile.ts (Phase 2)

export type Sex = 'm' | 'f' | 'o';
export type Goal = 'lose' | 'gain' | 'fit';
export type ActivityLevel = 'sit' | 'walk' | 'move' | 'active';

// ─── BMR ─────────────────────────────────────────────────────────────

/** Mifflin-St Jeor (1990) — default when body fat % unknown. */
export function bmrMifflinStJeor(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (sex === 'm') return base + 5;
  // 'f' and 'o' both use the lower-floor variant (conservative kcal floor)
  return base - 161;
}

/** Katch-McArdle — used when body_fat_pct is provided (more accurate). */
export function bmrKatchMcArdle(weightKg: number, bodyFatPct: number): number {
  const lbm = weightKg * (1 - bodyFatPct / 100);
  return 370 + 21.6 * lbm;
}

// ─── activity + goal adjustments ─────────────────────────────────────

const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sit: 1.2,
  walk: 1.375,
  move: 1.55,
  active: 1.725,
};

const GOAL_FACTOR: Record<Goal, number> = {
  lose: 0.8, // −20% deficit
  gain: 1.12, // +12% surplus
  fit: 1.0,
};

const KCAL_FLOOR: Record<Sex, number> = {
  m: 1500,
  f: 1200,
  o: 1200,
};

// ─── public types ────────────────────────────────────────────────────

export type TdeeInput = {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  age: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  /** Optional. If provided, switches BMR formula to Katch-McArdle. */
  bodyFatPct?: number | null;
};

export type MacroTargets = {
  proteinG: number;
  carbG: number;
  fatG: number;
};

export type TdeeResult = {
  bmr: number;
  tdee: number;
  /** Pre-floor target — useful for diagnostics / safety telemetry. */
  rawKcalTarget: number;
  /** Post-floor target written to user_profiles.kcal_target. */
  kcalTarget: number;
  flooredAt: number | null;
  macros: MacroTargets;
  /** Which BMR formula was used — for explainer UI. */
  formula: 'mifflin-st-jeor' | 'katch-mcardle';
};

// ─── errors ──────────────────────────────────────────────────────────

export class InfeasiblePlanError extends Error {
  constructor(public readonly reason: 'carbs-below-50g') {
    super(`TDEE plan is infeasible: ${reason}`);
    this.name = 'InfeasiblePlanError';
  }
}

// ─── core calculator ─────────────────────────────────────────────────

const round = Math.round;

export function computeTdee(input: TdeeInput): TdeeResult {
  const { sex, weightKg, heightCm, age, activityLevel, goal, bodyFatPct } = input;

  const useKatch = bodyFatPct != null && bodyFatPct > 0 && bodyFatPct < 60;
  const bmr = useKatch
    ? bmrKatchMcArdle(weightKg, bodyFatPct as number)
    : bmrMifflinStJeor(sex, weightKg, heightCm, age);

  const tdee = bmr * ACTIVITY_FACTOR[activityLevel];
  const rawKcalTarget = tdee * GOAL_FACTOR[goal];

  const floor = KCAL_FLOOR[sex];
  const kcalTarget = Math.max(round(rawKcalTarget), floor);
  const flooredAt = kcalTarget > round(rawKcalTarget) ? floor : null;

  const macros = computeMacros({ kcalTarget, weightKg, goal });

  return {
    bmr: round(bmr),
    tdee: round(tdee),
    rawKcalTarget: round(rawKcalTarget),
    kcalTarget,
    flooredAt,
    macros,
    formula: useKatch ? 'katch-mcardle' : 'mifflin-st-jeor',
  };
}

// ─── macros (option B: g/kg) ─────────────────────────────────────────

const PROTEIN_G_PER_KG: Record<Goal, number> = {
  lose: 2.0,
  gain: 1.8,
  fit: 1.6,
};

const FAT_G_PER_KG: Record<Goal, number> = {
  lose: 0.8,
  gain: 0.9,
  fit: 0.9,
};

const MIN_CARB_G = 50; // brain glycogen minimum

export function computeMacros(args: { kcalTarget: number; weightKg: number; goal: Goal }): MacroTargets {
  const { kcalTarget, weightKg, goal } = args;

  let proteinG = PROTEIN_G_PER_KG[goal] * weightKg;
  let fatG = FAT_G_PER_KG[goal] * weightKg;
  let carbKcal = kcalTarget - (proteinG * 4 + fatG * 9);

  // Scale protein + fat down proportionally if carbs would fall below the floor.
  if (carbKcal / 4 < MIN_CARB_G) {
    const minCarbKcal = MIN_CARB_G * 4;
    const availableForPF = kcalTarget - minCarbKcal;
    if (availableForPF <= 0) {
      // Even at 50g carbs, no kcal left for protein+fat — plan is infeasible.
      throw new InfeasiblePlanError('carbs-below-50g');
    }
    const currentPF = proteinG * 4 + fatG * 9;
    const scale = availableForPF / currentPF;
    proteinG *= scale;
    fatG *= scale;
    carbKcal = minCarbKcal;
  }

  return {
    proteinG: round(proteinG),
    carbG: round(carbKcal / 4),
    fatG: round(fatG),
  };
}

// ─── onboarding step 4 ETA ───────────────────────────────────────────

const KCAL_PER_KG_FAT = 7700;

/**
 * Rough "weeks to target" estimate from energy balance.
 * Returns at minimum 2 weeks (avoids "1 week" promises that can't be met).
 */
export function estimateWeeksToTarget(args: {
  weightKg: number;
  targetWeightKg: number;
  tdee: number;
  kcalTarget: number;
}): number {
  const { weightKg, targetWeightKg, tdee, kcalTarget } = args;
  const dailyDeltaKcal = Math.abs(tdee - kcalTarget);
  if (dailyDeltaKcal === 0) return 0; // 'fit' goal — no change expected

  const weeklyKgChange = (dailyDeltaKcal * 7) / KCAL_PER_KG_FAT;
  const weightDeltaKg = Math.abs(weightKg - targetWeightKg);
  if (weightDeltaKg === 0) return 0;

  return Math.max(2, Math.ceil(weightDeltaKg / weeklyKgChange));
}
