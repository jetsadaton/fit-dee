import { tool } from 'ai';
import { z } from 'zod';
import { create } from '@/lib/db/repositories/mood-logs';

export type MoodLogDonePayload = {
  type: 'mood_log_done';
  energy: number;
  note: string | null;
  loggedAt: string;
};

const MOOD_LABEL: Record<number, string> = {
  1: 'เหนื่อยมาก 😩',
  2: 'ล้า 😔',
  3: 'ปกติ 😐',
  4: 'โอเค 🙂',
  5: 'พลังเต็ม 🔥',
};

export function createSetMoodTool(userId: string) {
  return tool({
    description: 'บันทึกระดับพลังงาน/อารมณ์วันนี้ (1=เหนื่อยมาก … 5=พลังเต็ม) — commit เลยไม่ต้องรอ confirm',
    inputSchema: z.object({
      energy: z.number().int().min(1).max(5).describe('ระดับพลังงาน 1–5 โดย 1=เหนื่อยมาก, 3=ปกติ, 5=พลังเต็ม'),
      note: z.string().max(500).optional().describe('หมายเหตุเพิ่มเติม เช่น สาเหตุที่เหนื่อย'),
    }),
    execute: async ({ energy, note }) => {
      const loggedAt = new Date();
      await create({ userId, energy, note: note ?? null, loggedAt });
      const payload: MoodLogDonePayload = {
        type: 'mood_log_done',
        energy,
        note: note ?? null,
        loggedAt: loggedAt.toISOString(),
      };
      return payload;
    },
  });
}

export { MOOD_LABEL };
