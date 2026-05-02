// photo-expiry — daily PDPA cleanup job.
// Deletes expired attachment Blobs from Vercel Blob storage, then soft-deletes the DB rows.

import { lte, isNull, and } from 'drizzle-orm';
import { del } from '@vercel/blob';
import { inngest } from '../client';
import { db } from '@/lib/db/client';
import { attachments } from '@/lib/db/schema';

export const photoExpiry = inngest.createFunction(
  {
    id: 'photo-expiry',
    name: 'Photo Expiry (PDPA cleanup)',
    triggers: [{ cron: '0 2 * * *' }], // 02:00 UTC = 09:00 ICT daily
  },
  async ({ step }) => {
    const now = new Date();

    const expired = await step.run('find-expired', () =>
      db
        .select({ id: attachments.id, blobUrl: attachments.blobUrl })
        .from(attachments)
        .where(and(lte(attachments.expiresAt, now), isNull(attachments.deletedAt))),
    );

    if (expired.length === 0) return { deleted: 0 };

    // Delete actual Blob files first (best-effort — DB row cleanup follows regardless).
    await step.run('delete-blobs', async () => {
      const urls = expired.map((r) => r.blobUrl).filter(Boolean) as string[];
      if (urls.length > 0) {
        await del(urls).catch(() => undefined);
      }
    });

    const deleted = await step.run('soft-delete-rows', () =>
      db
        .update(attachments)
        .set({ deletedAt: now })
        .where(and(lte(attachments.expiresAt, now), isNull(attachments.deletedAt)))
        .returning({ id: attachments.id }),
    );

    return { deleted: deleted.length };
  },
);
