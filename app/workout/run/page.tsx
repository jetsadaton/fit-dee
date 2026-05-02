import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { findActive as findActivePlan } from '@/lib/db/repositories/workout-plans';
import {
  findActive as findActiveSession,
  create as createSession,
} from '@/lib/db/repositories/workout-sessions';
import { RunClient } from './run-client';
import type { WeekPlanDays, PlanExercise } from '@/lib/types/db/workouts';
import type { Ex } from '@/components/screens/workout-run-screen';

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

function todayDayKey() {
  return DAY_KEYS[new Date().getDay()] ?? 'mon';
}

function planExercisesToEx(exercises: PlanExercise[]): Ex[] {
  return exercises.map((e) => ({
    semanticId: e.semantic_id,
    name: e.name_th,
    sets: e.sets,
    reps: e.reps,
    weight: e.weight_kg_target ?? 0,
    rest: e.rest_sec ?? 90,
    formCues: [],
  }));
}

export default async function WorkoutRunPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/');

  const userId = session.user.id;
  const dayKey = todayDayKey();

  // Resolve today's exercise plan from the active workout plan
  let initialPlan: Ex[] | undefined;
  let sessionName = 'Workout';
  let planId: string | undefined;

  const workoutPlan = await findActivePlan(userId);
  if (workoutPlan) {
    const days = workoutPlan.days as WeekPlanDays;
    const todayPlan = days[dayKey];
    if (todayPlan && !todayPlan.rest_day && todayPlan.exercises?.length) {
      initialPlan = planExercisesToEx(todayPlan.exercises);
      sessionName = todayPlan.name ?? 'Workout';
      planId = workoutPlan.id;
    }
  }

  // Reuse an in-flight session or start a new one
  let workoutSession = await findActiveSession(userId);
  if (!workoutSession) {
    workoutSession = await createSession({
      userId,
      planId: planId ?? null,
      planDay: dayKey,
      name: sessionName,
      startedAt: new Date(),
    });
  }

  return (
    <RunClient
      sessionId={workoutSession.id}
      sessionName={workoutSession.name}
      initialPlan={initialPlan}
    />
  );
}
