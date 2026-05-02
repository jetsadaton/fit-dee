import { describe, expect, it } from 'vitest';
import {
  dayKeyOf,
  isActiveDay,
  mondayOfWeek,
  toISODate,
  updateStreak,
  type DailyActivity,
  type StreakState,
  type WorkoutWeekPlan,
} from '@/lib/services/streak';

// Verifies cases listed in .claude/topics/streak.md §6.

const noPlan: WorkoutWeekPlan = { days: {} };
const planWithSundayRest: WorkoutWeekPlan = { days: { sun: { rest_day: true } } };

const blank = (date: string): DailyActivity => ({ date, ateAtLeastOneMeal: false, finishedAtLeastOneWorkout: false });
const ate = (date: string): DailyActivity => ({ ...blank(date), ateAtLeastOneMeal: true });
const trained = (date: string): DailyActivity => ({ ...blank(date), finishedAtLeastOneWorkout: true });

const initial: StreakState = { current: 0, longest: 0, lastActiveDate: null };

// Use a known Monday: 2026-05-04 is Monday.
const MON = new Date('2026-05-04T08:00:00');
const WED = new Date('2026-05-06T08:00:00');
const THU = new Date('2026-05-07T08:00:00');
const FRI = new Date('2026-05-08T08:00:00');
const SUN = new Date('2026-05-10T08:00:00');

describe('dayKeyOf', () => {
  it('Mon=mon, Sun=sun (Mon-first week)', () => {
    expect(dayKeyOf(MON)).toBe('mon');
    expect(dayKeyOf(SUN)).toBe('sun');
  });
});

describe('mondayOfWeek', () => {
  it('returns Monday 00:00 for any day in the week', () => {
    const m = mondayOfWeek(THU);
    expect(toISODate(m)).toBe('2026-05-04');
    expect(m.getHours()).toBe(0);
  });
});

describe('isActiveDay', () => {
  it('case 1: meal-only counts on workout day', () => {
    expect(isActiveDay(ate('2026-05-04'), noPlan, MON)).toBe(true);
  });

  it('case 7: workout-only counts on workout day', () => {
    expect(isActiveDay(trained('2026-05-04'), noPlan, MON)).toBe(true);
  });

  it('case 9: rest day with no meal & no workout → not active (uses grace)', () => {
    expect(isActiveDay(blank('2026-05-10'), planWithSundayRest, SUN)).toBe(false);
  });

  it('rest day with meal → active (case 3 partial)', () => {
    expect(isActiveDay(ate('2026-05-10'), planWithSundayRest, SUN)).toBe(true);
  });

  it('rest day with workout but no meal → still NOT active (rule B disabled on rest day)', () => {
    expect(isActiveDay(trained('2026-05-10'), planWithSundayRest, SUN)).toBe(false);
  });
});

describe('updateStreak — happy paths', () => {
  it('case 1: first ever active day → current=1, longest=1', () => {
    const r = updateStreak({
      today: MON,
      weekActivity: [ate('2026-05-04')],
      plan: noPlan,
      prev: initial,
    });
    expect(r.current).toBe(1);
    expect(r.longest).toBe(1);
    expect(r.lastActiveDate).toBe('2026-05-04');
    expect(r.reset).toBe(false);
  });

  it('case 2: 5 days in a row, all meals → current=5', () => {
    const week = [ate('2026-05-04'), ate('2026-05-05'), ate('2026-05-06'), ate('2026-05-07'), ate('2026-05-08')];
    const r = updateStreak({
      today: FRI,
      weekActivity: week,
      plan: noPlan,
      prev: { current: 4, longest: 4, lastActiveDate: '2026-05-07' },
    });
    expect(r.current).toBe(5);
    expect(r.graceUsed).toBe(0);
  });

  it('case 3: 5 days streak, day 6 is rest day + meal → current=6', () => {
    const r = updateStreak({
      today: SUN,
      weekActivity: [
        ate('2026-05-04'),
        ate('2026-05-05'),
        ate('2026-05-06'),
        ate('2026-05-07'),
        ate('2026-05-08'),
        ate('2026-05-09'),
        ate('2026-05-10'),
      ],
      plan: planWithSundayRest,
      prev: { current: 5, longest: 5, lastActiveDate: '2026-05-09' },
    });
    expect(r.current).toBe(6);
  });

  it('case 4: rest day with NO meal → grace used, current preserved', () => {
    const r = updateStreak({
      today: SUN,
      weekActivity: [
        ate('2026-05-04'),
        ate('2026-05-05'),
        ate('2026-05-06'),
        ate('2026-05-07'),
        ate('2026-05-08'),
        ate('2026-05-09'),
        // Sunday: no activity at all
      ],
      plan: planWithSundayRest,
      prev: { current: 6, longest: 6, lastActiveDate: '2026-05-09' },
    });
    expect(r.current).toBe(6); // unchanged
    expect(r.reset).toBe(false);
    expect(r.graceUsed).toBe(1);
  });
});

describe('updateStreak — grace budget edge cases', () => {
  it('case 5: miss Mon+Tue, then active Wed-Sun → current=5, graceUsed=2 (within budget)', () => {
    const week = [
      blank('2026-05-04'), // miss
      blank('2026-05-05'), // miss
      ate('2026-05-06'),
      ate('2026-05-07'),
      ate('2026-05-08'),
      ate('2026-05-09'),
      ate('2026-05-10'),
    ];
    const r = updateStreak({
      today: SUN,
      weekActivity: week,
      plan: noPlan,
      prev: { current: 4, longest: 4, lastActiveDate: '2026-05-09' },
    });
    expect(r.current).toBe(5);
    expect(r.graceUsed).toBe(2);
    expect(r.reset).toBe(false);
  });

  it('case 6: miss 3 days → reset to 0 on the 3rd missed day', () => {
    // Mon active, Tue+Wed miss → graceUsed=2 still ok
    // Thu miss → graceUsed=3 → reset
    const r = updateStreak({
      today: THU,
      weekActivity: [ate('2026-05-04'), blank('2026-05-05'), blank('2026-05-06'), blank('2026-05-07')],
      plan: noPlan,
      prev: { current: 1, longest: 5, lastActiveDate: '2026-05-04' },
    });
    expect(r.current).toBe(0);
    expect(r.reset).toBe(true);
    expect(r.longest).toBe(5); // longest preserved
    expect(r.graceUsed).toBe(3);
  });

  it('case 8: workout day, log meal only (no workout) → still active', () => {
    const r = updateStreak({
      today: WED,
      weekActivity: [ate('2026-05-04'), ate('2026-05-05'), ate('2026-05-06')],
      plan: noPlan,
      prev: { current: 2, longest: 2, lastActiveDate: '2026-05-05' },
    });
    expect(r.current).toBe(3);
  });

  it('idempotency: re-running same `today` does not double-bump', () => {
    const args = {
      today: MON,
      weekActivity: [ate('2026-05-04')],
      plan: noPlan,
      prev: { current: 1, longest: 1, lastActiveDate: '2026-05-04' },
    };
    const r = updateStreak(args);
    expect(r.current).toBe(1);
    expect(r.longest).toBe(1);
  });

  it('case 10: new week resets grace budget', () => {
    // Previous week burned grace; this week (current week) is fresh.
    // Caller passes only current-week activity, so grace count restarts.
    const NEXT_MON = new Date('2026-05-11T08:00:00');
    const r = updateStreak({
      today: NEXT_MON,
      weekActivity: [ate('2026-05-11')],
      plan: noPlan,
      prev: { current: 5, longest: 5, lastActiveDate: '2026-05-10' },
    });
    expect(r.current).toBe(6);
    expect(r.graceUsed).toBe(0);
  });
});
