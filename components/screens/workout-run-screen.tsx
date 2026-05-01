'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { T } from '@/lib/design/tokens';

type Ex = {
  name: string;
  sets: number;
  reps: string;
  weight: number;
  rest: number;
  formCues: string[];
};

const RUN_PLAN: Ex[] = [
  {
    name: 'Bench Press',
    sets: 3,
    reps: '8-10',
    weight: 60,
    rest: 90,
    formCues: ['หลังแนบเบาะ ขาแน่นพื้น', 'ลดบาร์ลงช้า ~3 วิ', 'ดันขึ้นเร็ว หายใจออก'],
  },
  {
    name: 'Shoulder Press',
    sets: 3,
    reps: '10-12',
    weight: 22.5,
    rest: 75,
    formCues: ['นั่งหลังตรง', 'ดันจนข้อศอกเกือบเหยียดสุด', 'อย่าโค้งหลัง'],
  },
  {
    name: 'Incline DB Press',
    sets: 3,
    reps: '10-12',
    weight: 20,
    rest: 75,
    formCues: ['เบาะเอียง 30-45°', 'ลดถึงระดับอก', 'บีบอกตอนดัน'],
  },
  {
    name: 'Lateral Raise',
    sets: 3,
    reps: '12-15',
    weight: 8,
    rest: 60,
    formCues: ['ยืนตรง เกร็งแกน', 'ยกถึงระดับไหล่', 'ลงช้า 2 วิ'],
  },
  {
    name: 'Tricep Pushdown',
    sets: 3,
    reps: '12-15',
    weight: 25,
    rest: 60,
    formCues: ['ข้อศอกชิดข้างลำตัว', 'เหยียดสุด บีบไตรเซป', 'กลับเข้าช้า'],
  },
];

type Phase = 'working' | 'resting' | 'done';

const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

const iconBtnStyle: CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 999,
  background: T.bg3,
  border: `1px solid ${T.border}`,
  color: T.text,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flexShrink: 0,
};

const bigStepBtn: CSSProperties = {
  width: 52,
  height: 52,
  borderRadius: 999,
  background: T.bg4,
  border: `1px solid ${T.borderHi}`,
  color: T.text,
  fontFamily: 'Inter',
  fontWeight: 800,
  fontSize: 24,
  cursor: 'pointer',
  flexShrink: 0,
};

export function WorkoutRun({ onExit }: { onExit?: () => void }) {
  const [exIdx, setExIdx] = useState(0);
  const [setIdx, setSetIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('working');
  const [restLeft, setRestLeft] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [logs, setLogs] = useState<Record<string, { w: number; r: string }>>({});
  const [confirm, setConfirm] = useState<'exit' | null>(null);
  const prevPhase = useRef<Phase>(phase);

  useEffect(() => {
    if (phase === 'done') return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'resting') return;
    const id = setInterval(() => {
      setRestLeft((r) => {
        if (r <= 1) {
          clearInterval(id);
          setPhase('working');
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  const ex = RUN_PLAN[exIdx]!;
  const totalSets = RUN_PLAN.reduce((s, e) => s + e.sets, 0);
  const doneSets = RUN_PLAN.slice(0, exIdx).reduce((s, e) => s + e.sets, 0) + setIdx;
  const progressPct = (doneSets / totalSets) * 100;

  const advanceAfterRest = () => {
    if (setIdx + 1 < ex.sets) {
      setSetIdx((s) => s + 1);
    } else {
      setExIdx((i) => i + 1);
      setSetIdx(0);
    }
    setPhase('working');
  };

  useEffect(() => {
    if (prevPhase.current === 'resting' && phase === 'working') {
      advanceAfterRest();
    }
    prevPhase.current = phase;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const completeSet = (reps: string, weight: number) => {
    setLogs((L) => ({ ...L, [`${exIdx}-${setIdx}`]: { w: weight, r: reps } }));
    if (setIdx + 1 >= ex.sets && exIdx + 1 >= RUN_PLAN.length) {
      setPhase('done');
      return;
    }
    setRestLeft(ex.rest);
    setPhase('resting');
  };

  const skipRest = () => {
    setRestLeft(0);
    advanceAfterRest();
  };
  const addRest = (s: number) => setRestLeft((r) => r + s);

  if (phase === 'done') return <WorkoutDone elapsed={elapsed} logs={logs} onExit={onExit} />;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: phase === 'resting' ? '#0A1614' : T.bg,
        position: 'relative',
        transition: 'background 0.3s',
      }}
    >
      <div style={{ padding: '14px 16px 8px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => setConfirm('exit')}
          style={iconBtnStyle}
          aria-label="ออก"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div
            style={{
              fontFamily: 'Inter,"Noto Sans Thai"',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              color: T.textDim,
            }}
          >
            Push Day · {fmt(elapsed)}
          </div>
          <div style={{ fontFamily: 'Inter', fontSize: 13, fontWeight: 800, color: T.text, marginTop: 2 }}>
            ท่า {exIdx + 1}/{RUN_PLAN.length} · เซ็ต {setIdx + 1}/{ex.sets}
          </div>
        </div>
        <button type="button" style={iconBtnStyle} aria-label="เพิ่มเติม">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="19" cy="12" r="2" />
          </svg>
        </button>
      </div>
      <div style={{ padding: '0 16px 14px', flexShrink: 0 }}>
        <div style={{ height: 6, borderRadius: 999, background: T.bg4, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${progressPct}%`,
              background: `linear-gradient(90deg, ${T.coral}, ${T.lime})`,
              borderRadius: 999,
              transition: 'width 0.4s',
            }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px' }}>
        {phase === 'working' && <WorkingPhase ex={ex} setIdx={setIdx} onComplete={completeSet} />}
        {phase === 'resting' && (
          <RestingPhase
            seconds={restLeft}
            total={ex.rest}
            nextEx={setIdx + 1 < ex.sets ? ex : RUN_PLAN[exIdx + 1]}
            nextSetLabel={
              setIdx + 1 < ex.sets ? `เซ็ต ${setIdx + 2}/${ex.sets}` : `ท่าใหม่ · ${RUN_PLAN[exIdx + 1]?.name ?? ''}`
            }
            onSkip={skipRest}
            onAdd={() => addRest(15)}
          />
        )}
      </div>

      {confirm === 'exit' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 30,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            style={{
              background: T.bg2,
              border: `1px solid ${T.border}`,
              borderRadius: 18,
              padding: 20,
              maxWidth: 320,
              width: '100%',
            }}
          >
            <h3
              style={{
                fontFamily: 'Inter,"Noto Sans Thai"',
                fontWeight: 900,
                color: T.text,
                fontSize: 18,
                margin: '0 0 6px',
              }}
            >
              หยุดเล่นกลางทาง?
            </h3>
            <p
              style={{
                fontFamily: 'Inter,"Noto Sans Thai"',
                color: T.textDim,
                fontSize: 13,
                margin: '0 0 16px',
                lineHeight: 1.5,
              }}
            >
              เก็บข้อมูลที่บันทึกไว้แล้ว ({Object.keys(logs).length} เซ็ต) แต่ workout จะไม่ครบ
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setConfirm(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 12,
                  background: T.bg4,
                  border: `1px solid ${T.border}`,
                  color: T.text,
                  fontFamily: 'Inter,"Noto Sans Thai"',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                ทำต่อ
              </button>
              <button
                type="button"
                onClick={onExit}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 12,
                  background: T.danger,
                  border: 'none',
                  color: '#fff',
                  fontFamily: 'Inter,"Noto Sans Thai"',
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                หยุดเลย
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WorkingPhase({ ex, setIdx, onComplete }: { ex: Ex; setIdx: number; onComplete: (reps: string, weight: number) => void }) {
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState(ex.weight);

  useEffect(() => {
    setReps('');
    setWeight(ex.weight);
  }, [ex.name, setIdx, ex.weight]);

  const adjustWeight = (d: number) => setWeight((w) => Math.max(0, Math.round((w + d) * 10) / 10));
  const adjustReps = (d: number) => setReps((r) => Math.max(0, (parseInt(r) || 0) + d).toString());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '8px 0' }}>
      <div
        style={{
          background: 'linear-gradient(155deg, #2A1810 0%, #1C1F26 100%)',
          border: `1px solid ${T.border}`,
          borderRadius: 22,
          padding: '22px 18px',
        }}
      >
        <div
          style={{
            fontFamily: 'Inter,"Noto Sans Thai"',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            color: T.coral,
          }}
        >
          เซ็ต {setIdx + 1} / {ex.sets}
        </div>
        <h1
          style={{
            fontFamily: 'Inter,"Noto Sans Thai"',
            fontWeight: 900,
            fontSize: 30,
            color: T.text,
            margin: '4px 0 6px',
            lineHeight: 1.1,
          }}
        >
          {ex.name}
        </h1>
        <div style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 14, color: T.textDim, fontWeight: 600 }}>
          เป้า {ex.reps} reps · {ex.weight} kg
        </div>
      </div>

      <div style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 18, padding: '18px 16px' }}>
        <div
          style={{
            fontFamily: 'Inter,"Noto Sans Thai"',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 0.8,
            textTransform: 'uppercase',
            color: T.textDim,
            textAlign: 'center',
            marginBottom: 14,
          }}
        >
          จำนวน reps ที่ทำได้
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <button type="button" onClick={() => adjustReps(-1)} style={bigStepBtn}>
            −
          </button>
          <div
            style={{
              minWidth: 110,
              textAlign: 'center',
              fontFamily: 'Inter',
              fontSize: 64,
              fontWeight: 900,
              color: reps === '' ? T.textMute : T.lime,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {reps === '' ? '—' : reps}
          </div>
          <button type="button" onClick={() => adjustReps(1)} style={bigStepBtn}>
            +
          </button>
        </div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 12 }}>
          {[8, 10, 12].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => setReps(n.toString())}
              style={{
                padding: '7px 14px',
                borderRadius: 999,
                background: T.bg4,
                border: `1px solid ${T.border}`,
                color: T.text,
                fontFamily: 'Inter',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 18, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span
            style={{
              fontFamily: 'Inter,"Noto Sans Thai"',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 0.8,
              textTransform: 'uppercase',
              color: T.textDim,
            }}
          >
            น้ำหนัก
          </span>
          <span style={{ fontFamily: 'Inter', fontSize: 22, fontWeight: 900, color: T.text }}>
            {weight}
            <span style={{ fontSize: 11, color: T.textMute, fontWeight: 700, marginLeft: 4 }}>kg</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[-5, -2.5, -1.25, 1.25, 2.5, 5].map((d) => (
            <button
              type="button"
              key={d}
              onClick={() => adjustWeight(d)}
              style={{
                flex: 1,
                height: 36,
                borderRadius: 10,
                background: T.bg4,
                border: `1px solid ${T.border}`,
                color: T.text,
                fontFamily: 'Inter',
                fontWeight: 700,
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              {d > 0 ? `+${d}` : d}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: T.coralBg, border: `1px solid ${T.coral}33`, borderRadius: 14, padding: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <span style={{ fontSize: 14 }}>💡</span>
          <span
            style={{
              fontFamily: 'Inter,"Noto Sans Thai"',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 0.8,
              textTransform: 'uppercase',
              color: T.coral,
            }}
          >
            เตือนฟอร์ม
          </span>
        </div>
        <ul style={{ margin: 0, padding: '0 0 0 4px', listStyle: 'none' }}>
          {ex.formCues.map((c, i) => (
            <li
              key={i}
              style={{
                fontFamily: 'Inter,"Noto Sans Thai"',
                fontSize: 13,
                color: T.text,
                lineHeight: 1.6,
                display: 'flex',
                gap: 6,
              }}
            >
              <span style={{ color: T.coral, fontWeight: 800 }}>·</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        disabled={reps === ''}
        onClick={() => onComplete(reps, weight)}
        style={{
          height: 64,
          borderRadius: 18,
          background: reps !== '' ? T.coral : T.coral + '55',
          border: 'none',
          color: '#0E0F12',
          fontFamily: 'Inter,"Noto Sans Thai"',
          fontWeight: 900,
          fontSize: 17,
          cursor: reps !== '' ? 'pointer' : 'not-allowed',
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          boxShadow: reps !== '' ? `0 10px 28px ${T.coral}55` : 'none',
          marginBottom: 14,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        จบเซ็ต · เริ่มพัก
      </button>
    </div>
  );
}

function RestingPhase({
  seconds,
  total,
  nextEx,
  nextSetLabel,
  onSkip,
  onAdd,
}: {
  seconds: number;
  total: number;
  nextEx?: Ex;
  nextSetLabel: string;
  onSkip: () => void;
  onAdd: () => void;
}) {
  const pct = total > 0 ? (seconds / total) * 100 : 0;
  const r = 110;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0' }}>
      <div
        style={{
          fontFamily: 'Inter,"Noto Sans Thai"',
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 1.6,
          textTransform: 'uppercase',
          color: T.lime,
          marginBottom: 6,
          animation: 'cdPulse 2s infinite',
        }}
      >
        กำลังพัก
      </div>
      <h2
        style={{
          fontFamily: 'Inter,"Noto Sans Thai"',
          fontWeight: 700,
          fontSize: 14,
          color: T.textDim,
          margin: '0 0 22px',
        }}
      >
        {nextSetLabel}
      </h2>
      <div style={{ position: 'relative', width: 240, height: 240, marginBottom: 18 }}>
        <svg width="240" height="240">
          <circle cx="120" cy="120" r={r} fill="none" stroke={T.bg4} strokeWidth="14" />
          <circle
            cx="120"
            cy="120"
            r={r}
            fill="none"
            stroke={T.lime}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${c * (pct / 100)} ${c}`}
            transform="rotate(-90 120 120)"
            style={{ transition: 'stroke-dasharray 1s linear', filter: `drop-shadow(0 0 8px ${T.lime}80)` }}
          />
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
          <div
            style={{
              fontFamily: 'Inter',
              fontSize: 70,
              fontWeight: 900,
              color: T.text,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}
          </div>
          <div
            style={{
              fontFamily: 'Inter,"Noto Sans Thai"',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1,
              color: T.textDim,
              marginTop: 4,
            }}
          >
            เหลืออีก
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, width: '100%', maxWidth: 320 }}>
        <button
          type="button"
          onClick={onAdd}
          style={{
            flex: 1,
            height: 50,
            borderRadius: 14,
            background: T.bg3,
            border: `1px solid ${T.border}`,
            color: T.text,
            fontFamily: 'Inter,"Noto Sans Thai"',
            fontWeight: 800,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            whiteSpace: 'nowrap',
          }}
        >
          +15 วิ
        </button>
        <button
          type="button"
          onClick={onSkip}
          style={{
            flex: 1.4,
            height: 50,
            borderRadius: 14,
            background: T.coral,
            border: 'none',
            color: '#0E0F12',
            fontFamily: 'Inter,"Noto Sans Thai"',
            fontWeight: 900,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            whiteSpace: 'nowrap',
          }}
        >
          ข้าม
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 4l10 8-10 8zM18 4h2v16h-2z" />
          </svg>
        </button>
      </div>

      {nextEx && (
        <div
          style={{
            width: '100%',
            padding: 14,
            borderRadius: 14,
            background: T.bg3,
            border: `1px solid ${T.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: T.coralBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.coral} strokeWidth="2.4">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" />
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
                color: T.textDim,
              }}
            >
              ต่อไป
            </div>
            <div style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontWeight: 800, color: T.text, fontSize: 15, marginTop: 2 }}>
              {nextEx.name}
            </div>
            <div style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 11, color: T.textDim, marginTop: 1 }}>
              {nextEx.reps} reps · {nextEx.weight} kg
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WorkoutDone({
  elapsed,
  logs,
  onExit,
}: {
  elapsed: number;
  logs: Record<string, { w: number; r: string }>;
  onExit?: () => void;
}) {
  const totalReps = Object.values(logs).reduce((s, l) => s + parseInt(l.r || '0'), 0);
  const totalVolume = Object.values(logs).reduce((s, l) => s + parseInt(l.r || '0') * (l.w || 0), 0);
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: T.bg,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
      }}
    >
      <div style={{ flex: 1, padding: '40px 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 999,
            background: `linear-gradient(135deg, ${T.lime}, ${T.limeHi})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 12px 36px ${T.lime}55`,
            marginBottom: 18,
          }}
        >
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#0E0F12" strokeWidth="3.5">
            <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1
          style={{
            fontFamily: 'Inter,"Noto Sans Thai"',
            fontWeight: 900,
            fontSize: 28,
            color: T.text,
            margin: '0 0 4px',
            textAlign: 'center',
          }}
        >
          เสร็จแล้ว!
        </h1>
        <p
          style={{
            fontFamily: 'Inter,"Noto Sans Thai"',
            fontSize: 14,
            color: T.textDim,
            margin: '0 0 24px',
            textAlign: 'center',
          }}
        >
          เก่งมาก เก็บ Push Day ครบ 💪
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, width: '100%', marginBottom: 14 }}>
          {[
            { l: 'เวลา', v: fmt(elapsed), c: T.coral },
            { l: 'Reps รวม', v: String(totalReps), c: T.lime },
            { l: 'Volume', v: `${(totalVolume / 1000).toFixed(1)}k`, c: T.ringBurn },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                background: T.bg3,
                border: `1px solid ${T.border}`,
                borderRadius: 14,
                padding: 14,
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
                  color: T.textDim,
                  marginBottom: 4,
                }}
              >
                {s.l}
              </div>
              <div style={{ fontFamily: 'Inter', fontSize: 22, fontWeight: 900, color: s.c, lineHeight: 1 }}>{s.v}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            width: '100%',
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
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 0.8,
              textTransform: 'uppercase',
              color: T.textDim,
              marginBottom: 10,
            }}
          >
            สรุปเซ็ต
          </div>
          {RUN_PLAN.map((ex, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 0',
                borderBottom: i < RUN_PLAN.length - 1 ? `1px solid ${T.border}` : 'none',
              }}
            >
              <div style={{ flex: 1, fontFamily: 'Inter,"Noto Sans Thai"', fontWeight: 700, color: T.text, fontSize: 13 }}>
                {ex.name}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {Array.from({ length: ex.sets }).map((_, s) => {
                  const log = logs[`${i}-${s}`];
                  return (
                    <span
                      key={s}
                      style={{
                        padding: '3px 7px',
                        borderRadius: 6,
                        background: log ? T.limeBg : T.bg4,
                        border: `1px solid ${log ? T.lime + '55' : T.border}`,
                        color: log ? T.lime : T.textMute,
                        fontFamily: 'Inter',
                        fontSize: 10,
                        fontWeight: 800,
                      }}
                    >
                      {log ? `${log.r}×${log.w}` : '—'}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onExit}
          style={{
            width: '100%',
            height: 56,
            borderRadius: 14,
            background: T.coral,
            border: 'none',
            color: '#0E0F12',
            fontFamily: 'Inter,"Noto Sans Thai"',
            fontWeight: 900,
            fontSize: 15,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          กลับหน้าหลัก
        </button>
      </div>
    </div>
  );
}
