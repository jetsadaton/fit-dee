'use server';

// Server Actions for the Chat page.
// confirmFoodLogAction: called when user taps "ยืนยัน" on a food confirm card.
// The pending food-log row was created by the log_food tool; this sets confirmed_at.

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { confirm } from '@/lib/db/repositories/food-logs';
import type { LogActionResult } from '@/app/today/actions';

export async function confirmFoodLogAction(pendingId: string): Promise<LogActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: 'unauthorized' };

  try {
    const row = await confirm(pendingId);
    if (!row) return { ok: false, error: 'unknown', message: 'pending food log not found or already deleted' };
    revalidatePath('/today');
    return { ok: true };
  } catch (err) {
    return { ok: false, error: 'unknown', message: err instanceof Error ? err.message : 'unknown error' };
  }
}
