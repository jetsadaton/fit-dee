// Server Component — gates onboarding with the auth + profile state, then
// hands rendering to the client wrapper that holds the form state machine.

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { findByUserId as findProfile } from '@/lib/db/repositories/profiles';
import { OnboardingForm } from './onboarding-form';

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    // Middleware should have caught this; belt-and-suspenders.
    redirect('/');
  }

  // If profile already filled (kcalTarget set), skip onboarding entirely.
  const existing = await findProfile(session.user.id);
  if (existing?.kcalTarget) {
    redirect('/today');
  }

  return <OnboardingForm />;
}
