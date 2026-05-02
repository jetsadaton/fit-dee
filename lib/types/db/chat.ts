// Row types for chat aggregates.

import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import type { chatThreads, memoryBlocks, messages } from '@/lib/db/schema';

export type ChatThread = InferSelectModel<typeof chatThreads>;
export type NewChatThread = InferInsertModel<typeof chatThreads>;

export type Message = InferSelectModel<typeof messages>;
export type NewMessage = InferInsertModel<typeof messages>;

export type MemoryBlock = InferSelectModel<typeof memoryBlocks>;
export type NewMemoryBlock = InferInsertModel<typeof memoryBlocks>;

/** OpenAI-style tool call payload stored in `messages.tool_calls` jsonb. */
export type ToolCall = {
  name: string;
  arguments: Record<string, unknown>;
  result?: Record<string, unknown>;
};
