import { tool } from 'ai';
import { z } from 'zod';
import { findByUserId } from '@/lib/db/repositories/profiles';
import { latest as latestWeight } from '@/lib/db/repositories/weight-logs';
import { computeTdee, InfeasiblePlanError } from '@/lib/services/tdee';
import type { UpdateProfileConfirmPayload } from './shared-types';

export type { UpdateProfileConfirmPayload };

export function createUpdateProfileTool(userId: string) {
  return tool({
    description:
      'เสนอเปลี่ยนเป้าหมาย/activity level/น้ำหนักเป้า/วันออกกำลัง/อุปกรณ์ — return confirm card ก่อน user กดยืนยัน',
    inputSchema: z.object({
      goal: z.enum(['lose', 'gain', 'fit']).optional().describe('เป้าหมายใหม่ (ละได้ถ้าไม่เปลี่ยน)'),
      activityLevel: z
        .enum(['sit', 'walk', 'move', 'active'])
        .optional()
        .describe('ระดับกิจกรรมใหม่ (ละได้ถ้าไม่เปลี่ยน)'),
      targetWeightKg: z
        .number()
        .min(30)
        .max(300)
        .optional()
        .describe('น้ำหนักเป้าหมายใหม่ หน่วย kg (ละได้ถ้าไม่เปลี่ยน)'),
      daysPerWeek: z
        .number()
        .int()
        .min(1)
        .max(7)
        .optional()
        .describe('วันออกกำลังกายต่อสัปดาห์ใหม่ (ละได้ถ้าไม่เปลี่ยน)'),
      equipment: z.enum(['gym', 'home_eq', 'home']).optional().describe('อุปกรณ์ที่มีใหม่ (ละได้ถ้าไม่เปลี่ยน)'),
    }),
    execute: async ({ goal, activityLevel, targetWeightKg, daysPerWeek, equipment }) => {
      const hasChanges =
        goal !== undefined ||
        activityLevel !== undefined ||
        targetWeightKg !== undefined ||
        daysPerWeek !== undefined ||
        equipment !== undefined;

      if (!hasChanges) return 'ระบุอย่างน้อย 1 สิ่งที่ต้องการเปลี่ยน';

      const profile = await findByUserId(userId);
      if (!profile) return 'ไม่พบข้อมูลโปรไฟล์ กรุณากรอก onboarding ก่อน';

      const latestLog = await latestWeight(userId);
      const currentWeightKg = latestLog
        ? parseFloat(String(latestLog.weightKg))
        : parseFloat(String(profile.weightKgInitial));
      const currentBodyFatPct = latestLog?.bodyFatPct != null ? parseFloat(String(latestLog.bodyFatPct)) : undefined;

      const mergedGoal = goal ?? (profile.goal as 'lose' | 'gain' | 'fit');
      const mergedActivity = activityLevel ?? (profile.activityLevel as 'sit' | 'walk' | 'move' | 'active');

      try {
        const result = computeTdee({
          sex: profile.sex as 'm' | 'f' | 'o',
          weightKg: currentWeightKg,
          heightCm: profile.heightCm,
          age: profile.age,
          activityLevel: mergedActivity,
          goal: mergedGoal,
          bodyFatPct: currentBodyFatPct,
        });

        const payload: UpdateProfileConfirmPayload = {
          type: 'update_profile_confirm',
          changes: {
            ...(goal !== undefined && { goal }),
            ...(activityLevel !== undefined && { activityLevel }),
            ...(targetWeightKg !== undefined && { targetWeightKg }),
            ...(daysPerWeek !== undefined && { daysPerWeek }),
            ...(equipment !== undefined && { equipment }),
          },
          preview: {
            kcalTarget: result.kcalTarget,
            proteinG: result.macros.proteinG,
            carbG: result.macros.carbG,
            fatG: result.macros.fatG,
            tdeeKcal: result.tdee,
            flooredAt: result.flooredAt,
          },
        };
        return payload;
      } catch (err) {
        if (err instanceof InfeasiblePlanError) {
          return 'เป้าหมายนี้ทำให้คาร์โบไฮเดรตต่ำกว่า 50g/วัน ซึ่งไม่ปลอดภัย ลองปรับเป้าหรือเพิ่ม activity level ดูนะ';
        }
        throw err;
      }
    },
  });
}
