// GET /api/attachments/[id]
// Auth-gated proxy for private Vercel Blob attachments. The chat client
// renders <img src="/api/attachments/<id>"> and historical messages refer
// to attachments by this URL shape — never the raw blob URL.
//
// We could revalidate ownership on every fetch, but the URL is opaque
// (UUID) and only emitted to the owning user; a session check + ownership
// match is enough.

import { get } from '@vercel/blob';
import { auth } from '@/lib/auth';
import { findById } from '@/lib/db/repositories/attachments';

export const runtime = 'nodejs';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });
  const userId = session.user.id;

  const { id } = await ctx.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return new Response('Bad id', { status: 400 });
  }

  const att = await findById(id);
  if (!att || att.userId !== userId) return new Response('Not found', { status: 404 });

  try {
    const result = await get(att.blobUrl, { access: 'private' });
    if (!result || result.statusCode !== 200) return new Response('Not found', { status: 404 });
    return new Response(result.stream, {
      headers: {
        'Content-Type': att.contentType,
        // Private to this user; safe to cache in their browser for the day.
        'Cache-Control': 'private, max-age=86400, immutable',
      },
    });
  } catch (e) {
    console.error('[attachments/get] blob fetch failed', { e, id });
    return new Response('Storage error', { status: 502 });
  }
}
