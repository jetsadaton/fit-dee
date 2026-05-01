'use client';

import { CoachAvatar, PrimaryBtn } from '@/components/coach/primitives';
import { T } from '@/lib/design/tokens';

export function WelcomeScreen({ onStart }: { onStart?: () => void }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: `radial-gradient(ellipse at top, ${T.coralDim} 0%, ${T.bg} 60%)`,
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 28px 28px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <svg
        style={{ position: 'absolute', top: -60, right: -80, opacity: 0.4 }}
        width="280"
        height="280"
        viewBox="0 0 280 280"
      >
        <circle cx="140" cy="140" r="120" fill="none" stroke={T.coral} strokeWidth="1" strokeOpacity="0.3" />
        <circle cx="140" cy="140" r="90" fill="none" stroke={T.coral} strokeWidth="1" strokeOpacity="0.25" />
        <circle cx="140" cy="140" r="60" fill="none" stroke={T.lime} strokeWidth="1" strokeOpacity="0.3" />
      </svg>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, zIndex: 1 }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: T.coral,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0E0F12',
            fontWeight: 900,
            fontFamily: 'Inter',
            fontSize: 16,
          }}
        >
          โ
        </div>
        <span style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontWeight: 800, color: T.text, fontSize: 16, letterSpacing: 0.3 }}>
          Coachly
        </span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 1, marginTop: 20 }}>
        <div style={{ alignSelf: 'flex-start', marginBottom: 28, position: 'relative' }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 28,
              background: T.bg3,
              border: `1px solid ${T.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 20px 50px ${T.coral}30`,
            }}
          >
            <CoachAvatar size={72} />
          </div>
          <div
            style={{
              position: 'absolute',
              top: -8,
              right: -10,
              padding: '4px 10px',
              borderRadius: 999,
              background: T.lime,
              color: '#0E0F12',
              fontFamily: 'Inter,"Noto Sans Thai"',
              fontWeight: 800,
              fontSize: 11,
              boxShadow: '0 8px 20px rgba(198,255,77,0.3)',
            }}
          >
            โค้ชดี
          </div>
        </div>

        <div
          style={{
            fontFamily: 'Inter,"Noto Sans Thai"',
            fontWeight: 800,
            color: T.textMute,
            fontSize: 13,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            marginBottom: 14,
          }}
        >
          โค้ช AI ส่วนตัว
        </div>
        <h1
          style={{
            fontFamily: 'Inter,"Noto Sans Thai"',
            fontWeight: 900,
            fontSize: 38,
            lineHeight: 1.05,
            letterSpacing: -0.8,
            color: T.text,
            margin: 0,
          }}
        >
          โค้ช
          <br />
          ส่วนตัว
          <br />
          <span style={{ color: T.coral }}>ในมือคุณ</span>
        </h1>
        <p
          style={{
            fontFamily: 'Inter,"Noto Sans Thai"',
            fontSize: 14.5,
            lineHeight: 1.55,
            color: T.textDim,
            marginTop: 18,
            maxWidth: 280,
          }}
        >
          แชทกับโค้ชดี บอกว่ากินอะไร เราจัดแผนกินและออกกำลังให้พอดีตัว
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, zIndex: 1, marginBottom: 60 }}>
        <PrimaryBtn
          full
          size="lg"
          onClick={onStart}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        >
          เริ่มเลย
        </PrimaryBtn>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            style={{
              flex: 1,
              height: 48,
              borderRadius: 999,
              background: '#06C755',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'Inter,"Noto Sans Thai"',
              fontWeight: 800,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <span style={{ fontFamily: 'Inter', fontWeight: 900, fontSize: 16 }}>L</span>
            LINE
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              height: 48,
              borderRadius: 999,
              background: T.bg3,
              color: T.text,
              border: `1px solid ${T.border}`,
              cursor: 'pointer',
              fontFamily: 'Inter,"Noto Sans Thai"',
              fontWeight: 700,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22 12c0-.7-.1-1.4-.2-2H12v3.8h5.6c-.2 1.3-1 2.4-2.1 3.1v2.6h3.4c2-1.8 3.1-4.5 3.1-7.5z"
              />
              <path
                fill="#34A853"
                d="M12 22c2.8 0 5.2-.9 6.9-2.5l-3.4-2.6c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.7v2.7C4.4 19.8 8 22 12 22z"
              />
              <path
                fill="#FBBC05"
                d="M6.2 13.6c-.2-.6-.3-1.2-.3-1.6s.1-1 .3-1.6V7.7H2.7C2 9 1.6 10.5 1.6 12s.4 3 1.1 4.3l3.5-2.7z"
              />
              <path
                fill="#EA4335"
                d="M12 5.7c1.5 0 2.9.5 3.9 1.5l2.9-2.9C17.2 2.7 14.8 1.6 12 1.6 8 1.6 4.4 3.8 2.7 7.7l3.5 2.7C7 7.5 9.3 5.7 12 5.7z"
              />
            </svg>
            Google
          </button>
        </div>
        <div
          style={{
            textAlign: 'center',
            marginTop: 4,
            fontFamily: 'Inter,"Noto Sans Thai"',
            fontSize: 11,
            color: T.textMute,
          }}
        >
          มีบัญชีอยู่แล้ว? <span style={{ color: T.text, fontWeight: 700 }}>เข้าสู่ระบบ</span>
        </div>
      </div>
    </div>
  );
}
