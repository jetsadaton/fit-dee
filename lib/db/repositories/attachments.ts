import { and, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { attachments } from '@/lib/db/schema';
import type { Attachment, NewAttachment } from '@/lib/types/db/attachments';

export async function create(input: NewAttachment): Promise<Attachment> {
  const [row] = await db.insert(attachments).values(input).returning();
  if (!row) throw new Error('attachments.create: insert returned no row');
  return row;
}

export async function findById(id: string): Promise<Attachment | undefined> {
  const [row] = await db
    .select()
    .from(attachments)
    .where(and(eq(attachments.id, id), isNull(attachments.deletedAt)));
  return row;
}

/** Batch lookup by IDs, scoped to user for safety. */
export async function findByIds(userId: string, ids: string[]): Promise<Attachment[]> {
  if (ids.length === 0) return [];
  return db
    .select()
    .from(attachments)
    .where(and(eq(attachments.userId, userId), inArray(attachments.id, ids), isNull(attachments.deletedAt)));
}

/** Batch lookup by Blob URLs, scoped to user. Used when persisting user messages
 *  that arrive with file parts (which carry only the public URL, not the row ID). */
export async function findByBlobUrls(userId: string, urls: string[]): Promise<Attachment[]> {
  if (urls.length === 0) return [];
  return db
    .select()
    .from(attachments)
    .where(and(eq(attachments.userId, userId), inArray(attachments.blobUrl, urls), isNull(attachments.deletedAt)));
}

export async function softDelete(id: string): Promise<void> {
  await db
    .update(attachments)
    .set({ deletedAt: new Date() })
    .where(and(eq(attachments.id, id), isNull(attachments.deletedAt)));
}
