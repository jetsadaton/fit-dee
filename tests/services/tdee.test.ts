import { describe, expect, it } from 'vitest';
import {
  bmrKatchMcArdle,
  bmrMifflinStJeor,
  computeMacros,
  computeTdee,
  estimateWeeksToTarget,
  InfeasiblePlanError,
} from '@/lib/services/tdee';

// Verifies numbers in .claude/topics/tdee-and-macros.md.
// If a number drifts, fix the topic doc + this test in the same commit.

describe('bmr formulas', () => {
  it('Mifflin-St Jeor — male reference (75kg, 175cm, 30y) = 1699', () => {
    // 10·75 + 6.25·175 − 5·30 + 5 = 750 + 1093.75 − 150 + 5 = 1698.75
    const v = bmrMifflinStJeor('m', 75, 175, 30);
    expect(Math.round(v)).toBe(1699);
  });

  it('Mifflin-St Jeor — female reference (60kg, 165cm, 30y) ≈ 1320', () => {
    const v = bmrMifflinStJeor('f', 60, 165, 30);
    expect(Math.round(v)).toBe(1320);
  });

  it("Sex 'o' uses the lower-floor (female-style) variant", () => {
    expect(bmrMifflinStJeor('o', 60, 165, 30)).toBe(bmrMifflinStJeor('f', 60, 165, 30));
  });

  it('Katch-McArdle — 70kg @ 20% body fat → LBM 56kg → 370 + 21.6×56 = 1579.6', () => {
    expect(bmrKatchMcArdle(70, 20)).toBeCloseTo(1579.6, 1);
  });
});

describe('computeTdee', () => {
  const baseInput = {
    sex: 'm' as const,
    weightKg: 75,
    heightCm: 175,
    age: 30,
    activityLevel: 'walk' as const, // 1.375
    goal: 'lose' as const, // ×0.80
  };

  it('uses Mifflin when bodyFatPct missing', () => {
    const r = computeTdee(baseInput);
    expect(r.formula).toBe('mifflin-st-jeor');
    // BMR 1698.75 × 1.375 = 2335.78 → ×0.80 = 1868.6 → round 1869
    expect(r.kcalTarget).toBe(1869);
    expect(r.flooredAt).toBeNull();
  });

  it('switches to Katch-McArdle when bodyFatPct provided', () => {
    const r = computeTdee({ ...baseInput, bodyFatPct: 18 });
    expect(r.formula).toBe('katch-mcardle');
  });

  it('ignores absurd bodyFatPct values (> 60 → fall back to Mifflin)', () => {
    const r = computeTdee({ ...baseInput, bodyFatPct: 80 });
    expect(r.formula).toBe('mifflin-st-jeor');
  });

  it('applies kcal floor for female users on aggressive deficit', () => {
    const r = computeTdee({
      sex: 'f',
      weightKg: 45,
      heightCm: 150,
      age: 60,
      activityLevel: 'sit', // 1.2
      goal: 'lose', // 0.80
    });
    // BMR ≈ 970, TDEE ≈ 1164, raw ≈ 931 → floored to 1200
    expect(r.kcalTarget).toBe(1200);
    expect(r.flooredAt).toBe(1200);
  });

  it('produces macros consistent with kcal target (within rounding ±10 kcal)', () => {
    const r = computeTdee(baseInput);
    const reconstructed = r.macros.proteinG * 4 + r.macros.carbG * 4 + r.macros.fatG * 9;
    expect(Math.abs(reconstructed - r.kcalTarget)).toBeLessThanOrEqual(10);
  });
});

describe('computeMacros (g/kg, option B)', () => {
  it('lose goal: protein 2.0 g/kg, fat 0.8 g/kg', () => {
    const m = computeMacros({ kcalTarget: 1800, weightKg: 70, goal: 'lose' });
    expect(m.proteinG).toBe(140); // 2.0 × 70
    expect(m.fatG).toBe(56); // 0.8 × 70
    // carb_kcal = 1800 − (140×4 + 56×9) = 1800 − 1064 = 736 → 184g
    expect(m.carbG).toBe(184);
  });

  it('gain goal: protein 1.8 g/kg, fat 0.9 g/kg', () => {
    const m = computeMacros({ kcalTarget: 2800, weightKg: 70, goal: 'gain' });
    expect(m.proteinG).toBe(126); // 1.8 × 70
    expect(m.fatG).toBe(63); // 0.9 × 70
  });

  it('fit goal: protein 1.6 g/kg, fat 0.9 g/kg', () => {
    const m = computeMacros({ kcalTarget: 2200, weightKg: 70, goal: 'fit' });
    expect(m.proteinG).toBe(112); // 1.6 × 70
    expect(m.fatG).toBe(63); // 0.9 × 70
  });

  it('scales protein+fat down when carbs would fall below 50g', () => {
    // Tight kcal (1200), high body weight (90kg) → would push carbs below 50g if not scaled
    const m = computeMacros({ kcalTarget: 1200, weightKg: 90, goal: 'lose' });
    expect(m.carbG).toBeGreaterThanOrEqual(50);
    // P+F should fit in (kcalTarget − 200kcal carbs)
    expect(m.proteinG * 4 + m.fatG * 9).toBeLessThanOrEqual(1200 - 200 + 5);
  });

  it('throws InfeasiblePlanError when even 50g carbs leaves no kcal for protein+fat', () => {
    // 50g carbs = 200 kcal. kcalTarget=200 leaves 0 for protein+fat → infeasible.
    expect(() => computeMacros({ kcalTarget: 200, weightKg: 70, goal: 'lose' })).toThrow(InfeasiblePlanError);
  });
});

describe('estimateWeeksToTarget', () => {
  it('returns at least 2 weeks even for tiny weight delta', () => {
    const w = estimateWeeksToTarget({ weightKg: 70, targetWeightKg: 69.5, tdee: 2400, kcalTarget: 1900 });
    expect(w).toBeGreaterThanOrEqual(2);
  });

  it('returns 0 when goal is maintenance (tdee == kcalTarget)', () => {
    const w = estimateWeeksToTarget({ weightKg: 70, targetWeightKg: 70, tdee: 2400, kcalTarget: 2400 });
    expect(w).toBe(0);
  });

  it('returns longer ETA for smaller deficit', () => {
    const small = estimateWeeksToTarget({ weightKg: 80, targetWeightKg: 70, tdee: 2400, kcalTarget: 2200 });
    const big = estimateWeeksToTarget({ weightKg: 80, targetWeightKg: 70, tdee: 2400, kcalTarget: 1700 });
    expect(small).toBeGreaterThan(big);
  });
});
