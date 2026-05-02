'use client';

import { useRef, useState } from 'react';
import { BottomTabBar, MacroBar, type TabId } from '@/components/coach/primitives';
import { T } from '@/lib/design/tokens';
import type { Insight, InsightRange } from '@/lib/types/dto/insights';
import type { FoodLogItemDto } from '@/lib/types/dto/food-logs';

type Range = InsightRange;

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

function AIInsightCard({
  items,
  range = 'today',
  loading = false,
}: {
  items: Insight[];
  range?: Range;
  loading?: boolean;
}) {
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
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
          {[70, 90, 55].map((w, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 7, background: T.bg4 }} />
              <div style={{ height: 13, borderRadius: 6, background: T.bg4, width: `${w}%`, opacity: 0.6 }} />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div style={{ color: T.textMute, fontSize: 13, fontFamily: 'Inter,"Noto Sans Thai"', textAlign: 'center', padding: '8px 0', position: 'relative' }}>
          ยังไม่มีข้อมูลพอวิเคราะห์ · บันทึกอาหารและออกกำลังกายเพิ่มเติม
        </div>
      ) : (
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
      )}
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
  readOnly = false,
}: {
  initialMl?: number;
  goalGlasses?: number;
  glassMl?: number;
  onAdd?: (ml: number) => void;
  readOnly?: boolean;
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
              onClick={readOnly ? undefined : () => handleClick(i)}
              style={{
                flex: 1,
                height: 28,
                borderRadius: 6,
                background: filled ? T.ringBurn : T.bg4,
                border: filled ? `1px solid ${T.ringBurn}` : `1px solid ${T.border}`,
                cursor: readOnly ? 'default' : 'pointer',
                padding: 0,
                opacity: readOnly ? 0.7 : 1,
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
  readOnly = false,
}: {
  /** 1-5; null when user hasn't logged today yet — UI defaults to 3 ('ดี'). */
  initialMood?: number | null;
  onSelect?: (energy: number) => void;
  readOnly?: boolean;
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
            onClick={readOnly ? undefined : () => handlePick(m.v)}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 10,
              background: mood === m.v ? T.coralBg : T.bg4,
              border: mood === m.v ? `1px solid ${T.coral}` : `1px solid ${T.border}`,
              fontSize: 22,
              cursor: readOnly ? 'default' : 'pointer',
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

function WorkoutCTA({
  workout,
  onStart,
}: {
  workout?: { name: string; exerciseCount: number; mins: number } | null;
  onStart?: () => void;
}) {
  const isRestDay = workout === null;
  const label = isRestDay ? 'พักผ่อน' : (workout?.name ?? 'ออกกำลังกาย');
  const detail = isRestDay
    ? 'วันพัก — ฟื้นตัวให้เต็มที่'
    : workout
    ? `${workout.exerciseCount} ท่า · ~${workout.mins} นาที`
    : 'ยังไม่มีแผน — บอกโค้ชเลย';

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
          background: isRestDay ? T.bg4 : T.coral,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill={isRestDay ? T.textDim : '#0E0F12'}>
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
            color: isRestDay ? T.textDim : T.coral,
          }}
        >
          วันนี้ · {label}
        </div>
        <div style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontWeight: 800, color: T.text, fontSize: 15, marginTop: 2 }}>
          {detail}
        </div>
        <div style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 11, color: T.textDim, marginTop: 2 }}>
          ยังไม่ได้เริ่ม
        </div>
      </div>
      {!isRestDay && (
        <button
          type="button"
          onClick={onStart}
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
      )}
    </div>
  );
}

function WeightTrend({
  latestWeightKg,
  series,
}: {
  latestWeightKg?: number | null;
  /** Oldest→newest kg values. ≥2 required for sparkline. */
  series?: number[] | null;
}) {
  const w = 280;
  const h = 70;
  const hasWeight = latestWeightKg != null;
  const hasSpark = series != null && series.length >= 2;
  const sparkData = hasSpark ? series : [];
  const min = hasSpark ? Math.min(...sparkData) - 0.3 : 0;
  const max = hasSpark ? Math.max(...sparkData) + 0.3 : 1;
  const pts = sparkData.map((v, i) => {
    const x = (i / (sparkData.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * h;
    return [x, y] as const;
  });
  const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const area = path + ` L${w},${h} L0,${h} Z`;
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
            <span style={{ fontFamily: 'Inter', fontSize: 26, fontWeight: 900, color: hasWeight ? T.text : T.textMute, lineHeight: 1 }}>
              {hasWeight ? latestWeightKg : '—'}
            </span>
            <span style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 11, color: T.textMute, fontWeight: 600 }}>kg</span>
            {!hasWeight && (
              <span style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 11, color: T.textMute, fontWeight: 600 }}>
                ยังไม่ได้บันทึก
              </span>
            )}
          </div>
        </div>
        <span style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 10, fontWeight: 700, color: T.textMute }}>
          แจ้งโค้ชได้เลย
        </span>
      </div>
      {hasWeight && hasSpark && (
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
      )}
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

function MonthHeatmap({ days }: { days: { dateIct: string; level: 0 | 1 | 2 | 3 }[] | null }) {
  const FALLBACK = [0, 1, 2, 0, 2, 3, 0, 0, 1, 2, 0, 3, 2, 0, 0, 2, 1, 0, 3, 2, 0, 0, 2, 3, 1, 0, 2, 0, 1, 0];
  const levels = days ? days.map((d) => d.level) : FALLBACK;
  const activeDays = days ? days.filter((d) => d.level > 0).length : 18;
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
          {activeDays}/30 วัน
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4 }}>
        {levels.map((v, i) => (
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

const DAY_LABELS: Record<number, string> = { 0: 'อา', 1: 'จ', 2: 'อ', 3: 'พ', 4: 'พฤ', 5: 'ศ', 6: 'ส' };

function WeekBars({ days = [], kcalGoal = 0 }: { days?: { dateIct: string; kcal: number }[]; kcalGoal?: number }) {
  // Build 7 slots: past 6 days + today (ICT).
  const slots = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() + 7 * 3600 * 1000 - (6 - i) * 86400000);
    const dateIct = d.toISOString().slice(0, 10);
    const dow = d.getUTCDay();
    const found = days.find((x) => x.dateIct === dateIct);
    return { label: DAY_LABELS[dow] ?? '', kcal: found?.kcal ?? null };
  });
  const goal = kcalGoal || 1820;
  const max = Math.max(goal * 1.2, ...slots.map((s) => s.kcal ?? 0), 100);
  const avgKcal = slots.filter((s) => s.kcal != null).length
    ? Math.round(slots.filter((s) => s.kcal != null).reduce((a, s) => a + (s.kcal ?? 0), 0) / slots.filter((s) => s.kcal != null).length)
    : 0;
  return (
    <div style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 16, padding: 14, marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 13, fontWeight: 800, color: T.text }}>
          กินเทียบเป้า
        </span>
        <span style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 11, fontWeight: 700, color: T.textDim }}>
          {avgKcal > 0 ? `เฉลี่ย ${avgKcal.toLocaleString()} kcal/วัน` : 'ยังไม่มีข้อมูล'}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 110, position: 'relative' }}>
        {goal > 0 && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: `${(goal / max) * 100}%`,
              height: 1,
              background: T.coral,
              opacity: 0.4,
              borderTop: `1px dashed ${T.coral}`,
            }}
          />
        )}
        {slots.map((day, i) => {
          const h = day.kcal != null ? (day.kcal / max) * 100 : 0;
          const over = day.kcal != null && goal > 0 && day.kcal > goal;
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
                  background: day.kcal == null ? T.bg4 : over ? T.coral : T.lime,
                  borderRadius: '6px 6px 2px 2px',
                  opacity: day.kcal == null ? 0.3 : 1,
                  minHeight: day.kcal ? 4 : 0,
                }}
              />
              <span style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 10, fontWeight: 700, color: T.textDim }}>
                {day.label}
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


// ─── Food Log List ───────────────────────────────────────────────────

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
const MEAL_LABEL_TH: Record<string, string> = {
  breakfast: 'เช้า',
  lunch: 'กลางวัน',
  dinner: 'เย็น',
  snack: 'ของว่าง',
};

function FoodLogList({
  items = [],
  onDelete,
  onUpdate,
}: {
  items?: FoodLogItemDto[];
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, changes: { kcal: number; proteinG: number; carbG: number; fatG: number }) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ kcal: '', proteinG: '', carbG: '', fatG: '' });

  const grouped = MEAL_ORDER.map((meal) => ({
    meal,
    rows: items.filter((i) => i.mealType === meal),
  })).filter((g) => g.rows.length > 0);

  const startEdit = (item: FoodLogItemDto) => {
    setDeletingId(null);
    setEditingId(item.id);
    setEditValues({
      kcal: String(item.kcal),
      proteinG: String(item.proteinG),
      carbG: String(item.carbG),
      fatG: String(item.fatG),
    });
  };

  const confirmEdit = (id: string) => {
    const kcal = parseInt(editValues.kcal, 10);
    const proteinG = parseFloat(editValues.proteinG);
    const carbG = parseFloat(editValues.carbG);
    const fatG = parseFloat(editValues.fatG);
    if (!isNaN(kcal) && !isNaN(proteinG) && !isNaN(carbG) && !isNaN(fatG)) {
      onUpdate?.(id, { kcal, proteinG, carbG, fatG });
    }
    setEditingId(null);
  };

  const confirmDelete = (id: string) => {
    onDelete?.(id);
    setDeletingId(null);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 8px',
    borderRadius: 8,
    border: `1px solid ${T.border}`,
    background: T.bg,
    color: T.text,
    fontSize: 13,
    fontFamily: 'Inter,"Noto Sans Thai"',
    outline: 'none',
    textAlign: 'center',
  };

  return (
    <div
      style={{
        background: T.bg3,
        border: `1px solid ${T.border}`,
        borderRadius: 16,
        padding: 14,
        marginBottom: 14,
      }}
    >
      <div
        style={{
          fontFamily: 'Inter,"Noto Sans Thai"',
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          color: T.textDim,
          marginBottom: grouped.length === 0 ? 8 : 12,
        }}
      >
        รายการอาหารวันนี้
      </div>

      {grouped.length === 0 && (
        <div style={{ color: T.textMute, fontSize: 13, fontFamily: 'Inter,"Noto Sans Thai"', textAlign: 'center', padding: '8px 0' }}>
          ยังไม่มีรายการ · บอกโค้ชได้เลยว่ากินอะไร
        </div>
      )}

      {grouped.map(({ meal, rows }, gi) => (
        <div key={meal} style={{ marginBottom: gi < grouped.length - 1 ? 12 : 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textDim, marginBottom: 6, fontFamily: 'Inter,"Noto Sans Thai"' }}>
            {MEAL_LABEL_TH[meal]}
          </div>
          {rows.map((item) => {
            const isEditing = editingId === item.id;
            const isDeleting = deletingId === item.id;

            if (isDeleting) {
              return (
                <div
                  key={item.id}
                  style={{
                    background: T.bg4,
                    borderRadius: 10,
                    padding: '10px 12px',
                    marginBottom: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 12, color: T.textDim, fontFamily: 'Inter,"Noto Sans Thai"' }}>
                    ลบ <strong style={{ color: T.text }}>{item.nameTh}</strong>?
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => setDeletingId(null)}
                      style={{ padding: '5px 10px', borderRadius: 8, border: `1px solid ${T.border}`, background: 'transparent', color: T.textDim, fontSize: 12, cursor: 'pointer' }}
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={() => confirmDelete(item.id)}
                      style={{ padding: '5px 10px', borderRadius: 8, border: 'none', background: '#EF4444', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              );
            }

            if (isEditing) {
              return (
                <div
                  key={item.id}
                  style={{
                    background: T.bg4,
                    borderRadius: 10,
                    padding: '10px 12px',
                    marginBottom: 6,
                  }}
                >
                  <div style={{ fontSize: 11, color: T.textDim, fontFamily: 'Inter,"Noto Sans Thai"', marginBottom: 8 }}>
                    ✎ แก้ไข · {item.nameTh}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 6, marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 10, color: T.textMute, marginBottom: 3, fontFamily: 'Inter', textAlign: 'center' }}>kcal</div>
                      <input style={inputStyle} type="number" value={editValues.kcal} onChange={(e) => setEditValues((v) => ({ ...v, kcal: e.target.value }))} min={0} max={5000} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: '#6EE7B7', marginBottom: 3, fontFamily: 'Inter', textAlign: 'center' }}>P(g)</div>
                      <input style={inputStyle} type="number" value={editValues.proteinG} onChange={(e) => setEditValues((v) => ({ ...v, proteinG: e.target.value }))} min={0} max={500} step={0.1} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: '#93C5FD', marginBottom: 3, fontFamily: 'Inter', textAlign: 'center' }}>C(g)</div>
                      <input style={inputStyle} type="number" value={editValues.carbG} onChange={(e) => setEditValues((v) => ({ ...v, carbG: e.target.value }))} min={0} max={500} step={0.1} />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: '#FCA5A5', marginBottom: 3, fontFamily: 'Inter', textAlign: 'center' }}>F(g)</div>
                      <input style={inputStyle} type="number" value={editValues.fatG} onChange={(e) => setEditValues((v) => ({ ...v, fatG: e.target.value }))} min={0} max={500} step={0.1} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => setEditingId(null)}
                      style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: `1px solid ${T.border}`, background: 'transparent', color: T.textDim, fontSize: 12, cursor: 'pointer' }}
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={() => confirmEdit(item.id)}
                      style={{ flex: 2, padding: '7px 0', borderRadius: 8, border: 'none', background: T.coral, color: '#0E0F12', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                    >
                      บันทึก
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  borderRadius: 10,
                  background: T.bg4,
                  marginBottom: 6,
                }}
              >
                {item.photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.photoUrl}
                    alt="รูปอาหาร"
                    style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 13, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.nameTh}
                  </div>
                  <div style={{ fontSize: 11, color: T.textMute, fontFamily: 'Inter', marginTop: 2 }}>
                    P{item.proteinG}·C{item.carbG}·F{item.fatG}g
                    {item.portionG ? ` · ${item.portionG}g` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 800, color: T.coral }}>
                    {item.kcalLow && item.kcalHigh && item.kcalLow !== item.kcalHigh
                      ? `${item.kcalLow}–${item.kcalHigh}`
                      : item.kcal}
                  </div>
                  <div style={{ fontSize: 10, color: T.textMute }}>kcal</div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button
                    onClick={() => startEdit(item)}
                    aria-label={`แก้ไข ${item.nameTh}`}
                    style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${T.border}`, background: 'transparent', color: T.textDim, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => { setEditingId(null); setDeletingId(item.id); }}
                    aria-label={`ลบ ${item.nameTh}`}
                    style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${T.border}`, background: 'transparent', color: T.textMute, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export type TodayScreenProps = {
  onTab?: (t: TabId) => void;
  activeTab?: TabId;
  /** Live data from RSC. Falls back to design defaults for /canvas review. */
  data?: {
    displayName?: string;
    streak?: number;
    streakLongest?: number;
    kcalEaten?: number;
    kcalGoal?: number;
    kcalBurned?: number;
    waterMl?: number;
    moodEnergy?: number | null;
    proteinEaten?: number;
    carbEaten?: number;
    fatEaten?: number;
    proteinGoal?: number;
    carbGoal?: number;
    fatGoal?: number;
    latestWeightKg?: number | null;
    /** undefined = no active plan; null = rest day; object = real workout */
    todayWorkout?: { name: string; exerciseCount: number; mins: number } | null;
    targetWeightKg?: number | null;
    weightKgInitial?: number | null;
    daysPerWeek?: number;
    week7Days?: { dateIct: string; kcal: number }[];
    week7AvgKcal?: number;
    week7AvgProteinG?: number;
    week7AvgWaterGlasses?: number;
    week7WorkoutCount?: number;
    week7WeightDeltaKg?: number | null;
    month30WorkoutCount?: number;
    month30WeightDeltaKg?: number | null;
    month30DaysHitKcal?: number;
    month30ActivityDays?: { dateIct: string; level: 0 | 1 | 2 | 3 }[];
    /** Weight readings oldest→newest. ≥2 entries → sparkline shown. Empty = hide. */
    weightSeriesKg?: number[];
    /** Confirmed food logs for today — rendered as FoodLogList. */
    todayFoodLogs?: FoodLogItemDto[];
  };
  /** Optional mutation hooks. When supplied, click writes through to the
   * Server Action; if omitted the card falls back to local-only optimistic
   * state (used by /canvas review). */
  onAddWater?: (ml: number) => void;
  onSelectMood?: (energy: number) => void;
  onStartWorkout?: () => void;
  onDeleteFoodLog?: (id: string) => void;
  onUpdateFoodLog?: (id: string, changes: { kcal: number; proteinG: number; carbG: number; fatG: number }) => void;
  /** YYYY-MM-DD ICT date currently viewed. Defaults to today. */
  selectedDate?: string;
  onDateChange?: (dateIct: string) => void;
  /** False when viewing a past day — disables water/mood write actions and hides WorkoutCTA. */
  isToday?: boolean;
  /** Controlled range from parent. When omitted, TodayScreen manages its own range state. */
  range?: Range;
  onRangeChange?: (r: Range) => void;
  /** AI-generated insights for the current range. Undefined = not yet fetched (show hardcoded fallback). */
  insights?: Insight[];
  insightsLoading?: boolean;
};

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

function todayIctStr(): string {
  return new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
}

function fmtDateThai(dateIct: string, isToday: boolean): string {
  const [, m, d] = dateIct.split('-').map(Number);
  const base = `${d} ${THAI_MONTHS[m! - 1]}`;
  return isToday ? `วันนี้ · ${base}` : base;
}

function shiftDay(dateIct: string, delta: number): string {
  const [y, m, d] = dateIct.split('-').map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d!));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().slice(0, 10);
}

export function TodayScreen({
  onTab,
  activeTab = 'today' as TabId,
  data,
  onAddWater,
  onSelectMood,
  onStartWorkout,
  onDeleteFoodLog,
  onUpdateFoodLog,
  selectedDate,
  onDateChange,
  isToday = true,
  range: controlledRange,
  onRangeChange,
  insights: insightsProp,
  insightsLoading = false,
}: TodayScreenProps) {
  const [internalRange, setInternalRange] = useState<Range>('today');
  const calendarRef = useRef<HTMLInputElement>(null);
  const curDate = selectedDate ?? todayIctStr();
  const range = controlledRange ?? internalRange;
  const setRange = (r: Range) => {
    setInternalRange(r);
    onRangeChange?.(r);
  };
  const waterMl = data?.waterMl ?? 1250;
  const moodEnergy = data?.moodEnergy ?? null;
  const displayName = data?.displayName ?? 'โบ้';
  const streak = data?.streak ?? 12;
  const kcalEaten = data?.kcalEaten ?? 1450;
  const kcalGoal = data?.kcalGoal ?? 1820;
  const kcalBurned = data?.kcalBurned ?? 320;
  const proteinEaten = data?.proteinEaten ?? 0;
  const carbEaten = data?.carbEaten ?? 0;
  const fatEaten = data?.fatEaten ?? 0;
  const proteinGoal = data?.proteinGoal ?? 140;
  const carbGoal = data?.carbGoal ?? 200;
  const fatGoal = data?.fatGoal ?? 60;
  const latestWeightKg = data?.latestWeightKg ?? null;
  const todayWorkout = data?.todayWorkout;
  const streakLongest = data?.streakLongest ?? 0;
  const targetWeightKg = data?.targetWeightKg ?? null;
  const weightKgInitial = data?.weightKgInitial ?? null;
  const daysPerWeek = data?.daysPerWeek ?? 3;
  const week7Days = data?.week7Days ?? [];
  const week7AvgKcal = data?.week7AvgKcal ?? 0;
  const week7AvgProteinG = data?.week7AvgProteinG ?? 0;
  const week7AvgWaterGlasses = data?.week7AvgWaterGlasses ?? 0;
  const week7WorkoutCount = data?.week7WorkoutCount ?? 0;
  const week7WeightDeltaKg = data?.week7WeightDeltaKg ?? null;
  const month30WorkoutCount = data?.month30WorkoutCount ?? 0;
  const month30WeightDeltaKg = data?.month30WeightDeltaKg ?? null;
  const month30DaysHitKcal = data?.month30DaysHitKcal ?? 0;
  const month30ActivityDays = data?.month30ActivityDays ?? null;
  const weightSeriesKg = data?.weightSeriesKg ?? null;
  return (
    <div
      style={{
        width: '100%',
        height: '100dvh',
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

      <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px calc(76px + env(safe-area-inset-bottom, 0px))' }}>
        {range === 'today' && (
          <>
            {/* Date navigation bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 12, position: 'relative' }}>
              <button
                type="button"
                onClick={() => onDateChange?.(shiftDay(curDate, -1))}
                aria-label="วันก่อนหน้า"
                style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${T.border}`, background: T.bg3, color: T.textDim, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>

              <button
                type="button"
                onClick={() => calendarRef.current?.showPicker?.() ?? calendarRef.current?.click()}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 10, border: `1px solid ${T.border}`, background: isToday ? T.coralBg : T.bg3, color: isToday ? T.coral : T.text, fontFamily: 'Inter,"Noto Sans Thai"', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                {fmtDateThai(curDate, isToday)}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </button>
              {/* Hidden native date picker */}
              <input
                ref={calendarRef}
                type="date"
                max={todayIctStr()}
                value={curDate}
                onChange={(e) => e.target.value && onDateChange?.(e.target.value)}
                style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
                tabIndex={-1}
                aria-hidden
              />

              <button
                type="button"
                onClick={() => { if (!isToday) onDateChange?.(shiftDay(curDate, 1)); }}
                disabled={isToday}
                aria-label="วันถัดไป"
                style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${T.border}`, background: T.bg3, color: isToday ? T.bg4 : T.textDim, cursor: isToday ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>

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
            <div
              style={{
                background: T.bg3,
                border: `1px solid ${T.border}`,
                borderRadius: 16,
                padding: 14,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontFamily: 'Inter,"Noto Sans Thai"',
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: 0.6,
                  textTransform: 'uppercase',
                  color: T.textDim,
                  marginBottom: 10,
                }}
              >
                แมครอวันนี้
              </div>
              <MacroBar
                p={{ eaten: proteinEaten, goal: proteinGoal }}
                c={{ eaten: carbEaten, goal: carbGoal }}
                f={{ eaten: fatEaten, goal: fatGoal }}
              />
            </div>
            <FoodLogList
              items={data?.todayFoodLogs}
              onDelete={onDeleteFoodLog}
              onUpdate={onUpdateFoodLog}
            />
            <AIInsightCard
              items={insightsLoading ? [] : (insightsProp ?? [])}
              range="today"
              loading={insightsLoading}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              {isToday && <WorkoutCTA workout={todayWorkout} onStart={onStartWorkout} />}
              <WaterCard initialMl={waterMl} onAdd={isToday ? onAddWater : undefined} readOnly={!isToday} />
              <MoodCard initialMood={moodEnergy} onSelect={isToday ? onSelectMood : undefined} readOnly={!isToday} />
              <WeightTrend latestWeightKg={latestWeightKg} series={weightSeriesKg} />
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
              {week7WeightDeltaKg != null ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8, marginTop: 6 }}>
                    <span style={{ fontFamily: 'Inter', fontSize: 44, fontWeight: 900, color: T.text, lineHeight: 1 }}>
                      {week7WeightDeltaKg > 0 ? '↑' : '↓'} {Math.abs(week7WeightDeltaKg)}
                    </span>
                    <span style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 14, color: T.textDim, fontWeight: 700 }}>kg</span>
                  </div>
                  <div style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 12, color: T.textDim, marginTop: 4, fontWeight: 600 }}>
                    น้ำหนักเปลี่ยนจาก 7 วันที่แล้ว
                  </div>
                </>
              ) : (
                <div style={{ marginTop: 12, fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 14, color: T.textMute, fontWeight: 600 }}>
                  ยังไม่มีข้อมูลน้ำหนัก — แจ้งโค้ชได้เลย
                </div>
              )}
            </div>
            <AIInsightCard
              items={insightsLoading ? [] : (insightsProp ?? [])}
              range="week"
              loading={insightsLoading}
            />
            <BigStatsGrid
              stats={[
                {
                  label: 'เล่นไป',
                  value: `${week7WorkoutCount}/${daysPerWeek}`,
                  sub: week7WorkoutCount >= daysPerWeek ? 'ครบตามแผน 💪' : `เป้า ${daysPerWeek} วัน/สัปดาห์`,
                  color: week7WorkoutCount >= daysPerWeek ? T.lime : T.text,
                },
                {
                  label: 'แคลอรี่เฉลี่ย',
                  value: week7AvgKcal > 0 ? week7AvgKcal.toLocaleString() : '—',
                  sub: kcalGoal > 0 ? `/ เป้า ${kcalGoal.toLocaleString()}` : '',
                  color: T.text,
                },
                {
                  label: 'โปรตีนเฉลี่ย',
                  value: week7AvgProteinG > 0 ? `${week7AvgProteinG}g` : '—',
                  sub: proteinGoal > 0
                    ? week7AvgProteinG >= proteinGoal
                      ? 'ถึงเป้า ✓'
                      : `ต่ำกว่าเป้า ${proteinGoal - week7AvgProteinG}g`
                    : '',
                  color: week7AvgProteinG > 0 && week7AvgProteinG < proteinGoal ? T.coral : T.text,
                },
                {
                  label: 'น้ำเฉลี่ย',
                  value: week7AvgWaterGlasses > 0 ? String(week7AvgWaterGlasses) : '—',
                  sub: 'แก้ว / วัน',
                  color: T.text,
                },
              ]}
            />
            <WeekBars days={week7Days} kcalGoal={kcalGoal} />
            <WeightTrend latestWeightKg={latestWeightKg} series={weightSeriesKg} />
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
              {weightKgInitial != null && targetWeightKg != null && latestWeightKg != null ? (
                <GoalProgress
                  label={`น้ำหนัก → ${targetWeightKg} kg`}
                  current={latestWeightKg}
                  start={weightKgInitial}
                  goal={targetWeightKg}
                  invert={targetWeightKg < weightKgInitial}
                />
              ) : (
                <div style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 13, color: T.textMute, marginBottom: 12 }}>
                  ยังไม่มีข้อมูลน้ำหนัก
                </div>
              )}
              {week7AvgProteinG > 0 && proteinGoal > 0 && (
                <GoalProgress
                  label={`โปรตีนเฉลี่ย 7 วัน → ${proteinGoal}g`}
                  current={week7AvgProteinG}
                  start={0}
                  goal={proteinGoal}
                  unit="g"
                  invert={false}
                />
              )}
            </div>
            <AIInsightCard
              items={insightsLoading ? [] : (insightsProp ?? [])}
              range="month"
              loading={insightsLoading}
            />
            <BigStatsGrid
              stats={[
                {
                  label: 'เล่นไปทั้งหมด',
                  value: String(month30WorkoutCount),
                  sub: 'จาก 30 วัน',
                  color: month30WorkoutCount > 0 ? T.lime : T.text,
                },
                {
                  label: 'น้ำหนักเปลี่ยน',
                  value: month30WeightDeltaKg != null ? `${month30WeightDeltaKg > 0 ? '↑' : '↓'}${Math.abs(month30WeightDeltaKg)}` : '—',
                  sub: 'kg ใน 30 วัน',
                  color: month30WeightDeltaKg != null && month30WeightDeltaKg < 0 ? T.lime : T.text,
                },
                {
                  label: 'Streak ยาวสุด',
                  value: String(streakLongest),
                  sub: 'วันต่อเนื่อง',
                  color: T.coral,
                },
                {
                  label: 'วันถึงเป้าแคล',
                  value: kcalGoal > 0 ? String(month30DaysHitKcal) : '—',
                  sub: kcalGoal > 0 ? `/ 30 วัน · ${Math.round((month30DaysHitKcal / 30) * 100)}%` : '',
                  color: T.text,
                },
              ]}
            />
            <MonthHeatmap days={month30ActivityDays} />
            {latestWeightKg != null && weightKgInitial != null && (
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
                  { label: 'เริ่มต้น', wt: weightKgInitial.toFixed(1), highlight: false },
                  { label: 'ตอนนี้', wt: latestWeightKg.toFixed(1), highlight: true },
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
                  </div>
                ))}
              </div>
            </div>
            )}
          </>
        )}

        <div style={{ height: 96 }} />
      </div>

      <BottomTabBar active={activeTab} onTab={onTab} />
    </div>
  );
}
