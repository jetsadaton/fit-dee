// Today dashboard data orchestrator.
// Pulls everything /today's RSC needs in one place; UI never shapes its own
// queries. Returns sensible zeros for new users (no profile, no logs) so the
// page doesn't crash before onboarding.

import { findByUserId as findProfile } from '@/lib/db/repositories/profiles';
import { sumInRange as sumFood, dailyTotalsInRange, countDaysHitKcal } from '@/lib/db/repositories/food-logs';
import { sumMlInRange as sumWaterMl } from '@/lib/db/repositories/water-logs';
import { latestInRange as latestMood } from '@/lib/db/repositories/mood-logs';
import { latest as latestWeight, findInRange as weightInRange } from '@/lib/db/repositories/weight-logs';
import { findByUserId as findStreak } from '@/lib/db/repositories/streaks';
import { findById as findUser } from '@/lib/db/repositories/users';
import { findActive as findActivePlan } from '@/lib/db/repositories/workout-plans';
import { countInRange as countWorkoutSessions } from '@/lib/db/repositories/workout-sessions';
import type { DailyFoodTotals } from '@/lib/types/db/logs';
import type { DayKey, WeekPlanDays } from '@/lib/types/db/workouts';

// User tz pinned to Asia/Bangkok until users.tz column ships (Phase 2).
const ICT_OFFSET_MS = 7 * 60 * 60 * 1000;

export function startOfDayICT(now = new Date()): Date {
  const ictNow = new Date(now.getTime() + ICT_OFFSET_MS);
  ictNow.setUTCHours(0, 0, 0, 0);
  return new Date(ictNow.getTime() - ICT_OFFSET_MS);
}

export function endOfDayICT(now = new Date()): Date {
  const start = startOfDayICT(now);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000);
}

export type WeekDayKcal = { dateIct: string; kcal: number };

export type TodaySnapshot = {
  displayName: string;
  streakCurrent: number;
  streakLongest: number;
  kcalEaten: number;
  kcalGoal: number;
  kcalBurned: number; // 0 until workout-sessions repo wires kcal estimate
  proteinEaten: number;
  carbEaten: number;
  fatEaten: number;
  proteinGoal: number;
  carbGoal: number;
  fatGoal: number;
  waterMl: number;
  /** 1-5; null if user hasn't logged today yet */
  moodEnergy: number | null;
  /** Most recent weight ever, in kg */
  latestWeightKg: number | null;
  /** undefined = no active plan; null = rest day; object = real workout */
  todayWorkout: { name: string; exerciseCount: number; mins: number } | null | undefined;
  /** Goal weight from profile (for month GoalProgress) */
  targetWeightKg: number | null;
  /** Initial weight from profile (start of journey) */
  weightKgInitial: number | null;
  /** Planned workout days per week (for week "เล่นไป X/X") */
  daysPerWeek: number;

  // ── Week (past 7 ICT calendar days) ───────────────────────────────────
  week7Days: WeekDayKcal[];
  week7AvgKcal: number;
  week7AvgProteinG: number;
  week7AvgWaterGlasses: number;
  week7WorkoutCount: number;
  week7WeightDeltaKg: number | null;

  // ── Month (past 30 ICT calendar days) ─────────────────────────────────
  month30WorkoutCount: number;
  month30WeightDeltaKg: number | null;
  month30DaysHitKcal: number;
};

const ZEROES: DailyFoodTotals = { kcal: 0, proteinG: 0, carbG: 0, fatG: 0, meals: 0 };

const DAY_KEYS: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function todayDayKey(): DayKey {
  const ictNow = new Date(Date.now() + ICT_OFFSET_MS);
  return DAY_KEYS[ictNow.getUTCDay()]!;
}

function daysAgoStart(n: number): Date {
  const now = new Date();
  return startOfDayICT(new Date(now.getTime() - n * 24 * 60 * 60 * 1000));
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
}

export async function loadTodaySnapshot(userId: string): Promise<TodaySnapshot> {
  const dayStart = startOfDayICT();
  const dayEnd = endOfDayICT();
  const week7Start = daysAgoStart(6); // 7 days incl. today
  const month30Start = daysAgoStart(29); // 30 days incl. today

  // Fan-out all reads in parallel.
  const [
    user,
    profile,
    food,
    waterMl,
    mood,
    weight,
    streak,
    plan,
    week7Food,
    week7Water,
    week7Workouts,
    week7Weights,
    month30Workouts,
    month30Weights,
    month30HitKcal,
  ] = await Promise.all([
    findUser(userId),
    findProfile(userId),
    sumFood({ userId, startUtc: dayStart, endUtc: dayEnd }).catch(() => ZEROES),
    sumWaterMl({ userId, startUtc: dayStart, endUtc: dayEnd }).catch(() => 0),
    latestMood({ userId, startUtc: dayStart, endUtc: dayEnd }).catch(() => undefined),
    latestWeight(userId).catch(() => undefined),
    findStreak(userId).catch(() => undefined),
    findActivePlan(userId).catch(() => undefined),
    // week
    dailyTotalsInRange({ userId, startUtc: week7Start, endUtc: dayEnd }).catch(() => []),
    sumWaterMl({ userId, startUtc: week7Start, endUtc: dayEnd }).catch(() => 0),
    countWorkoutSessions({ userId, startUtc: week7Start, endUtc: dayEnd }).catch(() => 0),
    weightInRange({ userId, startUtc: week7Start, endUtc: dayEnd }).catch(() => []),
    // month
    countWorkoutSessions({ userId, startUtc: month30Start, endUtc: dayEnd }).catch(() => 0),
    weightInRange({ userId, startUtc: month30Start, endUtc: dayEnd }).catch(() => []),
    // days where kcal ≥ 80% of goal (computed after profile loads — use 0 as fallback)
    Promise.resolve(0), // placeholder; computed below after profile
  ]);

  // Compute kcal-hit days once we have the goal.
  const kcalGoal = profile?.kcalTarget ?? 0;
  const month30HitKcalReal =
    kcalGoal > 0
      ? await countDaysHitKcal({
          userId,
          startUtc: month30Start,
          endUtc: dayEnd,
          floorKcal: Math.round(kcalGoal * 0.8),
        }).catch(() => 0)
      : month30HitKcal;

  // Derive today's workout from active plan.
  let todayWorkout: TodaySnapshot['todayWorkout'];
  if (plan) {
    const days = plan.days as WeekPlanDays;
    const dayData = days[todayDayKey()];
    if (!dayData || dayData.rest_day) {
      todayWorkout = null;
    } else {
      todayWorkout = {
        name: dayData.name,
        exerciseCount: dayData.exercises?.length ?? 0,
        mins: dayData.mins ?? 45,
      };
    }
  }

  // Week stats.
  const week7AvgKcal = avg(week7Food.map((d) => d.kcal));
  const week7AvgProteinG = avg(week7Food.map((d) => d.proteinG));
  const week7AvgWaterGlasses = Math.round(week7Water / 250 / 7);
  const week7WeightDeltaKg =
    week7Weights.length >= 2
      ? Math.round((Number(week7Weights[0]!.weightKg) - Number(week7Weights[week7Weights.length - 1]!.weightKg)) * 10) /
        10
      : null;

  // Month stats.
  const month30WeightDeltaKg =
    month30Weights.length >= 2
      ? Math.round(
          (Number(month30Weights[0]!.weightKg) - Number(month30Weights[month30Weights.length - 1]!.weightKg)) * 10,
        ) / 10
      : null;

  return {
    displayName: profile?.displayName ?? user?.email?.split('@')[0] ?? 'นาย',
    streakCurrent: streak?.current ?? 0,
    streakLongest: streak?.longest ?? 0,
    kcalEaten: food.kcal,
    kcalGoal,
    kcalBurned: 0,
    proteinEaten: Math.round(food.proteinG),
    carbEaten: Math.round(food.carbG),
    fatEaten: Math.round(food.fatG),
    proteinGoal: profile?.proteinGTarget ?? 0,
    carbGoal: profile?.carbGTarget ?? 0,
    fatGoal: profile?.fatGTarget ?? 0,
    waterMl,
    moodEnergy: mood?.energy ?? null,
    latestWeightKg: weight?.weightKg != null ? Number(weight.weightKg) : null,
    todayWorkout,
    targetWeightKg: profile?.targetWeightKg != null ? Number(profile.targetWeightKg) : null,
    weightKgInitial: profile?.weightKgInitial != null ? Number(profile.weightKgInitial) : null,
    daysPerWeek: profile?.daysPerWeek ?? 3,
    week7Days: week7Food.map((d) => ({ dateIct: d.dateIct, kcal: d.kcal })),
    week7AvgKcal,
    week7AvgProteinG,
    week7AvgWaterGlasses,
    week7WorkoutCount: week7Workouts,
    week7WeightDeltaKg,
    month30WorkoutCount: month30Workouts,
    month30WeightDeltaKg,
    month30DaysHitKcal: month30HitKcalReal,
  };
}
