'use client';

import { useRouter } from 'next/navigation';
import { WorkoutRun, DEFAULT_RUN_PLAN } from '@/components/screens/workout-run-screen';
import type { Ex } from '@/components/screens/workout-run-screen';
import { saveWorkoutAction } from './actions';

interface RunClientProps {
  sessionId: string;
  sessionName: string;
  initialPlan?: Ex[];
}

export function RunClient({ sessionId, sessionName, initialPlan }: RunClientProps) {
  const router = useRouter();
  const effectivePlan = initialPlan ?? DEFAULT_RUN_PLAN;

  const handleSave = async (
    logs: Record<string, { w: number; r: string }>,
    elapsed: number,
  ) => {
    const exercises = effectivePlan.map((e) => ({
      semanticId: e.semanticId,
      name: e.name,
      restSec: e.rest,
    }));
    await saveWorkoutAction(sessionId, exercises, logs, elapsed);
    router.push('/today');
  };

  return (
    <WorkoutRun
      initialPlan={effectivePlan}
      sessionName={sessionName}
      onSave={handleSave}
      onExit={() => router.push('/today')}
    />
  );
}
