'use client';

// keep visual structure in sync with components/screens/chat-screen.tsx

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type FileUIPart, type UIMessage } from 'ai';
import { BottomTabBar, CoachAvatar, KcalRing, StreakFlame, type TabId } from '@/components/coach/primitives';
import { T } from '@/lib/design/tokens';
import type { FoodLogConfirmPayload, WaterLogDonePayload, WeighInDonePayload, MoodLogDonePayload, ExerciseLogDonePayload, UpdateProfileConfirmPayload, WorkoutPlanCreatedPayload } from '@/lib/ai/tools/shared-types';
import { MOOD_LABEL, GOAL_LABEL, ACTIVITY_LABEL, EQUIPMENT_LABEL } from '@/lib/ai/tools/shared-types';
import { resizeImage } from '@/lib/utils/resize-image';
import { queryKeys } from '@/lib/queries/keys';
import { confirmFoodLogAction, cancelFoodLogAction, confirmUpdateProfileAction, fetchChatByDateAction } from './actions';

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

function todayIct(): string {
  return new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
}

function shiftDay(dateIct: string, delta: number): string {
  const [y, m, d] = dateIct.split('-').map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d!));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().slice(0, 10);
}

function fmtDateThai(dateIct: string, isToday: boolean): string {
  const [, m, d] = dateIct.split('-').map(Number);
  const base = `${d} ${THAI_MONTHS[m! - 1]}`;
  return isToday ? `วันนี้ · ${base}` : base;
}

const MEAL_LABEL: Record<string, string> = {
  breakfast: 'เช้า',
  lunch: 'กลางวัน',
  dinner: 'เย็น',
  snack: 'ว่าง',
};

const QUICK_CHIPS_BASE = ['🍱 กินอะไรดี', '💪 วันนี้ทำอะไร', '📝 บันทึกอาหาร', '⚖️ ชั่งน้ำหนัก'];

function FoodConfirmCard({ payload, historical = false }: { payload: FoodLogConfirmPayload; historical?: boolean }) {
  const [state, setState] = useState<'idle' | 'loading' | 'confirmed' | 'cancelled'>(
    historical ? 'confirmed' : 'idle',
  );

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
        ไม่ได้บันทึก
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
        fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
      }}
    >
      {/* Header — makes it clear this is a proposal, not a saved record */}
      <div style={{ fontSize: 11, color: T.textMute, fontWeight: 600, marginBottom: 8, letterSpacing: 0.2 }}>
        📋 โค้ชแนะนำให้บันทึก · ยังไม่บันทึก
      </div>

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
          {state === 'loading' ? '…' : 'บันทึกเลย'}
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
          ไม่บันทึก
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
    <div style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 14, padding: '10px 14px', fontSize: 13, fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)', display: 'flex', alignItems: 'center', gap: 10 }}>
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
    <div style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 14, padding: '10px 14px', fontSize: 13, fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)', display: 'flex', alignItems: 'center', gap: 10 }}>
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
    <div style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 14, padding: '10px 14px', fontSize: 13, fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)', display: 'flex', alignItems: 'center', gap: 10 }}>
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

function ExerciseLogCard({ payload }: { payload: ExerciseLogDonePayload }) {
  return (
    <div style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 14, padding: '10px 14px', fontSize: 13, fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)', display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 22 }}>💪</span>
      <div>
        <div style={{ fontWeight: 700, color: T.text }}>บันทึกท่าออกกำลังแล้ว</div>
        <div style={{ color: T.textDim, fontSize: 12 }}>
          {payload.exerciseNameTh} · {payload.sets} เซต × {payload.reps} ครั้ง
          {payload.weightKg > 0 ? ` @ ${payload.weightKg} kg` : ' (bodyweight)'}
        </div>
      </div>
    </div>
  );
}

function WorkoutPlanCreatedCard({ payload }: { payload: WorkoutPlanCreatedPayload }) {
  const router = useRouter();
  return (
    <div
      style={{
        background: T.bg3,
        border: `1px solid ${T.coral}55`,
        borderRadius: 14,
        padding: '12px 14px',
        fontSize: 13,
        fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
      }}
    >
      <div style={{ fontSize: 11, color: T.coral, fontWeight: 700, marginBottom: 6, letterSpacing: 0.2 }}>
        🏋️ {payload.replacedExisting ? 'เปลี่ยนแผนใหม่แล้ว' : 'สร้างแผนใหม่แล้ว'}
      </div>
      <div style={{ fontWeight: 700, color: T.text, fontSize: 14, marginBottom: 4 }}>
        {payload.daysPerWeek} วัน/สัปดาห์
      </div>
      <div style={{ color: T.textDim, fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>
        {payload.workoutDayNames.join(' · ')}
      </div>
      <button
        type="button"
        onClick={() => router.push('/plan')}
        style={{
          width: '100%',
          padding: '10px 0',
          borderRadius: 999,
          border: 'none',
          background: T.coral,
          color: '#0E0F12',
          fontWeight: 800,
          fontSize: 13,
          cursor: 'pointer',
          fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
        }}
      >
        ดูแผน →
      </button>
    </div>
  );
}

function UpdateProfileConfirmCard({
  payload,
  historical = false,
}: {
  payload: UpdateProfileConfirmPayload;
  historical?: boolean;
}) {
  const [state, setState] = useState<'idle' | 'loading' | 'confirmed' | 'cancelled'>(
    historical ? 'confirmed' : 'idle',
  );

  const handleConfirm = async () => {
    setState('loading');
    await confirmUpdateProfileAction(payload.changes);
    setState('confirmed');
  };

  const { changes, preview } = payload;

  const changeRows: { label: string; value: string }[] = [];
  if (changes.goal) changeRows.push({ label: 'เป้าหมาย', value: GOAL_LABEL[changes.goal] ?? changes.goal });
  if (changes.activityLevel) changeRows.push({ label: 'กิจกรรม', value: ACTIVITY_LABEL[changes.activityLevel] ?? changes.activityLevel });
  if (changes.targetWeightKg !== undefined) changeRows.push({ label: 'น้ำหนักเป้า', value: `${changes.targetWeightKg} kg` });
  if (changes.daysPerWeek !== undefined) changeRows.push({ label: 'วันออกกำลัง', value: `${changes.daysPerWeek} วัน/สัปดาห์` });
  if (changes.equipment) changeRows.push({ label: 'อุปกรณ์', value: EQUIPMENT_LABEL[changes.equipment] ?? changes.equipment });

  if (state === 'confirmed') {
    return (
      <div style={{ background: T.bg3, borderRadius: 12, padding: '10px 14px', fontSize: 13, color: T.textDim }}>
        ✓ อัปเดตโปรไฟล์แล้ว · เป้าใหม่ <strong style={{ color: T.text }}>{preview.kcalTarget} kcal/วัน</strong>
      </div>
    );
  }
  if (state === 'cancelled') {
    return (
      <div style={{ background: T.bg3, borderRadius: 12, padding: '10px 14px', fontSize: 13, color: T.textDim }}>
        ไม่ได้เปลี่ยน
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
        fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
      }}
    >
      <div style={{ fontSize: 11, color: T.textMute, fontWeight: 600, marginBottom: 8, letterSpacing: 0.2 }}>
        ⚙️ โค้ชแนะนำให้อัปเดตแผน · ยังไม่บันทึก
      </div>

      {changeRows.map((r) => (
        <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ color: T.textDim }}>{r.label}</span>
          <span style={{ fontWeight: 700, color: T.text }}>{r.value}</span>
        </div>
      ))}

      <div style={{ borderTop: `1px solid ${T.border}`, margin: '10px 0 8px' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ color: T.textDim }}>เป้า kcal ใหม่</span>
        <span style={{ fontWeight: 800, fontSize: 16, color: T.coral }}>{preview.kcalTarget}</span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: preview.flooredAt ? 6 : 12 }}>
        <MacroPill label="โปรตีน" value={preview.proteinG} unit="g" color="#6EE7B7" />
        <MacroPill label="คาร์บ" value={preview.carbG} unit="g" color="#93C5FD" />
        <MacroPill label="ไขมัน" value={preview.fatG} unit="g" color="#FCA5A5" />
      </div>

      {preview.flooredAt && (
        <div style={{ fontSize: 11, color: T.textMute, marginBottom: 10 }}>
          ใช้ค่าขั้นต่ำความปลอดภัย {preview.flooredAt} kcal
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => { void handleConfirm(); }}
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
          onClick={() => setState('cancelled')}
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
          ไม่เปลี่ยน
        </button>
      </div>
    </div>
  );
}

type ChatClientProps = {
  initialMessages: UIMessage[];
  displayName: string;
  kcalGoal?: number;
  streak?: number;
  hasPlan?: boolean;
};

export function ChatClient({ initialMessages, displayName: _displayName, kcalGoal = 0, streak = 0, hasPlan = false }: ChatClientProps) {
  const router = useRouter();
  const onTab = (t: TabId) => {
    if (t === 'chat') return;
    if (t === 'today') router.push('/today');
    else if (t === 'plan') router.push('/plan');
    else router.push('/me');
  };

  const planChip = hasPlan ? '🏋️ เปลี่ยนแผนออกกำลัง' : '🏋️ สร้างแผนออกกำลัง';
  const QUICK_CHIPS = [...QUICK_CHIPS_BASE, planChip];

  const [selectedDate, setSelectedDate] = useState(todayIct);
  const isToday = selectedDate === todayIct();
  const calendarRef = useRef<HTMLInputElement>(null);

  const { data: historicalMessages, isLoading: histLoading } = useQuery({
    queryKey: queryKeys.chatMessages.byDate(selectedDate),
    queryFn: () => fetchChatByDateAction(selectedDate),
    enabled: !isToday,
    staleTime: 30_000,
  });

  const { messages, setMessages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
    messages: initialMessages,
  });

  // Sync useChat with the server when initialMessages grows (e.g. user sent a
  // message, navigated away mid-stream, server finished + revalidatePath('/chat')
  // fired, page re-rendered with the assistant turn now in DB). Only adopt
  // when not actively streaming so we don't stomp on in-flight updates.
  useEffect(() => {
    if (status === 'streaming' || status === 'submitted') return;
    if (initialMessages.length > messages.length) {
      setMessages(initialMessages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessages]);

  // When the user returns to /chat (tab focus or in-app nav), pull the latest
  // server state. Without this, an assistant turn that completed while away
  // wouldn't surface until the next manual action.
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState !== 'visible') return;
      if (status === 'streaming' || status === 'submitted') return;
      router.refresh();
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [status, router]);
  const [input, setInput] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const streaming = status === 'submitted' || status === 'streaming';
  const busy = streaming || uploading;
  const canSend = !busy && isToday && (input.trim().length > 0 || pendingFile !== null);
  const displayMessages = isToday ? messages : (historicalMessages ?? []);

  // Scroll to bottom on initial load (instant, no animation)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView();
  }, []);

  // Scroll to bottom when messages arrive or AI is responding
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    if (nearBottom) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setUploadError(null);
    e.target.value = '';
  };

  const clearFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(null);
    setPreviewUrl(null);
    setUploadError(null);
  };

  const handleChipSend = (text: string) => {
    if (busy) return;
    sendMessage({ text });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSend) return;

    if (pendingFile) {
      setUploading(true);
      setUploadError(null);
      try {
        const resized = await resizeImage(pendingFile);
        const form = new FormData();
        form.append('file', resized, 'photo.jpg');
        form.append('kind', 'food_photo');
        const res = await fetch('/api/attachments', { method: 'POST', body: form });
        if (!res.ok) {
          // Server returns { error: '...' } for known failures.
          let serverMsg = `อัปโหลดไม่สำเร็จ (${res.status})`;
          try {
            const body = (await res.json()) as { error?: string };
            if (body?.error) serverMsg = body.error;
          } catch {
            /* response wasn't JSON — keep generic msg */
          }
          throw new Error(serverMsg);
        }
        const { url } = (await res.json()) as { id: string; url: string };

        const filePart: FileUIPart = {
          type: 'file',
          filename: pendingFile.name,
          mediaType: 'image/jpeg',
          url,
        };
        sendMessage({ text: input || 'วิเคราะห์รูปนี้ให้หน่อย', files: [filePart] });
        clearFile();
        setInput('');
      } catch (err) {
        // Keep the file in preview so the user can retry without re-picking.
        const msg = err instanceof Error ? err.message : 'อัปโหลดไม่สำเร็จ';
        setUploadError(msg);
        console.error('[chat upload]', err);
      } finally {
        setUploading(false);
      }
      return;
    }

    sendMessage({ text: input });
    setInput('');
  };

  const statusText = uploading ? 'กำลังอัปโหลด…' : 'ออนไลน์ · ตอบทันที';

  return (
    <div style={{ height: '100dvh', background: T.bg, color: T.text, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <style>{`@keyframes typingDot{0%,60%,100%{opacity:.2;transform:translateY(0)}30%{opacity:1;transform:translateY(-4px)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px 12px', borderBottom: `1px solid ${T.border}`, background: T.bg, flexShrink: 0 }}>
        <CoachAvatar size={38} online thinking={streaming} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)', fontWeight: 800, fontSize: 15, color: T.text }}>
              โค้ชดี
            </span>
            <div style={{ width: 6, height: 6, borderRadius: 999, background: T.lime }} />
          </div>
          <div style={{ fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)', fontSize: 11, color: T.textDim, fontWeight: 600 }}>
            {statusText}
          </div>
        </div>
        {streak > 0 && <StreakFlame count={streak} />}
        {kcalGoal > 0 && (
          <button
            type="button"
            onClick={() => onTab('today')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 4 }}
            aria-label="ดู Today"
          >
            <KcalRing size={36} stroke={4} eaten={0} goal={kcalGoal} burned={0} animate={false} />
          </button>
        )}
      </div>

      {/* Date nav */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '6px 14px 8px',
          borderBottom: `1px solid ${T.border}`,
          flexShrink: 0,
          position: 'relative',
        }}
      >
        <button
          type="button"
          onClick={() => setSelectedDate((d) => shiftDay(d, -1))}
          aria-label="วันก่อนหน้า"
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            border: `1px solid ${T.border}`,
            background: T.bg3,
            color: T.textDim,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => {
            const el = calendarRef.current;
            if (!el) return;
            if (typeof el.showPicker === 'function') el.showPicker();
            else el.click();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            borderRadius: 10,
            border: `1px solid ${T.border}`,
            background: isToday ? T.coralBg : T.bg3,
            color: isToday ? T.coral : T.text,
            fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          {fmtDateThai(selectedDate, isToday)}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </button>
        <input
          ref={calendarRef}
          type="date"
          max={todayIct()}
          value={selectedDate}
          onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
          tabIndex={-1}
          aria-hidden
        />

        <button
          type="button"
          onClick={() => { if (!isToday) setSelectedDate((d) => shiftDay(d, 1)); }}
          disabled={isToday}
          aria-label="วันถัดไป"
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            border: `1px solid ${T.border}`,
            background: T.bg3,
            color: isToday ? T.bg4 : T.textDim,
            cursor: isToday ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Message list */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 12px 8px' }}>
        {histLoading && (
          <div style={{ color: T.textMute, fontSize: 13, textAlign: 'center', padding: 24 }}>
            กำลังโหลด…
          </div>
        )}
        {!histLoading && displayMessages.length === 0 && (
          <div style={{ color: T.textMute, fontSize: 13, textAlign: 'center', padding: 24 }}>
            {isToday
            ? 'ทักโค้ชดีได้เลย เช่น "วันนี้กินข้าวกะเพราหมูสับ" หรือ 📷 แนบรูปอาหาร/ลู่วิ่ง/ตาชั่ง'
            : 'ไม่มีบทสนทนาในวันนี้'}
          </div>
        )}
        {displayMessages.map((m) => {
          const bubbles: React.ReactNode[] = [];

          for (const p of m.parts) {
            if (p.type === 'file' && 'mediaType' in p && String(p.mediaType).startsWith('image/') && 'url' in p) {
              bubbles.push(
                <div key={`${m.id}-img-${bubbles.length}`} style={{ marginBottom: 8, display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={String(p.url)}
                    alt="รูปที่แนบ"
                    style={{ maxWidth: '65%', maxHeight: 240, borderRadius: 12, objectFit: 'cover', display: 'block' }}
                  />
                </div>
              );
            }

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
                      fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
                    }}
                  >
                    {p.text}
                  </div>
                </div>
              );
            }

            if ('state' in p && p.state === 'output-available' && 'output' in p) {
              const out = p.output as Record<string, unknown>;

              if (p.type === 'tool-log_food' && out?.type === 'food_log_confirm') {
                bubbles.push(
                  <div key={`${m.id}-card-${bubbles.length}`} style={{ marginBottom: 8, maxWidth: '90%' }}>
                    <FoodConfirmCard payload={out as unknown as FoodLogConfirmPayload} historical={!isToday} />
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
              } else if (p.type === 'tool-log_exercise' && out?.type === 'exercise_log_done') {
                bubbles.push(
                  <div key={`${m.id}-card-${bubbles.length}`} style={{ marginBottom: 8, maxWidth: '90%' }}>
                    <ExerciseLogCard payload={out as unknown as ExerciseLogDonePayload} />
                  </div>
                );
              } else if (p.type === 'tool-create_workout_plan' && out?.type === 'workout_plan_created') {
                bubbles.push(
                  <div key={`${m.id}-card-${bubbles.length}`} style={{ marginBottom: 8, maxWidth: '90%' }}>
                    <WorkoutPlanCreatedCard payload={out as unknown as WorkoutPlanCreatedPayload} />
                  </div>
                );
              } else if (p.type === 'tool-update_profile' && out?.type === 'update_profile_confirm') {
                bubbles.push(
                  <div key={`${m.id}-card-${bubbles.length}`} style={{ marginBottom: 8, maxWidth: '90%' }}>
                    <UpdateProfileConfirmCard payload={out as unknown as UpdateProfileConfirmPayload} historical={!isToday} />
                  </div>
                );
              }
            }
          }

          if (bubbles.length === 0) return null;
          return <div key={m.id} style={{ marginBottom: 4 }}>{bubbles}</div>;
        })}
        {isToday && streaming && (
          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '10px 16px', borderRadius: 16, background: T.bg3, display: 'flex', gap: 5, alignItems: 'center' }}>
              {([0, 1, 2] as const).map((i) => (
                <span
                  key={i}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: T.textMute,
                    display: 'inline-block',
                    animation: `typingDot 1.2s ${i * 0.2}s ease-in-out infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick chips — today only */}
      {isToday && (
        <div style={{ padding: '6px 12px 0', display: 'flex', gap: 6, overflowX: 'auto', flexShrink: 0 }}>
          {QUICK_CHIPS.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => handleChipSend(c)}
              disabled={busy}
              style={{
                flexShrink: 0,
                padding: '7px 12px',
                borderRadius: 999,
                background: T.bg3,
                border: `1px solid ${T.border}`,
                color: busy ? T.textMute : T.text,
                fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
                fontWeight: 700,
                fontSize: 12,
                cursor: busy ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* Image preview strip */}
      {previewUrl && (
        <div style={{ padding: '8px 12px 0', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ position: 'relative', width: 56, height: 56 }}>
            <Image src={previewUrl} alt="preview" width={56} height={56} unoptimized style={{ borderRadius: 8, objectFit: 'cover' }} />
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

      {uploadError && (
        <div
          style={{
            padding: '6px 14px',
            color: T.coral,
            fontSize: 12,
            fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
            flexShrink: 0,
          }}
          role="alert"
        >
          ⚠ {uploadError}
        </div>
      )}

      {/* Composer — today only */}
      {!isToday && (
        <div
          style={{
            padding: '10px 16px',
            paddingBottom: 'calc(76px + env(safe-area-inset-bottom, 0px))',
            borderTop: `1px solid ${T.border}`,
            background: T.bg,
            textAlign: 'center',
            fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)',
            fontSize: 12,
            color: T.textMute,
          }}
        >
          ดูย้อนหลัง · กลับวันนี้เพื่อแชท
        </div>
      )}
      {isToday && (<form
        onSubmit={(e) => { void handleSubmit(e); }}
        style={{
          padding: '8px 12px 12px',
          paddingBottom: 'calc(76px + env(safe-area-inset-bottom, 0px))',
          borderTop: `1px solid ${T.border}`,
          marginTop: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
          background: T.bg,
        }}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={pickFile}
        />

        {/* + button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          aria-label="แนบไฟล์"
          style={{
            width: 40, height: 40, borderRadius: 999, flexShrink: 0,
            background: T.bg3, border: `1px solid ${T.border}`,
            color: T.text, cursor: busy ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </button>

        {/* Text input */}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={pendingFile ? 'เพิ่มข้อความ (ไม่บังคับ)…' : 'พิมพ์อะไรก็ได้...'}
          disabled={busy}
          style={{
            flex: 1, height: 40, padding: '0 14px', borderRadius: 999,
            border: `1px solid ${T.border}`, background: T.bg3,
            color: T.text, fontFamily: 'var(--font-inter), var(--font-noto-sans-thai)', fontSize: 14,
            outline: 'none',
          }}
        />

        {/* Camera button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          aria-label="ถ่ายรูป"
          style={{
            width: 40, height: 40, borderRadius: 999, flexShrink: 0,
            background: pendingFile ? T.coral : T.bg3,
            border: `1px solid ${T.border}`,
            color: pendingFile ? '#0E0F12' : T.text,
            cursor: busy ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 3l-1.5 2H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.5L15 3H9z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </button>

        {/* Send button */}
        <button
          type="submit"
          disabled={!canSend}
          aria-label="ส่ง"
          style={{
            width: 40, height: 40, borderRadius: 999, border: 'none', flexShrink: 0,
            background: canSend ? T.coral : T.bg4,
            color: canSend ? '#0E0F12' : T.textMute,
            cursor: canSend ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {uploading ? (
            <span style={{ fontSize: 13, fontWeight: 800 }}>…</span>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 12l18-9-4 9 4 9z" />
            </svg>
          )}
        </button>
      </form>)}

      <BottomTabBar active="chat" onTab={onTab} />
    </div>
  );
}
