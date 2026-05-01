'use client';

import { useRouter } from 'next/navigation';
import { WelcomeScreen } from '@/components/screens/welcome-screen';

export default function HomePage() {
  const router = useRouter();
  return <WelcomeScreen onStart={() => router.push('/onboarding')} />;
}
