// Users repository — only file allowed to query the `users` table.
//
// Layering (rules/backend.md):
//   Server Action / Route Handler  →  Service  →  Repository  →  Drizzle
// Auth.js callback (Phase 1) calls `findByLineSub` / `findByGoogleSub`,
// then `create` if missing.
//
// Soft-delete contract: every read filters `deleted_at IS NULL` so tombstoned
// rows are invisible to product code. Hard-delete only via the PDPA pipeline.

import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import type { NewUser, User } from '@/lib/types/db/users';

const isLive = isNull(users.deletedAt);

export async function findById(id: string): Promise<User | undefined> {
  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), isLive))
    .limit(1);
  return rows[0];
}

export async function findByLineSub(sub: string): Promise<User | undefined> {
  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.lineSub, sub), isLive))
    .limit(1);
  return rows[0];
}

export async function findByGoogleSub(sub: string): Promise<User | undefined> {
  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.googleSub, sub), isLive))
    .limit(1);
  return rows[0];
}

// Auth.js maps an OAuth callback to either a new row or a returning user.
// Caller decides which sub field to populate; never both at once on insert
// (linking secondary providers happens later via a dedicated `linkGoogle`
// service, not here).
export async function create(
  input: Pick<NewUser, 'lineSub' | 'googleSub' | 'email' | 'locale' | 'consents'>,
): Promise<User> {
  const [row] = await db.insert(users).values(input).returning();
  if (!row) throw new Error('users.create: insert returned no row');
  return row;
}

// Soft-delete (PDPA "ผู้ใช้ขอลบ"). Cascade hardening for blob assets is the
// PDPA pipeline's job, not this repo.
export async function softDelete(id: string): Promise<void> {
  await db
    .update(users)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(users.id, id), isLive));
}
