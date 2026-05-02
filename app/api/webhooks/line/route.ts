// LINE OA Webhook — receives chat messages from LINE users.
//
// Flow:
//   LINE → POST /api/webhooks/line
//     → verify HMAC-SHA256 signature
//     → lookup userId from lineSub
//     → load memory + run Kimi (same pipeline as /api/chat)
//     → reply via LINE Reply API
//
// Required env vars:
//   LINE_CHANNEL_SECRET       — from LINE Developers console (Messaging API channel)
//   LINE_CHANNEL_ACCESS_TOKEN — channel access token (long-lived)
//
// To wire up: set Webhook URL in LINE Developers → Messaging API → Webhook settings
//   https://<your-domain>/api/webhooks/line

import { createHmac } from 'node:crypto';
import { convertToModelMessages, generateText, stepCountIs, type UIMessage } from 'ai';
import { kimi, DEFAULT_MODEL } from '@/lib/ai/kimi';
import { buildSystemPrompt } from '@/lib/ai/prompts/system-v2';
import { loadMemoryContext } from '@/lib/ai/memory';
import { createCoachTools } from '@/lib/ai/tools';
import { findByLineSub } from '@/lib/db/repositories/users';
import { getOrCreate as getOrCreateThread } from '@/lib/db/repositories/chat-threads';
import { create as createMessage } from '@/lib/db/repositories/messages';

export const runtime = 'nodejs';

const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;
const CHANNEL_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

// ── signature verification ────────────────────────────────────────────

function verifySignature(body: string, signature: string): boolean {
  if (!CHANNEL_SECRET) return false;
  const hmac = createHmac('sha256', CHANNEL_SECRET).update(body, 'utf8').digest('base64');
  return hmac === signature;
}

// ── LINE Messaging API types (minimal) ───────────────────────────────

type LineTextMessage = { type: 'text'; text: string };
type LineEvent = {
  type: 'message';
  replyToken: string;
  source: { type: 'user'; userId: string };
  message: LineTextMessage;
};
type LineWebhookBody = { events: LineEvent[] };

// ── reply helper ──────────────────────────────────────────────────────

async function replyText(replyToken: string, text: string): Promise<void> {
  if (!CHANNEL_TOKEN) return;
  await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${CHANNEL_TOKEN}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: 'text', text }],
    }),
  });
}

// ── main handler ──────────────────────────────────────────────────────

export async function POST(req: Request) {
  // 1. Verify webhook signature.
  const signature = req.headers.get('x-line-signature') ?? '';
  const rawBody = await req.text();
  if (!verifySignature(rawBody, signature)) {
    return new Response('Invalid signature', { status: 401 });
  }

  const { events } = JSON.parse(rawBody) as LineWebhookBody;

  // Process each message event (fan-out, best-effort).
  await Promise.allSettled(
    events
      .filter((e): e is LineEvent => e.type === 'message' && e.message.type === 'text')
      .map(async (event) => {
        const lineSub = event.source.userId;
        const userText = event.message.text.trim();
        if (!userText) return;

        // 2. Resolve Coachly user from LINE sub.
        const user = await findByLineSub(lineSub);
        if (!user) {
          await replyText(event.replyToken, 'กรุณาเข้าสู่ระบบ Coachly ก่อนนะ 🙏 https://coachly.app');
          return;
        }

        // 3. Load context + run AI (non-streaming — LINE requires a single reply).
        const [thread, memory] = await Promise.all([getOrCreateThread(user.id), loadMemoryContext(user.id)]);
        const systemPrompt = buildSystemPrompt(memory);

        const uiMessages: UIMessage[] = [{ id: '1', role: 'user', parts: [{ type: 'text', text: userText }] }];
        const modelMessages = await convertToModelMessages(uiMessages);

        const { text } = await generateText({
          model: kimi(DEFAULT_MODEL),
          system: systemPrompt,
          messages: modelMessages,
          temperature: 1,
          tools: createCoachTools(user.id),
          stopWhen: stepCountIs(3),
        });

        const reply = text.trim() || 'โค้ชดีรับทราบแล้วนะ 👍';

        // 4. Persist + reply.
        await Promise.allSettled([
          createMessage({ threadId: thread.id, userId: user.id, role: 'user', content: userText }),
          createMessage({ threadId: thread.id, userId: user.id, role: 'assistant', content: reply }),
        ]);
        await replyText(event.replyToken, reply);
      }),
  );

  // LINE requires 200 OK within 1 second of receiving the webhook.
  return new Response('OK', { status: 200 });
}
