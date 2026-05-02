// Server Component — gathers Today dashboard data via the service layer
// (RSC reads RPM directly per rules/backend.md), passes a serializable
// snapshot to the client wrapper.

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { findByUserId as findProfile } from '@/lib/db/repositories/profiles';
import { loadTodaySnapshot } from '@/lib/services/today';
import { TodayClient } from './today-client';

export default async function TodayPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/');

  // First-time users need to onboard before /today is meaningful.
  const profile = await findProfile(session.user.id);
  if (!profile?.kcalTarget) redirect('/onboarding');

  const data = await loadTodaySnapshot(session.user.id);

  return (
    <TodayClient
      data={{
        displayName: data.displayName,
        streak: data.streakCurrent,
        streakLongest: data.streakLongest,
        kcalEaten: data.kcalEaten,
        kcalGoal: data.kcalGoal,
        kcalBurned: data.kcalBurned,
        waterMl: data.waterMl,
        moodEnergy: data.moodEnergy,
        proteinEaten: data.proteinEaten,
        carbEaten: data.carbEaten,
        fatEaten: data.fatEaten,
        proteinGoal: data.proteinGoal,
        carbGoal: data.carbGoal,
        fatGoal: data.fatGoal,
        latestWeightKg: data.latestWeightKg,
        todayWorkout: data.todayWorkout,
        targetWeightKg: data.targetWeightKg,
        weightKgInitial: data.weightKgInitial,
        daysPerWeek: data.daysPerWeek,
        week7Days: data.week7Days,
        week7AvgKcal: data.week7AvgKcal,
        week7AvgProteinG: data.week7AvgProteinG,
        week7AvgWaterGlasses: data.week7AvgWaterGlasses,
        week7WorkoutCount: data.week7WorkoutCount,
        week7WeightDeltaKg: data.week7WeightDeltaKg,
        month30WorkoutCount: data.month30WorkoutCount,
        month30WeightDeltaKg: data.month30WeightDeltaKg,
        month30DaysHitKcal: data.month30DaysHitKcal,
        month30ActivityDays: data.month30ActivityDays,
        weightSeriesKg: data.weightSeriesKg,
      }}
    />
  );
}
