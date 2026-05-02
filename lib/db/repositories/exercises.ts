// Exercises catalog repository (read-mostly).
// Plan generator (Phase 2) seeds the catalog; read paths grab by id or
// semantic_id when rendering plan/run screens.

import { eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { exercises } from '@/lib/db/schema';
import type { Exercise } from '@/lib/types/db/workouts';

export async function findById(id: string): Promise<Exercise | undefined> {
  const rows = await db.select().from(exercises).where(eq(exercises.id, id)).limit(1);
  return rows[0];
}

export async function findBySemanticId(semanticId: string): Promise<Exercise | undefined> {
  const rows = await db.select().from(exercises).where(eq(exercises.semanticId, semanticId)).limit(1);
  return rows[0];
}

/** Bulk lookup — useful when materialising a plan day's exercises. */
export async function findByIds(ids: string[]): Promise<Exercise[]> {
  if (ids.length === 0) return [];
  return db.select().from(exercises).where(inArray(exercises.id, ids));
}

export async function findBySemanticIds(semanticIds: string[]): Promise<Exercise[]> {
  if (semanticIds.length === 0) return [];
  return db.select().from(exercises).where(inArray(exercises.semanticId, semanticIds));
}
