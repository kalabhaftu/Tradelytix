"use client"

import { ReactNode } from 'react'
import { WidgetCard } from '../widget-card'
import { PropFirmWidgetAccountSelector, PropFirmWidgetTimezoneSelector } from './prop-firm-widget-account-selector'
import { usePropFirmDashboardWidgetData } from '@/hooks/use-prop-firm-dashboard-widget-data'

type Props = {
  title: string
  children: (state: ReturnType<typeof usePropFirmDashboardWidgetData>) => ReactNode
}

export function PropFirmWidgetShell({ title, children }: Props) {
  const state = usePropFirmDashboardWidgetData()
  const { accounts, selectedMasterAccountId, setSelectedMasterAccountId, resetTimezone, setResetTimezone, isLoading, error, data } = state

  return (
    <WidgetCard
      title={title}
      headerRight={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <PropFirmWidgetTimezoneSelector value={resetTimezone} onChange={setResetTimezone} />
          <PropFirmWidgetAccountSelector
            accounts={accounts}
            selectedMasterAccountId={selectedMasterAccountId}
            onChange={setSelectedMasterAccountId}
            isLoading={isLoading && accounts.length === 0}
          />
        </div>
      }
    >
      {error ? (
        <div className="flex h-full items-center justify-center rounded-xl border border-border/30 bg-muted/10 p-6 text-center text-sm text-muted-foreground">
          {error}
        </div>
      ) : accounts.length === 0 && !isLoading ? (
        <div className="flex h-full items-center justify-center rounded-xl border border-border/30 bg-muted/10 p-6 text-center text-sm text-muted-foreground">
          Create a prop-firm account to use this widget.
        </div>
      ) : !data.account && !isLoading ? (
        <div className="flex h-full items-center justify-center rounded-xl border border-border/30 bg-muted/10 p-6 text-center text-sm text-muted-foreground">
          Select a prop-firm challenge to view this widget.
        </div>
      ) : isLoading ? (
        <div className="grid h-full gap-3 md:grid-cols-3">
          <div className="animate-pulse rounded-xl bg-muted/25" />
          <div className="animate-pulse rounded-xl bg-muted/25" />
          <div className="animate-pulse rounded-xl bg-muted/25" />
        </div>
      ) : data.account?.currentPhase ? (
        children(state)
      ) : (
        <div className="flex h-full items-center justify-center rounded-xl border border-border/30 bg-muted/10 p-6 text-center text-sm text-muted-foreground">
          This prop-firm account has no current challenge phase configured.
        </div>
      )}
    </WidgetCard>
  )
}
