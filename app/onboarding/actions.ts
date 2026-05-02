'use server';

// Server Action: persist the 9-turn onboarding form.
//
// Lifecycle (rules/backend.md "Layering"):
//   client →  this Server Action  →  service (lib/services/onboarding.ts)
//                                  →  repo    (lib/db/repositories/profiles.ts)
//
// Auth boundary: userId comes from `auth()`, NEVER from request body — even
// if the client sent one we'd ignore it (rules/backend.md "Auth / identity").

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { completeOnboarding } from '@/lib/services/onboarding';
import { onboardingInputSchema } from '@/lib/types/dto/onboarding';

export type OnboardingActionResult =
  | { ok: true; kcalTarget: number; tdee: number }
  | { ok: false; error: 'unauthorized' | 'validation' | 'infeasible-plan' | 'unknown'; message?: string };

export async function completeOnboardingAction(rawInput: unknown): Promise<OnboardingActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: 'unauthorized' };
  }

  const parsed = onboardingInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'validation',
      message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
    };
  }

  try {
    const result = await completeOnboarding({ userId: session.user.id, input: parsed.data });
    // Today / plan / plan-preview all read user_profiles — bust their RSC caches.
    revalidatePath('/today');
    revalidatePath('/plan');
    revalidatePath('/plan-preview');
    return { ok: true, kcalTarget: result.kcalTarget, tdee: result.tdee };
  } catch (err) {
    if (err instanceof Error && err.name === 'InfeasiblePlanError') {
      return { ok: false, error: 'infeasible-plan', message: 'เป้าหมายแคลฯ ต่ำเกินไป ลองปรับเป้าหมายดูนะ' };
    }
    return {
      ok: false,
      error: 'unknown',
      message: err instanceof Error ? err.message : 'unknown error',
    };
  }
}
