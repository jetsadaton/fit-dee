// plan-generator — event-driven function triggered after onboarding.
// Listens for 'coachly/onboarding.completed' and generates the user's
// first workout plan. The onboarding Server Action sends this event.

import { inngest } from '../client';
import { findByUserId as findProfile } from '@/lib/db/repositories/profiles';
import { generatePlan } from '@/lib/services/plan-generator';

export const planGenerator = inngest.createFunction(
  {
    id: 'plan-generator',
    name: 'Plan Generator (post-onboarding)',
    triggers: [{ event: 'coachly/onboarding.completed' }],
    retries: 3,
  },
  async ({ event, step }) => {
    const { userId } = event.data as { userId: string };

    // Single step: fetch profile + generate plan in one atomic unit.
    // Avoids Inngest's Date→string JSON serialization across step boundaries.
    await step.run('fetch-and-generate', async () => {
      const profile = await findProfile(userId);
      if (!profile) throw new Error(`plan-generator: no profile for userId ${userId}`);
      await generatePlan({ userId, profile });
    });

    return { userId };
  },
);
