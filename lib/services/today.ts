// Today dashboard data orchestrator.
// Pulls everything /today's RSC needs in one place; UI never shapes its own
// queries. Returns sensible zeros for new users (no profile, no logs) so the
// page doesn't crash before onboarding.

import { findByUserId as findProfile } from '@/lib/db/repositories/profiles';
import { sumInRange as sumFood } from '@/lib/db/repositories/food-logs';
import { sumMlInRange as sumWaterMl } from '@/lib/db/repositories/water-logs';
import { latestInRange as latestMood } from '@/lib/db/repositories/mood-logs';
import { latest as latestWeight } from '@/lib/db/repositories/weight-logs';
import { findByUserId as findStreak } from '@/lib/db/repositories/streaks';
import { findById as findUser } from '@/lib/db/repositories/users';
import type { DailyFoodTotals } from '@/lib/types/db/logs';

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

export type TodaySnapshot = {
  displayName: string;
  streakCurrent: number;
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
  /** Most recent weight ever, in kg (Phase 1 simplification — chart series TBD) */
  latestWeightKg: number | null;
};

const ZEROES: DailyFoodTotals = { kcal: 0, proteinG: 0, carbG: 0, fatG: 0, meals: 0 };

export async function loadTodaySnapshot(userId: string): Promise<TodaySnapshot> {
  const dayStart = startOfDayICT();
  const dayEnd = endOfDayICT();

  // Fan-out reads in parallel; user's own row gives display name.
  const [user, profile, food, waterMl, mood, weight, streak] = await Promise.all([
    findUser(userId),
    findProfile(userId),
    sumFood({ userId, startUtc: dayStart, endUtc: dayEnd }).catch(() => ZEROES),
    sumWaterMl({ userId, startUtc: dayStart, endUtc: dayEnd }).catch(() => 0),
    latestMood({ userId, startUtc: dayStart, endUtc: dayEnd }).catch(() => undefined),
    latestWeight(userId).catch(() => undefined),
    findStreak(userId).catch(() => undefined),
  ]);

  return {
    displayName: profile?.displayName ?? user?.email?.split('@')[0] ?? 'นาย',
    streakCurrent: streak?.current ?? 0,
    kcalEaten: food.kcal,
    kcalGoal: profile?.kcalTarget ?? 0,
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
  };
}
