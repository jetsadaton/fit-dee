'use client';

// Minimal useChat-based UI to verify Phase 2 end-to-end.
//
// INTENTIONALLY NOT styled to match the full ChatScreen design — the next
// session integrates useChat into components/screens/chat-screen.tsx so
// the rich bubble variants (food card, workout card, AI insight card)
// can render through tool-call payloads. For now this proves the
// transport: input → POST /api/chat → Kimi → streaming → message list.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { BottomTabBar, type TabId } from '@/components/coach/primitives';
import { T } from '@/lib/design/tokens';
import type { FoodLogConfirmPayload } from '@/lib/ai/tools';
import { confirmFoodLogAction, cancelFoodLogAction } from './actions';

const MEAL_LABEL: Record<string, string> = {
  breakfast: 'เช้า',
  lunch: 'กลางวัน',
  dinner: 'เย็น',
  snack: 'ว่าง',
};

function FoodConfirmCard({ payload }: { payload: FoodLogConfirmPayload }) {
  const [state, setState] = useState<'idle' | 'loading' | 'confirmed' | 'cancelled'>('idle');

  const handleConfirm = async () => {
    setState('loading');
    await confirmFoodLogAction(payload.pendingId);
    setState('confirmed');
  };

  const handleCancel = async () => {
    setState('loading');
    await cancelFoodLogAction(payload.pendingId);
    setState('cancelled');
  };

  if (state === 'confirmed') {
    return (
      <div style={{ background: T.bg3, borderRadius: 12, padding: '10px 14px', fontSize: 13, color: T.textDim }}>
        ✓ บันทึก <strong style={{ color: T.text }}>{payload.nameTh}</strong> แล้ว
      </div>
    );
  }
  if (state === 'cancelled') {
    return (
      <div style={{ background: T.bg3, borderRadius: 12, padding: '10px 14px', fontSize: 13, color: T.textDim }}>
        ยกเลิกแล้ว
      </div>
    );
  }

  return (
    <div
      style={{
        background: T.bg3,
        border: `1px solid ${T.border}`,
        borderRadius: 14,
        padding: '12px 14px',
        fontSize: 13,
        fontFamily: 'Inter,"Noto Sans Thai"',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{payload.nameTh}</div>
          <div style={{ color: T.textDim, fontSize: 12 }}>
            มื้อ{MEAL_LABEL[payload.mealType] ?? payload.mealType}
            {payload.portionG ? ` · ${payload.portionG}g` : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: T.coral }}>
            {payload.kcalLow}–{payload.kcalHigh}
          </div>
          <div style={{ fontSize: 11, color: T.textDim }}>kcal</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <MacroPill label="โปรตีน" value={payload.proteinG} unit="g" color="#6EE7B7" />
        <MacroPill label="คาร์บ" value={payload.carbG} unit="g" color="#93C5FD" />
        <MacroPill label="ไขมัน" value={payload.fatG} unit="g" color="#FCA5A5" />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleConfirm}
          disabled={state === 'loading'}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: 999,
            border: 'none',
            background: state === 'loading' ? T.bg4 : T.coral,
            color: state === 'loading' ? T.textMute : '#0E0F12',
            fontWeight: 800,
            fontSize: 13,
            cursor: state === 'loading' ? 'not-allowed' : 'pointer',
          }}
        >
          {state === 'loading' ? '…' : 'ยืนยัน'}
        </button>
        <button
          onClick={handleCancel}
          disabled={state === 'loading'}
          style={{
            flex: 1,
            padding: '8px 0',
            borderRadius: 999,
            border: `1px solid ${T.border}`,
            background: 'transparent',
            color: T.textDim,
            fontSize: 13,
            cursor: state === 'loading' ? 'not-allowed' : 'pointer',
          }}
        >
          ยกเลิก
        </button>
      </div>
    </div>
  );
}

function MacroPill({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div
      style={{
        flex: 1,
        background: T.bg4,
        borderRadius: 8,
        padding: '4px 6px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color }}>{value}{unit}</div>
      <div style={{ fontSize: 10, color: T.textDim }}>{label}</div>
    </div>
  );
}

type ChatClientProps = {
  initialMessages: UIMessage[];
  displayName: string;
};

export function ChatClient({ initialMessages, displayName }: ChatClientProps) {
  const router = useRouter();
  const onTab = (t: TabId) => {
    if (t === 'chat') return;
    if (t === 'today') router.push('/today');
    else if (t === 'plan') router.push('/plan');
    else router.push('/me');
  };

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
    messages: initialMessages,
  });
  const [input, setInput] = useState('');
  const submitting = status === 'submitted' || status === 'streaming';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || submitting) return;
    sendMessage({ text: input });
    setInput('');
  };

  return (
    <div style={{ height: '100dvh', background: T.bg, color: T.text, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <header style={{ padding: '14px 18px 12px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: 0.6, textTransform: 'uppercase' }}>
          แชทกับโค้ชดี
        </div>
        <h1 style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontWeight: 900, fontSize: 22, color: T.text, margin: '2px 0 0' }}>
          สวัสดี {displayName}
        </h1>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 8px' }}>
        {messages.length === 0 && (
          <div style={{ color: T.textMute, fontSize: 13, textAlign: 'center', padding: 24 }}>
            ทักโค้ชดีได้เลย เช่น &quot;วันนี้กินข้าวกะเพราหมูสับ&quot; หรือ &quot;เพิ่งกินน้ำ 1 แก้ว&quot;
          </div>
        )}
        {messages.map((m) => {
          const bubbles: React.ReactNode[] = [];

          for (const p of m.parts) {
            if (p.type === 'text' && p.text) {
              bubbles.push(
                <div
                  key={`${m.id}-text-${bubbles.length}`}
                  style={{ marginBottom: 8, display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}
                >
                  <div
                    style={{
                      maxWidth: '80%',
                      padding: '10px 14px',
                      borderRadius: 16,
                      background: m.role === 'user' ? T.coral : T.bg3,
                      color: m.role === 'user' ? '#0E0F12' : T.text,
                      fontSize: 14,
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontFamily: 'Inter,"Noto Sans Thai"',
                    }}
                  >
                    {p.text}
                  </div>
                </div>
              );
            }

            // AI SDK v6: tool parts use type 'tool-{toolName}', state 'output-available', part.output
            if (p.type === 'tool-log_food' && 'state' in p && p.state === 'output-available' && 'output' in p) {
              const result = p.output as FoodLogConfirmPayload;
              if (result?.type === 'food_log_confirm') {
                bubbles.push(
                  <div key={`${m.id}-card-${bubbles.length}`} style={{ marginBottom: 8, maxWidth: '90%' }}>
                    <FoodConfirmCard payload={result} />
                  </div>
                );
              }
            }
          }

          if (bubbles.length === 0) return null;
          return <div key={m.id} style={{ marginBottom: 4 }}>{bubbles}</div>;
        })}
        {submitting && (
          <div style={{ color: T.textMute, fontSize: 12, padding: 8 }}>โค้ชกำลังพิมพ์…</div>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '12px 12px', paddingBottom: 'calc(68px + env(safe-area-inset-bottom, 0px))', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 8, flexShrink: 0 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="พิมพ์ที่นี่…"
          disabled={submitting}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 999,
            border: `1px solid ${T.border}`,
            background: T.bg3,
            color: T.text,
            fontFamily: 'Inter,"Noto Sans Thai"',
            fontSize: 14,
          }}
        />
        <button
          type="submit"
          disabled={submitting || !input.trim()}
          style={{
            padding: '10px 18px',
            borderRadius: 999,
            border: 'none',
            background: submitting || !input.trim() ? T.bg4 : T.coral,
            color: submitting || !input.trim() ? T.textMute : '#0E0F12',
            fontWeight: 800,
            fontSize: 14,
            cursor: submitting || !input.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          ส่ง
        </button>
      </form>

      <BottomTabBar active="chat" onTab={onTab} />
    </div>
  );
}
