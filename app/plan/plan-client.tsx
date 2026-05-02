'use client';

import { useRouter } from 'next/navigation';
import { PlanScreen, type WeekPlan } from '@/components/screens/plan-screen';
import type { TabId } from '@/components/coach/primitives';

export default function PlanClient({ initialPlan }: { initialPlan: WeekPlan | null }) {
  const router = useRouter();
  const onTab = (t: TabId) => {
    if (t === 'plan') return;
    if (t === 'chat') router.push('/chat');
    else if (t === 'today') router.push('/today');
    else router.push('/me');
  };
  return (
    <PlanScreen
      onTab={onTab}
      activeTab="plan"
      onStartWorkout={() => router.push('/workout/run')}
      initialPlan={initialPlan ?? undefined}
    />
  );
}
