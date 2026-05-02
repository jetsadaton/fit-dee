// Memory-blocks repository.
// One row per user — three text blocks injected into every system prompt:
//   profile_block — frozen TDEE / macros line (refreshed on profile edit)
//   summary_7d    — rolling 7-day summary (Inngest nightly job, Phase 3)
//   notes         — user-pinned notes ("แพ้ถั่ว", "ออกตอนเช้า")

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { memoryBlocks } from '@/lib/db/schema';
import type { MemoryBlock, NewMemoryBlock } from '@/lib/types/db/chat';

export async function findByUserId(userId: string): Promise<MemoryBlock | undefined> {
  const rows = await db.select().from(memoryBlocks).where(eq(memoryBlocks.userId, userId)).limit(1);
  return rows[0];
}

/** Insert or refresh — version bumps on every write so prompt builder can cache. */
export async function upsert(input: NewMemoryBlock): Promise<MemoryBlock> {
  const [row] = await db
    .insert(memoryBlocks)
    .values(input)
    .onConflictDoUpdate({
      target: memoryBlocks.userId,
      set: {
        profileBlock: input.profileBlock,
        summary7d: input.summary7d,
        notes: input.notes,
        updatedAt: new Date(),
      },
    })
    .returning();
  if (!row) throw new Error('memory-blocks.upsert: insert returned no row');
  return row;
}
