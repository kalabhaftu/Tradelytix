'use client'

import * as React from 'react'
import { useWidgetData } from '@/hooks/use-widget-data'
import {
  DASHBOARD_DISPLAY_MODE_META,
  type DashboardDisplayMode,
  type DashboardMetricKind,
  formatDisplayValue,
  getTradeRMultipleInfo,
  inferMetricKind,
  maskSensitiveValue,
  transformDisplayValue,
} from '@/lib/dashboard/display-mode'
import { useDashboardDisplayStore } from '@/store/dashboard-display-store'

export function useDashboardDisplay() {
  const mode = useDashboardDisplayStore((state) => state.mode)
  const setMode = useDashboardDisplayStore((state) => state.setMode)
  const { data: balanceInfo } = useWidgetData('accountBalancePnl')

  const startingBalance = Number(balanceInfo?.startingBalance || 0)

  const formatValue = React.useCallback(
    (value: number, options?: Partial<{
      kind: DashboardMetricKind
      precision: number
      compact: boolean
      sensitive: boolean
      rValue: number | null
      basis: number
      emptyLabel: string
    }>) =>
      formatDisplayValue({
        value,
        mode,
        basis: options?.basis ?? startingBalance,
        kind: options?.kind ?? 'money',
        precision: options?.precision ?? 2,
        compact: options?.compact ?? false,
        sensitive: options?.sensitive ?? true,
        rValue: options?.rValue ?? null,
        emptyLabel: options?.emptyLabel ?? '--',
      }),
    [mode, startingBalance]
  )

  const transformValue = React.useCallback(
    (value: number, options?: Partial<{
      kind: DashboardMetricKind
      basis: number
      rValue: number | null
    }>) =>
      transformDisplayValue({
        value,
        mode,
        basis: options?.basis ?? startingBalance,
        kind: options?.kind ?? 'money',
        rValue: options?.rValue ?? null,
      }),
    [mode, startingBalance]
  )

  return {
    mode,
    setMode,
    startingBalance,
    isPrivacyMode: mode === 'privacy',
    formatValue,
    transformValue,
    inferMetricKind,
    getTradeRMultipleInfo,
    meta: DASHBOARD_DISPLAY_MODE_META[mode],
    allModes: DASHBOARD_DISPLAY_MODE_META,
    maskSensitiveValue,
  }
}
