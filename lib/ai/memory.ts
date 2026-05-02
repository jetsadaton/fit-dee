// Memory blocks builder — assembles the three persistent blocks injected
// into every Coachly system prompt:
//   profile_block — frozen TDEE / macros line derived from user_profiles
//   summary_7d    — rolling 7-day summary (Inngest writes this; Phase 3)
//   notes         — user-pinned notes ('แพ้ถั่ว', 'ออกตอนเช้า')
//
// PRIVACY contract (rules/backend.md): only numeric fields + sex/goal
// enums + injuries strings ever leave this file. Email, line_sub,
// google_sub, real names — NEVER touched. The display_name is allowed
// because Coachly already uses it user-facing in chat ("โค้ชดีเรียก โบ้ ว่า…")
// and the user supplied it themselves at onboarding.

import { findByUserId as findProfile } from '@/lib/db/repositories/profiles';
import { findByUserId as findMemory } from '@/lib/db/repositories/memory-blocks';
import type { MemoryBlock } from '@/lib/types/db/chat';
import type { UserProfile } from '@/lib/types/db/users';

export type MemoryContext = {
  /** Frozen TDEE / macros line. Always present (computed at onboarding). */
  profileBlock: string;
  /** Rolling 7-day summary. Empty until Inngest first runs. */
  summary7d: string;
  /** User-pinned notes (allergies, schedule preferences). */
  notes: string;
};

const EMPTY: MemoryContext = {
  profileBlock: '(ผู้ใช้ยังไม่ได้กรอกข้อมูล onboarding)',
  summary7d: '',
  notes: '',
};

/** Fetch all three blocks in one round-trip-friendly call. */
export async function loadMemoryContext(userId: string): Promise<MemoryContext> {
  const [profile, memory] = await Promise.all([findProfile(userId), findMemory(userId)]);
  if (!profile) return EMPTY;

  return {
    profileBlock: buildProfileBlock(profile),
    summary7d: memory?.summary7d ?? '',
    notes: memory?.notes ?? '',
  };
}

// ─── profile block formatting ────────────────────────────────────────

const GOAL_LABEL: Record<string, string> = {
  lose: 'ลดน้ำหนัก',
  gain: 'เพิ่มกล้าม',
  fit: 'รักษาฟิต',
};

const ACTIVITY_LABEL: Record<string, string> = {
  sit: 'นั่งทำงาน ไม่ค่อยขยับ',
  walk: 'เดินบ่อย / ออก 1-3 วัน/สัปดาห์',
  move: 'ขยับเยอะ / ออก 3-5 วัน/สัปดาห์',
  active: 'ออกประจำ / 6-7 วันหรืองานใช้แรง',
};

const EQUIPMENT_LABEL: Record<string, string> = {
  gym: 'ฟิตเนส (อุปกรณ์ครบ)',
  home_eq: 'บ้านมีอุปกรณ์ (ดัมเบล/ยางยืด)',
  home: 'บ้าน ไม่มีอุปกรณ์ (ใช้น้ำหนักตัว)',
};

const SEX_LABEL: Record<string, string> = { m: 'ชาย', f: 'หญิง', o: 'อื่นๆ' };

/** Build the profile block — numeric + enum only, no PII. */
export function buildProfileBlock(p: UserProfile): string {
  const goal = GOAL_LABEL[p.goal] ?? p.goal;
  const activity = ACTIVITY_LABEL[p.activityLevel] ?? p.activityLevel;
  const equipment = EQUIPMENT_LABEL[p.equipment] ?? p.equipment;
  const sex = SEX_LABEL[p.sex] ?? p.sex;
  const injuries = p.injuries.length > 0 ? p.injuries.join(', ') : 'ไม่มี';

  // Numeric columns return as strings from Drizzle's numeric type — coerce.
  const weightKg = Number(p.weightKgInitial);
  const targetKg = Number(p.targetWeightKg);

  return [
    `ชื่อเล่น: ${p.displayName}`,
    `เพศ: ${sex} · อายุ: ${p.age} · ส่วนสูง: ${p.heightCm} cm · น้ำหนักเริ่มต้น: ${weightKg.toFixed(1)} kg → เป้า ${targetKg.toFixed(1)} kg`,
    `เป้าหมาย: ${goal} · กิจกรรมประจำวัน: ${activity} · ออกกำลัง ${p.daysPerWeek} วัน/สัปดาห์ · อุปกรณ์: ${equipment}`,
    `อาการบาดเจ็บ/ข้อจำกัด: ${injuries}`,
    `เป้าโภชนาการ/วัน: ${p.kcalTarget ?? '?'} kcal · โปรตีน ${p.proteinGTarget ?? '?'} g · คาร์บ ${p.carbGTarget ?? '?'} g · ไขมัน ${p.fatGTarget ?? '?'} g`,
  ].join('\n');
}

/** Format the full memory section ready for prompt injection. */
export function formatMemorySection(ctx: MemoryContext): string {
  const sections: string[] = [];
  sections.push(`<USER_PROFILE>\n${ctx.profileBlock}\n</USER_PROFILE>`);
  if (ctx.summary7d.trim()) sections.push(`<RECENT_7_DAYS>\n${ctx.summary7d}\n</RECENT_7_DAYS>`);
  if (ctx.notes.trim()) sections.push(`<USER_NOTES>\n${ctx.notes}\n</USER_NOTES>`);
  return sections.join('\n\n');
}

/** Mirror of the MemoryBlock row shape, useful when callers want to persist. */
export function toMemoryBlockRow(
  userId: string,
  ctx: MemoryContext,
): Pick<MemoryBlock, 'userId' | 'profileBlock' | 'summary7d' | 'notes'> {
  return { userId, profileBlock: ctx.profileBlock, summary7d: ctx.summary7d, notes: ctx.notes };
}
