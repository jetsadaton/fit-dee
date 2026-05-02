'use server';

import { auth } from '@/lib/auth';
import * as sessionRepo from '@/lib/db/repositories/workout-sessions';
import * as exerciseLogRepo from '@/lib/db/repositories/exercise-logs';

type ExMeta = { semanticId: string; name: string; restSec: number };

export async function saveWorkoutAction(
  sessionId: string,
  exercises: ExMeta[],
  logs: Record<string, { w: number; r: string }>,
  elapsed: number,
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const entries = Object.entries(logs).flatMap(([key, log]) => {
    const [exIdxStr, setIdxStr] = key.split('-');
    const exIdx = parseInt(exIdxStr ?? '0');
    const setIdx = parseInt(setIdxStr ?? '0');
    const ex = exercises[exIdx];
    if (!ex) return [];
    const reps = parseInt(log.r);
    if (isNaN(reps) || reps <= 0) return [];
    return [
      {
        sessionId,
        exerciseSemanticId: ex.semanticId,
        exerciseNameSnapshot: ex.name,
        setIdx,
        weightKg: String(log.w),
        reps,
        restSec: ex.restSec || null,
      },
    ];
  });

  if (entries.length > 0) {
    await exerciseLogRepo.createMany(entries);
  }

  const totalReps = entries.reduce((s, e) => s + e.reps, 0);
  const totalVolume = entries.reduce((s, e) => s + e.reps * parseFloat(e.weightKg), 0);

  await sessionRepo.finish({
    id: sessionId,
    totalVolumeKg: totalVolume,
    totalReps,
    elapsedSec: elapsed,
  });
}
