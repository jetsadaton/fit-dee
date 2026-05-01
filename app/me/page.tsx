'use client';

import { useRouter } from 'next/navigation';
import { BottomTabBar, type TabId } from '@/components/coach/primitives';
import { T } from '@/lib/design/tokens';

// Placeholder until Phase 1 ships profile/account screen.
// Exists to satisfy strict typedRoutes for the TabBar /me push.
export default function MePage() {
  const router = useRouter();
  const onTab = (t: TabId) => {
    if (t === 'me') return;
    if (t === 'chat') router.push('/chat');
    else if (t === 'today') router.push('/today');
    else router.push('/plan');
  };
  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', gap: 12 }}>
        <div style={{ fontSize: 48 }}>👤</div>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>ฉัน</h1>
        <p style={{ color: T.textDim, maxWidth: 280, lineHeight: 1.5 }}>
          หน้าโปรไฟล์ + ตั้งค่า กำลังจะมาเร็วๆ นี้
        </p>
      </div>
      <BottomTabBar active="me" onTab={onTab} />
    </div>
  );
}
