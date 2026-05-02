'use client';

// Minimal useChat-based UI to verify Phase 2 end-to-end.
//
// INTENTIONALLY NOT styled to match the full ChatScreen design — the next
// session integrates useChat into components/screens/chat-screen.tsx so
// the rich bubble variants (food card, workout card, AI insight card)
// can render through tool-call payloads. For now this proves the
// transport: input → POST /api/chat → Kimi → streaming → message list.

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type FileUIPart, type UIMessage } from 'ai';
import { BottomTabBar, type TabId } from '@/components/coach/primitives';
import { T } from '@/lib/design/tokens';
import type { FoodLogConfirmPayload, WaterLogDonePayload, WeighInDonePayload, MoodLogDonePayload } from '@/lib/ai/tools';
import { MOOD_LABEL } from '@/lib/ai/tools';
import { resizeImage } from '@/lib/utils/resize-image';
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

function WaterLogCard({ payload }: { payload: WaterLogDonePayload }) {
  return (
    <div style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 14, padding: '10px 14px', fontSize: 13, fontFamily: 'Inter,"Noto Sans Thai"', display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 22 }}>💧</span>
      <div>
        <div style={{ fontWeight: 700, color: T.text }}>บันทึกน้ำแล้ว</div>
        <div style={{ color: T.textDim, fontSize: 12 }}>{payload.ml} ml</div>
      </div>
    </div>
  );
}

function WeighInCard({ payload }: { payload: WeighInDonePayload }) {
  return (
    <div style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 14, padding: '10px 14px', fontSize: 13, fontFamily: 'Inter,"Noto Sans Thai"', display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 22 }}>⚖️</span>
      <div>
        <div style={{ fontWeight: 700, color: T.text }}>บันทึกน้ำหนักแล้ว</div>
        <div style={{ color: T.textDim, fontSize: 12 }}>
          {payload.weightKg} kg{payload.bodyFatPct != null ? ` · ไขมัน ${payload.bodyFatPct}%` : ''}
        </div>
      </div>
    </div>
  );
}

function MoodLogCard({ payload }: { payload: MoodLogDonePayload }) {
  return (
    <div style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 14, padding: '10px 14px', fontSize: 13, fontFamily: 'Inter,"Noto Sans Thai"', display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 22 }}>🎯</span>
      <div>
        <div style={{ fontWeight: 700, color: T.text }}>บันทึกพลังงานแล้ว</div>
        <div style={{ color: T.textDim, fontSize: 12 }}>
          {MOOD_LABEL[payload.energy] ?? `ระดับ ${payload.energy}`}
          {payload.note ? ` — ${payload.note}` : ''}
        </div>
      </div>
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
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const streaming = status === 'submitted' || status === 'streaming';
  const busy = streaming || uploading;
  const canSend = !busy && (input.trim().length > 0 || pendingFile !== null);

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    e.target.value = '';
  };

  const clearFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;

    if (pendingFile) {
      setUploading(true);
      try {
        const resized = await resizeImage(pendingFile);
        const form = new FormData();
        form.append('file', resized, 'photo.jpg');
        // Guess kind from context: default food_photo; treadmill/scale handled by Kimi
        form.append('kind', 'food_photo');
        const res = await fetch('/api/attachments', { method: 'POST', body: form });
        if (!res.ok) throw new Error('upload failed');
        const { url } = (await res.json()) as { id: string; url: string };

        const filePart: FileUIPart = {
          type: 'file',
          filename: pendingFile.name,
          mediaType: 'image/jpeg',
          url,
        };
        sendMessage({ text: input || 'วิเคราะห์รูปนี้ให้หน่อย', files: [filePart] });
        clearFile();
      } catch {
        // If upload fails, surface via the natural error state — don't crash
      } finally {
        setUploading(false);
      }
    } else {
      sendMessage({ text: input });
    }
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
            ทักโค้ชดีได้เลย เช่น &quot;วันนี้กินข้าวกะเพราหมูสับ&quot; หรือ 📷 แนบรูปอาหาร/ลู่วิ่ง/ตาชั่ง
          </div>
        )}
        {messages.map((m) => {
          const bubbles: React.ReactNode[] = [];

          for (const p of m.parts) {
            // Image bubble
            if (p.type === 'file' && 'mediaType' in p && String(p.mediaType).startsWith('image/') && 'url' in p) {
              bubbles.push(
                <div key={`${m.id}-img-${bubbles.length}`} style={{ marginBottom: 8, display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <img
                    src={String(p.url)}
                    alt="รูปที่แนบ"
                    style={{ maxWidth: '65%', maxHeight: 240, borderRadius: 12, objectFit: 'cover', display: 'block' }}
                  />
                </div>
              );
            }

            // Text bubble
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

            // Tool result cards (AI SDK v6: type 'tool-{toolName}', state 'output-available', part.output)
            if ('state' in p && p.state === 'output-available' && 'output' in p) {
              const out = p.output as Record<string, unknown>;

              if (p.type === 'tool-log_food' && out?.type === 'food_log_confirm') {
                bubbles.push(
                  <div key={`${m.id}-card-${bubbles.length}`} style={{ marginBottom: 8, maxWidth: '90%' }}>
                    <FoodConfirmCard payload={out as unknown as FoodLogConfirmPayload} />
                  </div>
                );
              } else if (p.type === 'tool-log_water' && out?.type === 'water_log_done') {
                bubbles.push(
                  <div key={`${m.id}-card-${bubbles.length}`} style={{ marginBottom: 8, maxWidth: '90%' }}>
                    <WaterLogCard payload={out as unknown as WaterLogDonePayload} />
                  </div>
                );
              } else if (p.type === 'tool-weigh_in' && out?.type === 'weigh_in_done') {
                bubbles.push(
                  <div key={`${m.id}-card-${bubbles.length}`} style={{ marginBottom: 8, maxWidth: '90%' }}>
                    <WeighInCard payload={out as unknown as WeighInDonePayload} />
                  </div>
                );
              } else if (p.type === 'tool-set_mood' && out?.type === 'mood_log_done') {
                bubbles.push(
                  <div key={`${m.id}-card-${bubbles.length}`} style={{ marginBottom: 8, maxWidth: '90%' }}>
                    <MoodLogCard payload={out as unknown as MoodLogDonePayload} />
                  </div>
                );
              }
            }
          }

          if (bubbles.length === 0) return null;
          return <div key={m.id} style={{ marginBottom: 4 }}>{bubbles}</div>;
        })}
        {busy && (
          <div style={{ color: T.textMute, fontSize: 12, padding: 8 }}>
            {uploading ? 'กำลังอัปโหลดรูป…' : 'โค้ชกำลังพิมพ์…'}
          </div>
        )}
      </div>

      {/* Image preview strip */}
      {previewUrl && (
        <div style={{ padding: '8px 12px 0', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ position: 'relative', width: 56, height: 56 }}>
            <img src={previewUrl} alt="preview" style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover' }} />
            <button
              type="button"
              onClick={clearFile}
              style={{
                position: 'absolute', top: -6, right: -6,
                width: 18, height: 18, borderRadius: '50%',
                background: T.coral, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, color: '#0E0F12', fontWeight: 900, lineHeight: 1,
              }}
            >×</button>
          </div>
          <span style={{ fontSize: 12, color: T.textDim, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {pendingFile?.name}
          </span>
        </div>
      )}

      <form
        onSubmit={(e) => { void handleSubmit(e); }}
        style={{ padding: '10px 12px', paddingBottom: 'calc(68px + env(safe-area-inset-bottom, 0px))', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={pickFile}
        />

        {/* Camera button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          aria-label="แนบรูปภาพ"
          style={{
            width: 40, height: 40, borderRadius: '50%', border: 'none', flexShrink: 0,
            background: pendingFile ? T.coral : T.bg3,
            color: pendingFile ? '#0E0F12' : T.textDim,
            cursor: busy ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={pendingFile ? 'เพิ่มข้อความ (ไม่บังคับ)…' : 'พิมพ์ที่นี่…'}
          disabled={busy}
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 999,
            border: `1px solid ${T.border}`, background: T.bg3,
            color: T.text, fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 14,
          }}
        />
        <button
          type="submit"
          disabled={!canSend}
          style={{
            padding: '10px 18px', borderRadius: 999, border: 'none',
            background: canSend ? T.coral : T.bg4,
            color: canSend ? '#0E0F12' : T.textMute,
            fontWeight: 800, fontSize: 14, cursor: canSend ? 'pointer' : 'not-allowed',
            flexShrink: 0,
          }}
        >
          {uploading ? '…' : 'ส่ง'}
        </button>
      </form>

      <BottomTabBar active="chat" onTab={onTab} />
    </div>
  );
}
