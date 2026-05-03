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
  /** DB-resolved at hydration time so the card renders the right state on
   *  re-mount (user navigated away after confirming, came back). Live tool
   *  execution leaves this undefined → treated as 'pending'. */
  currentStatus?: 'pending' | 'confirmed' | 'cancelled';
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

export type UpdateProfileConfirmPayload = {
  type: 'update_profile_confirm';
  changes: {
    goal?: 'lose' | 'gain' | 'fit';
    activityLevel?: 'sit' | 'walk' | 'move' | 'active';
    targetWeightKg?: number;
    daysPerWeek?: number;
    equipment?: 'gym' | 'home_eq' | 'home';
  };
  /** Preview values for UI — server recomputes before writing. */
  preview: {
    kcalTarget: number;
    proteinG: number;
    carbG: number;
    fatG: number;
    tdeeKcal: number;
    flooredAt: number | null;
  };
};

export type WorkoutPlanCreatedPayload = {
  type: 'workout_plan_created';
  daysPerWeek: number;
  workoutDayNames: string[];
  weekStartsOn: string;
  equipment: 'gym' | 'home_eq' | 'home';
  goal: 'lose' | 'gain' | 'fit';
  replacedExisting: boolean;
};

export const GOAL_LABEL: Record<string, string> = {
  lose: 'ลดน้ำหนัก',
  gain: 'เพิ่มกล้าม',
  fit: 'รักษาฟิต',
};

export const ACTIVITY_LABEL: Record<string, string> = {
  sit: 'นั่งโต๊ะ ไม่ออกกำลัง',
  walk: 'เดินบ่อย / 1-3 วัน/สัปดาห์',
  move: 'ออก 3-5 วัน/สัปดาห์',
  active: 'ออก 6-7 วัน/สัปดาห์',
};

export const EQUIPMENT_LABEL: Record<string, string> = {
  gym: 'ยิม',
  home_eq: 'อุปกรณ์ที่บ้าน',
  home: 'bodyweight เท่านั้น',
};
