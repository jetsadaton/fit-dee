'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TodayScreen, type TodayScreenProps } from '@/components/screens/today-screen';
import { queryKeys } from '@/lib/queries/keys';
import type { TabId } from '@/components/coach/primitives';
import { logMoodAction, logWaterAction } from './actions';

type TodayData = NonNullable<TodayScreenProps['data']>;

export function TodayClient({ data }: { data: TodayData }) {
  const router = useRouter();
  const qc = useQueryClient();

  const onTab = (t: TabId) => {
    if (t === 'today') return;
    if (t === 'chat') router.push('/chat');
    else if (t === 'plan') router.push('/plan');
    else router.push('/me');
  };

  // Server Action returns a tagged result; we ignore the success payload
  // and rely on revalidatePath('/today') on the server side. Client-side
  // dailyDashboard key invalidation is a belt-and-suspenders for any
  // useQuery that opts into manual reads later.
  const water = useMutation({
    mutationFn: async (ml: number) => {
      const r = await logWaterAction({ ml });
      if (!r.ok) throw new Error(r.message ?? r.error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.dailyDashboard.all }),
  });

  const mood = useMutation({
    mutationFn: async (energy: number) => {
      const r = await logMoodAction({ energy });
      if (!r.ok) throw new Error(r.message ?? r.error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.dailyDashboard.all }),
  });

  return (
    <TodayScreen
      data={data}
      onTab={onTab}
      activeTab="today"
      onAddWater={(ml) => water.mutate(ml)}
      onSelectMood={(energy) => mood.mutate(energy)}
    />
  );
}
