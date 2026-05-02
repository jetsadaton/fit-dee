import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import type { attachments } from '@/lib/db/schema';

export type Attachment = InferSelectModel<typeof attachments>;
export type NewAttachment = InferInsertModel<typeof attachments>;
