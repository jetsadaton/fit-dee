// Streaming chat endpoint — backbone of /chat.
//
// Pipeline:
//   useChat client  →  POST /api/chat  →  auth + rate limit
//                                       →  getOrCreate(thread)
//                                       →  loadMemoryContext + buildSystemPrompt
//                                       →  streamText(kimi)
//                                       →  toUIMessageStreamResponse
//                                       →  onFinish: persist user + assistant
//                                          messages with kimi telemetry
//
// Node runtime (not edge) for now — node:crypto in rate-limit.ts and
// Drizzle's HTTP driver both work in Node. Move to edge after we confirm
// streaming latency under prod traffic.

import { revalidatePath } from 'next/cache';
import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from 'ai';
import { auth } from '@/lib/auth';
import { kimi, DEFAULT_MODEL } from '@/lib/ai/kimi';
import { loadMemoryContext } from '@/lib/ai/memory';
import { buildSystemPrompt, PROMPT_VERSION } from '@/lib/ai/prompts/system-v2';
import { checkChatLimit } from '@/lib/ai/rate-limit';
import { createCoachTools } from '@/lib/ai/tools';
import { getOrCreate as getOrCreateThread, touch as touchThread } from '@/lib/db/repositories/chat-threads';
import { create as createMessage } from '@/lib/db/repositories/messages';
import { findByBlobUrls as findAttachmentsByBlobUrls } from '@/lib/db/repositories/attachments';
import type { ToolCall } from '@/lib/types/db/chat';

export const runtime = 'nodejs';
export const maxDuration = 30; // seconds — Vercel default for Hobby tier

type ChatRequestBody = {
  messages: UIMessage[];
};

export async function POST(req: Request) {
  // 1. Auth — userId NEVER trusted from request body.
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }
  const userId = session.user.id;

  // 2. Rate limit — 30 turns/hour/user.
  const limit = await checkChatLimit(userId);
  if (!limit.success) {
    return new Response('Too many requests', {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil((limit.reset - Date.now()) / 1000)),
        'X-RateLimit-Limit': String(limit.limit),
        'X-RateLimit-Remaining': String(limit.remaining),
        'X-RateLimit-Reset': String(limit.reset),
      },
    });
  }

  // 3. Parse + validate.
  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return new Response('messages required', { status: 400 });
  }

  // 4. Resolve thread + memory in parallel.
  const [thread, memory] = await Promise.all([getOrCreateThread(userId), loadMemoryContext(userId)]);

  // 5. The latest user message — we'll persist it on success so an aborted
  //    request doesn't leave an orphaned row.
  const latest = body.messages[body.messages.length - 1];
  const latestUserText =
    latest && latest.role === 'user'
      ? latest.parts
          .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
          .map((p) => p.text)
          .join('\n')
      : '';
  // File parts arrive with the public Blob URL (set by /api/attachments).
  // Resolve back to attachment row IDs so historical views can re-render the image.
  // TODO: tighten this duck-type when the AI SDK's part union stabilizes.
  const latestUserBlobUrls: string[] =
    latest && latest.role === 'user'
      ? latest.parts.flatMap((p) =>
          p.type === 'file' && typeof (p as { url?: unknown }).url === 'string' ? [(p as { url: string }).url] : [],
        )
      : [];

  // Persist the user turn BEFORE streaming starts. If we wait for `onFinish`,
  // a user who sends a message and navigates away before the LLM stream
  // completes will lose their message — `onFinish` fires whenever the LLM
  // call ends server-side, but if the user returns to /chat in the meantime
  // the page hydration only sees what's in the DB. Persisting up front means
  // the user message survives navigation regardless of stream completion.
  // Trade-off: a failed/aborted assistant response leaves an orphan user
  // turn (no reply). Better than silently dropping the input.
  if (latestUserText || latestUserBlobUrls.length > 0) {
    try {
      const ownedAttachments =
        latestUserBlobUrls.length > 0 ? await findAttachmentsByBlobUrls(userId, latestUserBlobUrls) : [];
      await createMessage({
        threadId: thread.id,
        userId,
        role: 'user',
        content: latestUserText || null,
        attachments: ownedAttachments.length > 0 ? ownedAttachments.map((a) => a.id) : undefined,
      });
    } catch (err) {
      console.error('[chat] persist user msg failed', { err, threadId: thread.id });
    }
  }

  const systemPrompt = buildSystemPrompt(memory);
  const startedAt = Date.now();
  const modelMessages = await convertToModelMessages(body.messages);

  // Cost/latency: thinking mode roughly triples token usage and time, but is
  // worth it for vision (the model has to read what's in the photo before
  // reasoning). Plain text chat — including tool flows like log_food /
  // create_workout_plan — runs fine without it. Check ALL messages, not
  // just the latest, because a follow-up question may still reference an
  // image earlier in the thread.
  const hasImage = body.messages.some(
    (m) =>
      m.role === 'user' &&
      m.parts.some(
        (p) =>
          p.type === 'file' &&
          'mediaType' in p &&
          typeof (p as { mediaType?: unknown }).mediaType === 'string' &&
          (p as { mediaType: string }).mediaType.startsWith('image/'),
      ),
  );

  const result = streamText({
    model: kimi(DEFAULT_MODEL),
    system: systemPrompt,
    messages: modelMessages,
    // K2.6 with thinking requires temperature=1; without thinking, lower temp
    // gives more deterministic tool calls.
    temperature: hasImage ? 1 : 0.7,
    tools: createCoachTools(userId),
    stopWhen: stepCountIs(5),
    // tool_choice defaults to 'auto'; required when thinking is enabled.
    providerOptions: hasImage ? { kimi: { thinking: { type: 'enabled' } } } : undefined,

    onFinish: async ({ text, usage, response, steps }) => {
      const latencyMs = Date.now() - startedAt;
      const requestId = response?.id ?? null;

      // User turn already persisted before streamText (so it survives nav-away).
      // Here we only persist the assistant turn + tool-call trace.
      try {
        // Collect tool calls + results across all steps for in-DB tracing.
        // Cast through unknown: AI SDK v6 uses `input`/`output` (not `args`/`result`).
        const toolCalls: ToolCall[] = (steps ?? []).flatMap((step) => {
          const calls = step.toolCalls as unknown as Array<{ toolName: string; input: unknown; toolCallId: string }>;
          const results = step.toolResults as unknown as Array<{ toolCallId: string; output: unknown }> | undefined;
          return (calls ?? []).map((tc) => ({
            name: tc.toolName,
            arguments: tc.input as Record<string, unknown>,
            result: results?.find((tr) => tr.toolCallId === tc.toolCallId)?.output as
              | Record<string, unknown>
              | undefined,
          }));
        });

        await createMessage({
          threadId: thread.id,
          userId,
          role: 'assistant',
          content: text || null,
          toolCalls: toolCalls.length > 0 ? toolCalls : null,
          kimiRequestId: requestId,
          tokenIn: usage?.inputTokens ?? null,
          tokenOut: usage?.outputTokens ?? null,
          latencyMs,
        });
        await touchThread(thread.id);
        // Invalidate /chat cache so a user who navigated away mid-stream sees
        // the assistant turn on return without a manual refresh. Also invalidate
        // /plan in case create_workout_plan or update_profile fired, and /today
        // for any food/water/weight/mood/exercise log changes.
        revalidatePath('/chat');
        revalidatePath('/plan');
        revalidatePath('/today');
      } catch (err) {
        // Non-fatal — the stream already delivered to the user; we only
        // lost the trace row. Log so production can investigate.
        console.error('[chat] persist failed', { err, threadId: thread.id, promptVersion: PROMPT_VERSION });
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
