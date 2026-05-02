'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TodayScreen, type TodayScreenProps } from '@/components/screens/today-screen';
import { queryKeys } from '@/lib/queries/keys';
import type { TabId } from '@/components/coach/primitives';
import type { InsightRange } from '@/lib/types/dto/insights';
import { logMoodAction, logWaterAction, fetchInsightsAction } from './actions';

// ICT date string (YYYY-MM-DD) used as part of the insights cache key.
// Insights refresh automatically when the date changes (page reload after midnight).
function todayIct(): string {
  return new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
}

type TodayData = NonNullable<TodayScreenProps['data']>;

export function TodayClient({ data }: { data: TodayData }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [range, setRange] = useState<InsightRange>('today');

  const onTab = (t: TabId) => {
    if (t === 'today') return;
    if (t === 'chat') router.push('/chat');
    else if (t === 'plan') router.push('/plan');
    else router.push('/me');
  };

  const dateKey = todayIct();
  const insights = useQuery({
    queryKey: queryKeys.insights.byRange(range, dateKey),
    queryFn: () => fetchInsightsAction(range),
    staleTime: Infinity,
    retry: false,
  });

  // Server Action returns a tagged result; we ignore the success payload
  // and rely on revalidatePath('/today') on the server side. Client-side
  // dailyDashboard key invalidation is a belt-and-suspenders for any
  // useQuery that opts into manual reads later.
  const water = useMutation({
    mutationFn: async (ml: number) => {
      const r = await logWaterAction({ ml });
      if (!r.ok) throw new Error(r.message ?? r.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.dailyDashboard.all });
      qc.invalidateQueries({ queryKey: queryKeys.insights.all });
    },
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
      range={range}
      onRangeChange={setRange}
      insights={insights.data ?? undefined}
      insightsLoading={insights.isFetching}
      onAddWater={(ml) => water.mutate(ml)}
      onSelectMood={(energy) => mood.mutate(energy)}
      onStartWorkout={() => router.push('/workout/run')}
    />
  );
}
