'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TodayScreen, type TodayScreenProps } from '@/components/screens/today-screen';
import { queryKeys } from '@/lib/queries/keys';
import type { TabId } from '@/components/coach/primitives';
import type { InsightRange } from '@/lib/types/dto/insights';
import {
  logMoodAction,
  logWaterAction,
  fetchInsightsAction,
  deleteFoodLogAction,
  updateFoodLogAction,
  fetchDaySnapshotAction,
} from './actions';

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
  const [selectedDate, setSelectedDate] = useState(todayIct());

  const onTab = (t: TabId) => {
    if (t === 'today') return;
    if (t === 'chat') router.push('/chat');
    else if (t === 'plan') router.push('/plan');
    else router.push('/me');
  };

  const isToday = selectedDate === todayIct();

  const dayQuery = useQuery({
    queryKey: queryKeys.daySnapshot.byDate(selectedDate),
    queryFn: () => fetchDaySnapshotAction(selectedDate),
    enabled: !isToday,
    staleTime: 5 * 60 * 1000,
  });

  // Merge: when viewing today use RSC data; for past days overlay dayQuery onto RSC base.
  const displayData: TodayData = isToday
    ? data
    : {
        ...data,
        kcalEaten: dayQuery.data?.kcalEaten ?? 0,
        kcalBurned: dayQuery.data?.kcalBurned ?? 0,
        proteinEaten: dayQuery.data?.proteinEaten ?? 0,
        carbEaten: dayQuery.data?.carbEaten ?? 0,
        fatEaten: dayQuery.data?.fatEaten ?? 0,
        waterMl: dayQuery.data?.waterMl ?? 0,
        moodEnergy: dayQuery.data?.moodEnergy ?? null,
        latestWeightKg: dayQuery.data?.latestWeightKg ?? null,
        todayFoodLogs: dayQuery.data?.todayFoodLogs ?? [],
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

  const deleteFoodLog = useMutation({
    mutationFn: async (id: string) => {
      const r = await deleteFoodLogAction(id);
      if (!r.ok) throw new Error(r.message ?? r.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.dailyDashboard.all });
      qc.invalidateQueries({ queryKey: queryKeys.daySnapshot.byDate(selectedDate) });
      qc.invalidateQueries({ queryKey: queryKeys.insights.all });
    },
  });

  const updateFoodLog = useMutation({
    mutationFn: async ({
      id,
      ...changes
    }: { id: string; kcal: number; proteinG: number; carbG: number; fatG: number }) => {
      const r = await updateFoodLogAction(id, changes);
      if (!r.ok) throw new Error(r.message ?? r.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.dailyDashboard.all });
      qc.invalidateQueries({ queryKey: queryKeys.daySnapshot.byDate(selectedDate) });
      qc.invalidateQueries({ queryKey: queryKeys.insights.all });
    },
  });

  return (
    <TodayScreen
      data={displayData}
      onTab={onTab}
      activeTab="today"
      range={range}
      onRangeChange={setRange}
      insights={insights.data ?? undefined}
      insightsLoading={insights.isFetching}
      isToday={isToday}
      selectedDate={selectedDate}
      onDateChange={setSelectedDate}
      onAddWater={(ml) => water.mutate(ml)}
      onSelectMood={(energy) => mood.mutate(energy)}
      onStartWorkout={() => router.push('/workout/run')}
      onDeleteFoodLog={(id) => deleteFoodLog.mutate(id)}
      onUpdateFoodLog={(id, changes) => updateFoodLog.mutate({ id, ...changes })}
    />
  );
}
