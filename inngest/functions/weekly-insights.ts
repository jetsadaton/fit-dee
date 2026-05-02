// weekly-insights — Monday 08:00 ICT pre-warm.
// Generates insights for all active users and writes to insights_cache so
// the first /today load of the week is served from cache (~0ms LLM cost).

import { inngest } from '../client';
import { db } from '@/lib/db/client';
import { userProfiles } from '@/lib/db/schema';
import { loadTodaySnapshot } from '@/lib/services/today';
import { generateInsights } from '@/lib/services/insights';
import { upsert as upsertInsights } from '@/lib/db/repositories/insights-cache';
import { sendPushToUser } from '@/lib/services/push';

export const weeklyInsights = inngest.createFunction(
  {
    id: 'weekly-insights',
    name: 'Weekly Insights Pre-warm',
    triggers: [{ cron: '0 1 * * 1' }], // 01:00 UTC = 08:00 ICT Monday
    concurrency: { limit: 5 },
  },
  async ({ step }) => {
    const dateIct = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);

    const activeUsers = await step.run('fetch-active-users', () =>
      db.select({ userId: userProfiles.userId }).from(userProfiles),
    );

    let generated = 0;

    for (const { userId } of activeUsers) {
      await step.run(`generate-${userId}`, async () => {
        const snapshot = await loadTodaySnapshot(userId);
        const [today, week, month] = await Promise.all([
          generateInsights(snapshot, 'today'),
          generateInsights(snapshot, 'week'),
          generateInsights(snapshot, 'month'),
        ]);
        await Promise.all([
          today.length > 0 ? upsertInsights({ userId, range: 'today', dateIct, insights: today }) : Promise.resolve(),
          week.length > 0 ? upsertInsights({ userId, range: 'week', dateIct, insights: week }) : Promise.resolve(),
          month.length > 0 ? upsertInsights({ userId, range: 'month', dateIct, insights: month }) : Promise.resolve(),
        ]);
        // Send Monday morning push notification.
        const topInsight = today[0] ?? week[0];
        if (topInsight) {
          await sendPushToUser(userId, {
            title: 'โค้ชดี — สรุปสัปดาห์นี้',
            body: topInsight.text.replace(/<[^>]+>/g, ''), // strip HTML tags
            url: '/today',
            icon: '/icon',
          }).catch(() => undefined);
        }
        generated++;
      });
    }

    return { usersProcessed: generated, dateIct };
  },
);
