'use client';

import { useState } from 'react';
import { BottomTabBar, CoachAvatar, RangeBadge, type TabId } from '@/components/coach/primitives';
import { CoachBubble, CoachCard, TypingDots, UserBubble } from '@/components/chat/bubbles';
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

const EX = (
  name: string,
  sets: number,
  reps: string,
  lastWeight: number,
  tip: string | null,
  formCues: string[],
): ExerciseRow => ({ name, sets, reps, lastWeight, tip, formCues });

const DEFAULT_PLAN: WeekPlan = {
  จ: {
    name: 'Push Day',
    focus: 'อก·ไหล่·ไตรเซป',
    mins: 45,
    exercises: [
      EX('Bench Press', 3, '8-10', 60, 'ท่าหลักของวันนี้ เน้นฟอร์ม', [
        'หลังแนบเบาะ ขาแน่นพื้น',
        'ลดบาร์ลงช้าๆ ~3 วินาที',
        'ดันขึ้นเร็ว หายใจออก',
        'ไหล่ไม่ยกขึ้น เก็บสะบักลง',
      ]),
      EX('Shoulder Press', 3, '10-12', 22.5, 'ใช้ดัมเบลคุมง่ายกว่าบาร์', [
        'นั่งหลังตรง ก้นแนบเบาะ',
        'ดันขึ้นจนข้อศอกเกือบเหยียดสุด',
        'อย่าโค้งหลัง ใช้แกนกลางช่วย',
      ]),
      EX('Incline DB Press', 3, '10-12', 20, null, ['เบาะเอียง 30-45°', 'ลดถึงระดับอก กว้างหน่อย', 'บีบอกตอนดันขึ้น']),
      EX('Lateral Raise', 3, '12-15', 8, 'ห้ามเหวี่ยง', ['ยืนตรง เกร็งแกน', 'ยกข้างจนถึงระดับไหล่', 'ลดลงช้า 2 วินาที']),
      EX('Tricep Pushdown', 3, '12-15', 25, null, ['ข้อศอกชิดข้างลำตัว', 'เหยียดแขนสุด บีบไตรเซป', 'กลับเข้าช้าๆ']),
    ],
  },
  อ: {
    name: 'Pull Day',
    focus: 'หลัง·ไบเซป',
    mins: 50,
    exercises: [
      EX('Pull-up', 3, '6-8', 0, 'น้ำหนักตัว', ['จับกว้างกว่าไหล่นิดหน่อย', 'ดึงให้คางผ่านราว', 'ลงช้า ควบคุมตลอด']),
      EX('Barbell Row', 3, '8-10', 50, null, ['โน้มตัว 45°', 'ดึงเข้าหาท้อง', 'บีบสะบักตอนสุด']),
      EX('Lat Pulldown', 3, '10-12', 45, null, ['จับกว้าง', 'ดึงลงถึงอกบน', 'อย่าใช้ momentum']),
      EX('Face Pull', 3, '12-15', 20, 'ดีต่อไหล่', ['เคเบิลระดับใบหน้า', 'ดึงเข้าหน้าผาก', 'หมุนข้อมือออกตอนสุด']),
      EX('Bicep Curl', 3, '10-12', 12, null, ['ข้อศอกชิดข้างลำตัว', 'เหวี่ยงน้อย ใช้กล้าม', 'ลงช้า']),
    ],
  },
  พ: { name: 'พัก', rest: true },
  พฤ: {
    name: 'Leg Day',
    focus: 'ขา·ก้น·แกนกลาง',
    mins: 55,
    exercises: [
      EX('Squat', 4, '8-10', 70, 'ท่าหลัก', ['ยืนกว้างเท่าไหล่', 'ลงจน thigh ขนานพื้น', 'ดันส้นเท้า', 'หลังตรง']),
      EX('Romanian Deadlift', 3, '10-12', 60, null, ['ขาตึงเล็กน้อย', 'ดันสะโพกถอย', 'รู้สึกตึง hamstring']),
      EX('Leg Press', 3, '12-15', 120, null, ['เท้ากลางแผ่น', 'ลงจนเข่า 90°', 'อย่าล็อคเข่าตอนดัน']),
      EX('Leg Curl', 3, '12-15', 30, null, ['งอเข่าเต็มที่', 'ลงช้า 2-3 วิ']),
      EX('Calf Raise', 3, '15-20', 40, null, ['ยืนปลายเท้า', 'ขึ้นสุด ลงสุด', 'pause 1 วิ ตอนสุด']),
    ],
  },
  ศ: {
    name: 'Push Day',
    focus: 'อก·ไหล่·ไตรเซป',
    mins: 45,
    exercises: [
      EX('Incline Bench', 3, '8-10', 50, null, ['เบาะ 30°', 'ลดถึงอกบน', 'ดันให้สุด']),
      EX('Arnold Press', 3, '10-12', 18, null, ['เริ่มฝ่ามือเข้าหาตัว', 'หมุนตอนดันขึ้น', 'จบฝ่ามือออก']),
      EX('Cable Fly', 3, '12-15', 15, null, ['โน้มเล็กน้อย', 'บีบอกเข้าหากัน', 'ข้อศอกงอเล็กน้อย']),
      EX('Front Raise', 3, '12-15', 8, null, ['ยกข้างหน้าระดับไหล่', 'ลงช้า', 'อย่าใช้แรงเหวี่ยง']),
      EX('Skull Crusher', 3, '10-12', 20, null, ['นอนเบาะราบ', 'ลดบาร์มาที่หน้าผาก', 'ใช้แค่ข้อศอก']),
    ],
  },
  ส: {
    name: 'Pull Day',
    focus: 'หลัง·ไบเซป',
    mins: 50,
    exercises: [
      EX('Deadlift', 3, '5-6', 90, 'ท่าหนัก เน้นฟอร์ม', ['บาร์ชิดหน้าแข้ง', 'หลังตรง ก้นต่ำ', 'ดันพื้น ยืนขึ้น', 'อย่าโค้งหลัง']),
      EX('Pull-up', 3, '6-8', 0, null, ['จับกว้างกว่าไหล่', 'ดึงคางผ่านราว']),
      EX('Cable Row', 3, '10-12', 50, null, ['นั่งตรง', 'ดึงเข้าท้อง', 'บีบสะบัก']),
      EX('Reverse Fly', 3, '12-15', 8, 'ดีต่อหลังบน', ['โน้มตัว', 'กางแขนออกข้าง', 'บีบสะบัก']),
      EX('Hammer Curl', 3, '10-12', 12, null, ['จับแบบทุบค้อน', 'ข้อศอกชิดตัว', 'ลงช้า']),
    ],
  },
  อา: { name: 'พัก', rest: true },
};

type ChatMsg =
  | { role: 'user'; text: string }
  | { role: 'coach'; text: string; plan?: WeekPlan; confirmed?: boolean };

type LogEntry = { done: boolean; weight: number; sets: { w: number; r: string }[] };

export function PlanScreen({
  onTab,
  activeTab = 'plan' as TabId,
  onStartWorkout,
  initialPlan,
}: {
  onTab?: (t: TabId) => void;
  activeTab?: TabId;
  onStartWorkout?: () => void;
  initialPlan?: WeekPlan;
}) {
  const days = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'] as const;
  const dayLabel: Record<string, string> = {
    จ: 'จันทร์',
    อ: 'อังคาร',
    พ: 'พุธ',
    พฤ: 'พฤหัส',
    ศ: 'ศุกร์',
    ส: 'เสาร์',
    อา: 'อาทิตย์',
  };
  const today = 'จ';
  const [plan, setPlan] = useState<WeekPlan>(initialPlan ?? DEFAULT_PLAN);
  const [selected, setSelected] = useState<string>(today);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [exDetail, setExDetail] = useState<{ day: string; idx: number } | null>(null);
  const [logs, setLogs] = useState<Record<string, LogEntry>>({});

  const cur = plan[selected]!;

  const askAI = (text: string) => {
    if (!text.trim()) return;
    setChatMsgs((m) => [...m, { role: 'user', text }]);
    setChatInput('');
    setThinking(true);
    setTimeout(() => {
      let response: string;
      let newPlan: WeekPlan | undefined;
      if (text.includes('ไหล่') || text.toLowerCase().includes('shoulder')) {
        response = 'ได้! สลับให้เป็น Shoulder Day เน้นไหล่ล้วน เก็บ Push ไว้วันศุกร์แทน — โอเคมั้ย?';
        newPlan = {
          ...plan,
          [selected]: {
            name: 'Shoulder Day',
            focus: 'ไหล่·ไตรเซป',
            mins: 45,
            exercises: [
              EX('Overhead Press', 3, '8-10', 35, 'ท่าหลัก', ['ยืนตรง เกร็งแกน', 'ดันขึ้นสุด', 'อย่าโค้งหลัง']),
              EX('Arnold Press', 3, '10-12', 18, null, ['เริ่มฝ่ามือเข้า', 'หมุนตอนดัน', 'จบฝ่ามือออก']),
              EX('Lateral Raise', 3, '12-15', 8, 'ห้ามเหวี่ยง', ['ยกข้างถึงระดับไหล่', 'ลงช้า']),
              EX('Rear Delt Fly', 3, '12-15', 7, null, ['โน้มตัว', 'กางออกข้าง', 'บีบสะบัก']),
              EX('Upright Row', 3, '10-12', 25, null, ['ดึงขึ้นถึงคาง', 'ข้อศอกสูงกว่ามือ']),
            ],
          },
        };
      } else if (text.includes('พัก') || text.includes('เหนื่อย')) {
        response = 'โอเค ให้พักวันนี้ เลื่อน Push ไปวันพฤหัสแทน ไม่ต้องฝืนนะ 💤';
        newPlan = { ...plan, [selected]: { name: 'พัก', rest: true } };
      } else if (text.includes('ขา') || text.toLowerCase().includes('leg')) {
        response = 'ได้เลย! เปลี่ยนเป็น Leg Day';
        newPlan = {
          ...plan,
          [selected]: {
            name: 'Leg Day',
            focus: 'ขา·ก้น',
            mins: 55,
            exercises: [
              EX('Squat', 4, '8-10', 70, 'ท่าหลัก', ['กว้างเท่าไหล่', 'thigh ขนานพื้น', 'ดันส้นเท้า']),
              EX('Romanian Deadlift', 3, '10-12', 60, null, ['ดันสะโพกถอย', 'ตึง hamstring']),
              EX('Lunge', 3, '10-12', 16, null, ['ก้าวยาว', 'เข่าหน้า 90°', 'ตัวตรง']),
              EX('Leg Curl', 3, '12-15', 30, null, ['งอเต็มที่', 'ลงช้า']),
              EX('Calf Raise', 3, '15-20', 40, null, ['ยืนปลายเท้า', 'pause 1 วิ']),
            ],
          },
        };
      } else {
        response = 'รับทราบ! ลองบอกเฉพาะเจาะจงดู เช่น "วันนี้อยากเล่นไหล่" หรือ "ขอพัก"';
      }
      setChatMsgs((m) => [...m, { role: 'coach', text: response, plan: newPlan }]);
      setThinking(false);
    }, 900);
  };

  const acceptPlan = (newPlan: WeekPlan) => {
    setPlan(newPlan);
    setChatMsgs((m) => [...m, { role: 'coach', text: '✓ ปรับให้แล้ว! ดูในแผนได้เลย', confirmed: true }]);
    setTimeout(() => setChatOpen(false), 600);
  };

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
              fontFamily: 'Inter,"Noto Sans Thai"',
              fontSize: 11,
              fontWeight: 700,
              color: T.textDim,
              letterSpacing: 0.6,
              textTransform: 'uppercase',
            }}
          >
            แผนสัปดาห์นี้
          </div>
          <h1 style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontWeight: 900, fontSize: 22, color: T.text, margin: '2px 0 0' }}>
            Push / Pull / Legs
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          style={{
            padding: '8px 12px',
            borderRadius: 999,
            background: T.coralBg,
            border: `1px solid ${T.coral}66`,
            color: T.coral,
            fontFamily: 'Inter,"Noto Sans Thai"',
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

      <div
        style={{
          padding: '14px 12px',
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 5,
          flexShrink: 0,
        }}
      >
        {days.map((d) => {
          const p = plan[d]!;
          const isToday = d === today;
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
                  fontFamily: 'Inter,"Noto Sans Thai"',
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: 0.4,
                  textTransform: 'uppercase',
                  opacity: 0.75,
                }}
              >
                {d}
              </span>
              <span style={{ fontFamily: 'Inter', fontSize: 18, fontWeight: 900 }}>
                {['25', '26', '27', '28', '29', '30', '1'][days.indexOf(d)]}
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
                fontFamily: 'Inter,"Noto Sans Thai"',
                fontWeight: 900,
                color: T.text,
                fontSize: 22,
                margin: '12px 0 4px',
              }}
            >
              วันพัก
            </h2>
            <p style={{ fontFamily: 'Inter,"Noto Sans Thai"', color: T.textDim, fontSize: 13, margin: 0 }}>
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
                    fontFamily: 'Inter,"Noto Sans Thai"',
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: 1.4,
                    textTransform: 'uppercase',
                    color: T.coral,
                  }}
                >
                  {selected === today ? 'วันนี้' : dayLabel[selected]}
                </div>
                <h2
                  style={{
                    fontFamily: 'Inter,"Noto Sans Thai"',
                    fontWeight: 900,
                    color: T.text,
                    fontSize: 26,
                    margin: '4px 0 4px',
                  }}
                >
                  {cur.name}
                </h2>
                <div style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 12, color: T.textDim, fontWeight: 600 }}>
                  {cur.focus}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <RangeBadge low={(cur.mins ?? 45) - 5} high={(cur.mins ?? 45) + 5} unit="นาที" />
                <span style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 10, fontWeight: 700, color: T.textMute }}>
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
                fontFamily: 'Inter,"Noto Sans Thai"',
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
                fontFamily: 'Inter,"Noto Sans Thai"',
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
                        fontFamily: 'Inter',
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
                          fontFamily: 'Inter,"Noto Sans Thai"',
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
                          fontFamily: 'Inter,"Noto Sans Thai"',
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
              onClick={() => setChatOpen(true)}
              style={{
                width: '100%',
                padding: '14px',
                background: T.bg3,
                border: `1px dashed ${T.borderHi}`,
                borderRadius: 14,
                color: T.text,
                fontFamily: 'Inter,"Noto Sans Thai"',
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

      {chatOpen && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            animation: 'cdFadeIn 0.2s ease',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setChatOpen(false);
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
              maxHeight: '76%',
            }}
          >
            <div style={{ padding: '10px 0 4px', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 36, height: 4, borderRadius: 999, background: T.borderHi }} />
            </div>
            <div
              style={{
                padding: '6px 16px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                borderBottom: `1px solid ${T.border}`,
              }}
            >
              <CoachAvatar size={32} online />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontWeight: 800, fontSize: 14, color: T.text }}>
                  ปรับแผนกับโค้ชดี
                </div>
                <div style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 11, color: T.textDim }}>
                  {dayLabel[selected]} · {cur.name}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                style={{ background: 'none', border: 'none', color: T.textDim, cursor: 'pointer', padding: 4 }}
                aria-label="ปิด"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '14px 12px' }}>
              {chatMsgs.length === 0 && (
                <CoachBubble>
                  บอกได้เลย วันนี้อยากปรับยังไง?
                  <br />
                  <span style={{ color: T.textMute, fontSize: 12 }}>เช่น &quot;เปลี่ยนเป็นวันไหล่&quot; หรือ &quot;ขอพัก&quot;</span>
                </CoachBubble>
              )}
              {chatMsgs.map((m, i) => {
                if (m.role === 'user') return <UserBubble key={i}>{m.text}</UserBubble>;
                return (
                  <div key={i}>
                    <CoachBubble>{m.text}</CoachBubble>
                    {m.plan && !m.confirmed && (
                      <CoachCard>
                        <div style={{ background: T.bg3, border: `1px solid ${T.coral}66`, borderRadius: 14, padding: 12 }}>
                          <div
                            style={{
                              fontFamily: 'Inter,"Noto Sans Thai"',
                              fontSize: 10,
                              fontWeight: 800,
                              letterSpacing: 1.2,
                              textTransform: 'uppercase',
                              color: T.coral,
                              marginBottom: 6,
                            }}
                          >
                            แผนใหม่ที่เสนอ
                          </div>
                          <div
                            style={{
                              fontFamily: 'Inter,"Noto Sans Thai"',
                              fontWeight: 800,
                              color: T.text,
                              fontSize: 16,
                              marginBottom: 4,
                            }}
                          >
                            {m.plan[selected]!.name}
                          </div>
                          {!m.plan[selected]!.rest && m.plan[selected]!.exercises && (
                            <div
                              style={{
                                fontFamily: 'Inter,"Noto Sans Thai"',
                                color: T.textDim,
                                fontSize: 12,
                                marginBottom: 10,
                              }}
                            >
                              {m.plan[selected]!.exercises!.slice(0, 3).map((e) => e.name).join(' · ')}
                              {m.plan[selected]!.exercises!.length > 3 ? '...' : ''}
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              type="button"
                              onClick={() => setChatMsgs((M) => M.filter((_, j) => j !== i))}
                              style={{
                                flex: 1,
                                padding: '10px',
                                borderRadius: 10,
                                background: T.bg4,
                                border: `1px solid ${T.border}`,
                                color: T.textDim,
                                fontFamily: 'Inter,"Noto Sans Thai"',
                                fontWeight: 700,
                                fontSize: 12,
                                cursor: 'pointer',
                              }}
                            >
                              ไม่เอา
                            </button>
                            <button
                              type="button"
                              onClick={() => acceptPlan(m.plan!)}
                              style={{
                                flex: 1.6,
                                padding: '10px',
                                borderRadius: 10,
                                background: T.coral,
                                border: 'none',
                                color: '#0E0F12',
                                fontFamily: 'Inter,"Noto Sans Thai"',
                                fontWeight: 800,
                                fontSize: 12,
                                cursor: 'pointer',
                              }}
                            >
                              ตกลง ปรับเลย
                            </button>
                          </div>
                        </div>
                      </CoachCard>
                    )}
                  </div>
                );
              })}
              {thinking && <TypingDots />}
            </div>
            {chatMsgs.length === 0 && (
              <div style={{ padding: '0 12px 8px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['อยากเล่นไหล่แทน', 'ขอพักวันนี้', 'เปลี่ยนเป็นขา'].map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => askAI(s)}
                    style={{
                      padding: '7px 12px',
                      borderRadius: 999,
                      background: T.bg3,
                      border: `1px solid ${T.border}`,
                      color: T.text,
                      fontFamily: 'Inter,"Noto Sans Thai"',
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div style={{ padding: '8px 12px 14px', display: 'flex', gap: 8, borderTop: `1px solid ${T.border}` }}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') askAI(chatInput);
                }}
                placeholder="พิมพ์บอกโค้ช..."
                style={{
                  flex: 1,
                  height: 42,
                  padding: '0 14px',
                  borderRadius: 999,
                  background: T.bg3,
                  border: `1px solid ${T.border}`,
                  color: T.text,
                  fontFamily: 'Inter,"Noto Sans Thai"',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => askAI(chatInput)}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 999,
                  background: T.coral,
                  border: 'none',
                  color: '#0E0F12',
                  cursor: 'pointer',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="ส่ง"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 12l18-9-4 9 4 9z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomTabBar active={activeTab} onTab={onTab} />

      {exDetail && (
        <ExerciseDetailSheet
          exercise={plan[exDetail.day]!.exercises![exDetail.idx]!}
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
    fontFamily: 'Inter',
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
              <h2 style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontWeight: 900, fontSize: 22, color: T.text, margin: 0 }}>
                {exercise.name}
              </h2>
              <div
                style={{
                  fontFamily: 'Inter,"Noto Sans Thai"',
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
                  fontFamily: 'Inter,"Noto Sans Thai"',
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
                    fontFamily: 'Inter,"Noto Sans Thai"',
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
                  <div style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 13, color: T.text, lineHeight: 1.5 }}>
                    {exercise.tip}
                  </div>
                </div>
              )}

              <div
                style={{
                  fontFamily: 'Inter,"Noto Sans Thai"',
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
                        fontFamily: 'Inter',
                        fontSize: 11,
                        fontWeight: 800,
                        color: T.lime,
                      }}
                    >
                      {i + 1}
                    </div>
                    <div
                      style={{
                        fontFamily: 'Inter,"Noto Sans Thai"',
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
                  fontFamily: 'Inter,"Noto Sans Thai"',
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
                    fontFamily: 'Inter,"Noto Sans Thai"',
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
                    <span style={{ fontFamily: 'Inter', fontSize: 24, fontWeight: 900, color: T.text }}>{weight}</span>
                    <span
                      style={{
                        fontFamily: 'Inter,"Noto Sans Thai"',
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
                  fontFamily: 'Inter,"Noto Sans Thai"',
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
                        fontFamily: 'Inter',
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
                      fontFamily: 'Inter,"Noto Sans Thai"',
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
                    fontFamily: 'Inter,"Noto Sans Thai"',
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
          fontFamily: 'Inter',
          fontSize: 15,
          fontWeight: 700,
          outline: 'none',
          textAlign: 'right',
          padding: 0,
        }}
      />
      <span
        style={{
          fontFamily: 'Inter,"Noto Sans Thai"',
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
