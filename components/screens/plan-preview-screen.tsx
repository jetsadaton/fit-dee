'use client';

import { useState } from 'react';
import { CoachAvatar, MacroBar, PrimaryBtn, ProgressBar } from '@/components/coach/primitives';
import { T } from '@/lib/design/tokens';

export type PlanPreviewProps = {
  onStart?: () => void;
  /** Daily kcal target (post-floor). Falls back to 1820 for /canvas review. */
  kcalTarget?: number;
  /** Maintenance TDEE pre-goal-adjustment. */
  tdee?: number;
  /** Macro grams per day. */
  macros?: { proteinG: number; carbG: number; fatG: number };
  goal?: 'lose' | 'gain' | 'fit';
};

const DEFAULT_KCAL = 1820;
const DEFAULT_TDEE = 2320;
const DEFAULT_MACROS = { proteinG: 137, carbG: 205, fatG: 60 };
const DEFAULT_GOAL: 'lose' | 'gain' | 'fit' = 'lose';

export function PlanPreview({
  onStart,
  kcalTarget = DEFAULT_KCAL,
  tdee = DEFAULT_TDEE,
  macros = DEFAULT_MACROS,
  goal = DEFAULT_GOAL,
}: PlanPreviewProps) {
  const [exp, setExp] = useState(false);
  const delta = Math.abs(tdee - kcalTarget);
  const weeklyKgChange = ((delta * 7) / 7700).toFixed(2);
  const explainer =
    goal === 'lose'
      ? `เพราะอยากลดน้ำหนัก เราลด ${delta.toLocaleString()} kcal เพื่อลด ~${weeklyKgChange} กก./สัปดาห์ — ปลอดภัยและไม่หิวจัด`
      : goal === 'gain'
        ? `เพราะอยากเพิ่มกล้าม เราเพิ่ม ${delta.toLocaleString()} kcal เพื่อเพิ่ม ~${weeklyKgChange} กก./สัปดาห์ — ขึ้น lean ไม่อ้วน`
        : `รักษาน้ำหนักไว้ที่ระดับ TDEE — เน้นโภชนาการที่สมดุล`;
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: T.bg }}>
      <div style={{ padding: '12px 16px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ width: 22 }} />
          <span
            style={{
              fontFamily: 'Inter,"Noto Sans Thai"',
              fontSize: 11,
              fontWeight: 700,
              color: T.textDim,
              letterSpacing: 0.6,
              textTransform: 'uppercase',
            }}
          >
            แผนของเรา
          </span>
          <div style={{ width: 22 }} />
        </div>
        <ProgressBar pct={100} />
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '8px 20px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <CoachAvatar size={56} />
          <h2
            style={{
              fontFamily: 'Inter,"Noto Sans Thai"',
              fontWeight: 900,
              fontSize: 22,
              color: T.text,
              margin: '12px 0 6px',
              lineHeight: 1.2,
            }}
          >
            พร้อมแล้ว!
            <br />
            นี่คือแผนของเรา
          </h2>
          <p style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 13, color: T.textDim, margin: 0 }}>
            ทุก 14 วันเราปรับให้ตามผลจริง
          </p>
        </div>

        <div
          style={{
            background: `linear-gradient(160deg, ${T.bg3} 0%, ${T.bg2} 100%)`,
            borderRadius: 20,
            border: `1px solid ${T.border}`,
            padding: 20,
            marginBottom: 12,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontFamily: 'Inter,"Noto Sans Thai"',
              fontSize: 11,
              fontWeight: 800,
              color: T.textDim,
              letterSpacing: 1.4,
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            เป้าหมายต่อวัน
          </div>
          <div
            style={{
              fontFamily: 'Inter',
              fontWeight: 900,
              fontSize: 56,
              color: T.coral,
              lineHeight: 1,
              letterSpacing: -1,
            }}
          >
            {kcalTarget.toLocaleString()}
          </div>
          <div
            style={{
              fontFamily: 'Inter,"Noto Sans Thai"',
              fontSize: 13,
              color: T.textDim,
              fontWeight: 700,
              marginTop: 4,
              letterSpacing: 0.4,
              textTransform: 'uppercase',
            }}
          >
            kcal / day
          </div>

          <div style={{ marginTop: 16, padding: '12px 0 0', borderTop: `1px solid ${T.border}` }}>
            <MacroBar
              p={{ eaten: 0, goal: macros.proteinG }}
              c={{ eaten: 0, goal: macros.carbG }}
              f={{ eaten: 0, goal: macros.fatG }}
              compact
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExp(!exp)}
          style={{
            width: '100%',
            padding: 14,
            background: T.bg3,
            border: `1px solid ${T.border}`,
            borderRadius: 16,
            color: T.text,
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: T.limeBg,
              color: T.lime,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4M12 16v.01" strokeLinecap="round" />
            </svg>
          </div>
          <span style={{ flex: 1, fontFamily: 'Inter,"Noto Sans Thai"', fontWeight: 700, fontSize: 13.5 }}>
            ทำไมต้อง {kcalTarget.toLocaleString()} kcal?
          </span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke={T.textDim}
            strokeWidth="2.5"
            style={{ transform: exp ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" />
          </svg>
        </button>
        {exp && (
          <div style={{ background: T.bg2, borderRadius: 14, padding: 14, marginBottom: 12, border: `1px solid ${T.border}` }}>
            <div style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 12.5, color: T.textDim, lineHeight: 1.6 }}>
              <p style={{ margin: '0 0 8px' }}>
                <b style={{ color: T.text }}>TDEE</b> (พลังงานเผาผลาญต่อวัน) ของนาย ≈ {tdee.toLocaleString()} kcal
              </p>
              <p style={{ margin: 0 }}>{explainer}</p>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {[
            { i: '🍱', t: 'แชทบอกอาหารหรือถ่ายรูป', s: 'เราคำนวณแคลฯ ให้อัตโนมัติ' },
            { i: '🏋️', t: 'Push/Pull/Legs 4 วัน/สัปดาห์', s: 'ปรับตามอุปกรณ์ที่มี' },
            { i: '⚖️', t: 'ชั่งน้ำหนักทุกเช้า', s: 'ปรับเป้าทุก 14 วัน' },
          ].map((it) => (
            <div
              key={it.t}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                background: T.bg3,
                borderRadius: 14,
                border: `1px solid ${T.border}`,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: T.bg4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                }}
              >
                {it.i}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontWeight: 800, color: T.text, fontSize: 13.5 }}>
                  {it.t}
                </div>
                <div style={{ fontFamily: 'Inter,"Noto Sans Thai"', color: T.textDim, fontSize: 11.5, marginTop: 2 }}>
                  {it.s}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '12px 20px 20px', borderTop: `1px solid ${T.border}`, background: T.bg2 }}>
        <PrimaryBtn full size="lg" onClick={onStart}>
          เริ่มวันแรก
        </PrimaryBtn>
      </div>
    </div>
  );
}
