import { and, eq, isNull } from 'drizzle-orm';
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

export async function softDelete(id: string): Promise<void> {
  await db
    .update(attachments)
    .set({ deletedAt: new Date() })
    .where(and(eq(attachments.id, id), isNull(attachments.deletedAt)));
}
