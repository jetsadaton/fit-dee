// DTO for food log items displayed in the food list (RSC → client boundary).
// Uses primitive types only (no Date) for Next.js serialization.

export type FoodLogItemDto = {
  id: string;
  nameTh: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  kcal: number;
  kcalLow: number | null;
  kcalHigh: number | null;
  proteinG: number;
  carbG: number;
  fatG: number;
  portionG: number | null;
  loggedAt: string; // ISO string
};
