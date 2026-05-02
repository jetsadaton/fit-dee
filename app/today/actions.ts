'use server';

// Server Actions for the Today dashboard.
// Userid comes from auth() — never the request body (rules/backend.md).
// All actions revalidate '/today' so RSC re-renders with fresh data.

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { create as createWater } from '@/lib/db/repositories/water-logs';
import { create as createMood } from '@/lib/db/repositories/mood-logs';
import { create as createWeight } from '@/lib/db/repositories/weight-logs';
import { logMoodInputSchema, logWaterInputSchema, logWeightInputSchema } from '@/lib/types/dto/logs';
import { loadTodaySnapshot } from '@/lib/services/today';
import { generateInsights } from '@/lib/services/insights';
import type { Insight, InsightRange } from '@/lib/types/dto/insights';

export type LogActionResult =
  | { ok: true }
  | { ok: false; error: 'unauthorized' | 'validation' | 'unknown'; message?: string };

function validationError(parsed: {
  success: false;
  error: { issues: Array<{ path: (string | number)[]; message: string }> };
}): LogActionResult {
  return {
    ok: false,
    error: 'validation',
    message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
  };
}

export async function logWaterAction(rawInput: unknown): Promise<LogActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: 'unauthorized' };

  const parsed = logWaterInputSchema.safeParse(rawInput);
  if (!parsed.success) return validationError(parsed);

  try {
    await createWater({
      userId: session.user.id,
      ml: parsed.data.ml,
      loggedAt: parsed.data.loggedAt ?? new Date(),
    });
    revalidatePath('/today');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: 'unknown', message: err instanceof Error ? err.message : 'unknown error' };
  }
}

export async function logMoodAction(rawInput: unknown): Promise<LogActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: 'unauthorized' };

  const parsed = logMoodInputSchema.safeParse(rawInput);
  if (!parsed.success) return validationError(parsed);

  try {
    await createMood({
      userId: session.user.id,
      energy: parsed.data.energy,
      note: parsed.data.note ?? null,
      loggedAt: parsed.data.loggedAt ?? new Date(),
    });
    revalidatePath('/today');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: 'unknown', message: err instanceof Error ? err.message : 'unknown error' };
  }
}

export async function logWeightAction(rawInput: unknown): Promise<LogActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: 'unauthorized' };

  const parsed = logWeightInputSchema.safeParse(rawInput);
  if (!parsed.success) return validationError(parsed);

  try {
    await createWeight({
      userId: session.user.id,
      // Drizzle numeric columns → strings on the boundary
      weightKg: String(parsed.data.weightKg),
      bodyFatPct: parsed.data.bodyFatPct != null ? String(parsed.data.bodyFatPct) : null,
      source: parsed.data.source,
      note: parsed.data.note ?? null,
      loggedAt: parsed.data.loggedAt,
    });
    // Weight feeds plan-preview's TDEE explainer copy + Phase-3 recalibration.
    revalidatePath('/today');
    revalidatePath('/plan-preview');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: 'unknown', message: err instanceof Error ? err.message : 'unknown error' };
  }
}

export async function fetchInsightsAction(range: InsightRange): Promise<Insight[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  try {
    const snapshot = await loadTodaySnapshot(session.user.id);
    return await generateInsights(snapshot, range);
  } catch {
    return [];
  }
}
