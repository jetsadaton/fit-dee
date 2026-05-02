// Foods repository.
// Vector (pgvector) search is deferred until the embedding pipeline ships (Phase 3).
// For now: case-insensitive text match on name_th / name_en with a 5-row cap.

import { ilike, or } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { foods } from '@/lib/db/schema';
import type { FoodSearchResult } from '@/lib/types/db/foods';

export async function searchByName(query: string, limit = 5): Promise<FoodSearchResult[]> {
  const pattern = `%${query}%`;
  return db
    .select({
      id: foods.id,
      semanticId: foods.semanticId,
      nameTh: foods.nameTh,
      nameEn: foods.nameEn,
      kcalPer100g: foods.kcalPer100g,
      proteinGPer100g: foods.proteinGPer100g,
      carbGPer100g: foods.carbGPer100g,
      fatGPer100g: foods.fatGPer100g,
      defaultPortionG: foods.defaultPortionG,
      source: foods.source,
    })
    .from(foods)
    .where(or(ilike(foods.nameTh, pattern), ilike(foods.nameEn, pattern)))
    .limit(limit);
}
