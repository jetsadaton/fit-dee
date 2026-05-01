'use client';

// Design canvas — all 7 screens in S26Frame side-by-side, mirroring the
// handoff bundle's Coachly.html. Used for visual review only; production
// routes render unframed under /, /onboarding, /today, etc.

import type { ReactNode } from 'react';
import { S26Frame } from '@/components/coach/s26-frame';
import { WelcomeScreen } from '@/components/screens/welcome-screen';
import { OnboardingChat } from '@/components/screens/onboarding-screen';
import { PlanPreview } from '@/components/screens/plan-preview-screen';
import { ChatScreen } from '@/components/screens/chat-screen';
import { TodayScreen } from '@/components/screens/today-screen';
import { PlanScreen } from '@/components/screens/plan-screen';
import { WorkoutRun } from '@/components/screens/workout-run-screen';

function Frame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ position: 'relative' }}>
      <span
        style={{
          position: 'absolute',
          top: -24,
          left: 0,
          fontFamily: 'Inter, sans-serif',
          fontSize: 11,
          fontWeight: 700,
          color: '#6B7080',
          letterSpacing: 1.2,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      <S26Frame>{children}</S26Frame>
    </div>
  );
}

export default function CanvasPage() {
  const noop = () => {};
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '32px 16px',
        gap: 28,
        flexWrap: 'wrap',
      }}
    >
      <Frame label="A1 · WELCOME">
        <WelcomeScreen onStart={noop} />
      </Frame>
      <Frame label="A2 · ONBOARDING (interactive)">
        <OnboardingChat onDone={noop} />
      </Frame>
      <Frame label="A3 · PLAN PREVIEW">
        <PlanPreview onStart={noop} />
      </Frame>
      <Frame label="B1 · CHAT (interactive)">
        <ChatScreen onTab={noop} activeTab="chat" />
      </Frame>
      <Frame label="C1 · TODAY (today/week/month)">
        <TodayScreen onTab={noop} activeTab="today" />
      </Frame>
      <Frame label="E1 · PLAN WEEK (editable via AI)">
        <PlanScreen onTab={noop} activeTab="plan" onStartWorkout={noop} />
      </Frame>
      <Frame label="E4 · WORKOUT RUN (interactive)">
        <WorkoutRun onExit={noop} />
      </Frame>
    </div>
  );
}
