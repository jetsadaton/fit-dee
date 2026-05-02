import { readFileSync } from 'fs';
import { db } from '@/lib/db/client';
import { foods } from '@/lib/db/schema';

const allFoods = JSON.parse(readFileSync('scripts/extracted/all_foods_fixed.json', 'utf-8')) as Record<
  string,
  unknown
>[];

const MAX_MG: Record<string, number> = {
  protein_g: 999,
  carb_g: 999,
  fat_g: 999,
  water_g: 999,
  fiber_g: 999,
  sugar_g: 999,
  ash_g: 999,
  iron_mg: 200,
  copper_mg: 50,
  zinc_mg: 200,
  thiamin_mg: 20,
  riboflavin_mg: 20,
  niacin_mg: 200,
  vitamin_c_mg: 2000,
  vitamin_e_mg: 200,
};

function toNum(v: unknown, field?: string): string | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  if (isNaN(n)) return null;
  if (field && MAX_MG[field] !== undefined && n > MAX_MG[field]) return null;
  return n.toFixed(3);
}

async function main() {
  let inserted = 0,
    skipped = 0;

  for (const food of allFoods) {
    const id = String(food.food_id ?? '').trim();
    const nameTh = String(food.name_th ?? '').trim();
    if (!id || !nameTh) {
      skipped++;
      continue;
    }

    const kcal = Number(food.energy_kcal);
    if (!kcal || isNaN(kcal)) {
      skipped++;
      continue;
    }

    const nameEn = food.name_en ? String(food.name_en) : null;
    const kcalPer100g = Math.round(kcal);
    // NOT NULL columns — fall back to '0' when extraction yielded null
    const proteinGPer100g = toNum(food.protein_g, 'protein_g') ?? '0';
    const carbGPer100g = toNum(food.carb_g, 'carb_g') ?? '0';
    const fatGPer100g = toNum(food.fat_g, 'fat_g') ?? '0';
    // Nullable extended columns
    const waterGPer100g = toNum(food.water_g, 'water_g');
    const fiberGPer100g = toNum(food.fiber_g, 'fiber_g');
    const sugarGPer100g = toNum(food.sugar_g, 'sugar_g');
    const ashGPer100g = toNum(food.ash_g, 'ash_g');
    const calciumMgPer100g = toNum(food.calcium_mg);
    const phosphorusMgPer100g = toNum(food.phosphorus_mg);
    const magnesiumMgPer100g = toNum(food.magnesium_mg);
    const sodiumMgPer100g = toNum(food.sodium_mg);
    const potassiumMgPer100g = toNum(food.potassium_mg);
    const ironMgPer100g = toNum(food.iron_mg, 'iron_mg');
    const copperMgPer100g = toNum(food.copper_mg, 'copper_mg');
    const zincMgPer100g = toNum(food.zinc_mg, 'zinc_mg');
    const iodineUgPer100g = toNum(food.iodine_ug);
    const vitaminAUgRaePer100g = toNum(food.vitamin_a_ug_rae);
    const thiaminMgPer100g = toNum(food.thiamin_mg, 'thiamin_mg');
    const riboflavinMgPer100g = toNum(food.riboflavin_mg, 'riboflavin_mg');
    const niacinMgPer100g = toNum(food.niacin_mg, 'niacin_mg');
    const vitaminCMgPer100g = toNum(food.vitamin_c_mg, 'vitamin_c_mg');
    const vitaminEMgPer100g = toNum(food.vitamin_e_mg, 'vitamin_e_mg');

    await db
      .insert(foods)
      .values({
        semanticId: `moph2018_${id}`,
        nameTh,
        nameEn,
        kcalPer100g,
        proteinGPer100g,
        carbGPer100g,
        fatGPer100g,
        waterGPer100g,
        fiberGPer100g,
        sugarGPer100g,
        ashGPer100g,
        calciumMgPer100g,
        phosphorusMgPer100g,
        magnesiumMgPer100g,
        sodiumMgPer100g,
        potassiumMgPer100g,
        ironMgPer100g,
        copperMgPer100g,
        zincMgPer100g,
        iodineUgPer100g,
        vitaminAUgRaePer100g,
        thiaminMgPer100g,
        riboflavinMgPer100g,
        niacinMgPer100g,
        vitaminCMgPer100g,
        vitaminEMgPer100g,
        source: 'thai_db',
        verified: true,
      })
      .onConflictDoUpdate({
        target: foods.semanticId,
        set: {
          nameTh,
          nameEn,
          kcalPer100g,
          proteinGPer100g,
          carbGPer100g,
          fatGPer100g,
          waterGPer100g,
          fiberGPer100g,
          sugarGPer100g,
          ashGPer100g,
          calciumMgPer100g,
          phosphorusMgPer100g,
          magnesiumMgPer100g,
          sodiumMgPer100g,
          potassiumMgPer100g,
          ironMgPer100g,
          copperMgPer100g,
          zincMgPer100g,
          iodineUgPer100g,
          vitaminAUgRaePer100g,
          thiaminMgPer100g,
          riboflavinMgPer100g,
          niacinMgPer100g,
          vitaminCMgPer100g,
          vitaminEMgPer100g,
          source: 'thai_db',
          verified: true,
        },
      });
    inserted++;
  }

  console.log(`Done: ${inserted} upserted, ${skipped} skipped`);
}

main().catch(console.error);
