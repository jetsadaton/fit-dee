// Chat-threads repository.
// MVP keeps one open thread per user (Coachly is single-conversation by
// design); the schema reserves room for multi-thread later. `getOrCreate`
// returns the user's current thread, lazily inserting if none exists.

import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { chatThreads } from '@/lib/db/schema';
import type { ChatThread, NewChatThread } from '@/lib/types/db/chat';

const isLive = isNull(chatThreads.deletedAt);

export async function findById(id: string): Promise<ChatThread | undefined> {
  const rows = await db
    .select()
    .from(chatThreads)
    .where(and(eq(chatThreads.id, id), isLive))
    .limit(1);
  return rows[0];
}

export async function findLatestForUser(userId: string): Promise<ChatThread | undefined> {
  const rows = await db
    .select()
    .from(chatThreads)
    .where(and(eq(chatThreads.userId, userId), isLive))
    .orderBy(desc(chatThreads.lastMessageAt))
    .limit(1);
  return rows[0];
}

export async function create(input: NewChatThread): Promise<ChatThread> {
  const [row] = await db.insert(chatThreads).values(input).returning();
  if (!row) throw new Error('chat-threads.create: insert returned no row');
  return row;
}

/**
 * Returns the user's most recent thread or inserts a fresh one. Used by
 * the chat endpoint as the very first step of any /chat interaction.
 */
export async function getOrCreate(userId: string): Promise<ChatThread> {
  const existing = await findLatestForUser(userId);
  if (existing) return existing;
  return create({ userId });
}

export async function touch(id: string): Promise<void> {
  await db.update(chatThreads).set({ lastMessageAt: new Date() }).where(eq(chatThreads.id, id));
}
