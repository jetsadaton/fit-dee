// Zod schema for onboarding form submission.
//
// Per rules/backend.md: Server Actions / Route Handlers MUST validate input
// against this schema before touching the service layer. The schema also
// doubles as the form spec for react-hook-form (`zodResolver`).
//
// Field constraints come from the design's onboarding 9-turn copy and from
// .claude/topics/safety-floors.md (TBD — kcal floor enforced in tdee service).

import { z } from 'zod';

export const onboardingInputSchema = z.object({
  displayName: z.string().trim().min(1).max(40),
  sex: z.enum(['m', 'f', 'o']),
  // Per topic doc: validated 13-100 in app, then numeric_range checked again here.
  age: z.coerce.number().int().min(13).max(100),
  heightCm: z.coerce.number().int().min(120).max(230),
  weightKgInitial: z.coerce.number().min(30).max(300),
  targetWeightKg: z.coerce.number().min(30).max(300),
  goal: z.enum(['lose', 'gain', 'fit']),
  daysPerWeek: z.coerce.number().int().min(2).max(6),
  activityLevel: z.enum(['sit', 'walk', 'move', 'active']),
  equipment: z.enum(['gym', 'home_eq', 'home']),
  injuries: z.array(z.string()).default([]),
  /** Optional. If supplied, switches BMR formula to Katch-McArdle. */
  bodyFatPct: z.coerce.number().min(3).max(60).optional(),
});

export type OnboardingInput = z.infer<typeof onboardingInputSchema>;
