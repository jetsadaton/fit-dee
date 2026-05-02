// DB row types for the `users` aggregate (read shape).
//
// Per rules/types.md (TBD): files in lib/types/db/* mirror the Drizzle schema
// 1:1. They are server-only — never returned from API/Server Actions directly;
// callers map to a DTO in lib/types/dto/* before crossing the boundary.

import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import type { users, userProfiles } from '@/lib/db/schema';

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type UserProfile = InferSelectModel<typeof userProfiles>;
export type NewUserProfile = InferInsertModel<typeof userProfiles>;

// Versioned consent payload stored in users.consents (jsonb).
// Format: 'v<n>@<YYYY-MM-DD>' so we never overwrite history silently.
export type Consents = {
  tos?: string;
  pdpa?: string;
  marketing?: boolean;
};
