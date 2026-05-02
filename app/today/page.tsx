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
        kcalEaten: data.kcalEaten,
        kcalGoal: data.kcalGoal,
        kcalBurned: data.kcalBurned,
      }}
    />
  );
}
