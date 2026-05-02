// Row types for the four health-log aggregates.
// Server-only — map to DTOs (lib/types/dto/) before crossing API boundaries.

import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import type { foodLogs, moodLogs, waterLogs, weightLogs } from '@/lib/db/schema';

export type FoodLog = InferSelectModel<typeof foodLogs>;
export type NewFoodLog = InferInsertModel<typeof foodLogs>;

export type WaterLog = InferSelectModel<typeof waterLogs>;
export type NewWaterLog = InferInsertModel<typeof waterLogs>;

export type MoodLog = InferSelectModel<typeof moodLogs>;
export type NewMoodLog = InferInsertModel<typeof moodLogs>;

export type WeightLog = InferSelectModel<typeof weightLogs>;
export type NewWeightLog = InferInsertModel<typeof weightLogs>;

/** Daily totals shape returned by sumByDate helpers. */
export type DailyFoodTotals = {
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  meals: number;
};
