'use client';

import type { ReactNode } from 'react';
import { CoachAvatar, RangeBadge } from '@/components/coach/primitives';
import { T } from '@/lib/design/tokens';

// ─── User bubble ─────────────────────────────────────────────────────

export function UserBubble({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
      <div
        style={{
          maxWidth: '78%',
          background: T.bg4,
          color: T.text,
          padding: '10px 14px',
          borderRadius: '18px 18px 4px 18px',
          fontFamily: 'Inter, "Noto Sans Thai", system-ui',
          fontSize: 14.5,
          lineHeight: 1.5,
          fontWeight: 500,
          wordBreak: 'break-word',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Coach text bubble ───────────────────────────────────────────────

export function CoachBubble({ children, withAvatar = true }: { children: ReactNode; withAvatar?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 8 }}>
      <div style={{ width: 28, flexShrink: 0 }}>{withAvatar && <CoachAvatar size={28} online={false} />}</div>
      <div
        style={{
          maxWidth: '78%',
          background: T.bg3,
          color: T.text,
          padding: '10px 14px',
          borderRadius: '18px 18px 18px 4px',
          border: `1px solid ${T.border}`,
          fontFamily: 'Inter, "Noto Sans Thai", system-ui',
          fontSize: 14.5,
          lineHeight: 1.5,
          fontWeight: 500,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Card wrapper for coach side ─────────────────────────────────────

export function CoachCard({ children, withAvatar = true }: { children: ReactNode; withAvatar?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 12 }}>
      <div style={{ width: 28, flexShrink: 0 }}>{withAvatar && <CoachAvatar size={28} online={false} />}</div>
      <div style={{ flex: 1, maxWidth: '88%' }}>{children}</div>
    </div>
  );
}

// ─── Food log card (confirmable) ─────────────────────────────────────

export function FoodLogCard({
  name = 'ข้าวกะเพราไก่ไข่ดาว',
  kcal = [620, 720] as [number, number],
  p = 32,
  c = 78,
  f = 22,
  confirmed,
  onConfirm,
  onEdit,
  onCancel,
  time = '12:34',
}: {
  name?: string;
  kcal?: [number, number];
  p?: number;
  c?: number;
  f?: number;
  confirmed?: boolean;
  onConfirm?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
  time?: string;
}) {
  return (
    <div style={{ background: T.bg3, borderRadius: 16, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
      <div style={{ padding: '14px 14px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: T.coralBg,
              color: T.coral,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M5 12 C5 8 8 5 12 5 C16 5 19 8 19 12 V19 H5 Z" strokeLinejoin="round" />
              <path d="M9 12 H15" strokeLinecap="round" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: 'Inter,"Noto Sans Thai",system-ui',
                fontWeight: 800,
                color: T.text,
                fontSize: 14.5,
                lineHeight: 1.2,
              }}
            >
              {name}
            </div>
            <div style={{ fontSize: 11, color: T.textMute, marginTop: 2, fontWeight: 600 }}>
              มื้อกลางวัน · {time}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <RangeBadge low={kcal[0]} high={kcal[1]} unit="kcal" />
          <span style={{ fontSize: 11, color: T.textMute, fontWeight: 600 }}>· 1 จาน</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { l: 'P', v: p, c: T.protein },
            { l: 'C', v: c, c: T.carb },
            { l: 'F', v: f, c: T.fat },
          ].map((m) => (
            <div key={m.l} style={{ flex: 1, background: T.bg4, borderRadius: 8, padding: '6px 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: m.c }} />
                <span style={{ fontSize: 9.5, fontWeight: 700, color: T.textDim, letterSpacing: 0.6 }}>{m.l}</span>
              </div>
              <div style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 13, color: T.text }}>
                {m.v}
                <span style={{ color: T.textMute, fontWeight: 500 }}>g</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {!confirmed && (
        <div style={{ display: 'flex', borderTop: `1px solid ${T.border}` }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '12px 0',
              background: 'none',
              border: 'none',
              color: T.textMute,
              fontFamily: 'Inter,"Noto Sans Thai"',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            ยกเลิก
          </button>
          <div style={{ width: 1, background: T.border }} />
          <button
            type="button"
            onClick={onEdit}
            style={{
              flex: 1,
              padding: '12px 0',
              background: 'none',
              border: 'none',
              color: T.text,
              fontFamily: 'Inter,"Noto Sans Thai"',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            แก้
          </button>
          <div style={{ width: 1, background: T.border }} />
          <button
            type="button"
            onClick={onConfirm}
            style={{
              flex: 1.4,
              padding: '12px 0',
              background: T.coral,
              border: 'none',
              color: '#0E0F12',
              fontFamily: 'Inter,"Noto Sans Thai"',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            ยืนยัน
          </button>
        </div>
      )}
      {confirmed && (
        <div
          style={{
            padding: '10px 14px',
            background: T.limeBg,
            color: T.lime,
            fontSize: 12,
            fontWeight: 700,
            fontFamily: 'Inter,"Noto Sans Thai"',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M5 13L9 17L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          บันทึกแล้ว
        </div>
      )}
    </div>
  );
}

// ─── Workout card ────────────────────────────────────────────────────

export function WorkoutCardBubble({
  name = 'Push Day',
  exercises = 5,
  mins = 45,
  onStart,
}: {
  name?: string;
  exercises?: number;
  mins?: number;
  onStart?: () => void;
}) {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #1C1F26 0%, #262A33 100%)',
        borderRadius: 16,
        border: `1px solid ${T.border}`,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '14px 14px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: T.coral,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0E0F12',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 8 V16 M18 8 V16 M3 10 V14 M21 10 V14 M6 12 H18" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 1.2,
              color: T.coral,
              textTransform: 'uppercase',
              fontFamily: 'Inter',
            }}
          >
            วันนี้
          </div>
          <div
            style={{
              fontFamily: 'Inter,"Noto Sans Thai"',
              fontWeight: 800,
              color: T.text,
              fontSize: 18,
              marginTop: 2,
            }}
          >
            {name}
          </div>
        </div>
      </div>
      <div
        style={{
          padding: '10px 14px 14px',
          display: 'flex',
          gap: 12,
          fontFamily: 'Inter,"Noto Sans Thai"',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: T.textDim, fontSize: 12, fontWeight: 600 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
          </svg>
          {exercises} ท่า
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: T.textDim, fontSize: 12, fontWeight: 600 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" strokeLinecap="round" />
          </svg>
          ~{mins} นาที
        </div>
      </div>
      <button
        type="button"
        onClick={onStart}
        style={{
          width: '100%',
          padding: '14px',
          background: T.coral,
          color: '#0E0F12',
          border: 'none',
          fontFamily: 'Inter,"Noto Sans Thai"',
          fontWeight: 800,
          fontSize: 14,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        เริ่มเลย
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </button>
    </div>
  );
}

// ─── Exercise demo ───────────────────────────────────────────────────

export function ExerciseDemoBubble({
  name = 'Bench Press',
  subtitle = 'วิธีทำท่าถูกต้อง',
}: {
  name?: string;
  subtitle?: string;
}) {
  return (
    <div style={{ background: T.bg3, borderRadius: 16, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
      <div
        style={{
          height: 140,
          position: 'relative',
          background: `repeating-linear-gradient(45deg, ${T.bg4}, ${T.bg4} 8px, ${T.bg3} 8px, ${T.bg3} 16px)`,
        }}
      >
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 999,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            padding: '3px 8px',
            borderRadius: 4,
            background: 'rgba(0,0,0,0.6)',
            color: '#fff',
            fontFamily: 'Inter',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 0.4,
          }}
        >
          0:08 · LOOP
        </div>
      </div>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontWeight: 800, color: T.text, fontSize: 14 }}>{name}</div>
        <div style={{ fontSize: 12, color: T.textDim, marginTop: 2, fontFamily: 'Inter,"Noto Sans Thai"' }}>{subtitle}</div>
      </div>
    </div>
  );
}

// ─── Photo analysis ──────────────────────────────────────────────────

export function PhotoAnalysisBubble({
  items = [
    { name: 'ข้าวสวย', conf: 0.96 },
    { name: 'ไก่ทอด', conf: 0.88 },
    { name: 'ผักบุ้งไฟแดง', conf: 0.72 },
  ],
}: {
  items?: { name: string; conf: number }[];
}) {
  return (
    <div style={{ background: T.bg3, borderRadius: 16, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
      <div
        style={{
          height: 120,
          background: 'linear-gradient(135deg, #3a2418 0%, #2a3414 100%)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontFamily: 'monospace', fontSize: 10, color: T.textMute, letterSpacing: 1 }}>FOOD PHOTO</span>
        <div
          style={{
            position: 'absolute',
            left: '15%',
            top: '25%',
            width: '32%',
            height: '50%',
            border: `2px solid ${T.lime}`,
            borderRadius: 6,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: -16,
              left: 0,
              padding: '1px 6px',
              background: T.lime,
              color: '#0E0F12',
              fontSize: 9,
              fontWeight: 800,
              fontFamily: 'Inter',
              borderRadius: 3,
            }}
          >
            ข้าว
          </span>
        </div>
        <div
          style={{
            position: 'absolute',
            right: '12%',
            top: '20%',
            width: '34%',
            height: '60%',
            border: `2px solid ${T.coral}`,
            borderRadius: 6,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: -16,
              left: 0,
              padding: '1px 6px',
              background: T.coral,
              color: '#0E0F12',
              fontSize: 9,
              fontWeight: 800,
              fontFamily: 'Inter',
              borderRadius: 3,
            }}
          >
            ไก่
          </span>
        </div>
      </div>
      <div style={{ padding: 12 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: T.textDim,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
            fontFamily: 'Inter',
            marginBottom: 8,
          }}
        >
          เจอ {items.length} อย่าง
        </div>
        {items.map((it, i) => (
          <div
            key={it.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 0',
              borderTop: i === 0 ? 'none' : `1px solid ${T.border}`,
            }}
          >
            <span style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 13, fontWeight: 600, color: T.text }}>{it.name}</span>
            <span
              style={{
                fontFamily: 'Inter',
                fontSize: 11,
                fontWeight: 700,
                color: it.conf > 0.85 ? T.lime : T.warn,
              }}
            >
              {Math.round(it.conf * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Weekly insight ──────────────────────────────────────────────────

export function WeeklyInsightBubble() {
  const data = [62, 70, 65, 72, 68, 78, 75];
  const max = Math.max(...data);
  return (
    <div style={{ background: T.bg3, borderRadius: 16, border: `1px solid ${T.border}`, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            background: T.limeBg,
            color: T.lime,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M3 17l6-6 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 7h7v7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontWeight: 800, color: T.text, fontSize: 13 }}>
          สรุปสัปดาห์ที่ผ่านมา
        </span>
      </div>
      <svg viewBox="0 0 220 50" width="100%" height="50" style={{ marginBottom: 10 }}>
        <polyline
          points={data.map((v, i) => `${(i / (data.length - 1)) * 220},${50 - (v / max) * 40}`).join(' ')}
          fill="none"
          stroke={T.lime}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((v, i) => (
          <circle
            key={`pt-${i}`}
            cx={(i / (data.length - 1)) * 220}
            cy={50 - (v / max) * 40}
            r="3"
            fill={i === data.length - 1 ? T.lime : T.bg3}
            stroke={T.lime}
            strokeWidth="2"
          />
        ))}
      </svg>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          'น้ำหนักลด 0.4 กก. — ดีตามแผนเลย',
          'โปรตีนเฉลี่ย 95g/วัน (เป้า 110g) — เพิ่มอีกหน่อย',
          'ออกกำลัง 4/5 วัน — สม่ำเสมอ',
        ].map((line) => (
          <li
            key={line}
            style={{
              display: 'flex',
              gap: 8,
              fontFamily: 'Inter,"Noto Sans Thai"',
              fontSize: 12.5,
              color: T.text,
              lineHeight: 1.5,
            }}
          >
            <span style={{ color: T.lime, fontWeight: 800, marginTop: 1 }}>·</span>
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Weigh-in prompt ─────────────────────────────────────────────────

export function WeighInPromptBubble({ onLog }: { onLog?: () => void }) {
  return (
    <div style={{ background: T.bg3, borderRadius: 16, border: `1px solid ${T.border}`, padding: 14 }}>
      <div
        style={{
          fontFamily: 'Inter,"Noto Sans Thai"',
          fontWeight: 700,
          color: T.text,
          fontSize: 14,
          marginBottom: 4,
        }}
      >
        ชั่งน้ำหนักวันนี้ยัง?
      </div>
      <div
        style={{
          fontSize: 12,
          color: T.textDim,
          fontFamily: 'Inter,"Noto Sans Thai"',
          marginBottom: 12,
        }}
      >
        ชั่งตอนเช้าหลังเข้าห้องน้ำจะแม่นที่สุด
      </div>
      <button
        type="button"
        onClick={onLog}
        style={{
          width: '100%',
          padding: '12px',
          background: T.bg4,
          border: `1px dashed ${T.borderHi}`,
          borderRadius: 12,
          color: T.text,
          fontFamily: 'Inter,"Noto Sans Thai"',
          fontWeight: 700,
          fontSize: 14,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="6" width="18" height="14" rx="2" />
          <path d="M12 10v3M9 13h6" strokeLinecap="round" />
        </svg>
        บันทึกน้ำหนัก
      </button>
    </div>
  );
}

// ─── Water chips ─────────────────────────────────────────────────────

export function WaterChipsBubble({ onAdd }: { onAdd?: (ml: number) => void }) {
  return (
    <div style={{ background: T.bg3, borderRadius: 16, border: `1px solid ${T.border}`, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.fat} strokeWidth="2.2">
          <path
            d="M12 3 C8 9 6 12 6 15 C6 18 9 21 12 21 C15 21 18 18 18 15 C18 12 16 9 12 3 Z"
            strokeLinejoin="round"
          />
        </svg>
        <span style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontWeight: 700, color: T.text, fontSize: 13 }}>
          เพิ่มน้ำเร็ว
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[250, 500, 750].map((ml) => (
          <button
            type="button"
            key={ml}
            onClick={() => onAdd?.(ml)}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: 12,
              background: T.bg4,
              border: `1px solid ${T.border}`,
              color: T.text,
              fontFamily: 'Inter',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            +{ml}
            <span style={{ fontSize: 10, color: T.textMute, fontWeight: 600 }}>ml</span>
          </button>
        ))}
        <button
          type="button"
          style={{
            padding: '10px 14px',
            borderRadius: 12,
            background: T.bg4,
            border: `1px dashed ${T.borderHi}`,
            color: T.textDim,
            fontFamily: 'Inter,"Noto Sans Thai"',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          กำหนดเอง
        </button>
      </div>
    </div>
  );
}

// ─── Typing dots ─────────────────────────────────────────────────────

export function TypingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 8 }}>
      <div style={{ width: 28 }}>
        <CoachAvatar size={28} thinking online />
      </div>
      <div
        style={{
          background: T.bg3,
          padding: '12px 14px',
          borderRadius: '18px 18px 18px 4px',
          border: `1px solid ${T.border}`,
          display: 'flex',
          gap: 4,
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: T.textDim,
              animation: `cdBounce 1.2s ${i * 0.15}s infinite ease-in-out`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
