'use client'

import dyn from 'next/dynamic';
import { Suspense } from 'react';

const CommandPalette = dyn(() => import('@/components/command-palette').then(m => m.CommandPalette), { ssr: false });
const KeyboardShortcutsModal = dyn(() => import('@/components/ui/keyboard-shortcuts-modal').then(m => m.KeyboardShortcutsModal), { ssr: false });
const TourTooltip = dyn(() => import('@/components/tour/tour-tooltip').then(m => m.TourTooltip), { ssr: false });
const ResumeWidget = dyn(() => import('@/components/tour/resume-widget').then(m => m.ResumeWidget), { ssr: false });
const GlobalTradeController = dyn(() => import('./global-trade-controller').then(m => m.GlobalTradeController), { ssr: false });
const WeeklyReviewTrigger = dyn(() => import('@/components/weekly-review-trigger').then(m => m.WeeklyReviewTrigger), { ssr: false });

export function ClientDynamicComponents() {
  return (
    <>
      <CommandPalette />
      <KeyboardShortcutsModal />
      <Suspense fallback={null}>
        <GlobalTradeController />
      </Suspense>
      <WeeklyReviewTrigger />
      <TourTooltip />
      <ResumeWidget />
    </>
  );
}
