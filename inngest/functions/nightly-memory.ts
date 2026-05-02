// nightly-memory — updates the summary_7d memory block for each active user.
// The block is injected into every system prompt so the AI has context about
// what the user did this week without needing a full DB query per request.

import { inngest } from '../client';
import { db } from '@/lib/db/client';
import { userProfiles } from '@/lib/db/schema';
import { upsert as upsertMemory } from '@/lib/db/repositories/memory-blocks';
import { findByUserId as findMemory } from '@/lib/db/repositories/memory-blocks';
import { buildProfileBlock } from '@/lib/ai/memory';
import { findByUserId as findProfile } from '@/lib/db/repositories/profiles';
import { loadTodaySnapshot } from '@/lib/services/today';

export const nightlyMemory = inngest.createFunction(
  {
    id: 'nightly-memory',
    name: 'Nightly Memory Update (summary_7d)',
    triggers: [{ cron: '30 17 * * *' }], // 17:30 UTC = 00:30 ICT (after streak job)
    concurrency: { limit: 10 },
  },
  async ({ step }) => {
    const activeUsers = await step.run('fetch-users', () =>
      db.select({ userId: userProfiles.userId }).from(userProfiles),
    );

    let updated = 0;

    for (const { userId } of activeUsers) {
      await step.run(`memory-${userId}`, async () => {
        const [snapshot, profile, existing] = await Promise.all([
          loadTodaySnapshot(userId),
          findProfile(userId),
          findMemory(userId),
        ]);
        if (!profile) return;

        const summary = buildSummary7d(snapshot);
        await upsertMemory({
          userId,
          profileBlock: buildProfileBlock(profile),
          summary7d: summary,
          notes: existing?.notes ?? '',
        });
        updated++;
      });
    }

    return { updated };
  },
);

// ─── summary builder ─────────────────────────────────────────────────

function buildSummary7d(s: Awaited<ReturnType<typeof loadTodaySnapshot>>): string {
  const lines: string[] = ['สรุป 7 วันที่ผ่านมา:'];

  // Kcal
  if (s.week7AvgKcal > 0) {
    const pct = s.kcalGoal > 0 ? Math.round((s.week7AvgKcal / s.kcalGoal) * 100) : null;
    lines.push(`- แคลอรี่เฉลี่ย ${s.week7AvgKcal} kcal/วัน${pct != null ? ` (${pct}% ของเป้า)` : ''}`);
  }

  // Protein
  if (s.week7AvgProteinG > 0) {
    lines.push(`- โปรตีนเฉลี่ย ${s.week7AvgProteinG}g/วัน (เป้า ${s.proteinGoal}g)`);
  }

  // Water
  if (s.week7AvgWaterGlasses > 0) {
    lines.push(`- น้ำดื่มเฉลี่ย ${s.week7AvgWaterGlasses} แก้ว/วัน`);
  }

  // Workouts
  lines.push(`- ออกกำลังกาย ${s.week7WorkoutCount}/${s.daysPerWeek} วัน`);

  // Weight
  if (s.week7WeightDeltaKg != null) {
    const sign = s.week7WeightDeltaKg > 0 ? '+' : '';
    lines.push(`- น้ำหนักเปลี่ยน ${sign}${s.week7WeightDeltaKg} kg ใน 7 วัน`);
  }

  // Streak
  if (s.streakCurrent > 0) {
    lines.push(`- Streak ปัจจุบัน ${s.streakCurrent} วัน`);
  }

  return lines.join('\n');
}
