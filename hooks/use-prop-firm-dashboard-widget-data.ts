"use client"

import { useEffect, useMemo } from 'react'
import { create } from 'zustand'
import { useDashboardPropFirmAccount } from './use-dashboard-prop-firm-account'
import {
  buildPropFirmAccountExtremes,
  buildPropFirmDailyDrawdown,
  buildPropFirmGrowth,
  buildPropFirmTodayStats,
  getPropFirmTradeTimestamp,
} from '@/lib/prop-firm/widget-metrics'

type PropFirmTrade = {
  id: string
  pnl?: number | string | null
  commission?: number | string | null
  netPnL?: number | string | null
  instrument?: string | null
  symbol?: string | null
  side?: string | null
  entryDate?: string | Date | null
  closeDate?: string | Date | null
  entryTime?: string | Date | null
  exitTime?: string | Date | null
}

export type PropFirmWidgetData = {
  account: any | null
  drawdown: any | null
  statistics: any | null
  trades: PropFirmTrade[]
  todayStats: {
    pnl: number
    trades: number
    wins: number
    losses: number
    breakeven: number
    winRate: number
    bestTrade: number
    worstTrade: number
    averageTrade: number
  }
  accountExtremes: {
    bestTrade: number
    worstTrade: number
    averageTrade: number
  }
  dailyDrawdown: {
    dailyStartBalance: number
    dailyDrawdownUsed: number
    dailyDrawdownRemaining: number
    dailyLossFloor: number
    dailyLimit: number
  }
  resetTimezone: string
  groupedTradeCount: number
  growth: Array<{
    label: string
    timestamp: number
    balance: number
    pnl: number
    tradePnl: number
  }>
  peakEquity: number
  maxDrawdown: number
  tradingDays: number
}

interface PropFirmCacheEntry {
  accountPayload: any | null
  trades: PropFirmTrade[]
  isLoading: boolean
  error: string | null
  promise?: Promise<void> | null
}

interface PropFirmStore {
  cache: Record<string, PropFirmCacheEntry>
  fetchData: (id: string) => Promise<void>
  clearCache: () => void
}

export const usePropFirmStore = create<PropFirmStore>((set, get) => ({
  cache: {},
  clearCache: () => set({ cache: {} }),
  fetchData: async (id: string) => {
    const entry = get().cache[id]
    if (entry && (entry.isLoading || entry.promise || entry.accountPayload)) {
      if (entry.promise) {
        await entry.promise
      }
      return
    }

    let resolvePromise: () => void = () => {}
    const promise = new Promise<void>((resolve) => {
      resolvePromise = resolve
    })

    set((state) => ({
      cache: {
        ...state.cache,
        [id]: {
          accountPayload: null,
          trades: [],
          isLoading: true,
          error: null,
          promise,
        },
      },
    }))

    try {
      const [accountResponse, tradesResponse] = await Promise.all([
        fetch(`/api/v1/prop-firm/accounts/${id}`),
        fetch(`/api/v1/prop-firm/accounts/${id}/trades?phase=current`),
      ])
      const [accountJson, tradesJson] = await Promise.all([accountResponse.json(), tradesResponse.json()])
      if (!accountResponse.ok || !accountJson.success) throw new Error(accountJson.error || 'Failed to load prop firm account')
      if (!tradesResponse.ok || !tradesJson.success) throw new Error(tradesJson.error || 'Failed to load prop firm trades')

      set((state) => ({
        cache: {
          ...state.cache,
          [id]: {
            accountPayload: accountJson.data,
            trades: Array.isArray(tradesJson.data?.trades) ? tradesJson.data.trades : [],
            isLoading: false,
            error: null,
            promise: null,
          },
        },
      }))
    } catch (err) {
      set((state) => ({
        cache: {
          ...state.cache,
          [id]: {
            accountPayload: null,
            trades: [],
            isLoading: false,
            error: err instanceof Error ? err.message : 'Failed to load prop firm widget data',
            promise: null,
          },
        },
      }))
    } finally {
      resolvePromise()
    }
  },
}))

export function usePropFirmDashboardWidgetData() {
  const selection = useDashboardPropFirmAccount()
  const id = selection.selectedMasterAccountId

  const cacheEntry = usePropFirmStore((state) => state.cache[id || ''])
  const fetchData = usePropFirmStore((state) => state.fetchData)

  useEffect(() => {
    if (id) {
      fetchData(id)
    }
  }, [id, fetchData])

  const accountPayload = cacheEntry?.accountPayload ?? null
  const trades = cacheEntry?.trades ?? []
  const isDataLoading = id ? (!cacheEntry || cacheEntry.isLoading) : false
  const dataError = cacheEntry?.error ?? null

  const computed = useMemo(() => {
    const account = accountPayload?.account ?? null
    const resetTimezone = selection.resetTimezone || 'UTC'

    // Sort trades to find the last trade's timestamp
    const sortedTrades = [...trades].sort((a, b) => {
      const timeA = getPropFirmTradeTimestamp(a)?.getTime() || 0
      const timeB = getPropFirmTradeTimestamp(b)?.getTime() || 0
      return timeA - timeB
    })
    const lastTrade = sortedTrades[sortedTrades.length - 1]
    const lastTradeTime = lastTrade ? getPropFirmTradeTimestamp(lastTrade) : null

    // Check if the account or current phase is failed/passed/blown/ended
    const currentPhase = account?.currentPhase || {}
    const isMasterFailed = String(account?.status || '').toLowerCase() === 'failed'
    const isPhaseFinished = String(currentPhase?.status || '').toLowerCase() !== 'active'
    const isFinished = isMasterFailed || isPhaseFinished

    const referenceDate = isFinished && lastTradeTime ? lastTradeTime : new Date()

    const growthResult = buildPropFirmGrowth(account, trades, resetTimezone)
    return {
      account,
      drawdown: accountPayload?.drawdown ?? null,
      statistics: accountPayload?.statistics ?? null,
      trades,
      accountExtremes: buildPropFirmAccountExtremes(trades),
      dailyDrawdown: buildPropFirmDailyDrawdown(account, trades, resetTimezone, referenceDate, accountPayload?.drawdown),
      resetTimezone,
      groupedTradeCount: trades.length,
      todayStats: buildPropFirmTodayStats(trades, resetTimezone, referenceDate),
      growth: growthResult.points,
      peakEquity: growthResult.peakEquity,
      maxDrawdown: growthResult.maxDrawdown,
      tradingDays: growthResult.tradingDays,
    } satisfies PropFirmWidgetData
  }, [accountPayload, trades, selection.resetTimezone])

  return {
    ...selection,
    data: computed,
    isLoading: selection.isLoading || isDataLoading,
    error: selection.error || dataError,
  }
}
