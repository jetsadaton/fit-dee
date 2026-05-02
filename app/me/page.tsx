// Server Component — gates /me with auth + profile, passes data to MeClient.

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { findByUserId as findProfile } from '@/lib/db/repositories/profiles';
import { MeClient } from './me-client';

const GOAL_LABEL: Record<string, string> = {
  lose: 'ลดน้ำหนัก',
  gain: 'เพิ่มกล้ามเนื้อ',
  fit: 'ฟิตเฟิร์ม',
};

const ACTIVITY_LABEL: Record<string, string> = {
  sit: 'นั่งทำงานส่วนใหญ่',
  walk: 'เดินบ้างในชีวิตประจำวัน',
  move: 'ออกกำลังกายบ้าง',
  active: 'ออกกำลังกายสม่ำเสมอ',
};

const EQUIPMENT_LABEL: Record<string, string> = {
  gym: 'ยิม',
  home_eq: 'อุปกรณ์ที่บ้าน',
  home: 'Bodyweight',
};

const SEX_LABEL: Record<string, string> = {
  m: 'ชาย',
  f: 'หญิง',
  o: 'ไม่ระบุ',
};

export default async function MePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/');

  const profile = await findProfile(session.user.id);
  if (!profile?.kcalTarget) redirect('/onboarding');

  return (
    <MeClient
      displayName={profile.displayName}
      goal={profile.goal}
      goalLabel={GOAL_LABEL[profile.goal] ?? profile.goal}
      sex={SEX_LABEL[profile.sex] ?? profile.sex}
      age={profile.age}
      heightCm={profile.heightCm}
      weightKgInitial={String(profile.weightKgInitial)}
      targetWeightKg={String(profile.targetWeightKg)}
      kcalTarget={profile.kcalTarget}
      proteinGTarget={profile.proteinGTarget ?? null}
      carbGTarget={profile.carbGTarget ?? null}
      fatGTarget={profile.fatGTarget ?? null}
      activityLabel={ACTIVITY_LABEL[profile.activityLevel] ?? profile.activityLevel}
      equipmentLabel={EQUIPMENT_LABEL[profile.equipment] ?? profile.equipment}
      daysPerWeek={profile.daysPerWeek}
    />
  );
}
