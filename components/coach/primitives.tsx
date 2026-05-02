// Coachly visual primitives — direct port of `components.jsx` from the design handoff.
// Visual fidelity comes first; future PRs may break these into shadcn-style files,
// but the on-screen output must stay identical.

'use client';

import type { CSSProperties, ReactNode } from 'react';
import { T } from '@/lib/design/tokens';

// ─── Coach Avatar (flat illustration — friendly, ungendered) ─────────

export function CoachAvatar({
  size = 40,
  online = true,
  thinking = false,
}: {
  size?: number;
  online?: boolean;
  thinking?: boolean;
}) {
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg viewBox="0 0 40 40" width={size} height={size} style={{ display: 'block' }}>
        <defs>
          <linearGradient id="coachBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={T.coral} />
            <stop offset="1" stopColor="#FF9266" />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r="20" fill="url(#coachBg)" />
        <path
          d="M9 17 C9 11, 13 7, 20 7 C27 7, 31 11, 31 17 L31 19 L28 18 C27 15, 24 13, 20 13 C16 13, 13 15, 12 18 L9 19 Z"
          fill="#1A0E08"
        />
        <ellipse cx="20" cy="22" rx="9" ry="10" fill="#F4C9A8" />
        <path d="M10 15 Q20 12 30 15 L30 17 Q20 14 10 17 Z" fill={T.lime} />
        <circle cx="17" cy="22" r="1.1" fill="#1A0E08" />
        <circle cx="23" cy="22" r="1.1" fill="#1A0E08" />
        <path d="M17 26 Q20 28.5 23 26" stroke="#1A0E08" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <circle cx="14.5" cy="25" r="1.2" fill="#FF8585" opacity="0.5" />
        <circle cx="25.5" cy="25" r="1.2" fill="#FF8585" opacity="0.5" />
      </svg>
      {online && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: size * 0.28,
            height: size * 0.28,
            borderRadius: 999,
            background: T.lime,
            border: `2px solid ${T.bg}`,
            animation: thinking ? 'cdPulse 1.4s infinite' : 'none',
          }}
        />
      )}
    </div>
  );
}

// ─── Streak flame ────────────────────────────────────────────────────

export function StreakFlame({ count = 12, size = 'sm' as 'sm' | 'lg' }) {
  const big = size === 'lg';
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: big ? 6 : 4,
        padding: big ? '6px 12px' : '4px 8px',
        borderRadius: 999,
        background: T.coralBg,
        border: `1px solid ${T.coral}33`,
      }}
    >
      <svg width={big ? 18 : 14} height={big ? 18 : 14} viewBox="0 0 24 24">
        <path
          d="M12 2 C13 6 16 8 16 12 C16 14 14.5 15.5 13 16 C14 14 13 12 12 11 C11 13 8 14 8 16.5 C8 19 10 22 12 22 C15 22 18 19 18 15 C18 9 14 7 12 2 Z"
          fill={T.coral}
        />
        <path
          d="M12 11 C11.3 13 9.5 13.5 9.5 16 C9.5 18 10.5 20 12 20 C13.5 20 14.5 18.5 14.5 17 C14.5 15 13 14 12 11 Z"
          fill={T.lime}
        />
      </svg>
      <span
        style={{
          fontFamily: 'var(--font-inter), system-ui',
          fontWeight: 800,
          fontSize: big ? 16 : 13,
          color: T.coral,
          letterSpacing: 0.2,
        }}
      >
        {count}
      </span>
    </div>
  );
}

// ─── Triple Activity Ring (Apple-style, 3 rings) ────────────────────

export function KcalRing({
  size = 120,
  eaten = 1450,
  goal = 2000,
  burned = 320,
  stroke = 10,
  animate = true,
}: {
  size?: number;
  eaten?: number;
  goal?: number;
  burned?: number;
  stroke?: number;
  animate?: boolean;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r1 = (size - stroke) / 2;
  const r2 = r1 - stroke - 3;
  const r3 = r2 - stroke - 3;
  const c1 = 2 * Math.PI * r1;
  const c2 = 2 * Math.PI * r2;
  const c3 = 2 * Math.PI * r3;
  const eatPct = Math.min(1, eaten / goal);
  const burnPct = Math.min(1, burned / 500);
  const movePct = Math.min(1, (goal - eaten + burned) / goal);

  const ring = (r: number, c: number, color: string, pct: number, key: string) => (
    <g key={key}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeOpacity="0.15" strokeWidth={stroke} />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${c * pct} ${c}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={animate ? { transition: 'stroke-dasharray 0.8s ease' } : {}}
      />
    </g>
  );
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size}>
        {ring(r1, c1, T.ringMove, movePct, 'm')}
        {ring(r2, c2, T.ringEat, eatPct, 'e')}
        {ring(r3, c3, T.ringBurn, burnPct, 'b')}
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ fontSize: size * 0.22, fontWeight: 800, color: T.text, lineHeight: 1, fontFamily: 'var(--font-inter)' }}>
          {(goal - eaten).toLocaleString()}
        </div>
        <div
          style={{
            fontSize: size * 0.08,
            color: T.textDim,
            marginTop: 2,
            fontFamily: 'var(--font-inter)',
            fontWeight: 600,
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          เหลือ kcal
        </div>
      </div>
    </div>
  );
}

// ─── Macro bar (3 stacked, traffic-light colors) ─────────────────────

export function MacroBar({
  p = { eaten: 32, goal: 120 },
  c = { eaten: 78, goal: 220 },
  f = { eaten: 22, goal: 65 },
  compact = false,
}: {
  p?: { eaten: number; goal: number };
  c?: { eaten: number; goal: number };
  f?: { eaten: number; goal: number };
  compact?: boolean;
}) {
  const Row = ({ label, color, eaten, goal }: { label: string; color: string; eaten: number; goal: number }) => {
    const pct = Math.min(100, (eaten / goal) * 100);
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: compact ? 2 : 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span
            style={{
              fontSize: compact ? 10 : 11,
              fontWeight: 700,
              color: T.textDim,
              letterSpacing: 0.4,
              textTransform: 'uppercase',
              fontFamily: 'var(--font-inter)',
            }}
          >
            {label}
          </span>
          <span style={{ fontSize: compact ? 11 : 13, fontWeight: 700, color: T.text, fontFamily: 'var(--font-inter)' }}>
            {eaten}
            <span style={{ color: T.textMute, fontWeight: 500 }}>/{goal}g</span>
          </span>
        </div>
        <div style={{ height: compact ? 4 : 6, borderRadius: 999, background: T.bg4, overflow: 'hidden' }}>
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              background: color,
              borderRadius: 999,
              transition: 'width 0.6s ease',
            }}
          />
        </div>
      </div>
    );
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 6 : 10, width: '100%' }}>
      <Row label="โปรตีน" color={T.protein} eaten={p.eaten} goal={p.goal} />
      <Row label="คาร์บ" color={T.carb} eaten={c.eaten} goal={c.goal} />
      <Row label="ไขมัน" color={T.fat} eaten={f.eaten} goal={f.goal} />
    </div>
  );
}

// ─── Range Badge ─────────────────────────────────────────────────────

export function RangeBadge({ low, high, unit = 'kcal' }: { low: number; high: number; unit?: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        background: T.bg4,
        border: `1px solid ${T.border}`,
        fontFamily: 'var(--font-inter)',
        fontSize: 12,
        fontWeight: 700,
        color: T.text,
      }}
    >
      <span style={{ fontSize: 9, color: T.textMute, fontWeight: 600, letterSpacing: 0.6 }}>~</span>
      {low}–{high} {unit}
    </span>
  );
}

// ─── Bottom Tab Bar ──────────────────────────────────────────────────

export type TabId = 'chat' | 'today' | 'plan' | 'me';

export function BottomTabBar({ active = 'chat', onTab }: { active?: TabId; onTab?: (id: TabId) => void }) {
  const tabs: { id: TabId; label: string; icon: 'chat' | 'today' | 'plan' | 'me' }[] = [
    { id: 'chat', label: 'แชท', icon: 'chat' },
    { id: 'today', label: 'วันนี้', icon: 'today' },
    { id: 'plan', label: 'แผน', icon: 'plan' },
    { id: 'me', label: 'ฉัน', icon: 'me' },
  ];
  const Icon = ({ kind, on }: { kind: 'chat' | 'today' | 'plan' | 'me'; on: boolean }) => {
    const c = on ? T.coral : T.textMute;
    if (kind === 'chat')
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 6 C4 4.9 4.9 4 6 4 H18 C19.1 4 20 4.9 20 6 V14 C20 15.1 19.1 16 18 16 H10 L6 20 V16 C4.9 16 4 15.1 4 14 Z"
            stroke={c}
            strokeWidth={on ? 2.4 : 2}
            fill={on ? T.coralBg : 'none'}
            strokeLinejoin="round"
          />
        </svg>
      );
    if (kind === 'today')
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke={c} strokeWidth={on ? 2.4 : 2} fill={on ? T.coralBg : 'none'} />
          <circle cx="12" cy="12" r="5" stroke={c} strokeWidth={on ? 2.4 : 2} fill="none" />
          <circle cx="12" cy="12" r="1.5" fill={c} />
        </svg>
      );
    if (kind === 'plan')
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="6" width="16" height="14" rx="2" stroke={c} strokeWidth={on ? 2.4 : 2} fill={on ? T.coralBg : 'none'} />
          <path d="M4 10 H20" stroke={c} strokeWidth={on ? 2.4 : 2} />
          <path d="M9 3 V7 M15 3 V7" stroke={c} strokeWidth={on ? 2.4 : 2} strokeLinecap="round" />
        </svg>
      );
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="9" r="4" stroke={c} strokeWidth={on ? 2.4 : 2} fill={on ? T.coralBg : 'none'} />
        <path
          d="M4 20 C4 16 7.5 14 12 14 C16.5 14 20 16 20 20"
          stroke={c}
          strokeWidth={on ? 2.4 : 2}
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    );
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(14,15,18,0.92)',
        backdropFilter: 'blur(20px)',
        borderTop: `1px solid ${T.border}`,
        padding: '8px 4px 10px',
        display: 'flex',
        zIndex: 5,
      }}
    >
      {tabs.map((t) => {
        const on = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onTab && onTab(t.id)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
            }}
            aria-label={t.label}
          >
            <Icon kind={t.icon} on={on} />
            <span
              style={{
                fontFamily: 'var(--font-inter), system-ui',
                fontSize: 10.5,
                fontWeight: on ? 800 : 600,
                color: on ? T.coral : T.textMute,
                letterSpacing: 0.2,
              }}
            >
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Buttons ─────────────────────────────────────────────────────────

type BtnProps = {
  children: ReactNode;
  onClick?: () => void;
  full?: boolean;
  size?: 'md' | 'lg';
  icon?: ReactNode;
  disabled?: boolean;
  type?: 'button' | 'submit';
};

export function PrimaryBtn({ children, onClick, full = false, size = 'md', icon, disabled, type = 'button' }: BtnProps) {
  const h = size === 'lg' ? 56 : 48;
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        height: h,
        padding: '0 24px',
        borderRadius: 999,
        background: disabled ? T.coral + '88' : T.coral,
        color: '#0E0F12',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-inter), system-ui',
        fontWeight: 800,
        fontSize: size === 'lg' ? 17 : 15,
        letterSpacing: 0.2,
        width: full ? '100%' : 'auto',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        boxShadow: disabled ? 'none' : `0 8px 28px ${T.coral}40`,
        textTransform: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {icon}
      {children}
    </button>
  );
}

export function GhostBtn({ children, onClick, full = false, size = 'md', icon, disabled, type = 'button' }: BtnProps) {
  const h = size === 'lg' ? 56 : 48;
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        height: h,
        padding: '0 20px',
        borderRadius: 999,
        background: T.bg3,
        color: T.text,
        border: `1px solid ${T.border}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-inter), system-ui',
        fontWeight: 700,
        fontSize: size === 'lg' ? 16 : 14,
        width: full ? '100%' : 'auto',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        whiteSpace: 'nowrap',
      }}
    >
      {icon}
      {children}
    </button>
  );
}

// ─── Chip ────────────────────────────────────────────────────────────

export function Chip({
  children,
  selected,
  onClick,
  icon,
  large = false,
}: {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  icon?: ReactNode;
  large?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: large ? '12px 16px' : '8px 14px',
        height: large ? 'auto' : 36,
        borderRadius: 999,
        background: selected ? T.coralBg : T.bg3,
        color: selected ? T.coral : T.text,
        border: `1px solid ${selected ? T.coral + '66' : T.border}`,
        fontFamily: 'var(--font-inter), system-ui',
        fontWeight: 700,
        fontSize: large ? 14 : 13,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {icon}
      {children}
    </button>
  );
}

// ─── Progress bar (top of onboarding) ────────────────────────────────

export function ProgressBar({ pct = 50 }: { pct?: number }) {
  return (
    <div style={{ height: 4, background: T.bg3, borderRadius: 999, overflow: 'hidden', width: '100%' }}>
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${T.coral}, ${T.lime})`,
          transition: 'width 0.5s ease',
          borderRadius: 999,
        }}
      />
    </div>
  );
}

// helper exported for stepper buttons in onboarding
export const stepperBtnStyle: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 999,
  background: T.bg3,
  border: `1px solid ${T.border}`,
  color: T.text,
  fontFamily: 'var(--font-inter)',
  fontWeight: 800,
  fontSize: 20,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};
