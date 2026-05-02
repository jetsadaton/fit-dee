// Row + jsonb types for the workout aggregates.

import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import type { exerciseLogs, exercises, workoutPlans, workoutSessions } from '@/lib/db/schema';

export type Exercise = InferSelectModel<typeof exercises>;

export type WorkoutPlan = InferSelectModel<typeof workoutPlans>;
export type NewWorkoutPlan = InferInsertModel<typeof workoutPlans>;

export type WorkoutSession = InferSelectModel<typeof workoutSessions>;
export type NewWorkoutSession = InferInsertModel<typeof workoutSessions>;

export type ExerciseLog = InferSelectModel<typeof exerciseLogs>;
export type NewExerciseLog = InferInsertModel<typeof exerciseLogs>;

/** Day key used inside `workout_plans.days` jsonb (matches streak.ts). */
export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

/** Per-day plan shape stored in `workout_plans.days[<dayKey>]`. */
export type PlanDay = {
  name: string;
  focus?: string;
  mins?: number;
  rest_day?: boolean;
  exercises?: PlanExercise[];
};

export type PlanExercise = {
  /** FK to `exercises.id`, when curated. */
  exercise_id?: string;
  /** Stable LLM-friendly key (mirrors exercises.semantic_id). */
  semantic_id: string;
  /** Display snapshot — keeps history readable if catalog renames. */
  name_th: string;
  sets: number;
  reps: string; // '8-10' (range as text per schema)
  weight_kg_target?: number;
  rest_sec?: number;
  order: number;
};

export type WeekPlanDays = Partial<Record<DayKey, PlanDay>>;
