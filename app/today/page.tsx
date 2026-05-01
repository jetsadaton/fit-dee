'use client';

import { useRouter } from 'next/navigation';
import { TodayScreen } from '@/components/screens/today-screen';
import type { TabId } from '@/components/coach/primitives';

export default function TodayPage() {
  const router = useRouter();
  const onTab = (t: TabId) => {
    if (t === 'today') return;
    if (t === 'chat') router.push('/chat');
    else if (t === 'plan') router.push('/plan');
    else router.push('/me');
  };
  return <TodayScreen onTab={onTab} activeTab="today" />;
}
