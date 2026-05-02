// Server-side Web Push sender.
// Used by Inngest functions and Server Actions to push notifications to users.
// Requires VAPID env vars (VAPID_PRIVATE_KEY, NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_SUBJECT).

import webpush from 'web-push';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { pushSubscriptions } from '@/lib/db/schema';

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT ?? 'mailto:admin@coachly.app';

if (PUBLIC_KEY && PRIVATE_KEY) {
  webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
};

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!PUBLIC_KEY || !PRIVATE_KEY) return; // silently skip if not configured

  const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));

  const json = JSON.stringify(payload);
  const stale: string[] = [];

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, json);
      } catch (err: unknown) {
        // 410 = subscription expired; clean up.
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 410 || status === 404) stale.push(sub.endpoint);
      }
    }),
  );

  if (stale.length > 0) {
    await Promise.allSettled(
      stale.map((endpoint) => db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint))),
    );
  }
}
