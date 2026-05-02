// Client-safe exports — no server/DB imports.
// Import types and constants from here in 'use client' components.

export type FoodLogConfirmPayload = {
  type: 'food_log_confirm';
  pendingId: string;
  nameTh: string;
  mealType: string;
  portionG: number | null;
  kcalLow: number;
  kcalHigh: number;
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
};

export type WaterLogDonePayload = {
  type: 'water_log_done';
  ml: number;
  loggedAt: string;
};

export type WeighInDonePayload = {
  type: 'weigh_in_done';
  weightKg: number;
  bodyFatPct: number | null;
  loggedAt: string;
};

export type MoodLogDonePayload = {
  type: 'mood_log_done';
  energy: number;
  note: string | null;
  loggedAt: string;
};

export type ExerciseLogDonePayload = {
  type: 'exercise_log_done';
  exerciseNameTh: string;
  sets: number;
  reps: number;
  weightKg: number;
  sessionId: string;
  loggedAt: string;
};

export const MOOD_LABEL: Record<number, string> = {
  1: 'เหนื่อยมาก 😩',
  2: 'ล้า 😔',
  3: 'ปกติ 😐',
  4: 'โอเค 🙂',
  5: 'พลังเต็ม 🔥',
};
