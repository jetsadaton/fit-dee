// Zod schemas for log-write Server Actions.
// Server Actions Zod-validate before touching repos (rules/backend.md).

import { z } from 'zod';

export const logWaterInputSchema = z.object({
  // Design exposes 250 / 500 / 750 chips but lets users type custom too.
  // Hard-cap 5L/single-shot to stop accidental order-of-magnitude entries.
  ml: z.coerce.number().int().min(50).max(5000),
  /** Optional client-provided timestamp; falls back to server now() in service. */
  loggedAt: z.coerce.date().optional(),
});
export type LogWaterInput = z.infer<typeof logWaterInputSchema>;

export const logMoodInputSchema = z.object({
  energy: z.coerce.number().int().min(1).max(5), // 😩 → 🔥
  note: z.string().trim().max(500).optional(),
  loggedAt: z.coerce.date().optional(),
});
export type LogMoodInput = z.infer<typeof logMoodInputSchema>;

export const logWeightInputSchema = z.object({
  weightKg: z.coerce.number().min(20).max(400),
  bodyFatPct: z.coerce.number().min(3).max(60).optional(),
  source: z.enum(['manual', 'scale_sync']).default('manual'),
  note: z.string().trim().max(500).optional(),
  /** Required: morning weigh-in timestamp from the user (not insert time). */
  loggedAt: z.coerce.date(),
});
export type LogWeightInput = z.infer<typeof logWeightInputSchema>;
