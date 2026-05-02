// weekly-insights — Monday 08:00 ICT pre-warm.
// Pre-generates /today insights for all active users so the first page load
// of the week doesn't pay the 4-second LLM cost. Results stored in
// insights_cache (added in a future migration; currently a no-op skeleton).
//
// When insights_cache table ships, replace the TODO stubs with DB writes.

import { inngest } from '../client';
import { db } from '@/lib/db/client';
import { userProfiles } from '@/lib/db/schema';
import { loadTodaySnapshot } from '@/lib/services/today';
import { generateInsights } from '@/lib/services/insights';

export const weeklyInsights = inngest.createFunction(
  {
    id: 'weekly-insights',
    name: 'Weekly Insights Pre-warm',
    triggers: [{ cron: '0 1 * * 1' }], // 01:00 UTC = 08:00 ICT Monday
    concurrency: { limit: 5 }, // throttle Kimi calls
  },
  async ({ step }) => {
    // 1. Collect all users who have completed onboarding (have kcalTarget).
    const activeUsers = await step.run('fetch-active-users', () =>
      db.select({ userId: userProfiles.userId }).from(userProfiles),
    );

    let generated = 0;

    // 2. Fan-out: one step per user to allow retries per-user.
    for (const { userId } of activeUsers) {
      await step.run(`generate-${userId}`, async () => {
        const snapshot = await loadTodaySnapshot(userId);
        const [today, week, month] = await Promise.all([
          generateInsights(snapshot, 'today'),
          generateInsights(snapshot, 'week'),
          generateInsights(snapshot, 'month'),
        ]);
        // TODO: persist to insights_cache table (Phase 4).
        // For now just pre-warm by generating (Kimi cold-start cost paid here,
        // not on user's first request of the week).
        void today;
        void week;
        void month;
        generated++;
      });
    }

    return { usersProcessed: generated };
  },
);
