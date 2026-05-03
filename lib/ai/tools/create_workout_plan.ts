// create_workout_plan — generates and persists a workout plan from the
// user's profile (with optional overrides). Plan generation is deterministic
// (no LLM in the loop), so we commit immediately and return a summary card
// instead of a confirm-then-commit dance.
//
// Why immediate commit (not pending → confirm):
//   - The "confirmation" is the conversation itself: user says "สร้างเลย"
//     before the LLM calls this tool. Adding a second click is friction.
//   - generatePlan() deactivates the prior active plan and inserts a new
//     versioned row, so re-runs are cheap if the user wants a different mix.
//
// The card the UI renders carries a [ดูแผน] CTA that navigates to /plan.

import { tool } from 'ai';
import { z } from 'zod';
import { findActive } from '@/lib/db/repositories/workout-plans';
import { findByUserId as findProfile } from '@/lib/db/repositories/profiles';
import { generatePlan } from '@/lib/services/plan-generator';
import type { PlanDay, WeekPlanDays } from '@/lib/types/db/workouts';
import type { WorkoutPlanCreatedPayload } from './shared-types';

export type { WorkoutPlanCreatedPayload };

export function createCreateWorkoutPlanTool(userId: string) {
  return tool({
    description:
      'สร้างแผนออกกำลังกายใหม่จากโปรไฟล์ user — เรียกเมื่อ user ยืนยันชัดว่าต้องการสร้าง/เปลี่ยนแผน (เช่น "สร้างเลย", "เอาตามนี้", "ปรับแผนเลย"). ทับแผนเก่าถ้ามี.',
    inputSchema: z.object({
      daysPerWeek: z
        .number()
        .int()
        .min(2)
        .max(6)
        .optional()
        .describe('จำนวนวันต่อสัปดาห์ที่อยากเล่น — ละได้ถ้าใช้ค่าจากโปรไฟล์'),
      equipment: z
        .enum(['gym', 'home_eq', 'home'])
        .optional()
        .describe('อุปกรณ์: gym=ยิม, home_eq=มีอุปกรณ์ที่บ้าน, home=bodyweight'),
      goal: z
        .enum(['lose', 'gain', 'fit'])
        .optional()
        .describe('เป้าหมาย: lose=ลดน้ำหนัก, gain=เพิ่มกล้าม, fit=รักษาฟิต'),
    }),
    execute: async ({ daysPerWeek, equipment, goal }) => {
      const profile = await findProfile(userId);
      if (!profile) {
        return {
          error: 'ยังไม่มีโปรไฟล์ — ทำ onboarding ให้เสร็จก่อนสร้างแผน',
        };
      }

      // Apply overrides from LLM on top of stored profile.
      const merged = {
        ...profile,
        daysPerWeek: daysPerWeek ?? profile.daysPerWeek,
        equipment: equipment ?? profile.equipment,
        goal: goal ?? profile.goal,
      };

      const existing = await findActive(userId);
      await generatePlan({ userId, profile: merged });

      // Re-fetch to get the freshly active plan for summary.
      const active = await findActive(userId);
      if (!active) {
        return { error: 'สร้างแผนไม่สำเร็จ ลองใหม่อีกที' };
      }

      const days = active.days as WeekPlanDays;
      const workoutDayNames = Object.values(days)
        .filter((d): d is PlanDay => !!d && !d.rest_day)
        .map((d) => d.name);

      const payload: WorkoutPlanCreatedPayload = {
        type: 'workout_plan_created',
        daysPerWeek: workoutDayNames.length,
        workoutDayNames,
        weekStartsOn: active.weekStartsOn,
        equipment: merged.equipment as 'gym' | 'home_eq' | 'home',
        goal: merged.goal as 'lose' | 'gain' | 'fit',
        replacedExisting: !!existing,
      };
      return payload;
    },
  });
}
