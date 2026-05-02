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
          const text = m.parts
            .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
            .map((p) => p.text)
            .join('');
          if (!text) return null;
          return (
            <div key={m.id} style={{ marginBottom: 12, display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
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
                }}
              >
                {text}
              </div>
            </div>
          );
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
