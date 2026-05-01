'use client';

import { useRouter } from 'next/navigation';
import { ChatScreen } from '@/components/screens/chat-screen';
import type { TabId } from '@/components/coach/primitives';

export default function ChatPage() {
  const router = useRouter();
  const onTab = (t: TabId) => {
    if (t === 'chat') return;
    if (t === 'today') router.push('/today');
    else if (t === 'plan') router.push('/plan');
    else router.push('/me');
  };
  return <ChatScreen onTab={onTab} activeTab="chat" />;
}
