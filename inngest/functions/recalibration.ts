// recalibration — every 14 days, re-estimate TDEE from actual weight trend.
// Rules: .claude/topics/tdee-and-macros.md §7
//
// Algorithm:
//   1. Fetch weight logs over last 14 days (need ≥3 data points)
//   2. Compute weekly slope via linear regression
//   3. goal=lose: if trend≥0 → −5%; if trend<−1kg/wk → +5%
//      goal=gain: mirror
//      goal=fit: no adjustment
//   4. Apply kcal floor; recompute macros; upsert profile
//   5. Post assistant message in chat thread notifying user

import { inngest } from '../client';
import { db } from '@/lib/db/client';
import { userProfiles, weightLogs } from '@/lib/db/schema';
import { eq, gte, and, lte } from 'drizzle-orm';
import { upsert as upsertProfile } from '@/lib/db/repositories/profiles';
import { getOrCreate as getOrCreateThread } from '@/lib/db/repositories/chat-threads';
import { create as createMessage } from '@/lib/db/repositories/messages';
import { computeMacros, type Goal } from '@/lib/services/tdee';

const KCAL_FLOOR: Record<string, number> = { m: 1500, f: 1200, o: 1200 };
const STEP = 0.05; // 5% adjustment per recalibration cycle
const STEP_KG = 50; // round to nearest 50 kcal

/** Linear regression slope (kg/day). Returns null if < 2 points. */
function weightSlopeKgPerDay(points: { t: number; kg: number }[]): number | null {
  const n = points.length;
  if (n < 2) return null;
  const meanT = points.reduce((s, p) => s + p.t, 0) / n;
  const meanKg = points.reduce((s, p) => s + p.kg, 0) / n;
  const num = points.reduce((s, p) => s + (p.t - meanT) * (p.kg - meanKg), 0);
  const den = points.reduce((s, p) => s + (p.t - meanT) ** 2, 0);
  return den === 0 ? null : num / den;
}

export const recalibration = inngest.createFunction(
  {
    id: 'recalibration',
    name: 'TDEE Recalibration (14-day)',
    triggers: [{ cron: '0 2 * * *' }], // daily at 02:00 UTC — check each user independently
    concurrency: { limit: 5 },
  },
  async ({ step }) => {
    const now = new Date();
    const cutoff14d = new Date(now.getTime() - 14 * 86400000);

    // Users where plan_recalibrated_at is null or > 14 days ago.
    const dueUsers = await step.run('find-due-users', () =>
      db
        .select({
          userId: userProfiles.userId,
          kcalTarget: userProfiles.kcalTarget,
          sex: userProfiles.sex,
          goal: userProfiles.goal,
          weightKg: userProfiles.weightKgInitial,
        })
        .from(userProfiles)
        .where(lte(userProfiles.planRecalibratedAt, cutoff14d)),
    );

    let adjusted = 0;

    for (const user of dueUsers) {
      await step.run(`recalibrate-${user.userId}`, async () => {
        if (!user.kcalTarget || !user.goal || !user.sex) return;

        const since14d = new Date(now.getTime() - 14 * 86400000);
        const logs = await db
          .select({ weightKg: weightLogs.weightKg, loggedAt: weightLogs.loggedAt })
          .from(weightLogs)
          .where(and(eq(weightLogs.userId, user.userId), gte(weightLogs.loggedAt, since14d)))
          .orderBy(weightLogs.loggedAt);

        if (logs.length < 3) return; // not enough data

        const origin = logs[0]!.loggedAt.getTime();
        const points = logs.map((l) => ({
          t: (l.loggedAt.getTime() - origin) / 86400000, // days
          kg: Number(l.weightKg),
        }));

        const slopePerDay = weightSlopeKgPerDay(points);
        if (slopePerDay === null) return;
        const slopePerWeek = slopePerDay * 7;

        const goal = user.goal as Goal;
        const currentKcal = user.kcalTarget;
        let newKcal = currentKcal;
        let reason = '';

        if (goal === 'lose') {
          if (slopePerWeek >= 0) {
            newKcal = currentKcal * (1 - STEP);
            reason = `น้ำหนักไม่ลด (trend ${slopePerWeek.toFixed(2)} kg/wk) → ลดแคลลง 5%`;
          } else if (slopePerWeek < -1.0) {
            newKcal = currentKcal * (1 + STEP);
            reason = `น้ำหนักลดเร็วเกิน (${slopePerWeek.toFixed(2)} kg/wk) → เพิ่มแคลขึ้น 5%`;
          } else {
            return; // trend within healthy range — no adjustment
          }
        } else if (goal === 'gain') {
          if (slopePerWeek <= 0) {
            newKcal = currentKcal * (1 + STEP);
            reason = `น้ำหนักไม่เพิ่ม (trend ${slopePerWeek.toFixed(2)} kg/wk) → เพิ่มแคลขึ้น 5%`;
          } else if (slopePerWeek > 0.5) {
            newKcal = currentKcal * (1 - STEP);
            reason = `น้ำหนักเพิ่มเร็วเกิน (${slopePerWeek.toFixed(2)} kg/wk) → ลดแคลลง 5%`;
          } else {
            return;
          }
        } else {
          return; // goal='fit' — no recalibration
        }

        // Round to nearest 50 kcal, enforce floor.
        const floor = KCAL_FLOOR[user.sex] ?? 1200;
        const rounded = Math.max(floor, Math.round(newKcal / STEP_KG) * STEP_KG);
        if (rounded === currentKcal) return;

        // Recompute macros.
        const latestWeight = Number(logs[logs.length - 1]!.weightKg);
        const macros = computeMacros({ kcalTarget: rounded, weightKg: latestWeight, goal });

        // Update profile.
        const existing = await db.select().from(userProfiles).where(eq(userProfiles.userId, user.userId)).limit(1);
        if (!existing[0]) return;

        await upsertProfile({
          ...existing[0],
          kcalTarget: rounded,
          proteinGTarget: macros.proteinG,
          carbGTarget: macros.carbG,
          fatGTarget: macros.fatG,
          planRecalibratedAt: now,
        });

        // Notify user in chat.
        const thread = await getOrCreateThread(user.userId);
        await createMessage({
          threadId: thread.id,
          userId: user.userId,
          role: 'assistant',
          content: `📊 ปรับเป้าหมายแคลอรี่ให้อัตโนมัติ\n\n${reason}\nเป้าใหม่: ${rounded.toLocaleString()} kcal/วัน (โปรตีน ${macros.proteinG}g · คาร์บ ${macros.carbG}g · ไขมัน ${macros.fatG}g)\n\nถ้าอยากปรับเพิ่ม/ลดก็บอกโค้ชได้เลยนะ 💪`,
        });

        adjusted++;
      });
    }

    return { checked: dueUsers.length, adjusted };
  },
);
