import { afterEach, describe, expect, it, vi } from 'vitest';

// Mock the repo BEFORE importing the service so the real Drizzle import never
// runs (it would try to read DATABASE_URL at module load time).
vi.mock('@/lib/db/repositories/profiles', () => ({
  upsert: vi.fn(),
}));

import { completeOnboarding } from '@/lib/services/onboarding';
import { upsert } from '@/lib/db/repositories/profiles';
import type { OnboardingInput } from '@/lib/types/dto/onboarding';

const baseInput: OnboardingInput = {
  displayName: 'โบ้',
  sex: 'm',
  age: 30,
  heightCm: 175,
  weightKgInitial: 75,
  targetWeightKg: 70,
  goal: 'lose',
  daysPerWeek: 4,
  activityLevel: 'walk',
  equipment: 'home',
  injuries: [],
};

const fakeRow = (overrides: Record<string, unknown> = {}) => ({
  userId: 'u-1',
  displayName: 'โบ้',
  sex: 'm',
  age: 30,
  heightCm: 175,
  weightKgInitial: '75',
  targetWeightKg: '70',
  goal: 'lose',
  daysPerWeek: 4,
  activityLevel: 'walk',
  equipment: 'home',
  injuries: [],
  tdeeKcal: 0,
  kcalTarget: 0,
  proteinGTarget: 0,
  carbGTarget: 0,
  fatGTarget: 0,
  planRecalibratedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

afterEach(() => vi.mocked(upsert).mockReset());

describe('completeOnboarding', () => {
  it('passes Mifflin-derived targets to the repo when bodyFatPct missing', async () => {
    vi.mocked(upsert).mockResolvedValueOnce(fakeRow() as never);
    const result = await completeOnboarding({ userId: 'u-1', input: baseInput });

    expect(result.formula).toBe('mifflin-st-jeor');
    // Sanity: kcal target was floored or computed correctly (not 0 from defaults)
    expect(result.kcalTarget).toBeGreaterThan(1500);

    const callArg = vi.mocked(upsert).mock.calls[0]?.[0];
    expect(callArg).toBeDefined();
    expect(callArg!.userId).toBe('u-1');
    // Numeric columns must be strings going into Drizzle (node-postgres)
    expect(callArg!.weightKgInitial).toBe('75');
    expect(callArg!.targetWeightKg).toBe('70');
    // Computed targets land in the right slots
    expect(callArg!.kcalTarget).toBe(result.kcalTarget);
    expect(callArg!.proteinGTarget).toBeGreaterThan(0);
    expect(callArg!.carbGTarget).toBeGreaterThan(0);
    expect(callArg!.fatGTarget).toBeGreaterThan(0);
  });

  it('switches to Katch-McArdle when bodyFatPct provided', async () => {
    vi.mocked(upsert).mockResolvedValueOnce(fakeRow() as never);
    const result = await completeOnboarding({
      userId: 'u-1',
      input: { ...baseInput, bodyFatPct: 18 },
    });
    expect(result.formula).toBe('katch-mcardle');
  });

  it('persists the userId from the auth boundary, not anything in input', async () => {
    vi.mocked(upsert).mockResolvedValueOnce(fakeRow({ userId: 'u-secure' }) as never);
    await completeOnboarding({ userId: 'u-secure', input: baseInput });
    const callArg = vi.mocked(upsert).mock.calls[0]?.[0];
    expect(callArg!.userId).toBe('u-secure');
  });
});
