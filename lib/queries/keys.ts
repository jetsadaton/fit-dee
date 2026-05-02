// Centralised query key factory for TanStack Query.
//
// Why central:
// - Coachly's data model is aggregate-based (users, foods, plans, ...) and
//   most aggregates are read from many islands. Sharing one key tree avoids
//   stale-cache bugs ("logged water but kcal ring didn't update" = mismatched
//   keys between hook and invalidator).
// - Server Actions invalidate via these helpers so call sites never write a
//   stringly-typed array literal.
//
// Conventions:
// - Each aggregate exposes `.all` (the root key) and helpers that *spread*
//   `.all` so partial invalidation works (e.g. invalidate everything under
//   ['food-logs'] vs only ['food-logs', 'today']).
// - Date params travel as YYYY-MM-DD strings in the user's tz so cache keys
//   stay stable across timezone shifts.
//
// Add a new aggregate here, do NOT inline `useQuery({ queryKey: ['foo'] })`.

export const queryKeys = {
  users: {
    all: ['users'] as const,
    me: () => [...queryKeys.users.all, 'me'] as const,
    byId: (id: string) => [...queryKeys.users.all, 'byId', id] as const,
  },
  /**
   * The unified read model that backs /today. Server Actions for water /
   * mood / weight invalidate this single key after a successful mutation,
   * triggering the RSC refetch (we don't store the snapshot in the
   * client cache — it's RSC-resolved — but the key exists so optimistic
   * islands can opt in to manual cache writes when needed).
   */
  dailyDashboard: {
    all: ['daily-dashboard'] as const,
    today: () => [...queryKeys.dailyDashboard.all, 'today'] as const,
  },
  // AI-generated insights keyed by range + ICT date so they refresh at midnight.
  // staleTime: Infinity — fetched once per (range, day) pair, never auto-refetched.
  insights: {
    all: ['insights'] as const,
    byRange: (range: string, dateIct: string) => [...queryKeys.insights.all, range, dateIct] as const,
  },
  // Add aggregates as services land:
  // foodLogs:       { all: ['food-logs']       as const, today: () => [...]      }
  // workoutPlans:   { all: ['workout-plans']   as const, current: () => [...]    }
  // chatMessages:   { all: ['chat-messages']   as const, recent: (n=20) => [...] }
} as const;
