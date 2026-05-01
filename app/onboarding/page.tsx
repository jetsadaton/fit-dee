'use client';

import { useRouter } from 'next/navigation';
import { OnboardingChat } from '@/components/screens/onboarding-screen';

export default function OnboardingPage() {
  const router = useRouter();
  return <OnboardingChat onDone={() => router.push('/plan-preview')} />;
}
