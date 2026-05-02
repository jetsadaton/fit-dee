/**
 * food-resolver.ts
 *
 * Implements the food search precedence chain:
 *   Thai DB → USDA FoodData Central (fallback when Thai DB returns < 3 results)
 *
 * Full precedence for Coachly:
 *   user_edit > vision_cache > Thai DB > USDA > LLM estimate
 * (user_edit and vision_cache are handled upstream of this service)
 */

import { searchByName } from '@/lib/db/repositories/foods';
import type { FoodResolverResult } from '@/lib/types/db/foods';

// ─── USDA API types ───────────────────────────────────────────────────────────

interface UsdaFoodNutrient {
  nutrientId: number;
  value: number;
}

interface UsdaFoodItem {
  fdcId: number;
  description: string;
  foodNutrients: UsdaFoodNutrient[];
}

interface UsdaSearchResponse {
  foods: UsdaFoodItem[];
}

// Nutrient IDs from USDA FoodData Central
const USDA_NUTRIENT = {
  ENERGY_KCAL: 1008,
  PROTEIN_G: 1003,
  FAT_G: 1004,
  CARB_G: 1005,
} as const;

const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';
const USDA_FETCH_TIMEOUT_MS = 3000;
const THAI_DB_THRESHOLD = 3; // fall back to USDA when Thai DB has fewer results

// ─── helpers ─────────────────────────────────────────────────────────────────

function getNutrientValue(nutrients: UsdaFoodNutrient[], id: number): number {
  return nutrients.find((n) => n.nutrientId === id)?.value ?? 0;
}

/**
 * Normalise a food name for dedup comparison:
 * lowercase, trim, collapse internal whitespace.
 */
function normaliseName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Map a USDA food item to the shared FoodResolverResult shape.
 * - id uses the `usda_${fdcId}` prefix (not a real DB uuid)
 * - numeric macro fields stored as "25.50"-style strings to match Drizzle numeric output
 */
function mapUsdaItem(item: UsdaFoodItem): FoodResolverResult {
  const kcalRaw = getNutrientValue(item.foodNutrients, USDA_NUTRIENT.ENERGY_KCAL);
  const proteinRaw = getNutrientValue(item.foodNutrients, USDA_NUTRIENT.PROTEIN_G);
  const fatRaw = getNutrientValue(item.foodNutrients, USDA_NUTRIENT.FAT_G);
  const carbRaw = getNutrientValue(item.foodNutrients, USDA_NUTRIENT.CARB_G);

  const semanticId = `usda_${item.fdcId}`;

  return {
    id: semanticId,
    semanticId,
    nameTh: item.description, // no Thai name available from USDA
    nameEn: item.description,
    kcalPer100g: Math.round(kcalRaw),
    proteinGPer100g: proteinRaw.toFixed(2),
    carbGPer100g: carbRaw.toFixed(2),
    fatGPer100g: fatRaw.toFixed(2),
    defaultPortionG: null,
    source: 'usda',
  };
}

// ─── USDA fetch ───────────────────────────────────────────────────────────────

async function fetchFromUsda(query: string, pageSize = 5): Promise<FoodResolverResult[]> {
  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) {
    // No key configured — skip silently
    return [];
  }

  const params = new URLSearchParams({ query, api_key: apiKey, pageSize: String(pageSize) });
  // USDA expects repeated dataType params, not comma-joined
  params.append('dataType', 'SR Legacy');
  params.append('dataType', 'Survey (FNDDS)');
  params.append('dataType', 'Foundation');

  const url = `${USDA_BASE_URL}?${params.toString()}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(USDA_FETCH_TIMEOUT_MS) });
    if (!res.ok) {
      // Non-2xx — treat as unavailable, don't surface to the user
      return [];
    }
    const data = (await res.json()) as UsdaSearchResponse;
    return (data.foods ?? []).map(mapUsdaItem);
  } catch {
    // Network error, timeout (AbortError), or JSON parse failure — skip gracefully
    return [];
  }
}

// ─── dedup ───────────────────────────────────────────────────────────────────

/**
 * Remove USDA results whose description already appears (as an exact
 * normalised match or substring) in the Thai DB result set.
 * Compares against both nameTh and nameEn of Thai DB rows.
 */
function deduplicateUsda(thaiRows: FoodResolverResult[], usdaRows: FoodResolverResult[]): FoodResolverResult[] {
  const thaiNames = new Set(
    thaiRows.flatMap((r) => {
      const names: string[] = [normaliseName(r.nameTh)];
      if (r.nameEn) names.push(normaliseName(r.nameEn));
      return names;
    }),
  );

  return usdaRows.filter((u) => {
    const uNorm = normaliseName(u.nameEn ?? u.nameTh);
    // Drop if any Thai DB name contains or equals the USDA name
    for (const thaiName of thaiNames) {
      if (thaiName === uNorm || thaiName.includes(uNorm) || uNorm.includes(thaiName)) {
        return false;
      }
    }
    return true;
  });
}

// ─── public API ──────────────────────────────────────────────────────────────

export const foodResolverService = {
  /**
   * Search for foods using the Thai DB → USDA fallback chain.
   *
   * Returns Thai DB results first. If fewer than THAI_DB_THRESHOLD results
   * are found, USDA FoodData Central is also queried and deduplicated results
   * are appended.
   */
  async search(query: string): Promise<FoodResolverResult[]> {
    // 1. Thai DB
    const thaiRaw = await searchByName(query);
    const thaiRows: FoodResolverResult[] = thaiRaw;

    // 2. USDA fallback — only when Thai DB results are sparse
    if (thaiRows.length >= THAI_DB_THRESHOLD) {
      return thaiRows;
    }

    const usdaRaw = await fetchFromUsda(query);
    const usdaDeduped = deduplicateUsda(thaiRows, usdaRaw);

    return [...thaiRows, ...usdaDeduped];
  },
};
