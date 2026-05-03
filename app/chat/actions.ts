'use server';

// Server Actions for the Chat page.
// confirmFoodLogAction: called when user taps "ยืนยัน" on a food confirm card.
// The pending food-log row was created by the log_food tool; this sets confirmed_at.

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { confirmOwned, softDeleteOwned } from '@/lib/db/repositories/food-logs';
import { findLatestForUser } from '@/lib/db/repositories/chat-threads';
import { findByThreadAndDate } from '@/lib/db/repositories/messages';
import { findByIds as findAttachmentsByIds } from '@/lib/db/repositories/attachments';
import { findByUserId as findProfile, updatePlanFields } from '@/lib/db/repositories/profiles';
import { latest as latestWeight } from '@/lib/db/repositories/weight-logs';
import { collectAttachmentIds, dbRowsToUIMessages } from '@/lib/ai/messages-to-ui';
import { computeTdee } from '@/lib/services/tdee';
import type { UIMessage } from 'ai';
import type { LogActionResult } from '@/app/today/actions';

/** Read-only fetch of a day's chat messages for the date-navigation UI. */
export async function fetchChatByDateAction(dateIct: string): Promise<UIMessage[]> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIct)) return [];
  const session = await auth();
  if (!session?.user?.id) return [];
  const thread = await findLatestForUser(session.user.id);
  if (!thread) return [];
  const rows = await findByThreadAndDate(thread.id, dateIct);
  const attachmentIds = collectAttachmentIds(rows);
  const attachments = await findAttachmentsByIds(session.user.id, attachmentIds);
  const attachmentMap = new Map(attachments.map((a) => [a.id, a]));
  return dbRowsToUIMessages(rows, attachmentMap);
}

export async function confirmFoodLogAction(pendingId: string): Promise<LogActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: 'unauthorized' };

  try {
    const row = await confirmOwned(pendingId, session.user.id);
    if (!row) return { ok: false, error: 'unknown', message: 'pending food log not found or already deleted' };
    revalidatePath('/today');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: 'unknown', message: err instanceof Error ? err.message : 'unknown error' };
  }
}

export async function cancelFoodLogAction(pendingId: string): Promise<LogActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: 'unauthorized' };

  try {
    await softDeleteOwned(pendingId, session.user.id);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: 'unknown', message: err instanceof Error ? err.message : 'unknown error' };
  }
}

export type ProfileChanges = {
  goal?: 'lose' | 'gain' | 'fit';
  activityLevel?: 'sit' | 'walk' | 'move' | 'active';
  targetWeightKg?: number;
  daysPerWeek?: number;
  equipment?: 'gym' | 'home_eq' | 'home';
};

/**
 * Called when user taps "ยืนยัน" on an update_profile confirm card.
 * Re-computes TDEE server-side (does not trust preview values from the payload).
 */
export async function confirmUpdateProfileAction(changes: ProfileChanges): Promise<LogActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: 'unauthorized' };
  const userId = session.user.id;

  try {
    const [profile, latestLog] = await Promise.all([findProfile(userId), latestWeight(userId)]);
    if (!profile) return { ok: false, error: 'unknown', message: 'profile not found' };

    const currentWeightKg = latestLog
      ? parseFloat(String(latestLog.weightKg))
      : parseFloat(String(profile.weightKgInitial));
    const currentBodyFatPct = latestLog?.bodyFatPct != null ? parseFloat(String(latestLog.bodyFatPct)) : undefined;

    const result = computeTdee({
      sex: profile.sex as 'm' | 'f' | 'o',
      weightKg: currentWeightKg,
      heightCm: profile.heightCm,
      age: profile.age,
      activityLevel: (changes.activityLevel ?? profile.activityLevel) as 'sit' | 'walk' | 'move' | 'active',
      goal: (changes.goal ?? profile.goal) as 'lose' | 'gain' | 'fit',
      bodyFatPct: currentBodyFatPct,
    });

    await updatePlanFields(userId, {
      goal: changes.goal,
      activityLevel: changes.activityLevel,
      targetWeightKg: changes.targetWeightKg !== undefined ? String(changes.targetWeightKg) : undefined,
      daysPerWeek: changes.daysPerWeek,
      equipment: changes.equipment,
      kcalTarget: result.kcalTarget,
      tdeeKcal: result.tdee,
      proteinGTarget: result.macros.proteinG,
      carbGTarget: result.macros.carbG,
      fatGTarget: result.macros.fatG,
    });

    revalidatePath('/today');
    revalidatePath('/me');
    revalidatePath('/plan');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: 'unknown', message: err instanceof Error ? err.message : 'unknown error' };
  }
}
