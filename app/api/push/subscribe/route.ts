// POST /api/push/subscribe — save a new Web Push subscription for the authed user.
// DELETE /api/push/subscribe — remove subscription by endpoint.

import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { pushSubscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

type PushSubscriptionBody = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });

  const body = (await req.json()) as PushSubscriptionBody;
  if (!body?.endpoint || !body?.keys?.p256dh || !body?.keys?.auth) {
    return new Response('Invalid subscription', { status: 400 });
  }

  await db
    .insert(pushSubscriptions)
    .values({
      userId: session.user.id,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { userId: session.user.id },
    });

  return new Response(null, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });

  const { endpoint } = (await req.json()) as { endpoint: string };
  if (!endpoint) return new Response('Missing endpoint', { status: 400 });

  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));

  return new Response(null, { status: 204 });
}
