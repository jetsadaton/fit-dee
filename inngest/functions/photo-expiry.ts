// photo-expiry — daily PDPA cleanup job.
// Food photos expire after 30 days per pdpa.md; soft-deletes expired rows.

import { lte, isNull, and } from 'drizzle-orm';
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
        .select({ id: attachments.id })
        .from(attachments)
        .where(and(lte(attachments.expiresAt, now), isNull(attachments.deletedAt))),
    );

    if (expired.length === 0) return { deleted: 0 };

    const deleted = await step.run('soft-delete', () =>
      db
        .update(attachments)
        .set({ deletedAt: now })
        .where(and(lte(attachments.expiresAt, now), isNull(attachments.deletedAt)))
        .returning({ id: attachments.id }),
    );

    return { deleted: deleted.length };
  },
);
