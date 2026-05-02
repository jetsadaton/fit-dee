#!/usr/bin/env tsx
// pnpm db:seed — inserts the curated exercise catalog (idempotent via ON CONFLICT DO NOTHING).
// Run once after pnpm db:migrate.

import { db } from '@/lib/db/client';
import { exercises } from '@/lib/db/schema';
import { EXERCISE_SEEDS } from '@/lib/db/seed/exercises';
import { sql } from 'drizzle-orm';

async function main() {
  console.log(`Seeding ${EXERCISE_SEEDS.length} exercises…`);

  const rows = await db
    .insert(exercises)
    .values(EXERCISE_SEEDS.map((s) => ({ ...s, source: 'curated' })))
    .onConflictDoUpdate({
      target: exercises.semanticId,
      set: {
        nameTh: sql`excluded.name_th`,
        nameEn: sql`excluded.name_en`,
        muscleGroups: sql`excluded.muscle_groups`,
        equipment: sql`excluded.equipment`,
        defaultSets: sql`excluded.default_sets`,
        defaultReps: sql`excluded.default_reps`,
        defaultRestSec: sql`excluded.default_rest_sec`,
        tipTh: sql`excluded.tip_th`,
        formCuesTh: sql`excluded.form_cues_th`,
        updatedAt: sql`now()`,
      },
    })
    .returning({ id: exercises.id, semanticId: exercises.semanticId });

  console.log(`✓ Upserted ${rows.length} exercises`);
  rows.forEach((r) => console.log(`  ${r.semanticId}`));
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
