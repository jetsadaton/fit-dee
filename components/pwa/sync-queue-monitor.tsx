'use client';

// Shows a small "รอซิงค์ N รายการ" toast when offline queue has pending items.
// Auto-hides when queue is empty. Sits above BottomTabBar.

import { useSyncQueue } from '@/lib/hooks/use-sync-queue';
import { T } from '@/lib/design/tokens';

export function SyncQueueMonitor() {
  const { pendingCount } = useSyncQueue();
  if (pendingCount === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(76px + env(safe-area-inset-bottom, 0px) + 8px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9998,
        background: T.bg3,
        border: `1px solid ${T.border}`,
        borderRadius: 999,
        padding: '6px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: 10 }}>🔄</span>
      <span
        style={{
          fontFamily: 'Inter,"Noto Sans Thai"',
          fontSize: 11,
          fontWeight: 700,
          color: T.textDim,
        }}
      >
        รอซิงค์ {pendingCount} รายการ
      </span>
    </div>
  );
}
