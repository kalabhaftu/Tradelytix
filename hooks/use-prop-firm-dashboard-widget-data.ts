"use client"

import { useEffect, useMemo, useState } from 'react'
import { getNewYorkDateKey } from '@/lib/time-utils'
import { getTradeNetPnl } from '@/lib/metrics/pnl'
import { classifyOutcome } from '@/lib/metrics/outcome'
import { useDashboardPropFirmAccount } from './use-dashboard-prop-firm-account'

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
  growth: Array<{
    label: string
    timestamp: number
    balance: number
    pnl: number
  }>
  peakEquity: number
  maxDrawdown: number
  tradingDays: number
}

function getTradeTimestamp(trade: PropFirmTrade) {
  const value = trade.exitTime || trade.closeDate || trade.entryTime || trade.entryDate
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime()) ? date : null
}

function getNetPnl(trade: PropFirmTrade) {
  if (trade.netPnL != null) return Number(trade.netPnL) || 0
  return getTradeNetPnl(trade as any)
}

function buildTodayStats(trades: PropFirmTrade[]) {
  const todayKey = getNewYorkDateKey(new Date())
  const todayTrades = trades.filter((trade) => {
    const timestamp = getTradeTimestamp(trade)
    return timestamp ? getNewYorkDateKey(timestamp) === todayKey : false
  })
  const pnls = todayTrades.map(getNetPnl)
  const wins = pnls.filter((pnl) => classifyOutcome(pnl, 0) === 'win').length
  const losses = pnls.filter((pnl) => classifyOutcome(pnl, 0) === 'loss').length
  const breakeven = Math.max(0, todayTrades.length - wins - losses)
  const pnl = pnls.reduce((sum, value) => sum + value, 0)

  return {
    pnl,
    trades: todayTrades.length,
    wins,
    losses,
    breakeven,
    winRate: wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0,
    bestTrade: pnls.length ? Math.max(...pnls) : 0,
    worstTrade: pnls.length ? Math.min(...pnls) : 0,
    averageTrade: pnls.length ? pnl / pnls.length : 0,
  }
}

function buildGrowth(account: any, trades: PropFirmTrade[]) {
  const accountSize = Number(account?.accountSize || 0)
  let runningPnl = 0
  let peakEquity = accountSize
  let maxDrawdown = 0
  const dayKeys = new Set<string>()

  const points = [...trades]
    .sort((a, b) => (getTradeTimestamp(a)?.getTime() || 0) - (getTradeTimestamp(b)?.getTime() || 0))
    .map((trade, index) => {
      const timestamp = getTradeTimestamp(trade) || new Date()
      dayKeys.add(getNewYorkDateKey(timestamp))
      runningPnl += getNetPnl(trade)
      const balance = accountSize + runningPnl
      peakEquity = Math.max(peakEquity, balance)
      maxDrawdown = Math.max(maxDrawdown, peakEquity - balance)
      return {
        label: `${index + 1}`,
        timestamp: timestamp.getTime(),
        balance,
        pnl: runningPnl,
      }
    })

  return { points, peakEquity, maxDrawdown, tradingDays: dayKeys.size }
}

export function usePropFirmDashboardWidgetData() {
  const selection = useDashboardPropFirmAccount()
  const [accountPayload, setAccountPayload] = useState<any | null>(null)
  const [trades, setTrades] = useState<PropFirmTrade[]>([])
  const [isDataLoading, setIsDataLoading] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const id = selection.selectedMasterAccountId
    if (!id) {
      setAccountPayload(null)
      setTrades([])
      return
    }

    async function loadData() {
      setIsDataLoading(true)
      setDataError(null)
      try {
        const [accountResponse, tradesResponse] = await Promise.all([
          fetch(`/api/v1/prop-firm/accounts/${id}`),
          fetch(`/api/v1/prop-firm/accounts/${id}/trades?phase=current`),
        ])
        const [accountJson, tradesJson] = await Promise.all([accountResponse.json(), tradesResponse.json()])
        if (!accountResponse.ok || !accountJson.success) throw new Error(accountJson.error || 'Failed to load prop firm account')
        if (!tradesResponse.ok || !tradesJson.success) throw new Error(tradesJson.error || 'Failed to load prop firm trades')
        if (cancelled) return
        setAccountPayload(accountJson.data)
        setTrades(Array.isArray(tradesJson.data?.trades) ? tradesJson.data.trades : [])
      } catch (err) {
        if (!cancelled) setDataError(err instanceof Error ? err.message : 'Failed to load prop firm widget data')
      } finally {
        if (!cancelled) setIsDataLoading(false)
      }
    }

    loadData()
    return () => { cancelled = true }
  }, [selection.selectedMasterAccountId])

  const computed = useMemo(() => {
    const account = accountPayload?.account ?? null
    const growthResult = buildGrowth(account, trades)
    return {
      account,
      drawdown: accountPayload?.drawdown ?? null,
      statistics: accountPayload?.statistics ?? null,
      trades,
      todayStats: buildTodayStats(trades),
      growth: growthResult.points,
      peakEquity: growthResult.peakEquity,
      maxDrawdown: growthResult.maxDrawdown,
      tradingDays: growthResult.tradingDays,
    } satisfies PropFirmWidgetData
  }, [accountPayload, trades])

  return {
    ...selection,
    data: computed,
    isLoading: selection.isLoading || isDataLoading,
    error: selection.error || dataError,
  }
}
