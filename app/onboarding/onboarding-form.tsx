'use client';

// Client wrapper for the onboarding screen.
// Threads the Server Action through the screen's `onComplete` prop and
// handles post-success navigation. Equipment id mapping (kebab → snake_case)
// happens here at the client/server boundary.

import { useRouter } from 'next/navigation';
import { OnboardingChat, type OnboardingFormData } from '@/components/screens/onboarding-screen';
import { completeOnboardingAction } from './actions';

const EQUIPMENT_TO_SCHEMA: Record<OnboardingFormData['equipment'], 'gym' | 'home_eq' | 'home'> = {
  gym: 'gym',
  'home-eq': 'home_eq',
  home: 'home',
};

export function OnboardingForm() {
  const router = useRouter();

  const handleComplete = async (data: OnboardingFormData): Promise<string | null> => {
    const result = await completeOnboardingAction({
      displayName: data.displayName,
      sex: data.sex,
      age: data.age,
      heightCm: data.heightCm,
      weightKgInitial: data.weightKg,
      targetWeightKg: data.targetWeightKg,
      goal: data.goal,
      daysPerWeek: data.daysPerWeek,
      activityLevel: data.activityLevel,
      equipment: EQUIPMENT_TO_SCHEMA[data.equipment],
      injuries: data.injuries,
    });
    if (!result.ok) {
      // Surface a Thai message — service-layer English errors are not user-facing.
      switch (result.error) {
        case 'unauthorized':
          return 'ต้องเข้าสู่ระบบก่อนนะ';
        case 'validation':
          return result.message ?? 'ข้อมูลยังไม่ถูกต้อง ลองตรวจอีกครั้งนะ';
        case 'infeasible-plan':
          return result.message ?? 'เป้าหมายแคลฯ ต่ำเกินไป ลองปรับเป้าหมายดูนะ';
        default:
          return 'เกิดข้อผิดพลาด ลองอีกครั้งนะ';
      }
    }
    return null;
  };

  return <OnboardingChat onDone={() => router.push('/plan-preview')} onComplete={handleComplete} />;
}
