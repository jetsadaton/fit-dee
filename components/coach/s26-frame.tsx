// S26 Ultra-style device frame — used on /canvas only. Production routes render unframed.

import type { ReactNode } from 'react';

export function S26Frame({
  children,
  statusBarDark = true,
  hideNav = false,
}: {
  children: ReactNode;
  statusBarDark?: boolean;
  hideNav?: boolean;
}) {
  const W = 384;
  const H = 832;
  return (
    <div
      style={{
        width: W,
        height: H,
        borderRadius: 44,
        padding: 4,
        background: 'linear-gradient(160deg, #2a2d33 0%, #0a0b0d 50%, #2a2d33 100%)',
        boxShadow: '0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 40,
          background: '#0E0F12',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            height: 36,
            padding: '0 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: statusBarDark ? '#F2F3F5' : '#0E0F12',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: 0.2,
            flexShrink: 0,
            position: 'relative',
            zIndex: 2,
          }}
        >
          <span>9:41</span>
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 8,
              transform: 'translateX(-50%)',
              width: 10,
              height: 10,
              borderRadius: 999,
              background: '#000',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
              <rect x="0" y="8" width="2.5" height="3" rx="0.5" fill="currentColor" />
              <rect x="4" y="6" width="2.5" height="5" rx="0.5" fill="currentColor" />
              <rect x="8" y="3" width="2.5" height="8" rx="0.5" fill="currentColor" />
              <rect x="12" y="0" width="2.5" height="11" rx="0.5" fill="currentColor" />
            </svg>
            <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
              <path
                d="M7.5 1C4.5 1 2 2.3 0 4l1.5 1.5C3 4.2 5 3.3 7.5 3.3S12 4.2 13.5 5.5L15 4c-2-1.7-4.5-3-7.5-3z"
                fill="currentColor"
              />
              <path
                d="M7.5 5.5c-1.7 0-3.2.6-4.4 1.6L4.5 8.5c.8-.7 1.8-1.1 3-1.1s2.2.4 3 1.1L12 7.1c-1.2-1-2.7-1.6-4.5-1.6z"
                fill="currentColor"
              />
              <circle cx="7.5" cy="9.5" r="1.2" fill="currentColor" />
            </svg>
            <svg width="26" height="12" viewBox="0 0 26 12" fill="none">
              <rect x="0.5" y="0.5" width="22" height="11" rx="2.5" stroke="currentColor" strokeOpacity="0.5" />
              <rect x="2" y="2" width="17" height="8" rx="1.5" fill="currentColor" />
              <rect x="23.5" y="4" width="1.5" height="4" rx="0.5" fill="currentColor" fillOpacity="0.5" />
            </svg>
          </div>
        </div>
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>{children}</div>
        {!hideNav && (
          <div
            style={{
              height: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <div style={{ width: 124, height: 4, borderRadius: 2, background: '#F2F3F5', opacity: 0.5 }} />
          </div>
        )}
      </div>
    </div>
  );
}
