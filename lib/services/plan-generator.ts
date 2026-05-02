// Plan generator — takes a user profile and produces a WorkoutPlan row.
//
// Day-split logic:
//   2–3 days/week → Full-body (all muscle groups each session)
//   4–5 days/week → Upper / Lower split
//   6   days/week → Push / Pull / Legs
//
// Exercise selection: filter by equipment tier (gym ⊃ home_eq ⊃ home),
// then pick by muscle group for the day type.
//
// Rep-range defaults are a reasonable starting point.
// ⚠️ PENDING OWNER CONFIRMATION via topics/progressive-overload.md before
//    changing progression rules, deload schedule, or rep-range policy.

import { findBySemanticIds } from '@/lib/db/repositories/exercises';
import { create as createPlan, deactivate as deactivatePlan, findActive } from '@/lib/db/repositories/workout-plans';
import type { UserProfile } from '@/lib/types/db/users';
import type { DayKey, PlanDay, PlanExercise, WeekPlanDays } from '@/lib/types/db/workouts';

// ── Equipment filter ───────────────────────────────────────────────────────

type EquipTier = 'gym' | 'home_eq' | 'home';

// ── Semantic IDs grouped by muscle pattern & equipment tier ───────────────

const EXERCISE_POOL: Record<EquipTier, Record<string, string[]>> = {
  gym: {
    push: ['barbell_bench_press', 'overhead_press'],
    pull: ['barbell_row', 'lat_pulldown'],
    legs: ['barbell_squat', 'leg_press', 'barbell_deadlift'],
    core: ['plank'],
  },
  home_eq: {
    push: ['dumbbell_press', 'dumbbell_shoulder_press'],
    pull: ['dumbbell_row'],
    legs: ['dumbbell_squat', 'dumbbell_lunge', 'romanian_deadlift_db'],
    core: ['plank'],
  },
  home: {
    push: ['pushup'],
    pull: [],
    legs: ['bodyweight_squat', 'lunge', 'glute_bridge'],
    core: ['plank', 'mountain_climber'],
  },
};

function poolForTier(tier: EquipTier) {
  if (tier === 'gym') return EXERCISE_POOL.gym;
  if (tier === 'home_eq')
    return {
      push: [...EXERCISE_POOL.home_eq.push, ...EXERCISE_POOL.home.push],
      pull: [...EXERCISE_POOL.home_eq.pull],
      legs: [...EXERCISE_POOL.home_eq.legs],
      core: [...EXERCISE_POOL.home_eq.core],
    };
  return EXERCISE_POOL.home;
}

// ── Rep-range by goal ─────────────────────────────────────────────────────
// ⚠️ PENDING progressive-overload.md owner confirmation

type Goal = 'lose' | 'gain' | 'fit';

const REP_OVERRIDES: Record<Goal, Partial<Record<string, string>>> = {
  lose: {}, // use exercise defaults (higher reps already baked in)
  gain: {
    // heavier, lower rep ranges
    barbell_squat: '5-8',
    barbell_bench_press: '5-8',
    barbell_deadlift: '4-6',
    barbell_row: '6-8',
    overhead_press: '6-8',
    lat_pulldown: '8-10',
    leg_press: '8-10',
  },
  fit: {}, // use exercise defaults
};

const REST_MULTIPLIER: Record<Goal, number> = {
  lose: 0.75, // shorter rest for metabolic effect
  gain: 1.25, // longer rest for strength
  fit: 1.0,
};

// ── Day schedules ──────────────────────────────────────────────────────────

const DAY_SCHEDULES: Record<number, DayKey[]> = {
  2: ['mon', 'thu'],
  3: ['mon', 'wed', 'fri'],
  4: ['mon', 'tue', 'thu', 'fri'],
  5: ['mon', 'tue', 'wed', 'fri', 'sat'],
  6: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
};

const ALL_DAYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

type DayType = 'full_body' | 'upper' | 'lower' | 'push' | 'pull' | 'legs';

function dayTypeSequence(daysPerWeek: number): DayType[] {
  if (daysPerWeek <= 3) return Array(daysPerWeek).fill('full_body') as DayType[];
  if (daysPerWeek <= 5) {
    const pattern: DayType[] = ['upper', 'lower', 'upper', 'lower', 'upper'];
    return pattern.slice(0, daysPerWeek);
  }
  return ['push', 'pull', 'legs', 'push', 'pull', 'legs'].slice(0, daysPerWeek) as DayType[];
}

const DAY_TYPE_NAME: Record<DayType, string> = {
  full_body: 'ฟูลบอดี้',
  upper: 'ส่วนบน',
  lower: 'ส่วนล่าง',
  push: 'ดัน (เพรส)',
  pull: 'ดึง (โรว์)',
  legs: 'ขา',
};

// ── Build exercises for a day ──────────────────────────────────────────────

function selectSemanticIds(dayType: DayType, pool: ReturnType<typeof poolForTier>): string[] {
  switch (dayType) {
    case 'full_body':
      return [...pool.legs.slice(0, 2), ...pool.push.slice(0, 1), ...pool.pull.slice(0, 1), ...pool.core.slice(0, 1)];
    case 'upper':
      return [...pool.push.slice(0, 2), ...pool.pull.slice(0, 2), ...pool.core.slice(0, 1)];
    case 'lower':
      return [...pool.legs.slice(0, 3), ...pool.core.slice(0, 1)];
    case 'push':
      return [...pool.push, ...pool.core.slice(0, 1)];
    case 'pull':
      return [...pool.pull, ...pool.core.slice(0, 1)];
    case 'legs':
      return [...pool.legs, ...pool.core.slice(0, 1)];
  }
}

// ── Main generator ─────────────────────────────────────────────────────────

export async function generatePlan(args: { userId: string; profile: UserProfile }): Promise<void> {
  const { userId, profile } = args;
  const equipment = profile.equipment as EquipTier;
  const goal = profile.goal as Goal;
  const daysPerWeek = Math.min(Math.max(profile.daysPerWeek, 2), 6);

  const pool = poolForTier(equipment);
  const workoutDays = DAY_SCHEDULES[daysPerWeek] ?? DAY_SCHEDULES[3];
  const dayTypes = dayTypeSequence(daysPerWeek);
  const restMult = REST_MULTIPLIER[goal];

  // Collect all unique semantic IDs we need
  const allSemanticIds = new Set<string>();
  for (let i = 0; i < workoutDays.length; i++) {
    for (const sid of selectSemanticIds(dayTypes[i]!, pool)) {
      allSemanticIds.add(sid);
    }
  }

  // Fetch exercise rows in one query
  const exerciseRows = await findBySemanticIds([...allSemanticIds]);
  const exerciseMap = new Map(exerciseRows.map((e) => [e.semanticId, e]));

  // Build WeekPlanDays
  const days: WeekPlanDays = {};

  for (let i = 0; i < workoutDays.length; i++) {
    const dayKey = workoutDays[i]!;
    const dayType = dayTypes[i]!;
    const semanticIds = selectSemanticIds(dayType, pool);

    const planExercises: PlanExercise[] = semanticIds
      .map((sid, idx) => {
        const ex = exerciseMap.get(sid);
        if (!ex) return null;
        const repOverride = REP_OVERRIDES[goal][sid];
        const restSec = Math.round(ex.defaultRestSec * restMult);
        const entry: PlanExercise = {
          exercise_id: ex.id,
          semantic_id: ex.semanticId,
          name_th: ex.nameTh,
          sets: ex.defaultSets,
          reps: repOverride ?? ex.defaultReps,
          rest_sec: restSec,
          order: idx + 1,
        };
        return entry;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    const planDay: PlanDay = {
      name: DAY_TYPE_NAME[dayType],
      focus: dayType === 'full_body' ? 'ทุกกลุ่มกล้ามเนื้อ' : undefined,
      rest_day: false,
      exercises: planExercises,
    };
    days[dayKey] = planDay;
  }

  // Mark remaining days as rest
  for (const d of ALL_DAYS) {
    if (!days[d]) {
      days[d] = { name: 'พักฟื้น', rest_day: true };
    }
  }

  // Deactivate any existing active plan then create new one
  const existing = await findActive(userId);
  if (existing) {
    await deactivatePlan(existing.id);
  }

  const weekStartsOn = getMondayOfCurrentWeek();

  await createPlan({
    userId,
    weekStartsOn: weekStartsOn.toISOString().slice(0, 10),
    days,
    version: existing ? (existing.version ?? 1) + 1 : 1,
    active: true,
  });
}

function getMondayOfCurrentWeek(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}
