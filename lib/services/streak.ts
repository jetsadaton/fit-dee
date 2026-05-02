// Streak calculator.
//
// SOURCE OF TRUTH (rules + numbers): .claude/topics/streak.md
// Pure functions only. Caller (Inngest job in Phase 3) reads from repos and
// writes back to the `streaks` table.

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

/** Subset of WeekPlan needed for streak — full type lives in workout-plans repo (Phase 1+). */
export type WorkoutWeekPlan = {
  days: Partial<Record<DayKey, { rest_day?: boolean }>>;
};

/** Minimal events the streak calc cares about per day. Caller shapes these from repos. */
export type DailyActivity = {
  /** YYYY-MM-DD in user tz. Stable across DST. */
  date: string;
  ateAtLeastOneMeal: boolean;
  finishedAtLeastOneWorkout: boolean;
};

const MAX_GRACE_PER_WEEK = 2;

const DAY_KEYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

// ─── per-day check ───────────────────────────────────────────────────

/** Maps a JS Date to a DayKey, with Monday = first day of week. */
export function dayKeyOf(date: Date): DayKey {
  // getDay: Sun=0, Mon=1, ..., Sat=6 → shift so Mon=0, Sun=6
  const idx = (date.getDay() + 6) % 7;
  return DAY_KEYS[idx]!;
}

export function isActiveDay(activity: DailyActivity, plan: WorkoutWeekPlan | null, date: Date): boolean {
  // Rule A (always counts): user logged a meal
  if (activity.ateAtLeastOneMeal) return true;

  // Rule B (only on workout days): user finished a workout session
  const dayKey = dayKeyOf(date);
  const isRestDay = plan?.days?.[dayKey]?.rest_day === true;
  if (isRestDay) return false; // rest day → meal-only path; workout doesn't help here
  return activity.finishedAtLeastOneWorkout;
}

// ─── week budget ─────────────────────────────────────────────────────

/** Returns the Monday (00:00 user tz) of the calendar week containing `date`. */
export function mondayOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const offset = (d.getDay() + 6) % 7; // Mon=0..Sun=6
  d.setDate(d.getDate() - offset);
  return d;
}

/** Days in the same calendar week as `date`, up to and including `date`. */
function daysInWeekUpTo(date: Date): Date[] {
  const monday = mondayOfWeek(date);
  const days: Date[] = [];
  const cursor = new Date(monday);
  while (cursor <= date) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

// ─── streak update ───────────────────────────────────────────────────

export type StreakState = {
  current: number;
  longest: number;
  /** YYYY-MM-DD of last day deemed active. Null if streak never started. */
  lastActiveDate: string | null;
};

export type StreakUpdateInput = {
  /** Today (in user tz). */
  today: Date;
  /** All days this calendar week up to `today` — caller must include rest days. */
  weekActivity: DailyActivity[];
  plan: WorkoutWeekPlan | null;
  prev: StreakState;
};

export type StreakUpdateResult = StreakState & {
  /** True iff this run zeroed `current` (caller may emit a "you broke streak" insight). */
  reset: boolean;
  /** How many grace days have been used this calendar week (≤ MAX_GRACE_PER_WEEK). */
  graceUsed: number;
};

/**
 * Run nightly (per .claude/topics/streak.md §3). Idempotent for the same `today`:
 * caller can re-run on backfill without double-counting.
 */
export function updateStreak(input: StreakUpdateInput): StreakUpdateResult {
  const { today, weekActivity, plan, prev } = input;

  const isoToday = toISODate(today);
  const activityByDate = new Map(weekActivity.map((a) => [a.date, a]));

  // Count misses in current calendar week up to (and including) today.
  const weekDays = daysInWeekUpTo(today);
  let graceUsed = 0;
  for (const d of weekDays) {
    const iso = toISODate(d);
    const a = activityByDate.get(iso) ?? { date: iso, ateAtLeastOneMeal: false, finishedAtLeastOneWorkout: false };
    if (!isActiveDay(a, plan, d)) graceUsed += 1;
  }

  const todayActivity = activityByDate.get(isoToday) ?? {
    date: isoToday,
    ateAtLeastOneMeal: false,
    finishedAtLeastOneWorkout: false,
  };
  const todayActive = isActiveDay(todayActivity, plan, today);

  // Branch 1: today active → bump streak (idempotent if last_active_date already today).
  if (todayActive) {
    if (prev.lastActiveDate === isoToday) {
      return { ...prev, reset: false, graceUsed };
    }
    const next = prev.current + 1;
    return {
      current: next,
      longest: Math.max(prev.longest, next),
      lastActiveDate: isoToday,
      reset: false,
      graceUsed,
    };
  }

  // Branch 2: today not active. Reset only if grace exceeded *this week*.
  if (graceUsed > MAX_GRACE_PER_WEEK) {
    return {
      current: 0,
      longest: prev.longest,
      lastActiveDate: prev.lastActiveDate,
      reset: prev.current > 0,
      graceUsed,
    };
  }

  // Within grace budget — streak unchanged.
  return { ...prev, reset: false, graceUsed };
}

// ─── helpers ─────────────────────────────────────────────────────────

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const __test__ = { MAX_GRACE_PER_WEEK, DAY_KEYS };
