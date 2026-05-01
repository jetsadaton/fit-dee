'use client';

import { useEffect, useRef, useState } from 'react';
import {
  BottomTabBar,
  CoachAvatar,
  KcalRing,
  StreakFlame,
  type TabId,
} from '@/components/coach/primitives';
import {
  CoachBubble,
  CoachCard,
  ExerciseDemoBubble,
  FoodLogCard,
  PhotoAnalysisBubble,
  UserBubble,
  WaterChipsBubble,
  WeeklyInsightBubble,
  WeighInPromptBubble,
  WorkoutCardBubble,
} from '@/components/chat/bubbles';
import { T } from '@/lib/design/tokens';

type Msg =
  | { kind: 'date'; text: string }
  | { kind: 'coachText'; text: string }
  | { kind: 'userText'; text: string }
  | { kind: 'workout' }
  | { kind: 'food'; id: string; name: string; kcal: [number, number]; p: number; c: number; f: number }
  | { kind: 'water' }
  | { kind: 'demo'; name: string; subtitle: string }
  | { kind: 'photo' }
  | { kind: 'weighIn' }
  | { kind: 'insight' };

const initialMsgs: Msg[] = [
  { kind: 'date', text: 'วันนี้' },
  { kind: 'coachText', text: 'อรุณสวัสดิ์! 🌅 เมื่อคืนหลับสบายมั้ย? วันนี้ตามแผนเรามีฝึก Push Day นะ' },
  { kind: 'workout' },
  { kind: 'userText', text: 'กินข้าวกะเพราไก่ไข่ดาวมาเที่ยง 1 จาน' },
  { kind: 'coachText', text: 'รับทราบ! เช็คแล้วประมาณนี้ ตรวจให้หน่อยนะ 👇' },
  { kind: 'food', id: 'm1', name: 'ข้าวกะเพราไก่ไข่ดาว', kcal: [620, 720], p: 32, c: 78, f: 22 },
  { kind: 'water' },
  { kind: 'userText', text: 'ท่า Bench ทำยังไงให้ถูก?' },
  { kind: 'demo', name: 'Bench Press', subtitle: 'หลังแนบเบาะ ลดบาร์ช้าๆ ดันขึ้นเร็ว' },
  { kind: 'photo' },
  { kind: 'weighIn' },
  { kind: 'insight' },
];

export function ChatScreen({ onTab, activeTab = 'chat' as TabId }: { onTab?: (t: TabId) => void; activeTab?: TabId }) {
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});
  const [messages] = useState<Msg[]>(initialMsgs);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, confirmed]);

  const renderMsg = (m: Msg, i: number) => {
    if (m.kind === 'date')
      return (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0 14px' }}>
          <div style={{ flex: 1, height: 1, background: T.border }} />
          <span
            style={{
              fontFamily: 'Inter,"Noto Sans Thai"',
              fontSize: 11,
              fontWeight: 700,
              color: T.textMute,
              letterSpacing: 0.6,
              textTransform: 'uppercase',
            }}
          >
            {m.text}
          </span>
          <div style={{ flex: 1, height: 1, background: T.border }} />
        </div>
      );
    if (m.kind === 'coachText') return <CoachBubble key={i}>{m.text}</CoachBubble>;
    if (m.kind === 'userText') return <UserBubble key={i}>{m.text}</UserBubble>;
    if (m.kind === 'workout')
      return (
        <CoachCard key={i}>
          <WorkoutCardBubble name="Push Day" exercises={5} mins={45} />
        </CoachCard>
      );
    if (m.kind === 'food')
      return (
        <CoachCard key={i}>
          <FoodLogCard
            name={m.name}
            kcal={m.kcal}
            p={m.p}
            c={m.c}
            f={m.f}
            confirmed={confirmed[m.id]}
            onConfirm={() => setConfirmed((c) => ({ ...c, [m.id]: true }))}
          />
        </CoachCard>
      );
    if (m.kind === 'water')
      return (
        <CoachCard key={i}>
          <WaterChipsBubble />
        </CoachCard>
      );
    if (m.kind === 'demo')
      return (
        <CoachCard key={i}>
          <ExerciseDemoBubble name={m.name} subtitle={m.subtitle} />
        </CoachCard>
      );
    if (m.kind === 'photo')
      return (
        <CoachCard key={i}>
          <PhotoAnalysisBubble />
        </CoachCard>
      );
    if (m.kind === 'weighIn')
      return (
        <CoachCard key={i}>
          <WeighInPromptBubble />
        </CoachCard>
      );
    if (m.kind === 'insight')
      return (
        <CoachCard key={i}>
          <WeeklyInsightBubble />
        </CoachCard>
      );
    return null;
  };

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
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 14px 12px',
          borderBottom: `1px solid ${T.border}`,
          background: T.bg,
        }}
      >
        <CoachAvatar size={38} online />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontWeight: 800, fontSize: 15, color: T.text }}>
              โค้ชดี
            </span>
            <div style={{ width: 6, height: 6, borderRadius: 999, background: T.lime }} />
          </div>
          <div style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 11, color: T.textDim, fontWeight: 600 }}>
            ออนไลน์ · ตอบทันที
          </div>
        </div>
        <StreakFlame count={12} />
        <button
          type="button"
          onClick={() => onTab?.('today')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 4 }}
          aria-label="ดู Today"
        >
          <KcalRing size={36} stroke={4} eaten={1450} goal={2000} burned={320} animate={false} />
        </button>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflow: 'auto', padding: '8px 12px 8px' }}>
        {messages.map(renderMsg)}
        <div style={{ height: 8 }} />
      </div>

      <div style={{ padding: '6px 12px 0', display: 'flex', gap: 6, overflowX: 'auto', flexShrink: 0 }}>
        {['🍱 กินอะไรดี', '💪 วันนี้ทำอะไร', '📝 บันทึกอาหาร', '⚖️ ชั่งน้ำหนัก'].map((c) => (
          <button
            type="button"
            key={c}
            style={{
              flexShrink: 0,
              padding: '7px 12px',
              borderRadius: 999,
              background: T.bg3,
              border: `1px solid ${T.border}`,
              color: T.text,
              fontFamily: 'Inter,"Noto Sans Thai"',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {c}
          </button>
        ))}
      </div>

      <div
        style={{
          padding: '8px 12px 12px',
          background: T.bg,
          borderTop: `1px solid ${T.border}`,
          marginTop: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 64,
        }}
      >
        <button
          type="button"
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            background: T.bg3,
            border: `1px solid ${T.border}`,
            color: T.text,
            cursor: 'pointer',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="เพิ่ม"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </button>
        <div
          style={{
            flex: 1,
            height: 40,
            padding: '0 14px',
            borderRadius: 999,
            background: T.bg3,
            border: `1px solid ${T.border}`,
            display: 'flex',
            alignItems: 'center',
            fontFamily: 'Inter,"Noto Sans Thai"',
            fontSize: 14,
            color: T.textMute,
          }}
        >
          พิมพ์อะไรก็ได้...
        </div>
        <button
          type="button"
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            background: T.bg3,
            border: `1px solid ${T.border}`,
            color: T.text,
            cursor: 'pointer',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="ถ่ายรูป"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 3l-1.5 2H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.5L15 3H9z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </button>
        <button
          type="button"
          style={{
            width: 40,
            height: 40,
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 12l18-9-4 9 4 9z" />
          </svg>
        </button>
      </div>

      <BottomTabBar active={activeTab} onTab={onTab} />
    </div>
  );
}
