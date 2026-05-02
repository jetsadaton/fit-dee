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

import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from 'ai';
import { auth } from '@/lib/auth';
import { kimi, DEFAULT_MODEL } from '@/lib/ai/kimi';
import { loadMemoryContext } from '@/lib/ai/memory';
import { buildSystemPrompt, PROMPT_VERSION } from '@/lib/ai/prompts/system-v1';
import { checkChatLimit } from '@/lib/ai/rate-limit';
import { createCoachTools } from '@/lib/ai/tools';
import { getOrCreate as getOrCreateThread, touch as touchThread } from '@/lib/db/repositories/chat-threads';
import { create as createMessage } from '@/lib/db/repositories/messages';
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

  const systemPrompt = buildSystemPrompt(memory);
  const startedAt = Date.now();
  const modelMessages = await convertToModelMessages(body.messages);

  const result = streamText({
    model: kimi(DEFAULT_MODEL),
    system: systemPrompt,
    messages: modelMessages,
    temperature: 1, // kimi-k2.6 with thinking mode requires temperature = 1
    tools: createCoachTools(userId),
    stopWhen: stepCountIs(5),
    // Kimi K2.6 extended thinking — improves multi-step reasoning for food/workout advice.
    // tool_choice defaults to 'auto' which is required when thinking is enabled.
    providerOptions: {
      kimi: { thinking: { type: 'enabled' } },
    },

    onFinish: async ({ text, usage, response, steps }) => {
      const latencyMs = Date.now() - startedAt;
      const requestId = response?.id ?? null;

      // Persist user turn first so chronology is intact even if the
      // assistant insert fails midway.
      try {
        if (latestUserText) {
          await createMessage({
            threadId: thread.id,
            userId,
            role: 'user',
            content: latestUserText,
          });
        }
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
      } catch (err) {
        // Non-fatal — the stream already delivered to the user; we only
        // lost the trace row. Log so production can investigate.
        console.error('[chat] persist failed', { err, threadId: thread.id, promptVersion: PROMPT_VERSION });
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
