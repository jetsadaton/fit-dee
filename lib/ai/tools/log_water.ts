import { tool } from 'ai';
import { z } from 'zod';
import { create } from '@/lib/db/repositories/water-logs';

export type WaterLogDonePayload = {
  type: 'water_log_done';
  ml: number;
  loggedAt: string;
};

export function createLogWaterTool(userId: string) {
  return tool({
    description: 'บันทึกการดื่มน้ำทันที — commit เลยไม่ต้องรอ confirm',
    inputSchema: z.object({
      ml: z.number().int().min(50).max(5000).describe('ปริมาณน้ำ (ml) เช่น แก้วมาตรฐาน = 250, ขวด 600ml = 600'),
    }),
    execute: async ({ ml }) => {
      const loggedAt = new Date();
      await create({ userId, ml, loggedAt });
      const payload: WaterLogDonePayload = {
        type: 'water_log_done',
        ml,
        loggedAt: loggedAt.toISOString(),
      };
      return payload;
    },
  });
}
