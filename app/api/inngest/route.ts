import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { photoExpiry } from '@/inngest/functions/photo-expiry';
import { weeklyInsights } from '@/inngest/functions/weekly-insights';
import { planGenerator } from '@/inngest/functions/plan-generator';
import { nightlyStreak } from '@/inngest/functions/nightly-streak';
import { recalibration } from '@/inngest/functions/recalibration';
import { nightlyMemory } from '@/inngest/functions/nightly-memory';

// Inngest webhook endpoint — receives events from Inngest cloud (or local dev server).
// Run `npx inngest-cli@latest dev` to test locally.
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [photoExpiry, weeklyInsights, planGenerator, nightlyStreak, recalibration, nightlyMemory],
});
