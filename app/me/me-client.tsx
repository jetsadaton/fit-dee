'use client';

import { useRouter } from 'next/navigation';
import { BottomTabBar, type TabId } from '@/components/coach/primitives';
import { T } from '@/lib/design/tokens';
import { signOutAction } from './actions';

type MeClientProps = {
  displayName: string;
  goal: string;
  goalLabel: string;
  sex: string;
  age: number;
  heightCm: number;
  weightKgInitial: string;
  targetWeightKg: string;
  kcalTarget: number | null;
  proteinGTarget: number | null;
  carbGTarget: number | null;
  fatGTarget: number | null;
  activityLabel: string;
  equipmentLabel: string;
  daysPerWeek: number;
};

const GOAL_COLOR: Record<string, string> = {
  lose: T.coral,
  gain: T.lime,
  fit: '#7FB8FF',
};

const MACRO_COLOR = {
  protein: '#FF8585',
  carb: '#FFCB66',
  fat: '#7FB8FF',
};

function MacroRow({ label, value, unit, color, max }: { label: string; value: number | null; unit: string; color: string; max: number }) {
  const pct = value && max ? Math.min(1, value / max) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 12 }}>
        <span style={{ color: T.textDim }}>{label}</span>
        <span style={{ color: T.text, fontWeight: 700 }}>{value ?? '–'} {unit}</span>
      </div>
      <div style={{ height: 6, borderRadius: 999, background: T.bg4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct * 100}%`, background: color, borderRadius: 999, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: 1, background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 12, padding: '10px 12px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 18, color: T.text }}>{value}</div>
      <div style={{ fontFamily: 'Inter,"Noto Sans Thai"', fontSize: 11, color: T.textDim, marginTop: 2 }}>{label}</div>
    </div>
  );
}

export function MeClient(props: MeClientProps) {
  const router = useRouter();
  const onTab = (t: TabId) => {
    if (t === 'me') return;
    if (t === 'chat') router.push('/chat');
    else if (t === 'today') router.push('/today');
    else router.push('/plan');
  };

  const initials = props.displayName.slice(0, 2).toUpperCase();
  const goalColor = GOAL_COLOR[props.goal] ?? T.textDim;
  const maxMacro = Math.max(props.proteinGTarget ?? 0, props.carbGTarget ?? 0, props.fatGTarget ?? 0, 1);

  return (
    <div style={{ minHeight: '100dvh', background: T.bg, color: T.text, display: 'flex', flexDirection: 'column', fontFamily: 'Inter,"Noto Sans Thai"' }}>

      {/* Header */}
      <div style={{ padding: '24px 20px 16px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: `linear-gradient(135deg, ${T.coral}, #FF9266)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 20, color: '#0E0F12', flexShrink: 0,
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: T.text }}>{props.displayName}</div>
            <div style={{
              display: 'inline-block', marginTop: 4,
              padding: '3px 10px', borderRadius: 999,
              background: `${goalColor}22`, border: `1px solid ${goalColor}55`,
              fontSize: 12, fontWeight: 700, color: goalColor,
            }}>
              {props.goalLabel}
            </div>
          </div>
        </div>
      </div>

      {/* Body — scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>

        {/* Kcal target */}
        {props.kcalTarget && (
          <div style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 16, padding: '16px', marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 }}>เป้าหมายแคลอรี่วันนี้</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 16 }}>
              <span style={{ fontWeight: 900, fontSize: 40, color: T.lime, letterSpacing: -1 }}>{props.kcalTarget.toLocaleString()}</span>
              <span style={{ fontSize: 14, color: T.textDim }}>kcal</span>
            </div>
            <MacroRow label="โปรตีน" value={props.proteinGTarget} unit="g" color={MACRO_COLOR.protein} max={maxMacro} />
            <MacroRow label="คาร์บ" value={props.carbGTarget} unit="g" color={MACRO_COLOR.carb} max={maxMacro} />
            <MacroRow label="ไขมัน" value={props.fatGTarget} unit="g" color={MACRO_COLOR.fat} max={maxMacro} />
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <StatCard label="อายุ" value={`${props.age} ปี`} />
          <StatCard label="ส่วนสูง" value={`${props.heightCm} ซม.`} />
          <StatCard label="น้ำหนักเริ่ม" value={`${props.weightKgInitial} กก.`} />
          <StatCard label="เป้าหมาย" value={`${props.targetWeightKg} กก.`} />
        </div>

        {/* Details */}
        <div style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
          {[
            { label: 'กิจกรรมในชีวิตประจำวัน', value: props.activityLabel },
            { label: 'อุปกรณ์ออกกำลังกาย', value: props.equipmentLabel },
            { label: 'วันออกกำลังกาย/สัปดาห์', value: `${props.daysPerWeek} วัน` },
            { label: 'เพศ', value: props.sex },
          ].map((row, i, arr) => (
            <div key={row.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '13px 16px',
              borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : 'none',
            }}>
              <span style={{ fontSize: 13, color: T.textDim }}>{row.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Sign out */}
        <form action={signOutAction}>
          <button
            type="submit"
            style={{
              width: '100%', padding: '14px', borderRadius: 999,
              border: `1px solid ${T.border}`, background: 'transparent',
              color: T.textDim, fontFamily: 'Inter,"Noto Sans Thai"',
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}
          >
            ออกจากระบบ
          </button>
        </form>
      </div>

      <BottomTabBar active="me" onTab={onTab} />
    </div>
  );
}
