// Server Component — gates /chat with auth + profile, hydrates the client
// with the most recent 20 messages from the user's thread.

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { findByUserId as findProfile } from '@/lib/db/repositories/profiles';
import { findLatestForUser } from '@/lib/db/repositories/chat-threads';
import { findRecentByThread } from '@/lib/db/repositories/messages';
import type { UIMessage } from 'ai';
import { ChatClient } from './chat-client';

export default async function ChatPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/');

  const profile = await findProfile(session.user.id);
  if (!profile?.kcalTarget) redirect('/onboarding');

  // Hydrate the client with what's already on this thread (if any).
  const thread = await findLatestForUser(session.user.id);
  const rows = thread ? await findRecentByThread(thread.id, 20) : [];

  const initialMessages: UIMessage[] = rows
    .filter((r) => r.role === 'user' || r.role === 'assistant')
    .map((r) => ({
      id: r.id,
      role: r.role as 'user' | 'assistant',
      parts: [{ type: 'text' as const, text: r.content ?? '' }],
    }));

  return <ChatClient initialMessages={initialMessages} displayName={profile.displayName} />;
}
