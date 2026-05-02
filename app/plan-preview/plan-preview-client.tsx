'use client';

import { useRouter } from 'next/navigation';
import { PlanPreview, type PlanPreviewProps } from '@/components/screens/plan-preview-screen';

export function PlanPreviewClient(props: Omit<PlanPreviewProps, 'onStart'>) {
  const router = useRouter();
  return <PlanPreview {...props} onStart={() => router.push('/today')} />;
}
