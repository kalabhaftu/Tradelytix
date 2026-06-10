/**
 * React Query hook for server-filtered trades
 * 
 * Replaces the `formattedTrades` useMemo + `statistics` useMemo + 
 * `calendarData` useMemo in DataProvider with a single server call.
 * 
 * All 7 filters applied server-side via /api/v1/trades
 */

'use client'

import { useQuery } from '@tanstack/react-query'

export interface TradeFilters {
  accounts?: string[]
  dateFrom?: string
  dateTo?: string
  instruments?: string[]
  pnlMin?: number
  pnlMax?: number
  timeRange?: string | null
  weekday?: number | null
  hour?: number | null
  limit?: number
  pageLimit?: number
  pageOffset?: number
  includeStats?: boolean
  includeCalendar?: boolean
  timezone?: string
}

export interface FilteredTradesResponse {
  trades: any[]
  total: number
  page?: { limit: number; offset: number } | null
  statistics: any | null
  calendarData: any | null
  widgets: Record<string, any> | null
}

function buildQueryString(filters: TradeFilters): string {
  const params = new URLSearchParams()
  
  if (filters.accounts?.length) params.set('accounts', filters.accounts.join(','))
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.set('dateTo', filters.dateTo)
  if (filters.instruments?.length) params.set('instruments', filters.instruments.join(','))
  if (filters.pnlMin !== undefined) params.set('pnlMin', String(filters.pnlMin))
  if (filters.pnlMax !== undefined) params.set('pnlMax', String(filters.pnlMax))
  if (filters.timeRange) params.set('timeRange', filters.timeRange)
  if (filters.weekday !== null && filters.weekday !== undefined) params.set('weekday', String(filters.weekday))
  if (filters.hour !== null && filters.hour !== undefined) params.set('hour', String(filters.hour))
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.pageLimit !== undefined && filters.pageLimit !== null) params.set('pageLimit', String(filters.pageLimit))
  if (filters.pageOffset !== undefined && filters.pageOffset !== null) params.set('pageOffset', String(filters.pageOffset))
  if (filters.includeStats === false) params.set('includeStats', 'false')
  if (filters.includeCalendar === false) params.set('includeCalendar', 'false')
  if (filters.timezone) params.set('timezone', filters.timezone)
  
  return params.toString()
}

export function useFilteredTrades(filters: TradeFilters, enabled = true, isDemoMode = false) {
  const queryString = buildQueryString(filters)
  
  return useQuery<FilteredTradesResponse>({
    // IMPORTANT: use stable key (string), not object reference
    queryKey: ['v1', 'trades', queryString, isDemoMode],
    queryFn: async () => {
      if (isDemoMode) {
        // Return dummy response
        return getMockDemoData();
      }
      const res = await fetch(`/api/v1/trades?${queryString}`)
      if (!res.ok) throw new Error('Failed to fetch trades')
      return res.json()
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 min — realtime subscriptions handle live updates
    gcTime: 5 * 60 * 1000,
  })
}

function getMockDemoData(): FilteredTradesResponse {
  const now = new Date()
  const trades = Array.from({ length: 50 }).map((_, i) => {
    const isWin = Math.random() > 0.4
    const pnl = isWin ? 150 + Math.random() * 350 : -100 - Math.random() * 200
    const durationMin = 10 + Math.random() * 50
    return {
      id: `demo-trade-${i}`,
      accountNumber: 'DEMO-123',
      instrument: ['EURUSD', 'NQ100', 'XAUUSD'][Math.floor(Math.random() * 3)],
      side: Math.random() > 0.5 ? 'Buy' : 'Sell',
      pnl,
      volume: 1,
      entryDate: new Date(now.getTime() - i * 86400000).toISOString(),
      closeDate: new Date(now.getTime() - i * 86400000 + durationMin * 60000).toISOString(),
      status: 'Closed',
      duration: durationMin * 60,
      fees: 2.5,
      commissions: 1.5,
      netPnl: pnl - 4,
      drawdown: isWin ? 0 : Math.abs(pnl) / 100000 * 100,
      tags: []
    }
  })

  const wins = trades.filter(t => t.pnl > 0)
  const losses = trades.filter(t => t.pnl <= 0)
  const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0)
  
  const stats = {
    nbTrades: trades.length,
    nbWin: wins.length,
    nbLoss: losses.length,
    nbBe: 0,
    winRate: wins.length / trades.length * 100,
    cumulativePnl: totalPnl,
    grossWin: wins.reduce((sum, t) => sum + t.pnl, 0),
    grossLosses: losses.reduce((sum, t) => sum + Math.abs(t.pnl), 0),
    biggestWin: Math.max(...wins.map(t => t.pnl)),
    biggestLoss: Math.max(...losses.map(t => Math.abs(t.pnl))),
    averageWin: wins.reduce((sum, t) => sum + t.pnl, 0) / wins.length,
    averageLoss: losses.reduce((sum, t) => sum + Math.abs(t.pnl), 0) / losses.length,
    profitFactor: wins.reduce((sum, t) => sum + t.pnl, 0) / (losses.reduce((sum, t) => sum + Math.abs(t.pnl), 0) || 1),
    averagePositionTime: "45m",
    totalPositionTime: 45 * 60 * trades.length,
    winningStreak: 3,
    cumulativeFees: trades.length * 4,
    breakEvenThreshold: 0,
    totalPayouts: 0,
    nbPayouts: 0,
    totalPnL: totalPnl
  }

  return {
    trades,
    total: trades.length,
    statistics: stats,
    calendarData: {},
    widgets: {}
  }
}
