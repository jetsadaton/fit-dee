// nightly-streak — updates streak for all active users at midnight ICT.
// Reads daily activity (food logs + workout sessions) and applies the
// updateStreak pure function from lib/services/streak.ts.

import { inngest } from '../client';
import { db } from '@/lib/db/client';
import { userProfiles, foodLogs, workoutSessions } from '@/lib/db/schema';
import { eq, and, gte, lt } from 'drizzle-orm';
import { findByUserId as findStreak, upsert as upsertStreak } from '@/lib/db/repositories/streaks';
import { findActive as findActivePlan } from '@/lib/db/repositories/workout-plans';
import { updateStreak, toISODate, type DailyActivity, type WorkoutWeekPlan } from '@/lib/services/streak';
import { startOfDayICT } from '@/lib/services/today';

const ICT_OFFSET_MS = 7 * 3600 * 1000;

function daysAgoICT(n: number, now = new Date()): Date {
  return startOfDayICT(new Date(now.getTime() - n * 86400000));
}

export const nightlyStreak = inngest.createFunction(
  {
    id: 'nightly-streak',
    name: 'Nightly Streak Update',
    triggers: [{ cron: '0 17 * * *' }], // 17:00 UTC = 00:00 ICT
    concurrency: { limit: 10 },
  },
  async ({ step }) => {
    const today = new Date();
    const todayIct = new Date(today.getTime() + ICT_OFFSET_MS);
    todayIct.setUTCHours(0, 0, 0, 0);

    const activeUsers = await step.run('fetch-users', () =>
      db.select({ userId: userProfiles.userId }).from(userProfiles),
    );

    let updated = 0;

    for (const { userId } of activeUsers) {
      await step.run(`streak-${userId}`, async () => {
        // Build 7-day activity window (this calendar week up to today).
        const weekStart = daysAgoICT(6, today);
        const weekEnd = new Date(startOfDayICT(today).getTime() + 86400000);

        // Food: days with at least 1 confirmed meal this week.
        const foodDays = await db
          .selectDistinct({
            dateIct: foodLogs.loggedAt,
          })
          .from(foodLogs)
          .where(and(eq(foodLogs.userId, userId), gte(foodLogs.loggedAt, weekStart), lt(foodLogs.loggedAt, weekEnd)));

        const foodDateSet = new Set(
          foodDays.map((r) => {
            const d = new Date(new Date(r.dateIct).getTime() + ICT_OFFSET_MS);
            return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
          }),
        );

        // Workouts: days with at least 1 completed session.
        const workoutDays = await db
          .selectDistinct({ date: workoutSessions.startedAt })
          .from(workoutSessions)
          .where(
            and(
              eq(workoutSessions.userId, userId),
              gte(workoutSessions.startedAt, weekStart),
              lt(workoutSessions.startedAt, weekEnd),
            ),
          );

        const workoutDateSet = new Set(
          workoutDays.map((r) => {
            const d = new Date(new Date(r.date).getTime() + ICT_OFFSET_MS);
            return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
          }),
        );

        // Build weekActivity array (7 slots Mon→today).
        const weekActivity: DailyActivity[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today.getTime() - i * 86400000);
          const ictD = new Date(d.getTime() + ICT_OFFSET_MS);
          const iso = toISODate(ictD);
          weekActivity.push({
            date: iso,
            ateAtLeastOneMeal: foodDateSet.has(iso),
            finishedAtLeastOneWorkout: workoutDateSet.has(iso),
          });
        }

        // Load previous streak + active plan.
        const [prev, plan] = await Promise.all([findStreak(userId), findActivePlan(userId)]);

        const prevState = {
          current: prev?.current ?? 0,
          longest: prev?.longest ?? 0,
          lastActiveDate: prev?.lastActiveDate ?? null,
        };

        let weekPlan: WorkoutWeekPlan | null = null;
        if (plan?.days) {
          weekPlan = { days: plan.days as WorkoutWeekPlan['days'] };
        }

        const result = updateStreak({
          today: todayIct,
          weekActivity,
          plan: weekPlan,
          prev: prevState,
        });

        await upsertStreak(userId, result);
        updated++;
      });
    }

    return { updated, date: toISODate(todayIct) };
  },
);
