// POST /api/attachments
// Receives a resized JPEG from the client (FormData field "file" + "kind").
// Uploads to Vercel Blob, inserts an attachments row, returns { id, url }.
//
// Phase 2: public Blob URL (Kimi vision needs direct URL access).
// Phase 3: migrate to private Blob + signed URL + enforce expiresAt.

import { put } from '@vercel/blob';
import { auth } from '@/lib/auth';
import { create } from '@/lib/db/repositories/attachments';

export const runtime = 'nodejs';

const ALLOWED_KINDS = ['food_photo', 'body_photo', 'equipment_photo'] as const;
type AttachmentKind = (typeof ALLOWED_KINDS)[number];

// 90-day expiry — owner must confirm in topics/pdpa.md
const EXPIRY_DAYS = 90;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });
  const userId = session.user.id;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return new Response('Invalid form data', { status: 400 });
  }

  const file = formData.get('file');
  const kind = (formData.get('kind') ?? 'food_photo') as AttachmentKind;

  if (!(file instanceof Blob)) return new Response('file required', { status: 400 });
  if (!ALLOWED_KINDS.includes(kind)) return new Response('invalid kind', { status: 400 });

  // 5 MB cap — large images should have been resized client-side
  if (file.size > 5 * 1024 * 1024) return new Response('file too large (max 5 MB)', { status: 413 });

  const contentType = file.type || 'image/jpeg';
  const ext = contentType === 'image/png' ? 'png' : 'jpg';

  // Upload to Vercel Blob
  const blobPath = `attachments/${userId}/${Date.now()}.${ext}`;
  const blob = await put(blobPath, file, { access: 'public', contentType });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + EXPIRY_DAYS);

  const row = await create({
    userId,
    kind,
    blobUrl: blob.url,
    contentType,
    byteSize: file.size,
    expiresAt,
  });

  return Response.json({ id: row.id, url: blob.url });
}
