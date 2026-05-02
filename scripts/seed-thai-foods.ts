#!/usr/bin/env tsx
// pnpm db:seed:foods — fetches BaoWio Thai Nutrition Dataset from HuggingFace
// and upserts into the foods table (source = 'thai_db'). Idempotent.
//
// Dataset: https://huggingface.co/datasets/BaoWio/Thai_Nutrition_Dataset
// License: CC-BY-SA 4.0 (derived from INMU Thai Food Composition Tables 2015)
// Credit: Institute of Nutrition, Mahidol University

import { db } from '@/lib/db/client';
import { foods } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

const HF_API = 'https://datasets-server.huggingface.co/rows';
const DATASET = 'BaoWio/Thai_Nutrition_Dataset';
const BATCH = 100;

type HFRow = {
  Food_Code: string;
  Thai_Name: string;
  English_Name: string;
  'Protein(g)': string;
  'Fat(g)': string;
  'Energy(kcal) by calculation': string;
  'CHOCDF (g) Carbohydrate': string;
};

function parseNum(v: string): number | null {
  if (!v || v === '-') return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

function toSemanticId(code: string): string {
  return `inmu_${code.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
}

async function fetchBatch(offset: number): Promise<HFRow[]> {
  const url = `${HF_API}?dataset=${encodeURIComponent(DATASET)}&config=default&split=train&offset=${offset}&length=${BATCH}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HuggingFace API error ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { rows: { row: HFRow }[] };
  return json.rows.map((r) => r.row);
}

async function main() {
  console.log('Fetching BaoWio Thai Nutrition Dataset from HuggingFace…');

  // Fetch all rows in batches
  const allRows: HFRow[] = [];
  let offset = 0;
  while (true) {
    const batch = await fetchBatch(offset);
    if (batch.length === 0) break;
    allRows.push(...batch);
    process.stdout.write(`  fetched ${allRows.length} rows\r`);
    if (batch.length < BATCH) break;
    offset += BATCH;
  }
  console.log(`\nFetched ${allRows.length} rows total`);

  // Transform rows
  const rows = allRows
    .map((r) => {
      const protein = parseNum(r['Protein(g)']);
      const fat = parseNum(r['Fat(g)']);
      const carb = parseNum(r['CHOCDF (g) Carbohydrate']);
      let kcal = parseNum(r['Energy(kcal) by calculation']);

      // Estimate kcal from macros if missing (Atwater factors)
      if (kcal === null && protein !== null && carb !== null && fat !== null) {
        kcal = Math.round(protein * 4 + carb * 4 + fat * 9);
      }

      // Skip rows that are still incomplete after estimation
      if (kcal === null || protein === null || carb === null || fat === null) return null;

      return {
        semanticId: toSemanticId(r.Food_Code),
        nameTh: r.Thai_Name.trim(),
        nameEn: r.English_Name.trim() || null,
        kcalPer100g: Math.round(kcal),
        proteinGPer100g: protein.toFixed(2),
        carbGPer100g: carb.toFixed(2),
        fatGPer100g: fat.toFixed(2),
        source: 'thai_db',
        verified: false,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const skipped = allRows.length - rows.length;
  console.log(`Upserting ${rows.length} rows (skipped ${skipped} incomplete)…`);

  // Upsert in chunks of 200 to stay under Neon's param limit
  const CHUNK = 200;
  let upserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    await db
      .insert(foods)
      .values(chunk)
      .onConflictDoUpdate({
        target: foods.semanticId,
        set: {
          nameTh: sql`excluded.name_th`,
          nameEn: sql`excluded.name_en`,
          kcalPer100g: sql`excluded.kcal_per_100g`,
          proteinGPer100g: sql`excluded.protein_g_per_100g`,
          carbGPer100g: sql`excluded.carb_g_per_100g`,
          fatGPer100g: sql`excluded.fat_g_per_100g`,
          updatedAt: sql`now()`,
        },
      });
    upserted += chunk.length;
    process.stdout.write(`  ${upserted}/${rows.length}\r`);
  }

  console.log(`\n✓ Upserted ${upserted} Thai foods (source: thai_db)`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
