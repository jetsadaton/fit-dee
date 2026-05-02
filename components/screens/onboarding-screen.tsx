'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Chip,
  GhostBtn,
  PrimaryBtn,
  ProgressBar,
  stepperBtnStyle,
} from '@/components/coach/primitives';
import { CoachBubble, UserBubble } from '@/components/chat/bubbles';
import { T } from '@/lib/design/tokens';

const TOTAL = 9;

const goals = [
  { id: 'lose', label: 'ลดน้ำหนัก', emoji: '🎯' },
  { id: 'gain', label: 'เพิ่มกล้าม', emoji: '💪' },
  { id: 'fit', label: 'ฟิตและสุขภาพดี', emoji: '✨' },
] as const;

const activities = [
  { id: 'sit', label: 'นั่งทำงาน', sub: 'แทบไม่ได้ขยับ' },
  { id: 'walk', label: 'เดินบ้าง', sub: 'เดินวันละ 30 นาที' },
  { id: 'move', label: 'ขยับเยอะ', sub: 'งานต้องเดินตลอด' },
  { id: 'active', label: 'ออกกำลังประจำ', sub: '3-5 วัน/สัปดาห์' },
] as const;

const equipments = [
  { id: 'gym', label: 'ฟิตเนส', sub: 'มีอุปกรณ์ครบ', icon: '🏋️' },
  { id: 'home-eq', label: 'บ้านมีอุปกรณ์', sub: 'ดัมเบล/ยางยืด', icon: '🏠' },
  { id: 'home', label: 'บ้านไม่มีอุปกรณ์', sub: 'ใช้น้ำหนักตัว', icon: '🤸' },
] as const;

type GoalId = (typeof goals)[number]['id'];
type ActivityId = (typeof activities)[number]['id'];
type EquipmentId = (typeof equipments)[number]['id'];

/**
 * Frontend shape — kebab-case for `equipment` mirrors the design's IDs.
 * Caller (Server Action) maps `home-eq` → `home_eq` before validating with Zod.
 */
export type OnboardingFormData = {
  displayName: string;
  goal: GoalId;
  age: number;
  sex: 'm' | 'f' | 'o';
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  daysPerWeek: number;
  activityLevel: ActivityId;
  equipment: EquipmentId;
  injuries: string[];
};

export function OnboardingChat({
  onDone,
  onComplete,
}: {
  onDone?: () => void;
  /**
   * Persist the form. Returns null on success (caller handles navigation),
   * or an error message to display inline.
   */
  onComplete?: (data: OnboardingFormData) => Promise<string | null>;
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [goal, setGoal] = useState<GoalId | null>(null);
  const [age, setAge] = useState(28);
  const [sex, setSex] = useState<'m' | 'f' | 'o' | null>(null);
  const [height, setHeight] = useState(168);
  const [weight, setWeight] = useState(72);
  const [targetWeight, setTargetWeight] = useState(66);
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [activity, setActivity] = useState<ActivityId | null>(null);
  const [equipment, setEquipment] = useState<EquipmentId | null>(null);
  const [injuries, setInjuries] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [step]);

  const pct = (step / TOTAL) * 100;
  const advance = () => setStep((s) => s + 1);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleFinish = async () => {
    if (!onComplete) {
      onDone?.();
      return;
    }
    if (!goal || !sex || !activity || !equipment) return; // unreachable on step 9
    setSubmitting(true);
    setSubmitError(null);
    try {
      const err = await onComplete({
        displayName: name,
        goal,
        age,
        sex,
        heightCm: height,
        weightKg: weight,
        targetWeightKg: targetWeight,
        daysPerWeek,
        activityLevel: activity,
        equipment,
        injuries,
      });
      if (err) {
        setSubmitError(err);
        return;
      }
      onDone?.();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: T.bg }}>
      <div style={{ padding: '12px 16px 14px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            style={{ background: 'none', border: 'none', color: T.textDim, cursor: 'pointer', padding: 0 }}
            aria-label="ย้อนกลับ"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
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
            ตั้งค่าโปรไฟล์ · {Math.min(step + 1, TOTAL)}/{TOTAL}
          </span>
          <div style={{ width: 22 }} />
        </div>
        <ProgressBar pct={pct} />
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflow: 'auto', padding: '16px 12px 8px' }}>
        <CoachBubble>สวัสดี! เราโค้ชดี 👋<br />เรียกนายว่าอะไรดีล่ะ?</CoachBubble>
        {step >= 1 && <UserBubble>{name || '—'}</UserBubble>}

        {step >= 1 && (
          <CoachBubble>
            โอเค {name}! 🎉
            <br />
            เป้าหมายตอนนี้คืออะไร?
          </CoachBubble>
        )}
        {step >= 2 && goal && (
          <UserBubble>
            {goals.find((g) => g.id === goal)?.emoji} {goals.find((g) => g.id === goal)?.label}
          </UserBubble>
        )}

        {step >= 2 && (
          <CoachBubble>
            เก็ต! แล้วอายุกับเพศของนายล่ะ?
            <br />
            <span style={{ color: T.textMute, fontSize: 12 }}>เราใช้คำนวณแคลฯ ไม่บอกใครหรอก 🔒</span>
          </CoachBubble>
        )}
        {step >= 3 && (
          <UserBubble>
            {age} ปี · {sex === 'm' ? 'ชาย' : sex === 'f' ? 'หญิง' : 'อื่นๆ'}
          </UserBubble>
        )}

        {step >= 3 && <CoachBubble>ส่วนสูงกับน้ำหนักตอนนี้?</CoachBubble>}
        {step >= 4 && <UserBubble>{height} ซม. · {weight} กก.</UserBubble>}

        {step >= 4 && (
          <CoachBubble>
            เป้าหมายน้ำหนักล่ะ? อยากไปถึงเท่าไหร่?
            <br />
            <span style={{ color: T.textMute, fontSize: 12 }}>ตั้งแบบเริ่มต้น — เปลี่ยนทีหลังได้</span>
          </CoachBubble>
        )}
        {step >= 5 && (
          <UserBubble>
            {targetWeight} กก. ({weight > targetWeight ? '−' : '+'}
            {Math.abs(weight - targetWeight).toFixed(1)} กก.)
          </UserBubble>
        )}

        {step >= 5 && <CoachBubble>อยากออกกำลังกี่วันต่อสัปดาห์?</CoachBubble>}
        {step >= 6 && <UserBubble>{daysPerWeek} วัน/สัปดาห์</UserBubble>}

        {step >= 6 && <CoachBubble>วันธรรมดาขยับตัวยังไงบ้าง?</CoachBubble>}
        {step >= 7 && activity && <UserBubble>{activities.find((a) => a.id === activity)?.label}</UserBubble>}

        {step >= 7 && (
          <CoachBubble>
            ออกกำลังที่ไหน?
            <br />
            <span style={{ color: T.textMute, fontSize: 12 }}>ถ้าฟิตเนส เราขอถ่ายรูปอุปกรณ์ทีหลังนะ</span>
          </CoachBubble>
        )}
        {step >= 8 && equipment && (
          <UserBubble>
            {equipments.find((e) => e.id === equipment)?.icon} {equipments.find((e) => e.id === equipment)?.label}
          </UserBubble>
        )}

        {step >= 8 && <CoachBubble>เกือบเสร็จละ! มีอาการบาดเจ็บอะไรต้องระวังมั้ย?</CoachBubble>}
        {step >= 9 && <UserBubble>{injuries.length === 0 ? 'ไม่มี — ลุยได้เลย' : injuries.join(', ')}</UserBubble>}

        {step >= 9 && <CoachBubble>เยี่ยม! กำลังสร้างแผนให้นาย...</CoachBubble>}
      </div>

      <div style={{ borderTop: `1px solid ${T.border}`, background: T.bg2, padding: '12px 14px 16px' }}>
        {step === 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ชื่อหรือชื่อเล่น"
              style={{
                flex: 1,
                height: 48,
                padding: '0 16px',
                borderRadius: 24,
                background: T.bg3,
                border: `1px solid ${T.border}`,
                color: T.text,
                fontFamily: 'Inter,"Noto Sans Thai"',
                fontSize: 15,
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={() => name && advance()}
              disabled={!name}
              style={{
                width: 48,
                height: 48,
                borderRadius: 999,
                background: name ? T.coral : T.bg3,
                border: 'none',
                cursor: name ? 'pointer' : 'not-allowed',
                color: name ? '#0E0F12' : T.textMute,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              aria-label="ส่ง"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {goals.map((g) => (
              <button
                type="button"
                key={g.id}
                onClick={() => {
                  setGoal(g.id);
                  setTimeout(advance, 200);
                }}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 14,
                  background: goal === g.id ? T.coralBg : T.bg3,
                  border: `1px solid ${goal === g.id ? T.coral + '66' : T.border}`,
                  color: T.text,
                  cursor: 'pointer',
                  fontFamily: 'Inter,"Noto Sans Thai"',
                  fontWeight: 700,
                  fontSize: 15,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 24 }}>{g.emoji}</span>
                {g.label}
              </button>
            ))}
          </div>
        )}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  fontFamily: 'Inter,"Noto Sans Thai"',
                  fontSize: 13,
                  color: T.textDim,
                  fontWeight: 700,
                  width: 60,
                }}
              >
                อายุ
              </span>
              <button type="button" onClick={() => setAge((a) => Math.max(15, a - 1))} style={stepperBtnStyle}>
                −
              </button>
              <div
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontFamily: 'Inter',
                  fontWeight: 800,
                  fontSize: 22,
                  color: T.text,
                }}
              >
                {age}
                <span style={{ fontSize: 12, color: T.textMute, marginLeft: 4 }}>ปี</span>
              </div>
              <button type="button" onClick={() => setAge((a) => Math.min(80, a + 1))} style={stepperBtnStyle}>
                +
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {(
                [
                  { id: 'm' as const, l: 'ชาย' },
                  { id: 'f' as const, l: 'หญิง' },
                  { id: 'o' as const, l: 'อื่นๆ' },
                ]
              ).map((s) => (
                <Chip key={s.id} selected={sex === s.id} onClick={() => setSex(s.id)}>
                  {s.l}
                </Chip>
              ))}
            </div>
            <PrimaryBtn full onClick={() => sex && advance()}>
              ต่อไป
            </PrimaryBtn>
          </div>
        )}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 13, color: T.textDim, fontWeight: 700, width: 60 }}>
                ส่วนสูง
              </span>
              <button type="button" onClick={() => setHeight((h) => h - 1)} style={stepperBtnStyle}>
                −
              </button>
              <div style={{ flex: 1, textAlign: 'center', fontFamily: 'Inter', fontWeight: 800, fontSize: 22, color: T.text }}>
                {height}
                <span style={{ fontSize: 12, color: T.textMute, marginLeft: 4 }}>ซม.</span>
              </div>
              <button type="button" onClick={() => setHeight((h) => h + 1)} style={stepperBtnStyle}>
                +
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 13, color: T.textDim, fontWeight: 700, width: 60 }}>
                น้ำหนัก
              </span>
              <button type="button" onClick={() => setWeight((w) => +(w - 0.5).toFixed(1))} style={stepperBtnStyle}>
                −
              </button>
              <div style={{ flex: 1, textAlign: 'center', fontFamily: 'Inter', fontWeight: 800, fontSize: 22, color: T.text }}>
                {weight}
                <span style={{ fontSize: 12, color: T.textMute, marginLeft: 4 }}>กก.</span>
              </div>
              <button type="button" onClick={() => setWeight((w) => +(w + 0.5).toFixed(1))} style={stepperBtnStyle}>
                +
              </button>
            </div>
            <PrimaryBtn full onClick={advance}>
              ต่อไป
            </PrimaryBtn>
          </div>
        )}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 13, color: T.textDim, fontWeight: 700, width: 70 }}>
                เป้าหมาย
              </span>
              <button type="button" onClick={() => setTargetWeight((w) => +(w - 0.5).toFixed(1))} style={stepperBtnStyle}>
                −
              </button>
              <div style={{ flex: 1, textAlign: 'center', fontFamily: 'Inter', fontWeight: 800, fontSize: 22, color: T.coral }}>
                {targetWeight}
                <span style={{ fontSize: 12, color: T.textMute, marginLeft: 4, fontWeight: 600 }}>กก.</span>
              </div>
              <button type="button" onClick={() => setTargetWeight((w) => +(w + 0.5).toFixed(1))} style={stepperBtnStyle}>
                +
              </button>
            </div>
            <div
              style={{
                padding: '10px 12px',
                background: T.limeBg,
                border: `1px solid ${T.lime}33`,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.lime} strokeWidth="2.5">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 12.5, color: T.lime, fontWeight: 700 }}>
                {weight > targetWeight
                  ? `ลด ${(weight - targetWeight).toFixed(1)} กก.`
                  : weight < targetWeight
                    ? `เพิ่ม ${(targetWeight - weight).toFixed(1)} กก.`
                    : 'รักษาน้ำหนัก'}{' '}
                · ~{Math.max(2, Math.ceil(Math.abs(weight - targetWeight) * 2))} สัปดาห์
              </span>
            </div>
            <PrimaryBtn full onClick={advance}>
              ต่อไป
            </PrimaryBtn>
          </div>
        )}
        {step === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {[2, 3, 4, 5, 6].map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setDaysPerWeek(d)}
                  style={{
                    flex: 1,
                    padding: '14px 0',
                    borderRadius: 14,
                    background: daysPerWeek === d ? T.coralBg : T.bg3,
                    border: `1px solid ${daysPerWeek === d ? T.coral + '66' : T.border}`,
                    color: daysPerWeek === d ? T.coral : T.text,
                    cursor: 'pointer',
                    fontFamily: 'Inter',
                    fontWeight: 800,
                    fontSize: 18,
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
            <div style={{ textAlign: 'center', fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 12, color: T.textDim }}>
              {daysPerWeek <= 3
                ? 'เริ่มแบบสบายๆ — ดีสำหรับมือใหม่'
                : daysPerWeek === 4
                  ? '✓ สมดุลที่สุดสำหรับเป้าหมายนี้'
                  : 'หนักหน่อย — ต้องพักให้พอ'}
            </div>
            <PrimaryBtn full onClick={advance}>
              ต่อไป
            </PrimaryBtn>
          </div>
        )}
        {step === 6 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {activities.map((a) => (
              <button
                type="button"
                key={a.id}
                onClick={() => {
                  setActivity(a.id);
                  setTimeout(advance, 200);
                }}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 14,
                  background: activity === a.id ? T.coralBg : T.bg3,
                  border: `1px solid ${activity === a.id ? T.coral + '66' : T.border}`,
                  color: T.text,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontWeight: 800, fontSize: 14 }}>{a.label}</div>
                <div style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontWeight: 500, fontSize: 12, color: T.textDim, marginTop: 2 }}>
                  {a.sub}
                </div>
              </button>
            ))}
          </div>
        )}
        {step === 7 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {equipments.map((e) => (
              <button
                type="button"
                key={e.id}
                onClick={() => {
                  setEquipment(e.id);
                  setTimeout(advance, 200);
                }}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 14,
                  background: equipment === e.id ? T.coralBg : T.bg3,
                  border: `1px solid ${equipment === e.id ? T.coral + '66' : T.border}`,
                  color: T.text,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 26 }}>{e.icon}</span>
                <div>
                  <div style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontWeight: 800, fontSize: 14 }}>{e.label}</div>
                  <div
                    style={{
                      fontFamily: 'Inter,"Noto Sans Thai"',
                      fontWeight: 500,
                      fontSize: 12,
                      color: T.textDim,
                      marginTop: 2,
                    }}
                  >
                    {e.sub}
                  </div>
                </div>
                {e.id === 'gym' && equipment === 'gym' && (
                  <div
                    style={{
                      marginLeft: 'auto',
                      padding: '4px 8px',
                      borderRadius: 999,
                      background: T.coral,
                      color: '#0E0F12',
                      fontSize: 10,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 3l-1.5 2H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.5L15 3H9zm3 5a5 5 0 1 1 0 10 5 5 0 0 1 0-10z" />
                    </svg>
                    ถ่ายรูป
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
        {step === 8 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['ไหล่', 'หลังล่าง', 'หัวเข่า', 'ข้อเท้า', 'ข้อมือ', 'คอ'].map((part) => (
                <Chip
                  key={part}
                  selected={injuries.includes(part)}
                  onClick={() =>
                    setInjuries((I) => (I.includes(part) ? I.filter((p) => p !== part) : [...I, part]))
                  }
                >
                  {part}
                </Chip>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <GhostBtn full onClick={advance}>
                ไม่มี — ข้าม
              </GhostBtn>
              <PrimaryBtn full onClick={advance}>
                เสร็จ
              </PrimaryBtn>
            </div>
          </div>
        )}
        {step >= 9 && (
          <>
            {submitError && (
              <div
                style={{
                  marginBottom: 8,
                  padding: '10px 12px',
                  borderRadius: 12,
                  background: 'rgba(255,82,82,0.1)',
                  color: T.danger,
                  fontSize: 13,
                  fontFamily: 'Inter,"Noto Sans Thai"',
                }}
              >
                {submitError}
              </div>
            )}
            <PrimaryBtn
              full
              size="lg"
              onClick={handleFinish}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
            >
              {submitting ? 'กำลังบันทึก…' : 'ดูแผนของเรา'}
            </PrimaryBtn>
          </>
        )}
      </div>
    </div>
  );
}
