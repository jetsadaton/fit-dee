import { tool } from 'ai';
import { z } from 'zod';
import { createPending } from '@/lib/db/repositories/food-logs';

export type FoodLogConfirmPayload = {
  type: 'food_log_confirm';
  pendingId: string;
  nameTh: string;
  mealType: string;
  kcalLow: number;
  kcalHigh: number;
  kcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  portionG: number | null;
};

// Factory closes over userId so the LLM never sees or controls it.
export function createLogFoodTool(userId: string) {
  return tool({
    description:
      'บันทึกมื้ออาหารเป็น pending row — ยังไม่ commit จนกว่าผู้ใช้จะกด "ยืนยัน" บน confirm card ที่ UI แสดง',
    inputSchema: z.object({
      foodId: z.string().uuid().optional().describe('UUID จาก search_food ถ้าเจอ — ละได้ถ้าเป็น LLM estimate'),
      nameTh: z.string().describe('ชื่ออาหารภาษาไทย'),
      mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
      portionG: z.number().int().positive().optional().describe('น้ำหนักกรัม ละได้ถ้าไม่ทราบ'),
      kcalLow: z.number().int().positive().describe('แคลอรีต่ำสุดของช่วงประมาณ'),
      kcalHigh: z.number().int().positive().describe('แคลอรีสูงสุดของช่วงประมาณ'),
      proteinG: z.number().min(0).describe('โปรตีนรวม (g)'),
      carbG: z.number().min(0).describe('คาร์โบไฮเดรตรวม (g)'),
      fatG: z.number().min(0).describe('ไขมันรวม (g)'),
    }),
    execute: async ({ foodId, nameTh, mealType, portionG, kcalLow, kcalHigh, proteinG, carbG, fatG }) => {
      const kcal = Math.round((kcalLow + kcalHigh) / 2);
      const row = await createPending({
        userId,
        foodId: foodId ?? null,
        mealType,
        portionG: portionG ?? null,
        kcal,
        kcalLow,
        kcalHigh,
        proteinG: String(proteinG),
        carbG: String(carbG),
        fatG: String(fatG),
        source: 'chat_text',
        photoId: null,
        loggedAt: new Date(),
      });
      const payload: FoodLogConfirmPayload = {
        type: 'food_log_confirm',
        pendingId: row.id,
        nameTh,
        mealType,
        kcalLow,
        kcalHigh,
        kcal,
        proteinG,
        carbG,
        fatG,
        portionG: portionG ?? null,
      };
      return payload;
    },
  });
}
