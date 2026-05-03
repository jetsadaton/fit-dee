// Reconstruct AI SDK `UIMessage` shape from persisted DB rows.
//
// The chat UI is driven by the Vercel AI SDK's `useChat`, which renders an
// array of `UIMessage` whose `parts` carry text, file attachments, and tool
// invocations (each with its own output payload). The DB stores these
// across three columns:
//   - messages.content       → text part
//   - messages.attachments[] → file parts (joined to attachments table)
//   - messages.toolCalls     → tool-* parts (with state='output-available')
//
// This helper is the inverse of the streaming → DB persist path in
// app/api/chat/route.ts. Used by the chat page initial hydration and by
// the date-nav fetch action so historical days render the same cards as
// the live session.

import type { UIMessage } from 'ai';
import type { Attachment } from '@/lib/types/db/attachments';
import type { Message, ToolCall } from '@/lib/types/db/chat';
import type { FoodLogStatus } from '@/lib/db/repositories/food-logs';

export function dbRowsToUIMessages(
  rows: Message[],
  attachmentMap: Map<string, Attachment>,
  foodLogStateMap: Map<string, FoodLogStatus> = new Map(),
): UIMessage[] {
  return rows
    .filter((r) => r.role === 'user' || r.role === 'assistant')
    .map((r) => {
      // The SDK's part union is opaque (heavy generics); we build the array
      // as `unknown[]` and cast at the boundary. Runtime shape matches what
      // chat-client's renderer reads (`type`, `state`, `output`, `url`, ...).
      const parts: unknown[] = [];

      for (const attId of r.attachments ?? []) {
        const att = attachmentMap.get(attId);
        if (!att) continue;
        // Use the auth-gated proxy URL — blobUrl points at the private
        // Vercel Blob store and is unreachable from the browser without
        // the store token.
        parts.push({
          type: 'file',
          mediaType: att.contentType,
          url: `/api/attachments/${att.id}`,
        });
      }

      if (r.content) {
        parts.push({ type: 'text', text: r.content });
      }

      const toolCalls = (r.toolCalls as ToolCall[] | null) ?? [];
      for (const tc of toolCalls) {
        if (!tc.result) continue;
        let output: Record<string, unknown> = tc.result;
        // food_log_confirm: stamp the live DB status onto the payload so the
        // confirm card shows the correct (confirmed/cancelled/idle) view
        // when the user reloads the chat.
        if (tc.name === 'log_food' && (tc.result as { type?: string }).type === 'food_log_confirm') {
          const pid = (tc.result as { pendingId?: unknown }).pendingId;
          if (typeof pid === 'string') {
            const status = foodLogStateMap.get(pid);
            if (status) output = { ...tc.result, currentStatus: status };
          }
        }
        parts.push({
          type: `tool-${tc.name}`,
          state: 'output-available',
          // toolCallId not stored in the trace row — synthesize a stable one
          // so React keys stay deterministic across re-renders.
          toolCallId: `${r.id}-${tc.name}`,
          input: tc.arguments,
          output,
        });
      }

      return {
        id: r.id,
        role: r.role as 'user' | 'assistant',
        parts: parts as UIMessage['parts'],
      };
    });
}

/** Collect every food-log pendingId referenced by tool-log_food parts in
 *  a batch of message rows. Caller batch-fetches the live status via
 *  food-logs.getStatesByIds and passes the map back into dbRowsToUIMessages. */
export function collectFoodLogPendingIds(rows: Message[]): string[] {
  const ids = new Set<string>();
  for (const r of rows) {
    const toolCalls = (r.toolCalls as ToolCall[] | null) ?? [];
    for (const tc of toolCalls) {
      if (tc.name !== 'log_food' || !tc.result) continue;
      if ((tc.result as { type?: string }).type !== 'food_log_confirm') continue;
      const pid = (tc.result as { pendingId?: unknown }).pendingId;
      if (typeof pid === 'string') ids.add(pid);
    }
  }
  return Array.from(ids);
}

/** Collect every attachment ID referenced across a batch of message rows. */
export function collectAttachmentIds(rows: Message[]): string[] {
  const ids = new Set<string>();
  for (const r of rows) {
    for (const id of r.attachments ?? []) ids.add(id);
  }
  return Array.from(ids);
}
