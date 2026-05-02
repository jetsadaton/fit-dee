import { tool } from 'ai';
import { z } from 'zod';
import * as workoutSessions from '@/lib/db/repositories/workout-sessions';
import * as exerciseLogs from '@/lib/db/repositories/exercise-logs';

import type { ExerciseLogDonePayload } from './shared-types';

export type { ExerciseLogDonePayload };

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

export function createLogExerciseTool(userId: string) {
  return tool({
    description: 'บันทึกท่าออกกำลังกายที่เพิ่งทำเสร็จ — commit เลยไม่ต้องรอ confirm',
    inputSchema: z.object({
      semantic_id: z.string().describe('semantic ID ของท่า เช่น barbell_squat, pushup'),
      name_th: z.string().describe('ชื่อท่าภาษาไทย เช่น สควอต, ดันพื้น'),
      sets: z.number().int().min(1).max(20).describe('จำนวนเซต'),
      reps: z.number().int().min(1).max(100).describe('จำนวนครั้งต่อเซต'),
      weight_kg: z.number().min(0).max(500).describe('น้ำหนักที่ใช้ (kg); bodyweight = 0'),
    }),
    execute: async ({ semantic_id, name_th, sets, reps, weight_kg }) => {
      const now = new Date();
      const planDay = DAY_KEYS[now.getDay()];

      // Reuse today's active session or open a new one.
      let session = await workoutSessions.findActive(userId);
      if (!session) {
        session = await workoutSessions.create({
          userId,
          planDay,
          name: 'บันทึกผ่านแชท',
          startedAt: now,
        });
      }

      const logEntries = Array.from({ length: sets }, (_, i) => ({
        sessionId: session.id,
        exerciseSemanticId: semantic_id,
        exerciseNameSnapshot: name_th,
        setIdx: i,
        weightKg: String(weight_kg),
        reps,
        completedAt: now,
      }));
      await exerciseLogs.createMany(logEntries);

      const payload: ExerciseLogDonePayload = {
        type: 'exercise_log_done',
        exerciseNameTh: name_th,
        sets,
        reps,
        weightKg: weight_kg,
        sessionId: session.id,
        loggedAt: now.toISOString(),
      };
      return payload;
    },
  });
}
