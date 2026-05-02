import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { findActive } from '@/lib/db/repositories/workout-plans';
import { findBySemanticIds } from '@/lib/db/repositories/exercises';
import PlanClient from './plan-client';
import type { WeekPlanDays } from '@/lib/types/db/workouts';
import type { WeekPlan, ExerciseRow } from '@/components/screens/plan-screen';
import type { Exercise } from '@/lib/types/db/workouts';

const DAY_KEY_TO_THAI: Record<string, string> = {
  mon: 'จ',
  tue: 'อ',
  wed: 'พ',
  thu: 'พฤ',
  fri: 'ศ',
  sat: 'ส',
  sun: 'อา',
};

function buildScreenPlan(days: WeekPlanDays, exerciseMap: Map<string, Exercise>): WeekPlan {
  const result: WeekPlan = {};
  for (const [key, day] of Object.entries(days)) {
    const thaiKey = DAY_KEY_TO_THAI[key];
    if (!thaiKey || !day) continue;
    const exercises: ExerciseRow[] | undefined = day.exercises?.map((ex) => {
      const catalog = exerciseMap.get(ex.semantic_id);
      return {
        name: ex.name_th,
        sets: ex.sets,
        reps: ex.reps,
        lastWeight: ex.weight_kg_target ?? 0,
        tip: catalog?.tipTh ?? null,
        formCues: catalog?.formCuesTh ?? [],
      };
    });
    result[thaiKey] = {
      name: day.name,
      focus: day.focus,
      mins: day.mins,
      rest: day.rest_day,
      exercises,
    };
  }
  return result;
}

export default async function PlanPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/');

  const plan = await findActive(session.user.id);
  if (!plan) {
    return <PlanClient initialPlan={null} />;
  }

  const days = plan.days as WeekPlanDays;

  const semanticIds = Object.values(days)
    .flatMap((day) => day?.exercises?.map((ex) => ex.semantic_id) ?? [])
    .filter(Boolean);

  const catalogExercises = await findBySemanticIds(semanticIds);
  const exerciseMap = new Map(catalogExercises.map((e) => [e.semanticId, e]));

  const screenPlan = buildScreenPlan(days, exerciseMap);
  return <PlanClient initialPlan={screenPlan} />;
}
