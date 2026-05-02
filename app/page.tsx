'use client';

import { signIn } from 'next-auth/react';
import { WelcomeScreen } from '@/components/screens/welcome-screen';

export default function HomePage() {
  return (
    <WelcomeScreen
      // "เริ่มเลย" defaults to LINE — Coachly is Thai-first; users without
      // a LINE account can still tap the explicit Google button below.
      onStart={() => signIn('line', { callbackUrl: '/onboarding' })}
      onLineSignIn={() => signIn('line', { callbackUrl: '/onboarding' })}
      onGoogleSignIn={() => signIn('google', { callbackUrl: '/onboarding' })}
    />
  );
}
