import { tool } from 'ai';
import { z } from 'zod';
import { create } from '@/lib/db/repositories/weight-logs';
import type { WeighInDonePayload } from './shared-types';

export type { WeighInDonePayload };

export function createWeighInTool(userId: string) {
  return tool({
    description: 'บันทึกน้ำหนักตัว (kg) และ % ไขมันถ้ามี — commit เลยไม่ต้องรอ confirm',
    inputSchema: z.object({
      weightKg: z.number().min(20).max(400).describe('น้ำหนักตัว หน่วย kg เช่น 68.5'),
      bodyFatPct: z
        .number()
        .min(3)
        .max(60)
        .optional()
        .describe('% ไขมันถ้าชั่งด้วยเครื่อง Inbody / smart scale — ละได้ถ้าไม่มี'),
    }),
    execute: async ({ weightKg, bodyFatPct }) => {
      const loggedAt = new Date();
      await create({
        userId,
        weightKg: String(weightKg),
        bodyFatPct: bodyFatPct != null ? String(bodyFatPct) : null,
        source: 'manual',
        note: null,
        loggedAt,
      });
      const payload: WeighInDonePayload = {
        type: 'weigh_in_done',
        weightKg,
        bodyFatPct: bodyFatPct ?? null,
        loggedAt: loggedAt.toISOString(),
      };
      return payload;
    },
  });
}
