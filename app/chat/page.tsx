// Server Component — gates /chat with auth + profile, hydrates the client
// with the most recent 20 messages from the user's thread.

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { findByUserId as findProfile } from '@/lib/db/repositories/profiles';
import { findLatestForUser } from '@/lib/db/repositories/chat-threads';
import { findByThreadAndDate } from '@/lib/db/repositories/messages';
import { findActive as findActivePlan } from '@/lib/db/repositories/workout-plans';
import { findByIds as findAttachmentsByIds } from '@/lib/db/repositories/attachments';
import { collectAttachmentIds, dbRowsToUIMessages } from '@/lib/ai/messages-to-ui';
import { ChatClient } from './chat-client';

export default async function ChatPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/');

  const profile = await findProfile(session.user.id);
  if (!profile?.kcalTarget) redirect('/onboarding');

  // Hydrate today's messages only — client-side date nav fetches other days.
  const todayIct = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
  const [thread, activePlan] = await Promise.all([
    findLatestForUser(session.user.id),
    findActivePlan(session.user.id),
  ]);
  const rows = thread ? await findByThreadAndDate(thread.id, todayIct) : [];

  const attachmentIds = collectAttachmentIds(rows);
  const attachments = await findAttachmentsByIds(session.user.id, attachmentIds);
  const attachmentMap = new Map(attachments.map((a) => [a.id, a]));
  const initialMessages = dbRowsToUIMessages(rows, attachmentMap);

  return (
    <ChatClient
      initialMessages={initialMessages}
      displayName={profile.displayName}
      kcalGoal={profile.kcalTarget ?? 0}
      hasPlan={!!activePlan}
    />
  );
}
