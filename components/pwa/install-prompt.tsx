'use client';

// PWA install prompt — shown after the user's 2nd visit (localStorage counter).
// Two paths:
//   Android/Chrome  → stash beforeinstallprompt, show "เพิ่มไปหน้าจอหลัก" button
//   iOS Safari      → show static instruction card (no install event on iOS)
//
// Web Push requires the app to be installed first; prompt teaches the user.

import { useEffect, useState } from 'react';
import { T } from '@/lib/design/tokens';

type Platform = 'ios' | 'android' | null;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return null;
}

function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function shouldShow(): boolean {
  if (isInStandaloneMode()) return false;
  try {
    const visits = parseInt(localStorage.getItem('pwa_visits') ?? '0', 10);
    const dismissed = localStorage.getItem('pwa_dismissed') === '1';
    return visits >= 2 && !dismissed;
  } catch {
    return false;
  }
}

export function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<Platform>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Increment visit counter.
    try {
      const visits = parseInt(localStorage.getItem('pwa_visits') ?? '0', 10);
      localStorage.setItem('pwa_visits', String(visits + 1));
    } catch {}

    const pt = detectPlatform();
    setPlatform(pt);

    // Android: capture the native install prompt.
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (shouldShow()) setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // iOS: show our custom card if eligible.
    if (pt === 'ios' && shouldShow()) setVisible(true);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem('pwa_dismissed', '1'); } catch {}
  };

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      try { localStorage.setItem('pwa_dismissed', '1'); } catch {}
    }
    setDeferredPrompt(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(76px + env(safe-area-inset-bottom, 0px) + 12px)',
        left: 16,
        right: 16,
        zIndex: 9999,
        background: T.bg3,
        border: `1px solid ${T.coral}55`,
        borderRadius: 16,
        padding: 16,
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          background: T.coral,
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          flexShrink: 0,
        }}
      >
        🔥
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
            fontWeight: 800,
            fontSize: 14,
            color: T.text,
            marginBottom: 4,
          }}
        >
          เพิ่มโค้ชดีไปหน้าจอหลัก
        </div>

        {platform === 'ios' ? (
          <div
            style={{
              fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
              fontSize: 12,
              color: T.textDim,
              lineHeight: 1.5,
            }}
          >
            แตะ{' '}
            <span style={{ fontWeight: 700 }}>
              Share <span style={{ fontSize: 14 }}>⎋</span>
            </span>{' '}
            แล้วเลือก{' '}
            <span style={{ fontWeight: 700 }}>&ldquo;เพิ่มไปหน้าจอหลัก&rdquo;</span>{' '}
            เพื่อใช้แบบ app เต็มรูปแบบ
          </div>
        ) : (
          <div
            style={{
              fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
              fontSize: 12,
              color: T.textDim,
            }}
          >
            ติดตั้งเพื่อใช้แบบ app ไม่ต้องเปิด browser
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
        {platform !== 'ios' && deferredPrompt && (
          <button
            type="button"
            onClick={install}
            style={{
              padding: '8px 14px',
              background: T.coral,
              border: 'none',
              borderRadius: 10,
              color: '#0E0F12',
              fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
              fontWeight: 800,
              fontSize: 12,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            ติดตั้ง
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          style={{
            padding: '8px 14px',
            background: T.bg4,
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            color: T.textDim,
            fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
            fontWeight: 700,
            fontSize: 12,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          ภายหลัง
        </button>
      </div>
    </div>
  );
}
