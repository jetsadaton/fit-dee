'use server';

// Server Actions for the Today dashboard.
// Userid comes from auth() — never the request body (rules/backend.md).
// All actions revalidate '/today' so RSC re-renders with fresh data.

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { create as createWater } from '@/lib/db/repositories/water-logs';
import { create as createMood } from '@/lib/db/repositories/mood-logs';
import { create as createWeight } from '@/lib/db/repositories/weight-logs';
import { softDeleteOwned, updateFoodLog } from '@/lib/db/repositories/food-logs';
import {
  logMoodInputSchema,
  logWaterInputSchema,
  logWeightInputSchema,
  updateFoodLogInputSchema,
} from '@/lib/types/dto/logs';
import { loadTodaySnapshot } from '@/lib/services/today';
import { generateInsights } from '@/lib/services/insights';
import { findFresh, upsert as upsertInsights } from '@/lib/db/repositories/insights-cache';
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

export async function deleteFoodLogAction(id: string): Promise<LogActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: 'unauthorized' };

  try {
    await softDeleteOwned(id, session.user.id);
    revalidatePath('/today');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: 'unknown', message: err instanceof Error ? err.message : 'unknown error' };
  }
}

export async function updateFoodLogAction(id: string, rawInput: unknown): Promise<LogActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: 'unauthorized' };

  const parsed = updateFoodLogInputSchema.safeParse(rawInput);
  if (!parsed.success) return validationError(parsed);

  try {
    const row = await updateFoodLog(id, session.user.id, {
      kcal: parsed.data.kcal,
      proteinG: String(parsed.data.proteinG),
      carbG: String(parsed.data.carbG),
      fatG: String(parsed.data.fatG),
    });
    if (!row) return { ok: false, error: 'unknown', message: 'food log not found or already deleted' };
    revalidatePath('/today');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: 'unknown', message: err instanceof Error ? err.message : 'unknown error' };
  }
}

export async function fetchInsightsAction(range: InsightRange): Promise<Insight[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  const userId = session.user.id;

  // ICT date key (same key used by weekly-insights Inngest job).
  const dateIct = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);

  try {
    // Cache-first: skip LLM if a fresh pre-generated result exists.
    const cached = await findFresh({ userId, range, dateIct });
    if (cached) return cached;

    const snapshot = await loadTodaySnapshot(userId);
    const fresh = await generateInsights(snapshot, range);

    if (fresh.length > 0) {
      // Write back to cache (best-effort).
      void upsertInsights({ userId, range, dateIct, insights: fresh }).catch(() => undefined);
    }
    return fresh;
  } catch {
    return [];
  }
}
