// Messages repository.
// One row per chat turn (user / assistant / tool / system). The chat
// endpoint writes one row per message; the assistant row carries Kimi
// telemetry (`kimi_request_id`, `token_in`, `token_out`, `latency_ms`)
// — that's our in-DB tracing in lieu of Helicone.

import { and, asc, desc, eq, gte, isNull, lt } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { messages } from '@/lib/db/schema';
import type { Message, NewMessage } from '@/lib/types/db/chat';

const isLive = isNull(messages.deletedAt);

export async function findRecentByThread(threadId: string, limit = 20): Promise<Message[]> {
  const rows = await db
    .select()
    .from(messages)
    .where(and(eq(messages.threadId, threadId), isLive))
    .orderBy(desc(messages.createdAt))
    .limit(limit);
  // Caller wants oldest-first (chat reading order).
  return rows.reverse();
}

/** Strict chronological listing — used by memory builder + eval harness. */
export async function findByThreadAsc(threadId: string, limit = 200): Promise<Message[]> {
  return db
    .select()
    .from(messages)
    .where(and(eq(messages.threadId, threadId), isLive))
    .orderBy(asc(messages.createdAt))
    .limit(limit);
}

export async function create(input: NewMessage): Promise<Message> {
  const [row] = await db.insert(messages).values(input).returning();
  if (!row) throw new Error('messages.create: insert returned no row');
  return row;
}

/** All messages for a single calendar day in ICT (YYYY-MM-DD). Oldest first. */
export async function findByThreadAndDate(threadId: string, dateIct: string): Promise<Message[]> {
  const start = new Date(`${dateIct}T00:00:00+07:00`);
  const nextDay = new Date(start);
  nextDay.setUTCDate(start.getUTCDate() + 1);
  return db
    .select()
    .from(messages)
    .where(
      and(eq(messages.threadId, threadId), isLive, gte(messages.createdAt, start), lt(messages.createdAt, nextDay)),
    )
    .orderBy(asc(messages.createdAt));
}

export async function softDelete(id: string): Promise<void> {
  await db
    .update(messages)
    .set({ deletedAt: new Date() })
    .where(and(eq(messages.id, id), isLive));
}
