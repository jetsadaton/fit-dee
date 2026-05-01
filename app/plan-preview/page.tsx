'use client';

import { useRouter } from 'next/navigation';
import { PlanPreview } from '@/components/screens/plan-preview-screen';

export default function PlanPreviewPage() {
  const router = useRouter();
  return <PlanPreview onStart={() => router.push('/today')} />;
}
