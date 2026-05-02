'use client';

import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { WelcomeScreen } from '@/components/screens/welcome-screen';

export default function HomePage() {
  const router = useRouter();
  return (
    <WelcomeScreen
      onStart={() => router.push('/onboarding')}
      onLineSignIn={() => signIn('line', { callbackUrl: '/today' })}
      onGoogleSignIn={() => signIn('google', { callbackUrl: '/today' })}
    />
  );
}
