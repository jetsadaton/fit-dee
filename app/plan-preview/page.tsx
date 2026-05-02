// Server Component — reads the user's freshly-saved profile and feeds the
// real targets into the screen. Falls through to /onboarding if a target
// hasn't been computed yet (kcalTarget null).

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { findByUserId as findProfile } from '@/lib/db/repositories/profiles';
import { PlanPreviewClient } from './plan-preview-client';

export default async function PlanPreviewPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/');

  const profile = await findProfile(session.user.id);
  if (!profile?.kcalTarget || !profile.tdeeKcal) {
    redirect('/onboarding');
  }

  return (
    <PlanPreviewClient
      kcalTarget={profile.kcalTarget}
      tdee={profile.tdeeKcal}
      macros={{
        proteinG: profile.proteinGTarget ?? 0,
        carbG: profile.carbGTarget ?? 0,
        fatG: profile.fatGTarget ?? 0,
      }}
      goal={profile.goal as 'lose' | 'gain' | 'fit'}
    />
  );
}
