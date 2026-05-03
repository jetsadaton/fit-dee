'use client';

import { useState } from 'react';
import { BottomTabBar, RangeBadge, type TabId } from '@/components/coach/primitives';
import { T } from '@/lib/design/tokens';

export type ExerciseRow = {
  name: string;
  sets: number;
  reps: string;
  lastWeight: number;
  tip: string | null;
  formCues: string[];
};
export type DayPlan = { name: string; focus?: string; mins?: number; rest?: boolean; exercises?: ExerciseRow[] };
export type WeekPlan = Record<string, DayPlan>;

const DAY_KEYS = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'] as const;
const JS_DAY_TO_KEY: Record<number, string> = { 1: 'จ', 2: 'อ', 3: 'พ', 4: 'พฤ', 5: 'ศ', 6: 'ส', 0: 'อา' };
const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const DAY_LABEL: Record<string, string> = {
  จ: 'จันทร์',
  อ: 'อังคาร',
  พ: 'พุธ',
  พฤ: 'พฤหัส',
  ศ: 'ศุกร์',
  ส: 'เสาร์',
  อา: 'อาทิตย์',
};

function todayIctKey(): string {
  const d = new Date(Date.now() + 7 * 3600 * 1000);
  return JS_DAY_TO_KEY[d.getUTCDay()] ?? 'จ';
}

// INVARIANT: weekStartsOn must be a Monday (plan-generator guarantees this).
// If it's not, the date numbers fall out of alignment with DAY_KEYS (จ–อา).
function getWeekDates(weekStartsOn?: string): number[] {
  if (weekStartsOn) {
    const [y, m, d] = weekStartsOn.split('-').map(Number);
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(Date.UTC(y!, m! - 1, d! + i));
      return date.getUTCDate();
    });
  }
  // Fallback: compute current week (Mon–Sun, ICT)
  const nowIct = new Date(Date.now() + 7 * 3600 * 1000);
  const jsDay = nowIct.getUTCDay();
  const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay;
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(nowIct);
    d.setUTCDate(nowIct.getUTCDate() + mondayOffset + i);
    return d.getUTCDate();
  });
}

function formatWeekRange(weekStartsOn?: string): string {
  if (!weekStartsOn) return 'แผนสัปดาห์นี้';
  const [y, m, d] = weekStartsOn.split('-').map(Number);
  const start = new Date(Date.UTC(y!, m! - 1, d!));
  const end = new Date(Date.UTC(y!, m! - 1, d! + 6));
  return `${start.getUTCDate()} ${THAI_MONTHS[start.getUTCMonth()]} – ${end.getUTCDate()} ${THAI_MONTHS[end.getUTCMonth()]}`;
}

function checkIsCurrentWeek(weekStartsOn?: string): boolean {
  if (!weekStartsOn) return true;
  const nowIct = new Date(Date.now() + 7 * 3600 * 1000);
  const jsDay = nowIct.getUTCDay();
  const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay;
  const thisMonday = new Date(nowIct);
  thisMonday.setUTCDate(nowIct.getUTCDate() + mondayOffset);
  return weekStartsOn === thisMonday.toISOString().slice(0, 10);
}

type LogEntry = { done: boolean; weight: number; sets: { w: number; r: string }[] };

export function PlanScreen({
  onTab,
  activeTab = 'plan' as TabId,
  onStartWorkout,
  onAskAI,
  initialPlan,
  weekStartsOn,
}: {
  onTab?: (t: TabId) => void;
  activeTab?: TabId;
  onStartWorkout?: () => void;
  onAskAI?: () => void;
  initialPlan?: WeekPlan;
  weekStartsOn?: string;
}) {
  const isCurWeek = checkIsCurrentWeek(weekStartsOn);
  const todayKey = isCurWeek ? todayIctKey() : 'จ';
  const weekDates = getWeekDates(weekStartsOn);
  const weekRange = formatWeekRange(weekStartsOn);

  const [selected, setSelected] = useState<string>(todayKey);
  const [exDetail, setExDetail] = useState<{ day: string; idx: number } | null>(null);
  const [logs, setLogs] = useState<Record<string, LogEntry>>({});

  // No plan → empty state
  if (!initialPlan) {
    return (
      <div style={{ width: '100%', height: '100dvh', display: 'flex', flexDirection: 'column', background: T.bg }}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 32px',
            gap: 16,
            paddingBottom: 'calc(76px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <div style={{ fontSize: 56 }}>🏋️</div>
          <h2
            style={{
              fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
              fontWeight: 900,
              fontSize: 22,
              color: T.text,
              margin: 0,
              textAlign: 'center',
            }}
          >
            ยังไม่มีแผนออกกำลังกาย
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
              color: T.textDim,
              fontSize: 14,
              margin: 0,
              textAlign: 'center',
              lineHeight: 1.6,
            }}
          >
            บอกโค้ชดีว่าเป้าหมายของคุณคืออะไร แล้วโค้ชจะสร้างแผนให้ฟรี
          </p>
          <button
            type="button"
            onClick={onAskAI}
            style={{
              marginTop: 8,
              padding: '14px 28px',
              borderRadius: 14,
              background: T.coral,
              border: 'none',
              color: '#0E0F12',
              fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
              fontWeight: 800,
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            บอกโค้ชดีให้สร้างแผน
          </button>
        </div>
        <BottomTabBar active={activeTab} onTab={onTab} />
      </div>
    );
  }

  const cur = initialPlan[selected] ?? { name: 'วันพัก', rest: true };

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
      {/* Header */}
      <div
        style={{
          padding: '12px 18px 14px',
          borderBottom: `1px solid ${T.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
              fontSize: 11,
              fontWeight: 700,
              color: T.textDim,
              letterSpacing: 0.6,
              textTransform: 'uppercase',
            }}
          >
            {isCurWeek ? 'แผนสัปดาห์นี้' : 'แผนสัปดาห์ที่แล้ว'}
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
              fontWeight: 900,
              fontSize: 22,
              color: T.text,
              margin: '2px 0 0',
            }}
          >
            {weekRange}
          </h1>
        </div>
        <button
          type="button"
          onClick={onAskAI}
          style={{
            padding: '8px 12px',
            borderRadius: 999,
            background: T.coralBg,
            border: `1px solid ${T.coral}66`,
            color: T.coral,
            fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
            fontWeight: 800,
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            cursor: 'pointer',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2 L13.5 8 L20 9.5 L13.5 11 L12 17 L10.5 11 L4 9.5 L10.5 8 Z" />
          </svg>
          ปรับแผน
        </button>
      </div>

      {/* Day tabs */}
      <div
        style={{
          padding: '14px 12px',
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 5,
          flexShrink: 0,
        }}
      >
        {DAY_KEYS.map((d, idx) => {
          const p = initialPlan[d] ?? { name: 'วันพัก', rest: true };
          const isToday = isCurWeek && d === todayKey;
          const isSel = d === selected;
          return (
            <button
              type="button"
              key={d}
              onClick={() => setSelected(d)}
              style={{
                padding: '10px 4px',
                borderRadius: 14,
                background: isSel ? T.coral : isToday ? T.coralBg : T.bg3,
                border: `1px solid ${isSel ? T.coral : isToday ? T.coral + '66' : T.border}`,
                color: isSel ? '#0E0F12' : T.text,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: 0.4,
                  textTransform: 'uppercase',
                  opacity: 0.75,
                }}
              >
                {d}
              </span>
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: 18, fontWeight: 900 }}>
                {weekDates[idx]}
              </span>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: p.rest ? (isSel ? '#0E0F12' : T.textMute) : isSel ? '#0E0F12' : T.lime,
                  opacity: p.rest ? 0.5 : 1,
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 16px calc(76px + env(safe-area-inset-bottom, 0px))' }}>
        {cur.rest ? (
          <div
            style={{
              background: T.bg3,
              border: `1px dashed ${T.borderHi}`,
              borderRadius: 20,
              padding: 32,
              textAlign: 'center',
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 48 }}>☕</div>
            <h2
              style={{
                fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
                fontWeight: 900,
                color: T.text,
                fontSize: 22,
                margin: '12px 0 4px',
              }}
            >
              วันพัก
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
                color: T.textDim,
                fontSize: 13,
                margin: 0,
              }}
            >
              กล้ามโตตอนพัก ไม่ใช่ตอนเล่น 💪
            </p>
          </div>
        ) : (
          <div
            style={{
              background: 'linear-gradient(160deg, #2A1810 0%, #1C1F26 100%)',
              border: `1px solid ${T.border}`,
              borderRadius: 20,
              padding: 18,
              marginBottom: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: 1.4,
                    textTransform: 'uppercase',
                    color: T.coral,
                  }}
                >
                  {isCurWeek && selected === todayKey ? 'วันนี้' : DAY_LABEL[selected]}
                </div>
                <h2
                  style={{
                    fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
                    fontWeight: 900,
                    color: T.text,
                    fontSize: 26,
                    margin: '4px 0 4px',
                  }}
                >
                  {cur.name}
                </h2>
                <div
                  style={{
                    fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
                    fontSize: 12,
                    color: T.textDim,
                    fontWeight: 600,
                  }}
                >
                  {cur.focus}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <RangeBadge low={(cur.mins ?? 45) - 5} high={(cur.mins ?? 45) + 5} unit="นาที" />
                <span
                  style={{
                    fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
                    fontSize: 10,
                    fontWeight: 700,
                    color: T.textMute,
                  }}
                >
                  {cur.exercises?.length ?? 0} ท่า
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onStartWorkout}
              style={{
                width: '100%',
                height: 52,
                borderRadius: 14,
                background: T.coral,
                border: 'none',
                color: '#0E0F12',
                fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
                fontWeight: 800,
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <span>เริ่มเลย</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
        )}

        {!cur.rest && cur.exercises && (
          <>
            <div
              style={{
                fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                color: T.textDim,
                padding: '8px 4px',
              }}
            >
              ท่าออกกำลัง
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {cur.exercises.map((ex, i) => {
                const log = logs[`${selected}-${i}`];
                const done = !!log?.done;
                return (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setExDetail({ day: selected, idx: i })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      textAlign: 'left',
                      padding: '10px 12px',
                      background: done ? T.limeBg : T.bg3,
                      borderRadius: 14,
                      border: `1px solid ${done ? T.lime + '55' : T.border}`,
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: done ? T.lime : T.bg4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--font-inter)',
                        fontWeight: 800,
                        color: done ? '#0E0F12' : T.textDim,
                        fontSize: 13,
                        flexShrink: 0,
                      }}
                    >
                      {done ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
                          fontWeight: 700,
                          color: T.text,
                          fontSize: 14,
                          textDecoration: done ? 'line-through' : 'none',
                          textDecorationColor: T.textMute,
                          opacity: done ? 0.7 : 1,
                        }}
                      >
                        {ex.name}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
                          color: T.textDim,
                          fontSize: 11,
                          marginTop: 1,
                        }}
                      >
                        {ex.sets} × {ex.reps} reps
                        {log?.weight ? <span style={{ color: T.lime, fontWeight: 700 }}> · {log.weight} kg</span> : null}
                        {!log && ex.lastWeight > 0 && (
                          <span style={{ color: T.textMute }}> · ครั้งก่อน {ex.lastWeight} kg</span>
                        )}
                      </div>
                    </div>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={T.textMute}
                      strokeWidth="2.5"
                      style={{ flexShrink: 0 }}
                    >
                      <path d="M9 5l7 7-7 7" strokeLinecap="round" />
                    </svg>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={onAskAI}
              style={{
                width: '100%',
                padding: '14px',
                background: T.bg3,
                border: `1px dashed ${T.borderHi}`,
                borderRadius: 14,
                color: T.text,
                fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v8M8 12h8" strokeLinecap="round" />
              </svg>
              บอกโค้ชดีให้ปรับแผน
            </button>
          </>
        )}
        <div style={{ height: 96 }} />
      </div>

      <BottomTabBar active={activeTab} onTab={onTab} />

      {exDetail && (
        <ExerciseDetailSheet
          exercise={initialPlan[exDetail.day]!.exercises![exDetail.idx]!}
          existingLog={logs[`${exDetail.day}-${exDetail.idx}`]}
          onClose={() => setExDetail(null)}
          onSave={(data) => {
            setLogs((L) => ({ ...L, [`${exDetail.day}-${exDetail.idx}`]: data }));
            setExDetail(null);
          }}
          onUnmark={() => {
            setLogs((L) => {
              const next = { ...L };
              delete next[`${exDetail.day}-${exDetail.idx}`];
              return next;
            });
            setExDetail(null);
          }}
        />
      )}
    </div>
  );
}

function ExerciseDetailSheet({
  exercise,
  existingLog,
  onClose,
  onSave,
  onUnmark,
}: {
  exercise: ExerciseRow;
  existingLog?: LogEntry;
  onClose: () => void;
  onSave: (data: LogEntry) => void;
  onUnmark: () => void;
}) {
  const [tab, setTab] = useState<'demo' | 'log'>('demo');
  const [weight, setWeight] = useState(existingLog?.weight ?? exercise.lastWeight ?? 0);
  const setsCount = exercise.sets;
  const [sets, setSets] = useState<{ w: number; r: string }[]>(
    existingLog?.sets ?? Array.from({ length: setsCount }, () => ({ w: exercise.lastWeight ?? 0, r: '' })),
  );

  const adjustWeight = (delta: number) => setWeight((w) => Math.max(0, Math.round((w + delta) * 10) / 10));
  const updateSet = (i: number, field: 'w' | 'r', val: string | number) => {
    setSets((S) => S.map((s, j) => (j === i ? { ...s, [field]: val } : s)));
  };
  const allFilled = sets.every((s) => s.r !== '' && s.r !== null);

  const weightBtn = {
    width: 50,
    height: 42,
    borderRadius: 10,
    background: T.bg4,
    border: `1px solid ${T.border}`,
    color: T.text,
    fontFamily: 'var(--font-inter)',
    fontWeight: 700,
    fontSize: 12,
    cursor: 'pointer',
    flexShrink: 0,
  } as const;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 20,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        animation: 'cdFadeIn 0.2s ease',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: T.bg,
          borderRadius: '20px 20px 0 0',
          border: `1px solid ${T.border}`,
          borderBottom: 'none',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90%',
        }}
      >
        <div style={{ padding: '10px 0 4px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: T.borderHi }} />
        </div>
        <div style={{ padding: '4px 16px 12px', flexShrink: 0, borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2
                style={{
                  fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
                  fontWeight: 900,
                  fontSize: 22,
                  color: T.text,
                  margin: 0,
                }}
              >
                {exercise.name}
              </h2>
              <div
                style={{
                  fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
                  fontSize: 12,
                  color: T.textDim,
                  fontWeight: 600,
                  marginTop: 4,
                }}
              >
                {exercise.sets} เซ็ต × {exercise.reps} reps
                {exercise.lastWeight > 0 && (
                  <span style={{ color: T.textMute }}> · ครั้งก่อน {exercise.lastWeight} kg</span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: T.textDim,
                cursor: 'pointer',
                padding: 4,
                flexShrink: 0,
              }}
              aria-label="ปิด"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 4,
              marginTop: 12,
              padding: 4,
              background: T.bg3,
              borderRadius: 10,
            }}
          >
            {(
              [
                { id: 'demo' as const, l: 'วิธีเล่น' },
                { id: 'log' as const, l: 'บันทึกเซ็ต' },
              ]
            ).map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: '8px 0',
                  borderRadius: 7,
                  background: tab === t.id ? T.coral : 'transparent',
                  border: 'none',
                  color: tab === t.id ? '#0E0F12' : T.textDim,
                  fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {t.l}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px 8px' }}>
          {tab === 'demo' && (
            <>
              <div
                style={{
                  aspectRatio: '16/10',
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, #2A1810 0%, #1C1F26 100%)',
                  border: `1px solid ${T.border}`,
                  position: 'relative',
                  overflow: 'hidden',
                  marginBottom: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `radial-gradient(${T.borderHi} 1px, transparent 1px)`,
                    backgroundSize: '14px 14px',
                    opacity: 0.4,
                  }}
                />
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 999,
                    background: T.coral,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 8px 24px ${T.coral}55`,
                    position: 'relative',
                    cursor: 'pointer',
                  }}
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="#0E0F12">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <div
                  style={{
                    position: 'absolute',
                    bottom: 10,
                    left: 12,
                    fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
                    fontSize: 10,
                    fontWeight: 700,
                    color: T.text,
                    padding: '4px 8px',
                    borderRadius: 6,
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  วิดีโอสาธิต · 0:45
                </div>
              </div>

              {exercise.tip && (
                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    padding: 12,
                    marginBottom: 14,
                    background: T.coralBg,
                    border: `1px solid ${T.coral}55`,
                    borderRadius: 12,
                  }}
                >
                  <span style={{ fontSize: 18 }}>💡</span>
                  <div
                    style={{
                      fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
                      fontSize: 13,
                      color: T.text,
                      lineHeight: 1.5,
                    }}
                  >
                    {exercise.tip}
                  </div>
                </div>
              )}

              <div
                style={{
                  fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 0.8,
                  textTransform: 'uppercase',
                  color: T.textDim,
                  marginBottom: 8,
                }}
              >
                วิธีเล่นที่ถูกต้อง
              </div>
              <ul
                style={{
                  margin: 0,
                  padding: 0,
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                {exercise.formCues.map((cue, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div
                      style={{
                        flexShrink: 0,
                        width: 22,
                        height: 22,
                        borderRadius: 7,
                        background: T.bg4,
                        border: `1px solid ${T.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--font-inter)',
                        fontSize: 11,
                        fontWeight: 800,
                        color: T.lime,
                      }}
                    >
                      {i + 1}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
                        fontSize: 13,
                        color: T.text,
                        lineHeight: 1.5,
                        paddingTop: 1,
                      }}
                    >
                      {cue}
                    </div>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => setTab('log')}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: T.bg3,
                  border: `1px dashed ${T.borderHi}`,
                  borderRadius: 14,
                  color: T.text,
                  fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M9 11l3 3 8-8M3 12l3 3 8-8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                ไปบันทึกเซ็ต
              </button>
            </>
          )}

          {tab === 'log' && (
            <>
              <div
                style={{
                  background: T.bg3,
                  border: `1px solid ${T.border}`,
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 0.6,
                    textTransform: 'uppercase',
                    color: T.textDim,
                    marginBottom: 10,
                  }}
                >
                  น้ำหนักเริ่มต้น
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button type="button" onClick={() => adjustWeight(-2.5)} style={weightBtn}>
                    -2.5
                  </button>
                  <button type="button" onClick={() => adjustWeight(-1.25)} style={weightBtn}>
                    -1.25
                  </button>
                  <div
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: '10px 0',
                      background: T.bg4,
                      borderRadius: 10,
                      border: `1px solid ${T.border}`,
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-inter)', fontSize: 24, fontWeight: 900, color: T.text }}>
                      {weight}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
                        fontSize: 12,
                        color: T.textMute,
                        marginLeft: 4,
                        fontWeight: 700,
                      }}
                    >
                      kg
                    </span>
                  </div>
                  <button type="button" onClick={() => adjustWeight(1.25)} style={weightBtn}>
                    +1.25
                  </button>
                  <button type="button" onClick={() => adjustWeight(2.5)} style={weightBtn}>
                    +2.5
                  </button>
                </div>
              </div>

              <div
                style={{
                  fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 0.8,
                  textTransform: 'uppercase',
                  color: T.textDim,
                  marginBottom: 8,
                }}
              >
                เซ็ตที่ทำ ({exercise.sets} เซ็ต)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                {sets.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: 10,
                      background: T.bg3,
                      borderRadius: 12,
                      border: `1px solid ${s.r !== '' ? T.lime + '55' : T.border}`,
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        flexShrink: 0,
                        background: s.r !== '' ? T.lime : T.bg4,
                        color: s.r !== '' ? '#0E0F12' : T.textDim,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--font-inter)',
                        fontWeight: 800,
                        fontSize: 12,
                      }}
                    >
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, display: 'flex', gap: 6, minWidth: 0 }}>
                      <NumInput label="kg" value={s.w} onChange={(v) => updateSet(i, 'w', Number(v))} />
                      <NumInput label="reps" value={s.r} onChange={(v) => updateSet(i, 'r', v)} placeholder={exercise.reps} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                {existingLog && (
                  <button
                    type="button"
                    onClick={onUnmark}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 14,
                      background: T.bg4,
                      border: `1px solid ${T.border}`,
                      color: T.textDim,
                      fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    ลบบันทึก
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onSave({ done: true, weight, sets })}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: 14,
                    background: allFilled ? T.coral : T.coral + '88',
                    border: 'none',
                    color: '#0E0F12',
                    fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {existingLog ? 'อัปเดตบันทึก' : 'ติ๊กว่าเล่นแล้ว'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function NumInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        background: T.bg4,
        borderRadius: 8,
        border: `1px solid ${T.border}`,
        padding: '0 10px',
        height: 38,
      }}
    >
      <input
        type="number"
        value={value as number | string}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          minWidth: 0,
          width: '100%',
          background: 'transparent',
          border: 'none',
          color: T.text,
          fontFamily: 'var(--font-inter)',
          fontSize: 15,
          fontWeight: 700,
          outline: 'none',
          textAlign: 'right',
          padding: 0,
        }}
      />
      <span
        style={{
          fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
          fontSize: 11,
          color: T.textMute,
          marginLeft: 4,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
    </div>
  );
}
