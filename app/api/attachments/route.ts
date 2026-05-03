// POST /api/attachments
// Receives a resized JPEG from the client (FormData field "file" + "kind").
// Uploads to a *private* Vercel Blob store and returns { id, url } where
// `url` is our own auth-gated proxy (`/api/attachments/<id>`) — never the
// raw blob URL. The proxy keeps photos behind session auth (PDPA) while
// still letting <img src=> work for the user who uploaded it.
//
// For the AI vision call: chat/route.ts walks user file parts before
// streaming and inlines the bytes as a base64 `data:` URI in the message
// to Kimi (which can't authenticate to our proxy).
//
// PDPA rules (topics/pdpa.md):
//   food_photo     → 30-day retention in Blob
//   body_photo     → NO blob; Kimi analyses then discards; text-only
//   equipment_photo → 30-day retention

import { put } from '@vercel/blob';
import { auth } from '@/lib/auth';
import { create } from '@/lib/db/repositories/attachments';

export const runtime = 'nodejs';
// Vercel default body limit on Hobby is 4.5 MB; client always resizes to
// 768px JPEG (~100–500 KB) so this is well under the limit.
export const maxDuration = 30;

const ALLOWED_KINDS = ['food_photo', 'equipment_photo'] as const;
type AttachmentKind = (typeof ALLOWED_KINDS)[number];

const EXPIRY_DAYS = 30; // PDPA: food/equipment photos max 30 days

function err(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return err('unauthorized', 401);
  const userId = session.user.id;

  // Required to talk to Vercel Blob — surface a clear message rather than a
  // cryptic SDK throw if the env var was missed in deployment setup.
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('[attachments] BLOB_READ_WRITE_TOKEN missing on server');
    return err('storage not configured (BLOB_READ_WRITE_TOKEN missing)', 500);
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (e) {
    console.error('[attachments] formData parse failed', e);
    return err('invalid form data', 400);
  }

  const file = formData.get('file');
  const kind = (formData.get('kind') ?? 'food_photo') as AttachmentKind;

  if (!(file instanceof Blob)) return err('file field required', 400);
  if (!ALLOWED_KINDS.includes(kind)) return err(`invalid kind: ${kind}`, 400);

  if (file.size > 5 * 1024 * 1024) return err('file too large (max 5 MB)', 413);
  if (file.size === 0) return err('file is empty', 400);

  const contentType = file.type || 'image/jpeg';
  const ext = contentType === 'image/png' ? 'png' : 'jpg';
  const blobPath = `attachments/${userId}/${Date.now()}.${ext}`;

  let blobUrl: string;
  try {
    const blob = await put(blobPath, file, { access: 'private', contentType });
    blobUrl = blob.url;
  } catch (e) {
    console.error('[attachments] blob put failed', { e, blobPath, size: file.size });
    return err('upload to storage failed — ลองใหม่อีกครั้ง', 502);
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + EXPIRY_DAYS);

  try {
    const row = await create({
      userId,
      kind,
      blobUrl,
      contentType,
      byteSize: file.size,
      expiresAt,
    });
    // Return the auth-gated proxy URL so the browser <img>, the chat send
    // round-trip, and historical hydration all reference the same shape.
    return Response.json({ id: row.id, url: `/api/attachments/${row.id}` });
  } catch (e) {
    console.error('[attachments] db insert failed', { e, blobPath });
    return err('saved to storage but failed to record — refresh and try again', 500);
  }
}
