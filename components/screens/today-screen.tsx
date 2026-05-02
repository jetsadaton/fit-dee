'use client';

import { useState } from 'react';
import { BottomTabBar, type TabId } from '@/components/coach/primitives';
import { T } from '@/lib/design/tokens';

type Range = 'today' | 'week' | 'month';
type InsightTone = 'warn' | 'good' | 'info';
type Insight = { tone: InsightTone; text: string };

function TripleRing({
  size = 220,
  eaten = 1450,
  goal = 1820,
  burned = 320,
}: {
  size?: number;
  eaten?: number;
  goal?: number;
  burned?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const stroke = 14;
  const gap = 4;
  const r1 = (size - stroke) / 2;
  const r2 = r1 - stroke - gap;
  const r3 = r2 - stroke - gap;
  const left = Math.max(0, goal - eaten + burned);
  const eatPct = Math.min(1, eaten / goal);
  const burnPct = Math.min(1, burned / 600);
  const leftPct = Math.min(1, left / goal);
  const arc = (r: number, pct: number, color: string, key: string) => {
    const c = 2 * Math.PI * r;
    return (
      <circle
        key={key}
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${c * pct} ${c}`}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
    );
  };
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r1} fill="none" stroke={T.bg4} strokeWidth={stroke} />
        <circle cx={cx} cy={cy} r={r2} fill="none" stroke={T.bg4} strokeWidth={stroke} />
        <circle cx={cx} cy={cy} r={r3} fill="none" stroke={T.bg4} strokeWidth={stroke} />
        {arc(r1, eatPct, T.lime, 'eat')}
        {arc(r2, burnPct, T.ringBurn, 'burn')}
        {arc(r3, leftPct, T.coral, 'left')}
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: 'Inter,"Noto Sans Thai"',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            color: T.coral,
          }}
        >
          เหลือกินได้
        </div>
        <div style={{ fontFamily: 'Inter', fontSize: 44, fontWeight: 900, color: T.text, lineHeight: 1, marginTop: 2 }}>
          {left}
        </div>
        <div style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 11, fontWeight: 700, color: T.textDim, marginTop: 4 }}>
          kcal · จากเป้า {goal}
        </div>
      </div>
    </div>
  );
}

function RingLegend({ eaten = 1450, burned = 320, goal = 1820 }: { eaten?: number; burned?: number; goal?: number }) {
  const Item = ({ color, label, value, unit }: { color: string; label: string; value: number; unit: string }) => (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 2 }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: color }} />
        <span
          style={{
            fontFamily: 'Inter,"Noto Sans Thai"',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
            color: T.textDim,
          }}
        >
          {label}
        </span>
      </div>
      <div style={{ fontFamily: 'Inter', fontSize: 18, fontWeight: 800, color: T.text }}>
        {value}
        <span style={{ fontSize: 10, fontWeight: 600, color: T.textMute, marginLeft: 2 }}>{unit}</span>
      </div>
    </div>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', padding: '14px 8px 4px' }}>
      <Item color={T.lime} label="กิน" value={eaten} unit="kcal" />
      <div style={{ width: 1, background: T.border }} />
      <Item color={T.ringBurn} label="เผา" value={burned} unit="kcal" />
      <div style={{ width: 1, background: T.border }} />
      <Item color={T.coral} label="เหลือ" value={goal - eaten + burned} unit="kcal" />
    </div>
  );
}

function AIInsightCard({ items, range = 'today' }: { items: Insight[]; range?: Range }) {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #1C1F26 0%, #2A1810 100%)',
        border: `1px solid ${T.coral}33`,
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 90,
          height: 90,
          background: `radial-gradient(circle, ${T.coral}22 0%, transparent 70%)`,
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, position: 'relative' }}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 8,
            background: T.coral,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#0E0F12">
            <path d="M12 2 L13.5 8 L20 9.5 L13.5 11 L12 17 L10.5 11 L4 9.5 L10.5 8 Z" />
          </svg>
        </div>
        <span style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontWeight: 800, color: T.text, fontSize: 13 }}>
          โค้ชดีวิเคราะห์ให้
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontFamily: 'Inter',
            fontSize: 10,
            fontWeight: 700,
            color: T.textMute,
            padding: '3px 8px',
            borderRadius: 999,
            background: T.bg4,
          }}
        >
          {range === 'today' ? 'วันนี้' : range === 'week' ? '7 วัน' : '30 วัน'}
        </span>
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
        {items.map((it, i) => (
          <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div
              style={{
                flexShrink: 0,
                width: 22,
                height: 22,
                borderRadius: 7,
                background: it.tone === 'warn' ? T.coralBg : it.tone === 'good' ? T.limeBg : T.bg4,
                border: `1px solid ${it.tone === 'warn' ? T.coral + '55' : it.tone === 'good' ? T.lime + '55' : T.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Inter',
                fontSize: 11,
                fontWeight: 800,
                color: it.tone === 'warn' ? T.coral : it.tone === 'good' ? T.lime : T.textDim,
              }}
            >
              {it.tone === 'warn' ? '!' : it.tone === 'good' ? '✓' : '·'}
            </div>
            <div
              style={{
                fontFamily: 'Inter,"Noto Sans Thai"',
                fontSize: 13,
                color: T.text,
                lineHeight: 1.5,
                paddingTop: 2,
              }}
              dangerouslySetInnerHTML={{ __html: it.text }}
            />
          </li>
        ))}
      </ul>
      <button
        type="button"
        style={{
          marginTop: 12,
          width: '100%',
          padding: '10px',
          background: T.bg4,
          border: `1px solid ${T.border}`,
          borderRadius: 10,
          color: T.text,
          fontFamily: 'Inter,"Noto Sans Thai"',
          fontWeight: 700,
          fontSize: 12,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          position: 'relative',
          whiteSpace: 'nowrap',
        }}
      >
        ถามโค้ชต่อ
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M9 5l7 7-7 7" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

/**
 * 1 glass = 250ml. Card is purely display + click; the parent passes an
 * `onAdd(ml)` to persist via Server Action. Optimistic state lives here so
 * taps feel instant; on error the parent can revert by re-rendering with
 * a smaller `initialMl`.
 */
function WaterCard({
  initialMl = 1250,
  goalGlasses = 8,
  glassMl = 250,
  onAdd,
}: {
  initialMl?: number;
  goalGlasses?: number;
  glassMl?: number;
  onAdd?: (ml: number) => void;
}) {
  const goal = goalGlasses;
  const initialDrunk = Math.min(goal, Math.round(initialMl / glassMl));
  const [drunk, setDrunk] = useState(initialDrunk);
  const handleClick = (i: number) => {
    const filled = i < drunk;
    if (filled && i === drunk - 1) {
      // Tapping the last filled glass undoes a single +250ml entry.
      // Phase 1 doesn't expose a delete-water action; revert visually only.
      // (User can re-tap to add again.)
      setDrunk(drunk - 1);
      return;
    }
    const next = i + 1;
    const delta = (next - drunk) * glassMl;
    if (delta > 0) {
      setDrunk(next);
      onAdd?.(delta);
    }
  };
  return (
    <div style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 16, padding: 14, gridColumn: 'span 2' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14 }}>💧</span>
          <span
            style={{
              fontFamily: 'Inter,"Noto Sans Thai"',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 0.6,
              textTransform: 'uppercase',
              color: T.textDim,
            }}
          >
            น้ำดื่ม
          </span>
        </div>
        <span style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 800, color: T.text }}>
          {drunk}
          <span style={{ color: T.textMute, fontWeight: 600 }}>/{goal}</span>{' '}
          <span style={{ fontSize: 10, color: T.textMute, fontWeight: 600 }}>แก้ว</span>
        </span>
      </div>
      <div style={{ display: 'flex', gap: 5 }}>
        {Array.from({ length: goal }).map((_, i) => {
          const filled = i < drunk;
          return (
            <button
              type="button"
              key={i}
              onClick={() => handleClick(i)}
              style={{
                flex: 1,
                height: 28,
                borderRadius: 6,
                background: filled ? T.ringBurn : T.bg4,
                border: filled ? `1px solid ${T.ringBurn}` : `1px solid ${T.border}`,
                cursor: 'pointer',
                padding: 0,
              }}
              aria-label={`แก้วที่ ${i + 1}`}
            />
          );
        })}
      </div>
    </div>
  );
}

function MoodCard({
  initialMood = null,
  onSelect,
}: {
  /** 1-5; null when user hasn't logged today yet — UI defaults to 3 ('ดี'). */
  initialMood?: number | null;
  onSelect?: (energy: number) => void;
}) {
  const [mood, setMood] = useState(initialMood ?? 3);
  const handlePick = (v: number) => {
    setMood(v);
    onSelect?.(v);
  };
  const moods = [
    { v: 1, e: '😩', l: 'หมดแรง' },
    { v: 2, e: '😐', l: 'พอไหว' },
    { v: 3, e: '🙂', l: 'ดี' },
    { v: 4, e: '😊', l: 'สดชื่น' },
    { v: 5, e: '🔥', l: 'แรงเต็ม' },
  ];
  return (
    <div style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 16, padding: 14, gridColumn: 'span 2' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 14 }}>⚡</span>
        <span
          style={{
            fontFamily: 'Inter,"Noto Sans Thai"',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
            color: T.textDim,
          }}
        >
          พลังงานวันนี้
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontFamily: 'Inter,"Noto Sans Thai"',
            fontSize: 12,
            fontWeight: 700,
            color: T.text,
          }}
        >
          {moods[mood - 1]!.l}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {moods.map((m) => (
          <button
            type="button"
            key={m.v}
            onClick={() => handlePick(m.v)}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 10,
              background: mood === m.v ? T.coralBg : T.bg4,
              border: mood === m.v ? `1px solid ${T.coral}` : `1px solid ${T.border}`,
              fontSize: 22,
              cursor: 'pointer',
              padding: 0,
              opacity: mood === m.v ? 1 : 0.6,
              transition: 'all 0.15s',
            }}
            aria-label={m.l}
          >
            {m.e}
          </button>
        ))}
      </div>
    </div>
  );
}

function WorkoutCTA() {
  return (
    <div
      style={{
        gridColumn: 'span 2',
        background: 'linear-gradient(120deg, #2A1810 0%, #1C1F26 100%)',
        border: `1px solid ${T.coral}55`,
        borderRadius: 16,
        padding: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: T.coral,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#0E0F12">
          <path d="M6.5 6.5l2-2 4 4-2 2zM15.5 15.5l2-2 4 4-2 2zM4 11l5 5M11 4l5 5" />
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'Inter,"Noto Sans Thai"',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 0.8,
            textTransform: 'uppercase',
            color: T.coral,
          }}
        >
          วันนี้ · Push Day
        </div>
        <div style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontWeight: 800, color: T.text, fontSize: 15, marginTop: 2 }}>
          5 ท่า · ~45 นาที
        </div>
        <div style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 11, color: T.textDim, marginTop: 2 }}>
          ยังไม่ได้เริ่ม
        </div>
      </div>
      <button
        type="button"
        style={{
          height: 42,
          padding: '0 16px',
          borderRadius: 999,
          background: T.coral,
          border: 'none',
          color: '#0E0F12',
          fontFamily: 'Inter,"Noto Sans Thai"',
          fontWeight: 800,
          fontSize: 13,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        เริ่ม
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </button>
    </div>
  );
}

function WeightTrend() {
  const data = [78.2, 78.0, 77.9, 78.1, 77.8, 77.6, 77.7, 77.5, 77.3, 77.4, 77.2, 77.0, 76.9, 76.8];
  const min = Math.min(...data) - 0.3;
  const max = Math.max(...data) + 0.3;
  const w = 280;
  const h = 70;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * h;
    return [x, y] as const;
  });
  const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const area = path + ` L${w},${h} L0,${h} Z`;
  const start = data[0]!;
  const end = data[data.length - 1]!;
  const delta = (end - start).toFixed(1);
  return (
    <div style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 16, padding: 14, gridColumn: 'span 2' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14 }}>⚖️</span>
            <span
              style={{
                fontFamily: 'Inter,"Noto Sans Thai"',
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: 0.6,
                textTransform: 'uppercase',
                color: T.textDim,
              }}
            >
              น้ำหนัก
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
            <span style={{ fontFamily: 'Inter', fontSize: 26, fontWeight: 900, color: T.text, lineHeight: 1 }}>{end}</span>
            <span style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 11, color: T.textMute, fontWeight: 600 }}>kg</span>
            <span
              style={{
                fontFamily: 'Inter',
                fontSize: 11,
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: 999,
                background: T.limeBg,
                color: T.lime,
              }}
            >
              ↓ {Math.abs(Number(delta))} kg
            </span>
          </div>
        </div>
        <span style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 10, fontWeight: 700, color: T.textMute }}>
          14 วันล่าสุด
        </span>
      </div>
      <svg width="100%" height={h + 4} viewBox={`0 0 ${w} ${h + 4}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="wtgrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={T.lime} stopOpacity="0.3" />
            <stop offset="100%" stopColor={T.lime} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#wtgrad)" />
        <path d={path} fill="none" stroke={T.lime} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) =>
          i === pts.length - 1 ? <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill={T.lime} stroke={T.bg} strokeWidth="2" /> : null,
        )}
      </svg>
    </div>
  );
}

function GoalProgress({
  label,
  current,
  start,
  goal,
  unit = 'kg',
  invert = true,
}: {
  label: string;
  current: number;
  start: number;
  goal: number;
  unit?: string;
  invert?: boolean;
}) {
  const total = invert ? start - goal : goal - start;
  const done = invert ? start - current : current - start;
  const pct = Math.max(0, Math.min(100, (done / total) * 100));
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 13, fontWeight: 700, color: T.text }}>{label}</span>
        <span style={{ fontFamily: 'Inter', fontSize: 11, fontWeight: 700, color: T.textDim }}>{pct.toFixed(0)}%</span>
      </div>
      <div style={{ position: 'relative', height: 10, borderRadius: 999, background: T.bg4, overflow: 'hidden', marginBottom: 6 }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${T.lime}, ${T.limeHi})`,
            borderRadius: 999,
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: 'Inter',
          fontSize: 10,
          fontWeight: 700,
          color: T.textMute,
        }}
      >
        <span>เริ่ม {start}{unit}</span>
        <span style={{ color: T.text, fontWeight: 800 }}>ตอนนี้ {current}{unit}</span>
        <span>เป้า {goal}{unit}</span>
      </div>
    </div>
  );
}

function MonthHeatmap() {
  const days = [0, 1, 2, 0, 2, 3, 0, 0, 1, 2, 0, 3, 2, 0, 0, 2, 1, 0, 3, 2, 0, 0, 2, 3, 1, 0, 2, 0, 1, 0];
  const colorFor = (v: number) => {
    if (v === 0) return T.bg4;
    if (v === 1) return T.coral + '44';
    if (v === 2) return T.coral + '99';
    return T.coral;
  };
  return (
    <div style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 16, padding: 14, marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 13, fontWeight: 800, color: T.text }}>
          กิจกรรมเดือนนี้
        </span>
        <span style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 11, fontWeight: 700, color: T.textDim }}>
          18/30 วัน
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4 }}>
        {days.map((v, i) => (
          <div
            key={i}
            style={{ aspectRatio: '1', borderRadius: 5, background: colorFor(v), border: `1px solid ${T.border}` }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 10, justifyContent: 'flex-end' }}>
        <span style={{ fontFamily: 'Inter', fontSize: 9, fontWeight: 700, color: T.textMute }}>น้อย</span>
        {[0, 1, 2, 3].map((v) => (
          <div key={v} style={{ width: 10, height: 10, borderRadius: 3, background: colorFor(v) }} />
        ))}
        <span style={{ fontFamily: 'Inter', fontSize: 9, fontWeight: 700, color: T.textMute }}>มาก</span>
      </div>
    </div>
  );
}

function WeekBars() {
  const days: { d: string; eaten: number | null; goal: number }[] = [
    { d: 'จ', eaten: 1750, goal: 1820 },
    { d: 'อ', eaten: 1820, goal: 1820 },
    { d: 'พ', eaten: 1900, goal: 1820 },
    { d: 'พฤ', eaten: 1680, goal: 1820 },
    { d: 'ศ', eaten: 2100, goal: 1820 },
    { d: 'ส', eaten: 1450, goal: 1820 },
    { d: 'อา', eaten: null, goal: 1820 },
  ];
  const max = 2400;
  return (
    <div style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 16, padding: 14, marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 13, fontWeight: 800, color: T.text }}>
          กินเทียบเป้า
        </span>
        <span style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 11, fontWeight: 700, color: T.textDim }}>
          เฉลี่ย 1,783 kcal/วัน
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 110, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: `${(1820 / max) * 100}%`,
            height: 1,
            background: T.coral,
            opacity: 0.4,
            borderTop: `1px dashed ${T.coral}`,
          }}
        />
        {days.map((day, i) => {
          const h = day.eaten ? (day.eaten / max) * 100 : 0;
          const over = day.eaten !== null && day.eaten > day.goal;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                height: '100%',
                justifyContent: 'flex-end',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: `${h}%`,
                  background: day.eaten === null ? T.bg4 : over ? T.coral : T.lime,
                  borderRadius: '6px 6px 2px 2px',
                  opacity: day.eaten === null ? 0.4 : 1,
                  minHeight: day.eaten ? 4 : 0,
                }}
              />
              <span style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 10, fontWeight: 700, color: T.textDim }}>
                {day.d}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BigStatsGrid({ stats }: { stats: { label: string; value: string; sub?: string; color?: string }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
      {stats.map((s, i) => (
        <div key={i} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 14, padding: 14 }}>
          <div
            style={{
              fontFamily: 'Inter,"Noto Sans Thai"',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 0.6,
              textTransform: 'uppercase',
              color: T.textDim,
              marginBottom: 4,
            }}
          >
            {s.label}
          </div>
          <div
            style={{
              fontFamily: 'Inter',
              fontSize: 24,
              fontWeight: 900,
              color: s.color || T.text,
              lineHeight: 1,
            }}
          >
            {s.value}
          </div>
          {s.sub && (
            <div
              style={{
                fontFamily: 'Inter,"Noto Sans Thai"',
                fontSize: 11,
                fontWeight: 600,
                color: T.textMute,
                marginTop: 4,
              }}
            >
              {s.sub}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const insights: Record<Range, Insight[]> = {
  today: [
    { tone: 'warn', text: 'นาย<b>ขาดโปรตีน 30g</b> — ลองเพิ่มไก่ต้มหรือไข่ขาวอีก 1 มื้อ' },
    { tone: 'warn', text: '<b>ดื่มน้ำน้อยไป 2 แก้ว</b> เหลือเวลาอีกแค่ 4 ชม. ก่อนนอน' },
    { tone: 'good', text: 'แคลอรี่อยู่ในเป้า · ออกกำลังเสร็จเรียบร้อย ✓' },
  ],
  week: [
    { tone: 'good', text: 'น้ำหนัก<b>ลงไป 0.6 kg</b> ในสัปดาห์นี้ — pace กำลังดี' },
    { tone: 'warn', text: 'วันศุกร์<b>เกินเป้า 280 kcal</b> (กินนอกบ้าน) ลองวางแผนล่วงหน้า' },
    { tone: 'warn', text: '<b>โปรตีนเฉลี่ย 95g/วัน</b> ต่ำกว่าเป้า 25g — เพิ่มมื้อเช้าได้' },
    { tone: 'good', text: 'เล่นได้ 4/4 วันตามแผน · streak ไม่ขาด' },
  ],
  month: [
    { tone: 'good', text: 'น้ำหนัก<b>ลง 2.4 kg ใน 30 วัน</b> — เร็วกว่าเป้า 20%' },
    { tone: 'warn', text: '<b>วันศุกร์-เสาร์เกินเป้าบ่อย</b> 6 ใน 8 ครั้ง — pattern ชัด' },
    { tone: 'good', text: 'เล่น 18/30 วัน เกินเป้า 15 วัน 💪' },
    { tone: 'warn', text: 'นอนเฉลี่ย <b>6.2 ชม./คืน</b> ต่ำไป — กระทบฟื้นตัว' },
  ],
};

export type TodayScreenProps = {
  onTab?: (t: TabId) => void;
  activeTab?: TabId;
  /** Live data from RSC. Falls back to design defaults for /canvas review. */
  data?: {
    displayName?: string;
    streak?: number;
    kcalEaten?: number;
    kcalGoal?: number;
    kcalBurned?: number;
    waterMl?: number;
    moodEnergy?: number | null;
  };
  /** Optional mutation hooks. When supplied, click writes through to the
   * Server Action; if omitted the card falls back to local-only optimistic
   * state (used by /canvas review). */
  onAddWater?: (ml: number) => void;
  onSelectMood?: (energy: number) => void;
};

export function TodayScreen({
  onTab,
  activeTab = 'today' as TabId,
  data,
  onAddWater,
  onSelectMood,
}: TodayScreenProps) {
  const [range, setRange] = useState<Range>('today');
  const waterMl = data?.waterMl ?? 1250;
  const moodEnergy = data?.moodEnergy ?? null;
  const displayName = data?.displayName ?? 'โบ้';
  const streak = data?.streak ?? 12;
  const kcalEaten = data?.kcalEaten ?? 1450;
  const kcalGoal = data?.kcalGoal ?? 1820;
  const kcalBurned = data?.kcalBurned ?? 320;
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: T.bg,
        position: 'relative',
      }}
    >
      <div
        style={{
          padding: '14px 18px 12px',
          borderBottom: `1px solid ${T.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'Inter,"Noto Sans Thai"',
              fontSize: 11,
              fontWeight: 700,
              color: T.textDim,
              letterSpacing: 0.6,
              textTransform: 'uppercase',
            }}
          >
            สวัสดีตอนเช้า
          </div>
          <h1 style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontWeight: 900, fontSize: 22, color: T.text, margin: '2px 0 0' }}>
            {displayName} 👋
          </h1>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 11px',
            borderRadius: 999,
            background: T.limeBg,
            border: `1px solid ${T.lime}55`,
          }}
        >
          <span style={{ fontSize: 13 }}>🔥</span>
          <span style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 900, color: T.lime }}>{streak}</span>
          <span style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 10, fontWeight: 700, color: T.lime, opacity: 0.85 }}>
            วัน
          </span>
        </div>
      </div>

      <div style={{ padding: '12px 16px 4px', flexShrink: 0 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            background: T.bg3,
            padding: 4,
            borderRadius: 12,
            border: `1px solid ${T.border}`,
          }}
        >
          {(
            [
              { id: 'today' as Range, label: 'วันนี้' },
              { id: 'week' as Range, label: 'สัปดาห์' },
              { id: 'month' as Range, label: 'เดือน' },
            ]
          ).map((t) => (
            <button
              type="button"
              key={t.id}
              onClick={() => setRange(t.id)}
              style={{
                padding: '8px 0',
                borderRadius: 9,
                background: range === t.id ? T.coral : 'transparent',
                border: 'none',
                color: range === t.id ? '#0E0F12' : T.textDim,
                fontFamily: 'Inter,"Noto Sans Thai"',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px 8px' }}>
        {range === 'today' && (
          <>
            <div
              style={{
                background: T.bg3,
                border: `1px solid ${T.border}`,
                borderRadius: 20,
                padding: '20px 14px 8px',
                marginBottom: 14,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <TripleRing size={210} eaten={kcalEaten} goal={kcalGoal || 1820} burned={kcalBurned} />
              <RingLegend eaten={kcalEaten} burned={kcalBurned} goal={kcalGoal || 1820} />
            </div>
            <AIInsightCard items={insights.today} range="today" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              <WorkoutCTA />
              <WaterCard initialMl={waterMl} onAdd={onAddWater} />
              <MoodCard initialMood={moodEnergy} onSelect={onSelectMood} />
              <WeightTrend />
            </div>
          </>
        )}

        {range === 'week' && (
          <>
            <div
              style={{
                background: 'linear-gradient(135deg, #1C1F26 0%, #1A2614 100%)',
                border: `1px solid ${T.lime}33`,
                borderRadius: 20,
                padding: 18,
                marginBottom: 14,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: 'Inter,"Noto Sans Thai"',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 1.4,
                  textTransform: 'uppercase',
                  color: T.lime,
                }}
              >
                7 วันที่ผ่านมา
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8, marginTop: 6 }}>
                <span style={{ fontFamily: 'Inter', fontSize: 44, fontWeight: 900, color: T.text, lineHeight: 1 }}>↓ 0.6</span>
                <span style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 14, color: T.textDim, fontWeight: 700 }}>kg</span>
              </div>
              <div
                style={{
                  fontFamily: 'Inter,"Noto Sans Thai"',
                  fontSize: 12,
                  color: T.textDim,
                  marginTop: 4,
                  fontWeight: 600,
                }}
              >
                น้ำหนักเปลี่ยน · pace ดีมาก 🎯
              </div>
            </div>
            <AIInsightCard items={insights.week} range="week" />
            <BigStatsGrid
              stats={[
                { label: 'เล่นไป', value: '4/4', sub: 'ครบตามแผน', color: T.lime },
                { label: 'แคลอรี่เฉลี่ย', value: '1,783', sub: '/ เป้า 1,820', color: T.text },
                { label: 'โปรตีนเฉลี่ย', value: '95g', sub: 'ต่ำกว่าเป้า 25g', color: T.coral },
                { label: 'น้ำเฉลี่ย', value: '6.4', sub: 'แก้ว / 8', color: T.text },
              ]}
            />
            <WeekBars />
            <WeightTrend />
          </>
        )}

        {range === 'month' && (
          <>
            <div
              style={{
                background: T.bg3,
                border: `1px solid ${T.border}`,
                borderRadius: 20,
                padding: 18,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontFamily: 'Inter,"Noto Sans Thai"',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 1.4,
                  textTransform: 'uppercase',
                  color: T.textDim,
                  marginBottom: 12,
                }}
              >
                ความคืบหน้าเป้าหมาย
              </div>
              <GoalProgress label="ลดน้ำหนัก → 75 kg" current={76.8} start={80} goal={75} />
              <GoalProgress label="โปรตีน 120g/วัน เฉลี่ย" current={108} start={75} goal={120} unit="g" invert={false} />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 14px',
                  background: T.limeBg,
                  border: `1px solid ${T.lime}55`,
                  borderRadius: 12,
                  marginTop: 6,
                }}
              >
                <span style={{ fontSize: 22 }}>🎯</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontWeight: 800, color: T.text, fontSize: 13 }}>
                    เร็วกว่าแผน 5 วัน
                  </div>
                  <div
                    style={{
                      fontFamily: 'Inter,"Noto Sans Thai"',
                      fontSize: 11,
                      color: T.textDim,
                      fontWeight: 600,
                      marginTop: 2,
                    }}
                  >
                    ทำต่อแบบนี้ จบ goal วันที่ 18 ธ.ค.
                  </div>
                </div>
              </div>
            </div>
            <AIInsightCard items={insights.month} range="month" />
            <BigStatsGrid
              stats={[
                { label: 'เล่นไปทั้งหมด', value: '18', sub: 'จาก 30 วัน', color: T.lime },
                { label: 'น้ำหนักหาย', value: '↓2.4', sub: 'kg ใน 30 วัน', color: T.lime },
                { label: 'Streak ยาวสุด', value: '12', sub: 'วันต่อเนื่อง', color: T.coral },
                { label: 'วันถึงเป้าแคล', value: '22', sub: '/ 30 วัน · 73%', color: T.text },
              ]}
            />
            <MonthHeatmap />
            <div style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 16, padding: 14, marginBottom: 14 }}>
              <div
                style={{
                  fontFamily: 'Inter,"Noto Sans Thai"',
                  fontSize: 13,
                  fontWeight: 800,
                  color: T.text,
                  marginBottom: 10,
                }}
              >
                เทียบ Before / After
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: '1 ต.ค.', wt: '79.2', bf: '24%' },
                  { label: '30 ต.ค.', wt: '76.8', bf: '21%', highlight: true },
                ].map((s, i) => (
                  <div
                    key={i}
                    style={{
                      background: s.highlight ? T.limeBg : T.bg4,
                      border: s.highlight ? `1px solid ${T.lime}55` : `1px solid ${T.border}`,
                      borderRadius: 12,
                      padding: 12,
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'Inter,"Noto Sans Thai"',
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: 0.6,
                        textTransform: 'uppercase',
                        color: s.highlight ? T.lime : T.textDim,
                      }}
                    >
                      {s.label}
                    </div>
                    <div style={{ fontFamily: 'Inter', fontSize: 22, fontWeight: 900, color: T.text, marginTop: 4 }}>
                      {s.wt}
                      <span style={{ fontSize: 11, color: T.textMute, fontWeight: 600 }}> kg</span>
                    </div>
                    <div
                      style={{
                        fontFamily: 'Inter,"Noto Sans Thai"',
                        fontSize: 11,
                        fontWeight: 700,
                        color: T.textDim,
                        marginTop: 2,
                      }}
                    >
                      ไขมัน {s.bf}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div style={{ height: 96 }} />
      </div>

      <BottomTabBar active={activeTab} onTab={onTab} />
    </div>
  );
}
