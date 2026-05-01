'use client';

import { useRouter } from 'next/navigation';
import { WorkoutRun } from '@/components/screens/workout-run-screen';

export default function WorkoutRunPage() {
  const router = useRouter();
  return <WorkoutRun onExit={() => router.push('/today')} />;
}
