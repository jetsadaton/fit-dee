import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import type { foods } from '@/lib/db/schema';

export type Food = InferSelectModel<typeof foods>;
export type NewFood = InferInsertModel<typeof foods>;

export type FoodSearchResult = Pick<
  Food,
  | 'id'
  | 'semanticId'
  | 'nameTh'
  | 'nameEn'
  | 'kcalPer100g'
  | 'proteinGPer100g'
  | 'carbGPer100g'
  | 'fatGPer100g'
  | 'defaultPortionG'
>;
